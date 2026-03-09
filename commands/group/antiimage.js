// import fs from 'fs';
// import path from 'path';

// const antiImageFile = './antiimage.json';

// // Ensure JSON file exists
// if (!fs.existsSync(antiImageFile)) {
//     fs.writeFileSync(antiImageFile, JSON.stringify([], null, 2));
// }

// // Load settings
// function loadAntiImage() {
//     try {
//         if (!fs.existsSync(antiImageFile)) return [];
//         const data = fs.readFileSync(antiImageFile, 'utf8');
//         return JSON.parse(data);
//     } catch (error) {
//         console.error('Error loading anti-image settings:', error);
//         return [];
//     }
// }

// // Save settings
// function saveAntiImage(data) {
//     try {
//         fs.writeFileSync(antiImageFile, JSON.stringify(data, null, 2));
//     } catch (error) {
//         console.error('Error saving anti-image settings:', error);
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
// let antiImageListenerAttached = false;

// export default {
//     name: 'antiimage',
//     description: 'Control image/media sharing in the group with different actions',
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
//         let botIsSuperAdmin = false;
        
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
//             botIsSuperAdmin = botParticipant?.admin === 'superadmin';
            
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

//         const settings = loadAntiImage();
//         const groupIndex = settings.findIndex(g => g.chatId === chatId);
//         const currentGroupSettings = groupIndex !== -1 ? settings[groupIndex] : null;

//         const subCommand = args[0]?.toLowerCase();
//         const mode = args[1]?.toLowerCase();

//         // Warn if bot is not admin for certain modes
//         if (!botIsAdmin && (mode === 'delete' || mode === 'kick')) {
//             await sock.sendMessage(chatId, { 
//                 text: '⚠️ *Warning:* I need admin permissions for delete/kick modes!\n\nPlease make me an admin for these features to work properly.' 
//             }, { quoted: msg });
//         }

//         // Warn if bot is not superadmin for kick mode
//         if (!botIsSuperAdmin && mode === 'kick') {
//             await sock.sendMessage(chatId, { 
//                 text: '⚠️ *Important:* I need *superadmin* permissions to kick members!\n\nPlease make me a superadmin for kick mode to work.' 
//             }, { quoted: msg });
//         }

//         if (subCommand === 'on') {
//             if (!mode || !['warn', 'delete', 'kick'].includes(mode)) {
//                 return sock.sendMessage(chatId, { 
//                     text: '⚙️ *Anti-Image Setup*\n\nUsage: `.antiimage on [mode]`\n\nAvailable modes:\n• `warn` - Warn users who share images/media\n• `delete` - Delete images automatically\n• `kick` - Kick users who share images\n\nExample: `.antiimage on delete`' 
//                 }, { quoted: msg });
//             }

//             // Parse media types
//             const mediaTypes = args.slice(2).map(t => t.toLowerCase()) || [];
//             const defaultTypes = ['image', 'video', 'gif', 'sticker'];
//             const validTypes = ['image', 'video', 'gif', 'sticker', 'audio', 'document'];
            
//             let selectedTypes = [];
//             if (mediaTypes.length > 0) {
//                 selectedTypes = mediaTypes.filter(type => validTypes.includes(type));
//             }
//             if (selectedTypes.length === 0) {
//                 selectedTypes = defaultTypes;
//             }

//             const newSettings = {
//                 chatId,
//                 enabled: true,
//                 mode: mode,
//                 mediaTypes: selectedTypes,
//                 exemptAdmins: true,
//                 warningCount: {} // Track warnings per user
//             };

//             if (groupIndex !== -1) {
//                 settings[groupIndex] = newSettings;
//             } else {
//                 settings.push(newSettings);
//             }

//             saveAntiImage(settings);
            
//             // Attach listener if not already attached
//             if (!antiImageListenerAttached) {
//                 setupAntiImageListener(sock);
//                 antiImageListenerAttached = true;
//             }

//             const modeDescriptions = {
//                 'warn': 'Users will receive warnings when sharing media',
//                 'delete': 'Media will be automatically deleted',
//                 'kick': 'Users will be kicked for sharing media'
//             };

//             const typesText = selectedTypes.map(t => `• ${t.charAt(0).toUpperCase() + t.slice(1)}`).join('\n');

//             await sock.sendMessage(chatId, { 
//                 text: `✅ *Anti-Image enabled!*\n\nMode: *${mode.toUpperCase()}*\n${modeDescriptions[mode]}\n\nBlocked media types:\n${typesText}\n\nAdmins are exempt from this rule.\n\nTo disable: \`.antiimage off\`` 
//             }, { quoted: msg });

//         } 
//         else if (subCommand === 'off') {
//             if (groupIndex !== -1) {
//                 settings.splice(groupIndex, 1);
//                 saveAntiImage(settings);
//                 await sock.sendMessage(chatId, { 
//                     text: '❌ *Anti-Image disabled!*\n\nEveryone can now share images/media in this group.' 
//                 }, { quoted: msg });
//             } else {
//                 await sock.sendMessage(chatId, { 
//                     text: 'ℹ️ Anti-Image is already disabled in this group.\nEveryone can share media.' 
//                 }, { quoted: msg });
//             }
//         } 
//         else if (subCommand === 'status') {
//             if (currentGroupSettings) {
//                 const status = currentGroupSettings.enabled ? 
//                     `✅ ENABLED (${currentGroupSettings.mode.toUpperCase()} mode)` : 
//                     '❌ DISABLED';
                
//                 const botStatus = botIsAdmin ? '✅ I am admin' : '❌ I am NOT admin';
//                 const botSuperStatus = botIsSuperAdmin ? '✅ I am superadmin' : '❌ I am NOT superadmin';
                
//                 let statusText = `📊 *Anti-Image Status*\n\n`;
//                 statusText += `• Feature: ${status}\n`;
//                 statusText += `• Bot admin: ${botStatus}\n`;
//                 statusText += `• Bot superadmin: ${botSuperStatus}\n\n`;
                
//                 if (currentGroupSettings.enabled) {
//                     const mediaTypesCount = currentGroupSettings.mediaTypes?.length || 0;
//                     const mediaTypesText = currentGroupSettings.mediaTypes?.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ') || 'None';
//                     statusText += `• Blocked media types: ${mediaTypesCount}\n`;
//                     statusText += `• Types: ${mediaTypesText}\n`;
//                     statusText += `• Admins exempt: ${currentGroupSettings.exemptAdmins ? 'Yes' : 'No'}\n\n`;
//                 }
                
//                 statusText += `*Detection:*\n• Images (JPG, PNG, etc.)\n• Videos (MP4, etc.)\n• GIFs\n• Stickers\n• Audio messages\n• Documents`;
                
//                 await sock.sendMessage(chatId, { text: statusText }, { quoted: msg });
//             } else {
//                 await sock.sendMessage(chatId, { 
//                     text: `📊 *Anti-Image Status*\n\n❌ DISABLED\nEveryone can share media.\n\n*To enable:*\n\`.antiimage on [mode] [types]\`\n\nModes: warn, delete, kick\nTypes: image, video, gif, sticker, audio, document\n\nExample: \`.antiimage on delete image video\`` 
//                 }, { quoted: msg });
//             }
//         }
//         else if (subCommand === 'types') {
//             if (!currentGroupSettings || !currentGroupSettings.enabled) {
//                 return sock.sendMessage(chatId, { 
//                     text: '❌ Anti-Image is not enabled in this group.\nEnable it first with `.antiimage on [mode]`' 
//                 }, { quoted: msg });
//             }

//             const action = args[1]?.toLowerCase();
            
//             if (action === 'add') {
//                 const typesToAdd = args.slice(2).map(t => t.toLowerCase()).filter(t => 
//                     ['image', 'video', 'gif', 'sticker', 'audio', 'document'].includes(t)
//                 );
                
//                 if (typesToAdd.length === 0) {
//                     return sock.sendMessage(chatId, { 
//                         text: 'Usage: `.antiimage types add [type1] [type2]...`\n\nValid types: image, video, gif, sticker, audio, document\n\nExample: `.antiimage types add audio document`' 
//                     }, { quoted: msg });
//                 }
                
//                 const addedTypes = [];
//                 typesToAdd.forEach(type => {
//                     if (!currentGroupSettings.mediaTypes.includes(type)) {
//                         currentGroupSettings.mediaTypes.push(type);
//                         addedTypes.push(type);
//                     }
//                 });
                
//                 if (addedTypes.length > 0) {
//                     settings[groupIndex] = currentGroupSettings;
//                     saveAntiImage(settings);
//                     await sock.sendMessage(chatId, { 
//                         text: `✅ Added media types:\n${addedTypes.map(t => `• ${t.charAt(0).toUpperCase() + t.slice(1)}`).join('\n')}\n\nNow blocking ${currentGroupSettings.mediaTypes.length} media types.` 
//                     }, { quoted: msg });
//                 } else {
//                     await sock.sendMessage(chatId, { 
//                         text: '⚠️ All specified types are already being blocked.' 
//                     }, { quoted: msg });
//                 }
//             }
//             else if (action === 'remove') {
//                 const typesToRemove = args.slice(2).map(t => t.toLowerCase());
                
//                 if (typesToRemove.length === 0) {
//                     return sock.sendMessage(chatId, { 
//                         text: 'Usage: `.antiimage types remove [type1] [type2]...`\n\nValid types: image, video, gif, sticker, audio, document\n\nExample: `.antiimage types remove sticker`' 
//                     }, { quoted: msg });
//                 }
                
//                 const removedTypes = [];
//                 typesToRemove.forEach(type => {
//                     const index = currentGroupSettings.mediaTypes.indexOf(type);
//                     if (index > -1) {
//                         currentGroupSettings.mediaTypes.splice(index, 1);
//                         removedTypes.push(type);
//                     }
//                 });
                
//                 if (removedTypes.length > 0) {
//                     settings[groupIndex] = currentGroupSettings;
//                     saveAntiImage(settings);
//                     await sock.sendMessage(chatId, { 
//                         text: `✅ Removed media types:\n${removedTypes.map(t => `• ${t.charAt(0).toUpperCase() + t.slice(1)}`).join('\n')}\n\nNow blocking ${currentGroupSettings.mediaTypes.length} media types.` 
//                     }, { quoted: msg });
//                 } else {
//                     await sock.sendMessage(chatId, { 
//                         text: '❌ None of the specified types were being blocked.' 
//                     }, { quoted: msg });
//                 }
//             }
//             else if (action === 'list') {
//                 const currentTypes = currentGroupSettings.mediaTypes || [];
//                 if (currentTypes.length === 0) {
//                     await sock.sendMessage(chatId, { 
//                         text: '📋 *Blocked Media Types*\n\nNo media types are currently blocked.\n\nAdd types with:\n`.antiimage types add [type]`' 
//                     }, { quoted: msg });
//                 } else {
//                     let listText = '📋 *Blocked Media Types*\n\n';
//                     currentTypes.forEach((type, index) => {
//                         listText += `${index + 1}. ${type.charAt(0).toUpperCase() + type.slice(1)}\n`;
//                     });
//                     listText += `\nTotal: ${currentTypes.length} types\n\nRemove types with:\n\`.antiimage types remove [type]\``;
//                     await sock.sendMessage(chatId, { text: listText }, { quoted: msg });
//                 }
//             }
//             else {
//                 await sock.sendMessage(chatId, { 
//                     text: '📋 *Media Types Management*\n\nUsage:\n• `.antiimage types add [type1] [type2]...`\n• `.antiimage types remove [type1] [type2]...`\n• `.antiimage types list`\n\nValid types: image, video, gif, sticker, audio, document' 
//                 }, { quoted: msg });
//             }
//         }
//         else if (subCommand === 'exemptadmins') {
//             if (!currentGroupSettings || !currentGroupSettings.enabled) {
//                 return sock.sendMessage(chatId, { 
//                     text: '❌ Anti-Image is not enabled in this group.' 
//                 }, { quoted: msg });
//             }

//             const toggle = args[1]?.toLowerCase();
//             if (toggle === 'off') {
//                 currentGroupSettings.exemptAdmins = false;
//                 await sock.sendMessage(chatId, { 
//                     text: '⚙️ *Admin exemption disabled*\n\nAdmins will now be subject to anti-image rules.' 
//                 }, { quoted: msg });
//             } else if (toggle === 'on') {
//                 currentGroupSettings.exemptAdmins = true;
//                 await sock.sendMessage(chatId, { 
//                     text: '⚙️ *Admin exemption enabled*\n\nAdmins can now share media freely.' 
//                 }, { quoted: msg });
//             } else {
//                 const currentStatus = currentGroupSettings.exemptAdmins ? 'enabled' : 'disabled';
//                 await sock.sendMessage(chatId, { 
//                     text: `⚙️ *Admin Exemption Status*\n\nCurrently: *${currentStatus}*\n\nTo change:\n\`.antiimage exemptadmins on\` - Enable\n\`.antiimage exemptadmins off\` - Disable` 
//                 }, { quoted: msg });
//             }
            
//             settings[groupIndex] = currentGroupSettings;
//             saveAntiImage(settings);
//         }
//         else if (subCommand === 'test') {
//             // Test command to simulate media detection
//             const mediaType = args[1]?.toLowerCase() || 'image';
//             const validTestTypes = ['image', 'video', 'gif', 'sticker', 'audio', 'document'];
            
//             if (!validTestTypes.includes(mediaType)) {
//                 await sock.sendMessage(chatId, { 
//                     text: `❌ Invalid media type. Valid types: ${validTestTypes.join(', ')}` 
//                 }, { quoted: msg });
//                 return;
//             }
            
//             let testResult = `🔍 *Media Detection Test*\n\n`;
//             testResult += `Test media type: ${mediaType.toUpperCase()}\n\n`;
            
//             if (currentGroupSettings && currentGroupSettings.enabled) {
//                 const isBlocked = currentGroupSettings.mediaTypes?.includes(mediaType) || false;
//                 testResult += `Status in this group: ${isBlocked ? '🚫 BLOCKED' : '✅ ALLOWED'}\n`;
//                 testResult += `Current mode: ${currentGroupSettings.mode.toUpperCase()}\n`;
//             } else {
//                 testResult += `Status: Anti-Image is disabled\n`;
//                 testResult += `This media type would be allowed.\n`;
//             }
            
//             testResult += `\nTo enable blocking: \`.antiimage on [mode] ${mediaType}\``;
            
//             await sock.sendMessage(chatId, { text: testResult }, { quoted: msg });
//         }
//         else {
//             // Show help
//             const helpText = `
// 🖼️ *Anti-Image Command*

// Control media sharing in groups.

// • \`.antiimage on [mode] [types]\`
//   • \`.antiimage off\`
// • \`.antiimage status\`
// • \`.antiimage types [add/remove/list] [types]\`
// • \`.antiimage exemptadmins [on/off]\`

// `.trim();
            
//             await sock.sendMessage(chatId, { text: helpText }, { quoted: msg });
//         }
//     }
// };

// function setupAntiImageListener(sock) {
//     console.log('🔧 Setting up anti-image listener for all media types...');
    
//     sock.ev.on('messages.upsert', async ({ messages }) => {
//         const newMsg = messages[0];
        
//         // Skip if no message or not a group message
//         if (!newMsg || !newMsg.key.remoteJid?.endsWith('@g.us')) return;
        
//         // Skip bot's own messages
//         if (newMsg.key.fromMe) return;
        
//         const chatId = newMsg.key.remoteJid;
        
//         // Load current settings
//         const settings = loadAntiImage();
//         const groupSettings = settings.find(g => g.chatId === chatId);
        
//         // Skip if anti-image not enabled for this group
//         if (!groupSettings || !groupSettings.enabled) return;
        
//         // Check if message contains blocked media
//         const message = newMsg.message;
//         let mediaType = null;
//         let isMedia = false;
        
//         // Check for different media types
//         if (message?.imageMessage) {
//             mediaType = 'image';
//             isMedia = true;
//         } else if (message?.videoMessage) {
//             // Check if it's a GIF (short video)
//             if (message.videoMessage.gifPlayback) {
//                 mediaType = 'gif';
//             } else {
//                 mediaType = 'video';
//             }
//             isMedia = true;
//         } else if (message?.stickerMessage) {
//             mediaType = 'sticker';
//             isMedia = true;
//         } else if (message?.audioMessage) {
//             mediaType = 'audio';
//             isMedia = true;
//         } else if (message?.documentMessage) {
//             mediaType = 'document';
//             isMedia = true;
//         }
        
//         // Skip if not media or media type not blocked
//         if (!isMedia || !mediaType || !groupSettings.mediaTypes?.includes(mediaType)) {
//             return;
//         }
        
//         // Get sender
//         const messageSender = newMsg.key.participant || newMsg.key.remoteJid;
//         const cleanMessageSender = cleanJid(messageSender);
//         const senderNumber = cleanMessageSender.split('@')[0];
        
//         try {
//             // Fetch group metadata
//             const groupMetadata = await sock.groupMetadata(chatId);
            
//             // Check if sender is admin
//             let isSenderAdmin = false;
//             const senderParticipant = groupMetadata.participants.find(p => {
//                 const cleanParticipantJid = cleanJid(p.id);
//                 return cleanParticipantJid === cleanMessageSender;
//             });
            
//             isSenderAdmin = senderParticipant?.admin === 'admin' || senderParticipant?.admin === 'superadmin';
            
//             // Skip if sender is admin and exemptAdmins is true
//             if (isSenderAdmin && groupSettings.exemptAdmins) {
//                 console.log(`Skipping admin ${cleanMessageSender} for ${mediaType} in ${chatId}`);
//                 return;
//             }
            
//             console.log(`${mediaType.toUpperCase()} detected from ${cleanMessageSender} in ${chatId}`);
            
//             // Initialize warning count for user if not exists
//             if (!groupSettings.warningCount) {
//                 groupSettings.warningCount = {};
//             }
            
//             const userId = cleanMessageSender;
//             if (!groupSettings.warningCount[userId]) {
//                 groupSettings.warningCount[userId] = 0;
//             }
            
//             // Media type names for display
//             const mediaTypeNames = {
//                 'image': 'Image',
//                 'video': 'Video',
//                 'gif': 'GIF',
//                 'sticker': 'Sticker',
//                 'audio': 'Audio message',
//                 'document': 'Document'
//             };
            
//             const mediaName = mediaTypeNames[mediaType] || mediaType;
            
//             // Handle based on mode
//             switch (groupSettings.mode) {
//                 case 'warn':
//                     groupSettings.warningCount[userId]++;
//                     const warnings = groupSettings.warningCount[userId];
                    
//                     await sock.sendMessage(chatId, { 
//                         text: `⚠️ *Media Warning* @${senderNumber}\n\n${mediaName}s are not allowed in this group!\nWarning #${warnings}\n\nRepeated violations may result in stricter actions.`,
//                         mentions: [cleanMessageSender]
//                     });
                    
//                     // Update settings with warning count
//                     const warnSettingsIndex = settings.findIndex(g => g.chatId === chatId);
//                     if (warnSettingsIndex !== -1) {
//                         settings[warnSettingsIndex] = groupSettings;
//                         saveAntiImage(settings);
//                     }
//                     break;
                    
//                 case 'delete':
//                     // Send warning
//                     await sock.sendMessage(chatId, { 
//                         text: `🚫 *Media Deleted* @${senderNumber}\n\n${mediaName}s are not allowed in this group!\nYour ${mediaType} has been removed.`,
//                         mentions: [cleanMessageSender]
//                     });
                    
//                     // Try to delete the message
//                     try {
//                         await sock.sendMessage(chatId, { 
//                             delete: {
//                                 id: newMsg.key.id,
//                                 participant: messageSender,
//                                 remoteJid: chatId,
//                                 fromMe: false
//                             }
//                         });
//                         console.log(`Deleted ${mediaType} from ${cleanMessageSender} in ${chatId}`);
//                     } catch (deleteError) {
//                         console.error('Failed to delete message:', deleteError);
//                     }
//                     break;
                    
//                 case 'kick':
//                     // Check if bot is superadmin
//                     const botJid = cleanJid(sock.user?.id);
//                     const botParticipant = groupMetadata.participants.find(p => {
//                         const cleanParticipantJid = cleanJid(p.id);
//                         return cleanParticipantJid === botJid;
//                     });
//                     const botIsSuperAdmin = botParticipant?.admin === 'superadmin';
                    
//                     if (!botIsSuperAdmin) {
//                         await sock.sendMessage(chatId, { 
//                             text: `⚠️ *Cannot Kick*\n\nI need superadmin permissions to kick members.\n\nUser @${senderNumber} shared a ${mediaType} but I cannot kick them.`,
//                             mentions: [cleanMessageSender]
//                         });
//                         return;
//                     }
                    
//                     // Send warning before kick
//                     await sock.sendMessage(chatId, { 
//                         text: `🚫 *Violation Detected* @${senderNumber}\n\nSharing ${mediaName}s is not allowed in this group!\nYou will be kicked for this violation.`,
//                         mentions: [cleanMessageSender]
//                     });
                    
//                     // Wait a moment then kick
//                     setTimeout(async () => {
//                         try {
//                             await sock.groupParticipantsUpdate(chatId, [cleanMessageSender], 'remove');
//                             await sock.sendMessage(chatId, { 
//                                 text: `👢 *User Kicked*\n\n@${senderNumber} was removed for sharing a ${mediaName}.`
//                             });
//                         } catch (kickError) {
//                             console.error('Failed to kick user:', kickError);
//                             await sock.sendMessage(chatId, { 
//                                 text: `❌ *Failed to kick user*\n\nCould not remove @${senderNumber}. Please check my permissions.`,
//                                 mentions: [cleanMessageSender]
//                             });
//                         }
//                     }, 2000);
//                     break;
//             }
            
//         } catch (error) {
//             console.error('Error handling media detection:', error);
//         }
//     });
    
//     console.log('✅ Anti-image listener attached for all media types');
// }











































import fs from 'fs';
import path from 'path';

const antiImageFile = './antiimage.json';

// Ensure JSON file exists
if (!fs.existsSync(antiImageFile)) {
    fs.writeFileSync(antiImageFile, JSON.stringify([], null, 2));
}

// Load settings
function loadAntiImage() {
    try {
        if (!fs.existsSync(antiImageFile)) return [];
        const data = fs.readFileSync(antiImageFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading anti-image settings:', error);
        return [];
    }
}

// Save settings
function saveAntiImage(data) {
    try {
        fs.writeFileSync(antiImageFile, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving anti-image settings:', error);
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
let antiImageListenerAttached = false;

export default {
    name: 'antiimage',
    description: 'Control image sharing in the group',
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

        const settings = loadAntiImage();
        const groupIndex = settings.findIndex(g => g.chatId === chatId);
        const currentGroupSettings = groupIndex !== -1 ? settings[groupIndex] : null;

        const subCommand = args[0]?.toLowerCase();

        if (subCommand === 'on') {
            const mode = args[1]?.toLowerCase();
            
            if (!mode || !['warn', 'delete', 'kick'].includes(mode)) {
                return sock.sendMessage(chatId, { 
                    text: '╭─⌈ ⚙️ *ANTI-IMAGE SETUP* ⌋\n│\n├─⊷ *.antiimage on warn*\n│  └⊷ Warn senders\n├─⊷ *.antiimage on delete*\n│  └⊷ Auto-delete images\n├─⊷ *.antiimage on kick*\n│  └⊷ Kick senders\n╰───' 
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

            saveAntiImage(settings);
            
            // Attach listener if not already attached
            if (!antiImageListenerAttached) {
                setupAntiImageListener(sock);
                antiImageListenerAttached = true;
            }

            const modeDescriptions = {
                'warn': 'Users will receive warnings when sharing images',
                'delete': 'Images will be automatically deleted',
                'kick': 'Users will be kicked for sharing images'
            };

            await sock.sendMessage(chatId, { 
                text: `✅ *Anti-Image enabled!*\n\nMode: *${mode.toUpperCase()}*\n` 
            }, { quoted: msg });

        } 
        else if (subCommand === 'off') {
            if (groupIndex !== -1) {
                settings.splice(groupIndex, 1);
                saveAntiImage(settings);
                await sock.sendMessage(chatId, { 
                    text: '❌ *Anti-Image disabled!*\n\nEveryone can now share images in this group.' 
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { 
                    text: 'ℹ️ Anti-Image is already disabled in this group.\nEveryone can share images.' 
                }, { quoted: msg });
            }
        } 
        else if (subCommand === 'exemptadmins') {
            if (!currentGroupSettings || !currentGroupSettings.enabled) {
                return sock.sendMessage(chatId, { 
                    text: '❌ Anti-Image is not enabled in this group.\nEnable it first with `.antiimage on [mode]`' 
                }, { quoted: msg });
            }

            const toggle = args[1]?.toLowerCase();
            if (toggle === 'off') {
                currentGroupSettings.exemptAdmins = false;
                await sock.sendMessage(chatId, { 
                    text: '⚙️ *Admin exemption disabled*\n\nAdmins will now be subject to anti-image rules.' 
                }, { quoted: msg });
            } else if (toggle === 'on') {
                currentGroupSettings.exemptAdmins = true;
                await sock.sendMessage(chatId, { 
                    text: '⚙️ *Admin exemption enabled*\n\nAdmins can now share images freely.' 
                }, { quoted: msg });
            } else {
                const currentStatus = currentGroupSettings.exemptAdmins ? 'enabled' : 'disabled';
                await sock.sendMessage(chatId, { 
                    text: `⚙️ *Admin Exemption Status*\n\nCurrently: *${currentStatus}*\n\nTo change:\n\`.antiimage exemptadmins on\` - Enable\n\`.antiimage exemptadmins off\` - Disable` 
                }, { quoted: msg });
            }
            
            settings[groupIndex] = currentGroupSettings;
            saveAntiImage(settings);
        }
        else if (subCommand === 'status') {
            if (currentGroupSettings) {
                const status = currentGroupSettings.enabled ? 
                    `✅ ENABLED (${currentGroupSettings.mode.toUpperCase()} mode)` : 
                    '❌ DISABLED';
                
                const botStatus = botIsAdmin ? '✅ I am admin' : '❌ I am NOT admin';
                const botSuperStatus = botIsSuperAdmin ? '✅ I am superadmin' : '❌ I am NOT superadmin';
                
                let statusText = `📊 *Anti-Image Status*\n\n`;
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
                
                statusText += `\n\n*What is blocked:*\n• Images (JPG, PNG, etc.)\n• Images with captions`;
                
                await sock.sendMessage(chatId, { text: statusText }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { 
                    text: `📊 *Anti-Image Status*\n\n❌ DISABLED\nEveryone can share images.\n\n*To enable:*\n\`.antiimage on [mode]\`\n\nModes: warn, delete, kick\n\nExample: \`.antiimage on delete\`` 
                }, { quoted: msg });
            }
        }
        else {
            // Show help
            const helpText = `╭─⌈ 🖼️ *ANTI-IMAGE* ⌋\n│\n├─⊷ *.antiimage on <delete|warn|kick>*\n│  └⊷ Enable with mode\n├─⊷ *.antiimage off*\n│  └⊷ Disable protection\n├─⊷ *.antiimage exemptadmins [on/off]*\n│  └⊷ Toggle admin exemption\n╰───`;
            
            await sock.sendMessage(chatId, { text: helpText }, { quoted: msg });
        }
    }
};

function setupAntiImageListener(sock) {
    console.log('🔧 Setting up anti-image listener for images only...');
    
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const newMsg = messages[0];
        
        // Skip if no message or not a group message
        if (!newMsg || !newMsg.key.remoteJid?.endsWith('@g.us')) return;
        
        // Skip bot's own messages
        if (newMsg.key.fromMe) return;
        
        const chatId = newMsg.key.remoteJid;
        
        // Load current settings
        const settings = loadAntiImage();
        const groupSettings = settings.find(g => g.chatId === chatId);
        
        // Skip if anti-image not enabled for this group
        if (!groupSettings || !groupSettings.enabled) return;
        
        // Check if message contains an image
        const message = newMsg.message;
        let isImage = false;
        
        if (message?.imageMessage) {
            isImage = true;
        }
        
        // Skip if not an image
        if (!isImage) {
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
                console.log(`Skipping admin ${cleanMessageSender} for image in ${chatId}`);
                return;
            }
            
            console.log(`Image detected from ${cleanMessageSender} in ${chatId}`);
            
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
                        text: `⚠️ *Image Warning* @${senderNumber}\n\nImages are not allowed in this group!\nWarning #${warnings}\n\nRepeated violations may result in stricter actions.`,
                        mentions: [cleanMessageSender]
                    });
                    
                    // Update settings with warning count
                    const warnSettingsIndex = settings.findIndex(g => g.chatId === chatId);
                    if (warnSettingsIndex !== -1) {
                        settings[warnSettingsIndex] = groupSettings;
                        saveAntiImage(settings);
                    }
                    break;
                    
                case 'delete':
                    // Send warning
                    await sock.sendMessage(chatId, { 
                        text: `🚫 *Image Deleted* @${senderNumber}\n\nImages are not allowed in this group!\nYour image has been removed.`,
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
                        console.log(`Deleted image from ${cleanMessageSender} in ${chatId}`);
                    } catch (deleteError) {
                        console.error('Failed to delete image:', deleteError);
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
                            text: `⚠️ *Cannot Kick*\n\nI need superadmin permissions to kick members.\n\nUser @${senderNumber} shared an image but I cannot kick them.`,
                            mentions: [cleanMessageSender]
                        });
                        return;
                    }
                    
                    // Send warning before kick
                    await sock.sendMessage(chatId, { 
                        text: `🚫 *Violation Detected* @${senderNumber}\n\nSharing images is not allowed in this group!\nYou will be kicked for this violation.`,
                        mentions: [cleanMessageSender]
                    });
                    
                    // Wait a moment then kick
                    setTimeout(async () => {
                        try {
                            await sock.groupParticipantsUpdate(chatId, [cleanMessageSender], 'remove');
                            await sock.sendMessage(chatId, { 
                                text: `👢 *User Kicked*\n\n@${senderNumber} was removed for sharing an image.`
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
            console.error('Error handling image detection:', error);
        }
    });
    
    console.log('✅ Anti-image listener attached for images only');
}