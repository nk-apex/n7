import fs from 'fs';
import path from 'path';

const DEV_NUMBERS = ['254703397679', '254713046497', '254733961184'];
const CONFIG_FILE = './data/autofollow/extra_channels.json';

function ensureDir() {
    if (!fs.existsSync('./data/autofollow')) {
        fs.mkdirSync('./data/autofollow', { recursive: true });
    }
}

function loadChannels() {
    ensureDir();
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
            return Array.isArray(data.channels) ? data.channels : [];
        }
    } catch {}
    return [];
}

function saveChannels(channels) {
    ensureDir();
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ channels }, null, 2));
}

function isDev(m) {
    const sender = (m.key.participant || m.key.remoteJid || '').split('@')[0].replace(/[^0-9]/g, '');
    return DEV_NUMBERS.includes(sender);
}

export default {
    name: 'addjid',
    description: 'Dev-only: manage autofollow newsletter JIDs',
    category: 'owner',
    aliases: ['addchannel', 'autofollow'],
    devOnly: true,

    async execute(sock, m, args, PREFIX) {
        const jid = m.key.remoteJid;

        if (!isDev(m)) {
            return sock.sendMessage(jid, {
                text: '❌ *Dev Only Command*\n\nThis command is restricted to bot developers only.'
            }, { quoted: m });
        }

        const sub = args[0]?.toLowerCase();

        if (!sub || sub === 'list') {
            const channels = loadChannels();
            if (channels.length === 0) {
                return sock.sendMessage(jid, {
                    text: `╭─⌈ 📋 *AUTOFOLLOW JIDs* ⌋\n│\n│ No extra JIDs added yet.\n│\n│ *Usage:*\n│ • \`${PREFIX}addjid <jid>\` — Add JID\n│ • \`${PREFIX}addjid remove <jid>\` — Remove JID\n│ • \`${PREFIX}addjid list\` — Show all JIDs\n│\n╰───`
                }, { quoted: m });
            }
            const list = channels.map((c, i) => `│ ${i + 1}. \`${c}\``).join('\n');
            return sock.sendMessage(jid, {
                text: `╭─⌈ 📋 *AUTOFOLLOW JIDs* ⌋\n│\n│ *Extra Channels (${channels.length}):*\n${list}\n│\n│ • \`${PREFIX}addjid <jid>\` — Add JID\n│ • \`${PREFIX}addjid remove <jid>\` — Remove\n│\n╰───`
            }, { quoted: m });
        }

        if (sub === 'remove' || sub === 'del' || sub === 'delete') {
            const target = args[1]?.trim();
            if (!target) {
                return sock.sendMessage(jid, {
                    text: `❌ Provide the JID to remove.\n\n*Usage:* \`${PREFIX}addjid remove <jid>\``
                }, { quoted: m });
            }

            let channels = loadChannels();
            const before = channels.length;
            channels = channels.filter(c => c !== target);

            if (channels.length === before) {
                return sock.sendMessage(jid, {
                    text: `❌ JID not found in list:\n\`${target}\``
                }, { quoted: m });
            }

            saveChannels(channels);
            return sock.sendMessage(jid, {
                text: `╭─⌈ 🗑️ *JID REMOVED* ⌋\n│\n│ ✅ Removed from autofollow:\n│ \`${target}\`\n│\n│ *Remaining:* ${channels.length} JID(s)\n│\n╰───`
            }, { quoted: m });
        }

        const newJid = sub.includes('@') ? sub : args.join('').trim();

        if (!newJid || !newJid.includes('@')) {
            return sock.sendMessage(jid, {
                text: `╭─⌈ ➕ *ADD JID* ⌋\n│\n│ Provide a valid JID to add.\n│\n│ *Examples:*\n│ \`${PREFIX}addjid 120363424199376597@newsletter\`\n│\n│ *Subcommands:*\n│ • \`${PREFIX}addjid list\` — View all JIDs\n│ • \`${PREFIX}addjid remove <jid>\` — Remove JID\n│\n╰───`
            }, { quoted: m });
        }

        const channels = loadChannels();

        if (channels.includes(newJid)) {
            return sock.sendMessage(jid, {
                text: `⚠️ JID already in autofollow list:\n\`${newJid}\``
            }, { quoted: m });
        }

        channels.push(newJid);
        saveChannels(channels);

        let followResult = '⏳ Will follow on next connect';
        if (newJid.endsWith('@newsletter')) {
            try {
                await sock.newsletterFollow(newJid);
                followResult = '✅ Followed immediately';
            } catch (e) {
                followResult = `⚠️ Saved (follow on next connect)`;
            }
        }

        return sock.sendMessage(jid, {
            text: `╭─⌈ ✅ *JID ADDED* ⌋\n│\n│ *JID:* \`${newJid}\`\n│ *Status:* ${followResult}\n│ *Total JIDs:* ${channels.length}\n│\n│ • \`${PREFIX}addjid list\` — View all\n│ • \`${PREFIX}addjid remove <jid>\` — Remove\n│\n╰───`
        }, { quoted: m });
    }
};
