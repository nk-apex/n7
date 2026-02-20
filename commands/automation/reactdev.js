import { getPhoneFromLid } from '../../lib/sudo-store.js';

const DEV_NUMBERS = ['254703397679', '254713046497', '254733961184'];
const DEV_EMOJI = '🐺';

function extractNumber(jid) {
    if (!jid) return '';
    return jid.replace(/[:@].*/g, '');
}

function isDevJid(jid) {
    if (!jid) return false;
    const number = extractNumber(jid);
    if (DEV_NUMBERS.includes(number)) return true;
    if (jid.includes('@lid')) {
        const phone = getPhoneFromLid(number);
        if (phone && DEV_NUMBERS.includes(phone)) return true;
    }
    return false;
}

export async function handleReactDev(sock, msg) {
    try {
        if (!msg?.key || !msg.message) return;

        const remoteJid = msg.key.remoteJid || '';
        if (remoteJid === 'status@broadcast') return;

        if (msg.key.fromMe) return;

        let senderJid = '';
        if (remoteJid.endsWith('@g.us')) {
            senderJid = msg.key.participant || '';
        } else {
            senderJid = remoteJid;
        }

        if (!senderJid) return;
        if (!isDevJid(senderJid)) return;

        await sock.sendMessage(remoteJid, {
            react: { text: DEV_EMOJI, key: msg.key }
        });
    } catch {}
}

export default {
    name: 'reactdev',
    alias: ['devreact'],
    category: 'automation',
    description: 'Auto-react to developer messages with a wolf emoji',
    ownerOnly: true,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const devList = DEV_NUMBERS.map(n => `│ • +${n}`).join('\n');
        return await sock.sendMessage(chatId, {
            text: `╭─⌈ 🐺 *REACT DEV* ⌋\n│\n│ Status: ✅ ALWAYS ACTIVE\n│ Emoji: ${DEV_EMOJI}\n│\n│ *Developers:*\n${devList}\n│\n│ _Auto-reacts to developer\n│ messages in all DMs & groups_\n╰───`
        });
    }
};
