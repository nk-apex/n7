export default {
    name: 'viewer',
    alias: ['statusviewer', 'statusview', 'statusprivacy', 'viewstatus'],
    category: 'owner',
    description: 'Toggle who can view your WhatsApp status',
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

            if (action === 'everyone' || action === 'all') {
                await sock.updateStatusPrivacy('all');
                await sock.sendMessage(chatId, {
                    text: `╭─⌈ 📊 *STATUS VIEWER PRIVACY* ⌋\n│\n│ ✧ *Visibility:* 🌍 Everyone\n│\n│ Anyone can view your\n│ WhatsApp status updates\n│\n╰───────────────`
                }, { quoted: msg });
                try { await sock.sendMessage(chatId, { react: { text: '🌍', key: msg.key } }); } catch {}

            } else if (action === 'contacts') {
                await sock.updateStatusPrivacy('contacts');
                await sock.sendMessage(chatId, {
                    text: `╭─⌈ 📊 *STATUS VIEWER PRIVACY* ⌋\n│\n│ ✧ *Visibility:* 👥 Contacts Only\n│\n│ Only your contacts can\n│ view your status updates\n│\n╰───────────────`
                }, { quoted: msg });
                try { await sock.sendMessage(chatId, { react: { text: '👥', key: msg.key } }); } catch {}

            } else if (action === 'except') {
                await sock.updateStatusPrivacy('contact_blacklist');
                await sock.sendMessage(chatId, {
                    text: `╭─⌈ 📊 *STATUS VIEWER PRIVACY* ⌋\n│\n│ ✧ *Visibility:* 🚫 Contacts Except...\n│\n│ Your contacts can view status\n│ except those you've excluded\n│\n│ ⚠️ Manage exclusion list\n│ through WhatsApp app settings\n│\n╰───────────────`
                }, { quoted: msg });
                try { await sock.sendMessage(chatId, { react: { text: '🚫', key: msg.key } }); } catch {}

            } else if (action === 'none' || action === 'nobody') {
                await sock.updateStatusPrivacy('none');
                await sock.sendMessage(chatId, {
                    text: `╭─⌈ 📊 *STATUS VIEWER PRIVACY* ⌋\n│\n│ ✧ *Visibility:* 🔒 Nobody\n│\n│ No one can view your\n│ WhatsApp status updates\n│\n╰───────────────`
                }, { quoted: msg });
                try { await sock.sendMessage(chatId, { react: { text: '🔒', key: msg.key } }); } catch {}

            } else {
                let currentStatus = 'Unknown';
                try {
                    const privacy = await sock.fetchPrivacySettings(true);
                    const sp = privacy.status || privacy.statusPrivacy;
                    if (sp === 'all') currentStatus = '🌍 Everyone';
                    else if (sp === 'contacts') currentStatus = '👥 Contacts';
                    else if (sp === 'contact_blacklist') currentStatus = '🚫 Contacts Except...';
                    else if (sp === 'none') currentStatus = '🔒 Nobody';
                    else currentStatus = sp || 'Unknown';
                } catch {}

                await sock.sendMessage(chatId, {
                    text: `╭─⌈ 📊 *STATUS VIEWER PRIVACY* ⌋\n│\n│ ✧ *Current:* ${currentStatus}\n│\n│ 💡 *Usage:*\n│ • \`${PREFIX}viewer everyone\`\n│ • \`${PREFIX}viewer contacts\`\n│ • \`${PREFIX}viewer except\`\n│ • \`${PREFIX}viewer nobody\`\n│\n╰───────────────`
                }, { quoted: msg });
                try { await sock.sendMessage(chatId, { react: { text: '📋', key: msg.key } }); } catch {}
            }

        } catch (error) {
            console.error('[Viewer] Error:', error);
            await sock.sendMessage(chatId, {
                text: `❌ *Failed to update status privacy*\n\n${error.message}`
            }, { quoted: msg });
            try { await sock.sendMessage(chatId, { react: { text: '❌', key: msg.key } }); } catch {}
        }
    }
};
