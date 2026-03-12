import { getCommandInfo, getAllApiCommands } from '../../lib/apiRegistry.js';
import { getBotName } from '../../lib/botname.js';
import { createRequire } from 'module';
const _require = createRequire(import.meta.url);
let _giftedBtns = null;
try { _giftedBtns = _require('gifted-btns'); } catch {}

export default {
    name: 'getapi',
    aliases: ['apiinfo', 'checkapi'],
    category: 'owner',
    desc: 'View the API endpoint used by a specific command and auto-fetch its response',
    usage: '.getapi <command> | .getapi (list all)',
    ownerOnly: true,

    async execute(sock, msg, args, PREFIX, extra) {
        const chatJid = msg.key.remoteJid;
        const reply = (text) => sock.sendMessage(chatJid, { text }, { quoted: msg });
        const BOT_NAME = extra?.BOT_NAME || getBotName() || 'WOLFBOT';
        const cmdName = (args[0] || '').toLowerCase().trim();

        if (!cmdName) {
            const all = getAllApiCommands();
            const grouped = {};
            for (const { cmd, label, category } of all) {
                if (!grouped[category]) grouped[category] = [];
                grouped[category].push({ cmd, label });
            }
            let text = `╭─⌈ 🌐 *API REGISTRY* ⌋\n│\n`;
            for (const [cat, cmds] of Object.entries(grouped)) {
                text += `├─⊷ *${cat.toUpperCase()}*\n`;
                for (const { cmd, label } of cmds) {
                    text += `│   └⊷ *${PREFIX}${cmd}* — ${label}\n`;
                }
                text += `│\n`;
            }
            text += `├─⊷ 💡 *Usage:* ${PREFIX}getapi <command>\n`;
            text += `╰⊷ *Powered by ${BOT_NAME.toUpperCase()}*`;
            await reply(text);
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

        const statusTag = info.isOverridden ? '🔄 *OVERRIDDEN*' : '✅ *DEFAULT*';
        const overrideLine = info.isOverridden
            ? `├─⊷ 🔁 *Default:*\n│   └⊷ ${info.defaultUrl}\n│\n`
            : '';

        const infoText =
            `╭─⌈ 🌐 *API INFO — ${cmdName.toUpperCase()}* ⌋\n` +
            `│\n` +
            `├─⊷ 📦 *Command:* ${PREFIX}${info.cmd}\n` +
            `├─⊷ 📋 *Label:* ${info.label}\n` +
            `├─⊷ 📁 *Category:* ${info.category}\n` +
            `│\n` +
            `├─⊷ 🔗 *Current API:*\n` +
            `│   └⊷ ${info.currentUrl}\n` +
            `│\n` +
            `├─⊷ 📊 *Status:* ${statusTag}\n` +
            `│\n` +
            overrideLine +
            `├─⊷ 🔄 *Replace:* ${PREFIX}replaceapi ${cmdName} <newurl>\n` +
            `├─⊷ ♻️ *Reset:* ${PREFIX}replaceapi ${cmdName} reset\n` +
            `│\n` +
            `╰⊷ *Powered by ${BOT_NAME.toUpperCase()}*`;

        if (_giftedBtns?.sendInteractiveMessage) {
            try {
                await _giftedBtns.sendInteractiveMessage(sock, chatJid, {
                    text: infoText,
                    footer: BOT_NAME,
                    interactiveButtons: [
                        {
                            name: 'cta_url',
                            buttonParamsJson: JSON.stringify({
                                display_text: '🌐 Open API URL',
                                url: info.currentUrl,
                                merchant_url: info.currentUrl
                            })
                        },
                        {
                            name: 'cta_copy',
                            buttonParamsJson: JSON.stringify({
                                display_text: '📋 Copy URL',
                                copy_code: info.currentUrl
                            })
                        }
                    ]
                });
            } catch {
                await reply(infoText);
            }
        } else {
            await reply(infoText);
        }

        await _fetchAndShowJson(sock, chatJid, msg, cmdName, info, PREFIX, BOT_NAME);
    }
};

async function _fetchAndShowJson(sock, chatJid, msg, cmdName, info, PREFIX, BOT_NAME) {
    const reply = (text) => sock.sendMessage(chatJid, { text }, { quoted: msg });

    await reply(`⏳ *Fetching API response...*\n🔗 ${info.currentUrl}`);

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
            `├─⊷ ${statusEmoji} *HTTP:* ${status} | ⚡ ${ms}ms (${speedTag})\n` +
            `│\n` +
            `╰⊷ *JSON Response:*\n\n` +
            `\`\`\`\n${display}\n\`\`\``
        );
    } catch (err) {
        const isTimeout = err.name === 'AbortError';
        await reply(
            `╭─⌈ 📡 *API RESPONSE — ${cmdName.toUpperCase()}* ⌋\n` +
            `│\n` +
            `├─⊷ ❌ *${isTimeout ? 'Timed out (10s)' : 'Unreachable'}*\n` +
            `├─⊷ 💬 *Error:* ${err.message}\n` +
            `│\n` +
            `├─⊷ 💡 *Fix:* ${PREFIX}replaceapi ${cmdName} <newurl>\n` +
            `│\n` +
            `╰⊷ *Powered by ${BOT_NAME.toUpperCase()}*`
        );
    }
}
