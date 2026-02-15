import fs from 'fs';

export default {
    name: 'privacy',
    alias: ['privacysettings', 'myprivacy', 'privacyinfo'],
    category: 'owner',
    description: 'View WhatsApp privacy settings',
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

        try {
            await sock.sendMessage(chatId, { react: { text: '🔒', key: msg.key } });
        } catch {}

        try {
            let privacySettings = {};
            try {
                privacySettings = await sock.fetchPrivacySettings(true);
            } catch {
                try {
                    privacySettings = await sock.fetchPrivacySettings();
                } catch {}
            }

            const presenceConfig = { enabled: false };
            try {
                if (fs.existsSync('./data/presence/config.json')) {
                    Object.assign(presenceConfig, JSON.parse(fs.readFileSync('./data/presence/config.json', 'utf8')));
                }
            } catch {}

            const formatSetting = (value) => {
                if (!value) return '❓ Unknown';
                switch (value.toString().toLowerCase()) {
                    case 'all': return '🌍 Everyone';
                    case 'contacts': return '👥 My Contacts';
                    case 'contact_blacklist': return '🚫 Contacts Except...';
                    case 'none': return '🔒 Nobody';
                    case 'match_last_seen': return '🔄 Match Last Seen';
                    default: return `⚙️ ${value}`;
                }
            };

            const lastSeen = privacySettings.last || privacySettings.lastSeen || 'Unknown';
            const profilePic = privacySettings.profile || privacySettings.profilePicture || 'Unknown';
            const statusPrivacy = privacySettings.status || privacySettings.statusPrivacy || 'Unknown';
            const readReceipts = privacySettings.readreceipts || privacySettings.readReceipts || 'Unknown';
            const groupAdd = privacySettings.groupadd || privacySettings.groupAdd || 'Unknown';
            const onlineStatus = privacySettings.online || privacySettings.onlinePrivacy || 'Unknown';

            let text = `╭─⌈ 🔒 *PRIVACY SETTINGS* ⌋\n`;
            text += `│\n`;
            text += `├─⊷ *👁️ Last Seen*\n`;
            text += `│  └⊷ ${formatSetting(lastSeen)}\n`;
            text += `│\n`;
            text += `├─⊷ *🟢 Online Status*\n`;
            text += `│  └⊷ ${formatSetting(onlineStatus)}\n`;
            text += `│\n`;
            text += `├─⊷ *🖼️ Profile Picture*\n`;
            text += `│  └⊷ ${formatSetting(profilePic)}\n`;
            text += `│\n`;
            text += `├─⊷ *📊 Status Visibility*\n`;
            text += `│  └⊷ ${formatSetting(statusPrivacy)}\n`;
            text += `│\n`;
            text += `├─⊷ *✅ Read Receipts*\n`;
            text += `│  └⊷ ${readReceipts === 'all' || readReceipts === true ? '🟢 ON' : readReceipts === 'none' || readReceipts === false ? '🔴 OFF' : formatSetting(readReceipts)}\n`;
            text += `│\n`;
            text += `├─⊷ *👥 Group Add*\n`;
            text += `│  └⊷ ${formatSetting(groupAdd)}\n`;
            text += `│\n`;
            text += `├─⊷ *🟢 Always Online Bot*\n`;
            text += `│  └⊷ ${presenceConfig.enabled ? '✅ ACTIVE' : '❌ INACTIVE'}\n`;
            text += `│\n`;
            text += `├─⊷ *🔧 Quick Commands*\n`;
            text += `│ • \`${PREFIX}online\` - Toggle always online\n`;
            text += `│ • \`${PREFIX}receipt\` - Toggle read receipts\n`;
            text += `│ • \`${PREFIX}profilepic\` - Profile pic privacy\n`;
            text += `│ • \`${PREFIX}viewer\` - Status viewer privacy\n`;
            text += `│\n`;
            text += `╰───────────────`;

            await sock.sendMessage(chatId, { text }, { quoted: msg });

        } catch (error) {
            console.error('[Privacy] Error:', error);
            await sock.sendMessage(chatId, {
                text: `❌ *Failed to fetch privacy settings*\n\n${error.message}`
            }, { quoted: msg });
        }
    }
};
