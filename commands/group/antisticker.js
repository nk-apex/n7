





// import fs from 'fs';
// import path from 'path';

// const antiStickerFile = './antisticker.json';

// // Ensure JSON file exists
// if (!fs.existsSync(antiStickerFile)) {
//     fs.writeFileSync(antiStickerFile, '[]');
// }

// // Load settings
// function loadAntiSticker() {
//     try {
//         if (!fs.existsSync(antiStickerFile)) return [];
//         const data = fs.readFileSync(antiStickerFile, 'utf8');
//         return JSON.parse(data);
//     } catch (error) {
//         console.error('Error loading anti-sticker settings:', error);
//         return [];
//     }
// }

// // Save settings
// function saveAntiSticker(data) {
//     try {
//         fs.writeFileSync(antiStickerFile, JSON.stringify(data, null, 2));
//     } catch (error) {
//         console.error('Error saving anti-sticker settings:', error);
//     }
// }

// // Utility function to clean JID
// function cleanJid(jid) {
//     if (!jid) return jid;
//     // Remove device suffix and ensure proper format
//     const clean = jid.split(':')[0];
//     return clean.includes('@') ? clean : clean + '@s.whatsapp.net';
// }

// // Setup listener once globally
// let listenerAttached = false;

// export default {
//     name: 'antisticker',
//     description: 'Enable or disable sticker blocking for non-admins in the group',
//     category: 'group',
//     async execute(sock, msg, args, metadata) {
//         const chatId = msg.key.remoteJid;
//         const isGroup = chatId.endsWith('@g.us');
        
//         if (!isGroup) {
//             return sock.sendMessage(chatId, { 
//                 text: '❌ This command can only be used in groups.' 
//             }, { quoted: msg });
//         }

//         // Get sender's JID
//         let sender = msg.key.participant || (msg.key.fromMe ? sock.user.id : msg.key.remoteJid);
//         sender = cleanJid(sender);

//         // Check if user is admin
//         let isAdmin = false;
//         let botIsAdmin = false;
        
//         try {
//             const groupMetadata = await sock.groupMetadata(chatId);
//             const cleanSender = cleanJid(sender);
            
//             // Check if sender is admin
//             const participant = groupMetadata.participants.find(p => {
//                 const cleanParticipantJid = cleanJid(p.id);
//                 return cleanParticipantJid === cleanSender;
//             });
            
//             isAdmin = participant?.admin === 'admin' || participant?.admin === 'superadmin';
            
//             // Check if bot is admin
//             const botJid = cleanJid(sock.user?.id);
//             const botParticipant = groupMetadata.participants.find(p => {
//                 const cleanParticipantJid = cleanJid(p.id);
//                 return cleanParticipantJid === botJid;
//             });
//             botIsAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin';
            
//         } catch (error) {
//             console.error('Error fetching group metadata:', error);
//             return sock.sendMessage(chatId, { 
//                 text: '❌ Failed to fetch group information. Please try again.' 
//             }, { quoted: msg });
//         }

//         // ONLY admins can use the command
//         if (!isAdmin) {
//             return sock.sendMessage(chatId, { 
//                 text: '❌ Only group admins can use this command!' 
//             }, { quoted: msg });
//         }

//         // Warn if bot is not admin
//         if (!botIsAdmin) {
//             await sock.sendMessage(chatId, { 
//                 text: '⚠️ *Warning:* I need admin permissions to delete stickers!\n\nPlease make me an admin for this feature to work properly.' 
//             }, { quoted: msg });
//         }

//         const subCommand = args[0]?.toLowerCase();
//         let settings = loadAntiSticker();

//         if (subCommand === 'on') {
//             if (!settings.includes(chatId)) {
//                 settings.push(chatId);
//                 saveAntiSticker(settings);
//                 // Attach listener if not already attached
//                 if (!listenerAttached) {
//                     setupAntiStickerListener(sock);
//                     listenerAttached = true;
//                 }
//                 await sock.sendMessage(chatId, { 
//                     text: '✅ *Anti-sticker enabled!*\n\nNow only admins can send stickers.\nRegular members\' stickers will be deleted automatically.' 
//                 }, { quoted: msg });
//             } else {
//                 await sock.sendMessage(chatId, { 
//                     text: 'ℹ️ Anti-sticker is already enabled in this group.\nOnly admins can send stickers.' 
//                 }, { quoted: msg });
//             }
//         } 
//         else if (subCommand === 'off') {
//             if (settings.includes(chatId)) {
//                 settings = settings.filter(id => id !== chatId);
//                 saveAntiSticker(settings);
//                 await sock.sendMessage(chatId, { 
//                     text: '❌ *Anti-sticker disabled!*\n\nEveryone can now send stickers in this group.' 
//                 }, { quoted: msg });
//             } else {
//                 await sock.sendMessage(chatId, { 
//                     text: 'ℹ️ Anti-sticker is already disabled in this group.\nEveryone can send stickers.' 
//                 }, { quoted: msg });
//             }
//         } 
//         else if (subCommand === 'status') {
//             const status = settings.includes(chatId) ? 
//                 '✅ ENABLED\n(Only admins can send stickers)' : 
//                 '❌ DISABLED\n(Everyone can send stickers)';
//             const botStatus = botIsAdmin ? '✅ I am admin' : '❌ I am NOT admin (feature won\'t work)';
            
//             await sock.sendMessage(chatId, { 
//                 text: `📊 *Anti-sticker Status*\n\n• Feature: ${status}\n• Bot status: ${botStatus}\n\n*Usage:*\n• \`.antisticker on\` - Enable (only admins can send stickers)\n• \`.antisticker off\` - Disable (everyone can send stickers)\n• \`.antisticker status\` - Check current status` 
//             }, { quoted: msg });
//         }
//         else {
//             await sock.sendMessage(chatId, { 
//                 text: '⚙️ *Anti-sticker Command*\n\nThis feature allows only admins to send stickers.\n\n*Usage:*\n• \`.antisticker on\` - Enable\n• \`.antisticker off\` - Disable\n• \`.antisticker status\` - Check status\n\n⚠️ *Note:* I need admin permissions to delete stickers.' 
//             }, { quoted: msg });
//         }
//     }
// };

// function setupAntiStickerListener(sock) {
//     console.log('🔧 Setting up anti-sticker listener...');
    
//     sock.ev.on('messages.upsert', async ({ messages }) => {
//         const newMsg = messages[0];
        
//         // Skip if no message or not a group message
//         if (!newMsg || !newMsg.key.remoteJid?.endsWith('@g.us')) return;
        
//         // Skip bot's own messages
//         if (newMsg.key.fromMe) return;
        
//         const chatId = newMsg.key.remoteJid;
        
//         // Load current settings
//         const antiStickerGroups = loadAntiSticker();
        
//         // Check if anti-sticker is enabled for this group AND message is a sticker
//         if (antiStickerGroups.includes(chatId) && newMsg.message?.stickerMessage) {
//             try {
//                 // Get the sticker sender
//                 const stickerSender = newMsg.key.participant || newMsg.key.remoteJid;
//                 const cleanStickerSender = cleanJid(stickerSender);
                
//                 // Fetch group metadata
//                 const groupMetadata = await sock.groupMetadata(chatId);
                
//                 // Check if sticker sender is admin
//                 let isStickerSenderAdmin = false;
//                 const senderParticipant = groupMetadata.participants.find(p => {
//                     const cleanParticipantJid = cleanJid(p.id);
//                     return cleanParticipantJid === cleanStickerSender;
//                 });
                
//                 isStickerSenderAdmin = senderParticipant?.admin === 'admin' || senderParticipant?.admin === 'superadmin';
                
//                 // If sender is NOT admin, delete the sticker
//                 if (!isStickerSenderAdmin) {
//                     // Send warning message
//                     await sock.sendMessage(chatId, { 
//                         text: `🚫 *Sticker Blocked!*\nOnly admins can send stickers in this group.`,
//                         mentions: [cleanStickerSender]
//                     });
                    
//                     // Try to delete the sticker
//                     try {
//                         await sock.sendMessage(chatId, { 
//                             delete: {
//                                 id: newMsg.key.id,
//                                 participant: stickerSender,
//                                 remoteJid: chatId,
//                                 fromMe: false
//                             }
//                         });
//                         console.log(`Deleted sticker from ${cleanStickerSender} in ${chatId}`);
//                     } catch (deleteError) {
//                         if (deleteError.message?.includes('not an admin')) {
//                             console.log(`Cannot delete sticker - bot is not admin in ${chatId}`);
//                         }
//                     }
//                 }
                
//             } catch (error) {
//                 console.error('Error handling sticker:', error);
//             }
//         }
//     });
    
//     console.log('✅ Anti-sticker listener attached');
// }










import fs from 'fs';
import path from 'path';

const antiStickerFile = './antisticker.json';

// Ensure JSON file exists
if (!fs.existsSync(antiStickerFile)) {
    fs.writeFileSync(antiStickerFile, JSON.stringify([], null, 2));
}

// Load settings
function loadAntiSticker() {
    try {
        if (!fs.existsSync(antiStickerFile)) return [];
        const data = fs.readFileSync(antiStickerFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading anti-sticker settings:', error);
        return [];
    }
}

// Save settings
function saveAntiSticker(data) {
    try {
        fs.writeFileSync(antiStickerFile, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving anti-sticker settings:', error);
    }
}

// Utility function to clean JID
function cleanJid(jid) {
    if (!jid) return jid;
    // Remove device suffix and ensure proper format
    const clean = jid.split(':')[0];
    return clean.includes('@') ? clean : clean + '@s.whatsapp.net';
}

// Setup listener once globally
let listenerAttached = false;

export default {
    name: 'antisticker',
    description: 'Control sticker sharing in the group with admin exemption',
    category: 'group',
    async execute(sock, msg, args, metadata) {
        const chatId = msg.key.remoteJid;
        const isGroup = chatId.endsWith('@g.us');
        
        if (!isGroup) {
            return sock.sendMessage(chatId, { 
                text: '❌ This command can only be used in groups.' 
            }, { quoted: msg });
        }

        // Get sender's JID
        let sender = msg.key.participant || (msg.key.fromMe ? sock.user.id : msg.key.remoteJid);
        sender = cleanJid(sender);

        // Check if user is admin
        let isAdmin = false;
        let botIsAdmin = false;
        let botIsSuperAdmin = false;
        
        try {
            const groupMetadata = await sock.groupMetadata(chatId);
            const cleanSender = cleanJid(sender);
            
            // Check if sender is admin
            const participant = groupMetadata.participants.find(p => {
                const cleanParticipantJid = cleanJid(p.id);
                return cleanParticipantJid === cleanSender;
            });
            
            isAdmin = participant?.admin === 'admin' || participant?.admin === 'superadmin';
            
            // Check if bot is admin
            const botJid = cleanJid(sock.user?.id);
            const botParticipant = groupMetadata.participants.find(p => {
                const cleanParticipantJid = cleanJid(p.id);
                return cleanParticipantJid === botJid;
            });
            botIsAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin';
            botIsSuperAdmin = botParticipant?.admin === 'superadmin';
            
        } catch (error) {
            console.error('Error fetching group metadata:', error);
            return sock.sendMessage(chatId, { 
                text: '❌ Failed to fetch group information. Please try again.' 
            }, { quoted: msg });
        }

        // ONLY admins can use the command
        if (!isAdmin) {
            return sock.sendMessage(chatId, { 
                text: '❌ Only group admins can use this command!' 
            }, { quoted: msg });
        }

        const settings = loadAntiSticker();
        const groupIndex = settings.findIndex(g => g.chatId === chatId);
        const currentGroupSettings = groupIndex !== -1 ? settings[groupIndex] : null;

        const subCommand = args[0]?.toLowerCase();

        if (subCommand === 'on') {
            const mode = args[1]?.toLowerCase();
            
            if (!mode || !['warn', 'delete', 'kick'].includes(mode)) {
                return sock.sendMessage(chatId, { 
                    text: '╭─⌈ ⚙️ *ANTI-STICKER SETUP* ⌋\n│\n├─⊷ *.antisticker on warn*\n│  └⊷ Warn senders\n├─⊷ *.antisticker on delete*\n│  └⊷ Auto-delete stickers\n├─⊷ *.antisticker on kick*\n│  └⊷ Kick senders\n╰───' 
                }, { quoted: msg });
            }

            // // Warn if bot is not admin for certain modes
            // if (!botIsAdmin && (mode === 'delete' || mode === 'kick')) {
            //     await sock.sendMessage(chatId, { 
            //         text: '⚠️ *Warning:* I need admin permissions for delete/kick modes!\n\nPlease make me an admin for these features to work properly.' 
            //     }, { quoted: msg });
            // }

            // Warn if bot is not superadmin for kick mode
            if (!botIsSuperAdmin && mode === 'kick') {
                await sock.sendMessage(chatId, { 
                    text: '⚠️ *Important:* I need *superadmin* permissions to kick members!\n\nPlease make me a superadmin for kick mode to work.' 
                }, { quoted: msg });
            }

            const newSettings = {
                chatId,
                enabled: true,
                mode: mode,
                exemptAdmins: true,
                warningCount: {} // Track warnings per user
            };

            if (groupIndex !== -1) {
                settings[groupIndex] = newSettings;
            } else {
                settings.push(newSettings);
            }

            saveAntiSticker(settings);
            
            // Attach listener if not already attached
            if (!listenerAttached) {
                setupAntiStickerListener(sock);
                listenerAttached = true;
            }

            const modeDescriptions = {
                'warn': 'Users will receive warnings when sending stickers',
                'delete': 'Stickers will be automatically deleted',
                'kick': 'Users will be kicked for sending stickers'
            };

            await sock.sendMessage(chatId, { 
                text: `✅ *Anti-Sticker enabled!*\n\nMode: *${mode.toUpperCase()}*\n` 
            }, { quoted: msg });

        } 
        else if (subCommand === 'off') {
            if (groupIndex !== -1) {
                settings.splice(groupIndex, 1);
                saveAntiSticker(settings);
                await sock.sendMessage(chatId, { 
                    text: '❌ *Anti-Sticker disabled!*\n\nEveryone can now send stickers in this group.' 
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { 
                    text: 'ℹ️ Anti-Sticker is already disabled in this group.\nEveryone can send stickers.' 
                }, { quoted: msg });
            }
        } 
        else if (subCommand === 'exemptadmins') {
            if (!currentGroupSettings || !currentGroupSettings.enabled) {
                return sock.sendMessage(chatId, { 
                    text: '❌ Anti-Sticker is not enabled in this group.\nEnable it first with `.antisticker on [mode]`' 
                }, { quoted: msg });
            }

            const toggle = args[1]?.toLowerCase();
            if (toggle === 'off') {
                currentGroupSettings.exemptAdmins = false;
                await sock.sendMessage(chatId, { 
                    text: '⚙️ *Admin exemption disabled*\n\nAdmins will now be subject to anti-sticker rules.' 
                }, { quoted: msg });
            } else if (toggle === 'on') {
                currentGroupSettings.exemptAdmins = true;
                await sock.sendMessage(chatId, { 
                    text: '⚙️ *Admin exemption enabled*\n\nAdmins can now send stickers freely.' 
                }, { quoted: msg });
            } else {
                const currentStatus = currentGroupSettings.exemptAdmins ? 'enabled' : 'disabled';
                await sock.sendMessage(chatId, { 
                    text: `⚙️ *Admin Exemption Status*\n\nCurrently: *${currentStatus}*\n\nTo change:\n\`.antisticker exemptadmins on\` - Enable\n\`.antisticker exemptadmins off\` - Disable` 
                }, { quoted: msg });
            }
            
            settings[groupIndex] = currentGroupSettings;
            saveAntiSticker(settings);
        }
        else if (subCommand === 'status') {
            if (currentGroupSettings) {
                const status = currentGroupSettings.enabled ? 
                    `✅ ENABLED (${currentGroupSettings.mode.toUpperCase()} mode)` : 
                    '❌ DISABLED';
                
                const botStatus = botIsAdmin ? '✅ I am admin' : '❌ I am NOT admin';
                const botSuperStatus = botIsSuperAdmin ? '✅ I am superadmin' : '❌ I am NOT superadmin';
                
                let statusText = `📊 *Anti-Sticker Status*\n\n`;
                statusText += `• Feature: ${status}\n`;
                statusText += `• Bot admin: ${botStatus}\n`;
                statusText += `• Bot superadmin: ${botSuperStatus}\n\n`;
                
                if (currentGroupSettings.enabled) {
                    statusText += `• Mode: ${currentGroupSettings.mode.toUpperCase()}\n`;
                    statusText += `• Admins exempt: ${currentGroupSettings.exemptAdmins ? 'Yes' : 'No'}\n`;
                    
                    // Show warning counts if any
                    if (currentGroupSettings.warningCount && Object.keys(currentGroupSettings.warningCount).length > 0) {
                        statusText += `\n• Users warned: ${Object.keys(currentGroupSettings.warningCount).length}`;
                    }
                }
                
                statusText += `\n\n*What is blocked:*\n• All stickers\n• Animated stickers\n• Sticker packs`;
                
                await sock.sendMessage(chatId, { text: statusText }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { 
                    text: `📊 *Anti-Sticker Status*\n\n❌ DISABLED\nEveryone can send stickers.\n\n*To enable:*\n\`.antisticker on [mode]\`\n\nModes: warn, delete, kick\n\nExample: \`.antisticker on delete\`` 
                }, { quoted: msg });
            }
        }
        else {
            // Show help
            const helpText = `╭─⌈ 🎭 *ANTI-STICKER* ⌋\n│\n├─⊷ *.antisticker on <warn|delete|kick>*\n│  └⊷ Enable with mode\n├─⊷ *.antisticker off*\n│  └⊷ Disable protection\n├─⊷ *.antisticker exemptadmins [on/off]*\n│  └⊷ Toggle admin exemption\n├─⊷ *.antisticker status*\n│  └⊷ View current status\n╰───`;
            
            await sock.sendMessage(chatId, { text: helpText }, { quoted: msg });
        }
    }
};

function setupAntiStickerListener(sock) {
    console.log('🔧 Setting up anti-sticker listener...');
    
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const newMsg = messages[0];
        
        // Skip if no message or not a group message
        if (!newMsg || !newMsg.key.remoteJid?.endsWith('@g.us')) return;
        
        // Skip bot's own messages
        if (newMsg.key.fromMe) return;
        
        const chatId = newMsg.key.remoteJid;
        
        // Load current settings
        const settings = loadAntiSticker();
        const groupSettings = settings.find(g => g.chatId === chatId);
        
        // Skip if anti-sticker not enabled for this group
        if (!groupSettings || !groupSettings.enabled) return;
        
        // Check if message contains a sticker
        const message = newMsg.message;
        let isSticker = false;
        
        if (message?.stickerMessage) {
            isSticker = true;
        }
        
        // Skip if not a sticker
        if (!isSticker) {
            return;
        }
        
        // Get sender
        const messageSender = newMsg.key.participant || newMsg.key.remoteJid;
        const cleanMessageSender = cleanJid(messageSender);
        const senderNumber = cleanMessageSender.split('@')[0];
        
        try {
            // Fetch group metadata
            const groupMetadata = await sock.groupMetadata(chatId);
            
            // Check if sender is admin
            let isSenderAdmin = false;
            const senderParticipant = groupMetadata.participants.find(p => {
                const cleanParticipantJid = cleanJid(p.id);
                return cleanParticipantJid === cleanMessageSender;
            });
            
            isSenderAdmin = senderParticipant?.admin === 'admin' || senderParticipant?.admin === 'superadmin';
            
            // Skip if sender is admin and exemptAdmins is true
            if (isSenderAdmin && groupSettings.exemptAdmins) {
                console.log(`Skipping admin ${cleanMessageSender} for sticker in ${chatId}`);
                return;
            }
            
            console.log(`Sticker detected from ${cleanMessageSender} in ${chatId}`);
            
            // Initialize warning count for user if not exists
            if (!groupSettings.warningCount) {
                groupSettings.warningCount = {};
            }
            
            const userId = cleanMessageSender;
            if (!groupSettings.warningCount[userId]) {
                groupSettings.warningCount[userId] = 0;
            }
            
            // Handle based on mode
            switch (groupSettings.mode) {
                case 'warn':
                    groupSettings.warningCount[userId]++;
                    const warnings = groupSettings.warningCount[userId];
                    
                    await sock.sendMessage(chatId, { 
                        text: `⚠️ *Sticker Warning* @${senderNumber}\n\nStickers are not allowed in this group!\nWarning #${warnings}\n\nRepeated violations may result in stricter actions.`,
                        mentions: [cleanMessageSender]
                    });
                    
                    // Update settings with warning count
                    const warnSettingsIndex = settings.findIndex(g => g.chatId === chatId);
                    if (warnSettingsIndex !== -1) {
                        settings[warnSettingsIndex] = groupSettings;
                        saveAntiSticker(settings);
                    }
                    break;
                    
                case 'delete':
                    // Send warning
                    await sock.sendMessage(chatId, { 
                        text: `🚫 *Sticker Deleted* @${senderNumber}\n\nStickers are not allowed in this group!\nYour sticker has been removed.`,
                        mentions: [cleanMessageSender]
                    });
                    
                    // Try to delete the message
                    try {
                        await sock.sendMessage(chatId, { 
                            delete: {
                                id: newMsg.key.id,
                                participant: messageSender,
                                remoteJid: chatId,
                                fromMe: false
                            }
                        });
                        console.log(`Deleted sticker from ${cleanMessageSender} in ${chatId}`);
                    } catch (deleteError) {
                        console.error('Failed to delete sticker:', deleteError);
                    }
                    break;
                    
                case 'kick':
                    // Check if bot is superadmin
                    const botJid = cleanJid(sock.user?.id);
                    const botParticipant = groupMetadata.participants.find(p => {
                        const cleanParticipantJid = cleanJid(p.id);
                        return cleanParticipantJid === botJid;
                    });
                    const botIsSuperAdmin = botParticipant?.admin === 'superadmin';
                    
                    if (!botIsSuperAdmin) {
                        await sock.sendMessage(chatId, { 
                            text: `⚠️ *Cannot Kick*\n\nI need superadmin permissions to kick members.\n\nUser @${senderNumber} sent a sticker but I cannot kick them.`,
                            mentions: [cleanMessageSender]
                        });
                        return;
                    }
                    
                    // Send warning before kick
                    await sock.sendMessage(chatId, { 
                        text: `🚫 *Violation Detected* @${senderNumber}\n\nSending stickers is not allowed in this group!\nYou will be kicked for this violation.`,
                        mentions: [cleanMessageSender]
                    });
                    
                    // Wait a moment then kick
                    setTimeout(async () => {
                        try {
                            await sock.groupParticipantsUpdate(chatId, [cleanMessageSender], 'remove');
                            await sock.sendMessage(chatId, { 
                                text: `👢 *User Kicked*\n\n@${senderNumber} was removed for sending a sticker.`
                            });
                        } catch (kickError) {
                            console.error('Failed to kick user:', kickError);
                            await sock.sendMessage(chatId, { 
                                text: `❌ *Failed to kick user*\n\nCould not remove @${senderNumber}. Please check my permissions.`,
                                mentions: [cleanMessageSender]
                            });
                        }
                    }, 2000);
                    break;
            }
            
        } catch (error) {
            console.error('Error handling sticker detection:', error);
        }
    });
    
    console.log('✅ Anti-sticker listener attached');
}