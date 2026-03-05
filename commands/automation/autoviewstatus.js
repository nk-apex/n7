// commands/automation/autoviewstatus.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import supabase from '../../lib/supabase.js';
import { getPhoneFromLid } from '../../lib/sudo-store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG_FILE = './data/autoViewConfig.json';

// ── Console colours ───────────────────────────────────────────────────────────
const G = '\x1b[32m'; const C = '\x1b[36m'; const Y = '\x1b[33m';
const R = '\x1b[31m'; const B = '\x1b[1m';  const D = '\x1b[2m'; const X = '\x1b[0m';

function logBox(sender, msgType, result, note = '') {
    const t = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const d = new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    console.log(`${G}${B}┌──────────────────────────────────────────────────┐${X}`);
    console.log(`${G}${B}│  👁️  STATUS DETECTED                              │${X}`);
    console.log(`${G}${B}├──────────────────────────────────────────────────┤${X}`);
    console.log(`${G}│  ${C}${B}From   :${X}${G} ${sender}${X}`);
    console.log(`${G}│  ${C}${B}Type   :${X}${G} ${msgType}${X}`);
    console.log(`${G}│  ${C}${B}Time   :${X}${G} ${t}  ${D}(${d})${X}`);
    console.log(`${G}│  ${C}${B}Result :${X}${G} ${result}${X}`);
    if (note) console.log(`${G}│  ${D}${note}${X}`);
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

// ── Resolve @lid → @s.whatsapp.net ───────────────────────────────────────────
// Uses ALL available sources in priority order:
//   1. globalThis.lidPhoneCache  — index.js in-memory cache (contacts.upsert, group metadata)
//   2. getPhoneFromLid()         — sudo-store persistent file
//   3. sock.signalRepository     — Baileys signal protocol LID mapping
function tryResolveLid(sock, lidJid) {
    if (!lidJid?.includes('@lid')) return lidJid;

    const lidNum  = lidJid.split('@')[0].split(':')[0];
    const lidFull = lidJid.split('@')[0]; // may include :0 suffix

    // 1. globalThis.lidPhoneCache (set by index.js line 337)
    //    This is the richest source — populated by contacts.upsert AND group metadata
    const gCache = globalThis.lidPhoneCache;
    if (gCache instanceof Map) {
        const hit = gCache.get(lidNum) || gCache.get(lidFull);
        if (hit) return `${hit}@s.whatsapp.net`;
    }

    // 2. sudo-store persistent mapping
    const stored = getPhoneFromLid(lidNum);
    if (stored) return `${stored}@s.whatsapp.net`;

    // 3. Baileys signal repository (populated when Baileys processes group/contact data)
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

// ── Retry resolver — contacts.upsert fires shortly after messages.upsert ─────
async function resolveLidWithRetry(sock, lidJid, maxWaitMs = 3000, intervalMs = 300) {
    for (let elapsed = 0; elapsed < maxWaitMs; elapsed += intervalMs) {
        const resolved = tryResolveLid(sock, lidJid);
        if (resolved) return resolved;
        await new Promise(r => setTimeout(r, intervalMs));
    }
    return null;
}

// ─────────────────────────────────────────────────────────────────────────────

function initConfig() {
    const configDir = path.dirname(CONFIG_FILE);
    if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
    if (!fs.existsSync(CONFIG_FILE)) {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify({
            enabled: true, logs: [], totalViewed: 0, lastViewed: null,
            consecutiveViews: 0, lastSender: null,
            settings: { rateLimitDelay: 1000, viewToAll: true,
                ignoreConsecutiveLimit: true, markAsSeen: true, noHourlyLimit: true }
        }, null, 2));
    }
}

initConfig();

(async () => {
    try {
        if (supabase.isAvailable()) {
            const dbData = await supabase.getConfig('autoview_config');
            if (dbData?.enabled !== undefined) fs.writeFileSync(CONFIG_FILE, JSON.stringify(dbData, null, 2));
        }
    } catch {}
})();

class AutoViewManager {
    constructor() {
        this.config = this.loadConfig();
        this.lastViewTime = 0;
    }

    loadConfig() {
        try { return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')); }
        catch { return { enabled: true, logs: [], totalViewed: 0, lastViewed: null,
            consecutiveViews: 0, lastSender: null,
            settings: { rateLimitDelay: 1000, viewToAll: true,
                ignoreConsecutiveLimit: true, markAsSeen: true, noHourlyLimit: true } }; }
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
        this.config.enabled = forceOff ? false : true;
        this.saveConfig(); return this.config.enabled;
    }

    addLog(sender, action = 'viewed') {
        const entry = { sender, action, timestamp: Date.now() };
        this.config.logs.push(entry);
        this.config.totalViewed++;
        this.config.lastViewed = entry;
        this.config.consecutiveViews = this.config.lastSender === sender ? this.config.consecutiveViews + 1 : 1;
        this.config.lastSender = sender;
        if (this.config.logs.length > 100) this.config.logs.shift();
        this.saveConfig();
    }

    clearLogs() {
        Object.assign(this.config, { logs: [], totalViewed: 0, lastViewed: null, consecutiveViews: 0, lastSender: null });
        this.saveConfig();
    }

    getStats() {
        return { enabled: this.config.enabled, totalViewed: this.config.totalViewed,
            lastViewed: this.config.lastViewed, consecutiveViews: this.config.consecutiveViews,
            settings: { ...this.config.settings } };
    }

    updateSetting(setting, value) {
        if (Object.prototype.hasOwnProperty.call(this.config.settings, setting)) {
            this.config.settings[setting] = value; this.saveConfig(); return true;
        }
        return false;
    }

    // Called from index.js as: handleAutoView(sock, msg)
    async viewStatus(sock, msg) {
        try {
            // Support both full msg object and bare key
            const key       = msg?.key ?? msg;
            const message   = msg?.message;

            if (key.fromMe) return false;

            const rawSender  = key.participant || key.remoteJid;
            if (!rawSender || rawSender === 'status@broadcast') return false;

            const isLid      = rawSender.includes('@lid');
            const displayNum = rawSender.replace(/@s\.whatsapp\.net|@lid|@g\.us/g, '').split(':')[0];
            const msgType    = getMessageType(message);

            if (!this.config.enabled || !this.config.settings.markAsSeen) {
                logBox(displayNum, msgType, `${Y}SKIPPED — autoview is OFF${X}`);
                return false;
            }

            logBox(displayNum, msgType,
                `${G}${B}Queued${isLid ? ' — resolving LID...' : ''}${X}`,
                isLid ? `LID: ${rawSender}` : `JID: ${rawSender}`);

            this._doView(sock, key, rawSender, isLid, displayNum).catch(() => {});
            return true;

        } catch (err) {
            console.error('autoviewstatus error:', err.message);
            return false;
        }
    }

    async _doView(sock, key, rawSender, isLid, displayNum) {
        const wait = this.config.settings.rateLimitDelay - (Date.now() - this.lastViewTime);
        if (wait > 0) await new Promise(r => setTimeout(r, wait));

        let resolvedJid = rawSender;
        let resolution  = 'not a LID';

        if (isLid) {
            // Try instantly first (globalThis.lidPhoneCache may already have it)
            const quick = tryResolveLid(sock, rawSender);
            if (quick) {
                resolvedJid = quick;
                resolution  = `✔ instant (${quick})`;
                console.log(`${G}✔ LID resolved instantly: ${rawSender} → ${quick}${X}`);
            } else {
                // contacts.upsert fires shortly after — retry for up to 3s
                console.log(`${C}🔍 LID not in cache yet, waiting for contacts.upsert... (max 3s)${X}`);
                const retried = await resolveLidWithRetry(sock, rawSender, 3000, 300);
                if (retried) {
                    resolvedJid = retried;
                    resolution  = `✔ after retry (${retried})`;
                    console.log(`${G}✔ LID resolved after retry: ${rawSender} → ${retried}${X}`);
                } else {
                    resolution = `✘ unresolvable — no shared group or contact`;
                    console.log(`${Y}⚠️  LID unresolvable: ${rawSender}${X}`);
                    console.log(`${Y}    (Contact not in any shared group — WhatsApp hides real JID)${X}`);
                }
            }
        }

        const resolvedKey = {
            remoteJid:   'status@broadcast',
            id:          key.id,
            participant: resolvedJid,
            fromMe:      false
        };

        let success = false;
        let method  = '';

        // Attempt 1: readMessages with resolved key
        try {
            await sock.readMessages([resolvedKey]);
            success = true; method = 'readMessages';
        } catch (e1) {
            // Attempt 2: sendReadReceipt
            try {
                await sock.sendReadReceipt('status@broadcast', resolvedJid, [key.id]);
                success = true; method = 'sendReadReceipt';
            } catch (e2) {
                // Attempt 3: original key untouched
                try {
                    await sock.readMessages([key]);
                    success = true; method = 'readMessages (raw key)';
                } catch (e3) {
                    console.log(`${R}${B}❌ ALL VIEW ATTEMPTS FAILED — ${displayNum}${X}`);
                    console.log(`${R}   1) readMessages(resolved) : ${e1.message}${X}`);
                    console.log(`${R}   2) sendReadReceipt        : ${e2.message}${X}`);
                    console.log(`${R}   3) readMessages(raw)      : ${e3.message}${X}`);
                    return;
                }
            }
        }

        if (success) {
            this.lastViewTime = Date.now();
            this.addLog(displayNum, 'viewed');
            const jidLabel = resolvedJid.includes('@lid')
                ? `${Y}(raw @lid — may not register as view)${X}`
                : `${G}(${resolvedJid})${X}`;
            console.log(`${G}${B}✅ VIEWED${X}${G} [${method}] → ${displayNum} ${jidLabel}${X}`);
        }
    }
}

const autoViewManager = new AutoViewManager();

export async function handleAutoView(sock, msg) {
    return await autoViewManager.viewStatus(sock, msg);
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
                text += `│ Status: ${s.enabled ? '✅ **ACTIVE**' : '❌ **INACTIVE**'}\n│\n`;
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
                    const wasOn = autoViewManager.enabled;
                    autoViewManager.toggle(false);
                    await sock.sendMessage(m.key.remoteJid, {
                        text: wasOn
                            ? `✅ *Already active!*\nTotal viewed: ${autoViewManager.totalViewed}`
                            : `✅ *AUTOVIEWSTATUS ENABLED*\n\n👁️ Will now automatically view ALL statuses!`
                    }, { quoted: m });
                    break;
                }
                case 'off': case 'disable': case 'stop': {
                    if (!isOwner) { await sock.sendMessage(m.key.remoteJid, { text: "❌ Owner only!" }, { quoted: m }); return; }
                    const wasOn = autoViewManager.enabled;
                    autoViewManager.toggle(true);
                    await sock.sendMessage(m.key.remoteJid, {
                        text: wasOn ? `❌ *AUTOVIEWSTATUS DISABLED*` : `⚠️ Already disabled.`
                    }, { quoted: m });
                    break;
                }
                case 'stats': case 'statistics': case 'info': {
                    const s = autoViewManager.getStats();
                    let text = `📊 *AUTOVIEWSTATUS STATS*\n\n`;
                    text += `🟢 Status: ${s.enabled ? 'ACTIVE ✅' : 'INACTIVE ❌'}\n`;
                    text += `👁️ Total Viewed: **${s.totalViewed}**\n`;
                    text += `🔄 Consecutive: ${s.consecutiveViews}\n\n`;
                    text += `⚙️ Mark as Seen: ${s.settings.markAsSeen ? '✅' : '❌'}\n`;
                    text += `⚙️ Delay: ${s.settings.rateLimitDelay}ms\n`;
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
                    let text = `📋 *RECENT STATUS VIEWS*\n\n`;
                    logs.forEach((l, i) => { text += `${i+1}. ${l.sender} — ${new Date(l.timestamp).toLocaleTimeString()}\n`; });
                    text += `\n📊 Total: ${autoViewManager.totalViewed}`;
                    await sock.sendMessage(m.key.remoteJid, { text }, { quoted: m });
                    break;
                }
                case 'reset': case 'clearstats': {
                    if (!isOwner) { await sock.sendMessage(m.key.remoteJid, { text: "❌ Owner only!" }, { quoted: m }); return; }
                    autoViewManager.clearLogs();
                    await sock.sendMessage(m.key.remoteJid, { text: `🗑️ All logs reset. Total viewed: 0` }, { quoted: m });
                    break;
                }
                case 'settings': case 'config': {
                    const sub = args[1]?.toLowerCase();
                    if (!sub) {
                        const s = autoViewManager.config.settings;
                        await sock.sendMessage(m.key.remoteJid, { text: `⚙️ Mark as Seen: ${s.markAsSeen ? '✅' : '❌'}\n⚙️ Delay: ${s.rateLimitDelay}ms\n\n*${prefix}autoviewstatus settings seen on/off*\n*${prefix}autoviewstatus settings delay <ms>*` }, { quoted: m });
                        return;
                    }
                    if (sub === 'seen') {
                        const val = args[2]?.toLowerCase();
                        if (val === 'on' || val === 'off') autoViewManager.updateSetting('markAsSeen', val === 'on');
                        await sock.sendMessage(m.key.remoteJid, { text: `✅ markAsSeen → ${val}` }, { quoted: m });
                    } else if (sub === 'delay') {
                        const delay = parseInt(args[2]);
                        if (isNaN(delay) || delay < 500) { await sock.sendMessage(m.key.remoteJid, { text: '❌ Min 500ms' }, { quoted: m }); return; }
                        autoViewManager.updateSetting('rateLimitDelay', delay);
                        await sock.sendMessage(m.key.remoteJid, { text: `✅ Delay → ${delay}ms` }, { quoted: m });
                    }
                    break;
                }
                default:
                    await sock.sendMessage(m.key.remoteJid, { text: `╭─⌈ ❓ *AUTOVIEWSTATUS* ⌋\n│\n├─⊷ *${prefix}autoviewstatus on/off*\n├─⊷ *${prefix}autoviewstatus stats*\n├─⊷ *${prefix}autoviewstatus logs*\n├─⊷ *${prefix}autoviewstatus settings*\n╰───` }, { quoted: m });
            }
        } catch (error) {
            console.error('AutoViewStatus error:', error);
            await sock.sendMessage(m.key.remoteJid, { text: `❌ ${error.message}` }, { quoted: m });
        }
    }
};
