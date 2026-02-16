import fs from 'fs';
import axios from 'axios';

export default {
    name: 'welcome',
    alias: ['welcomemsg', 'setwelcome', 'welcomeon'],
    category: 'group',
    description: 'Welcome new group members with their profile picture',
    groupOnly: true,
    
    async execute(sock, msg, args, PREFIX, extra) {
        const chatId = msg.key.remoteJid;
        const participant = msg.key.participant;
        
        try {
            const metadata = await sock.groupMetadata(chatId);
            const isAdmin = metadata.participants.find(p => p.id === participant)?.admin || false;
            
            if (!isAdmin && !extra?.jidManager?.isOwner(msg)) {
                return sock.sendMessage(chatId, {
                    text: '❌ *Admin Only Command*\nYou need to be admin to use this command.'
                }, { quoted: msg });
            }
        } catch (error) {
            return sock.sendMessage(chatId, {
                text: '❌ Failed to check permissions'
            }, { quoted: msg });
        }
        
        const action = args[0]?.toLowerCase();

        if (!action || action === 'help') {
            return sock.sendMessage(chatId, {
                text: `╭─⌈ 🎉 *WELCOME SYSTEM* ⌋\n│\n├─⊷ *${PREFIX}welcome on*\n│  └⊷ Enable welcome messages\n│\n├─⊷ *${PREFIX}welcome off*\n│  └⊷ Disable welcome messages\n│\n├─⊷ *${PREFIX}welcome set <message>*\n│  └⊷ Set custom welcome message\n│\n├─⊷ *${PREFIX}welcome reset*\n│  └⊷ Reset to default message\n│\n├─⊷ *${PREFIX}welcome preview*\n│  └⊷ Preview welcome message\n│\n├─⊷ *${PREFIX}welcome status*\n│  └⊷ Check system status\n│\n│ Variables: {name}, {group}, {members}, {mention}\n╰───`
            }, { quoted: msg });
        }
        
        const welcomeData = loadWelcomeData();
        const groupWelcome = welcomeData.groups[chatId] || {
            enabled: false,
            message: "🎉 *Welcome to {group}!*\n\nHey {mention}, glad to have you here! 🎊\nWe're now *{members}* members strong! 💪\n\nEnjoy your stay! 😊",
            lastWelcome: null
        };
        
        try {
            switch (action) {
                case 'on':
                case 'enable':
                    groupWelcome.enabled = true;
                    welcomeData.groups[chatId] = groupWelcome;
                    saveWelcomeData(welcomeData);
                    
                    await sock.sendMessage(chatId, {
                        text: '✅ *Welcome messages ENABLED*\nNew members will now receive welcome messages with their profile picture!'
                    }, { quoted: msg });
                    break;
                    
                case 'off':
                case 'disable':
                    groupWelcome.enabled = false;
                    welcomeData.groups[chatId] = groupWelcome;
                    saveWelcomeData(welcomeData);
                    
                    await sock.sendMessage(chatId, {
                        text: '❌ *Welcome messages DISABLED*\nNew members will not receive welcome messages.'
                    }, { quoted: msg });
                    break;
                    
                case 'set':
                    if (!args.slice(1).join(' ')) {
                        return sock.sendMessage(chatId, {
                            text: `❌ Please provide a welcome message!\nExample: \`${PREFIX}welcome set Welcome {name} to {group}! 🎉\``
                        }, { quoted: msg });
                    }
                    
                    const newMessage = args.slice(1).join(' ');
                    groupWelcome.message = newMessage;
                    welcomeData.groups[chatId] = groupWelcome;
                    saveWelcomeData(welcomeData);
                    
                    await sock.sendMessage(chatId, {
                        text: `✅ *Welcome message UPDATED*\n\nNew message:\n"${newMessage}"`
                    }, { quoted: msg });
                    break;
                    
                case 'preview':
                case 'test':
                case 'demo': {
                    const testJid = msg.key.participant || chatId;
                    await sendWelcomeMessage(sock, chatId, [testJid], groupWelcome.message);
                    break;
                }
                    
                case 'status': {
                    await sock.sendMessage(chatId, {
                        text: `📊 *WELCOME SYSTEM STATUS*\n\nEnabled: ${groupWelcome.enabled ? '✅ YES' : '❌ NO'}\nLast Welcome: ${groupWelcome.lastWelcome ? new Date(groupWelcome.lastWelcome).toLocaleString() : 'Never'}\n\nCurrent Message:\n"${groupWelcome.message.substring(0, 200)}${groupWelcome.message.length > 200 ? '...' : ''}"`
                    }, { quoted: msg });
                    break;
                }

                case 'reset':
                case 'default': {
                    const defaultMsg = "🎉 *Welcome to {group}!*\n\nHey {mention}, glad to have you here! 🎊\nWe're now *{members}* members strong! 💪\n\nEnjoy your stay! 😊";
                    groupWelcome.message = defaultMsg;
                    welcomeData.groups[chatId] = groupWelcome;
                    saveWelcomeData(welcomeData);

                    await sock.sendMessage(chatId, {
                        text: `🔄 *Welcome message RESET*\n\nMessage has been restored to default:\n"${defaultMsg}"`
                    }, { quoted: msg });
                    break;
                }
                    
                default:
                    await sock.sendMessage(chatId, {
                        text: `╭─⌈ ❌ *WELCOME* ⌋\n│\n├─⊷ *${PREFIX}welcome help*\n│  └⊷ View usage instructions\n│\n╰───`
                    }, { quoted: msg });
            }
        } catch (error) {
            console.error('Welcome command error:', error);
            await sock.sendMessage(chatId, {
                text: `❌ Error: ${error.message}`
            }, { quoted: msg });
        }
    }
};

function normalizeJid(participant) {
    if (typeof participant === 'string') {
        return participant.includes('@') ? participant : null;
    }
    if (participant && typeof participant === 'object') {
        const jid = participant.jid || participant.id || participant.userJid || participant.participant || participant.user;
        if (typeof jid === 'string' && jid.includes('@')) return jid;
        if (typeof jid === 'string' && /^\d+$/.test(jid)) return `${jid}@s.whatsapp.net`;
        if (typeof jid === 'object' && jid?.user) return `${jid.user}@s.whatsapp.net`;
        const keys = Object.keys(participant);
        for (const key of keys) {
            const val = participant[key];
            if (typeof val === 'string' && val.includes('@s.whatsapp.net')) return val;
        }
        console.log(`[WELCOME] Unknown participant shape: ${JSON.stringify(participant).substring(0, 200)}`);
        return null;
    }
    return null;
}

export async function sendWelcomeMessage(sock, groupId, memberJids, customMessage) {
    try {
        let metadata;
        try {
            metadata = await sock.groupMetadata(groupId);
        } catch (err) {
            console.log(`[WELCOME] Could not get group metadata: ${err.message}`);
            metadata = { participants: [], subject: 'Our Group' };
        }
        const memberCount = metadata.participants.length;
        const groupName = metadata.subject || "Our Group";
        
        let groupPpUrl = null;
        try {
            groupPpUrl = await sock.profilePictureUrl(groupId, 'image');
        } catch {
        }
        
        for (const rawJid of memberJids) {
            const userId = normalizeJid(rawJid);
            
            if (!userId || userId === 'undefined' || userId === '[object Object]') {
                console.log(`[WELCOME] Skipping invalid JID: ${JSON.stringify(rawJid)}`);
                continue;
            }

            try {
                const userName = userId.split('@')[0];
                
                let memberPpBuffer = null;
                try {
                    const memberPpUrl = await sock.profilePictureUrl(userId, 'image');
                    if (memberPpUrl) {
                        const mpRes = await axios.get(memberPpUrl, { responseType: 'arraybuffer', timeout: 10000 });
                        memberPpBuffer = Buffer.from(mpRes.data);
                    }
                } catch {
                }
                
                let groupPpBuffer = null;
                if (groupPpUrl) {
                    try {
                        const gpRes = await axios.get(groupPpUrl, { responseType: 'arraybuffer', timeout: 10000 });
                        groupPpBuffer = Buffer.from(gpRes.data);
                    } catch {
                    }
                }
                
                const message = customMessage || `╔══════════════════╗\n   🐺 *WELCOME TO {group}!*\n╚══════════════════╝\n\nHey {mention}, welcome to the pack! 🎉\n\n👥 *Total Members:* {members}\n\nEnjoy your stay and have fun! 🎊`;
                
                const welcomeText = message
                    .replace(/{name}/g, userName)
                    .replace(/{group}/g, groupName)
                    .replace(/{members}/g, memberCount.toString())
                    .replace(/{mention}/g, `@${userName}`);
                
                const sendImage = memberPpBuffer || groupPpBuffer;
                
                if (sendImage) {
                    const msgPayload = {
                        image: sendImage,
                        caption: welcomeText,
                        mentions: [userId],
                        contextInfo: {
                            mentionedJid: [userId],
                            externalAdReply: {
                                title: `🐺 Welcome to ${groupName}`,
                                body: `👥 Member #${memberCount}`,
                                mediaType: 1,
                                thumbnailUrl: groupPpUrl || '',
                                sourceUrl: '',
                                renderLargerThumbnail: false
                            }
                        }
                    };
                    await sock.sendMessage(groupId, msgPayload);
                } else {
                    await sock.sendMessage(groupId, {
                        text: welcomeText,
                        mentions: [userId]
                    });
                }
                
                console.log(`[WELCOME] ✅ Welcomed ${userName} in ${groupId.split('@')[0]}`);
                
            } catch (err) {
                console.error(`[WELCOME] ❌ Error welcoming ${userId}: ${err.message}`);
                try {
                    const fallbackName = typeof userId === 'string' ? userId.split('@')[0] : 'member';
                    await sock.sendMessage(groupId, {
                        text: `🎉 Welcome @${fallbackName} to ${groupName}! 🎊\n👥 Total Members: ${memberCount}`,
                        mentions: [userId]
                    });
                } catch {
                }
            }
        }
        
        const welcomeData = loadWelcomeData();
        if (welcomeData.groups[groupId]) {
            welcomeData.groups[groupId].lastWelcome = Date.now();
            saveWelcomeData(welcomeData);
        }
        
    } catch (error) {
        console.error(`[WELCOME] ❌ Fatal error: ${error.message}`);
    }
}

export function isWelcomeEnabled(groupId) {
    try {
        const welcomeData = loadWelcomeData();
        return welcomeData.groups[groupId]?.enabled === true;
    } catch {
        return false;
    }
}

export function getWelcomeMessage(groupId) {
    try {
        const welcomeData = loadWelcomeData();
        return welcomeData.groups[groupId]?.message || "🎉 *Welcome to {group}!*\n\nHey {mention}, glad to have you here! 🎊\nWe're now *{members}* members strong! 💪\n\nEnjoy your stay! 😊";
    } catch {
        return "🎉 *Welcome to {group}!*\n\nHey {mention}, glad to have you here! 🎊\nWe're now *{members}* members strong! 💪\n\nEnjoy your stay! 😊";
    }
}

function loadWelcomeData() {
    try {
        if (fs.existsSync('./data/welcome_data.json')) {
            return JSON.parse(fs.readFileSync('./data/welcome_data.json', 'utf8'));
        }
    } catch (error) {
        console.error('Error loading welcome data:', error);
    }
    
    return {
        groups: {},
        version: '2.0',
        created: new Date().toISOString()
    };
}

function saveWelcomeData(data) {
    try {
        if (!fs.existsSync('./data')) {
            fs.mkdirSync('./data', { recursive: true });
        }
        
        data.updated = new Date().toISOString();
        fs.writeFileSync('./data/welcome_data.json', JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving welcome data:', error);
        return false;
    }
}
