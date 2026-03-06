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

        // Resolve the best available name for each group.
        // groupFetchAllParticipating() sometimes returns a blank or stale subject,
        // so we also check the live groupMetadataCache and fall back to a direct
        // sock.groupMetadata() fetch for any group still missing a name.
        const metaCache = globalThis.groupMetadataCache;

        const resolved = await Promise.all(entries.map(async (g) => {
            let name = (g.subject || '').trim();

            // Check the live metadata cache first
            if (!name && metaCache) {
                const cached = metaCache.get(g.id);
                if (cached?.data?.subject) name = cached.data.subject.trim();
            }

            // If still missing, do a direct fetch for this group
            if (!name) {
                try {
                    const meta = await sock.groupMetadata(g.id);
                    if (meta?.subject) name = meta.subject.trim();
                } catch {}
            }

            return { id: g.id, name: name || 'Unnamed Group' };
        }));

        // Sort alphabetically
        resolved.sort((a, b) => a.name.localeCompare(b.name));

        // Paginate at 20 per page
        const PAGE_SIZE = 20;
        const page = Math.max(1, parseInt(args[0]) || 1);
        const totalPages = Math.ceil(resolved.length / PAGE_SIZE);
        const pageIndex = Math.min(page, totalPages) - 1;
        const slice = resolved.slice(pageIndex * PAGE_SIZE, pageIndex * PAGE_SIZE + PAGE_SIZE);

        let text = `╭─⌈ 👥 *MY GROUPS* ⌋\n│\n`;
        text += `│  📊 Total: *${resolved.length}* group${resolved.length !== 1 ? 's' : ''}\n`;

        if (totalPages > 1) {
            text += `│  📄 Page: *${pageIndex + 1}/${totalPages}*\n`;
        }

        text += `│\n`;

        slice.forEach((g, i) => {
            const num = pageIndex * PAGE_SIZE + i + 1;
            text += `├─⊷ *${num}.* ${g.name}\n`;
        });

        text += `│\n`;

        if (totalPages > 1) {
            text += `├─⊷ Next page: *.mygroups ${pageIndex + 2 <= totalPages ? pageIndex + 2 : 1}*\n`;
        }

        text += `╰───`;

        return sock.sendMessage(chatId, { text }, { quoted: msg });
    }
};
