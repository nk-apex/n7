// commands/automation/autoreactstatus.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import supabase from '../../lib/supabase.js';
import { getPhoneFromLid } from '../../lib/sudo-store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG_FILE = './data/autoReactConfig.json';

const alreadyReactedStatuses = new Set();
const statusCheckInterval = 60 * 60 * 1000;

function initConfig() {
    const configDir = path.dirname(CONFIG_FILE);
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }
    if (!fs.existsSync(CONFIG_FILE)) {
        const defaultConfig = {
            enabled: true,
            viewMode: 'view+react',      // ← NEW: 'view+react' | 'react-only'
            mode: 'fixed',
            fixedEmoji: '🐺',
            reactions: ["🐺", "❤️", "👍", "🔥", "🎉", "😂", "😮", "👏", "🎯", "💯", "🌟", "✨", "⚡", "💥", "🫶"],
            logs: [],
            totalReacted: 0,
            lastReacted: null,
            consecutiveReactions: 0,
            lastSender: null,
            lastReactionTime: 0,
            reactedStatuses: [],
            settings: {
                rateLimitDelay: 2000,
                reactToAll: true,
                ignoreConsecutiveLimit: true,
                noHourlyLimit: true
            }
        };
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
    }
    setInterval(() => { alreadyReactedStatuses.clear(); }, statusCheckInterval);
}

initConfig();

(async () => {
    try {
        if (supabase.isAvailable()) {
            const dbData = await supabase.getConfig('autoreact_config');
            if (dbData && dbData.enabled !== undefined) {
                fs.writeFileSync(CONFIG_FILE, JSON.stringify(dbData, null, 2));
            }
        }
    } catch {}
})();

// ── Resolve @lid → @s.whatsapp.net with retry ─────────────────────────────────
// contacts.upsert (which populates the LID map) fires ~1-3s AFTER messages.upsert,
// so we poll until the mapping is available before giving up.
function tryResolveLid(sock, lidJid) {
    if (!lidJid?.includes('@lid')) return lidJid;
    const lidNum  = lidJid.split('@')[0].split(':')[0];
    const lidFull = lidJid.split('@')[0];
    const gCache  = globalThis.lidPhoneCache;
    if (gCache instanceof Map) {
        const hit = gCache.get(lidNum) || gCache.get(lidFull);
        if (hit) return `${hit}@s.whatsapp.net`;
    }
    const stored = getPhoneFromLid(lidNum);
    if (stored) return `${stored}@s.whatsapp.net`;
    try {
        for (const fmt of [lidJid, `${lidNum}:0@lid`, `${lidNum}@lid`]) {
            const pn = sock.signalRepository?.lidMapping?.getPNForLID?.(fmt);
            if (pn) {
                const num = String(pn).split('@')[0].replace(/\D/g, '');
                if (num.length >= 7) return `${num}@s.whatsapp.net`;
            }
        }
    } catch (_) {}
    return null;
}

async function resolveLidWithRetry(sock, lidJid, maxWaitMs = 3000, intervalMs = 300) {
    for (let elapsed = 0; elapsed < maxWaitMs; elapsed += intervalMs) {
        const resolved = tryResolveLid(sock, lidJid);
        if (resolved) return resolved;
        await new Promise(r => setTimeout(r, intervalMs));
    }
    return null;
}

class AutoReactManager {
    constructor() {
        this.config = this.loadConfig();
        this.reactionQueue = [];
        this.lastReactionTime = this.config.lastReactionTime || 0;
        this.reactedStatuses = new Set(this.config.reactedStatuses || []);
        this.cleanupOldReactedStatuses();
    }

    loadConfig() {
        try {
            const data = fs.readFileSync(CONFIG_FILE, 'utf8');
            const config = JSON.parse(data);
            config.reactedStatuses = config.reactedStatuses || [];
            config.lastReactionTime = config.lastReactionTime || 0;
            config.viewMode = config.viewMode || 'view+react'; // backwards compat
            return config;
        } catch (error) {
            console.error('Error loading auto react config:', error);
            return {
                enabled: true,
                viewMode: 'view+react',
                mode: 'fixed',
                fixedEmoji: '🐺',
                reactions: ["🐺", "❤️", "👍", "🔥", "🎉", "😂", "😮", "👏", "🎯", "💯", "🌟", "✨", "⚡", "💥", "🫶"],
                logs: [],
                totalReacted: 0,
                lastReacted: null,
                consecutiveReactions: 0,
                lastSender: null,
                lastReactionTime: 0,
                reactedStatuses: [],
                settings: {
                    rateLimitDelay: 2000,
                    reactToAll: true,
                    ignoreConsecutiveLimit: true,
                    noHourlyLimit: true
                }
            };
        }
    }

    saveConfig() {
        try {
            this.config.reactedStatuses = Array.from(this.reactedStatuses);
            this.config.lastReactionTime = this.lastReactionTime;
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2));
            supabase.setConfig('autoreact_config', this.config).catch(() => {});
        } catch (error) {
            console.error('Error saving auto react config:', error);
        }
    }

    cleanupOldReactedStatuses() {
        const now = Date.now();
        let cleaned = false;
        for (const statusKey of Array.from(this.reactedStatuses)) {
            try {
                const parts = statusKey.split('|');
                if (parts.length >= 3 && now - parseInt(parts[2]) > 24 * 60 * 60 * 1000) {
                    this.reactedStatuses.delete(statusKey);
                    cleaned = true;
                }
            } catch {
                this.reactedStatuses.delete(statusKey);
                cleaned = true;
            }
        }
        if (cleaned) this.saveConfig();
    }

    get enabled()      { return this.config.enabled; }
    get viewMode()     { return this.config.viewMode; }
    get mode()         { return this.config.mode; }
    get fixedEmoji()   { return this.config.fixedEmoji; }
    get reactions()    { return this.config.reactions; }
    get logs()         { return this.config.logs; }
    get totalReacted() { return this.config.totalReacted; }

    generateStatusKey(statusKey) {
        const sender = statusKey.participant || statusKey.remoteJid;
        return `${sender}|${statusKey.id}`;
    }

    generateStatusKeyWithTimestamp(statusKey) {
        const sender = statusKey.participant || statusKey.remoteJid;
        return `${sender}|${statusKey.id}|${Date.now()}`;
    }

    hasReactedToStatus(statusKey) {
        const lookupKey = this.generateStatusKey(statusKey);
        for (const key of this.reactedStatuses) {
            if (key.startsWith(lookupKey)) return true;
        }
        return false;
    }

    markStatusAsReacted(statusKey) {
        const storageKey = this.generateStatusKeyWithTimestamp(statusKey);
        this.reactedStatuses.add(storageKey);
        if (this.reactedStatuses.size > 500) {
            const arr = Array.from(this.reactedStatuses);
            this.reactedStatuses = new Set(arr.slice(-250));
        }
        this.saveConfig();
    }

    toggle(forceOff = false) {
        if (forceOff) { this.config.enabled = false; this.saveConfig(); return false; }
        if (this.config.enabled) return true;
        this.config.enabled = true;
        this.saveConfig();
        return true;
    }

    setViewMode(mode) {
        if (mode === 'view+react' || mode === 'react-only') {
            this.config.viewMode = mode;
            this.saveConfig();
            return true;
        }
        return false;
    }

    setMode(newMode) {
        if (newMode === 'random' || newMode === 'fixed') {
            this.config.mode = newMode;
            this.saveConfig();
            return true;
        }
        return false;
    }

    setFixedEmoji(emoji) {
        if (emoji.length <= 2) { this.config.fixedEmoji = emoji; this.saveConfig(); return true; }
        return false;
    }

    addReaction(emoji) {
        if (!this.config.reactions.includes(emoji) && emoji.length <= 2) {
            this.config.reactions.push(emoji); this.saveConfig(); return true;
        }
        return false;
    }

    removeReaction(emoji) {
        const index = this.config.reactions.indexOf(emoji);
        if (index !== -1) { this.config.reactions.splice(index, 1); this.saveConfig(); return true; }
        return false;
    }

    resetReactions() {
        this.config.reactions = ["🐺", "❤️", "👍", "🔥", "🎉", "😂", "😮", "👏", "🎯", "💯", "🌟", "✨", "⚡", "💥", "🫶"];
        this.saveConfig();
    }

    addLog(sender, reaction, statusId, type = 'status') {
        const logEntry = { sender, reaction, statusId, type, timestamp: Date.now() };
        this.config.logs.push(logEntry);
        this.config.totalReacted++;
        this.config.lastReacted = logEntry;
        if (this.config.lastSender === sender) {
            this.config.consecutiveReactions++;
        } else {
            this.config.consecutiveReactions = 1;
            this.config.lastSender = sender;
        }
        if (this.config.logs.length > 100) this.config.logs.shift();
        this.saveConfig();
    }

    clearLogs() {
        this.config.logs = [];
        this.config.totalReacted = 0;
        this.config.lastReacted = null;
        this.config.consecutiveReactions = 0;
        this.config.lastSender = null;
        this.reactedStatuses.clear();
        this.saveConfig();
    }

    getStats() {
        return {
            enabled: this.config.enabled,
            viewMode: this.config.viewMode,
            mode: this.config.mode,
            fixedEmoji: this.config.fixedEmoji,
            reactions: [...this.config.reactions],
            logsCount: this.config.logs.length,
            totalReacted: this.config.totalReacted,
            lastReacted: this.config.lastReacted,
            consecutiveReactions: this.config.consecutiveReactions,
            reactedStatusesCount: this.reactedStatuses.size,
            settings: { ...this.config.settings }
        };
    }

    shouldReact(sender, statusKey) {
        if (!this.config.enabled) return false;
        if (this.hasReactedToStatus(statusKey)) return false;
        if (Date.now() - this.lastReactionTime < this.config.settings.rateLimitDelay) return false;
        if (!this.config.settings.ignoreConsecutiveLimit &&
            this.config.lastSender === sender &&
            this.config.consecutiveReactions >= 3) return false;
        return true;
    }

    getReaction() {
        if (this.config.mode === 'fixed') return this.config.fixedEmoji;
        if (this.config.reactions.length === 0) return '🐺';
        return this.config.reactions[Math.floor(Math.random() * this.config.reactions.length)];
    }

    async reactToStatus(sock, statusKey) {
        try {
            const rawSender  = statusKey.participant || statusKey.remoteJid;
            const cleanSender = rawSender.split('@')[0].split(':')[0];
            const statusId   = statusKey.id;
            const isLid      = rawSender.includes('@lid');

            if (!this.shouldReact(rawSender, statusKey)) return false;

            // ── STEP 1: View first (only in view+react mode) ─────────────────
            if (this.config.viewMode === 'view+react') {
                try {
                    // Resolve @lid → @s.whatsapp.net (same fix as autoviewstatus)
                    // Without this, readMessages silently accepts @lid but does nothing
                    let resolvedJid = rawSender;
                    if (isLid) {
                        const quick = tryResolveLid(sock, rawSender);
                        if (quick) { resolvedJid = quick; }
                        else { const resolved = await resolveLidWithRetry(sock, rawSender, 3000, 300);
                        if (resolved) resolvedJid = resolved; }
                        if (resolved) resolvedJid = resolved;
                    }
                    await sock.readMessages([{
                        remoteJid:   'status@broadcast',
                        id:          statusKey.id,
                        participant: resolvedJid,
                        fromMe:      false
                    }]);
                } catch (_) {
                    // Non-fatal — still proceed to react
                }
            }

            // ── STEP 2: React ────────────────────────────────────────────────
            const reactionEmoji = this.getReaction();

            await sock.relayMessage(
                'status@broadcast',
                {
                    reactionMessage: {
                        key: {
                            remoteJid:   'status@broadcast',
                            id:          statusKey.id,
                            participant: statusKey.participant || statusKey.remoteJid,
                            fromMe:      false
                        },
                        text: reactionEmoji
                    }
                },
                {
                    messageId:     statusKey.id,
                    statusJidList: [statusKey.remoteJid, statusKey.participant || statusKey.remoteJid]
                }
            );

            this.lastReactionTime = Date.now();
            this.markStatusAsReacted(statusKey);
            this.addLog(cleanSender, reactionEmoji, statusId, 'status');

            return true;

        } catch (error) {
            if (error.message?.includes('rate-overlimit') || error.message?.includes('rate limit')) {
                this.config.settings.rateLimitDelay = Math.min(this.config.settings.rateLimitDelay * 2, 10000);
                this.saveConfig();
            }
            if (error.message?.includes('not found') || error.message?.includes('message deleted')) {
                this.markStatusAsReacted(statusKey);
            }
            return false;
        }
    }
}

const autoReactManager = new AutoReactManager();

export async function handleAutoReact(sock, statusKey) {
    return await autoReactManager.reactToStatus(sock, statusKey);
}

export { autoReactManager };

export default {
    name: "autoreactstatus",
    alias: ["reactstatus", "statusreact", "sr", "reacts"],
    desc: "Automatically react to WhatsApp statuses 🐺",
    category: "Status",
    ownerOnly: false,

    async execute(sock, m, args, prefix, extra) {
        try {
            const isOwner = extra?.isOwner?.() || false;

            if (args.length === 0) {
                const stats = autoReactManager.getStats();
                const vmLabel = stats.viewMode === 'view+react' ? '👁️ + 🐺  view then react' : '🐺  react only (no view)';
                let statusText = `╭─⌈ 🐺 *AUTOREACTSTATUS* ⌋\n│\n`;
                statusText += `│ Status    : ${stats.enabled ? '✅ ACTIVE' : '❌ INACTIVE'}\n`;
                statusText += `│ View Mode : ${vmLabel}\n`;
                statusText += `│ Emoji Mode: ${stats.mode === 'fixed' ? `Fixed (${stats.fixedEmoji})` : 'Random (1 emoji per status)'}\n│\n`;
                statusText += `├─⊷ *${prefix}sr on / off*\n│  └⊷ Enable or disable\n`;
                statusText += `├─⊷ *${prefix}sr view+react*\n│  └⊷ View status then react\n`;
                statusText += `├─⊷ *${prefix}sr react-only*\n│  └⊷ React without viewing\n`;
                statusText += `├─⊷ *${prefix}sr random*\n│  └⊷ Random emoji mode\n`;
                statusText += `├─⊷ *${prefix}sr emoji <emoji>*\n│  └⊷ Set fixed emoji\n`;
                statusText += `├─⊷ *${prefix}sr stats*\n│  └⊷ View statistics\n`;
                statusText += `╰───`;
                await sock.sendMessage(m.key.remoteJid, { text: statusText }, { quoted: m });
                return;
            }

            const action = args[0].toLowerCase();

            switch (action) {
                case 'on':
                case 'enable':
                case 'start': {
                    if (!isOwner) { await sock.sendMessage(m.key.remoteJid, { text: "❌ Owner only command!" }, { quoted: m }); return; }
                    const currentlyEnabled = autoReactManager.enabled;
                    autoReactManager.toggle(false);
                    if (currentlyEnabled) {
                        await sock.sendMessage(m.key.remoteJid, {
                            text: `✅ *AUTOREACTSTATUS IS ALREADY ACTIVE*\n\n🐺 Auto reactions already enabled!\n\n• View Mode: ${autoReactManager.viewMode}\n• Emoji Mode: ${autoReactManager.mode}\n• Emoji: ${autoReactManager.mode === 'fixed' ? autoReactManager.fixedEmoji : 'Random'}\n• Total reacted: ${autoReactManager.totalReacted}\n\nUse \`${prefix}sr off\` to disable.`
                        }, { quoted: m });
                    } else {
                        await sock.sendMessage(m.key.remoteJid, {
                            text: `✅ *AUTOREACTSTATUS ENABLED*\n\n🐺 Will now ${autoReactManager.viewMode === 'view+react' ? 'view then react to' : 'react to (without viewing)'} ALL statuses!\n\nView Mode: ${autoReactManager.viewMode}\nEmoji: ${autoReactManager.fixedEmoji}\nMode: ${autoReactManager.mode}`
                        }, { quoted: m });
                    }
                    break;
                }

                case 'off':
                case 'disable':
                case 'stop': {
                    if (!isOwner) { await sock.sendMessage(m.key.remoteJid, { text: "❌ Owner only command!" }, { quoted: m }); return; }
                    const wasEnabled = autoReactManager.enabled;
                    autoReactManager.toggle(true);
                    await sock.sendMessage(m.key.remoteJid, {
                        text: wasEnabled
                            ? `❌ *AUTOREACTSTATUS DISABLED*\n\nUse \`${prefix}sr on\` to enable again.`
                            : `⚠️ *AUTOREACTSTATUS ALREADY DISABLED*\n\nUse \`${prefix}sr on\` to enable.`
                    }, { quoted: m });
                    break;
                }

                // ── View mode commands ────────────────────────────────────────
                case 'view+react':
                case 'viewreact': {
                    if (!isOwner) { await sock.sendMessage(m.key.remoteJid, { text: "❌ Owner only command!" }, { quoted: m }); return; }
                    autoReactManager.setViewMode('view+react');
                    await sock.sendMessage(m.key.remoteJid, {
                        text: `👁️ + 🐺 *VIEW+REACT MODE*\n\nWill now view the status first, then react.\nSender will see you in their viewers list.`
                    }, { quoted: m });
                    break;
                }

                case 'react-only':
                case 'reactonly': {
                    if (!isOwner) { await sock.sendMessage(m.key.remoteJid, { text: "❌ Owner only command!" }, { quoted: m }); return; }
                    autoReactManager.setViewMode('react-only');
                    await sock.sendMessage(m.key.remoteJid, {
                        text: `🐺 *REACT-ONLY MODE*\n\nWill react without marking the status as viewed.\nSender will NOT see you in their viewers list.`
                    }, { quoted: m });
                    break;
                }

                case 'random':
                    autoReactManager.setMode('random');
                    await sock.sendMessage(m.key.remoteJid, { text: `🎲 *Mode set to RANDOM*\n\nWill react with ONE random emoji per status!\n\nEmoji list: ${autoReactManager.reactions.join(' ')}` }, { quoted: m });
                    break;

                case 'emoji': {
                    if (args.length < 2) {
                        await sock.sendMessage(m.key.remoteJid, { text: `╭─⌈ 🐺 *AUTOREACTSTATUS EMOJI* ⌋\n│\n│ Current: ${autoReactManager.fixedEmoji}\n│\n├─⊷ *${prefix}sr emoji 🐺*\n│  └⊷ Set fixed emoji\n╰───` }, { quoted: m });
                        return;
                    }
                    const emoji = args[1];
                    if (emoji.length > 2) { await sock.sendMessage(m.key.remoteJid, { text: '❌ Please use a single emoji (max 2 characters).' }, { quoted: m }); return; }
                    if (autoReactManager.setFixedEmoji(emoji)) {
                        autoReactManager.setMode('fixed');
                        await sock.sendMessage(m.key.remoteJid, { text: `✅ *Fixed Emoji Set*\n\nReactions will now use: ${emoji}\n\nMode automatically switched to FIXED.` }, { quoted: m });
                    } else {
                        await sock.sendMessage(m.key.remoteJid, { text: '❌ Failed to set emoji.' }, { quoted: m });
                    }
                    break;
                }

                case 'stats':
                case 'statistics':
                case 'info': {
                    const s = autoReactManager.getStats();
                    const vmLabel = s.viewMode === 'view+react' ? '👁️ + 🐺 View then React' : '🐺 React only (no view)';
                    let statsText = `📊 *AUTOREACTSTATUS STATISTICS*\n\n`;
                    statsText += `🟢 Status     : ${s.enabled ? '**ACTIVE** ✅' : '**INACTIVE** ❌'}\n`;
                    statsText += `👁️ View Mode  : ${vmLabel}\n`;
                    statsText += `🎭 Emoji Mode : ${s.mode === 'fixed' ? `FIXED (${s.fixedEmoji})` : 'RANDOM (1 emoji/status)'}\n`;
                    statsText += `🐺 Total Reacted: **${s.totalReacted}**\n`;
                    statsText += `📝 Tracked Statuses: ${s.reactedStatusesCount}\n`;
                    statsText += `🔄 Consecutive: ${s.consecutiveReactions}\n\n`;
                    if (s.lastReacted) {
                        const ago = Math.floor((Date.now() - s.lastReacted.timestamp) / 60000);
                        statsText += `🕒 *Last Reaction:*\n• To: ${s.lastReacted.sender}\n• With: ${s.lastReacted.reaction}\n• ${ago < 1 ? 'Just now' : `${ago} minutes ago`}\n`;
                    }
                    statsText += `\n⚙️ *Settings:*\n• Rate Limit: ${s.settings.rateLimitDelay}ms\n• React to All: ${s.settings.reactToAll ? '✅' : '❌'}\n• Ignore Consecutive: ${s.settings.ignoreConsecutiveLimit ? '✅' : '❌'}\n• Hourly Limit: ❌ DISABLED\n`;
                    await sock.sendMessage(m.key.remoteJid, { text: statsText }, { quoted: m });
                    break;
                }

                case 'list':
                case 'emojis': {
                    const emojiList = autoReactManager.reactions;
                    await sock.sendMessage(m.key.remoteJid, { text: `😄 *Random Emoji List (${emojiList.length}):*\n\n${emojiList.join(' ')}\n\nCurrent mode: ${autoReactManager.mode}\nFixed emoji: ${autoReactManager.fixedEmoji}\n\nNOTE: Random mode uses ONE random emoji per status.` }, { quoted: m });
                    break;
                }

                case 'add': {
                    if (!isOwner) { await sock.sendMessage(m.key.remoteJid, { text: "❌ Owner only command!" }, { quoted: m }); return; }
                    if (args.length < 2) { await sock.sendMessage(m.key.remoteJid, { text: `Usage: \`${prefix}sr add ❤️\`` }, { quoted: m }); return; }
                    const addEmoji = args[1];
                    if (addEmoji.length > 2) { await sock.sendMessage(m.key.remoteJid, { text: '❌ Please use a single emoji (max 2 characters).' }, { quoted: m }); return; }
                    if (autoReactManager.addReaction(addEmoji)) {
                        await sock.sendMessage(m.key.remoteJid, { text: `✅ ${addEmoji} added.\n\nCurrent list (${autoReactManager.reactions.length}):\n${autoReactManager.reactions.join(' ')}` }, { quoted: m });
                    } else {
                        await sock.sendMessage(m.key.remoteJid, { text: `⚠️ ${addEmoji} already in list or invalid.\n\nCurrent list: ${autoReactManager.reactions.join(' ')}` }, { quoted: m });
                    }
                    break;
                }

                case 'remove': {
                    if (!isOwner) { await sock.sendMessage(m.key.remoteJid, { text: "❌ Owner only command!" }, { quoted: m }); return; }
                    if (args.length < 2) { await sock.sendMessage(m.key.remoteJid, { text: `Usage: \`${prefix}sr remove 🔥\`` }, { quoted: m }); return; }
                    const removeEmoji = args[1];
                    if (autoReactManager.removeReaction(removeEmoji)) {
                        await sock.sendMessage(m.key.remoteJid, { text: `✅ ${removeEmoji} removed.\n\nCurrent list (${autoReactManager.reactions.length}):\n${autoReactManager.reactions.join(' ')}` }, { quoted: m });
                    } else {
                        await sock.sendMessage(m.key.remoteJid, { text: `❌ ${removeEmoji} not found.\n\nCurrent list: ${autoReactManager.reactions.join(' ')}` }, { quoted: m });
                    }
                    break;
                }

                case 'reset':
                case 'clear': {
                    if (!isOwner) { await sock.sendMessage(m.key.remoteJid, { text: "❌ Owner only command!" }, { quoted: m }); return; }
                    autoReactManager.clearLogs();
                    await sock.sendMessage(m.key.remoteJid, { text: `🔄 *All Data Reset*\n\n• Logs cleared\n• Reaction count reset to 0\n• Tracked statuses cleared\n\nFresh start! 🐺` }, { quoted: m });
                    break;
                }

                case 'clean':
                case 'cleanup': {
                    if (!isOwner) { await sock.sendMessage(m.key.remoteJid, { text: "❌ Owner only command!" }, { quoted: m }); return; }
                    autoReactManager.resetReactions();
                    await sock.sendMessage(m.key.remoteJid, { text: `🔄 *Emoji List Reset*\n\nReset to defaults:\n${autoReactManager.reactions.join(' ')}` }, { quoted: m });
                    break;
                }

                default:
                    await sock.sendMessage(m.key.remoteJid, {
                        text: `╭─⌈ ❓ *AUTOREACTSTATUS* ⌋\n│\n├─⊷ *${prefix}sr on / off*\n├─⊷ *${prefix}sr view+react*\n├─⊷ *${prefix}sr react-only*\n├─⊷ *${prefix}sr random*\n├─⊷ *${prefix}sr emoji 🐺*\n├─⊷ *${prefix}sr stats*\n├─⊷ *${prefix}sr list*\n╰───`
                    }, { quoted: m });
            }

        } catch (error) {
            console.error('AutoReactStatus command error:', error);
            await sock.sendMessage(m.key.remoteJid, { text: `❌ Command failed: ${error.message}` }, { quoted: m });
        }
    }
};
