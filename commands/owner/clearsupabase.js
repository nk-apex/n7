import supabase from '../../lib/supabase.js';

export default {
    name: 'clearsupabase',
    alias: ['clearsupa', 'clearcloud', 'wipesupa', 'wipesupabase'],
    category: 'owner',
    description: 'Clear all antidelete data from Supabase (database records + stored media files)',
    ownerOnly: true,

    async execute(sock, msg, args, PREFIX, extra) {
        const chatId = msg.key.remoteJid;

        if (!supabase.isAvailable()) {
            await sock.sendMessage(chatId, {
                text: `❌ Supabase is not connected. Cannot clear data.`
            }, { quoted: msg });
            return;
        }

        await sock.sendMessage(chatId, {
            text: `⏳ Clearing all antidelete data from Supabase...\n\n🗃️ Deleting database records...\n📦 Deleting stored media files...`
        }, { quoted: msg });

        const startTime = Date.now();
        const results = await supabase.clearAllAntideleteData();
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

        let statusText = `🗑️ *Supabase Antidelete Cleanup Complete*\n\n`;
        statusText += `⏱️ Time: ${elapsed}s\n`;
        statusText += `🗃️ DB Records Cleared: ${results.tables}\n`;
        statusText += `📦 Media Files Deleted: ${results.files}\n`;

        if (results.errors.length > 0) {
            statusText += `\n⚠️ *Errors:*\n`;
            for (const err of results.errors) {
                statusText += `  • ${err}\n`;
            }
        } else {
            statusText += `\n✅ All antidelete data wiped from Supabase successfully!`;
        }

        await sock.sendMessage(chatId, { text: statusText }, { quoted: msg });
        console.log(`🗑️ [CLEARSUPABASE] Cleared ${results.tables} records, ${results.files} files in ${elapsed}s`);
    }
};
