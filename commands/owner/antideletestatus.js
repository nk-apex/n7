import { downloadMediaMessage, normalizeMessageContent, jidNormalizedUser } from '@whiskeysockets/baileys';
import db from '../../lib/supabase.js';

const CACHE_CLEAN_INTERVAL = 6 * 60 * 60 * 1000;
const MAX_CACHE_AGE = 12 * 60 * 60 * 1000;

let statusAntideleteState = {
    enabled: true,
    mode: 'private',
    ownerJid: null,
    sock: null,
    statusCache: new Map(),
    deletedStatusCache: new Map(),
    mediaCache: new Map(),
    stats: {
        totalStatuses: 0,
        deletedDetected: 0,
        retrieved: 0,
        mediaCaptured: 0,
        sentToDm: 0,
        cacheCleans: 0,
        totalStorageMB: 0
    },
    settings: {
        autoCleanEnabled: true,
        maxAgeHours: 12,
        maxStorageMB: 100,
        ownerOnly: true,
        autoCleanRetrieved: true,
        initialized: false
    },
    cleanupInterval: null
};

const STATUS_PATTERNS = {
    STATUS_JID: 'status@broadcast',
    DELETE_STUB_TYPES: [0, 1, 4, 7, 8, 68, 69]
};

const defaultSettings = {
    autoCleanEnabled: true,
    maxAgeHours: 12,
    maxStorageMB: 100,
    ownerOnly: true,
    autoCleanRetrieved: true,
    initialized: false
};

async function loadStatusData() {
    try {
        const savedSettings = await db.getConfig('antidelete_status_settings', defaultSettings);
        if (savedSettings) {
            statusAntideleteState.settings = { ...statusAntideleteState.settings, ...savedSettings };
        }
    } catch (error) {
        console.error('❌ Status Antidelete: Error loading settings from DB:', error.message);
    }
}

async function saveStatusData() {
    try {
        await db.setConfig('antidelete_status_settings', statusAntideleteState.settings);
    } catch (error) {
        console.error('❌ Status Antidelete: Error saving settings to DB:', error.message);
    }
}

async function calculateStorageSize() {
    try {
        let totalBytes = 0;
        for (const [, media] of statusAntideleteState.mediaCache.entries()) {
            totalBytes += media.size || 0;
        }
        statusAntideleteState.stats.totalStorageMB = Math.round(totalBytes / 1024 / 1024);
    } catch (error) {
        console.error('❌ Status Antidelete: Error calculating storage:', error.message);
    }
}

async function cleanRetrievedStatus(statusId) {
    try {
        if (!statusAntideleteState.settings.autoCleanRetrieved) {
            return;
        }

        statusAntideleteState.statusCache.delete(statusId);
        statusAntideleteState.mediaCache.delete(statusId);

        try {
            await db.deleteAntideleteStatus(statusId);
        } catch {}

    } catch (error) {
        console.error('❌ Status Antidelete: Error cleaning retrieved status:', error.message);
    }
}

async function autoCleanCache() {
    try {
        if (!statusAntideleteState.settings.autoCleanEnabled) {
            return;
        }

        const now = Date.now();
        const maxAge = statusAntideleteState.settings.maxAgeHours * 60 * 60 * 1000;
        let cleanedCount = 0;
        let cleanedMedia = 0;

        for (const [key, status] of statusAntideleteState.statusCache.entries()) {
            if (now - status.timestamp > maxAge) {
                statusAntideleteState.statusCache.delete(key);
                cleanedCount++;
            }
        }

        for (const [key, deletedStatus] of statusAntideleteState.deletedStatusCache.entries()) {
            if (now - deletedStatus.timestamp > maxAge) {
                statusAntideleteState.deletedStatusCache.delete(key);
                cleanedCount++;
            }
        }

        for (const [key, media] of statusAntideleteState.mediaCache.entries()) {
            if (now - media.savedAt > maxAge) {
                statusAntideleteState.mediaCache.delete(key);
                cleanedMedia++;
            }
        }

        try {
            await db.cleanOlderThan('antidelete_statuses', 'timestamp', maxAge);
        } catch {}

        await calculateStorageSize();

        if (cleanedCount > 0 || cleanedMedia > 0) {
            statusAntideleteState.stats.cacheCleans++;
            await saveStatusData();
        }

    } catch (error) {
        console.error('❌ Status Antidelete: Auto-clean error:', error.message);
    }
}

async function forceCleanup() {
    try {
        const mediaEntries = Array.from(statusAntideleteState.mediaCache.entries());
        mediaEntries.sort((a, b) => a[1].savedAt - b[1].savedAt);

        let freedSize = 0;
        const targetSize = statusAntideleteState.settings.maxStorageMB * 1024 * 1024 * 0.8;
        let deletedCount = 0;

        for (const [key, media] of mediaEntries) {
            if (statusAntideleteState.stats.totalStorageMB * 1024 * 1024 - freedSize <= targetSize) {
                break;
            }
            statusAntideleteState.mediaCache.delete(key);
            freedSize += media.size || 0;
            deletedCount++;
        }

        const cacheEntries = Array.from(statusAntideleteState.statusCache.entries());
        cacheEntries.sort((a, b) => a[1].timestamp - b[1].timestamp);

        for (let i = 0; i < Math.min(10, cacheEntries.length); i++) {
            statusAntideleteState.statusCache.delete(cacheEntries[i][0]);
        }

        await calculateStorageSize();
        await saveStatusData();

        console.log(`✅ Status force cleanup completed. Removed ${deletedCount} media entries, freed ~${Math.round(freedSize / 1024 / 1024)}MB`);

    } catch (error) {
        console.error('❌ Status Antidelete: Force cleanup error:', error.message);
    }
}

function startAutoClean() {
    if (statusAntideleteState.cleanupInterval) {
        clearInterval(statusAntideleteState.cleanupInterval);
    }

    statusAntideleteState.cleanupInterval = setInterval(async () => {
        await autoCleanCache();
    }, CACHE_CLEAN_INTERVAL);
}

function getStatusExtensionFromMime(mimetype) {
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
        'image/vnd.wap.wbmp': '.wbmp'
    };

    return mimeToExt[mimetype] || '.bin';
}

function getRealWhatsAppNumber(jid) {
    if (!jid) return 'Unknown';

    try {
        const numberPart = jid.split('@')[0];
        let cleanNumber = numberPart.replace(/:/g, '').replace(/[^\d]/g, '');

        if (cleanNumber.length >= 10 && cleanNumber.length <= 15) {
            return `+${cleanNumber}`;
        }

        if (numberPart && /^\d+$/.test(numberPart) && numberPart.length >= 10) {
            return `+${numberPart}`;
        }

        return numberPart || 'Unknown';

    } catch (error) {
        return 'Unknown';
    }
}

async function downloadAndSaveStatusMedia(msgId, message, messageType, mimetype) {
    try {
        const buffer = await downloadMediaMessage(
            message,
            'buffer',
            {},
            {
                logger: { level: 'silent' },
                reuploadRequest: statusAntideleteState.sock?.updateMediaMessage
            }
        );

        if (!buffer || buffer.length === 0) {
            return null;
        }

        const maxSize = 5 * 1024 * 1024;
        if (buffer.length > maxSize) {
            return null;
        }

        const timestamp = Date.now();
        const sizeMB = (buffer.length / 1024 / 1024).toFixed(2);
        const base64Data = buffer.toString('base64');
        
        statusAntideleteState.mediaCache.set(msgId, {
            base64: base64Data,
            type: messageType,
            mimetype: mimetype,
            size: buffer.length,
            isStatus: true,
            savedAt: timestamp
        });

        try {
            const storagePath = await db.uploadMedia(msgId, buffer, mimetype, 'statuses');
            if (storagePath) {
                const cached = statusAntideleteState.mediaCache.get(msgId);
                if (cached) {
                    cached.dbPath = storagePath;
                }
            }
        } catch {}
        
        console.log(`💾 [STATUS ANTIDELETE] Media stored in DB ✅ | Type: ${messageType} | Size: ${sizeMB}MB | ID: ${msgId.slice(0, 12)}...`);
        
        statusAntideleteState.stats.mediaCaptured++;
        
        return 'db';

    } catch (error) {
        console.error('❌ Status Antidelete: Media download error:', error.message);
        return null;
    }
}

function isStatusMessage(message) {
    try {
        const msgKey = message.key;
        if (!msgKey) return false;

        if (msgKey.remoteJid === STATUS_PATTERNS.STATUS_JID) {
            return true;
        }

        return false;
    } catch (error) {
        return false;
    }
}

function extractStatusInfo(message) {
    try {
        const msgKey = message.key;
        const senderJid = msgKey.participant || msgKey.remoteJid;
        const pushName = message.pushName || 'Unknown';
        const timestamp = message.messageTimestamp * 1000 || Date.now();

        const msgContent = normalizeMessageContent(message.message);
        let type = 'text';
        let text = '';
        let hasMedia = false;
        let mediaInfo = null;
        let mimetype = '';

        if (msgContent?.imageMessage) {
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
        } else if (msgContent?.extendedTextMessage?.text) {
            type = 'text';
            text = msgContent.extendedTextMessage.text;
        } else if (msgContent?.conversation) {
            type = 'text';
            text = msgContent.conversation;
        }

        if (!text && !hasMedia) {
            type = 'status_update';
        }

        return {
            senderJid,
            pushName,
            timestamp,
            type,
            text,
            hasMedia,
            mediaInfo,
            mimetype,
            isStatus: true
        };

    } catch (error) {
        console.error('❌ Status Antidelete: Error extracting status info:', error.message);
        return null;
    }
}

export async function statusAntideleteStoreMessage(message) {
    try {
        if (!statusAntideleteState.sock) return;

        if (!isStatusMessage(message)) return;

        const msgKey = message.key;
        const msgId = msgKey.id;
        if (!msgId || msgKey.fromMe) return;

        const statusInfo = extractStatusInfo(message);
        if (!statusInfo) return;

        const senderNumber = getRealWhatsAppNumber(statusInfo.senderJid);

        const statusData = {
            id: msgId,
            chatJid: msgKey.remoteJid,
            senderJid: statusInfo.senderJid,
            senderNumber: senderNumber,
            pushName: statusInfo.pushName,
            timestamp: statusInfo.timestamp,
            type: statusInfo.type,
            text: statusInfo.text || '',
            hasMedia: statusInfo.hasMedia,
            mimetype: statusInfo.mimetype,
            isStatus: true
        };

        statusAntideleteState.statusCache.set(msgId, statusData);
        statusAntideleteState.stats.totalStatuses++;

        try {
            await db.storeAntideleteStatus(msgId, statusData);
        } catch {}

        if (statusInfo.hasMedia && statusInfo.mediaInfo) {
            const delay = Math.random() * 2000 + 1000;
            setTimeout(async () => {
                try {
                    await downloadAndSaveStatusMedia(msgId, statusInfo.mediaInfo.message, statusInfo.type, statusInfo.mimetype);
                } catch (error) {
                    console.error('❌ Status Antidelete: Async media download failed:', error.message);
                }
            }, delay);
        }

        return statusData;

    } catch (error) {
        console.error('❌ Status Antidelete: Error storing status:', error.message);
        return null;
    }
}

const recentlyProcessedStatusDeletions = new Map();

export async function statusAntideleteHandleUpdate(update) {
    try {
        if (!statusAntideleteState.sock) return;

        const msgKey = update.key;
        if (!msgKey || !msgKey.id) return;

        const msgId = msgKey.id;
        
        if (recentlyProcessedStatusDeletions.has(msgId)) {
            return;
        }
        recentlyProcessedStatusDeletions.set(msgId, Date.now());
        setTimeout(() => recentlyProcessedStatusDeletions.delete(msgId), 30000);

        if (msgKey.remoteJid !== STATUS_PATTERNS.STATUS_JID) return;

        const inner = update.update || update;

        const stubType = inner.messageStubType || update.messageStubType;
        const protocolMsg = inner.message?.protocolMessage || inner.protocolMessage;
        const isProtocolRevoke = protocolMsg?.type === 0 || protocolMsg?.type === 4;

        const checks = {
            innerMsgNull: inner.message === null,
            innerMsgUndefinedWithStub: (inner.message === undefined && inner.messageStubType !== undefined),
            status5: inner.status === 5,
            status6: inner.status === 6,
            stubMatch: (stubType !== undefined && STATUS_PATTERNS.DELETE_STUB_TYPES.includes(stubType)),
            protoRevoke: isProtocolRevoke,
            updateMsgNull: update.message === null,
            updateStubMatch: (update.messageStubType !== undefined && STATUS_PATTERNS.DELETE_STUB_TYPES.includes(update.messageStubType))
        };

        const isDeleted = Object.values(checks).some(v => v);

        if (!isDeleted) {
            console.log(`[STATUS-AD] Update for ${msgId.substring(0,8)} NOT detected as deletion | inner keys: ${Object.keys(inner).join(',')} | checks: ${JSON.stringify(checks)}`);
            return;
        }


        let cachedStatus = statusAntideleteState.statusCache.get(msgId);
        if (!cachedStatus) {
            try {
                cachedStatus = await db.getAntideleteStatus(msgId);
            } catch {}
        }
        if (!cachedStatus) {
            return;
        }

        const rawDeleterJid = update.participant || msgKey.participant || cachedStatus.senderJid;
        const deletedByNumber = getRealWhatsAppNumber(rawDeleterJid);
        const postedByNumber = cachedStatus.senderNumber || getRealWhatsAppNumber(cachedStatus.senderJid);

        statusAntideleteState.statusCache.delete(msgId);
        statusAntideleteState.deletedStatusCache.set(msgId, {
            ...cachedStatus,
            deletedAt: Date.now(),
            deletedByNumber: deletedByNumber
        });

        statusAntideleteState.stats.deletedDetected++;


        const sent = await sendStatusToOwnerDM(cachedStatus, deletedByNumber);
        if (sent) {
            statusAntideleteState.stats.sentToDm++;
            await cleanRetrievedStatus(msgId);
        }

        statusAntideleteState.stats.retrieved++;

        await saveStatusData();

    } catch (error) {
        console.error('❌ Status Antidelete: Error handling deleted status:', error.message);
    }
}

async function retrySend(sendFn, maxRetries = 5) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            if (!statusAntideleteState.sock) {
                await new Promise(r => setTimeout(r, attempt * 3000));
                continue;
            }
            await sendFn();
            return true;
        } catch (err) {
            const msg = (err.message || '').toLowerCase();
            const isConnectionError = msg.includes('connection closed') || msg.includes('connection lost') || msg.includes('timed out') || msg.includes('not open');
            if (isConnectionError && attempt < maxRetries) {
                await new Promise(r => setTimeout(r, attempt * 3000));
                continue;
            }
            throw err;
        }
    }
    return false;
}

async function sendStatusToOwnerDM(statusData, deletedByNumber) {
    try {
        if (!statusAntideleteState.sock || !statusAntideleteState.ownerJid) {
            console.error('❌ Status Antidelete: Socket or owner JID not set');
            return false;
        }

        const ownerJid = statusAntideleteState.ownerJid;
        const time = new Date(statusData.timestamp).toLocaleString();
        const senderNumber = statusData.senderNumber || getRealWhatsAppNumber(statusData.senderJid);
        const displayName = statusData.pushName || 'Unknown';

        let detailsText = `\n\n✧ WOLFBOT status antidelete🐺\n`;
        detailsText += `✧ 𝙿𝚘𝚜𝚝𝚎𝚍 𝙱𝚢 : ${senderNumber} (${displayName})\n`;
        if (deletedByNumber && deletedByNumber !== senderNumber) {
            detailsText += `✧ 𝙳𝚎𝚕𝚎𝚝𝚎𝚍 𝙱𝚢 : ${deletedByNumber}\n`;
        }
        detailsText += `✧ 𝚃𝚒𝚖𝚎 : ${time}\n`;
        detailsText += `✧ 𝚃𝚢𝚙𝚎 : ${statusData.type.toUpperCase()}\n`;

        if (statusData.text) {
            detailsText += `\n✧ 𝗦𝘁𝗮𝘁𝘂𝘀 𝗧𝗲𝘅𝘁:\n${statusData.text.substring(0, 1000)}`;
            if (statusData.text.length > 1000) detailsText += '...';
        }

        let mediaCache = statusAntideleteState.mediaCache.get(statusData.id);

        if (statusData.hasMedia && !mediaCache) {
            try {
                const cachedEntry = statusAntideleteState.mediaCache.get(statusData.id);
                if (cachedEntry?.dbPath) {
                    const dbBuffer = await db.downloadMedia(cachedEntry.dbPath);
                    if (dbBuffer) {
                        mediaCache = { ...cachedEntry, base64: dbBuffer.toString('base64') };
                    }
                } else {
                    const ext = statusData.mimetype?.split('/')[1]?.split(';')[0] || 'bin';
                    const possiblePath = `statuses/${statusData.id}.${ext}`;
                    const dbBuffer = await db.downloadMedia(possiblePath);
                    if (dbBuffer) {
                        mediaCache = {
                            base64: dbBuffer.toString('base64'),
                            type: statusData.type,
                            mimetype: statusData.mimetype,
                            size: dbBuffer.length,
                            isStatus: true,
                            savedAt: Date.now()
                        };
                    }
                }
            } catch {}
        }

        if (statusData.hasMedia && mediaCache) {
            let mediaSent = false;
            try {
                let buffer = null;
                
                if (mediaCache.base64) {
                    buffer = Buffer.from(mediaCache.base64, 'base64');
                }

                if (buffer && buffer.length > 0) {
                    const sizeMB = (buffer.length / 1024 / 1024).toFixed(2);
                    console.log(`📥 [STATUS ANTIDELETE] Media recovered from DB | Type: ${statusData.type} | Size: ${sizeMB}MB | ID: ${statusData.id.slice(0, 12)}...`);
                    if (statusData.type === 'image') {
                        await retrySend(() => statusAntideleteState.sock.sendMessage(ownerJid, {
                            image: buffer,
                            caption: detailsText,
                            mimetype: mediaCache.mimetype
                        }));
                        mediaSent = true;
                    } else if (statusData.type === 'video') {
                        await retrySend(() => statusAntideleteState.sock.sendMessage(ownerJid, {
                            video: buffer,
                            caption: detailsText,
                            mimetype: mediaCache.mimetype
                        }));
                        mediaSent = true;
                    } else if (statusData.type === 'audio' || statusData.type === 'voice') {
                        await retrySend(async () => {
                            await statusAntideleteState.sock.sendMessage(ownerJid, {
                                audio: buffer,
                                mimetype: mediaCache.mimetype,
                                ptt: statusData.type === 'voice'
                            });
                            await statusAntideleteState.sock.sendMessage(ownerJid, { text: detailsText });
                        });
                        mediaSent = true;
                    } else {
                        await retrySend(() => statusAntideleteState.sock.sendMessage(ownerJid, { text: detailsText }));
                    }
                } else {
                    await retrySend(() => statusAntideleteState.sock.sendMessage(ownerJid, { text: detailsText }));
                }
            } catch (mediaError) {
                console.error('❌ Status Antidelete: Media send error:', mediaError.message);
                try {
                    await retrySend(() => statusAntideleteState.sock.sendMessage(ownerJid, { 
                        text: detailsText + `\n\n❌ 𝗠𝗲𝗱𝗶𝗮 𝗰𝗼𝘂𝗹𝗱 𝗻𝗼𝘁 𝗯𝗲 𝗿𝗲𝗰𝗼𝘃𝗲𝗿𝗲𝗱`
                    }));
                } catch {}
            }

            if (mediaSent) {
                statusAntideleteState.mediaCache.delete(statusData.id);
                console.log(`🗑️ [STATUS ANTIDELETE] Cleaned up media after send | ID: ${statusData.id.slice(0, 12)}...`);
            }
        } else {
            await retrySend(() => statusAntideleteState.sock.sendMessage(ownerJid, { text: detailsText }));
        }

        return true;

    } catch (error) {
        console.error('❌ Status Antidelete: Error sending to owner DM:', error.message);
        return false;
    }
}

export async function initStatusAntidelete(sock) {
    try {
        await loadStatusData();

        if (sock.user?.id) {
            statusAntideleteState.ownerJid = jidNormalizedUser(sock.user.id);
        }

        statusAntideleteState.sock = sock;
        statusAntideleteState.mode = 'private';
        statusAntideleteState.enabled = true;

        if (statusAntideleteState.settings.autoCleanEnabled) {
            startAutoClean();
        }

        statusAntideleteState.settings.initialized = true;
        await saveStatusData();

        console.log(`   Mode: PRIVATE (always active)`);

    } catch (error) {
        console.error('❌ Status Antidelete: Initialization error:', error.message);
    }
}

export function updateStatusAntideleteSock(sock) {
    if (sock) {
        statusAntideleteState.sock = sock;
        if (sock.user?.id) {
            statusAntideleteState.ownerJid = jidNormalizedUser(sock.user.id);
        }
    }
}

export default {
    name: 'antideletestatus',
    alias: ['statusantidelete', 'sad', 'ads'],
    description: 'Status antidelete system - always on, captures deleted statuses',
    category: 'owner',
    ownerOnly: true,

    async execute(sock, msg, args, prefix, metadata = {}) {
        const chatId = msg.key.remoteJid;
        const command = args[0]?.toLowerCase() || 'status';

        const { jidManager } = metadata || {};
        const isSudoUser = metadata?.isSudo ? metadata.isSudo() : false;
        if (!jidManager || (!jidManager.isOwner(msg) && !isSudoUser)) {
            return sock.sendMessage(chatId, {
                text: `❌ *Owner Only Command!*\n\nOnly the bot owner can use status antidelete commands.`
            }, { quoted: msg });
        }

        if (!statusAntideleteState.sock) {
            statusAntideleteState.sock = sock;
        }

        if (!statusAntideleteState.ownerJid && metadata.OWNER_JID) {
            statusAntideleteState.ownerJid = metadata.OWNER_JID;
        }

        switch (command) {
            case 'status':
            case 'stats': {
                const statsText = `╭─⌈ 📊 *STATUS ANTIDELETE STATS* ⌋\n│\n├─⊷ *${prefix}antideletestatus stats*\n│  └⊷ View stats\n├─⊷ *${prefix}antideletestatus list*\n│  └⊷ Recent statuses\n├─⊷ *${prefix}antideletestatus clear*\n│  └⊷ Clear cache\n├─⊷ *${prefix}antideletestatus settings*\n│  └⊷ Configure\n├─⊷ *${prefix}antideletestatus help*\n│  └⊷ Full help\n╰───`;

                await sock.sendMessage(chatId, { text: statsText }, { quoted: msg });
                break;
            }

            case 'list': {
                const deletedStatuses = Array.from(statusAntideleteState.deletedStatusCache.values())
                    .slice(-10)
                    .reverse();

                if (deletedStatuses.length === 0) {
                    await sock.sendMessage(chatId, {
                        text: `📭 *Recent Deleted Statuses*\n\nNo deleted statuses recorded yet.`
                    }, { quoted: msg });
                } else {
                    let listText = `📱 *RECENT DELETED STATUSES (Last 10)*\n\n`;

                    deletedStatuses.forEach((status, index) => {
                        const time = new Date(status.timestamp).toLocaleTimeString();
                        const type = status.type.toUpperCase();
                        const preview = status.text
                            ? status.text.substring(0, 30) + (status.text.length > 30 ? '...' : '')
                            : 'Media only';
                        const senderNumber = status.senderNumber || getRealWhatsAppNumber(status.senderJid);

                        listText += `${index + 1}. ${senderNumber} (${status.pushName})\n`;
                        listText += `   📅 ${time} | 📝 ${type}\n`;
                        listText += `   💬 ${preview}\n`;
                        listText += `   ─────\n`;
                    });

                    listText += `\nTotal deleted statuses: ${statusAntideleteState.deletedStatusCache.size}`;

                    await sock.sendMessage(chatId, { text: listText }, { quoted: msg });
                }
                break;
            }

            case 'clear':
            case 'clean': {
                const cacheSize = statusAntideleteState.statusCache.size;
                const deletedSize = statusAntideleteState.deletedStatusCache.size;
                const mediaSize = statusAntideleteState.mediaCache.size;

                statusAntideleteState.statusCache.clear();
                statusAntideleteState.deletedStatusCache.clear();
                statusAntideleteState.mediaCache.clear();

                statusAntideleteState.stats = {
                    totalStatuses: 0,
                    deletedDetected: 0,
                    retrieved: 0,
                    mediaCaptured: 0,
                    sentToDm: 0,
                    cacheCleans: 0,
                    totalStorageMB: 0
                };

                await saveStatusData();

                await sock.sendMessage(chatId, {
                    text: `🧹 *Status Cache Cleared*\n\n• Statuses: ${cacheSize}\n• Deleted Statuses: ${deletedSize}\n• Media files: ${mediaSize}\n\nAll status data cleared. System remains ACTIVE.`
                }, { quoted: msg });
                break;
            }

            case 'settings': {
                const subCommand = args[1]?.toLowerCase();

                if (!subCommand) {
                    const settingsText = `╭─⌈ ⚙️ *STATUS ANTIDELETE SETTINGS* ⌋\n│\n├─⊷ *${prefix}ads settings autoclean on/off*\n│  └⊷ Toggle auto-clean\n├─⊷ *${prefix}ads settings cleanretrieved on/off*\n│  └⊷ Toggle clean mode\n├─⊷ *${prefix}ads settings maxage <hours>*\n│  └⊷ Set max age\n├─⊷ *${prefix}ads settings maxstorage <MB>*\n│  └⊷ Set max storage\n╰───`;
                    await sock.sendMessage(chatId, { text: settingsText }, { quoted: msg });
                    return;
                }

                switch (subCommand) {
                    case 'autoclean': {
                        const val = args[2]?.toLowerCase();
                        if (val === 'on' || val === 'enable') {
                            statusAntideleteState.settings.autoCleanEnabled = true;
                            startAutoClean();
                            await saveStatusData();
                            await sock.sendMessage(chatId, { text: `✅ Auto-clean enabled.` }, { quoted: msg });
                        } else if (val === 'off' || val === 'disable') {
                            statusAntideleteState.settings.autoCleanEnabled = false;
                            if (statusAntideleteState.cleanupInterval) {
                                clearInterval(statusAntideleteState.cleanupInterval);
                                statusAntideleteState.cleanupInterval = null;
                            }
                            await saveStatusData();
                            await sock.sendMessage(chatId, { text: `✅ Auto-clean disabled.` }, { quoted: msg });
                        } else {
                            await sock.sendMessage(chatId, { text: `Usage: \`${prefix}ads settings autoclean on/off\`` }, { quoted: msg });
                        }
                        break;
                    }

                    case 'cleanretrieved': {
                        const val = args[2]?.toLowerCase();
                        if (val === 'on' || val === 'enable') {
                            statusAntideleteState.settings.autoCleanRetrieved = true;
                            await saveStatusData();
                            await sock.sendMessage(chatId, { text: `✅ Clean retrieved enabled.` }, { quoted: msg });
                        } else if (val === 'off' || val === 'disable') {
                            statusAntideleteState.settings.autoCleanRetrieved = false;
                            await saveStatusData();
                            await sock.sendMessage(chatId, { text: `✅ Clean retrieved disabled.` }, { quoted: msg });
                        } else {
                            await sock.sendMessage(chatId, { text: `Usage: \`${prefix}ads settings cleanretrieved on/off\`` }, { quoted: msg });
                        }
                        break;
                    }

                    case 'maxage': {
                        const hours = parseInt(args[2]);
                        if (isNaN(hours) || hours < 1 || hours > 720) {
                            await sock.sendMessage(chatId, { text: `❌ Invalid. Use 1-720 hours.` }, { quoted: msg });
                            return;
                        }
                        statusAntideleteState.settings.maxAgeHours = hours;
                        await saveStatusData();
                        await sock.sendMessage(chatId, { text: `✅ Max age set to ${hours} hours.` }, { quoted: msg });
                        break;
                    }

                    case 'maxstorage': {
                        const mb = parseInt(args[2]);
                        if (isNaN(mb) || mb < 10 || mb > 5000) {
                            await sock.sendMessage(chatId, { text: `❌ Invalid. Use 10-5000MB.` }, { quoted: msg });
                            return;
                        }
                        statusAntideleteState.settings.maxStorageMB = mb;
                        await saveStatusData();
                        await sock.sendMessage(chatId, { text: `✅ Max storage set to ${mb}MB.` }, { quoted: msg });
                        break;
                    }

                    default:
                        await sock.sendMessage(chatId, { text: `❌ Unknown setting. Use \`${prefix}ads settings\` for options.` }, { quoted: msg });
                }
                break;
            }

            case 'help': {
                const helpText = `╭─⌈ 🔍 *STATUS ANTIDELETE SYSTEM* ⌋\n│\n├─⊷ *${prefix}ads stats*\n│  └⊷ View stats\n├─⊷ *${prefix}ads list*\n│  └⊷ Recent statuses\n├─⊷ *${prefix}ads clear*\n│  └⊷ Clear cache\n├─⊷ *${prefix}ads settings*\n│  └⊷ Configure\n├─⊷ *${prefix}ads help*\n│  └⊷ This menu\n╰───`;

                await sock.sendMessage(chatId, { text: helpText }, { quoted: msg });
                break;
            }

            default:
                await sock.sendMessage(chatId, {
                    text: `❌ Unknown command. Use \`${prefix}ads help\` for options.`
                }, { quoted: msg });
        }
    }
};
