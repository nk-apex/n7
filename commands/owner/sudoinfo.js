import { getSudoList, getSudoMode, getSudoCount } from '../../lib/sudo-store.js';

export default {
    name: 'sudoinfo',
    alias: ['sudostatus', 'sudosystem'],
    category: 'owner',
    description: 'Show sudo system information',
    ownerOnly: true,

    async execute(sock, msg, args, PREFIX, extra) {
        const chatId = msg.key.remoteJid;

        const { sudoers, addedAt } = getSudoList();
        const sudomode = getSudoMode();
        const count = getSudoCount();
        const ownerNumber = extra.OWNER_NUMBER?.split(':')[0] || 'Not set';

        let info = `┌─── *SUDO SYSTEM INFO* ───\n`;
        info += `│\n`;
        info += `│ 👑 *Owner:* +${ownerNumber}\n`;
        info += `│ 👥 *Sudo Users:* ${count}\n`;
        info += `│ 🔧 *Sudo Mode:* ${sudomode ? '✅ ON (Sudo-only)' : '❌ OFF (Normal)'}\n`;
        info += `│\n`;
        info += `├─── *PERMISSIONS* ───\n`;
        info += `│ ✅ Sudo users can use owner commands\n`;
        info += `│ ✅ Sudo users bypass bot mode restrictions\n`;
        info += `│ ❌ Sudo users cannot add/remove other sudos\n`;
        info += `│ ❌ Sudo users cannot change sudo mode\n`;
        info += `│ ❌ Sudo users cannot clear sudo list\n`;
        info += `│\n`;
        info += `├─── *COMMANDS* ───\n`;
        info += `│ \`${PREFIX}addsudo <number>\`\n`;
        info += `│ \`${PREFIX}delsudo <number>\`\n`;
        info += `│ \`${PREFIX}listsudo\`\n`;
        info += `│ \`${PREFIX}checksudo <number>\`\n`;
        info += `│ \`${PREFIX}clearsudo\`\n`;
        info += `│ \`${PREFIX}sudomode on/off\`\n`;
        info += `│ \`${PREFIX}sudoinfo\`\n`;
        info += `│\n`;

        if (count > 0) {
            info += `├─── *ACTIVE SUDOS* ───\n`;
            sudoers.forEach((num, i) => {
                const date = addedAt[num] ? new Date(addedAt[num]).toLocaleDateString() : '?';
                info += `│ ${i + 1}. +${num} (${date})\n`;
            });
            info += `│\n`;
        }

        info += `└──────────────`;

        await sock.sendMessage(chatId, { text: info }, { quoted: msg });
    }
};
