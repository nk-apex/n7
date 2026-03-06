/**
 * ============================================================
 *  SILENT WOLF — AutoViewStatus Module
 *  Shared by: Silent Wolf (@7silent-wolf)
 * ============================================================
 *
 *  WHAT THIS DOES:
 *  Automatically marks WhatsApp statuses as "seen" the moment
 *  they arrive, without the user having to open them manually.
 *
 *  THE KEY PROBLEM THIS SOLVES:
 *  Modern WhatsApp multi-device uses LID JIDs (e.g. 12345@lid)
 *  internally instead of phone number JIDs (e.g. 254712345678@s.whatsapp.net).
 *  A status view receipt is only counted by WhatsApp if it is sent
 *  using the phone number JID — sending it with a LID JID silently
 *  fails and the contact never sees you viewed their status.
 *  This module resolves LIDs to real phone numbers before sending
 *  the receipt, making views register correctly every time.
 *
 * ============================================================
 *  FILES INVOLVED:
 *    1. commands/automation/autoviewstatus.js  ← the module (copy this file)
 *    2. index.js                               ← integration (see bottom of this file)
 *    3. lib/sudo-store.js                      ← already handles LID ↔ phone mapping
 * ============================================================
 */


// ╔══════════════════════════════════════════════════════════════╗
// ║  PART 1 — THE MODULE  (save as: commands/automation/autoviewstatus.js)
// ╚══════════════════════════════════════════════════════════════╝

/*

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import supabase from '../../lib/supabase.js';   // optional — for DB persistence

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Where the on/off state and view logs are stored locally
const CONFIG_FILE = './data/autoViewConfig.json';

// ── Console colour helpers ────────────────────────────────────
const G = '\x1b[32m'; const C = '\x1b[36m'; const Y = '\x1b[33m';
const R = '\x1b[31m'; const B = '\x1b[1m';  const D = '\x1b[2m'; const X = '\x1b[0m';

// Prints a neat coloured box to the console each time a status is processed
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

// Returns a friendly label for the status content type (image, video, text, etc.)
function getMessageType(message) {
    if (!message) return `${D}stub${X}`;
    const map = {
        imageMessage:        '🖼️  Image',
        videoMessage:        '🎥  Video',
        extendedTextMessage: '📝  Text',
        conversation:        '💬  Text',
        audioMessage:        '🎵  Audio',
        stickerMessage:      '🎭  Sticker',
        documentMessage:     '📄  Document',
        reactionMessage:     '😮  Reaction',
        protocolMessage:     '🔧  Protocol',
    };
    const key = Object.keys(message)[0];
    return map[key] || `📦  ${key}`;
}

// Creates the config file on first run if it does not exist yet
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

// On startup, try to load the saved config from the database (Supabase/SQLite)
// so the enabled/disabled state survives bot restarts
(async () => {
    try {
        if (supabase.isAvailable()) {
            const dbData = await supabase.getConfig('autoview_config');
            if (dbData?.enabled !== undefined)
                fs.writeFileSync(CONFIG_FILE, JSON.stringify(dbData, null, 2));
        }
    } catch {}
})();

// ─────────────────────────────────────────────────────────────────────────────
//  AutoViewManager — handles state, rate limiting, queue, and sending receipts
// ─────────────────────────────────────────────────────────────────────────────
class AutoViewManager {
    constructor() {
        this.config       = this.loadConfig();
        this.lastViewTime = 0;
        this.queue        = [];       // pending view receipts
        this._draining    = false;    // prevents concurrent queue processing
    }

    // Read the JSON config from disk
    loadConfig() {
        try { return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')); }
        catch { return { enabled: true, logs: [], totalViewed: 0, lastViewed: null,
            consecutiveViews: 0, lastSender: null,
            settings: { rateLimitDelay: 1000, markAsSeen: true } }; }
    }

    // Write config to disk and persist to DB
    saveConfig() {
        try {
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2));
            supabase.setConfig('autoview_config', this.config).catch(() => {});
        } catch {}
    }

    get enabled()     { return this.config.enabled; }
    get logs()        { return this.config.logs; }
    get totalViewed() { return this.config.totalViewed; }

    // Toggle on/off and save
    toggle(forceOff = false) {
        this.config.enabled = !forceOff;
        this.saveConfig();
        return this.config.enabled;
    }

    // Record a successful view in the log (keeps last 100 entries)
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
        return {
            enabled:          this.config.enabled,
            totalViewed:      this.config.totalViewed,
            lastViewed:       this.config.lastViewed,
            consecutiveViews: this.config.consecutiveViews,
            settings:         { ...this.config.settings }
        };
    }

    // ── Main entry called from index.js ──────────────────────────────────────
    //
    //  Called as: handleAutoView(sock, statusKeyWithTs, resolvedMessage)
    //
    //  statusKeyWithTs — the message key enriched with participantPn (phone JID).
    //                    The enrichment is done in index.js BEFORE calling this
    //                    (see Part 2 below). We just queue the receipt here.
    //
    async viewStatus(sock, statusKey, message) {
        try {
            if (!statusKey || statusKey.fromMe) return false;   // never view own statuses

            const sender    = statusKey.participant || statusKey.remoteJid;
            const displayId = sender.split('@')[0].split(':')[0];
            const msgType   = getMessageType(message);

            if (!this.config.enabled || !this.config.settings.markAsSeen) {
                logBox(displayId, msgType, `${Y}SKIPPED — autoview OFF${X}`);
                return false;
            }

            logBox(displayId, msgType, `${G}${B}Attempting view...${X}`);

            // Push to queue so views are rate-limited and never flood WhatsApp
            this.queue.push({ sock, statusKey, displayId });
            this._drain();
            return true;

        } catch (err) {
            console.error('autoviewstatus error:', err.message);
            return false;
        }
    }

    // Start processing the queue (safe to call multiple times)
    _drain() {
        if (this._draining) return;
        this._draining = true;
        this._processNext().catch(() => { this._draining = false; });
    }

    async _processNext() {
        while (this.queue.length > 0) {
            const { sock, statusKey, displayId } = this.queue.shift();

            // Respect the rate limit delay between views (default 1000ms)
            const wait = this.config.settings.rateLimitDelay - (Date.now() - this.lastViewTime);
            if (wait > 0) await new Promise(r => setTimeout(r, wait));

            await this._sendReceipt(sock, statusKey, displayId);
        }
        this._draining = false;
    }

    // ── The receipt sender — this is the critical fixed part ─────────────────
    //
    //  WHY participantPn (phone number JID) matters:
    //
    //  WhatsApp's multi-device protocol assigns every user an internal LID
    //  (e.g. 18003849201928373@lid). The raw msg.key.participant from
    //  messages.upsert may be this LID instead of the phone number JID.
    //
    //  If we send sock.readMessages() with the LID JID as participant,
    //  WhatsApp silently accepts the call but does NOT register the view —
    //  the contact never sees the "seen" tick on their status.
    //
    //  The fix: use remoteJidAlt (set by Baileys when it resolves the LID)
    //  or participantPn (which index.js resolves from the LID cache before
    //  calling this function). Fallback chain:
    //    remoteJidAlt → participantPn → participant (raw, may be @lid)
    //
    async _sendReceipt(sock, statusKey, displayId) {
        const participantToUse =
            statusKey.remoteJidAlt   ||   // Baileys auto-resolved phone JID
            statusKey.participantPn  ||   // resolved by index.js LID cache
            statusKey.participant    ||   // raw (may be @lid — last resort)
            statusKey.remoteJid;

        const readKey = {
            remoteJid:   statusKey.remoteJid,   // always 'status@broadcast'
            id:          statusKey.id,
            fromMe:      false,
            participant: participantToUse        // MUST be phone JID for view to register
        };

        try {
            await sock.readMessages([readKey]);
            this.lastViewTime = Date.now();
            this.addLog(displayId);
            console.log(`${G}${B}✅ VIEWED${X}${G} [via=${participantToUse?.split('@')[1] || '?'}] → ${displayId}${X}`);
        } catch (err) {
            console.log(`${R}${B}❌ VIEW FAILED for ${displayId}: ${err.message}${X}`);
        }
    }

    updateSetting(setting, value) {
        if (Object.prototype.hasOwnProperty.call(this.config.settings, setting)) {
            this.config.settings[setting] = value;
            this.saveConfig();
            return true;
        }
        return false;
    }
}

const autoViewManager = new AutoViewManager();

// Named export used by index.js
export async function handleAutoView(sock, statusKey, message) {
    return await autoViewManager.viewStatus(sock, statusKey, message);
}

export { autoViewManager };

// Default export — the bot command (.autoviewstatus on/off/stats/logs)
export default {
    name:      "autoviewstatus",
    alias:     ["autoview", "viewstatus", "statusview", "vs", "views"],
    desc:      "Automatically view (mark as seen) WhatsApp statuses 👁️",
    category:  "Automation",
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

*/


// ╔══════════════════════════════════════════════════════════════╗
// ║  PART 2 — INDEX.JS INTEGRATION  (add these to your index.js)
// ╚══════════════════════════════════════════════════════════════╝

/*

─────────────────────────────────────────────────────────────────
STEP 1 — Import at the top of index.js (near your other imports)
─────────────────────────────────────────────────────────────────

import { handleAutoView } from './commands/automation/autoviewstatus.js';

Also needed for LID → phone resolution (likely already in your file):

import { getPhoneFromLid } from './lib/sudo-store.js';


─────────────────────────────────────────────────────────────────
STEP 2 — Inside your messages.upsert event handler, add this
         block wherever you handle incoming messages.
         It must run for EVERY message so statuses are caught.
─────────────────────────────────────────────────────────────────

// Detect status@broadcast messages and trigger autoview
if (msg.key?.remoteJid === 'status@broadcast') {

    // Unwrap ephemeral (disappearing-mode) status messages so we
    // always get the real content regardless of disappearing setting
    const resolvedMessage = msg.message?.ephemeralMessage?.message || msg.message;

    // ── LID RESOLUTION ──────────────────────────────────────────
    //
    // Problem: In multi-device WhatsApp, msg.key.participant may be
    // a LID (e.g. 18003849201928373@lid) instead of the real phone
    // number JID (e.g. 254712345678@s.whatsapp.net).
    //
    // A status read receipt sent with a LID participant is silently
    // ignored by WhatsApp — the view never registers.
    //
    // Fix: resolve the LID to a phone number JID before passing the
    // key to handleAutoView. We try multiple sources in priority order:
    //   1. remoteJidAlt — Baileys sometimes auto-resolves this
    //   2. participantAlt / participantPn — other Baileys fields
    //   3. lidPhoneCache — an in-memory Map built as messages arrive
    //   4. getPhoneFromLid() — persistent DB-backed LID ↔ phone store
    //
    const rawParticipant = msg.key.participant || '';
    let resolvedParticipantPn = msg.key.remoteJidAlt
                             || msg.key.participantAlt
                             || msg.key.participantPn
                             || null;

    if (!resolvedParticipantPn && rawParticipant.includes('@lid')) {
        // Strip device suffix (:0, :1, etc.) before looking up
        const lidNum = rawParticipant.split('@')[0].split(':')[0];
        const phone  = lidPhoneCache.get(lidNum)
                    || lidPhoneCache.get(rawParticipant.split('@')[0])
                    || getPhoneFromLid(lidNum);
        if (phone) resolvedParticipantPn = `${phone}@s.whatsapp.net`;
    }

    // Build the enriched status key we pass into handleAutoView.
    // participantPn carries the resolved phone JID so the module's
    // _sendReceipt() uses the correct participant for readMessages().
    const statusKeyWithTs = {
        ...msg.key,
        messageTimestamp: msg.messageTimestamp,
        ...(resolvedParticipantPn ? { participantPn: resolvedParticipantPn } : {})
    };

    // Fire and forget — errors are caught inside the module
    handleAutoView(sock, statusKeyWithTs, resolvedMessage).catch(() => {});
}


─────────────────────────────────────────────────────────────────
STEP 3 — lidPhoneCache (if you don't already have it)
─────────────────────────────────────────────────────────────────

// Declare this near the top of your connection setup function,
// before makeWASocket() is called:

const lidPhoneCache = new Map();

// Then wire it up inside sock.ev.on('contacts.update', ...) or
// sock.ev.on('contacts.upsert', ...) so it fills automatically:

sock.ev.on('contacts.upsert', contacts => {
    for (const c of contacts) {
        if (c.id?.includes('@lid') && c.notify) {
            const lid = c.id.split('@')[0].split(':')[0];
            // Store lid → phone mapping in the cache
            // (phone is derived from the non-LID contact if available)
        }
    }
});

// More reliably, it is populated by your signalRepository LID
// mapping which Baileys handles internally. The getPhoneFromLid()
// function from lib/sudo-store.js covers the persistent fallback.


─────────────────────────────────────────────────────────────────
STEP 4 — Enable read receipts (required for views to register)
─────────────────────────────────────────────────────────────────

// Inside your makeWASocket() config options, set:

markOnlineOnConnect: true,

// AND after the socket connects, call:

await sock.sendPresenceUpdate('available');

// This ensures WhatsApp counts the read receipt as a real view.
// Without presence being available, readMessages() may be ignored.

*/


// ╔══════════════════════════════════════════════════════════════╗
// ║  SUMMARY OF THE FIX THAT MADE IT WORK
// ╚══════════════════════════════════════════════════════════════╝

/*

  BEFORE THE FIX:
  ─────────────────
  The code was calling sock.readMessages() with the raw
  msg.key.participant, which on multi-device sessions is often
  a LID like 18003849201928373@lid.

  WhatsApp's servers accept the API call without throwing any
  error, but they do NOT update the status view count for that
  user. The contact checks their status and sees 0 views even
  though the bot "viewed" it.

  AFTER THE FIX:
  ─────────────────
  Before passing the key to the module, index.js checks multiple
  sources (remoteJidAlt, participantAlt, lidPhoneCache, getPhoneFromLid)
  to find the real phone number JID (e.g. 254712345678@s.whatsapp.net).

  That resolved phone JID is stored in statusKeyWithTs.participantPn.

  Inside _sendReceipt(), the participant priority order is:
    remoteJidAlt  → participantPn  → participant (raw fallback)

  Since participantPn now always holds the phone JID when available,
  sock.readMessages() sends the receipt with the correct participant
  and WhatsApp registers the view properly.

  COMMANDS:
  ─────────────────
  .autoviewstatus           — show status
  .autoviewstatus on        — enable auto-view
  .autoviewstatus off       — disable auto-view
  .autoviewstatus stats     — view counts and last viewed
  .autoviewstatus logs      — recent 10 views
  .autoviewstatus delay 500 — set delay between views (min 200ms)
  .autoviewstatus reset     — clear all stats

*/
