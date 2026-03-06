// commands/automation/autoviewstatus.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import supabase from '../../lib/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG_FILE = './data/autoViewConfig.json';

// ── Console colours ───────────────────────────────────────────────────────────
const G = '\x1b[32m'; const C = '\x1b[36m'; const Y = '\x1b[33m';
const R = '\x1b[31m'; const B = '\x1b[1m';  const D = '\x1b[2m'; const X = '\x1b[0m';

function logBox(sender, msgType, result) {
    const t = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const d = new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    console.log(`${G}${B}┌──────────────────────────────────────────────────┐${X}`);
    console.log(`${G}${B}│  👁️  STATUS DETECTED                              │${X}`);
    console.log(`${G}${B}├──────────────────────────────────────────────────┤${X}`);
    console.log(`${G}│  ${C}${B}From   :${X}${G} ${sender}${X}`);
    console.log(`${G}│  ${C}${B}Type   :${X}${G} ${msgType}${X}`);
    console.log(`${G}│  ${C}${B}Time   :${X}${G} ${t}  ${D}(${d})${X}`);
    console.log(`${G}│  ${C}${B}Result :${X}${G} ${result}${X}`);
    console.log(`${G}${B}└──────────────────────────────────────────────────┘${X}`);
}

function getMessageType(message) {
    if (!message) return `${D}stub${X}`;
    const map = {
        imageMessage: '🖼️  Image', videoMessage: '🎥  Video',
        extendedTextMessage: '📝  Text', conversation: '💬  Text',
        audioMessage: '🎵  Audio', stickerMessage: '🎭  Sticker',
        documentMessage: '📄  Document', reactionMessage: '😮  Reaction',
        protocolMessage: '🔧  Protocol',
    };
    const key = Object.keys(message)[0];
    return map[key] || `📦  ${key}`;
}

// ─────────────────────────────────────────────────────────────────────────────

function initConfig() {
    const configDir = path.dirname(CONFIG_FILE);
    if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
    if (!fs.existsSync(CONFIG_FILE)) {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify({
            enabled: true, logs: [], totalViewed: 0, lastViewed: null,
            consecutiveViews: 0, lastSender: null,
            settings: { rateLimitDelay: 1000, markAsSeen: true }
        }, null, 2));
    }
}

initConfig();

(async () => {
    try {
        if (supabase.isAvailable()) {
            const dbData = await supabase.getConfig('autoview_config');
            if (dbData?.enabled !== undefined)
                fs.writeFileSync(CONFIG_FILE, JSON.stringify(dbData, null, 2));
        }
    } catch {}
})();

class AutoViewManager {
    constructor() {
        this.config = this.loadConfig();
        this.lastViewTime = 0;
        this.queue = [];
        this._draining = false;
    }

    loadConfig() {
        try { return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')); }
        catch { return { enabled: true, logs: [], totalViewed: 0, lastViewed: null,
            consecutiveViews: 0, lastSender: null,
            settings: { rateLimitDelay: 1000, markAsSeen: true } }; }
    }

    saveConfig() {
        try {
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2));
            supabase.setConfig('autoview_config', this.config).catch(() => {});
        } catch {}
    }

    get enabled()     { return this.config.enabled; }
    get logs()        { return this.config.logs; }
    get totalViewed() { return this.config.totalViewed; }

    toggle(forceOff = false) {
        this.config.enabled = !forceOff;
        this.saveConfig(); return this.config.enabled;
    }

    addLog(sender) {
        const entry = { sender, timestamp: Date.now() };
        this.config.logs.push(entry);
        this.config.totalViewed++;
        this.config.lastViewed = entry;
        this.config.consecutiveViews = this.config.lastSender === sender
            ? this.config.consecutiveViews + 1 : 1;
        this.config.lastSender = sender;
        if (this.config.logs.length > 100) this.config.logs.shift();
        this.saveConfig();
    }

    clearLogs() {
        Object.assign(this.config, { logs: [], totalViewed: 0, lastViewed: null,
            consecutiveViews: 0, lastSender: null });
        this.saveConfig();
    }

    getStats() {
        return { enabled: this.config.enabled, totalViewed: this.config.totalViewed,
            lastViewed: this.config.lastViewed, consecutiveViews: this.config.consecutiveViews,
            settings: { ...this.config.settings } };
    }

    // ── Main entry point ─────────────────────────────────────────────────────
    // Called from index.js as: handleAutoView(sock, msg.key, msg.message)
    // We receive the RAW key straight from messages.upsert — no modifications.
    async viewStatus(sock, statusKey, message) {
        try {
            if (!statusKey || statusKey.fromMe) return false;

            const sender    = statusKey.participant || statusKey.remoteJid;
            const displayId = sender.split('@')[0].split(':')[0];
            const msgType   = getMessageType(message);

            if (!this.config.enabled || !this.config.settings.markAsSeen) {
                logBox(displayId, msgType, `${Y}SKIPPED — autoview OFF${X}`);
                return false;
            }

            logBox(displayId, msgType, `${G}${B}Attempting view...${X}`);

            // Queue it so we respect rate limiting
            this.queue.push({ sock, statusKey, displayId });
            this._drain();
            return true;

        } catch (err) {
            console.error('autoviewstatus error:', err.message);
            return false;
        }
    }

    _drain() {
        if (this._draining) return;
        this._draining = true;
        this._processNext().catch(() => { this._draining = false; });
    }

    async _processNext() {
        while (this.queue.length > 0) {
            const { sock, statusKey, displayId } = this.queue.shift();

            // Rate limit
            const wait = this.config.settings.rateLimitDelay - (Date.now() - this.lastViewTime);
            if (wait > 0) await new Promise(r => setTimeout(r, wait));

            await this._sendReceipt(sock, statusKey, displayId);
        }
        this._draining = false;
    }

    async _sendReceipt(sock, statusKey, displayId) {
        // Use participantPn (phone number JID @s.whatsapp.net) if available.
        // When participant is in @lid format, WhatsApp does NOT count it as a view.
        // participantPn is the resolved phone number JID which is what the receipt needs.
        const participantToUse = statusKey.participantPn || statusKey.participant || statusKey.remoteJid;

        const readKey = {
            remoteJid: statusKey.remoteJid,
            id: statusKey.id,
            fromMe: statusKey.fromMe,
            participant: participantToUse
        };

        try {
            await sock.readMessages([readKey]);
            this.lastViewTime = Date.now();
            this.addLog(displayId);
            console.log(`${G}${B}✅ VIEWED${X}${G} [participantPn=${participantToUse?.split('@')[1] || '?'}] → ${displayId}${X}`);
        } catch (err) {
            console.log(`${R}${B}❌ VIEW FAILED for ${displayId}: ${err.message}${X}`);
        }
    }

    updateSetting(setting, value) {
        if (Object.prototype.hasOwnProperty.call(this.config.settings, setting)) {
            this.config.settings[setting] = value; this.saveConfig(); return true;
        }
        return false;
    }
}

const autoViewManager = new AutoViewManager();

// index.js calls: handleAutoView(sock, msg.key, msg.message)
export async function handleAutoView(sock, statusKey, message) {
    return await autoViewManager.viewStatus(sock, statusKey, message);
}

export { autoViewManager };

export default {
    name: "autoviewstatus",
    alias: ["autoview", "viewstatus", "statusview", "vs", "views"],
    desc: "Automatically view (mark as seen) WhatsApp statuses 👁️",
    category: "Automation",
    ownerOnly: false,

    async execute(sock, m, args, prefix, extra) {
        try {
            const isOwner = extra?.isOwner?.() || false;

            if (args.length === 0) {
                const s = autoViewManager.getStats();
                let text = `╭─⌈ 👁️ *AUTOVIEWSTATUS* ⌋\n│\n`;
                text += `│ Status: ${s.enabled ? '✅ ACTIVE' : '❌ INACTIVE'}\n│\n`;
                text += `├─⊷ *${prefix}autoviewstatus on*\n│  └⊷ Enable viewing\n`;
                text += `├─⊷ *${prefix}autoviewstatus off*\n│  └⊷ Disable viewing\n`;
                text += `├─⊷ *${prefix}autoviewstatus stats*\n│  └⊷ Statistics\n`;
                text += `╰───`;
                await sock.sendMessage(m.key.remoteJid, { text }, { quoted: m });
                return;
            }

            const action = args[0].toLowerCase();

            switch (action) {
                case 'on': case 'enable': case 'start': {
                    if (!isOwner) { await sock.sendMessage(m.key.remoteJid, { text: "❌ Owner only!" }, { quoted: m }); return; }
                    autoViewManager.toggle(false);
                    await sock.sendMessage(m.key.remoteJid, { text: `✅ *AUTOVIEWSTATUS ENABLED*\n\n👁️ Will now automatically view ALL statuses!` }, { quoted: m });
                    break;
                }
                case 'off': case 'disable': case 'stop': {
                    if (!isOwner) { await sock.sendMessage(m.key.remoteJid, { text: "❌ Owner only!" }, { quoted: m }); return; }
                    autoViewManager.toggle(true);
                    await sock.sendMessage(m.key.remoteJid, { text: `❌ *AUTOVIEWSTATUS DISABLED*` }, { quoted: m });
                    break;
                }
                case 'stats': case 'statistics': case 'info': {
                    const s = autoViewManager.getStats();
                    let text = `📊 *AUTOVIEWSTATUS STATS*\n\n`;
                    text += `🟢 Status   : ${s.enabled ? 'ACTIVE ✅' : 'INACTIVE ❌'}\n`;
                    text += `👁️ Viewed   : *${s.totalViewed}*\n`;
                    text += `🔄 Streak   : ${s.consecutiveViews}\n`;
                    text += `⚙️ Delay    : ${s.settings.rateLimitDelay}ms\n`;
                    if (s.lastViewed) {
                        const ago = Math.floor((Date.now() - s.lastViewed.timestamp) / 60000);
                        text += `\n🕒 Last: ${s.lastViewed.sender} (${ago < 1 ? 'just now' : ago + ' min ago'})`;
                    }
                    await sock.sendMessage(m.key.remoteJid, { text }, { quoted: m });
                    break;
                }
                case 'logs': case 'history': {
                    const logs = autoViewManager.logs.slice(-10).reverse();
                    if (!logs.length) { await sock.sendMessage(m.key.remoteJid, { text: `📭 No statuses viewed yet.` }, { quoted: m }); return; }
                    let text = `📋 *RECENT VIEWS*\n\n`;
                    logs.forEach((l, i) => { text += `${i+1}. ${l.sender} — ${new Date(l.timestamp).toLocaleTimeString()}\n`; });
                    text += `\n📊 Total: ${autoViewManager.totalViewed}`;
                    await sock.sendMessage(m.key.remoteJid, { text }, { quoted: m });
                    break;
                }
                case 'reset': {
                    if (!isOwner) { await sock.sendMessage(m.key.remoteJid, { text: "❌ Owner only!" }, { quoted: m }); return; }
                    autoViewManager.clearLogs();
                    await sock.sendMessage(m.key.remoteJid, { text: `🗑️ Stats reset.` }, { quoted: m });
                    break;
                }
                case 'delay': {
                    const ms = parseInt(args[1]);
                    if (isNaN(ms) || ms < 200) { await sock.sendMessage(m.key.remoteJid, { text: '❌ Min 200ms' }, { quoted: m }); return; }
                    autoViewManager.updateSetting('rateLimitDelay', ms);
                    await sock.sendMessage(m.key.remoteJid, { text: `✅ Delay set to ${ms}ms` }, { quoted: m });
                    break;
                }
                default:
                    await sock.sendMessage(m.key.remoteJid, { text: `╭─⌈ ❓ *AUTOVIEWSTATUS* ⌋\n│\n├─⊷ *${prefix}autoviewstatus on/off*\n├─⊷ *${prefix}autoviewstatus stats*\n├─⊷ *${prefix}autoviewstatus logs*\n├─⊷ *${prefix}autoviewstatus delay <ms>*\n╰───` }, { quoted: m });
            }
        } catch (error) {
            console.error('AutoViewStatus error:', error);
            await sock.sendMessage(m.key.remoteJid, { text: `❌ ${error.message}` }, { quoted: m });
        }
    }
};
