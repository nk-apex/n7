export default {
    name: 'clearsupabase',
    alias: ['clearsupa', 'clearcloud', 'wipesupa', 'wipesupabase', 'clearmedia', 'wipemedia'],
    category: 'owner',
    description: 'Clear all cached antidelete media data from JSON storage',
    ownerOnly: true,

    async execute(sock, msg, args, PREFIX, extra) {
        const chatId = msg.key.remoteJid;

        await sock.sendMessage(chatId, {
            text: `⏳ Clearing all cached antidelete media from JSON storage...`
        }, { quoted: msg });

        const startTime = Date.now();
        let clearedMessages = 0;
        let clearedMedia = 0;
        let clearedStatusMedia = 0;

        try {
            const fs = await import('fs/promises');
            const path = await import('path');

            const adCacheFile = './data/antidelete/antidelete.json';
            if (await fs.access(adCacheFile).then(() => true).catch(() => false)) {
                const data = JSON.parse(await fs.readFile(adCacheFile, 'utf8'));
                if (data.mediaCache) {
                    clearedMedia = Array.isArray(data.mediaCache) ? data.mediaCache.length : 0;
                    data.mediaCache = [];
                }
                if (data.messageCache) {
                    clearedMessages = Array.isArray(data.messageCache) ? data.messageCache.length : 0;
                    data.messageCache = [];
                }
                await fs.writeFile(adCacheFile, JSON.stringify(data));
            }

            const statusCacheFile = './data/antidelete/status/status_cache.json';
            if (await fs.access(statusCacheFile).then(() => true).catch(() => false)) {
                const data = JSON.parse(await fs.readFile(statusCacheFile, 'utf8'));
                if (data.mediaCache) {
                    clearedStatusMedia = Array.isArray(data.mediaCache) ? data.mediaCache.length : 0;
                    data.mediaCache = [];
                }
                if (data.statusCache) {
                    data.statusCache = [];
                }
                if (data.deletedStatusCache) {
                    data.deletedStatusCache = [];
                }
                await fs.writeFile(statusCacheFile, JSON.stringify(data, null, 2));
            }

            const mediaDir = './data/antidelete/media';
            try {
                const files = await fs.readdir(mediaDir);
                for (const file of files) {
                    await fs.unlink(path.join(mediaDir, file)).catch(() => {});
                }
            } catch {}

            const statusMediaDir = './data/antidelete/status/media';
            try {
                const files = await fs.readdir(statusMediaDir);
                for (const file of files) {
                    await fs.unlink(path.join(statusMediaDir, file)).catch(() => {});
                }
            } catch {}

        } catch (err) {
            await sock.sendMessage(chatId, {
                text: `❌ Error clearing data: ${err.message}`
            }, { quoted: msg });
            return;
        }

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

        let statusText = `🗑️ *Antidelete Media Cleanup Complete*\n\n`;
        statusText += `⏱️ Time: ${elapsed}s\n`;
        statusText += `💬 Messages Cleared: ${clearedMessages}\n`;
        statusText += `🖼️ Media Cleared: ${clearedMedia}\n`;
        statusText += `📊 Status Media Cleared: ${clearedStatusMedia}\n`;
        statusText += `🧹 Old local files cleaned\n`;
        statusText += `\n✅ All antidelete cache wiped successfully!\n`;
        statusText += `\n_Bot will rebuild cache as new messages arrive._`;

        await sock.sendMessage(chatId, { text: statusText }, { quoted: msg });
        console.log(`🗑️ [CLEARMEDIA] Cleared ${clearedMessages} msgs, ${clearedMedia} media, ${clearedStatusMedia} status media in ${elapsed}s`);
    }
};
