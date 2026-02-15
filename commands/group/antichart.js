import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configFile = path.join(__dirname, '../../data/antichart/config.json');

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
    return config[groupJid]?.action || 'warn';
}

function getRestrictedUsers(groupJid) {
    const config = loadConfig();
    return config[groupJid]?.restricted || [];
}

function isRestricted(groupJid, userJid) {
    const restricted = getRestrictedUsers(groupJid);
    return restricted.some(u => u === userJid || userJid.startsWith(u.split('@')[0]));
}

export default {
    name: 'antichart',
    alias: ['nochart', 'anticharts', 'chartblock'],
    description: 'Warn, delete, or kick members who send charts/polls in group. Restrict specific users.',
    category: 'group',
    adminOnly: true,

    isEnabled,
    getAction,
    isRestricted,

    async execute(sock, msg, args, PREFIX, extra) {
        const chatId = msg.key.remoteJid;
        const { jidManager } = extra;

        if (!chatId.endsWith('@g.us')) {
            return sock.sendMessage(chatId, {
                text: '❌ This command only works in groups!'
            }, { quoted: msg });
        }

        const groupMeta = await sock.groupMetadata(chatId);
        const sender = msg.key.participant || chatId;
        const participant = groupMeta.participants.find(p => p.id === sender);
        const isAdmin = participant && (participant.admin === 'admin' || participant.admin === 'superadmin');

        if (!isAdmin && !jidManager.isOwner(msg)) {
            return sock.sendMessage(chatId, {
                text: '❌ Only group admins can use this command!'
            }, { quoted: msg });
        }

        const config = loadConfig();
        const sub = (args[0] || '').toLowerCase();

        if (sub === 'on' || sub === 'enable') {
            config[chatId] = { ...config[chatId], enabled: true, action: config[chatId]?.action || 'warn', restricted: config[chatId]?.restricted || [] };
            saveConfig(config);
            return sock.sendMessage(chatId, {
                text: `📊 *Anti-Chart ENABLED!*\n\n` +
                    `Action: *${config[chatId].action.toUpperCase()}*\n\n` +
                    `💡 *Actions:*\n` +
                    `• \`${PREFIX}antichart action warn\` - Warn sender\n` +
                    `• \`${PREFIX}antichart action delete\` - Delete message\n` +
                    `• \`${PREFIX}antichart action kick\` - Kick sender`
            }, { quoted: msg });
        }

        if (sub === 'off' || sub === 'disable') {
            config[chatId] = { ...config[chatId], enabled: false };
            saveConfig(config);
            return sock.sendMessage(chatId, {
                text: '📊 *Anti-Chart DISABLED!*'
            }, { quoted: msg });
        }

        if (sub === 'action' && args[1]) {
            const action = args[1].toLowerCase();
            if (!['warn', 'delete', 'kick'].includes(action)) {
                return sock.sendMessage(chatId, {
                    text: '❌ Invalid action! Use: warn, delete, or kick'
                }, { quoted: msg });
            }
            config[chatId] = { ...config[chatId], enabled: config[chatId]?.enabled || true, action };
            saveConfig(config);
            return sock.sendMessage(chatId, {
                text: `📊 *Anti-Chart Action Updated!*\n\nAction: *${action.toUpperCase()}*`
            }, { quoted: msg });
        }

        if (sub === 'restrict') {
            const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;
            const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            const target = quotedParticipant || mentionedJid;

            if (!target) {
                return sock.sendMessage(chatId, {
                    text: `❌ *Reply to a user or mention them!*\n\nUsage: Reply to user with \`${PREFIX}antichart restrict\`\nOr: \`${PREFIX}antichart restrict @user\``
                }, { quoted: msg });
            }

            if (!config[chatId]) config[chatId] = { enabled: true, action: 'warn', restricted: [] };
            if (!config[chatId].restricted) config[chatId].restricted = [];

            if (config[chatId].restricted.includes(target)) {
                return sock.sendMessage(chatId, {
                    text: '⚠️ User is already restricted from sending messages!'
                }, { quoted: msg });
            }

            config[chatId].restricted.push(target);
            saveConfig(config);

            const number = target.split('@')[0];
            return sock.sendMessage(chatId, {
                text: `📊 *User Restricted!*\n\n@${number} is now restricted from sending messages in this group.\n\nUse \`${PREFIX}antichart unrestrict\` (reply) to remove.`,
                mentions: [target]
            }, { quoted: msg });
        }

        if (sub === 'unrestrict') {
            const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;
            const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            const target = quotedParticipant || mentionedJid;

            if (!target) {
                return sock.sendMessage(chatId, {
                    text: `❌ Reply to a user or mention them!`
                }, { quoted: msg });
            }

            if (!config[chatId]?.restricted?.length) {
                return sock.sendMessage(chatId, {
                    text: '⚠️ No restricted users in this group.'
                }, { quoted: msg });
            }

            config[chatId].restricted = config[chatId].restricted.filter(u => u !== target);
            saveConfig(config);

            const number = target.split('@')[0];
            return sock.sendMessage(chatId, {
                text: `✅ @${number} unrestricted! They can send messages again.`,
                mentions: [target]
            }, { quoted: msg });
        }

        if (sub === 'list') {
            const restricted = config[chatId]?.restricted || [];
            if (restricted.length === 0) {
                return sock.sendMessage(chatId, {
                    text: '📊 *No restricted users in this group.*'
                }, { quoted: msg });
            }

            let text = `📊 *Restricted Users:*\n\n`;
            restricted.forEach((jid, i) => {
                text += `${i + 1}. @${jid.split('@')[0]}\n`;
            });
            return sock.sendMessage(chatId, {
                text,
                mentions: restricted
            }, { quoted: msg });
        }

        const enabled = config[chatId]?.enabled || false;
        const action = config[chatId]?.action || 'warn';
        const restricted = config[chatId]?.restricted || [];

        return sock.sendMessage(chatId, {
            text: `📊 *ANTI-CHART SYSTEM*\n\n` +
                `Prevents chart/poll spam and restricts specific users.\n\n` +
                `📊 *Status:* ${enabled ? '✅ ENABLED' : '❌ DISABLED'}\n` +
                `⚡ *Action:* ${action.toUpperCase()}\n` +
                `🚫 *Restricted:* ${restricted.length} user(s)\n\n` +
                `💡 *Usage:*\n` +
                `• \`${PREFIX}antichart on\` - Enable\n` +
                `• \`${PREFIX}antichart off\` - Disable\n` +
                `• \`${PREFIX}antichart action warn\` - Warn mode\n` +
                `• \`${PREFIX}antichart action delete\` - Delete mode\n` +
                `• \`${PREFIX}antichart action kick\` - Kick mode\n` +
                `• \`${PREFIX}antichart restrict\` (reply) - Restrict user\n` +
                `• \`${PREFIX}antichart unrestrict\` (reply) - Unrestrict\n` +
                `• \`${PREFIX}antichart list\` - List restricted users`
        }, { quoted: msg });
    }
};
