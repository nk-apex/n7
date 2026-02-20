import { downloadMediaMessage, getContentType } from '@whiskeysockets/baileys';
import db from '../../lib/supabase.js';

const publicModeChatCooldowns = new Map();
const PUBLIC_MODE_COOLDOWN_MS = 5000;

let antieditState = {
    enabled: true,
    mode: 'private',
    ownerJid: null,
    sock: null,
    messageHistory: new Map(),
    currentMessages: new Map(),
    mediaCache: new Map(),
    stats: {
        totalMessages: 0,
        editsDetected: 0,
        retrieved: 0,
        mediaCaptured: 0,
        sentToDm: 0,
        sentToChat: 0
    }
};

const defaultSettings = {
    enabled: true,
    mode: 'private',
    stats: {
        totalMessages: 0,
        editsDetected: 0,
        retrieved: 0,
        mediaCaptured: 0,
        sentToDm: 0,
        sentToChat: 0
    }
};

async function loadData() {
    try {
        const settings = await db.getConfig('antiedit_settings', defaultSettings);
        if (settings) {
            if (settings.mode) antieditState.mode = settings.mode;
            if (settings.enabled !== undefined) antieditState.enabled = settings.enabled;
            if (settings.stats) antieditState.stats = { ...antieditState.stats, ...settings.stats };
        }
        console.log(`✅ Antiedit: Loaded settings from DB (mode: ${antieditState.mode})`);
    } catch (error) {
        console.error('❌ Antiedit: Error loading data:', error.message);
    }
}

async function saveData() {
    try {
        const settings = {
            enabled: antieditState.enabled,
            mode: antieditState.mode,
            stats: antieditState.stats
        };
        await db.setConfig('antiedit_settings', settings);
    } catch (error) {
        console.error('❌ Antiedit: Error saving data:', error.message);
    }
}

function getExtensionFromMime(mimetype) {
    const mimeToExt = {
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'image/webp': '.webp',
        'video/mp4': '.mp4',
        'video/3gpp': '.3gp',
        'audio/mpeg': '.mp3',
        'audio/mp4': '.m4a',
        'audio/ogg': '.ogg',
        'audio/aac': '.aac',
        'application/pdf': '.pdf'
    };
    
    return mimeToExt[mimetype] || '.bin';
}

async function downloadAndSaveMedia(msgId, message, messageType, mimetype, version = 1) {
    try {
        const buffer = await downloadMediaMessage(
            message,
            'buffer',
            {},
            {
                logger: { level: 'silent' },
                reuploadRequest: antieditState.sock.updateMediaMessage
            }
        );
        
        if (!buffer || buffer.length === 0) {
            return null;
        }
        
        const mediaKey = `${msgId}_v${version}`;

        antieditState.mediaCache.set(mediaKey, {
            buffer: buffer,
            type: messageType,
            mimetype: mimetype,
            size: buffer.length,
            version: version
        });

        const dbMediaId = `edit_${mediaKey}`;
        try {
            await db.uploadMedia(dbMediaId, buffer, mimetype, 'edits');
        } catch (dbErr) {
            console.error('⚠️ Antiedit: DB media upload failed:', dbErr.message);
        }
        
        antieditState.stats.mediaCaptured++;
        
        console.log(`📸 Antiedit: Saved ${messageType} media v${version}: ${mediaKey} (${Math.round(buffer.length/1024)}KB)`);
        return { mediaKey };
        
    } catch (error) {
        console.error('❌ Antiedit: Media download error:', error.message);
        return null;
    }
}

function extractMessageContent(message) {
    const msgContent = message.message;
    let type = 'text';
    let text = '';
    let hasMedia = false;
    let mimetype = '';
    
    if (msgContent?.conversation) {
        text = msgContent.conversation;
        type = 'text';
    } else if (msgContent?.extendedTextMessage?.text) {
        text = msgContent.extendedTextMessage.text;
        type = 'text';
    } else if (msgContent?.imageMessage) {
        type = 'image';
        text = msgContent.imageMessage.caption || '';
        hasMedia = true;
        mimetype = msgContent.imageMessage.mimetype || 'image/jpeg';
    } else if (msgContent?.videoMessage) {
        type = 'video';
        text = msgContent.videoMessage.caption || '';
        hasMedia = true;
        mimetype = msgContent.videoMessage.mimetype || 'video/mp4';
    } else if (msgContent?.audioMessage) {
        type = 'audio';
        hasMedia = true;
        mimetype = msgContent.audioMessage.mimetype || 'audio/mpeg';
        if (msgContent.audioMessage.ptt) {
            type = 'voice';
        }
    } else if (msgContent?.documentMessage) {
        type = 'document';
        text = msgContent.documentMessage.fileName || 'Document';
        hasMedia = true;
        mimetype = msgContent.documentMessage.mimetype || 'application/octet-stream';
    } else if (msgContent?.stickerMessage) {
        type = 'sticker';
        hasMedia = true;
        mimetype = msgContent.stickerMessage.mimetype || 'image/webp';
    } else if (msgContent?.contactMessage) {
        type = 'contact';
        text = 'Contact Message';
    } else if (msgContent?.locationMessage) {
        type = 'location';
        text = 'Location Message';
    }
    
    return { type, text, hasMedia, mimetype };
}

async function storeIncomingMessage(message, isEdit = false, originalMessageData = null) {
    try {
        if (!antieditState.sock || antieditState.mode === 'off') return null;
        
        const msgKey = message.key;
        if (!msgKey || !msgKey.id || msgKey.fromMe) return null;
        
        const msgId = msgKey.id;
        const chatJid = msgKey.remoteJid;
        const senderJid = msgKey.participant || chatJid;
        const pushName = message.pushName || 'Unknown';
        const timestamp = message.messageTimestamp ? message.messageTimestamp * 1000 : Date.now();
        
        if (chatJid === 'status@broadcast') return null;
        
        const { type, text, hasMedia, mimetype } = extractMessageContent(message);
        
        if (!text && !hasMedia && type === 'text') return null;
        
        let version = 1;
        let history = antieditState.messageHistory.get(msgId) || [];
        
        if (isEdit) {
            version = history.length + 1;
        } else {
            const existing = antieditState.currentMessages.get(msgId);
            if (existing) {
                isEdit = true;
                originalMessageData = existing;
                version = history.length + 1;
            }
        }
        
        const messageData = {
            id: msgId,
            chatJid,
            senderJid,
            pushName,
            timestamp,
            type,
            text: text || '',
            hasMedia,
            mimetype,
            version: version,
            isEdit: isEdit,
            editTime: Date.now(),
            originalVersion: originalMessageData?.version || 1
        };
        
        antieditState.currentMessages.set(msgId, messageData);
        
        history.push({...messageData});
        antieditState.messageHistory.set(msgId, history);

        try {
            await db.storeAntideleteMessage(`edit_${msgId}`, messageData);
        } catch (dbErr) {
            console.error('⚠️ Antiedit: DB store failed:', dbErr.message);
        }
        
        if (!isEdit) {
            antieditState.stats.totalMessages++;
        } else {
            antieditState.stats.editsDetected++;
            
            setTimeout(async () => {
                if (antieditState.mode === 'private' && antieditState.ownerJid) {
                    await sendEditAlertToOwnerDM(originalMessageData, messageData, history);
                    antieditState.stats.sentToDm++;
                } else if (antieditState.mode === 'public') {
                    const lastSend = publicModeChatCooldowns.get(chatJid) || 0;
                    if (Date.now() - lastSend < PUBLIC_MODE_COOLDOWN_MS) {
                        return;
                    }
                    publicModeChatCooldowns.set(chatJid, Date.now());
                    if (publicModeChatCooldowns.size > 200) {
                        const oldest = [...publicModeChatCooldowns.entries()].sort((a, b) => a[1] - b[1]).slice(0, 50);
                        oldest.forEach(([k]) => publicModeChatCooldowns.delete(k));
                    }
                    await sendEditAlertToChat(originalMessageData, messageData, history, chatJid);
                    antieditState.stats.sentToChat++;
                }
                antieditState.stats.retrieved++;
            }, 1000);
        }
        
        if (hasMedia) {
            setTimeout(async () => {
                try {
                    await downloadAndSaveMedia(msgId, message, type, mimetype, version);
                } catch (error) {
                    console.error('❌ Antiedit: Async media download failed:', error.message);
                }
            }, 1500);
        }
        
        if (antieditState.stats.totalMessages % 20 === 0) {
            await saveData();
        }
        
        return { messageData, isEdit, history };
        
    } catch (error) {
        console.error('❌ Antiedit: Error storing message:', error.message);
        return null;
    }
}

async function handleMessageUpdates(updates) {
    try {
        if (!antieditState.sock || antieditState.mode === 'off') return;
        
        for (const update of updates) {
            const msgKey = update.key;
            if (!msgKey || !msgKey.id) continue;
            
            const msgId = msgKey.id;
            const chatJid = msgKey.remoteJid;
            
            let existingMessage = antieditState.currentMessages.get(msgId);
            if (!existingMessage) {
                try {
                    const dbMsg = await db.getAntideleteMessage(`edit_${msgId}`);
                    if (dbMsg) {
                        existingMessage = dbMsg;
                        antieditState.currentMessages.set(msgId, existingMessage);
                    }
                } catch {}
            }
            if (!existingMessage) continue;
            
            const updateContent = update.update;
            if (!updateContent || typeof updateContent !== 'object') continue;
            
            const contentType = getContentType(updateContent);
            if (!contentType) continue;
            
            const isMessageEdit = [
                'extendedTextMessage',
                'conversation',
                'imageMessage',
                'videoMessage',
                'audioMessage',
                'documentMessage'
            ].some(type => updateContent[type]);
            
            if (isMessageEdit) {
                console.log(`🔍 Antiedit: Detected edit for message ${msgId} in ${chatJid}`);
                
                const editedMessage = {
                    key: msgKey,
                    message: { [contentType]: updateContent[contentType] },
                    pushName: existingMessage.pushName,
                    messageTimestamp: Math.floor(Date.now() / 1000)
                };
                
                await storeIncomingMessage(editedMessage, true, existingMessage);
            }
        }
    } catch (error) {
        console.error('❌ Antiedit: Error handling message updates:', error.message);
    }
}

async function getMediaBuffer(mediaKey) {
    const cached = antieditState.mediaCache.get(mediaKey);
    if (cached?.buffer) return cached.buffer;

    try {
        const dbMediaId = `edit_${mediaKey}`;
        const ext = cached?.mimetype?.split('/')[1]?.split(';')[0] || 'bin';
        const storagePath = `edits/${dbMediaId}.${ext}`;
        const buffer = await db.downloadMedia(storagePath);
        if (buffer) return buffer;
    } catch {}

    return null;
}

async function sendEditAlertToOwnerDM(originalMsg, editedMsg, history) {
    try {
        if (!antieditState.sock || !antieditState.ownerJid) {
            console.error('❌ Antiedit: Socket or owner JID not set');
            return false;
        }
        
        const ownerJid = antieditState.ownerJid;
        const time = new Date(originalMsg.timestamp).toLocaleString();
        const editTime = new Date(editedMsg.editTime).toLocaleString();
        const senderNumber = originalMsg.senderJid.split('@')[0];
        const chatNumber = originalMsg.chatJid.includes('@g.us') 
            ? 'Group Chat' 
            : originalMsg.chatJid.split('@')[0];
        
        let alertText = `✏️ *MESSAGE EDITED*\n\n`;
        alertText += `👤 From: ${senderNumber} (${originalMsg.pushName})\n`;
        alertText += `💬 Chat: ${chatNumber}\n`;
        alertText += `🕒 Original: ${time}\n`;
        alertText += `✏️ Edited: ${editTime}\n`;
        alertText += `📝 Type: ${originalMsg.type.toUpperCase()}\n`;
        alertText += `🔄 Version: v${originalMsg.version} → v${editedMsg.version}\n`;
        alertText += `📊 Total edits: ${history ? history.length - 1 : 0}\n`;
        
        alertText += `\n─────────────────\n`;
        alertText += `📜 *ORIGINAL MESSAGE*\n`;
        if (originalMsg.text) {
            alertText += `${originalMsg.text.substring(0, 300)}`;
            if (originalMsg.text.length > 300) alertText += '...';
        } else if (originalMsg.hasMedia) {
            alertText += `[${originalMsg.type.toUpperCase()} MEDIA]`;
        } else {
            alertText += `[Empty message]`;
        }
        
        alertText += `\n\n─────────────────\n`;
        alertText += `✏️ *EDITED VERSION*\n`;
        if (editedMsg.text) {
            alertText += `${editedMsg.text.substring(0, 300)}`;
            if (editedMsg.text.length > 300) alertText += '...';
        } else if (editedMsg.hasMedia) {
            alertText += `[${editedMsg.type.toUpperCase()} MEDIA]`;
        } else {
            alertText += `[Empty message]`;
        }
        
        alertText += `\n\n────────────\n`;
        alertText += `🔍 *Captured by antiedit*`;
        
        const originalMediaKey = `${originalMsg.id}_v${originalMsg.version}`;
        const editedMediaKey = `${editedMsg.id}_v${editedMsg.version}`;
        const editedMediaMeta = antieditState.mediaCache.get(editedMediaKey);
        
        let mediaSent = false;
        
        if (editedMsg.hasMedia && editedMediaMeta) {
            try {
                const buffer = await getMediaBuffer(editedMediaKey);
                
                if (buffer && buffer.length > 0) {
                    if (editedMsg.type === 'sticker') {
                        await antieditState.sock.sendMessage(ownerJid, {
                            sticker: buffer,
                            mimetype: editedMediaMeta.mimetype
                        });
                    } else if (editedMsg.type === 'image') {
                        await antieditState.sock.sendMessage(ownerJid, {
                            image: buffer,
                            caption: alertText,
                            mimetype: editedMediaMeta.mimetype
                        });
                        mediaSent = true;
                    } else if (editedMsg.type === 'video') {
                        await antieditState.sock.sendMessage(ownerJid, {
                            video: buffer,
                            caption: alertText,
                            mimetype: editedMediaMeta.mimetype
                        });
                        mediaSent = true;
                    } else if (editedMsg.type === 'audio' || editedMsg.type === 'voice') {
                        await antieditState.sock.sendMessage(ownerJid, {
                            audio: buffer,
                            mimetype: editedMediaMeta.mimetype,
                            ptt: editedMsg.type === 'voice'
                        });
                    }
                }
            } catch (mediaError) {
                console.error('❌ Antiedit: Media send error:', mediaError.message);
            }
        }
        
        if (!mediaSent) {
            await antieditState.sock.sendMessage(ownerJid, { text: alertText });
        }
        
        console.log(`📤 Antiedit: Edit alert sent to owner DM: ${senderNumber} → ${chatNumber}`);
        return true;
        
    } catch (error) {
        console.error('❌ Antiedit: Error sending edit alert to owner DM:', error.message);
        return false;
    }
}

async function sendEditAlertToChat(originalMsg, editedMsg, history, chatJid) {
    try {
        if (!antieditState.sock) return false;
        
        const time = new Date(originalMsg.timestamp).toLocaleString();
        const editTime = new Date(editedMsg.editTime).toLocaleString();
        const senderNumber = originalMsg.senderJid.split('@')[0];
        
        let alertText = `✏️ *MESSAGE WAS EDITED*\n\n`;
        alertText += `👤 From: ${senderNumber} (${originalMsg.pushName})\n`;
        alertText += `🕒 Original: ${time}\n`;
        alertText += `✏️ Edited: ${editTime}\n`;
        alertText += `📝 Type: ${originalMsg.type.toUpperCase()}\n`;
        alertText += `🔄 Version: v${originalMsg.version} → v${editedMsg.version}\n`;
        
        alertText += `\n─────────────────\n`;
        alertText += `📜 *ORIGINAL MESSAGE*\n`;
        if (originalMsg.text) {
            alertText += `${originalMsg.text.substring(0, 200)}`;
            if (originalMsg.text.length > 200) alertText += '...';
        } else if (originalMsg.hasMedia) {
            alertText += `[${originalMsg.type.toUpperCase()} MEDIA]`;
        } else {
            alertText += `[Empty message]`;
        }
        
        alertText += `\n\n─────────────────\n`;
        alertText += `✏️ *EDITED VERSION*\n`;
        if (editedMsg.text) {
            alertText += `${editedMsg.text.substring(0, 200)}`;
            if (editedMsg.text.length > 200) alertText += '...';
        } else if (editedMsg.hasMedia) {
            alertText += `[${editedMsg.type.toUpperCase()} MEDIA]`;
        } else {
            alertText += `[Empty message]`;
        }
        
        alertText += `\n\n────────────\n`;
        alertText += `🔍 *Detected by antiedit*`;
        
        await antieditState.sock.sendMessage(chatJid, { text: alertText });
        
        console.log(`📤 Antiedit: Edit alert sent to chat ${chatJid}`);
        return true;
        
    } catch (error) {
        console.error('❌ Antiedit: Error sending edit alert to chat:', error.message);
        return false;
    }
}

async function showMessageHistory(msgId, chatJid) {
    try {
        if (!antieditState.sock) return false;
        
        let history = antieditState.messageHistory.get(msgId);

        if (!history || history.length < 1) {
            try {
                const dbMsg = await db.getAntideleteMessage(`edit_${msgId}`);
                if (dbMsg) {
                    history = [dbMsg];
                }
            } catch {}
        }

        if (!history || history.length < 1) {
            await antieditState.sock.sendMessage(chatJid, { 
                text: `❌ No history found for this message.` 
            });
            return false;
        }
        
        const firstMessage = history[0];
        const latestMessage = history[history.length - 1];
        
        let historyText = `📜 *MESSAGE HISTORY*\n\n`;
        historyText += `👤 From: ${firstMessage.pushName}\n`;
        historyText += `📅 Total versions: ${history.length}\n`;
        historyText += `🕒 First sent: ${new Date(firstMessage.timestamp).toLocaleString()}\n`;
        historyText += `✏️ Last edit: ${new Date(latestMessage.editTime || latestMessage.timestamp).toLocaleString()}\n`;
        
        historyText += `\n─────────────────\n`;
        
        history.forEach((msg, index) => {
            const version = index + 1;
            const time = new Date(msg.editTime || msg.timestamp).toLocaleTimeString();
            const prefix = msg.isEdit ? '✏️' : '📝';
            
            historyText += `\n${prefix} v${version} [${time}]: `;
            if (msg.text && msg.text.trim()) {
                historyText += `${msg.text.substring(0, 80)}`;
                if (msg.text.length > 80) historyText += '...';
            } else if (msg.hasMedia) {
                historyText += `[${msg.type.toUpperCase()} MEDIA]`;
            } else {
                historyText += `[Empty]`;
            }
        });
        
        historyText += `\n\n────────────\n`;
        historyText += `🔍 *History retrieved by antiedit*`;
        
        await antieditState.sock.sendMessage(chatJid, { text: historyText });
        return true;
        
    } catch (error) {
        console.error('❌ Antiedit: Error showing message history:', error.message);
        return false;
    }
}

function setupListeners(sock) {
    if (!sock) {
        console.error('❌ Antiedit: No socket provided');
        return;
    }
    
    antieditState.sock = sock;
    
    console.log('🚀 Antiedit: Setting up listeners...');
    
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        try {
            if (type !== 'notify' || antieditState.mode === 'off') return;
            
            for (const message of messages) {
                await storeIncomingMessage(message, false);
            }
        } catch (error) {
            console.error('❌ Antiedit: Message storage error:', error.message);
        }
    });
    
    sock.ev.on('messages.update', async (updates) => {
        try {
            if (antieditState.mode === 'off') return;
            
            await handleMessageUpdates(updates);
        } catch (error) {
            console.error('❌ Antiedit: Edit detection error:', error.message);
        }
    });
    
    sock.ev.on('connection.update', (update) => {
        if (update.connection === 'open') {
            console.log('✅ Antiedit: Connected and ready');
        }
    });
    
    console.log('✅ Antiedit: Listeners active');
}

async function initializeSystem(sock) {
    try {
        await loadData();
        
        if (sock.user?.id) {
            antieditState.ownerJid = sock.user.id;
            console.log(`👑 Antiedit: Owner set to ${sock.user.id}`);
        }
        
        setupListeners(sock);
        
        console.log(`🎯 Antiedit: System initialized`);
        console.log(`   Mode: ${antieditState.mode.toUpperCase()}`);
        console.log(`   Status: ${antieditState.mode === 'off' ? '❌ INACTIVE' : '✅ ACTIVE'}`);
        console.log(`   Tracking: ${antieditState.currentMessages.size} messages`);
        console.log(`   History: ${antieditState.messageHistory.size} entries`);
        
        setInterval(async () => {
            if (antieditState.stats.totalMessages > 0) {
                await saveData();
            }
        }, 5 * 60 * 1000);
        
    } catch (error) {
        console.error('❌ Antiedit: Initialization error:', error.message);
    }
}

export async function initAntiedit(sock) {
    await initializeSystem(sock);
}

export default {
    name: 'antiedit',
    alias: ['editdetect', 'edited', 'ae'],
    description: 'Capture edited messages - public/private/off modes',
    category: 'utility',
    
    async execute(sock, msg, args, prefix, metadata = {}) {
        const chatId = msg.key.remoteJid;
        const command = args[0]?.toLowerCase() || 'status';
        
        if (!antieditState.sock) {
            antieditState.sock = sock;
            setupListeners(sock);
        }
        
        if (!antieditState.ownerJid && metadata.OWNER_JID) {
            antieditState.ownerJid = metadata.OWNER_JID;
        }
        if (!antieditState.ownerJid && sock.user?.id) {
            antieditState.ownerJid = sock.user.id;
        }
        
        switch (command) {
            case 'public':
                antieditState.mode = 'public';
                await sock.sendMessage(chatId, {
                    text: `✅ *ANTIEDIT: PUBLIC MODE*\n\nEdited messages will be shown in the chat where they were edited.\n\nCurrent status: ✅ ACTIVE`
                }, { quoted: msg });
                break;
                
            case 'private':
                antieditState.mode = 'private';
                await sock.sendMessage(chatId, {
                    text: `✅ *ANTIEDIT: PRIVATE MODE*\n\nEdited messages will be sent to your DM only.\n\nCurrent status: ✅ ACTIVE\nOwner: ${antieditState.ownerJid ? '✅ SET' : '⚠️ NOT SET'}`
                }, { quoted: msg });
                break;
                
            case 'off':
            case 'disable':
                antieditState.mode = 'off';
                await sock.sendMessage(chatId, {
                    text: `✅ *ANTIEDIT: DISABLED*\n\nSystem is now OFF. No message edits will be captured.`
                }, { quoted: msg });
                break;
                
            case 'on':
            case 'enable':
                antieditState.mode = 'private';
                await sock.sendMessage(chatId, {
                    text: `✅ *ANTIEDIT: ENABLED*\n\nSystem is now ON in PRIVATE mode.`
                }, { quoted: msg });
                break;
                
            case 'status':
            case 'stats':
                const statsText = `
📊 *ANTIEDIT STATISTICS*

Mode: ${antieditState.mode.toUpperCase()}
Status: ${antieditState.mode === 'off' ? '❌ INACTIVE' : '✅ ACTIVE'}
Owner: ${antieditState.ownerJid ? '✅ SET' : '⚠️ NOT SET'}
Socket: ${antieditState.sock ? '✅ CONNECTED' : '❌ DISCONNECTED'}

📈 *Statistics:*
• Total messages: ${antieditState.stats.totalMessages}
• Edits detected: ${antieditState.stats.editsDetected}
• Media captured: ${antieditState.stats.mediaCaptured}
• Alerts sent to DM: ${antieditState.stats.sentToDm}
• Alerts sent to chat: ${antieditState.stats.sentToChat}
• Currently tracking: ${antieditState.currentMessages.size} messages

💡 *Commands:*
• \`${prefix}antiedit public\`
• \`${prefix}antiedit private\`
• \`${prefix}antiedit off\`
• \`${prefix}antiedit history <reply to message>\`
• \`${prefix}antiedit test\`
• \`${prefix}antiedit clear\`
`;
                
                await sock.sendMessage(chatId, { text: statsText }, { quoted: msg });
                break;
                
            case 'history':
                const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                const quotedId = msg.message?.extendedTextMessage?.contextInfo?.stanzaId;
                
                let targetMsgId;
                if (quotedId) {
                    targetMsgId = quotedId;
                } else if (args[1]) {
                    targetMsgId = args[1];
                }
                
                if (!targetMsgId) {
                    return await sock.sendMessage(chatId, {
                        text: `❌ Please reply to a message to see its edit history.\n\nUsage: Reply to a message with \`${prefix}antiedit history\``
                    }, { quoted: msg });
                }
                
                await showMessageHistory(targetMsgId, chatId);
                break;
                
            case 'test':
                const testText = `🧪 *Test Message for Antiedit*\n\nMode: ${antieditState.mode.toUpperCase()}\nStatus: ${antieditState.mode === 'off' ? '❌ INACTIVE' : '✅ ACTIVE'}\n\nEdit this message to test the system!`;
                
                const testMsg = await sock.sendMessage(chatId, { 
                    text: testText 
                });
                
                if (testMsg?.key) {
                    const testData = {
                        id: testMsg.key.id,
                        chatJid: testMsg.key.remoteJid,
                        senderJid: antieditState.ownerJid || sock.user.id,
                        pushName: 'Antiedit Test',
                        timestamp: Date.now(),
                        type: 'text',
                        text: testText,
                        hasMedia: false,
                        version: 1,
                        isEdit: false
                    };
                    
                    antieditState.currentMessages.set(testMsg.key.id, testData);
                    antieditState.messageHistory.set(testMsg.key.id, [{...testData}]);

                    try {
                        await db.storeAntideleteMessage(`edit_${testMsg.key.id}`, testData);
                    } catch {}
                    
                    await sock.sendMessage(chatId, {
                        text: `✅ Test message stored (ID: ${testMsg.key.id})!\n\nNow edit the previous message to test antiedit.`
                    });
                }
                break;
                
            case 'clear':
            case 'clean':
            case 'reset':
                const historySize = antieditState.messageHistory.size;
                const currentSize = antieditState.currentMessages.size;
                const mediaSize = antieditState.mediaCache.size;
                
                antieditState.messageHistory.clear();
                antieditState.currentMessages.clear();
                antieditState.mediaCache.clear();
                antieditState.stats.totalMessages = 0;
                antieditState.stats.editsDetected = 0;
                antieditState.stats.retrieved = 0;
                antieditState.stats.mediaCaptured = 0;
                antieditState.stats.sentToDm = 0;
                antieditState.stats.sentToChat = 0;

                try {
                    await db.cleanOlderThan('antidelete_messages', 'timestamp', 0);
                } catch {}

                await saveData();
                
                await sock.sendMessage(chatId, {
                    text: `🧹 *Cache Cleared*\n\n• History entries: ${historySize}\n• Current messages: ${currentSize}\n• Media files: ${mediaSize}\n\nAll data has been cleared.`
                }, { quoted: msg });
                break;
                
            case 'debug':
                const debugText = `
🔧 *ANTIEDIT DEBUG INFO*

Mode: ${antieditState.mode}
Owner JID: ${antieditState.ownerJid || 'Not set'}
Socket: ${antieditState.sock ? 'Present' : 'Missing'}
DB Available: ${db.isAvailable() ? '✅' : '❌'}

Storage:
• Current messages: ${antieditState.currentMessages.size}
• Message history: ${antieditState.messageHistory.size}
• Media cache: ${antieditState.mediaCache.size}

Listeners active: ✅
Auto-save: ✅
`;
                await sock.sendMessage(chatId, { text: debugText }, { quoted: msg });
                break;
                
            case 'help':
            case 'menu':
                const helpText = `╭─⌈ 🔍 *ANTIEDIT SYSTEM* ⌋\n│\n├─⊷ *${prefix}antiedit public*\n│  └⊷ Public mode\n├─⊷ *${prefix}antiedit private*\n│  └⊷ Private mode\n├─⊷ *${prefix}antiedit on*\n│  └⊷ Enable (private)\n├─⊷ *${prefix}antiedit off*\n│  └⊷ Disable system\n├─⊷ *${prefix}antiedit status*\n│  └⊷ View stats\n├─⊷ *${prefix}antiedit history <reply>*\n│  └⊷ Show edit history\n├─⊷ *${prefix}antiedit test*\n│  └⊷ Test message\n├─⊷ *${prefix}antiedit clear*\n│  └⊷ Clear cache\n├─⊷ *${prefix}antiedit debug*\n│  └⊷ Debug info\n├─⊷ *${prefix}antiedit help*\n│  └⊷ This menu\n╰───`;
                
                await sock.sendMessage(chatId, { text: helpText }, { quoted: msg });
                break;
                
            default:
                await sock.sendMessage(chatId, {
                    text: `╭─⌈ 🔧 *ANTIEDIT* ⌋\n│\n├─⊷ *${prefix}antiedit help*\n│  └⊷ View commands\n╰───`
                }, { quoted: msg });
        }
        
        await saveData();
    }
};
