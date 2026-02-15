export default {
    name: 'receipt',
    alias: ['readreceipt', 'readreceipts', 'bluetics', 'bluetick'],
    category: 'owner',
    description: 'Toggle WhatsApp read receipts on/off',
    ownerOnly: true,

    async execute(sock, msg, args, PREFIX, extra) {
        const chatId = msg.key.remoteJid;
        const { jidManager } = extra;

        const isSudoUser = extra?.isSudo ? extra.isSudo() : false;
        if (!jidManager.isOwner(msg) && !isSudoUser) {
            return sock.sendMessage(chatId, {
                text: '❌ *Owner Only Command*'
            }, { quoted: msg });
        }

        const action = args[0]?.toLowerCase();

        try {
            await sock.sendMessage(chatId, { react: { text: '⏳', key: msg.key } });

            if (action === 'on' || action === 'enable') {
                await sock.updateReadReceiptsPrivacy('all');
                await sock.sendMessage(chatId, {
                    text: `╭─⌈ ✅ *READ RECEIPTS* ⌋\n│\n│ ✧ *Status:* 🟢 ON\n│\n│ Blue ticks are now visible\n│ Others can see when you\n│ read their messages\n│\n╰───────────────`
                }, { quoted: msg });
                try { await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } }); } catch {}

            } else if (action === 'off' || action === 'disable') {
                await sock.updateReadReceiptsPrivacy('none');
                await sock.sendMessage(chatId, {
                    text: `╭─⌈ 🔴 *READ RECEIPTS* ⌋\n│\n│ ✧ *Status:* 🔴 OFF\n│\n│ Blue ticks are now hidden\n│ Others cannot see when you\n│ read their messages\n│\n│ ⚠️ You also won't see\n│ others' read receipts\n│\n╰───────────────`
                }, { quoted: msg });
                try { await sock.sendMessage(chatId, { react: { text: '🔴', key: msg.key } }); } catch {}

            } else {
                let currentStatus = 'Unknown';
                try {
                    const privacy = await sock.fetchPrivacySettings(true);
                    const rr = privacy.readreceipts || privacy.readReceipts;
                    currentStatus = (rr === 'all' || rr === true) ? '🟢 ON' : '🔴 OFF';
                } catch {}

                await sock.sendMessage(chatId, {
                    text: `╭─⌈ ✅ *READ RECEIPTS* ⌋\n│\n│ ✧ *Current:* ${currentStatus}\n│\n│ 💡 *Usage:*\n│ • \`${PREFIX}receipt on\`\n│ • \`${PREFIX}receipt off\`\n│\n╰───────────────`
                }, { quoted: msg });
                try { await sock.sendMessage(chatId, { react: { text: '📋', key: msg.key } }); } catch {}
            }

        } catch (error) {
            console.error('[Receipt] Error:', error);
            await sock.sendMessage(chatId, {
                text: `❌ *Failed to update read receipts*\n\n${error.message}\n\n💡 This feature requires Baileys support for privacy updates.`
            }, { quoted: msg });
            try { await sock.sendMessage(chatId, { react: { text: '❌', key: msg.key } }); } catch {}
        }
    }
};
