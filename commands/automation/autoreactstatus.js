// commands/automation/autoreactstatus.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import supabase from '../../lib/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG_FILE = './data/autoReactConfig.json';

function initConfig() {
    const configDir = path.dirname(CONFIG_FILE);
    if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
    if (!fs.existsSync(CONFIG_FILE)) {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify({
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
        }, null, 2));
    }
    setInterval(() => {}, 60 * 60 * 1000); // keep alive
}

initConfig();

(async () => {
    try {
        if (supabase.isAvailable()) {
            const dbData = await supabase.getConfig('autoreact_config');
            if (dbData?.enabled !== undefined)
                fs.writeFileSync(CONFIG_FILE, JSON.stringify(dbData, null, 2));
        }
    } catch {}
})();

class AutoReactManager {
    constructor() {
        this.config = this.loadConfig();
        this.lastReactionTime = this.config.lastReactionTime || 0;
        this.reactedStatuses = new Set(this.config.reactedStatuses || []);
        this.cleanupOldReactedStatuses();
    }

    loadConfig() {
        try {
            const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
            config.reactedStatuses   = config.reactedStatuses || [];
            config.lastReactionTime  = config.lastReactionTime || 0;
            config.viewMode          = config.viewMode || 'view+react';
            return config;
        } catch {
            return {
                enabled: true, viewMode: 'view+react', mode: 'fixed', fixedEmoji: '🐺',
                reactions: ["🐺", "❤️", "👍", "🔥", "🎉", "😂", "😮", "👏", "🎯", "💯", "🌟", "✨", "⚡", "💥", "🫶"],
                logs: [], totalReacted: 0, lastReacted: null, consecutiveReactions: 0,
                lastSender: null, lastReactionTime: 0, reactedStatuses: [],
                settings: { rateLimitDelay: 2000, reactToAll: true, ignoreConsecutiveLimit: true, noHourlyLimit: true }
            };
        }
    }

    saveConfig() {
        try {
            this.config.reactedStatuses = Array.from(this.reactedStatuses);
            this.config.lastReactionTime = this.lastReactionTime;
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2));
            supabase.setConfig('autoreact_config', this.config).catch(() => {});
        } catch {}
    }

    cleanupOldReactedStatuses() {
        const now = Date.now();
        let cleaned = false;
        for (const key of Array.from(this.reactedStatuses)) {
            try {
                const parts = key.split('|');
                if (parts.length >= 3 && now - parseInt(parts[2]) > 24 * 60 * 60 * 1000) {
                    this.reactedStatuses.delete(key); cleaned = true;
                }
            } catch { this.reactedStatuses.delete(key); cleaned = true; }
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

    hasReacted(statusKey) {
        const base = `${statusKey.participant || statusKey.remoteJid}|${statusKey.id}`;
        for (const k of this.reactedStatuses) { if (k.startsWith(base)) return true; }
        return false;
    }

    markReacted(statusKey) {
        const key = `${statusKey.participant || statusKey.remoteJid}|${statusKey.id}|${Date.now()}`;
        this.reactedStatuses.add(key);
        if (this.reactedStatuses.size > 500) {
            const arr = Array.from(this.reactedStatuses);
            this.reactedStatuses = new Set(arr.slice(-250));
        }
        this.saveConfig();
    }

    toggle(forceOff = false) {
        this.config.enabled = !forceOff;
        this.saveConfig(); return this.config.enabled;
    }

    setViewMode(mode) {
        if (mode === 'view+react' || mode === 'react-only') {
            this.config.viewMode = mode; this.saveConfig(); return true;
        }
        return false;
    }

    setMode(mode) {
        if (mode === 'random' || mode === 'fixed') {
            this.config.mode = mode; this.saveConfig(); return true;
        }
        return false;
    }

    setFixedEmoji(emoji) {
        if ([...emoji].length <= 2) { this.config.fixedEmoji = emoji; this.saveConfig(); return true; }
        return false;
    }

    addReaction(emoji)    {
        if (!this.config.reactions.includes(emoji) && [...emoji].length <= 2) {
            this.config.reactions.push(emoji); this.saveConfig(); return true;
        }
        return false;
    }

    removeReaction(emoji) {
        const i = this.config.reactions.indexOf(emoji);
        if (i !== -1) { this.config.reactions.splice(i, 1); this.saveConfig(); return true; }
        return false;
    }

    resetReactions() {
        this.config.reactions = ["🐺", "❤️", "👍", "🔥", "🎉", "😂", "😮", "👏", "🎯", "💯", "🌟", "✨", "⚡", "💥", "🫶"];
        this.saveConfig();
    }

    addLog(sender, reaction, statusId) {
        const entry = { sender, reaction, statusId, timestamp: Date.now() };
        this.config.logs.push(entry);
        this.config.totalReacted++;
        this.config.lastReacted = entry;
        this.config.consecutiveReactions = this.config.lastSender === sender
            ? this.config.consecutiveReactions + 1 : 1;
        this.config.lastSender = sender;
        if (this.config.logs.length > 100) this.config.logs.shift();
        this.saveConfig();
    }

    clearLogs() {
        Object.assign(this.config, { logs: [], totalReacted: 0, lastReacted: null,
            consecutiveReactions: 0, lastSender: null });
        this.reactedStatuses.clear();
        this.saveConfig();
    }

    getStats() {
        return { enabled: this.config.enabled, viewMode: this.config.viewMode,
            mode: this.config.mode, fixedEmoji: this.config.fixedEmoji,
            reactions: [...this.config.reactions], totalReacted: this.config.totalReacted,
            lastReacted: this.config.lastReacted, consecutiveReactions: this.config.consecutiveReactions,
            reactedStatusesCount: this.reactedStatuses.size, settings: { ...this.config.settings } };
    }

    getReaction() {
        if (this.config.mode === 'fixed') return this.config.fixedEmoji;
        if (!this.config.reactions.length) return '🐺';
        return this.config.reactions[Math.floor(Math.random() * this.config.reactions.length)];
    }

    shouldReact(statusKey) {
        if (!this.config.enabled) return false;
        if (this.hasReacted(statusKey)) return false;
        if (Date.now() - this.lastReactionTime < this.config.settings.rateLimitDelay) return false;
        return true;
    }

    // ── Main entry point ─────────────────────────────────────────────────────
    // index.js calls: handleAutoReact(sock, msg.key)
    // statusKey is the RAW msg.key from messages.upsert — never reconstructed.
    async reactToStatus(sock, statusKey) {
        try {
            const sender      = statusKey.participant || statusKey.remoteJid;
            const displayId   = sender.split('@')[0].split(':')[0];

            if (!this.shouldReact(statusKey)) return false;

            // Rate limit
            const wait = this.config.settings.rateLimitDelay - (Date.now() - this.lastReactionTime);
            if (wait > 0) await new Promise(r => setTimeout(r, wait));

            // ── STEP 1: View first (view+react mode) ─────────────────────────
            // Pass statusKey EXACTLY as received — no LID resolution needed.
            // WhatsApp server knows who the @lid is.
            if (this.config.viewMode === 'view+react') {
                try {
                    await sock.readMessages([statusKey]);
                } catch (_) {
                    // non-fatal, continue to react
                }
            }

            // ── STEP 2: React ─────────────────────────────────────────────────
            // Use the raw statusKey.participant for the reaction key.
            // relayMessage to status@broadcast with the original participant JID.
            const emoji = this.getReaction();

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
                        text: emoji
                    }
                },
                {
                    messageId:     statusKey.id,
                    statusJidList: [statusKey.remoteJid, statusKey.participant || statusKey.remoteJid]
                }
            );

            this.lastReactionTime = Date.now();
            this.markReacted(statusKey);
            this.addLog(displayId, emoji, statusKey.id);

            return true;

        } catch (error) {
            if (error.message?.includes('rate-overlimit') || error.message?.includes('rate limit')) {
                this.config.settings.rateLimitDelay = Math.min(this.config.settings.rateLimitDelay * 2, 10000);
                this.saveConfig();
            }
            if (error.message?.includes('not found') || error.message?.includes('message deleted')) {
                this.markReacted(statusKey);
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
                const s = autoReactManager.getStats();
                const vmLabel = s.viewMode === 'view+react' ? '👁️ + 🐺 view then react' : '🐺 react only';
                let text = `╭─⌈ 🐺 *AUTOREACTSTATUS* ⌋\n│\n`;
                text += `│ Status    : ${s.enabled ? '✅ ACTIVE' : '❌ INACTIVE'}\n`;
                text += `│ View Mode : ${vmLabel}\n`;
                text += `│ Emoji Mode: ${s.mode === 'fixed' ? `Fixed (${s.fixedEmoji})` : 'Random'}\n│\n`;
                text += `├─⊷ *${prefix}sr on / off*\n│  └⊷ Enable or disable\n`;
                text += `├─⊷ *${prefix}sr view+react*\n│  └⊷ View then react\n`;
                text += `├─⊷ *${prefix}sr react-only*\n│  └⊷ React without viewing\n`;
                text += `├─⊷ *${prefix}sr random*\n│  └⊷ Random emoji mode\n`;
                text += `├─⊷ *${prefix}sr emoji <emoji>*\n│  └⊷ Set fixed emoji\n`;
                text += `├─⊷ *${prefix}sr stats*\n│  └⊷ Statistics\n`;
                text += `╰───`;
                await sock.sendMessage(m.key.remoteJid, { text }, { quoted: m });
                return;
            }

            const action = args[0].toLowerCase();

            switch (action) {
                case 'on': case 'enable': case 'start': {
                    if (!isOwner) { await sock.sendMessage(m.key.remoteJid, { text: "❌ Owner only!" }, { quoted: m }); return; }
                    autoReactManager.toggle(false);
                    await sock.sendMessage(m.key.remoteJid, {
                        text: `✅ *AUTOREACTSTATUS ENABLED*\n\n🐺 Will now ${autoReactManager.viewMode === 'view+react' ? 'view then react to' : 'react to'} ALL statuses!\n\nView Mode: ${autoReactManager.viewMode}\nEmoji: ${autoReactManager.fixedEmoji}\nMode: ${autoReactManager.mode}`
                    }, { quoted: m });
                    break;
                }

                case 'off': case 'disable': case 'stop': {
                    if (!isOwner) { await sock.sendMessage(m.key.remoteJid, { text: "❌ Owner only!" }, { quoted: m }); return; }
                    autoReactManager.toggle(true);
                    await sock.sendMessage(m.key.remoteJid, { text: `❌ *AUTOREACTSTATUS DISABLED*` }, { quoted: m });
                    break;
                }

                case 'view+react': case 'viewreact': {
                    if (!isOwner) { await sock.sendMessage(m.key.remoteJid, { text: "❌ Owner only!" }, { quoted: m }); return; }
                    autoReactManager.setViewMode('view+react');
                    await sock.sendMessage(m.key.remoteJid, { text: `👁️ + 🐺 *VIEW+REACT MODE*\n\nWill view the status first, then react.\nSender sees you in their viewers list.` }, { quoted: m });
                    break;
                }

                case 'react-only': case 'reactonly': {
                    if (!isOwner) { await sock.sendMessage(m.key.remoteJid, { text: "❌ Owner only!" }, { quoted: m }); return; }
                    autoReactManager.setViewMode('react-only');
                    await sock.sendMessage(m.key.remoteJid, { text: `🐺 *REACT-ONLY MODE*\n\nWill react without marking as viewed.\nSender will NOT see you in their viewers list.` }, { quoted: m });
                    break;
                }

                case 'random': {
                    autoReactManager.setMode('random');
                    await sock.sendMessage(m.key.remoteJid, { text: `🎲 *RANDOM MODE*\n\nOne random emoji per status!\n\n${autoReactManager.reactions.join(' ')}` }, { quoted: m });
                    break;
                }

                case 'fixed': {
                    autoReactManager.setMode('fixed');
                    await sock.sendMessage(m.key.remoteJid, { text: `📌 *FIXED MODE*\n\nWill always react with: ${autoReactManager.fixedEmoji}` }, { quoted: m });
                    break;
                }

                case 'emoji': {
                    if (!args[1]) { await sock.sendMessage(m.key.remoteJid, { text: `Current emoji: ${autoReactManager.fixedEmoji}\n\nUsage: *${prefix}sr emoji 🐺*` }, { quoted: m }); return; }
                    const emoji = args[1];
                    if (autoReactManager.setFixedEmoji(emoji)) {
                        autoReactManager.setMode('fixed');
                        await sock.sendMessage(m.key.remoteJid, { text: `✅ Emoji set to: ${emoji}` }, { quoted: m });
                    } else {
                        await sock.sendMessage(m.key.remoteJid, { text: '❌ Invalid emoji.' }, { quoted: m });
                    }
                    break;
                }

                case 'stats': case 'statistics': case 'info': {
                    const s = autoReactManager.getStats();
                    const vmLabel = s.viewMode === 'view+react' ? '👁️ + 🐺 View then React' : '🐺 React only';
                    let text = `📊 *AUTOREACTSTATUS STATS*\n\n`;
                    text += `🟢 Status      : ${s.enabled ? 'ACTIVE ✅' : 'INACTIVE ❌'}\n`;
                    text += `👁️ View Mode   : ${vmLabel}\n`;
                    text += `🎭 Emoji Mode  : ${s.mode === 'fixed' ? `FIXED (${s.fixedEmoji})` : 'RANDOM'}\n`;
                    text += `🐺 Total       : *${s.totalReacted}*\n`;
                    text += `📝 Tracked     : ${s.reactedStatusesCount}\n`;
                    text += `🔄 Consecutive : ${s.consecutiveReactions}\n`;
                    if (s.lastReacted) {
                        const ago = Math.floor((Date.now() - s.lastReacted.timestamp) / 60000);
                        text += `\n🕒 Last: ${s.lastReacted.sender} ${s.lastReacted.reaction} (${ago < 1 ? 'just now' : ago + ' min ago'})`;
                    }
                    await sock.sendMessage(m.key.remoteJid, { text }, { quoted: m });
                    break;
                }

                case 'list': case 'emojis': {
                    await sock.sendMessage(m.key.remoteJid, {
                        text: `😄 *Emoji List (${autoReactManager.reactions.length}):*\n\n${autoReactManager.reactions.join(' ')}\n\nMode: ${autoReactManager.mode} | Fixed: ${autoReactManager.fixedEmoji}`
                    }, { quoted: m });
                    break;
                }

                case 'add': {
                    if (!isOwner) { await sock.sendMessage(m.key.remoteJid, { text: "❌ Owner only!" }, { quoted: m }); return; }
                    if (!args[1]) { await sock.sendMessage(m.key.remoteJid, { text: `Usage: \`${prefix}sr add ❤️\`` }, { quoted: m }); return; }
                    if (autoReactManager.addReaction(args[1])) {
                        await sock.sendMessage(m.key.remoteJid, { text: `✅ ${args[1]} added.\n\n${autoReactManager.reactions.join(' ')}` }, { quoted: m });
                    } else {
                        await sock.sendMessage(m.key.remoteJid, { text: `⚠️ Already in list or invalid.` }, { quoted: m });
                    }
                    break;
                }

                case 'remove': {
                    if (!isOwner) { await sock.sendMessage(m.key.remoteJid, { text: "❌ Owner only!" }, { quoted: m }); return; }
                    if (!args[1]) { await sock.sendMessage(m.key.remoteJid, { text: `Usage: \`${prefix}sr remove 🔥\`` }, { quoted: m }); return; }
                    if (autoReactManager.removeReaction(args[1])) {
                        await sock.sendMessage(m.key.remoteJid, { text: `✅ ${args[1]} removed.\n\n${autoReactManager.reactions.join(' ')}` }, { quoted: m });
                    } else {
                        await sock.sendMessage(m.key.remoteJid, { text: `❌ Not found.` }, { quoted: m });
                    }
                    break;
                }

                case 'reset': case 'clear': {
                    if (!isOwner) { await sock.sendMessage(m.key.remoteJid, { text: "❌ Owner only!" }, { quoted: m }); return; }
                    autoReactManager.clearLogs();
                    await sock.sendMessage(m.key.remoteJid, { text: `🔄 All data reset. Fresh start! 🐺` }, { quoted: m });
                    break;
                }

                case 'clean': case 'cleanup': {
                    if (!isOwner) { await sock.sendMessage(m.key.remoteJid, { text: "❌ Owner only!" }, { quoted: m }); return; }
                    autoReactManager.resetReactions();
                    await sock.sendMessage(m.key.remoteJid, { text: `🔄 Emoji list reset to defaults:\n${autoReactManager.reactions.join(' ')}` }, { quoted: m });
                    break;
                }

                default:
                    await sock.sendMessage(m.key.remoteJid, {
                        text: `╭─⌈ ❓ *AUTOREACTSTATUS* ⌋\n│\n├─⊷ *${prefix}sr on / off*\n├─⊷ *${prefix}sr view+react*\n├─⊷ *${prefix}sr react-only*\n├─⊷ *${prefix}sr random / fixed*\n├─⊷ *${prefix}sr emoji 🐺*\n├─⊷ *${prefix}sr stats*\n├─⊷ *${prefix}sr list*\n╰───`
                    }, { quoted: m });
            }

        } catch (error) {
            console.error('AutoReactStatus error:', error);
            await sock.sendMessage(m.key.remoteJid, { text: `❌ ${error.message}` }, { quoted: m });
        }
    }
};
