import { getWarnLimit, setWarnLimit } from '../../lib/warnings-store.js';

export default {
    name: 'setwarn',
    description: 'Set custom warning limit for the group (admin only)',
    category: 'group',
    aliases: ['warnlimit', 'setwarnlimit', 'setwarns'],

    async execute(sock, msg, args, PREFIX, extra) {
        const jid = msg.key.remoteJid;
        const sender = msg.key.participant || jid;

        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, {
                text: '❌ This command only works in groups.'
            }, { quoted: msg });
        }

        try {
            const groupMeta = await sock.groupMetadata(jid);
            const senderPart = groupMeta.participants.find(p => p.id === sender);
            const isAdmin = senderPart && (senderPart.admin === 'admin' || senderPart.admin === 'superadmin');
            const isOwner = extra?.jidManager?.isOwner(msg);

            if (!isAdmin && !isOwner) {
                return sock.sendMessage(jid, {
                    text: '🛑 Only admins can set warning limits.'
                }, { quoted: msg });
            }
        } catch {
            return sock.sendMessage(jid, {
                text: '❌ Failed to verify permissions.'
            }, { quoted: msg });
        }

        const currentLimit = getWarnLimit(jid);

        if (args.length === 0) {
            return sock.sendMessage(jid, {
                text: `╭─⌈ 📊 *WARN LIMIT* ⌋\n├─⊷ *Current:* ${currentLimit} warnings\n├─⊷ *${PREFIX}setwarn <1-20>*\n│  └⊷ Set warning limit\n╰─── *WOLFBOT* ───`
            }, { quoted: msg });
        }

        const limit = parseInt(args[0]);

        if (isNaN(limit) || limit < 1 || limit > 20) {
            return sock.sendMessage(jid, {
                text: '⚠️ Please enter a valid number between 1 and 20.'
            }, { quoted: msg });
        }

        setWarnLimit(jid, limit);

        await sock.sendMessage(jid, {
            text: `╭─⌈ ✅ *WARN LIMIT UPDATED* ⌋\n├─⊷ *Previous:* ${currentLimit}\n├─⊷ *New:* ${limit}\n├─⊷ Kick after ${limit} warning(s)\n╰─── *WOLFBOT* ───`
        }, { quoted: msg });
    }
};
