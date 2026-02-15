import fs from 'fs';

const PREFERENCES_FILE = './vv_preferences.json';

function loadPreferences() {
    try {
        if (fs.existsSync(PREFERENCES_FILE)) {
            return JSON.parse(fs.readFileSync(PREFERENCES_FILE, 'utf8'));
        }
    } catch {}
    return [];
}

function savePreferences(prefs) {
    try {
        fs.writeFileSync(PREFERENCES_FILE, JSON.stringify(prefs, null, 2));
    } catch {}
}

export default {
    name: 'setvvcaption',
    alias: ['vvcaption', 'viewoncecaption'],
    category: 'utility',
    description: 'Set custom caption for view-once downloads',

    async execute(sock, msg, args, PREFIX) {
        const chatId = msg.key.remoteJid;

        if (!args[0]) {
            const prefs = loadPreferences();
            const existing = prefs.find(p => p.chatId === chatId);
            const current = existing?.customCaption || 'Retrieved by WOLFBOT';

            return sock.sendMessage(chatId, {
                text: `📝 *View-Once Caption Settings*\n\nCurrent caption: "${current}"\n\n*Usage:*\n• \`${PREFIX}setvvcaption My custom text\` - Set caption\n• \`${PREFIX}setvvcaption reset\` - Reset to default\n• \`${PREFIX}setvvcaption none\` - Disable caption`
            }, { quoted: msg });
        }

        const newCaption = args.join(' ');
        const prefs = loadPreferences();
        const idx = prefs.findIndex(p => p.chatId === chatId);

        let captionValue = newCaption;
        let displayText = '';

        if (newCaption.toLowerCase() === 'reset') {
            captionValue = 'Retrieved by WOLFBOT';
            displayText = 'Reset to default: "Retrieved by WOLFBOT"';
        } else if (newCaption.toLowerCase() === 'none') {
            captionValue = '';
            displayText = 'Caption disabled';
        } else {
            displayText = `Set to: "${captionValue}"`;
        }

        if (idx >= 0) {
            prefs[idx].customCaption = captionValue;
        } else {
            prefs.push({
                chatId,
                customCaption: captionValue,
                showSenderInfo: true,
                showFileInfo: true,
                showOriginalCaption: true
            });
        }

        savePreferences(prefs);

        await sock.sendMessage(chatId, {
            text: `✅ *VV Caption Updated*\n\n${displayText}\n\nThis will be shown on all downloaded view-once media.`
        }, { quoted: msg });
    }
};
