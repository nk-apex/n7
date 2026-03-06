export default {
    name: 'mygroups',
    alias: ['grouplist', 'listgroups', 'groups'],
    description: 'List all groups the bot is currently in',
    category: 'owner',
    ownerOnly: true,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;

        await sock.sendMessage(chatId, {
            text: `╭─⌈ 👥 *MY GROUPS* ⌋\n│\n├─⊷ 🔄 Fetching group list...\n╰───`
        }, { quoted: msg });

        let groups;
        try {
            groups = await sock.groupFetchAllParticipating();
        } catch (err) {
            return sock.sendMessage(chatId, {
                text: `╭─⌈ ❌ *MY GROUPS* ⌋\n│\n├─⊷ Failed to fetch groups.\n├─⊷ ${err.message}\n╰───`
            }, { quoted: msg });
        }

        const entries = Object.values(groups || {});

        if (!entries.length) {
            return sock.sendMessage(chatId, {
                text: `╭─⌈ 👥 *MY GROUPS* ⌋\n│\n├─⊷ ℹ️ Not in any groups yet.\n╰───`
            }, { quoted: msg });
        }

        // Sort alphabetically by group subject (name)
        entries.sort((a, b) => (a.subject || '').localeCompare(b.subject || ''));

        // Split into pages of 20 so the message doesn't get too long
        const PAGE_SIZE = 20;
        const page = Math.max(1, parseInt(args[0]) || 1);
        const totalPages = Math.ceil(entries.length / PAGE_SIZE);
        const pageIndex = Math.min(page, totalPages) - 1;
        const slice = entries.slice(pageIndex * PAGE_SIZE, pageIndex * PAGE_SIZE + PAGE_SIZE);

        let text = `╭─⌈ 👥 *MY GROUPS* ⌋\n│\n`;
        text += `│  📊 Total: *${entries.length}* group${entries.length !== 1 ? 's' : ''}\n`;

        if (totalPages > 1) {
            text += `│  📄 Page: *${pageIndex + 1}/${totalPages}*\n`;
        }

        text += `│\n`;

        slice.forEach((g, i) => {
            const num  = pageIndex * PAGE_SIZE + i + 1;
            const name = g.subject || 'Unnamed Group';
            text += `├─⊷ *${num}.* ${name}\n`;
        });

        text += `│\n`;

        if (totalPages > 1) {
            text += `├─⊷ Next page: *.mygroups ${pageIndex + 2 <= totalPages ? pageIndex + 2 : 1}*\n`;
        }

        text += `╰───`;

        return sock.sendMessage(chatId, { text }, { quoted: msg });
    }
};
