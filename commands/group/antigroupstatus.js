import fs from 'fs';
import { getOwnerName } from '../../lib/menuHelper.js';

const DATA_FILE = './data/antigroupstatus.json';

function loadSettings() {
    try {
        if (!fs.existsSync(DATA_FILE)) return {};
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch {
        return {};
    }
}

function saveSettings(data) {
    try {
        if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true });
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('[AntiGroupStatus] Save error:', e.message);
    }
}

function cleanJid(jid) {
    if (!jid) return jid;
    return jid.split(':')[0] + (jid.includes('@') ? '@' + jid.split('@')[1] : '@s.whatsapp.net');
}

function isGroupStatusMessage(message) {
    if (!message) return false;
    return !!(
        message.groupStatusMessageV2 ||
        message.groupMentionedMessage ||
        (message.extendedTextMessage?.contextInfo?.isForwarded &&
            message.extendedTextMessage?.contextInfo?.forwardingScore > 0 &&
            message.extendedTextMessage?.contextInfo?.stanzaId?.startsWith('status'))
    );
}

let listenerAttached = false;

export function setupAntiGroupStatusListener(sock) {
    if (listenerAttached) return;
    listenerAttached = true;

    sock.ev.on('messages.upsert', async ({ messages }) => {
        for (const msg of messages) {
            if (!msg?.key?.remoteJid?.endsWith('@g.us')) continue;
            if (msg.key.fromMe) continue;
            if (!isGroupStatusMessage(msg.message)) continue;

            const chatId = msg.key.remoteJid;
            const settings = loadSettings();
            const gs = settings[chatId];
            if (!gs?.enabled) continue;

            const senderJid = msg.key.participant || msg.key.remoteJid;
            const cleanSender = cleanJid(senderJid);
            const senderNum = cleanSender.split('@')[0];

            try {
                const meta = await sock.groupMetadata(chatId);

                const senderParticipant = meta.participants.find(p => cleanJid(p.id) === cleanSender);
                const senderIsAdmin = senderParticipant?.admin === 'admin' || senderParticipant?.admin === 'superadmin';

                if (senderIsAdmin && gs.exemptAdmins !== false) continue;

                const botJid = cleanJid(sock.user?.id);
                const botParticipant = meta.participants.find(p => cleanJid(p.id) === botJid);
                const botIsAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin';

                if (!gs.warnings) gs.warnings = {};
                if (!gs.warnings[cleanSender]) gs.warnings[cleanSender] = 0;

                switch (gs.mode) {
                    case 'warn': {
                        gs.warnings[cleanSender]++;
                        const count = gs.warnings[cleanSender];
                        settings[chatId] = gs;
                        saveSettings(settings);
                        await sock.sendMessage(chatId, {
                            text: `⚠️ *Anti-Group Status* @${senderNum}\n\nPosting to group status is not allowed in this group!\n📛 Warning *${count}* — repeated violations may lead to removal.`,
                            mentions: [cleanSender]
                        });
                        break;
                    }
                    case 'delete': {
                        if (botIsAdmin) {
                            try { await sock.sendMessage(chatId, { delete: msg.key }); } catch {}
                        }
                        await sock.sendMessage(chatId, {
                            text: `🚫 *Anti-Group Status* @${senderNum}\n\nGroup status posts are not allowed here. Message removed.`,
                            mentions: [cleanSender]
                        });
                        break;
                    }
                    case 'kick': {
                        if (botIsAdmin) {
                            try { await sock.sendMessage(chatId, { delete: msg.key }); } catch {}
                            await sock.sendMessage(chatId, {
                                text: `🚫 *Anti-Group Status* @${senderNum}\n\nGroup status posts are not allowed here. You have been removed.`,
                                mentions: [cleanSender]
                            });
                            try { await sock.groupParticipantsUpdate(chatId, [cleanSender], 'remove'); } catch {}
                        } else {
                            await sock.sendMessage(chatId, {
                                text: `⚠️ *Anti-Group Status* @${senderNum}\n\nGroup status posts are not allowed here!\n_(Make me admin to enable auto-kick)_`,
                                mentions: [cleanSender]
                            });
                        }
                        break;
                    }
                }
            } catch (e) {
                console.error('[AntiGroupStatus] Listener error:', e.message);
            }
        }
    });
}

export default {
    name: 'antigroupstatus',
    aliases: ['antigs', 'antigrpstatus', 'nogrpstatus'],
    description: 'Prevent members from posting to group status (warn/delete/kick)',
    category: 'group',
    adminOnly: true,

    async execute(sock, m, args, PREFIX) {
        const chatId = m.key.remoteJid;

        if (!chatId.endsWith('@g.us')) {
            return sock.sendMessage(chatId, {
                text: '❌ This command only works in groups!'
            }, { quoted: m });
        }

        const senderJid = m.key.participant || m.key.remoteJid;
        const cleanSender = cleanJid(senderJid);

        let isAdmin = false;
        let botIsAdmin = false;

        try {
            const meta = await sock.groupMetadata(chatId);
            const senderP = meta.participants.find(p => cleanJid(p.id) === cleanSender);
            isAdmin = senderP?.admin === 'admin' || senderP?.admin === 'superadmin';
            const botJid = cleanJid(sock.user?.id);
            const botP = meta.participants.find(p => cleanJid(p.id) === botJid);
            botIsAdmin = botP?.admin === 'admin' || botP?.admin === 'superadmin';
        } catch {
            return sock.sendMessage(chatId, {
                text: '❌ Could not verify group info.'
            }, { quoted: m });
        }

        if (!isAdmin) {
            return sock.sendMessage(chatId, {
                text: '❌ Only group admins can use this command!'
            }, { quoted: m });
        }

        const settings = loadSettings();
        const gs = settings[chatId] || {};
        const sub = args[0]?.toLowerCase();

        if (sub === 'on') {
            const mode = args[1]?.toLowerCase();
            if (!mode || !['warn', 'delete', 'kick'].includes(mode)) {
                return sock.sendMessage(chatId, {
                    text: `╭─⌈ 🚫 *ANTI-GROUP STATUS SETUP* ⌋\n│\n├─⊷ *${PREFIX}antigroupstatus on warn*\n│  └⊷ Warn users who post\n├─⊷ *${PREFIX}antigroupstatus on delete*\n│  └⊷ Auto-delete their post\n├─⊷ *${PREFIX}antigroupstatus on kick*\n│  └⊷ Remove them from group\n╰───`
                }, { quoted: m });
            }

            if ((mode === 'delete' || mode === 'kick') && !botIsAdmin) {
                await sock.sendMessage(chatId, {
                    text: `⚠️ Make me a group admin for *${mode}* mode to work!`
                }, { quoted: m });
            }

            settings[chatId] = {
                ...gs,
                enabled: true,
                mode,
                exemptAdmins: gs.exemptAdmins !== false,
                warnings: gs.warnings || {}
            };
            saveSettings(settings);

            setupAntiGroupStatusListener(sock);

            await sock.sendMessage(chatId, {
                text: `✅ *Anti-Group Status enabled!*\n\nMode: *${mode.toUpperCase()}*\nAdmins exempt: *${settings[chatId].exemptAdmins ? 'Yes' : 'No'}*\n\nMembers who post to group status will be ${mode === 'warn' ? 'warned' : mode === 'delete' ? 'have their post deleted' : 'removed from the group'}.`
            }, { quoted: m });

        } else if (sub === 'off') {
            if (gs.enabled) {
                settings[chatId] = { ...gs, enabled: false };
                saveSettings(settings);
                await sock.sendMessage(chatId, {
                    text: '❌ *Anti-Group Status disabled!*\n\nMembers can now post to group status freely.'
                }, { quoted: m });
            } else {
                await sock.sendMessage(chatId, {
                    text: 'ℹ️ Anti-Group Status is already disabled.'
                }, { quoted: m });
            }

        } else if (sub === 'exemptadmins') {
            if (!gs.enabled) {
                return sock.sendMessage(chatId, {
                    text: `❌ Enable anti-group status first: *${PREFIX}antigroupstatus on <mode>*`
                }, { quoted: m });
            }
            const toggle = args[1]?.toLowerCase();
            if (toggle === 'on') {
                settings[chatId] = { ...gs, exemptAdmins: true };
                saveSettings(settings);
                await sock.sendMessage(chatId, { text: '✅ Admins are now *exempt* from anti-group status.' }, { quoted: m });
            } else if (toggle === 'off') {
                settings[chatId] = { ...gs, exemptAdmins: false };
                saveSettings(settings);
                await sock.sendMessage(chatId, { text: '✅ Admins are now *subject* to anti-group status rules.' }, { quoted: m });
            } else {
                await sock.sendMessage(chatId, {
                    text: `⚙️ *Admin Exemption:* ${gs.exemptAdmins !== false ? 'ON' : 'OFF'}\n\nChange with:\n• *${PREFIX}antigroupstatus exemptadmins on*\n• *${PREFIX}antigroupstatus exemptadmins off*`
                }, { quoted: m });
            }

        } else if (sub === 'reset') {
            settings[chatId] = { ...gs, warnings: {} };
            saveSettings(settings);
            await sock.sendMessage(chatId, { text: '🔄 All warning counts have been reset.' }, { quoted: m });

        } else if (sub === 'status') {
            if (gs.enabled) {
                const warnCount = Object.keys(gs.warnings || {}).length;
                await sock.sendMessage(chatId, {
                    text: `📊 *Anti-Group Status*\n\n• Status: ✅ ENABLED\n• Mode: *${(gs.mode || 'warn').toUpperCase()}*\n• Admins exempt: *${gs.exemptAdmins !== false ? 'Yes' : 'No'}*\n• Bot admin: ${botIsAdmin ? '✅' : '❌'}\n• Users warned: *${warnCount}*`
                }, { quoted: m });
            } else {
                await sock.sendMessage(chatId, {
                    text: `📊 *Anti-Group Status*\n\n• Status: ❌ DISABLED\n\nEnable with:\n*${PREFIX}antigroupstatus on <warn|delete|kick>*`
                }, { quoted: m });
            }

        } else {
            await sock.sendMessage(chatId, {
                text: `╭─⌈ 🚫 *ANTI-GROUP STATUS* ⌋\n│\n├─⊷ *${PREFIX}antigroupstatus on warn*\n│  └⊷ Warn users who post to group status\n├─⊷ *${PREFIX}antigroupstatus on delete*\n│  └⊷ Auto-delete group status posts\n├─⊷ *${PREFIX}antigroupstatus on kick*\n│  └⊷ Kick users who post to group status\n├─⊷ *${PREFIX}antigroupstatus off*\n│  └⊷ Disable protection\n├─⊷ *${PREFIX}antigroupstatus exemptadmins on/off*\n│  └⊷ Toggle admin exemption\n├─⊷ *${PREFIX}antigroupstatus reset*\n│  └⊷ Reset all warning counts\n├─⊷ *${PREFIX}antigroupstatus status*\n│  └⊷ View current settings\n╰⊷ *Powered by ${getOwnerName().toUpperCase()} TECH*`
            }, { quoted: m });
        }
    }
};
