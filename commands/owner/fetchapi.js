import { getCommandInfo } from '../../lib/apiRegistry.js';
import { getBotName } from '../../lib/botname.js';

export default {
    name: 'fetchapi',
    aliases: ['testapi', 'pingapi'],
    category: 'owner',
    desc: 'Fetch a command API and show the raw JSON response',
    usage: '.fetchapi <command>',
    ownerOnly: true,

    async execute(sock, msg, args, PREFIX, extra) {
        const chatJid = msg.key.remoteJid;
        const reply = (text) => sock.sendMessage(chatJid, { text }, { quoted: msg });
        const BOT_NAME = extra?.BOT_NAME || getBotName() || 'WOLFBOT';
        const cmdName = (args[0] || '').toLowerCase().trim();

        if (!cmdName) {
            await reply(
                `╭─⌈ 📡 *FETCH API* ⌋\n` +
                `│\n` +
                `├─⊷ *Usage:* ${PREFIX}fetchapi <command>\n` +
                `├─⊷ *Example:* ${PREFIX}fetchapi ytmp3\n` +
                `│\n` +
                `├─⊷ Fetches the command's API URL\n` +
                `├─⊷ Shows HTTP status, latency & JSON response\n` +
                `│\n` +
                `╰⊷ *Powered by ${BOT_NAME.toUpperCase()}*`
            );
            return;
        }

        const info = getCommandInfo(cmdName);
        if (!info) {
            await reply(
                `❌ No API registered for *${cmdName}*.\n\n` +
                `Use *${PREFIX}getapi* to see all commands with APIs.`
            );
            return;
        }

        await reply(`⏳ *Fetching API...*\n\n📦 Command: ${PREFIX}${cmdName}\n🔗 URL: ${info.currentUrl}`);

        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 10000);
            const start = Date.now();

            let responseData = null;
            let status = 0;
            let ok = false;

            try {
                const res = await fetch(info.currentUrl, {
                    method: 'GET',
                    signal: controller.signal,
                    headers: { 'User-Agent': 'WolfBot/1.0', Accept: 'application/json' }
                });
                status = res.status;
                ok = res.ok || res.status < 500;
                const contentType = res.headers.get('content-type') || '';
                if (contentType.includes('application/json') || contentType.includes('text')) {
                    responseData = await res.text();
                } else {
                    responseData = `[Binary / non-text response — Content-Type: ${contentType}]`;
                }
            } finally {
                clearTimeout(timer);
            }

            const ms = Date.now() - start;
            const speedTag = ms < 500 ? '🟢 Fast' : ms < 1500 ? '🟡 Normal' : '🔴 Slow';
            const statusEmoji = ok ? '✅' : '❌';

            let prettyJson = responseData;
            try {
                prettyJson = JSON.stringify(JSON.parse(responseData), null, 2);
            } catch {}

            const maxLen = 3000;
            const truncated = prettyJson.length > maxLen;
            const display = truncated ? prettyJson.slice(0, maxLen) + '\n...[truncated]' : prettyJson;

            await reply(
                `╭─⌈ 📡 *API RESPONSE — ${cmdName.toUpperCase()}* ⌋\n` +
                `│\n` +
                `├─⊷ 📦 *Command:* ${PREFIX}${cmdName}\n` +
                `├─⊷ 🔗 *URL:* ${info.currentUrl}\n` +
                `│\n` +
                `├─⊷ ${statusEmoji} *HTTP Status:* ${status}\n` +
                `├─⊷ ⚡ *Latency:* ${ms}ms (${speedTag})\n` +
                `├─⊷ ${ok ? '🟢 *API is ONLINE*' : '🔴 *API may be DOWN*'}\n` +
                (info.isOverridden ? `├─⊷ 🔄 *Using override* (not default)\n` : '') +
                `│\n` +
                `╰⊷ *JSON Response:*\n\n` +
                `\`\`\`\n${display}\n\`\`\``
            );
        } catch (err) {
            const isTimeout = err.name === 'AbortError';
            await reply(
                `╭─⌈ 📡 *API RESPONSE — ${cmdName.toUpperCase()}* ⌋\n` +
                `│\n` +
                `├─⊷ 📦 *Command:* ${PREFIX}${cmdName}\n` +
                `├─⊷ 🔗 *URL:* ${info.currentUrl}\n` +
                `│\n` +
                `├─⊷ ❌ *Status:* ${isTimeout ? 'Timed out (10s)' : 'Unreachable'}\n` +
                `├─⊷ 💬 *Error:* ${err.message}\n` +
                `├─⊷ 🔴 *API appears to be DOWN*\n` +
                `│\n` +
                `├─⊷ 💡 *Fix:* ${PREFIX}replaceapi ${cmdName} <newurl>\n` +
                `│\n` +
                `╰⊷ *Powered by ${BOT_NAME.toUpperCase()}*`
            );
        }
    }
};
