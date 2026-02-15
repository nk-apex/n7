import { addSudo, mapLidToPhone, getSudoList } from '../../lib/sudo-store.js';

function resolveRealNumber(jid, sock) {
    if (!jid) return null;
    if (!jid.includes('@lid')) {
        const raw = jid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
        if (raw && raw.length >= 7 && raw.length <= 15) return raw;
        return null;
    }
    if (sock) {
        try {
            if (sock.signalRepository?.lidMapping?.getPNForLID) {
                const pn = sock.signalRepository.lidMapping.getPNForLID(jid);
                if (pn) {
                    const num = String(pn).split('@')[0].replace(/[^0-9]/g, '');
                    if (num.length >= 7) return num;
                }
            }
        } catch {}
    }
    return null;
}

export default {
    name: 'addsudo',
    alias: ['sudo'],
    category: 'owner',
    description: 'Add a user to the sudo list (trusted users who can use owner commands)',
    ownerOnly: true,
    sudoAllowed: false,

    async execute(sock, msg, args, PREFIX, extra) {
        const chatId = msg.key.remoteJid;
        const { jidManager } = extra;

        if (!jidManager.isOwner(msg)) {
            return sock.sendMessage(chatId, {
                text: '❌ *Owner Only Command!*\n\nOnly the bot owner can add sudo users.'
            }, { quoted: msg });
        }

        let targetNumber = null;

        const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant;
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

        if (quoted) {
            const resolved = resolveRealNumber(quoted, sock);
            if (resolved) {
                targetNumber = resolved;
            } else if (args[0]) {
                targetNumber = args[0].replace(/[^0-9]/g, '');
            } else {
                return sock.sendMessage(chatId, {
                    text: `⚠️ *Could not resolve phone number*\n\nPlease include the phone number:\n• \`${PREFIX}addsudo <phone number>\`\n_(while replying to their message)_\n\nExample: Reply → \`${PREFIX}addsudo 254703397679\``
                }, { quoted: msg });
            }
        } else if (mentioned) {
            const resolved = resolveRealNumber(mentioned, sock);
            if (resolved) {
                targetNumber = resolved;
            } else if (args.length > 1) {
                targetNumber = args[1]?.replace(/[^0-9]/g, '') || args[0]?.replace(/[^0-9]/g, '');
            }
        } else if (args[0]) {
            targetNumber = args[0].replace(/[^0-9]/g, '');
        }

        if (!targetNumber || targetNumber.length < 7) {
            return sock.sendMessage(chatId, {
                text: `📋 *Add Sudo User*\n\nUsage:\n• \`${PREFIX}addsudo 2547xxxxxxxx\`\n• Reply to user's message → \`${PREFIX}addsudo\`\n\n_Sudo users can use owner commands_`
            }, { quoted: msg });
        }

        const ownerNumber = extra.OWNER_NUMBER?.split(':')[0];
        if (targetNumber === ownerNumber) {
            return sock.sendMessage(chatId, {
                text: '❌ You are already the owner! No need to add yourself as sudo.'
            }, { quoted: msg });
        }

        const quotedLid = quoted && quoted.includes('@lid') ? quoted.split('@')[0].split(':')[0] : null;
        const result = addSudo(targetNumber, quotedLid);

        if (quotedLid && quotedLid !== targetNumber) {
            mapLidToPhone(quotedLid, targetNumber);
        }

        if (result.success) {
            let successMsg = `✅ *Sudo User Added*\n\n👤 Number: +${result.number}\n🔑 Access: Owner-level commands`;
            if (quotedLid) successMsg += `\n🔗 Group ID: Linked ✅`;
            successMsg += `\n\n_This user can now use owner commands._`;
            await sock.sendMessage(chatId, { text: successMsg }, { quoted: msg });
        } else {
            if (result.reason === 'Already a sudo user') {
                let replyMsg = `ℹ️ +${targetNumber} is already a sudo user.`;
                if (quotedLid) replyMsg += ` Group ID re-linked ✅`;
                await sock.sendMessage(chatId, { text: replyMsg }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, {
                    text: `❌ *Failed:* ${result.reason}`
                }, { quoted: msg });
            }
        }
    }
};
