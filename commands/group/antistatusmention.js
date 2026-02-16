import fs from 'fs';
import path from 'path';

const DATA_DIR = './data/antistatusmention';
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadConfig() {
    try {
        if (!fs.existsSync(CONFIG_FILE)) return {};
        return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    } catch {
        return {};
    }
}

function saveConfig(data) {
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('[ANTISTATUSMENTION] Save error:', err.message);
    }
}

function cleanJid(jid) {
    if (!jid) return jid;
    const clean = jid.split(':')[0];
    return clean.includes('@') ? clean : clean + '@s.whatsapp.net';
}

export function getAntiStatusMentionConfig(groupId) {
    const config = loadConfig();
    return config[groupId] || null;
}

export async function handleStatusMention(sock, statusMsg) {
    try {
        const message = statusMsg.message;
        if (!message) return;

        const senderJid = statusMsg.key.participant || statusMsg.key.remoteJid;
        const cleanSender = cleanJid(senderJid);

        let mentionedGroups = [];

        const allMsgContent = [];
        for (const key of Object.keys(message)) {
            if (key === 'messageContextInfo' || key === 'senderKeyDistributionMessage') continue;
            const val = message[key];
            if (val && typeof val === 'object') {
                allMsgContent.push({ key, content: val });
            }
        }

        for (const { key: msgKey, content: msgContent } of allMsgContent) {
            if (msgContent?.contextInfo) {
                const ctx = msgContent.contextInfo;

                if (ctx.mentionedJid?.length) {
                    const groups = ctx.mentionedJid.filter(jid => jid?.endsWith('@g.us'));
                    for (const g of groups) {
                        if (!mentionedGroups.includes(g)) mentionedGroups.push(g);
                    }
                }

                if (ctx.groupMentions?.length) {
                    for (const gm of ctx.groupMentions) {
                        const gjid = gm.groupJid || gm.jid || gm.id;
                        if (gjid?.endsWith('@g.us') && !mentionedGroups.includes(gjid)) {
                            mentionedGroups.push(gjid);
                        }
                    }
                }

                if (ctx.remoteJid?.endsWith('@g.us') && !mentionedGroups.includes(ctx.remoteJid)) {
                    mentionedGroups.push(ctx.remoteJid);
                }

                if (ctx.quotedMessage) {
                    const quotedCtx = ctx.quotedMessage;
                    for (const qKey of Object.keys(quotedCtx)) {
                        const qVal = quotedCtx[qKey];
                        if (qVal?.contextInfo?.mentionedJid) {
                            const qGroups = qVal.contextInfo.mentionedJid.filter(j => j?.endsWith('@g.us'));
                            for (const g of qGroups) {
                                if (!mentionedGroups.includes(g)) mentionedGroups.push(g);
                            }
                        }
                    }
                }
            }

            if (msgKey === 'groupMentionedMessage' || msgKey === 'statusMentionMessage') {
                const gjid = msgContent.groupJid || msgContent.jid;
                if (gjid?.endsWith('@g.us') && !mentionedGroups.includes(gjid)) {
                    mentionedGroups.push(gjid);
                }
            }
        }

        if (message.groupMentionedMessage) {
            const gmMsg = message.groupMentionedMessage;
            const gjid = gmMsg.groupJid || gmMsg.jid;
            if (gjid?.endsWith('@g.us') && !mentionedGroups.includes(gjid)) {
                mentionedGroups.push(gjid);
            }
        }

        if (message.statusMentionMessage) {
            const smm = message.statusMentionMessage;
            if (smm.groupJid?.endsWith('@g.us') && !mentionedGroups.includes(smm.groupJid)) {
                mentionedGroups.push(smm.groupJid);
            }
        }

        const msgKeys = Object.keys(message).filter(k => k !== 'messageContextInfo' && k !== 'senderKeyDistributionMessage');
        
        if (mentionedGroups.length === 0) {
            return;
        }

        const config = loadConfig();

        for (const groupId of mentionedGroups) {
            const groupConfig = config[groupId];
            if (!groupConfig || !groupConfig.enabled) continue;

            let isGroupMember = false;
            let isAdmin = false;
            let metadata;

            try {
                metadata = await sock.groupMetadata(groupId);
                const participant = metadata.participants.find(p => cleanJid(p.id) === cleanSender);
                if (participant) {
                    isGroupMember = true;
                    isAdmin = participant.admin === 'admin' || participant.admin === 'superadmin';
                }
            } catch {
                continue;
            }

            if (!isGroupMember) continue;
            if (groupConfig.exemptAdmins && isAdmin) continue;

            const groupName = metadata?.subject || 'the group';
            const userName = cleanSender.split('@')[0];

            if (!groupConfig.warnings) groupConfig.warnings = {};
            if (!groupConfig.warnings[cleanSender]) groupConfig.warnings[cleanSender] = 0;
            groupConfig.warnings[cleanSender]++;

            const warningCount = groupConfig.warnings[cleanSender];

            console.log(`[ANTISTATUSMENTION] Detected status mention of ${groupId.split('@')[0]} by ${userName} | Mode: ${groupConfig.mode} | Warning #${warningCount}`);

            switch (groupConfig.mode) {
                case 'warn': {
                    await sock.sendMessage(groupId, {
                        text: `⚠️ *Status Mention Warning*\n\n@${userName}, please don't mention this group in your WhatsApp status.\n\n⚡ Warning: *${warningCount}/${groupConfig.maxWarnings || 3}*${warningCount >= (groupConfig.maxWarnings || 3) ? '\n\n🚨 _Next violation may result in removal!_' : ''}`,
                        mentions: [cleanSender]
                    });
                    break;
                }

                case 'delete': {
                    await sock.sendMessage(groupId, {
                        text: `🚫 *Status Mention Detected*\n\n@${userName} mentioned this group in their WhatsApp status.\n\n⚡ Warning: *${warningCount}/${groupConfig.maxWarnings || 3}*${warningCount >= (groupConfig.maxWarnings || 3) ? '\n\n🚨 _Next violation may result in removal!_' : ''}`,
                        mentions: [cleanSender]
                    });
                    break;
                }

                case 'kick': {
                    if (warningCount >= (groupConfig.maxWarnings || 1)) {
                        try {
                            await sock.sendMessage(groupId, {
                                text: `🚨 *Auto-Kick: Status Mention*\n\n@${userName} has been removed for mentioning this group in their WhatsApp status.\n\n📋 Violations: *${warningCount}*`,
                                mentions: [cleanSender]
                            });
                            await sock.groupParticipantsUpdate(groupId, [cleanSender], 'remove');
                            delete groupConfig.warnings[cleanSender];
                            console.log(`[ANTISTATUSMENTION] Kicked ${userName} from ${groupId.split('@')[0]}`);
                        } catch (kickErr) {
                            await sock.sendMessage(groupId, {
                                text: `❌ Failed to remove @${userName}. I may not have admin permissions.`,
                                mentions: [cleanSender]
                            });
                        }
                    } else {
                        await sock.sendMessage(groupId, {
                            text: `⚠️ *Status Mention Warning*\n\n@${userName}, mentioning this group in your status is not allowed.\n\n⚡ Warning: *${warningCount}/${groupConfig.maxWarnings || 1}*\n🚨 _You will be removed on the next violation!_`,
                            mentions: [cleanSender]
                        });
                    }
                    break;
                }
            }

            config[groupId] = groupConfig;
            saveConfig(config);
        }
    } catch (err) {
        console.error('[ANTISTATUSMENTION] Handler error:', err.message);
    }
}

export default {
    name: 'antistatusmention',
    alias: ['asm', 'antistatusm'],
    category: 'group',
    description: 'Detect and take action when someone mentions the group in their WhatsApp status',
    groupOnly: true,

    async execute(sock, msg, args, PREFIX, extra) {
        const chatId = msg.key.remoteJid;
        const participant = msg.key.participant;

        try {
            const metadata = await sock.groupMetadata(chatId);
            const cleanParticipant = cleanJid(participant);
            const isAdmin = metadata.participants.find(p => cleanJid(p.id) === cleanParticipant)?.admin || false;

            if (!isAdmin && !extra?.jidManager?.isOwner(msg)) {
                return sock.sendMessage(chatId, {
                    text: '❌ *Admin Only Command*\nYou need to be admin to use this command.'
                }, { quoted: msg });
            }
        } catch {
            return sock.sendMessage(chatId, {
                text: '❌ Failed to check permissions'
            }, { quoted: msg });
        }

        const action = args[0]?.toLowerCase();
        const config = loadConfig();
        const groupConfig = config[chatId] || {
            enabled: false,
            mode: 'warn',
            maxWarnings: 3,
            exemptAdmins: true,
            warnings: {}
        };

        if (!action || action === 'help') {
            return sock.sendMessage(chatId, {
                text: `╭─⌈ 🚫 *ANTI-STATUS MENTION* ⌋\n│\n├─⊷ *${PREFIX}antistatusmention warn*\n│  └⊷ Warn the person\n│\n├─⊷ *${PREFIX}antistatusmention delete*\n│  └⊷ Notify & warn (delete mode)\n│\n├─⊷ *${PREFIX}antistatusmention kick*\n│  └⊷ Auto-kick after warnings\n│\n├─⊷ *${PREFIX}antistatusmention off*\n│  └⊷ Disable protection\n│\n├─⊷ *${PREFIX}antistatusmention maxwarn <number>*\n│  └⊷ Set max warnings before kick\n│\n├─⊷ *${PREFIX}antistatusmention reset <@user>*\n│  └⊷ Reset a user's warnings\n│\n├─⊷ *${PREFIX}antistatusmention status*\n│  └⊷ View current settings\n│\n│ _Short command:_ \`${PREFIX}asm\`\n╰───`
            }, { quoted: msg });
        }

        try {
            switch (action) {
                case 'warn': {
                    groupConfig.enabled = true;
                    groupConfig.mode = 'warn';
                    config[chatId] = groupConfig;
                    saveConfig(config);

                    await sock.sendMessage(chatId, {
                        text: `✅ *Anti-Status Mention ENABLED*\nMode: ⚠️ *WARN*\n\nMembers who mention this group in their status will receive a warning.\nMax warnings: *${groupConfig.maxWarnings}*`
                    }, { quoted: msg });
                    break;
                }

                case 'delete': {
                    groupConfig.enabled = true;
                    groupConfig.mode = 'delete';
                    config[chatId] = groupConfig;
                    saveConfig(config);

                    await sock.sendMessage(chatId, {
                        text: `✅ *Anti-Status Mention ENABLED*\nMode: 🗑️ *DELETE*\n\nMembers who mention this group in their status will be notified and warned.\nMax warnings: *${groupConfig.maxWarnings}*`
                    }, { quoted: msg });
                    break;
                }

                case 'kick': {
                    groupConfig.enabled = true;
                    groupConfig.mode = 'kick';
                    if (!groupConfig.maxWarnings || groupConfig.maxWarnings > 3) {
                        groupConfig.maxWarnings = 1;
                    }
                    config[chatId] = groupConfig;
                    saveConfig(config);

                    await sock.sendMessage(chatId, {
                        text: `✅ *Anti-Status Mention ENABLED*\nMode: 🦶 *KICK*\n\nMembers who mention this group in their status will be removed after *${groupConfig.maxWarnings}* warning(s).\n\n⚠️ _Make sure I have admin permissions!_`
                    }, { quoted: msg });
                    break;
                }

                case 'off':
                case 'disable': {
                    groupConfig.enabled = false;
                    config[chatId] = groupConfig;
                    saveConfig(config);

                    await sock.sendMessage(chatId, {
                        text: '❌ *Anti-Status Mention DISABLED*\nMembers can mention this group in their status freely.'
                    }, { quoted: msg });
                    break;
                }

                case 'maxwarn':
                case 'maxwarnings': {
                    const num = parseInt(args[1]);
                    if (!num || num < 1 || num > 10) {
                        return sock.sendMessage(chatId, {
                            text: `❌ Please provide a number between 1 and 10.\nExample: \`${PREFIX}antistatusmention maxwarn 3\``
                        }, { quoted: msg });
                    }

                    groupConfig.maxWarnings = num;
                    config[chatId] = groupConfig;
                    saveConfig(config);

                    await sock.sendMessage(chatId, {
                        text: `✅ *Max warnings set to ${num}*\n\nMembers will receive ${num} warning(s) before further action.`
                    }, { quoted: msg });
                    break;
                }

                case 'reset': {
                    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
                    if (mentioned && mentioned.length > 0) {
                        const targetJid = cleanJid(mentioned[0]);
                        if (groupConfig.warnings?.[targetJid]) {
                            delete groupConfig.warnings[targetJid];
                            config[chatId] = groupConfig;
                            saveConfig(config);
                            await sock.sendMessage(chatId, {
                                text: `✅ Warnings reset for @${targetJid.split('@')[0]}`,
                                mentions: [targetJid]
                            }, { quoted: msg });
                        } else {
                            await sock.sendMessage(chatId, {
                                text: '⚠️ That user has no warnings to reset.'
                            }, { quoted: msg });
                        }
                    } else if (args[1] === 'all') {
                        groupConfig.warnings = {};
                        config[chatId] = groupConfig;
                        saveConfig(config);
                        await sock.sendMessage(chatId, {
                            text: '✅ All warnings have been reset for this group.'
                        }, { quoted: msg });
                    } else {
                        await sock.sendMessage(chatId, {
                            text: `❌ Tag a user or use \`${PREFIX}antistatusmention reset all\``
                        }, { quoted: msg });
                    }
                    break;
                }

                case 'status':
                case 'settings': {
                    const modeEmoji = { warn: '⚠️', delete: '🗑️', kick: '🦶' };
                    const warningsList = Object.entries(groupConfig.warnings || {});
                    let warnText = '';
                    if (warningsList.length > 0) {
                        warnText = '\n\n📋 *Warning Log:*\n' + warningsList.map(([jid, count]) =>
                            `• @${jid.split('@')[0]}: ${count} warning(s)`
                        ).join('\n');
                    }

                    await sock.sendMessage(chatId, {
                        text: `📊 *ANTI-STATUS MENTION STATUS*\n\nEnabled: ${groupConfig.enabled ? '✅ YES' : '❌ NO'}\nMode: ${modeEmoji[groupConfig.mode] || '❓'} *${(groupConfig.mode || 'none').toUpperCase()}*\nMax Warnings: *${groupConfig.maxWarnings || 3}*\nAdmins Exempt: ${groupConfig.exemptAdmins ? '✅ Yes' : '❌ No'}${warnText}`,
                        mentions: warningsList.map(([jid]) => jid)
                    }, { quoted: msg });
                    break;
                }

                default: {
                    await sock.sendMessage(chatId, {
                        text: `❌ Unknown option. Use \`${PREFIX}antistatusmention help\` for usage.`
                    }, { quoted: msg });
                }
            }
        } catch (error) {
            console.error('[ANTISTATUSMENTION] Command error:', error);
            await sock.sendMessage(chatId, {
                text: `❌ Error: ${error.message}`
            }, { quoted: msg });
        }
    }
};
