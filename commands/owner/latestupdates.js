export default {
    name: 'latestupdates',
    alias: ['updates', 'newcommands', 'changelog', 'whatsnew', 'latestcmds'],
    description: 'Show latest bot updates, new commands and fixes',
    category: 'owner',

    async execute(sock, msg, args, PREFIX, extra) {
        const chatId = msg.key.remoteJid;

        const updates = [
            {
                date: '2026-02-14',
                title: '🔧 Bug Fixes & Improvements',
                changes: [
                    '✅ Fixed ImgBB command — replaced verbose processing messages with clean reaction emojis (⏳📤✅❌)',
                    '✅ Fixed ImgBB & ShortURL — added native interactive copy buttons',
                    '✅ Fixed Pair command — clean output with copy button for pair code',
                    '✅ Fixed Menu Style 6 — restored full > fading effect on all sections',
                    '✅ Fixed AntiStatusMention — improved status detection with groupMentions support',
                    '✅ Fixed ToStatus command — proper status posting to status@broadcast',
                    '✅ Fixed Sudo system — sudos now bypass silent mode with full owner access',
                    '✅ Fixed Console logs — all commands now show real phone numbers instead of LIDs',
                ]
            },
            {
                date: '2026-02-13',
                title: '🆕 New Commands & Features',
                changes: [
                    '🔵 Interactive Buttons — native Baileys interactive messages for copy/URL buttons',
                    '🔵 Pair Command — generate WhatsApp pairing codes with copy button',
                    '🔵 ImgBB Upload — image hosting with thumbnail preview and copy URL button',
                    '🔵 ShortURL — URL shortening with interactive copy button',
                    '🔵 Sudo System — addsudo, delsudo, listsudo, checksudo, clearsudo, sudomode, sudoinfo',
                    '🔵 Persistent Warnings — per-group warn system survives bot restarts',
                    '🔵 AntiStatusMention — detect group mentions in WhatsApp statuses',
                    '🔵 ToStatus — post text/images/videos to your WhatsApp status',
                    '🔵 JARVIS Voice AI — GPT-5 powered voice responses with robotic effects',
                    '🔵 W.O.L.F Chatbot — multi-AI with GPT-5, Copilot, Claude, Grok fallback',
                ]
            },
            {
                date: '2026-02-12',
                title: '⚙️ System & Architecture',
                changes: [
                    '🟢 Moved source modules from data/ to lib/ for Pterodactyl deployment',
                    '🟢 Bot Mode system — public, groups, dms, silent modes',
                    '🟢 Antidelete system — always active with private/public modes',
                    '🟢 Anti-ViewOnce — reveal view-once messages automatically',
                    '🟢 Welcome/Goodbye system — customizable per-group messages',
                    '🟢 Anti-Demote/Promote — warn, kick, or revert actions',
                    '🟢 Autotyping system — configurable typing indicators',
                    '🟢 30+ Logo generators with Silent Wolf watermark',
                ]
            }
        ];

        let text = `🆕 *SILENT WOLFBOT — LATEST UPDATES*\n`;
        text += `━━━━━━━━━━━━━━━━━━\n\n`;

        for (const update of updates) {
            text += `📅 *${update.date}*\n`;
            text += `${update.title}\n\n`;
            for (const change of update.changes) {
                text += `${change}\n`;
            }
            text += `\n━━━━━━━━━━━━━━━━━━\n\n`;
        }

        text += `📊 *STATS*\n`;
        text += `• Total commands: 150+\n`;
        text += `• AI models: 7 (GPT-5, Copilot, Claude, Grok, Blackbox, Bard, Perplexity)\n`;
        text += `• Logo styles: 30+\n`;
        text += `• Menu styles: 6\n\n`;
        text += `💡 Use \`${PREFIX}menu\` to see all commands\n`;
        text += `🐺🌕 *POWERED BY WOLF TECH* 🌕🐺`;

        await sock.sendMessage(chatId, { text }, { quoted: msg });
    }
};
