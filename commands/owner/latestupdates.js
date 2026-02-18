export default {
    name: 'latestupdates',
    alias: ['updates', 'newcommands', 'changelog', 'whatsnew', 'latestcmds'],
    description: 'Show latest bot updates, new commands and fixes',
    category: 'owner',

    async execute(sock, msg, args, PREFIX, extra) {
        const chatId = msg.key.remoteJid;

        const updates = [
            {
                date: '2026-02-18',
                title: '🛡️ Ethical Hacking Suite & Fixes',
                changes: [
                    '🔵 44 NEW Ethical Hacking commands — Recon, Network, Web Security, Vulnerability, Hash Tools, Forensics',
                    '✅ Fixed reaction-based view-once detection — reactions now trigger auto-download to owner DM',
                    '✅ Fixed prefix command — works with ANY prefix or no prefix (for users who forgot their prefix)',
                    '✅ Updated ytmp4 — switched to XWolf API as primary download source with Keith fallback',
                    '✅ Fixed screenshot command — updated to working screenshot APIs',
                    '✅ Prefix command redesigned with border style matching AI commands',
                ]
            },
            {
                date: '2026-02-17',
                title: '🔧 Connection Stability & View-Once',
                changes: [
                    '✅ Fixed 440 "Stream Errored (conflict)" reconnection loop with progressive backoff',
                    '✅ Suppressed startup message spam during reconnections',
                    '✅ Added conflict recovery mode with 30s stability timer',
                    '🔵 Anti-ViewOnce now supports 3 triggers: auto-detect, sticker/emoji reply, reaction',
                ]
            },
            {
                date: '2026-02-16',
                title: '⚡ Performance & Memory',
                changes: [
                    '✅ Removed Defibrillator class — replaced with lightweight memory monitor',
                    '✅ Event loop deep fix — eliminated all sync blockers (DiskManager, autoLink)',
                    '✅ Debounced saveCreds to prevent file write blocking',
                    '✅ Pre-imported all dynamic modules at startup',
                    '✅ Added session decryption recovery (smart signal key reset)',
                ]
            },
            {
                date: '2026-02-14',
                title: '🆕 Features & Integrations',
                changes: [
                    '🔵 Supabase database integration — dual-write JSON + PostgreSQL for cross-platform portability',
                    '🔵 13 database tables for all bot systems',
                    '🔵 W.O.L.F Chatbot whitelist system — per-group and per-DM control',
                    '✅ Fixed sudo system — sudos bypass silent mode with full owner access',
                    '✅ Fixed console logs — real phone numbers instead of LIDs',
                ]
            }
        ];

        let text = `╭─⌈ 🐺 *WOLFBOT — LATEST UPDATES* ⌋\n│\n`;

        for (const update of updates) {
            text += `├─⌈ 📅 *${update.date}* ⌋\n`;
            text += `│ ${update.title}\n│\n`;
            for (const change of update.changes) {
                text += `│ ${change}\n`;
            }
            text += `│\n`;
        }

        text += `├─⌈ 📊 *STATS* ⌋\n`;
        text += `│ • Total commands: 735+\n`;
        text += `│ • AI models: 7\n`;
        text += `│ • Logo styles: 30+\n`;
        text += `│ • Menu styles: 6\n`;
        text += `│ • Ethical Hacking tools: 44+\n│\n`;
        text += `╰───────────────\n`;
        text += `> *WOLFBOT*`;

        await sock.sendMessage(chatId, { text }, { quoted: msg });
    }
};
