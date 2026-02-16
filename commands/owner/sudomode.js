import { getSudoMode, setSudoMode, getSudoCount } from '../../lib/sudo-store.js';

export default {
    name: 'sudomode',
    alias: ['sudoonly'],
    category: 'owner',
    description: 'Enable/disable sudo-only mode (only owner + sudo users can use bot)',
    ownerOnly: true,
    sudoAllowed: false,

    async execute(sock, msg, args, PREFIX, extra) {
        const chatId = msg.key.remoteJid;
        const { jidManager } = extra;

        if (!jidManager.isOwner(msg)) {
            return sock.sendMessage(chatId, {
                text: '❌ *Owner Only Command!*\n\nOnly the bot owner can toggle sudo mode.'
            }, { quoted: msg });
        }

        const currentMode = getSudoMode();

        if (!args[0]) {
            return sock.sendMessage(chatId, {
                text: `╭─⌈ 🔧 *SUDO MODE* ⌋\n│\n│ 📊 Current: ${currentMode ? '✅ ON' : '❌ OFF'}\n│ 👥 Sudo Users: ${getSudoCount()}\n│\n├─⊷ *${PREFIX}sudomode on*\n│  └⊷ Only owner & sudo can use bot\n├─⊷ *${PREFIX}sudomode off*\n│  └⊷ Normal mode\n│\n╰───────────────`
            }, { quoted: msg });
        }

        const action = args[0].toLowerCase();

        if (action !== 'on' && action !== 'off') {
            return sock.sendMessage(chatId, {
                text: `╭─⌈ ❌ *INVALID OPTION* ⌋\n│\n├─⊷ *${PREFIX}sudomode on/off*\n│  └⊷ Toggle sudo mode\n│\n╰───────────────`
            }, { quoted: msg });
        }

        const enabled = action === 'on';

        if (enabled === currentMode) {
            return sock.sendMessage(chatId, {
                text: `ℹ️ Sudo mode is already ${enabled ? 'ON' : 'OFF'}`
            }, { quoted: msg });
        }

        setSudoMode(enabled);

        const sudoCount = getSudoCount();

        await sock.sendMessage(chatId, {
            text: `✅ *Sudo Mode ${enabled ? 'Enabled' : 'Disabled'}*\n\n${enabled ? `🔒 Only the owner and ${sudoCount} sudo user(s) can now use the bot.\n\n_All other users will be blocked from using commands._` : '🔓 Bot is back to normal mode.\n\n_All users can use commands based on current bot mode._'}`
        }, { quoted: msg });
    }
};
