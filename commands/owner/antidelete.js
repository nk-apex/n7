import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { downloadMediaMessage, normalizeMessageContent, jidNormalizedUser } from '@whiskeysockets/baileys';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STORAGE_DIR = './data/antidelete';
const MEDIA_DIR = path.join(STORAGE_DIR, 'media');
const CACHE_FILE = path.join(STORAGE_DIR, 'antidelete.json');
const SETTINGS_FILE = path.join(STORAGE_DIR, 'settings.json');

const CACHE_CLEAN_INTERVAL = 24 * 60 * 60 * 1000;
const MAX_CACHE_AGE = 24 * 60 * 60 * 1000;

let antideleteState = {
    enabled: true,
    mode: 'private',
    ownerJid: null,
    sock: null,
    messageCache: new Map(),
    mediaCache: new Map(),
    groupCache: new Map(),
    stats: {
        totalMessages: 0,
        deletedDetected: 0,
        retrieved: 0,
        mediaCaptured: 0,
        sentToDm: 0,
        sentToChat: 0,
        cacheCleans: 0,
        totalStorageMB: 0
    },
    settings: {
        autoCleanEnabled: true,
        maxAgeHours: 24,
        maxStorageMB: 500,
        showPhoneNumbers: true,
        ownerOnly: true,
        autoCleanRetrieved: true,
        showGroupNames: true,
        initialized: false
    },
    cleanupInterval: null
};

async function ensureDirs() {
    try {
        await fs.mkdir(STORAGE_DIR, { recursive: true });
        await fs.mkdir(MEDIA_DIR, { recursive: true });
        return true;
    } catch (error) {
        console.error('❌ Antidelete: Failed to create directories:', error.message);
        return false;
    }
}

async function calculateStorageSize() {
    try {
        let totalBytes = 0;
        
        const files = await fs.readdir(MEDIA_DIR);
        for (const file of files) {
            const filePath = path.join(MEDIA_DIR, file);
            const stats = await fs.stat(filePath);
            totalBytes += stats.size;
        }
        
        if (await fs.access(CACHE_FILE).then(() => true).catch(() => false)) {
            const stats = await fs.stat(CACHE_FILE);
            totalBytes += stats.size;
        }
        
        if (await fs.access(SETTINGS_FILE).then(() => true).catch(() => false)) {
            const stats = await fs.stat(SETTINGS_FILE);
            totalBytes += stats.size;
        }
        
        antideleteState.stats.totalStorageMB = Math.round(totalBytes / 1024 / 1024);
        
    } catch (error) {
        console.error('❌ Antidelete: Error calculating storage:', error.message);
    }
}

async function loadData() {
    try {
        await ensureDirs();
        
        if (await fs.access(SETTINGS_FILE).then(() => true).catch(() => false)) {
            const settingsData = JSON.parse(await fs.readFile(SETTINGS_FILE, 'utf8'));
            antideleteState.settings = { ...antideleteState.settings, ...settingsData };
        }
        
        if (await fs.access(CACHE_FILE).then(() => true).catch(() => false)) {
            const data = JSON.parse(await fs.readFile(CACHE_FILE, 'utf8'));
            
            if (data.mode && (data.mode === 'private' || data.mode === 'public')) {
                antideleteState.mode = data.mode;
            }
            
            if (data.messageCache && Array.isArray(data.messageCache)) {
                antideleteState.messageCache.clear();
                data.messageCache.forEach(([key, value]) => {
                    antideleteState.messageCache.set(key, value);
                });
            }
            
            if (data.mediaCache && Array.isArray(data.mediaCache)) {
                antideleteState.mediaCache.clear();
                data.mediaCache.forEach(([key, value]) => {
                    antideleteState.mediaCache.set(key, {
                        filePath: value.filePath,
                        type: value.type,
                        mimetype: value.mimetype,
                        size: value.size,
                        savedAt: value.savedAt
                    });
                });
            }
            
            if (data.groupCache && Array.isArray(data.groupCache)) {
                antideleteState.groupCache.clear();
                data.groupCache.forEach(([key, value]) => {
                    antideleteState.groupCache.set(key, value);
                });
            }
            
            if (data.stats) {
                antideleteState.stats = { ...antideleteState.stats, ...data.stats };
            }
            
            console.log(`✅ Antidelete: Loaded ${antideleteState.messageCache.size} messages, ${antideleteState.mediaCache.size} media, ${antideleteState.groupCache.size} groups from JSON`);
        }
        
        await calculateStorageSize();
        
    } catch (error) {
        console.error('❌ Antidelete: Error loading JSON data:', error.message);
    }
}

async function saveData() {
    try {
        await ensureDirs();
        
        const data = {
            mode: antideleteState.mode,
            messageCache: Array.from(antideleteState.messageCache.entries()),
            mediaCache: Array.from(antideleteState.mediaCache.entries()).map(([key, value]) => {
                return [key, {
                    filePath: value.filePath,
                    type: value.type,
                    mimetype: value.mimetype,
                    size: value.size,
                    savedAt: value.savedAt
                }];
            }),
            groupCache: Array.from(antideleteState.groupCache.entries()),
            stats: antideleteState.stats,
            savedAt: Date.now()
        };
        
        await fs.writeFile(CACHE_FILE, JSON.stringify(data, null, 2));
        
        await fs.writeFile(SETTINGS_FILE, JSON.stringify(antideleteState.settings, null, 2));
        
        console.log(`💾 Antidelete: Saved data to JSON (${antideleteState.messageCache.size} messages, ${antideleteState.mediaCache.size} media, ${antideleteState.groupCache.size} groups)`);
        
    } catch (error) {
        console.error('❌ Antidelete: Error saving JSON data:', error.message);
    }
}

function getRealWhatsAppNumber(jid) {
    if (!jid) return 'Unknown';
    
    try {
        const numberPart = jid.split('@')[0];
        let cleanNumber = numberPart.replace(/[^\d+]/g, '');
        
        if (cleanNumber.length >= 10 && !cleanNumber.startsWith('+')) {
            if (cleanNumber.length >= 10 && cleanNumber.length <= 15) {
                return `+${cleanNumber}`;
            }
        }
        
        if (cleanNumber.startsWith('+') && cleanNumber.length >= 12) {
            return cleanNumber;
        }
        
        if (cleanNumber && /^\d+$/.test(cleanNumber) && cleanNumber.length >= 10) {
            return `+${cleanNumber}`;
        }
        
        return numberPart || 'Unknown';
        
    } catch (error) {
        console.error('❌ Antidelete: Error extracting real number:', error.message);
        return 'Unknown';
    }
}

async function getGroupName(chatJid) {
    try {
        if (!chatJid || !chatJid.includes('@g.us')) {
            return 'Private Chat';
        }
        
        if (antideleteState.groupCache.has(chatJid)) {
            const groupInfo = antideleteState.groupCache.get(chatJid);
            return groupInfo.name || 'Group Chat';
        }
        
        if (antideleteState.sock) {
            try {
                const groupData = await antideleteState.sock.groupMetadata(chatJid);
                const groupName = groupData.subject || 'Group Chat';
                
                antideleteState.groupCache.set(chatJid, {
                    name: groupName,
                    subject: groupData.subject,
                    id: groupData.id,
                    size: groupData.participants?.length || 0,
                    cachedAt: Date.now()
                });
                
                await saveData();
                return groupName;
            } catch (error) {
                console.log(`⚠️ Could not fetch group name for ${chatJid}:`, error.message);
            }
        }
        
        return 'Group Chat';
        
    } catch (error) {
        console.error('❌ Antidelete: Error getting group name:', error.message);
        return 'Group Chat';
    }
}

async function cleanRetrievedMessage(msgId) {
    try {
        if (!antideleteState.settings.autoCleanRetrieved) {
            return;
        }
        
        antideleteState.messageCache.delete(msgId);
        antideleteState.mediaCache.delete(msgId);
        
        await saveData();
        
        console.log(`🧹 Antidelete: Cleaned retrieved message ${msgId} from JSON`);
        
    } catch (error) {
        console.error('❌ Antidelete: Error cleaning retrieved message:', error.message);
    }
}

async function autoCleanCache() {
    try {
        if (!antideleteState.settings.autoCleanEnabled) {
            console.log('🔄 Antidelete: Auto-clean disabled, skipping...');
            return;
        }
        
        console.log('🧹 Antidelete: Starting auto-clean from JSON...');
        const now = Date.now();
        const maxAge = antideleteState.settings.maxAgeHours * 60 * 60 * 1000;
        let cleanedCount = 0;
        let cleanedMedia = 0;
        
        for (const [key, message] of antideleteState.messageCache.entries()) {
            if (now - message.timestamp > maxAge) {
                antideleteState.messageCache.delete(key);
                cleanedCount++;
            }
        }
        
        const files = await fs.readdir(MEDIA_DIR);
        for (const file of files) {
            const filePath = path.join(MEDIA_DIR, file);
            const stats = await fs.stat(filePath);
            
            const fileAge = now - stats.mtimeMs;
            if (fileAge > maxAge) {
                try {
                    await fs.unlink(filePath);
                    
                    for (const [key, media] of antideleteState.mediaCache.entries()) {
                        if (media.filePath === filePath) {
                            antideleteState.mediaCache.delete(key);
                            break;
                        }
                    }
                    
                    cleanedMedia++;
                } catch (error) {
                    console.error(`❌ Could not delete ${file}:`, error.message);
                }
            }
        }
        
        await calculateStorageSize();
        if (antideleteState.stats.totalStorageMB > antideleteState.settings.maxStorageMB) {
            console.log(`⚠️ Antidelete: Storage limit reached (${antideleteState.stats.totalStorageMB}MB > ${antideleteState.settings.maxStorageMB}MB)`);
            await forceCleanup();
        }
        
        if (cleanedCount > 0 || cleanedMedia > 0) {
            antideleteState.stats.cacheCleans++;
            await saveData();
            console.log(`✅ Antidelete: Auto-clean completed. Cleaned ${cleanedCount} messages, ${cleanedMedia} media files.`);
        } else {
            console.log('✅ Antidelete: Auto-clean completed (nothing to clean).');
        }
        
    } catch (error) {
        console.error('❌ Antidelete: Auto-clean error:', error.message);
    }
}

async function forceCleanup() {
    try {
        console.log('⚠️ Antidelete: Force cleanup initiated...');
        
        const files = await fs.readdir(MEDIA_DIR);
        const fileStats = await Promise.all(
            files.map(async (file) => {
                const filePath = path.join(MEDIA_DIR, file);
                const stats = await fs.stat(filePath);
                return { file, filePath, mtimeMs: stats.mtimeMs, size: stats.size };
            })
        );
        
        fileStats.sort((a, b) => a.mtimeMs - b.mtimeMs);
        
        let deletedSize = 0;
        const targetSize = antideleteState.settings.maxStorageMB * 1024 * 1024 * 0.8;
        
        for (const fileStat of fileStats) {
            if (antideleteState.stats.totalStorageMB * 1024 * 1024 <= targetSize) {
                break;
            }
            
            try {
                await fs.unlink(fileStat.filePath);
                deletedSize += fileStat.size;
                
                for (const [key, media] of antideleteState.mediaCache.entries()) {
                    if (media.filePath === fileStat.filePath) {
                        antideleteState.mediaCache.delete(key);
                        break;
                    }
                }
                
                console.log(`🗑️ Force deleted: ${fileStat.file}`);
            } catch (error) {
                console.error(`❌ Could not delete ${fileStat.file}:`, error.message);
            }
        }
        
        const cacheEntries = Array.from(antideleteState.messageCache.entries());
        cacheEntries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        
        for (let i = 0; i < Math.min(10, cacheEntries.length); i++) {
            antideleteState.messageCache.delete(cacheEntries[i][0]);
        }
        
        await calculateStorageSize();
        await saveData();
        
        console.log(`✅ Force cleanup completed. Freed ${Math.round(deletedSize / 1024 / 1024)}MB`);
        
    } catch (error) {
        console.error('❌ Antidelete: Force cleanup error:', error.message);
    }
}

function startAutoClean() {
    if (antideleteState.cleanupInterval) {
        clearInterval(antideleteState.cleanupInterval);
    }
    
    antideleteState.cleanupInterval = setInterval(async () => {
        await autoCleanCache();
    }, CACHE_CLEAN_INTERVAL);
    
    console.log(`🔄 Antidelete: Auto-clean scheduled every ${CACHE_CLEAN_INTERVAL / 1000 / 60 / 60} hours`);
}

function stopAutoClean() {
    if (antideleteState.cleanupInterval) {
        clearInterval(antideleteState.cleanupInterval);
        antideleteState.cleanupInterval = null;
        console.log('🛑 Antidelete: Auto-clean stopped');
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
        'audio/aac': '.aac'
    };
    
    return mimeToExt[mimetype] || '.bin';
}

async function downloadAndSaveMedia(msgId, message, messageType, mimetype) {
    try {
        const buffer = await downloadMediaMessage(
            message,
            'buffer',
            {},
            {
                logger: { level: 'silent' },
                reuploadRequest: antideleteState.sock?.updateMediaMessage
            }
        );
        
        if (!buffer || buffer.length === 0) {
            return null;
        }
        
        const maxSize = 10 * 1024 * 1024;
        if (buffer.length > maxSize) {
            console.log(`⚠️ Antidelete: Media too large (${Math.round(buffer.length/1024/1024)}MB), skipping...`);
            return null;
        }
        
        const timestamp = Date.now();
        const extension = getExtensionFromMime(mimetype);
        const filename = `${messageType}_${timestamp}${extension}`;
        const filePath = path.join(MEDIA_DIR, filename);
        
        await fs.writeFile(filePath, buffer);
        
        antideleteState.mediaCache.set(msgId, {
            filePath: filePath,
            type: messageType,
            mimetype: mimetype,
            size: buffer.length,
            savedAt: timestamp
        });
        
        antideleteState.stats.mediaCaptured++;
        
        await calculateStorageSize();
        
        console.log(`📸 Antidelete: Saved ${messageType} media: ${filename} (${Math.round(buffer.length/1024)}KB)`);
        return filePath;
        
    } catch (error) {
        console.error('❌ Antidelete: Media download error:', error.message);
        return null;
    }
}

export async function antideleteStoreMessage(message) {
    try {
        if (!antideleteState.sock) return;
        
        const msgKey = message.key;
        if (!msgKey || !msgKey.id || msgKey.fromMe) return;
        
        const msgId = msgKey.id;
        const chatJid = msgKey.remoteJidAlt || msgKey.remoteJid;
        const senderJid = msgKey.participantAlt || msgKey.participant || chatJid;
        const pushName = message.pushName || 'Unknown';
        const timestamp = message.messageTimestamp * 1000 || Date.now();
        
        if (chatJid?.endsWith('@lid') && !chatJid?.endsWith('@g.us')) return;
        
        const isStatus = chatJid === 'status@broadcast';
        
        if (isStatus) {
            return;
        }
        
        const msgContent = normalizeMessageContent(message.message);
        let type = 'text';
        let text = '';
        let hasMedia = false;
        let mediaInfo = null;
        let mimetype = '';
        
        if (msgContent?.conversation) {
            text = msgContent.conversation;
        } else if (msgContent?.extendedTextMessage?.text) {
            text = msgContent.extendedTextMessage.text;
        } else if (msgContent?.imageMessage) {
            type = 'image';
            text = msgContent.imageMessage.caption || '';
            hasMedia = true;
            mimetype = msgContent.imageMessage.mimetype || 'image/jpeg';
            mediaInfo = { message, type: 'image', mimetype };
        } else if (msgContent?.videoMessage) {
            type = 'video';
            text = msgContent.videoMessage.caption || '';
            hasMedia = true;
            mimetype = msgContent.videoMessage.mimetype || 'video/mp4';
            mediaInfo = { message, type: 'video', mimetype };
        } else if (msgContent?.audioMessage) {
            type = 'audio';
            hasMedia = true;
            mimetype = msgContent.audioMessage.mimetype || 'audio/mpeg';
            if (msgContent.audioMessage.ptt) {
                type = 'voice';
            }
            mediaInfo = { message, type: 'audio', mimetype };
        } else if (msgContent?.documentMessage) {
            type = 'document';
            text = msgContent.documentMessage.fileName || 'Document';
            hasMedia = true;
            mimetype = msgContent.documentMessage.mimetype || 'application/octet-stream';
            mediaInfo = { message, type: 'document', mimetype };
        } else if (msgContent?.stickerMessage) {
            type = 'sticker';
            hasMedia = true;
            mimetype = msgContent.stickerMessage.mimetype || 'image/webp';
            mediaInfo = { message, type: 'sticker', mimetype };
        }
        
        if (!text && !hasMedia) return;
        
        const realNumber = getRealWhatsAppNumber(senderJid);
        
        let chatName = 'Private Chat';
        if (isStatus) {
            chatName = 'WhatsApp Status';
        } else if (chatJid.includes('@g.us')) {
            chatName = await getGroupName(chatJid);
        } else {
            chatName = getRealWhatsAppNumber(chatJid);
        }
        
        const messageData = {
            id: msgId,
            chatJid,
            chatName,
            senderJid,
            realNumber,
            pushName,
            timestamp,
            type,
            text: text || '',
            hasMedia,
            mimetype,
            isGroup: chatJid.includes('@g.us'),
            isStatus
        };
        
        antideleteState.messageCache.set(msgId, messageData);
        antideleteState.stats.totalMessages++;
        
        if (hasMedia && mediaInfo) {
            const delayMs = Math.random() * 2000 + 1000;
            setTimeout(async () => {
                try {
                    await downloadAndSaveMedia(msgId, mediaInfo.message, type, mediaInfo.mimetype);
                    await saveData();
                } catch (error) {
                    console.error('❌ Antidelete: Async media download failed:', error.message);
                }
            }, delayMs);
        }
        
        if (antideleteState.messageCache.size % 10 === 0) {
            await saveData();
        }
        
        return messageData;
        
    } catch (error) {
        console.error('❌ Antidelete: Error storing message:', error.message);
        return null;
    }
}

export async function antideleteHandleUpdate(update) {
    try {
        if (!antideleteState.sock) return;
        
        const msgKey = update.key;
        if (!msgKey || !msgKey.id) return;
        
        const msgId = msgKey.id;
        const chatJid = msgKey.remoteJidAlt || msgKey.remoteJid;
        
        if (chatJid?.endsWith('@lid') && !chatJid?.endsWith('@g.us')) {
            console.log(`⚠️ Antidelete: Skipping LID-only chat ${chatJid?.substring(0, 20)}`);
            return;
        }
        
        const isStatus = chatJid === 'status@broadcast';
        
        if (isStatus) {
            return;
        }
        
        const isDeleted = 
            update.message === null ||
            update.update?.message === null ||
            update.update?.status === 6 ||
            update.update?.messageStubType === 1 ||
            update.update?.messageStubType === 2 ||
            update.messageStubType === 1 ||
            update.messageStubType === 2 ||
            update.messageStubType === 7 ||
            update.messageStubType === 8;
        
        if (!isDeleted) {
            if (isStatus) {
                const _log2 = globalThis.originalConsoleMethods?.log || console.log;
                _log2(`📊 [AD-STATUS] Not detected as deletion, skipping`);
            }
            return;
        }
        
        console.log(`🔍 Antidelete: Checking deletion for ${msgId} in ${chatJid}`);
        
        const cachedMessage = antideleteState.messageCache.get(msgId);
        if (!cachedMessage) {
            console.log(`⚠️ Antidelete: Message ${msgId} not found in cache`);
            return;
        }
        
        const rawDeleterJid = update.participant || msgKey.participant || chatJid;
        
        let deletedByNumber;
        const rawDeleterNum = rawDeleterJid.split('@')[0].split(':')[0];
        
        if (rawDeleterJid.endsWith('@lid') || !/^\d+$/.test(rawDeleterNum) || rawDeleterNum.length < 10) {
            if (rawDeleterNum === cachedMessage.senderJid?.split('@')[0]?.split(':')[0]) {
                deletedByNumber = cachedMessage.realNumber || getRealWhatsAppNumber(cachedMessage.senderJid);
            } else {
                deletedByNumber = cachedMessage.realNumber || getRealWhatsAppNumber(cachedMessage.senderJid);
            }
        } else {
            deletedByNumber = getRealWhatsAppNumber(rawDeleterJid);
        }
        
        if (!isStatus) {
            const ownerNumber = antideleteState.ownerJid ? antideleteState.ownerJid.split('@')[0].split(':')[0] : null;
            const senderNumber = cachedMessage.senderJid ? cachedMessage.senderJid.split('@')[0].split(':')[0] : null;
            if (ownerNumber && senderNumber === ownerNumber) {
                console.log(`⚠️ Antidelete: Skipping owner's own deletion`);
                return;
            }
        }
        
        antideleteState.messageCache.delete(msgId);
        antideleteState.stats.deletedDetected++;
        
        let sent = false;
        
        if (isStatus || cachedMessage.isStatus) {
            sent = await sendToOwnerDM(cachedMessage, deletedByNumber);
            if (sent) {
                antideleteState.stats.sentToDm++;
                await cleanRetrievedMessage(msgId);
            }
        } else if (antideleteState.mode === 'private') {
            sent = await sendToOwnerDM(cachedMessage, deletedByNumber);
            if (sent) {
                antideleteState.stats.sentToDm++;
                await cleanRetrievedMessage(msgId);
            }
        } else if (antideleteState.mode === 'public') {
            sent = await sendToChat(cachedMessage, chatJid, deletedByNumber);
            if (sent) {
                antideleteState.stats.sentToChat++;
                await cleanRetrievedMessage(msgId);
            }
        }
        
        if (sent) {
            antideleteState.stats.retrieved++;
            await saveData();
            console.log(`✅ Antidelete: Retrieved deleted message from ${cachedMessage.pushName} (${cachedMessage.realNumber}) (Mode: ${antideleteState.mode})`);
        }
        
    } catch (error) {
        console.error('❌ Antidelete: Error handling deleted message:', error.message);
    }
}

async function retrySend(sendFn, maxRetries = 5) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            if (!antideleteState.sock) {
                console.log(`⚠️ Antidelete: No socket, waiting for reconnect (attempt ${attempt}/${maxRetries})...`);
                await new Promise(r => setTimeout(r, attempt * 3000));
                continue;
            }
            await sendFn();
            return true;
        } catch (err) {
            const msg = (err.message || '').toLowerCase();
            const isConnectionError = msg.includes('connection closed') || msg.includes('connection lost') || msg.includes('timed out') || msg.includes('not open');
            if (isConnectionError && attempt < maxRetries) {
                console.log(`⚠️ Antidelete: Send attempt ${attempt}/${maxRetries} failed (${err.message}), waiting ${attempt * 3}s for reconnect...`);
                await new Promise(r => setTimeout(r, attempt * 3000));
                continue;
            }
            throw err;
        }
    }
    return false;
}

async function sendToOwnerDM(messageData, deletedByNumber) {
    try {
        if (!antideleteState.sock || !antideleteState.ownerJid) {
            console.error('❌ Antidelete: Socket or owner JID not set');
            return false;
        }
        
        const ownerJid = antideleteState.ownerJid;
        const time = new Date(messageData.timestamp).toLocaleString();
        
        const senderNumber = messageData.realNumber || getRealWhatsAppNumber(messageData.senderJid);
        
        let detailsText;
        if (messageData.isStatus) {
            detailsText = `\n\n✧ WOLFBOT status antidelete🐺\n`;
            detailsText += `✧ 𝙿𝚘𝚜𝚝𝚎𝚍 𝙱𝚢 : ${senderNumber} (${messageData.pushName})\n`;
            detailsText += `✧ 𝚃𝚒𝚖𝚎 : ${time}\n`;
            detailsText += `✧ 𝚃𝚢𝚙𝚎 : ${messageData.type.toUpperCase()}\n`;
        } else {
            detailsText = `\n\n✧ WOLFBOT antidelete🐺\n`;
            detailsText += `✧ 𝙳𝚎𝚕𝚎𝚝𝚎𝚍 𝙱𝚢 : ${deletedByNumber}\n`;
            detailsText += `✧ 𝚂𝚎𝚗𝚝 𝚋𝚢 : ${senderNumber} (${messageData.pushName})\n`;
            detailsText += `✧ 𝙲𝚑𝚊𝚝 : ${messageData.chatName}\n`;
            detailsText += `✧ 𝚃𝚒𝚖𝚎 : ${time}\n`;
            detailsText += `✧ 𝚃𝚢𝚙𝚎 : ${messageData.type.toUpperCase()}\n`;
        }
        
        if (messageData.text) {
            detailsText += messageData.isStatus ? `\n✧ 𝗦𝘁𝗮𝘁𝘂𝘀 𝗧𝗲𝘅𝘁:\n${messageData.text}` : `\n✧ 𝗠𝗲𝘀𝘀𝗮𝗴𝗲:\n${messageData.text}`;
        }
        
        const mediaCache = antideleteState.mediaCache.get(messageData.id);
        
        if (messageData.hasMedia && mediaCache) {
            try {
                const buffer = await fs.readFile(mediaCache.filePath);
                
                if (buffer && buffer.length > 0) {
                    if (messageData.type === 'sticker') {
                        await retrySend(async () => {
                            const stickerMsg = await antideleteState.sock.sendMessage(ownerJid, {
                                sticker: buffer,
                                mimetype: mediaCache.mimetype
                            });
                            await antideleteState.sock.sendMessage(ownerJid, { 
                                text: detailsText 
                            }, { 
                                quoted: stickerMsg 
                            });
                        });
                    } else if (messageData.type === 'image') {
                        await retrySend(() => antideleteState.sock.sendMessage(ownerJid, {
                            image: buffer,
                            caption: detailsText,
                            mimetype: mediaCache.mimetype
                        }));
                    } else if (messageData.type === 'video') {
                        await retrySend(() => antideleteState.sock.sendMessage(ownerJid, {
                            video: buffer,
                            caption: detailsText,
                            mimetype: mediaCache.mimetype
                        }));
                    } else if (messageData.type === 'audio' || messageData.type === 'voice') {
                        await retrySend(async () => {
                            await antideleteState.sock.sendMessage(ownerJid, {
                                audio: buffer,
                                mimetype: mediaCache.mimetype,
                                ptt: messageData.type === 'voice'
                            });
                            await antideleteState.sock.sendMessage(ownerJid, { text: detailsText });
                        });
                    } else if (messageData.type === 'document') {
                        await retrySend(() => antideleteState.sock.sendMessage(ownerJid, {
                            document: buffer,
                            fileName: messageData.text || 'deleted_file',
                            mimetype: mediaCache.mimetype,
                            caption: detailsText
                        }));
                    } else {
                        await retrySend(() => antideleteState.sock.sendMessage(ownerJid, {
                            text: detailsText + `\n\n◉ 𝗠𝗲𝗱𝗶𝗮 𝗧𝘆𝗽𝗲: ${messageData.type}`
                        }));
                    }
                } else {
                    await retrySend(() => antideleteState.sock.sendMessage(ownerJid, { text: detailsText }));
                }
            } catch (mediaError) {
                console.error('❌ Antidelete: Media send error:', mediaError.message);
                try {
                    await retrySend(() => antideleteState.sock.sendMessage(ownerJid, { 
                        text: detailsText + `\n\n❌ 𝗠𝗲𝗱𝗶𝗮 𝗰𝗼𝘂𝗹𝗱 𝗻𝗼𝘁 𝗯𝗲 𝗿𝗲𝗰𝗼𝘃𝗲𝗿𝗲𝗱` 
                    }));
                } catch {}
            }
        } else {
            await retrySend(() => antideleteState.sock.sendMessage(ownerJid, { text: detailsText }));
        }
        
        console.log(`📤 Antidelete: Sent to owner DM: ${senderNumber} → ${messageData.chatName}`);
        return true;
        
    } catch (error) {
        console.error('❌ Antidelete: Error sending to owner DM:', error.message);
        return false;
    }
}

async function sendToChat(messageData, chatJid, deletedByNumber) {
    try {
        if (!antideleteState.sock) return false;
        
        const time = new Date(messageData.timestamp).toLocaleString();
        
        const senderNumber = messageData.realNumber || getRealWhatsAppNumber(messageData.senderJid);
        
        let detailsText = `\n\n✧ WOLFBOT antidelete🐺\n`;
        detailsText += `✧ 𝙳𝚎𝚕𝚎𝚝𝚎𝚍 𝙱𝚢 : ${deletedByNumber}\n`;
        detailsText += `✧ 𝚂𝚎𝚗𝚝 𝚋𝚢 : ${senderNumber} (${messageData.pushName})\n`;
        detailsText += `✧ 𝚃𝚒𝚖𝚎 : ${time}\n`;
        detailsText += `✧ 𝚃𝚢𝚙𝚎 : ${messageData.type.toUpperCase()}\n`;
        
        if (messageData.text) {
            detailsText += `\n✧ 𝕯𝖊𝖑𝖊𝖙𝖊𝖉 𝕸𝖊𝖘𝖘𝖆𝖌𝖊:\n${messageData.text}`;
        }
        
        const mediaCache = antideleteState.mediaCache.get(messageData.id);
        
        if (messageData.hasMedia && mediaCache) {
            try {
                const buffer = await fs.readFile(mediaCache.filePath);
                
                if (buffer && buffer.length > 0) {
                    if (messageData.type === 'sticker') {
                        await retrySend(async () => {
                            const stickerMsg = await antideleteState.sock.sendMessage(chatJid, {
                                sticker: buffer,
                                mimetype: mediaCache.mimetype
                            });
                            await antideleteState.sock.sendMessage(chatJid, { 
                                text: detailsText 
                            }, { 
                                quoted: stickerMsg 
                            });
                        });
                    } else if (messageData.type === 'image') {
                        detailsText = `⚠️ Deleted Image\n${detailsText}`;
                        await retrySend(() => antideleteState.sock.sendMessage(chatJid, {
                            image: buffer,
                            caption: detailsText,
                            mimetype: mediaCache.mimetype
                        }));
                    } else if (messageData.type === 'video') {
                        detailsText = `⚠️ Deleted Video\n${detailsText}`;
                        await retrySend(() => antideleteState.sock.sendMessage(chatJid, {
                            video: buffer,
                            caption: detailsText,
                            mimetype: mediaCache.mimetype
                        }));
                    } else if (messageData.type === 'audio' || messageData.type === 'voice') {
                        await retrySend(async () => {
                            await antideleteState.sock.sendMessage(chatJid, {
                                audio: buffer,
                                mimetype: mediaCache.mimetype,
                                ptt: messageData.type === 'voice'
                            });
                            await antideleteState.sock.sendMessage(chatJid, { text: detailsText });
                        });
                    } else if (messageData.type === 'document') {
                        detailsText = `⚠️ Deleted Document\n${detailsText}`;
                        await retrySend(() => antideleteState.sock.sendMessage(chatJid, {
                            document: buffer,
                            fileName: messageData.text || 'deleted_file',
                            mimetype: mediaCache.mimetype,
                            caption: detailsText
                        }));
                    } else {
                        await retrySend(() => antideleteState.sock.sendMessage(chatJid, {
                            text: detailsText + `\n\n◉ 𝗠𝗲𝗱𝗶𝗮 𝗧𝘆𝗽𝗲: ${messageData.type}`
                        }));
                    }
                } else {
                    await retrySend(() => antideleteState.sock.sendMessage(chatJid, { text: detailsText }));
                }
            } catch (mediaError) {
                console.error('❌ Antidelete: Media send error:', mediaError.message);
                try {
                    await retrySend(() => antideleteState.sock.sendMessage(chatJid, { 
                        text: detailsText + `\n\n❌ 𝗠𝗲𝗱𝗶𝗮 𝗰𝗼𝘂𝗹𝗱 𝗻𝗼𝘁 𝗯𝗲 𝗿𝗲𝗰𝗼𝘃𝗲𝗿𝗲𝗱` 
                    }));
                } catch {}
            }
        } else {
            await retrySend(() => antideleteState.sock.sendMessage(chatJid, { text: detailsText }));
        }
        
        console.log(`📤 Antidelete: Sent to chat ${messageData.chatName} (Public Mode)`);
        return true;
        
    } catch (error) {
        console.error('❌ Antidelete: Error sending to chat:', error.message);
        return false;
    }
}

export async function initAntidelete(sock) {
    try {
        await loadData();
        
        antideleteState.sock = sock;
        
        if (sock.user?.id) {
            antideleteState.ownerJid = jidNormalizedUser(sock.user.id);
            console.log(`👑 Antidelete: Owner set to ${antideleteState.ownerJid}`);
        }
        
        if (antideleteState.settings.autoCleanEnabled) {
            startAutoClean();
        }
        
        antideleteState.settings.initialized = true;
        await saveData();
        
        console.log(`🎯 Antidelete: System initialized (Mode: ${antideleteState.mode.toUpperCase()}, ALWAYS ACTIVE)`);
        
    } catch (error) {
        console.error('❌ Antidelete: Initialization error:', error.message);
    }
}

export function updateAntideleteSock(sock) {
    if (sock) {
        antideleteState.sock = sock;
        if (sock.user?.id) {
            antideleteState.ownerJid = jidNormalizedUser(sock.user.id);
        }
        console.log(`🔄 Antidelete: Socket refreshed (owner: ${antideleteState.ownerJid})`);
    }
}

export function getAntideleteMode() {
    return antideleteState.mode;
}

export default {
    name: 'antidelete',
    alias: ['undelete', 'antidel', 'ad'],
    description: 'Toggle antidelete mode between PRIVATE and PUBLIC - owner only',
    category: 'owner',
    ownerOnly: true,
    
    async execute(sock, msg, args, prefix, metadata = {}) {
        const chatId = msg.key.remoteJid;
        const command = args[0]?.toLowerCase() || 'status';
        
        const { jidManager } = metadata || {};
        const isSudoUser = metadata?.isSudo ? metadata.isSudo() : false;
        if (!jidManager || (!jidManager.isOwner(msg) && !isSudoUser)) {
            return sock.sendMessage(chatId, {
                text: `❌ *Owner Only Command!*\n\nOnly the bot owner can use antidelete commands.`
            }, { quoted: msg });
        }
        
        if (!antideleteState.sock) {
            antideleteState.sock = sock;
        }
        
        if (!antideleteState.ownerJid && metadata.OWNER_JID) {
            antideleteState.ownerJid = metadata.OWNER_JID;
        }
        
        switch (command) {
            case 'public':
                antideleteState.mode = 'public';
                await saveData();
                await sock.sendMessage(chatId, {
                    text: `✅ *ANTIDELETE: PUBLIC*\n\nDeleted messages will be resent in the original chat where they were deleted.`
                }, { quoted: msg });
                break;
                
            case 'private':
            case 'on':
            case 'enable':
                antideleteState.mode = 'private';
                await saveData();
                await sock.sendMessage(chatId, {
                    text: `✅ *ANTIDELETE: PRIVATE*\n\nDeleted messages will be sent to your DM only.`
                }, { quoted: msg });
                break;
                
            case 'status':
            case 'stats':
                const statsText = `╭─⌈ 📊 *ANTIDELETE STATUS* ⌋\n│\n│ ✅ *System:* ALWAYS ACTIVE\n│ 🔒 *Mode:* ${antideleteState.mode.toUpperCase()}\n│ 💾 *Storage:* ${antideleteState.stats.totalStorageMB}MB\n│ 📦 *Cached:* ${antideleteState.messageCache.size} msgs | 📸 ${antideleteState.mediaCache.size} media\n│ 🔍 *Detected:* ${antideleteState.stats.deletedDetected} | ✅ *Retrieved:* ${antideleteState.stats.retrieved}\n│\n├─⊷ *${prefix}antidelete private*\n│  └⊷ Send to DM only\n├─⊷ *${prefix}antidelete public*\n│  └⊷ Show in chat\n├─⊷ *${prefix}antidelete clear*\n│  └⊷ Clear cache\n├─⊷ *${prefix}antidelete settings*\n│  └⊷ Configure\n├─⊷ *${prefix}antidelete help*\n│  └⊷ Full help\n│\n╰───`;
                
                await sock.sendMessage(chatId, { text: statsText }, { quoted: msg });
                break;
                
            case 'clear':
            case 'clean':
                const cacheSize = antideleteState.messageCache.size;
                const mediaSize = antideleteState.mediaCache.size;
                const groupSize = antideleteState.groupCache.size;
                
                antideleteState.messageCache.clear();
                antideleteState.mediaCache.clear();
                antideleteState.groupCache.clear();
                
                antideleteState.stats = {
                    totalMessages: 0,
                    deletedDetected: 0,
                    retrieved: 0,
                    mediaCaptured: 0,
                    sentToDm: 0,
                    sentToChat: 0,
                    cacheCleans: 0,
                    totalStorageMB: 0
                };
                
                try {
                    const files = await fs.readdir(MEDIA_DIR);
                    for (const file of files) {
                        await fs.unlink(path.join(MEDIA_DIR, file));
                    }
                } catch (error) {
                    console.error('❌ Error deleting media files:', error.message);
                }
                
                try {
                    await fs.unlink(CACHE_FILE);
                } catch (error) {}
                
                try {
                    await fs.unlink(SETTINGS_FILE);
                } catch (error) {}
                
                await saveData();
                
                await sock.sendMessage(chatId, {
                    text: `🧹 *Cache Cleared*\n\n• Messages: ${cacheSize}\n• Media files: ${mediaSize}\n• Group data: ${groupSize}\n\nAll data has been cleared from JSON. Storage reset to 0MB.\n\n✅ Antidelete remains ACTIVE (Mode: ${antideleteState.mode.toUpperCase()})`
                }, { quoted: msg });
                break;
                
            case 'settings':
                const subCommand = args[1]?.toLowerCase();
                
                if (!subCommand) {
                    const settingsText = `╭─⌈ ⚙️ *ANTIDELETE SETTINGS* ⌋\n│\n│ ✅ System: ALWAYS ACTIVE\n│ Mode: ${antideleteState.mode.toUpperCase()} | Storage: JSON\n│\n│ 🔧 Auto-clean: ${antideleteState.settings.autoCleanEnabled ? '✅' : '❌'}\n│ 🔧 Clean Retrieved: ${antideleteState.settings.autoCleanRetrieved ? '✅' : '❌'}\n│ 🔧 Max Age: ${antideleteState.settings.maxAgeHours}h | Max Storage: ${antideleteState.settings.maxStorageMB}MB\n│ 🔧 Group Names: ${antideleteState.settings.showGroupNames ? '✅' : '❌'}\n│\n├─⊷ *${prefix}antidelete settings autoclean on/off*\n│  └⊷ Toggle auto-clean\n├─⊷ *${prefix}antidelete settings cleanretrieved on/off*\n│  └⊷ Toggle clean retrieved\n├─⊷ *${prefix}antidelete settings maxage <hours>*\n│  └⊷ Set max cache age\n├─⊷ *${prefix}antidelete settings maxstorage <MB>*\n│  └⊷ Set max storage\n├─⊷ *${prefix}antidelete settings groupnames on/off*\n│  └⊷ Toggle group names\n├─⊷ *${prefix}antidelete settings save*\n│  └⊷ Save settings\n│\n╰───`;
                    await sock.sendMessage(chatId, { text: settingsText }, { quoted: msg });
                    return;
                }
                
                switch (subCommand) {
                    case 'autoclean':
                        const autocleanValue = args[2]?.toLowerCase();
                        if (autocleanValue === 'on' || autocleanValue === 'enable') {
                            antideleteState.settings.autoCleanEnabled = true;
                            startAutoClean();
                            await saveData();
                            await sock.sendMessage(chatId, {
                                text: `✅ Auto-clean enabled. Cache will be cleaned every 24 hours.`
                            }, { quoted: msg });
                        } else if (autocleanValue === 'off' || autocleanValue === 'disable') {
                            antideleteState.settings.autoCleanEnabled = false;
                            stopAutoClean();
                            await saveData();
                            await sock.sendMessage(chatId, {
                                text: `✅ Auto-clean disabled.`
                            }, { quoted: msg });
                        } else {
                            await sock.sendMessage(chatId, {
                                text: `Usage: \`${prefix}antidelete settings autoclean on/off\``
                            }, { quoted: msg });
                        }
                        break;
                        
                    case 'cleanretrieved':
                        const cleanRetrievedValue = args[2]?.toLowerCase();
                        if (cleanRetrievedValue === 'on' || cleanRetrievedValue === 'enable') {
                            antideleteState.settings.autoCleanRetrieved = true;
                            await saveData();
                            await sock.sendMessage(chatId, {
                                text: `✅ Clean retrieved messages enabled. Messages will be auto-cleaned from JSON after being sent to you.`
                            }, { quoted: msg });
                        } else if (cleanRetrievedValue === 'off' || cleanRetrievedValue === 'disable') {
                            antideleteState.settings.autoCleanRetrieved = false;
                            await saveData();
                            await sock.sendMessage(chatId, {
                                text: `✅ Clean retrieved messages disabled. Messages will remain in JSON after retrieval.`
                            }, { quoted: msg });
                        } else {
                            await sock.sendMessage(chatId, {
                                text: `Usage: \`${prefix}antidelete settings cleanretrieved on/off\``
                            }, { quoted: msg });
                        }
                        break;
                        
                    case 'groupnames':
                        const groupNamesValue = args[2]?.toLowerCase();
                        if (groupNamesValue === 'on' || groupNamesValue === 'enable') {
                            antideleteState.settings.showGroupNames = true;
                            await saveData();
                            await sock.sendMessage(chatId, {
                                text: `✅ Group names enabled in antidelete notifications.`
                            }, { quoted: msg });
                        } else if (groupNamesValue === 'off' || groupNamesValue === 'disable') {
                            antideleteState.settings.showGroupNames = false;
                            await saveData();
                            await sock.sendMessage(chatId, {
                                text: `✅ Group names disabled in antidelete notifications.`
                            }, { quoted: msg });
                        } else {
                            await sock.sendMessage(chatId, {
                                text: `Usage: \`${prefix}antidelete settings groupnames on/off\``
                            }, { quoted: msg });
                        }
                        break;
                        
                    case 'maxage':
                        const hours = parseInt(args[2]);
                        if (isNaN(hours) || hours < 1 || hours > 168) {
                            await sock.sendMessage(chatId, {
                                text: `❌ Invalid hours. Use 1-168.\nExample: \`${prefix}antidelete settings maxage 48\``
                            }, { quoted: msg });
                            return;
                        }
                        antideleteState.settings.maxAgeHours = hours;
                        await saveData();
                        await sock.sendMessage(chatId, {
                            text: `✅ Max age set to ${hours} hours. Old cache will be cleaned automatically.`
                        }, { quoted: msg });
                        break;
                        
                    case 'maxstorage':
                        const mb = parseInt(args[2]);
                        if (isNaN(mb) || mb < 10 || mb > 5000) {
                            await sock.sendMessage(chatId, {
                                text: `❌ Invalid storage. Use 10-5000MB.\nExample: \`${prefix}antidelete settings maxstorage 1000\``
                            }, { quoted: msg });
                            return;
                        }
                        antideleteState.settings.maxStorageMB = mb;
                        await saveData();
                        await sock.sendMessage(chatId, {
                            text: `✅ Max storage set to ${mb}MB. Force cleanup will trigger at 80% capacity.`
                        }, { quoted: msg });
                        break;
                        
                    case 'save':
                        await saveData();
                        await sock.sendMessage(chatId, {
                            text: `✅ Settings saved successfully to JSON.`
                        }, { quoted: msg });
                        break;
                        
                    default:
                        await sock.sendMessage(chatId, {
                            text: `❌ Unknown setting. Use \`${prefix}antidelete settings\` for options.`
                        }, { quoted: msg });
                }
                break;
                
            case 'help':
                const helpText = `╭─⌈ 🔍 *ANTIDELETE SYSTEM* ⌋\n│\n├─⊷ *${prefix}antidelete private*\n│  └⊷ Send to DM only\n├─⊷ *${prefix}antidelete public*\n│  └⊷ Show in chat\n├─⊷ *${prefix}antidelete stats*\n│  └⊷ View statistics\n├─⊷ *${prefix}antidelete clear*\n│  └⊷ Clear all data\n├─⊷ *${prefix}antidelete settings*\n│  └⊷ Configure\n├─⊷ *${prefix}antidelete help*\n│  └⊷ This menu\n╰───`;
                
                await sock.sendMessage(chatId, { text: helpText }, { quoted: msg });
                break;
                
            default:
                await sock.sendMessage(chatId, {
                    text: `╭─⌈ 🔧 *ANTIDELETE* ⌋\n│\n├─⊷ *${prefix}antidelete help*\n│  └⊷ View all commands\n╰───`
                }, { quoted: msg });
        }
    }
};
