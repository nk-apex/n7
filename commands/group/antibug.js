import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configFile = path.join(__dirname, '../../data/antibug/config.json');

function ensureDir() {
    const dir = path.dirname(configFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadConfig() {
    try {
        if (fs.existsSync(configFile)) {
            return JSON.parse(fs.readFileSync(configFile, 'utf8'));
        }
    } catch {}
    return {};
}

function saveConfig(data) {
    ensureDir();
    fs.writeFileSync(configFile, JSON.stringify(data, null, 2));
}

function isEnabled(groupJid) {
    const config = loadConfig();
    return config[groupJid]?.enabled || false;
}

function getAction(groupJid) {
    const config = loadConfig();
    return config[groupJid]?.action || 'block';
}

const BUG_PATTERNS = [
    /\u200E{10,}/,
    /\u200F{10,}/,
    /\u200B{10,}/,
    /\u2060{5,}/,
    /\uFEFF{5,}/,
    /\u00AD{10,}/,
    /\u200D{20,}/,
    /[\u0300-\u036F]{20,}/,
    /[\u0489]{5,}/,
    /[\u20E3]{5,}/,
    /(.)\1{500,}/,
    /[\u2066\u2067\u2068\u2069]{5,}/,
    /[\u202A-\u202E]{5,}/,
    /[\uD800-\uDBFF][\uDC00-\uDFFF]{100,}/,
    /\u034F{10,}/,
    /[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]{20,}/,
];

const VCARDLIST_PATTERN = /vcard/i;

function isBugMessage(msg) {
    const text = msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        msg.message?.videoMessage?.caption || '';

    for (const pattern of BUG_PATTERNS) {
        if (pattern.test(text)) return { isBug: true, type: 'text_crash' };
    }

    if (text.length > 50000) return { isBug: true, type: 'text_flood' };

    const contactsArrayMsg = msg.message?.contactsArrayMessage;
    if (contactsArrayMsg && contactsArrayMsg.contacts?.length > 100) {
        return { isBug: true, type: 'vcf_bomb' };
    }

    if (msg.message?.protocolMessage?.type === 14) {
        return { isBug: true, type: 'protocol_crash' };
    }

    const hasLargeRepeats = text && /(.{1,5})\1{200,}/.test(text);
    if (hasLargeRepeats) return { isBug: true, type: 'repeat_crash' };

    if (msg.message?.buttonsMessage?.buttons?.length > 50 ||
        msg.message?.listMessage?.sections?.length > 50) {
        return { isBug: true, type: 'button_crash' };
    }

    return { isBug: false };
}

export default {
    name: 'antibug',
    alias: ['bugdetect', 'anticrash', 'bugprotect'],
    description: 'Detect and block bug bot attacks in groups',
    category: 'group',
    adminOnly: true,

    isBugMessage,
    isEnabled,
    getAction,

    async execute(sock, msg, args, PREFIX, extra) {
        const chatId = msg.key.remoteJid;
        const { jidManager } = extra;

        if (!chatId.endsWith('@g.us')) {
            return sock.sendMessage(chatId, {
                text: '❌ This command only works in groups!'
            }, { quoted: msg });
        }

        if (!jidManager.isOwner(msg)) {
            const groupMeta = await sock.groupMetadata(chatId);
            const sender = msg.key.participant || chatId;
            const participant = groupMeta.participants.find(p => p.id === sender);
            const isAdmin = participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
            if (!isAdmin) {
                return sock.sendMessage(chatId, {
                    text: '❌ Only group admins can use this command!'
                }, { quoted: msg });
            }
        }

        const config = loadConfig();
        const sub = (args[0] || '').toLowerCase();

        if (sub === 'on' || sub === 'enable') {
            config[chatId] = { enabled: true, action: config[chatId]?.action || 'block' };
            saveConfig(config);
            return sock.sendMessage(chatId, {
                text: `🛡️ *Anti-Bug ENABLED!*\n\n` +
                    `Action: *${config[chatId].action.toUpperCase()}*\n\n` +
                    `Bot will detect and ${config[chatId].action} bug attacks.\n\n` +
                    `💡 *Actions:*\n` +
                    `• \`${PREFIX}antibug action block\` - Block sender\n` +
                    `• \`${PREFIX}antibug action kick\` - Kick sender\n` +
                    `• \`${PREFIX}antibug action delete\` - Delete only`
            }, { quoted: msg });
        }

        if (sub === 'off' || sub === 'disable') {
            config[chatId] = { ...config[chatId], enabled: false };
            saveConfig(config);
            return sock.sendMessage(chatId, {
                text: '🛡️ *Anti-Bug DISABLED!*'
            }, { quoted: msg });
        }

        if (sub === 'action' && args[1]) {
            const action = args[1].toLowerCase();
            if (!['block', 'kick', 'delete'].includes(action)) {
                return sock.sendMessage(chatId, {
                    text: '❌ Invalid action! Use: block, kick, or delete'
                }, { quoted: msg });
            }
            config[chatId] = { ...config[chatId], enabled: config[chatId]?.enabled || true, action };
            saveConfig(config);
            return sock.sendMessage(chatId, {
                text: `🛡️ *Anti-Bug Action Updated!*\n\nAction: *${action.toUpperCase()}*`
            }, { quoted: msg });
        }

        if (sub === 'status') {
            const enabled = config[chatId]?.enabled || false;
            const action = config[chatId]?.action || 'block';
            return sock.sendMessage(chatId, {
                text: `🛡️ *Anti-Bug Status*\n\n` +
                    `State: *${enabled ? 'ENABLED' : 'DISABLED'}*\n` +
                    `Action: *${action.toUpperCase()}*`
            }, { quoted: msg });
        }

        const enabled = config[chatId]?.enabled || false;
        const action = config[chatId]?.action || 'block';
        return sock.sendMessage(chatId, {
            text: `🛡️ *ANTI-BUG PROTECTION*\n\n` +
                `Detects and blocks bug bot attacks that crash WhatsApp.\n\n` +
                `📊 *Status:* ${enabled ? '✅ ENABLED' : '❌ DISABLED'}\n` +
                `⚡ *Action:* ${action.toUpperCase()}\n\n` +
                `💡 *Usage:*\n` +
                `• \`${PREFIX}antibug on\` - Enable\n` +
                `• \`${PREFIX}antibug off\` - Disable\n` +
                `• \`${PREFIX}antibug action block\` - Block attacker\n` +
                `• \`${PREFIX}antibug action kick\` - Kick attacker\n` +
                `• \`${PREFIX}antibug action delete\` - Delete only\n` +
                `• \`${PREFIX}antibug status\` - Check status\n\n` +
                `🔍 *Detects:*\n` +
                `• Text crash exploits\n` +
                `• VCF bomb attacks\n` +
                `• Unicode overflow bugs\n` +
                `• Protocol crash attempts\n` +
                `• Button/list overflow attacks`
        }, { quoted: msg });
    }
};
