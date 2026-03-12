import { getCommandInfo, getAllApiCommands } from '../../lib/apiRegistry.js';
import { getBotName } from '../../lib/botname.js';
import { isButtonModeEnabled } from '../../lib/buttonMode.js';
import { isGiftedBtnsAvailable } from '../../lib/buttonHelper.js';
import { createRequire } from 'module';

const _require = createRequire(import.meta.url);
let _giftedBtns = null;
try { _giftedBtns = _require('gifted-btns'); } catch {}

export default {
    name: 'getapi',
    aliases: ['apiinfo', 'checkapi'],
    category: 'owner',
    desc: 'View the API endpoint used by a specific command',
    usage: '.getapi <command> | .getapi (list all)',
    ownerOnly: true,

    async execute(sock, msg, args, PREFIX, extra) {
        const chatJid = msg.key.remoteJid;
        const reply = (text) => sock.sendMessage(chatJid, { text }, { quoted: msg });
        const BOT_NAME = extra?.BOT_NAME || getBotName() || 'WOLFBOT';
        const cmdName = (args[0] || '').toLowerCase().trim();
        const btnMode = isButtonModeEnabled() && isGiftedBtnsAvailable() && _giftedBtns;

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

        const text =
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
            `├─⊷ 📡 *Test API:* ${PREFIX}fetchapi ${cmdName}\n` +
            `├─⊷ 🔄 *Replace:* ${PREFIX}replaceapi ${cmdName} <newurl>\n` +
            `├─⊷ ♻️ *Reset:* ${PREFIX}replaceapi ${cmdName} reset\n` +
            `│\n` +
            `╰⊷ *Powered by ${BOT_NAME.toUpperCase()}*`;

        if (btnMode) {
            try {
                await _giftedBtns.sendInteractiveMessage(sock, chatJid, {
                    text,
                    footer: BOT_NAME,
                    interactiveButtons: [
                        {
                            name: 'quick_reply',
                            buttonParamsJson: JSON.stringify({
                                display_text: '📡 FETCH API',
                                id: `${PREFIX}fetchapi ${cmdName}`
                            })
                        },
                        {
                            name: 'quick_reply',
                            buttonParamsJson: JSON.stringify({
                                display_text: '🔄 REPLACE API',
                                id: `${PREFIX}replaceapi ${cmdName} `
                            })
                        },
                        {
                            name: 'cta_url',
                            buttonParamsJson: JSON.stringify({
                                display_text: '🌐 Open URL',
                                url: info.currentUrl,
                                merchant_url: info.currentUrl
                            })
                        }
                    ]
                });
                return;
            } catch (e) {
                console.log('[getapi] Interactive buttons failed:', e?.message);
            }
        }

        await reply(text);
    }
};
