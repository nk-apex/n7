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
            excludedContacts: [],
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
    setInterval(() => {}, 60 * 60 * 1000);
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
            config.reactedStatuses  = config.reactedStatuses || [];
            config.lastReactionTime = config.lastReactionTime || 0;
            config.viewMode         = config.viewMode || 'view+react';
            if (!Array.isArray(config.excludedContacts)) config.excludedContacts = [];
            return config;
        } catch {
            return {
                enabled: true, viewMode: 'view+react', mode: 'fixed', fixedEmoji: '🐺',
                reactions: ["🐺", "❤️", "👍", "🔥", "🎉", "😂", "😮", "👏", "🎯", "💯", "🌟", "✨", "⚡", "💥", "🫶"],
                excludedContacts: [],
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

    // ── Exclusion helpers ─────────────────────────────────────────────────────
    _normalizeNum(input) {
        return String(input).replace(/[^0-9]/g, '');
    }

    isExcluded(statusKey) {
        const list = this.config.excludedContacts;
        if (!list || list.length === 0) return false;
        const pNum  = (statusKey.participant || statusKey.remoteJid || '').split('@')[0].split(':')[0];
        const altNum = statusKey.remoteJidAlt ? statusKey.remoteJidAlt.split('@')[0] : null;
        return list.some(n => n === pNum || (altNum && n === altNum));
    }

    excludeContact(input) {
        const num = this._normalizeNum(input);
        if (!num) return false;
        if (!this.config.excludedContacts.includes(num)) {
            this.config.excludedContacts.push(num);
            this.saveConfig();
            return true;
        }
        return false;
    }

    includeContact(input) {
        const num = this._normalizeNum(input);
        const idx = this.config.excludedContacts.indexOf(num);
        if (idx !== -1) {
            this.config.excludedContacts.splice(idx, 1);
            this.saveConfig();
            return true;
        }
        return false;
    }

    // ── React helpers ─────────────────────────────────────────────────────────
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

    addReaction(emoji) {
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
        return {
            enabled: this.config.enabled, viewMode: this.config.viewMode,
            mode: this.config.mode, fixedEmoji: this.config.fixedEmoji,
            reactions: [...this.config.reactions], totalReacted: this.config.totalReacted,
            lastReacted: this.config.lastReacted, consecutiveReactions: this.config.consecutiveReactions,
            reactedStatusesCount: this.reactedStatuses.size,
            excludedCount: this.config.excludedContacts.length,
            settings: { ...this.config.settings }
        };
    }

    getReaction() {
        if (this.config.mode === 'fixed') return this.config.fixedEmoji;
        if (!this.config.reactions.length) return '🐺';
        return this.config.reactions[Math.floor(Math.random() * this.config.reactions.length)];
    }

    shouldReact(statusKey) {
        if (!this.config.enabled) return false;
        if (this.hasReacted(statusKey)) return false;
        if (this.isExcluded(statusKey)) return false;
        if (Date.now() - this.lastReactionTime < this.config.settings.rateLimitDelay) return false;
        return true;
    }

    async reactToStatus(sock, statusKey) {
        try {
            const sender    = statusKey.participant || statusKey.remoteJid;
            const displayId = sender.split('@')[0].split(':')[0];

            if (!this.shouldReact(statusKey)) return false;

            const wait = this.config.settings.rateLimitDelay - (Date.now() - this.lastReactionTime);
            if (wait > 0) await new Promise(r => setTimeout(r, wait));

            if (this.config.viewMode === 'view+react') {
                try {
                    const participantToUse = statusKey.remoteJidAlt || statusKey.participantPn || statusKey.participant || statusKey.remoteJid;
                    const readKey = {
                        remoteJid: statusKey.remoteJid,
                        id: statusKey.id,
                        fromMe: false,
                        participant: participantToUse
                    };
                    await sock.readMessages([readKey]);
                } catch (_) {}
            }

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
            const reply = (text) => sock.sendMessage(m.key.remoteJid, { text }, { quoted: m });

            if (args.length === 0) {
                const s = autoReactManager.getStats();
                const vmLabel = s.viewMode === 'view+react' ? '👁️ + 🐺 view then react' : '🐺 react only';
                let text = `╭─⌈ 🐺 *AUTOREACTSTATUS* ⌋\n│\n`;
                text += `│ Status    : ${s.enabled ? '✅ ACTIVE' : '❌ INACTIVE'}\n`;
                text += `│ View Mode : ${vmLabel}\n`;
                text += `│ Emoji Mode: ${s.mode === 'fixed' ? `Fixed (${s.fixedEmoji})` : 'Random'}\n`;
                text += `│ Excluded  : ${s.excludedCount} contact(s)\n│\n`;
                text += `├─⊷ *${prefix}sr on / off*\n│  └⊷ Enable or disable\n`;
                text += `├─⊷ *${prefix}sr exclude <number>*\n│  └⊷ Skip a contact\n`;
                text += `├─⊷ *${prefix}sr include <number>*\n│  └⊷ Remove from skip list\n`;
                text += `├─⊷ *${prefix}sr excluded*\n│  └⊷ Show skip list\n`;
                text += `├─⊷ *${prefix}sr view+react*\n│  └⊷ View then react\n`;
                text += `├─⊷ *${prefix}sr react-only*\n│  └⊷ React without viewing\n`;
                text += `├─⊷ *${prefix}sr random*\n│  └⊷ Random emoji mode\n`;
                text += `├─⊷ *${prefix}sr emoji <emoji>*\n│  └⊷ Set fixed emoji\n`;
                text += `├─⊷ *${prefix}sr stats*\n│  └⊷ Statistics\n`;
                text += `╰───`;
                await reply(text);
                return;
            }

            const action = args[0].toLowerCase();

            switch (action) {
                case 'on': case 'enable': case 'start': {
                    if (!isOwner) { await reply("❌ Owner only!"); return; }
                    autoReactManager.toggle(false);
                    await reply(`✅ *AUTOREACTSTATUS ENABLED*\n\n🐺 Will now ${autoReactManager.viewMode === 'view+react' ? 'view then react to' : 'react to'} ALL statuses!\n\nView Mode: ${autoReactManager.viewMode}\nEmoji: ${autoReactManager.fixedEmoji}\nMode: ${autoReactManager.mode}`);
                    break;
                }

                case 'off': case 'disable': case 'stop': {
                    if (!isOwner) { await reply("❌ Owner only!"); return; }
                    autoReactManager.toggle(true);
                    await reply(`❌ *AUTOREACTSTATUS DISABLED*`);
                    break;
                }

                case 'exclude': case 'skip': case 'block': {
                    if (!isOwner) { await reply("❌ Owner only!"); return; }
                    const num = args[1];
                    if (!num) { await reply(`Usage: *${prefix}sr exclude <number>*\nExample: ${prefix}sr exclude 254703123456`); return; }
                    if (autoReactManager.excludeContact(num)) {
                        const clean = num.replace(/[^0-9]/g, '');
                        await reply(`✅ *Excluded from auto-react*\n\n🚫 ${clean}\n\nTheir statuses will be silently skipped.`);
                    } else {
                        await reply(`⚠️ ${num.replace(/[^0-9]/g, '')} is already on the skip list.`);
                    }
                    break;
                }

                case 'include': case 'unexclude': case 'unblock': case 'unskip': {
                    if (!isOwner) { await reply("❌ Owner only!"); return; }
                    const num = args[1];
                    if (!num) { await reply(`Usage: *${prefix}sr include <number>*`); return; }
                    if (autoReactManager.includeContact(num)) {
                        const clean = num.replace(/[^0-9]/g, '');
                        await reply(`✅ *Removed from skip list*\n\n🐺 ${clean} will now be auto-reacted again.`);
                    } else {
                        await reply(`⚠️ ${num.replace(/[^0-9]/g, '')} was not on the skip list.`);
                    }
                    break;
                }

                case 'excluded': case 'skiplist': case 'blocklist': case 'exclusions': {
                    const list = autoReactManager.config.excludedContacts;
                    if (!list.length) {
                        await reply(`📭 *No contacts excluded from auto-react.*\n\nUse *${prefix}sr exclude <number>* to skip someone.`);
                        return;
                    }
                    let text = `🚫 *AUTOREACT SKIP LIST (${list.length})*\n\n`;
                    list.forEach((n, i) => { text += `${i + 1}. +${n}\n`; });
                    text += `\nUse *${prefix}sr include <number>* to remove.`;
                    await reply(text);
                    break;
                }

                case 'view+react': case 'viewreact': {
                    if (!isOwner) { await reply("❌ Owner only!"); return; }
                    autoReactManager.setViewMode('view+react');
                    await reply(`👁️ + 🐺 *VIEW+REACT MODE*\n\nWill view the status first, then react.\nSender sees you in their viewers list.`);
                    break;
                }

                case 'react-only': case 'reactonly': {
                    if (!isOwner) { await reply("❌ Owner only!"); return; }
                    autoReactManager.setViewMode('react-only');
                    await reply(`🐺 *REACT-ONLY MODE*\n\nWill react without marking as viewed.\nSender will NOT see you in their viewers list.`);
                    break;
                }

                case 'random': {
                    autoReactManager.setMode('random');
                    await reply(`🎲 *RANDOM MODE*\n\nOne random emoji per status!\n\n${autoReactManager.reactions.join(' ')}`);
                    break;
                }

                case 'fixed': {
                    autoReactManager.setMode('fixed');
                    await reply(`📌 *FIXED MODE*\n\nWill always react with: ${autoReactManager.fixedEmoji}`);
                    break;
                }

                case 'emoji': {
                    if (!args[1]) { await reply(`Current emoji: ${autoReactManager.fixedEmoji}\n\nUsage: *${prefix}sr emoji 🐺*`); return; }
                    const emoji = args[1];
                    if (autoReactManager.setFixedEmoji(emoji)) {
                        autoReactManager.setMode('fixed');
                        await reply(`✅ Emoji set to: ${emoji}`);
                    } else {
                        await reply('❌ Invalid emoji.');
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
                    text += `🚫 Excluded    : ${s.excludedCount}\n`;
                    if (s.lastReacted) {
                        const ago = Math.floor((Date.now() - s.lastReacted.timestamp) / 60000);
                        text += `\n🕒 Last: ${s.lastReacted.sender} ${s.lastReacted.reaction} (${ago < 1 ? 'just now' : ago + ' min ago'})`;
                    }
                    await reply(text);
                    break;
                }

                case 'list': case 'emojis': {
                    await reply(`😄 *Emoji List (${autoReactManager.reactions.length}):*\n\n${autoReactManager.reactions.join(' ')}\n\nMode: ${autoReactManager.mode} | Fixed: ${autoReactManager.fixedEmoji}`);
                    break;
                }

                case 'add': {
                    if (!isOwner) { await reply("❌ Owner only!"); return; }
                    if (!args[1]) { await reply(`Usage: \`${prefix}sr add ❤️\``); return; }
                    if (autoReactManager.addReaction(args[1])) {
                        await reply(`✅ ${args[1]} added.\n\n${autoReactManager.reactions.join(' ')}`);
                    } else {
                        await reply(`⚠️ Already in list or invalid.`);
                    }
                    break;
                }

                case 'remove': {
                    if (!isOwner) { await reply("❌ Owner only!"); return; }
                    if (!args[1]) { await reply(`Usage: \`${prefix}sr remove 🔥\``); return; }
                    if (autoReactManager.removeReaction(args[1])) {
                        await reply(`✅ ${args[1]} removed.\n\n${autoReactManager.reactions.join(' ')}`);
                    } else {
                        await reply(`❌ Not found.`);
                    }
                    break;
                }

                case 'reset': case 'clear': {
                    if (!isOwner) { await reply("❌ Owner only!"); return; }
                    autoReactManager.clearLogs();
                    await reply(`🔄 All data reset. Fresh start! 🐺`);
                    break;
                }

                case 'clean': case 'cleanup': {
                    if (!isOwner) { await reply("❌ Owner only!"); return; }
                    autoReactManager.resetReactions();
                    await reply(`🔄 Emoji list reset to defaults:\n${autoReactManager.reactions.join(' ')}`);
                    break;
                }

                default:
                    await reply(`╭─⌈ ❓ *AUTOREACTSTATUS* ⌋\n│\n├─⊷ *${prefix}sr on / off*\n├─⊷ *${prefix}sr exclude <number>*\n├─⊷ *${prefix}sr include <number>*\n├─⊷ *${prefix}sr excluded*\n├─⊷ *${prefix}sr view+react*\n├─⊷ *${prefix}sr react-only*\n├─⊷ *${prefix}sr random / fixed*\n├─⊷ *${prefix}sr emoji 🐺*\n├─⊷ *${prefix}sr stats*\n╰───`);
            }

        } catch (error) {
            console.error('AutoReactStatus error:', error);
            await sock.sendMessage(m.key.remoteJid, { text: `❌ ${error.message}` }, { quoted: m });
        }
    }
};
