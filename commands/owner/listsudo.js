import { getSudoList, getSudoMode } from '../../lib/sudo-store.js';

export default {
    name: 'listsudo',
    alias: ['sudolist', 'sudos'],
    category: 'owner',
    description: 'Show all sudo users',
    ownerOnly: true,

    async execute(sock, msg, args, PREFIX, extra) {
        const chatId = msg.key.remoteJid;

        const { sudoers, addedAt } = getSudoList();
        const sudomode = getSudoMode();

        if (sudoers.length === 0) {
            return sock.sendMessage(chatId, {
                text: `╭─⌈ 📋 *SUDO LIST* ⌋\n│\n├─⊷ *${PREFIX}addsudo <number>*\n│  └⊷ Add sudo user\n╰───`
            }, { quoted: msg });
        }

        let list = `┌─── *SUDO USERS* ───\n`;
        list += `│\n`;

        sudoers.forEach((num, i) => {
            const date = addedAt[num] ? new Date(addedAt[num]).toLocaleDateString() : 'Unknown';
            list += `│ ${i + 1}. +${num}\n`;
            list += `│    📅 Added: ${date}\n`;
        });

        list += `│\n`;
        list += `├─── *STATUS* ───\n`;
        list += `│ 👥 Total: ${sudoers.length} sudo user(s)\n`;
        list += `│ 🔧 Sudo Mode: ${sudomode ? '✅ ON' : '❌ OFF'}\n`;
        list += `└──────────────`;

        await sock.sendMessage(chatId, { text: list }, { quoted: msg });
    }
};
