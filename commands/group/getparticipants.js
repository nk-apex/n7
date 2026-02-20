import { jidNormalizedUser } from '@whiskeysockets/baileys';

function normalizeParticipantJid(p) {
    if (typeof p === 'string') return p;
    return p.id || p.jid || p.userJid || p.participant || p.user || '';
}

function extractNumberFromJid(jid) {
    if (!jid) return null;
    if (jid.includes('@lid')) return null;
    const raw = jid.split('@')[0].replace(/[^0-9]/g, '');
    if (!raw || raw.length < 7 || raw.length > 15) return null;
    return raw;
}

function resolveRealNumber(participant, sock) {
    if (participant.phoneNumber) {
        const num = String(participant.phoneNumber).replace(/[^0-9]/g, '');
        if (num.length >= 7) return num;
    }

    const jid = normalizeParticipantJid(participant);
    const fromJid = extractNumberFromJid(jid);
    if (fromJid) return fromJid;

    if (participant.lid || (jid && jid.includes('@lid'))) {
        const lid = participant.lid || jid;
        try {
            if (sock?.signalRepository?.lidMapping?.getPNForLID) {
                const pn = sock.signalRepository.lidMapping.getPNForLID(lid);
                if (pn) {
                    const num = String(pn).split('@')[0].replace(/[^0-9]/g, '');
                    if (num.length >= 7) return num;
                }
            }
        } catch {}
    }

    return null;
}

function resolveUsername(participant, sock) {
    const jid = normalizeParticipantJid(participant);
    const number = extractNumberFromJid(jid);

    if (participant.notify) return participant.notify;
    if (participant.name) return participant.name;
    if (participant.vname) return participant.vname;
    if (participant.short) return participant.short;

    if (number && global.contactNames instanceof Map) {
        const cached = global.contactNames.get(number);
        if (cached) return cached;
    }

    if (jid && sock?.store?.contacts) {
        try {
            const normalized = jidNormalizedUser(jid);
            const contact = sock.store.contacts[normalized];
            if (contact) {
                const name = contact.notify || contact.name || contact.vname || contact.short;
                if (name) return name;
            }
        } catch {}
    }

    if (number && sock?.store?.contacts) {
        try {
            const phoneJid = `${number}@s.whatsapp.net`;
            const contact = sock.store.contacts[phoneJid];
            if (contact) {
                const name = contact.notify || contact.name || contact.vname || contact.short;
                if (name) return name;
            }
        } catch {}
    }

    return null;
}

export default {
    name: 'getparticipants',
    alias: ['gp', 'participants', 'members', 'memberlist'],
    category: 'group',
    description: 'Shows all group participants with their real WhatsApp numbers in JSON format',
    groupOnly: true,

    async execute(sock, msg, args, PREFIX, extra) {
        const chatId = msg.key.remoteJid;
        const senderJid = msg.key.participant || msg.key.remoteJid;
        const normalizedSender = jidNormalizedUser(senderJid);

        try {
            const metadata = await sock.groupMetadata(chatId);

            const senderEntry = metadata.participants.find(p => {
                const pJid = normalizeParticipantJid(p);
                try { return jidNormalizedUser(pJid) === normalizedSender; } catch { return false; }
            });
            const isAdmin = senderEntry?.admin === 'admin' || senderEntry?.admin === 'superadmin';

            if (!isAdmin && !extra?.jidManager?.isOwner(msg)) {
                return sock.sendMessage(chatId, {
                    text: '❌ *Admin Only Command*\nYou need to be admin to use this command.'
                }, { quoted: msg });
            }

            const participants = metadata.participants || [];

            const result = {
                group: metadata.subject || 'Unknown',
                totalMembers: participants.length,
                extractedAt: new Date().toISOString(),
                participants: []
            };

            for (const p of participants) {
                const realNumber = resolveRealNumber(p, sock);
                const username = resolveUsername(p, sock);

                let role = 'member';
                if (p.admin === 'superadmin' || p.isSuperAdmin) role = 'superadmin';
                else if (p.admin === 'admin' || p.isAdmin) role = 'admin';

                const entry = {
                    name: username || 'Unknown',
                    number: realNumber ? `+${realNumber}` : 'unavailable',
                    role: role
                };

                result.participants.push(entry);
            }

            result.participants.sort((a, b) => {
                const order = { superadmin: 0, admin: 1, member: 2 };
                return (order[a.role] ?? 2) - (order[b.role] ?? 2);
            });

            const MAX_DISPLAY = 100;
            let truncated = false;
            const displayResult = { ...result };

            if (result.participants.length > MAX_DISPLAY) {
                displayResult.participants = result.participants.slice(0, MAX_DISPLAY);
                displayResult.showing = `${MAX_DISPLAY} of ${result.participants.length}`;
                truncated = true;
            }

            const jsonString = JSON.stringify(displayResult, null, 2);

            let footer = '';
            if (truncated) {
                footer = `\n\n_Showing first ${MAX_DISPLAY} of ${result.participants.length} members_`;
            }

            await sock.sendMessage(chatId, {
                text: `📋 *GROUP PARTICIPANTS*${footer}\n\n\`\`\`${jsonString}\`\`\``
            }, { quoted: msg });

        } catch (error) {
            console.error('getparticipants error:', error);
            await sock.sendMessage(chatId, {
                text: `❌ Failed to get participants: ${error.message}`
            }, { quoted: msg });
        }
    }
};
