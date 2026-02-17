






































//INNER-PEACE - SILENT WOLF






















// ====== SILENT WOLFBOT - ULTIMATE CLEAN EDITION (SPEED OPTIMIZED) ======
// Features: Real-time prefix changes, UltimateFix, Status Detection, Auto-Connect
// SUPER CLEAN TERMINAL - Zero spam, Zero session noise, Rate limit protection
// Date: 2024 | Version: 1.1.5 (PREFIXLESS & NEW MEMBER DETECTION)
// New: Session ID authentication from process.env.SESSION_ID
// New: WOLF-BOT session format support (WOLF-BOT:eyJ...)
// New: Professional success messaging like WOLFBOT
// New: Prefixless mode support
// New: Group new member detection with terminal notifications
// New: Anti-ViewOnce system integrated (Private/Auto modes)

// ====== PERFORMANCE OPTIMIZATIONS APPLIED ======
// 1. Reduced mandatory delays from 1000ms to 100ms
// 2. Optimized console filtering overhead
// 3. Parallel processing for non-critical tasks
// 4. Faster command parsing
// 5. All original features preserved 100%

// ====== ULTIMATE CONSOLE INTERCEPTOR (OPTIMIZED) ======
//Silent Wolf

const originalConsoleMethods = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
    trace: console.trace,
    dir: console.dir,
    dirxml: console.dirxml,
    table: console.table,
};
globalThis.originalConsoleMethods = originalConsoleMethods;
const _keepRef = {
    time: console.time,
    timeEnd: console.timeEnd,
    timeLog: console.timeLog,
    group: console.group,
    groupEnd: console.groupEnd,
    groupCollapsed: console.groupCollapsed,
    clear: console.clear,
    count: console.count,
    countReset: console.countReset,
    assert: console.assert,
    profile: console.profile,
    profileEnd: console.profileEnd,
    timeStamp: console.timeStamp,
    context: console.context
};

// OPTIMIZED: Cache regex patterns for faster filtering
const suppressPatterns = [
    // Session patterns
    'closing session',
    'sessionentry',
    'registrationid',
    'currentratchet',
    'indexinfo',
    'pendingprekey',
    'ephemeralkeypair',
    'lastremoteephemeralkey',
    'rootkey',
    'basekey',
    'signalkey',
    'signalprotocol',
    '_chains',
    'chains',
    'chainkey',
    'ratchet',
    'cipher',
    'decrypt',
    'encrypt',
    'key',
    'prekey',
    'signedkey',
    'identitykey',
    'sessionstate',
    'keystore',
    'senderkey',
    'groupcipher',
    'signalgroup',
    'signalstore',
    'signalrepository',
    'signalprotocolstore',
    'sessioncipher',
    'sessionbuilder',
    'senderkeystore',
    'senderkeydistribution',
    'keyexchange',
    // Buffer patterns
    'buffer',
    '<buffer',
    'byte',
    '05 ',  // Hexadecimal patterns
    '0x',
    'pubkey',
    'privkey',
    // Baileys internal patterns
    'baileys',
    'whatsapp',
    'ws',
    'qr',
    'scan',
    'pairing',
    'connection.update',
    'creds.update',
    'messages.upsert',
    'group',
    'participant',
    'metadata',
    'presence.update',
    'chat.update',
    'message.receipt.update',
    'message.update',
    'timeout',
    'transaction',
    'failed to decrypt',
    'received error',
    'sessionerror',
    'bad mac',
    'stream errored'
];

// OPTIMIZED: Faster filter function with early returns
const shouldShowLog = (args) => {
    if (args.length === 0) return true;
    
    const firstArg = args[0];
    if (typeof firstArg !== 'string') return true;
    
    const lowerMsg = firstArg.toLowerCase();
    
    // Fast escape for important logs
    if (lowerMsg.includes('defibrillator') || 
        lowerMsg.includes('command') || 
        lowerMsg.includes('✅') || 
        lowerMsg.includes('❌') ||
        lowerMsg.includes('👥') ||
        lowerMsg.includes('👤') ||
        lowerMsg.includes('📊') ||
        lowerMsg.includes('🔧') ||
        lowerMsg.includes('🐺') ||
        lowerMsg.includes('🚀')) {
        return true;
    }
    
    // Check if it's baileys noise
    const noisyPatterns = [
        'closing session', 'sessionentry', 'registrationid',
        'currentratchet', 'buffer', '05 ', '0x', 'failed to decrypt'
    ];
    
    return !noisyPatterns.some(pattern => lowerMsg.includes(pattern));
};

// Override console methods
for (const method of Object.keys(originalConsoleMethods)) {
    if (typeof console[method] === 'function') {
        console[method] = function(...args) {
            if (shouldShowLog(args)) {
                originalConsoleMethods[method].apply(console, args);
            }
        };
    }
}

// Process-level filtering
function setupProcessFilter() {
    const originalStdoutWrite = process.stdout.write;
    const originalStderrWrite = process.stderr.write;
    
    const sessionPatterns = [
        'closing session',
        'sessionentry',
        'registrationid',
        'currentratchet',
        'indexinfo',
        'pendingprekey',
        '_chains',
        'ephemeralkeypair',
        'lastremoteephemeralkey',
        'rootkey',
        'basekey'
    ];
    
    const filterOutput = (chunk) => {
        const chunkStr = chunk.toString();
        const lowerChunk = chunkStr.toLowerCase();
        
        for (const pattern of sessionPatterns) {
            if (lowerChunk.includes(pattern)) {
                return false;
            }
        }
        return true;
    };
    
    process.stdout.write = function(chunk, encoding, callback) {
        if (filterOutput(chunk)) {
            return originalStdoutWrite.call(this, chunk, encoding, callback);
        }
        if (callback) callback();
        return true;
    };
    
    process.stderr.write = function(chunk, encoding, callback) {
        if (filterOutput(chunk)) {
            return originalStderrWrite.call(this, chunk, encoding, callback);
        }
        if (callback) callback();
        return true;
    };
}

// Set environment variables
process.env.DEBUG = '';
process.env.NODE_ENV = 'production';
process.env.BAILEYS_LOG_LEVEL = 'fatal';
process.env.PINO_LOG_LEVEL = 'fatal';
process.env.BAILEYS_DISABLE_LOG = 'true';
process.env.DISABLE_BAILEYS_LOG = 'true';
process.env.PINO_DISABLE = 'true';

// Import modules
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import chalk from 'chalk';
import readline from 'readline';
import axios from "axios";
import { normalizeMessageContent, downloadContentFromMessage, downloadMediaMessage, jidNormalizedUser } from '@whiskeysockets/baileys';
import NodeCache from 'node-cache';
import { isSudoNumber, isSudoJid, getSudoMode, addSudoJid, mapLidToPhone, isSudoByLid, getPhoneFromLid, getSudoList } from './lib/sudo-store.js';

const msgRetryCounterCache = new NodeCache({ stdTTL: 600 });

let currentSock = null;

const lidPhoneCache = new Map();
const phoneLidCache = new Map();

function cacheLidPhone(lidNum, phoneNum) {
    if (!lidNum || !phoneNum || lidNum === phoneNum) return;
    lidPhoneCache.set(lidNum, phoneNum);
    phoneLidCache.set(phoneNum, lidNum);
    mapLidToPhone(lidNum, phoneNum);
}

function resolvePhoneFromLid(jid) {
    if (!jid) return null;
    const lidNum = jid.split('@')[0].split(':')[0];

    const cached = lidPhoneCache.get(lidNum);
    if (cached) return cached;
    const stored = getPhoneFromLid(lidNum);
    if (stored) {
        lidPhoneCache.set(lidNum, stored);
        return stored;
    }

    if (!currentSock) return null;
    try {
        if (currentSock.signalRepository?.lidMapping?.getPNForLID) {
            const pn = currentSock.signalRepository.lidMapping.getPNForLID(jid);
            if (pn) {
                const num = String(pn).split('@')[0].replace(/[^0-9]/g, '');
                if (num.length >= 7 && num !== lidNum) {
                    cacheLidPhone(lidNum, num);
                    return num;
                }
            }
        }
    } catch {}

    try {
        const fullLid = jid.includes('@') ? jid : `${jid}@lid`;
        if (currentSock.signalRepository?.lidMapping?.getPNForLID) {
            const formats = [fullLid, `${lidNum}:0@lid`, `${lidNum}@lid`];
            for (const fmt of formats) {
                try {
                    const pn = currentSock.signalRepository.lidMapping.getPNForLID(fmt);
                    if (pn) {
                        const num = String(pn).split('@')[0].replace(/[^0-9]/g, '');
                        if (num.length >= 7 && num.length <= 15 && num !== lidNum) {
                            cacheLidPhone(lidNum, num);
                            return num;
                        }
                    }
                } catch {}
            }
        }
    } catch {}

    return null;
}

async function resolvePhoneFromGroup(senderJid, chatId, sock) {
    return resolveSenderFromGroup(senderJid, chatId, sock);
}

function getDisplayNumber(senderJid) {
    if (!senderJid) return 'unknown';
    const raw = senderJid.split('@')[0].split(':')[0];
    const full = senderJid.split('@')[0];
    if (senderJid.includes('@lid')) {
        const phone = lidPhoneCache.get(raw) || lidPhoneCache.get(full) || getPhoneFromLid(raw) || getPhoneFromLid(full);
        return phone ? `+${phone}` : `LID:${raw.substring(0, 8)}...`;
    }
    return `+${raw}`;
}

const groupMetadataCache = new Map();
const GROUP_CACHE_TTL = 5 * 60 * 1000;
const groupDiagDone = new Set();

async function getCachedGroupMetadata(chatId, sock) {
    const cached = groupMetadataCache.get(chatId);
    if (cached && Date.now() - cached.ts < GROUP_CACHE_TTL) {
        return cached.data;
    }
    try {
        const metadata = await sock.groupMetadata(chatId);
        groupMetadataCache.set(chatId, { data: metadata, ts: Date.now() });
        return metadata;
    } catch (err) {
        UltraCleanLogger.info(`⚠️ groupMetadata failed for ${chatId.split('@')[0].substring(0, 10)}: ${err.message}`);
        return null;
    }
}

async function buildLidMapFromGroup(chatId, sock) {
    const metadata = await getCachedGroupMetadata(chatId, sock);
    if (!metadata) return 0;
    const participants = metadata.participants || [];
    let mapped = 0;

    if (!groupDiagDone.has(chatId) && participants.length > 0) {
        groupDiagDone.add(chatId);
        const sample = participants.slice(0, 3).map(p => ({
            id: p.id || 'none',
            lid: p.lid || 'none',
            phoneNumber: p.phoneNumber || 'none',
            admin: p.admin || 'none',
            keys: Object.keys(p).filter(k => !['id','lid','admin','phoneNumber'].includes(k)).join(',')
        }));
        UltraCleanLogger.info(`📋 Group participant structure (${metadata.subject || chatId.split('@')[0].substring(0, 10)}): ${JSON.stringify(sample)}`);
    }
    
    for (const p of participants) {
        const { phoneNum, lidNum } = extractParticipantInfo(p, sock);

        if (phoneNum && lidNum && phoneNum !== lidNum) {
            cacheLidPhone(lidNum, phoneNum);
            mapLidToPhone(lidNum, phoneNum);
            mapped++;
        }
    }
    return mapped;
}

async function resolveSenderFromGroup(senderJid, chatId, sock) {
    if (!senderJid || !chatId || !sock) return null;
    const senderLidNum = senderJid.split('@')[0].split(':')[0];
    const senderFull = senderJid.split('@')[0];

    let resolved = lidPhoneCache.get(senderLidNum) || lidPhoneCache.get(senderFull) || getPhoneFromLid(senderLidNum) || getPhoneFromLid(senderFull);
    if (resolved) return resolved;

    await buildLidMapFromGroup(chatId, sock);

    resolved = lidPhoneCache.get(senderLidNum) || lidPhoneCache.get(senderFull) || getPhoneFromLid(senderLidNum) || getPhoneFromLid(senderFull);
    if (resolved) {
        UltraCleanLogger.info(`🔗 LID resolved: ${senderLidNum.substring(0, 8)}... → +${resolved}`);
    }
    return resolved;
}

function extractParticipantInfo(p, sock) {
    const pid = p.id || '';
    const plid = p.lid || '';
    let phoneNum = null;
    let lidNum = null;

    if (p.phoneNumber) {
        const num = String(p.phoneNumber).replace(/[^0-9]/g, '');
        if (num.length >= 7 && num.length <= 15) phoneNum = num;
    }

    if (!phoneNum && pid && !pid.includes('@lid')) {
        const num = pid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
        if (num.length >= 7 && num.length <= 15) phoneNum = num;
    }

    if (!phoneNum && plid && !plid.includes('@lid')) {
        const num = plid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
        if (num.length >= 7 && num.length <= 15) phoneNum = num;
    }

    if (pid.includes('@lid')) {
        lidNum = pid.split('@')[0].split(':')[0];
    }
    if (!lidNum && plid && plid.includes('@lid')) {
        lidNum = plid.split('@')[0].split(':')[0];
    }
    if (!lidNum && plid) {
        lidNum = plid.split('@')[0].split(':')[0];
    }

    if (!phoneNum && lidNum) {
        try {
            const theLid = pid.includes('@lid') ? pid : (plid || pid);
            if (sock?.signalRepository?.lidMapping?.getPNForLID) {
                const pn = sock.signalRepository.lidMapping.getPNForLID(theLid);
                if (pn) {
                    const num = String(pn).split('@')[0].replace(/[^0-9]/g, '');
                    if (num.length >= 7 && num.length <= 15) phoneNum = num;
                }
            }
        } catch {}
    }

    return { phoneNum, lidNum };
}

async function autoScanGroupsForSudo(sock) {
    try {
        const { sudoers } = getSudoList();
        if (sudoers.length === 0) return;

        const allSudosMapped = sudoers.every(num => {
            for (const [, phone] of lidPhoneCache) {
                if (phone === num) return true;
            }
            const stored = getPhoneFromLid(num);
            if (stored) return true;
            return false;
        });
        if (allSudosMapped) {
            UltraCleanLogger.info(`🔑 All ${sudoers.length} sudo(s) already have LID mappings`);
            return;
        }

        UltraCleanLogger.info(`🔑 Scanning groups to link ${sudoers.length} sudo user(s)...`);
        const groups = await sock.groupFetchAllParticipating();
        if (!groups) return;
        let linked = 0;
        let totalParticipants = 0;
        let diagLogged = false;

        for (const [groupId, metadata] of Object.entries(groups)) {
            const participants = metadata.participants || [];
            totalParticipants += participants.length;

            if (!diagLogged && participants.length > 0) {
                diagLogged = true;
                const sample = participants.slice(0, 2).map(p => ({
                    id: p.id || 'none', lid: p.lid || 'none',
                    phoneNumber: p.phoneNumber || 'none',
                    keys: Object.keys(p).filter(k => !['id','lid','admin','phoneNumber'].includes(k)).join(',')
                }));
                UltraCleanLogger.info(`📋 Scan participant structure: ${JSON.stringify(sample)}`);
            }

            for (const p of participants) {
                const { phoneNum, lidNum } = extractParticipantInfo(p, sock);

                if (phoneNum && lidNum && phoneNum !== lidNum) {
                    cacheLidPhone(lidNum, phoneNum);
                    mapLidToPhone(lidNum, phoneNum);
                    if (sudoers.includes(phoneNum)) linked++;
                }

                const pid = p.id || '';
                const plid = p.lid || '';
                if (pid && !pid.includes('@lid')) {
                    const phoneN = pid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
                    if (phoneN && sudoers.includes(phoneN)) {
                        const lidJid = plid || pid;
                        if (lidJid.includes('@lid')) {
                            const lNum = lidJid.split('@')[0].split(':')[0];
                            cacheLidPhone(lNum, phoneN);
                            linked++;
                        }
                    }
                }
            }
        }

        UltraCleanLogger.info(`🔑 Scanned ${Object.keys(groups).length} groups, ${totalParticipants} participants`);
        if (linked > 0) {
            UltraCleanLogger.success(`🔑 Auto-linked ${linked} sudo user(s) from group scan`);
        } else {
            UltraCleanLogger.info(`🔑 No sudo users found via group scan. Use =linksudo in a group with your sudo user.`);
        }
    } catch (err) {
        UltraCleanLogger.warning(`Sudo auto-scan: ${err.message}`);
    }
}

// Import automation handlers
import { handleAutoReact } from './commands/automation/autoreactstatus.js';
import { handleReactOwner } from './commands/automation/reactowner.js';
import { handleAutoView } from './commands/automation/autoviewstatus.js';
import { initializeAutoJoin } from './commands/group/add.js';
import antidemote from './commands/group/antidemote.js';
import banCommand from './commands/group/ban.js';

// Import antidelete system (listeners registered in index.js, always active)
import { initAntidelete, antideleteStoreMessage, antideleteHandleUpdate, updateAntideleteSock } from './commands/owner/antidelete.js';

// Import status antidelete system (always on, handles status messages exclusively)
import { initStatusAntidelete, statusAntideleteStoreMessage, statusAntideleteHandleUpdate, updateStatusAntideleteSock } from './commands/owner/antideletestatus.js';

// Import W.O.L.F chatbot system
import { isChatbotActiveForChat, handleChatbotMessage } from './commands/ai/chatbot.js';

// ====== ENVIRONMENT SETUP ======
dotenv.config({ path: './.env' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


// ====== CONFIGURATION ======
const SESSION_DIR = './session';
const BOT_NAME = process.env.BOT_NAME || 'WOLFBOT';
const VERSION = '1.1.5';
global.VERSION = VERSION;
const DEFAULT_PREFIX = process.env.PREFIX || '.';
const OWNER_FILE = './owner.json';
const PREFIX_CONFIG_FILE = './prefix_config.json';
const BOT_SETTINGS_FILE = './bot_settings.json';
const BOT_MODE_FILE = './bot_mode.json';
const WHITELIST_FILE = './whitelist.json';
const BLOCKED_USERS_FILE = './blocked_users.json';
const WELCOME_DATA_FILE = './data/welcome_data.json';

// Auto-connect features
const AUTO_CONNECT_ON_LINK = true;
const AUTO_CONNECT_ON_START = true;

// SPEED OPTIMIZATION
const RATE_LIMIT_ENABLED = true;
const MIN_COMMAND_DELAY = 100;
const STICKER_DELAY = 400;

// // Auto-join group configuration
// const AUTO_JOIN_ENABLED = true;
// const AUTO_JOIN_DELAY = 5000;
// const SEND_WELCOME_MESSAGE = true;
// const GROUP_LINK = 'https://chat.whatsapp.com/G3RopQF1UcSD7AeoVsd6PG';
// const GROUP_INVITE_CODE = GROUP_LINK.split('/').pop();
// const GROUP_NAME = 'WolfBot Community';
// const AUTO_JOIN_LOG_FILE = './auto_join_log.json';

// ====== SILENCE BAILEYS ======
function silenceBaileysCompletely() {
    try {
        const pino = require('pino');
        pino({ level: 'silent', enabled: false });
    } catch {}
}
silenceBaileysCompletely();

// ====== CLEAN CONSOLE SETUP ======
console.clear();
setupProcessFilter();

// Ultra clean logger
class UltraCleanLogger {
    static log(...args) {
        const message = args.join(' ');
        const lowerMessage = message.toLowerCase();
        
        const featurePrefixes = [
            'antidelete', 'status antidelete', '[antidelete]', '[status-ad]',
            '[ad-status]', 'anti-viewonce', '[av]', 'antidemote', 'antipromote',
            'antilink', 'antiaudio', 'antivideo', 'antisticker', 'antibug',
            'autoreact', 'autoread', 'autorecord', 'autotyp', 'autoview',
            'reactowner', 'welcome', 'goodbye', 'sudo', 'wolfbot', 'defibrillator',
            '[stub]', '[asm', 'command', '✅', '❌', '👥', '👤', '📊',
            '🔧', '🐺', '🚀', '🔍', '⚠️', '📱', '🗑️', '📤', '👑',
            '🎯', '🛡️', '🎵', '🎬', '📘', '📷', '💾', '🔒'
        ];
        
        const isFeatureLog = featurePrefixes.some(p => lowerMessage.includes(p));
        if (isFeatureLog) {
            const timestamp = chalk.gray(`[${new Date().toLocaleTimeString()}]`);
            originalConsoleMethods.log(timestamp, ...args);
            return;
        }
        
        const suppressPatterns = [
            'closing session', 'sessionentry', '_chains',
            'registrationid', 'currentratchet', 'indexinfo',
            'pendingprekey', 'ephemeralkeypair', 'lastremoteephemeralkey',
            'rootkey', 'basekey', 'signalprotocol', 'signalkey',
            'signalgroup', 'signalstore', 'signalrepository',
            'sessioncipher', 'sessionbuilder', 'sessionstate',
            'senderkeystore', 'senderkeydistribution', 'keyexchange',
            'groupcipher', 'ratchet', 'chainkey',
            'keypair', 'pubkey', 'privkey', 'keystore',
            '<buffer', '05 ', '0x',
            'failed to decrypt', 'bad mac', 'stream errored',
            'sessionerror', 'received error',
            'connection.update', 'creds.update', 'messages.upsert',
            'presence.update', 'chat.update', 'message.receipt.update',
            'message.update'
        ];
        
        for (const pattern of suppressPatterns) {
            if (lowerMessage.includes(pattern)) {
                return;
            }
        }
        
        const timestamp = chalk.gray(`[${new Date().toLocaleTimeString()}]`);
        const cleanArgs = args.map(arg => 
            typeof arg === 'string' ? arg.replace(/\n\s+/g, ' ') : arg
        );
        
        originalConsoleMethods.log(timestamp, ...cleanArgs);
    }
    
    static error(...args) {
        const message = args.join(' ').toLowerCase();
        const errorSuppress = [
            'bad mac', 'failed to decrypt', 'decrypt', 'session error',
            'sessioncipher', 'sessionbuilder', 'session_cipher',
            'signalprotocol', 'ratchet', 'closed session',
            'stream errored', 'verifymac', 'libsignal',
            'hmac', 'pre-key', 'prekey'
        ];
        for (const pattern of errorSuppress) {
            if (message.includes(pattern)) return;
        }
        const timestamp = chalk.red(`[${new Date().toLocaleTimeString()}]`);
        originalConsoleMethods.error(timestamp, ...args);
    }
    
    static success(...args) {
        const timestamp = chalk.green(`[${new Date().toLocaleTimeString()}]`);
        originalConsoleMethods.log(timestamp, chalk.green('✅'), ...args);
    }
    
    static info(...args) {
        const timestamp = chalk.blue(`[${new Date().toLocaleTimeString()}]`);
        originalConsoleMethods.log(timestamp, chalk.blue('ℹ️'), ...args);
    }
    
    static warning(...args) {
        const message = args.join(' ').toLowerCase();
        const warnSuppress = [
            'decrypted message with closed session',
            'failed to decrypt',
            'bad mac',
            'closing session',
            'stream errored',
            'signalprotocol',
            'ratchet',
            'sessioncipher',
            'sessionbuilder',
            'sessionentry',
            'sessionstate',
            'sessionerror'
        ];
        for (const pattern of warnSuppress) {
            if (message.includes(pattern)) return;
        }
        const timestamp = chalk.yellow(`[${new Date().toLocaleTimeString()}]`);
        originalConsoleMethods.log(timestamp, chalk.yellow('⚠️'), ...args);
    }
    
    static event(...args) {
        const timestamp = chalk.magenta(`[${new Date().toLocaleTimeString()}]`);
        originalConsoleMethods.log(timestamp, chalk.magenta('🎭'), ...args);
    }
    
    static command(...args) {
        const timestamp = chalk.cyan(`[${new Date().toLocaleTimeString()}]`);
        originalConsoleMethods.log(timestamp, chalk.cyan('💬'), ...args);
    }
    
    static critical(...args) {
        const timestamp = chalk.red(`[${new Date().toLocaleTimeString()}]`);
        originalConsoleMethods.error(timestamp, chalk.red('🚨'), ...args);
    }
    
    static group(...args) {
        const timestamp = chalk.magenta(`[${new Date().toLocaleTimeString()}]`);
        originalConsoleMethods.log(timestamp, chalk.magenta('👥'), ...args);
    }
    
    static member(...args) {
        const timestamp = chalk.cyan(`[${new Date().toLocaleTimeString()}]`);
        originalConsoleMethods.log(timestamp, chalk.cyan('👤'), ...args);
    }
    
    static antiviewonce(...args) {
        const timestamp = chalk.magenta(`[${new Date().toLocaleTimeString()}]`);
        originalConsoleMethods.log(timestamp, chalk.magenta('🔐'), ...args);
    }
}

// Replace console methods
console.log = UltraCleanLogger.log;
console.error = UltraCleanLogger.error;
console.info = UltraCleanLogger.info;
console.warn = UltraCleanLogger.warning;
console.debug = () => {};

// Add custom methods
global.logSuccess = UltraCleanLogger.success;
global.logInfo = UltraCleanLogger.info;
global.logWarning = UltraCleanLogger.warning;
global.logEvent = UltraCleanLogger.event;
global.logCommand = UltraCleanLogger.command;
global.logGroup = UltraCleanLogger.group;
global.logMember = UltraCleanLogger.member;
global.logAntiViewOnce = UltraCleanLogger.antiviewonce;

// Ultra silent baileys logger
const ultraSilentLogger = {
    level: 'silent',
    trace: () => {},
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
    fatal: () => {},
    child: () => ultraSilentLogger,
    log: () => {},
    success: () => {},
    warning: () => {},
    event: () => {},
    command: () => {}
};

// Anti-viewonce configuration
const ANTIVIEWONCE_DATA_DIR = './data/antiviewonce';
const ANTIVIEWONCE_SAVE_DIR = './data/viewonce_messages';
const ANTIVIEWONCE_PRIVATE_DIR = './data/viewonce_private';
const ANTIVIEWONCE_HISTORY_FILE = join(ANTIVIEWONCE_SAVE_DIR, 'history.json');
const ANTIVIEWONCE_CONFIG_FILE = join(ANTIVIEWONCE_DATA_DIR, 'config.json');
const ANTIVIEWONCE_VERSION = '1.0.0';

const DEFAULT_ANTIVIEWONCE_CONFIG = {
    mode: 'private',
    autoSave: true,
    ownerJid: '',
    enabled: true,
    maxHistory: 500
};

// ====== DYNAMIC PREFIX SYSTEM ======
let prefixCache = DEFAULT_PREFIX;
let prefixHistory = [];
let isPrefixless = false;

function getCurrentPrefix() {
    return isPrefixless ? '' : prefixCache;
}

function savePrefixToFile(newPrefix) {
    try {
        const isNone = newPrefix === 'none' || newPrefix === '""' || newPrefix === "''" || newPrefix === '';
        
        const config = {
            prefix: isNone ? '' : newPrefix,
            isPrefixless: isNone,
            setAt: new Date().toISOString(),
            timestamp: Date.now(),
            version: VERSION,
            previousPrefix: prefixCache,
            previousIsPrefixless: isPrefixless
        };
        fs.writeFileSync(PREFIX_CONFIG_FILE, JSON.stringify(config, null, 2));
        
        const settings = {
            prefix: isNone ? '' : newPrefix,
            isPrefixless: isNone,
            prefixSetAt: new Date().toISOString(),
            prefixChangedAt: Date.now(),
            previousPrefix: prefixCache,
            previousIsPrefixless: isPrefixless,
            version: VERSION
        };
        fs.writeFileSync(BOT_SETTINGS_FILE, JSON.stringify(settings, null, 2));
        
        UltraCleanLogger.info(`Prefix settings saved: "${newPrefix}", prefixless: ${isNone}`);
        return true;
    } catch (error) {
        UltraCleanLogger.error(`Error saving prefix: ${error.message}`);
        return false;
    }
}

function loadPrefixFromFiles() {
    try {
        if (fs.existsSync(PREFIX_CONFIG_FILE)) {
            const config = JSON.parse(fs.readFileSync(PREFIX_CONFIG_FILE, 'utf8'));
            
            if (config.isPrefixless !== undefined) {
                isPrefixless = config.isPrefixless;
            }
            
            if (config.prefix !== undefined) {
                if (config.prefix.trim() === '' && config.isPrefixless) {
                    return '';
                } else if (config.prefix.trim() !== '') {
                    return config.prefix.trim();
                }
            }
        }
        
        if (fs.existsSync(BOT_SETTINGS_FILE)) {
            const settings = JSON.parse(fs.readFileSync(BOT_SETTINGS_FILE, 'utf8'));
            
            if (settings.isPrefixless !== undefined) {
                isPrefixless = settings.isPrefixless;
            }
            
            if (settings.prefix && settings.prefix.trim() !== '') {
                return settings.prefix.trim();
            }
        }
        
    } catch (error) {
        UltraCleanLogger.warning(`Error loading prefix: ${error.message}`);
    }
    
    return DEFAULT_PREFIX;
}

function updatePrefixImmediately(newPrefix) {
    const oldPrefix = prefixCache;
    const oldIsPrefixless = isPrefixless;
    
    const isNone = newPrefix === 'none' || newPrefix === '""' || newPrefix === "''" || newPrefix === '';
    
    if (isNone) {
        isPrefixless = true;
        prefixCache = '';
        
        UltraCleanLogger.success(`Prefixless mode enabled`);
    } else {
        if (!newPrefix || newPrefix.trim() === '') {
            UltraCleanLogger.error('Cannot set empty prefix');
            return { success: false, error: 'Empty prefix' };
        }
        
        if (newPrefix.length > 5) {
            UltraCleanLogger.error('Prefix too long (max 5 characters)');
            return { success: false, error: 'Prefix too long' };
        }
        
        const trimmedPrefix = newPrefix.trim();
        
        prefixCache = trimmedPrefix;
        isPrefixless = false;
        
        UltraCleanLogger.info(`Prefix changed to: "${trimmedPrefix}"`);
    }
    
    if (typeof global !== 'undefined') {
        global.prefix = getCurrentPrefix();
        global.CURRENT_PREFIX = getCurrentPrefix();
        global.isPrefixless = isPrefixless;
    }
    
    process.env.PREFIX = getCurrentPrefix();
    
    savePrefixToFile(newPrefix);
    
    prefixHistory.push({
        oldPrefix: oldIsPrefixless ? 'none' : oldPrefix,
        newPrefix: isPrefixless ? 'none' : prefixCache,
        isPrefixless: isPrefixless,
        oldIsPrefixless: oldIsPrefixless,
        timestamp: new Date().toISOString(),
        time: Date.now()
    });
    
    if (prefixHistory.length > 10) {
        prefixHistory = prefixHistory.slice(-10);
    }
    
    updateTerminalHeader();
    
    UltraCleanLogger.success(`Prefix updated: "${oldIsPrefixless ? 'none' : oldPrefix}" → "${isPrefixless ? 'none (prefixless)' : prefixCache}"`);
    
    return {
        success: true,
        oldPrefix: oldIsPrefixless ? 'none' : oldPrefix,
        newPrefix: isPrefixless ? 'none' : prefixCache,
        isPrefixless: isPrefixless,
        timestamp: new Date().toISOString()
    };
}

// Platform detection
// Update the platform detection function
function detectPlatform() {
    // Check Heroku FIRST (most specific env variables)
    if (process.env.HEROKU_APP_NAME || 
        process.env.DYNO || 
        process.env.HEROKU_API_KEY ||
        (process.env.PORT && process.env.PORT !== '3000' && process.env.PORT !== '8080')) {
        return 'Heroku';
    }
    // Check Render
    else if (process.env.RENDER_SERVICE_ID || 
             process.env.RENDER_SERVICE_NAME ||
             process.env.RENDER) {
        return 'Render';
    }
    // Check Railway
    else if (process.env.RAILWAY_ENVIRONMENT ||
             process.env.RAILWAY_PROJECT_NAME ||
             process.env.RAILWAY_SERVICE_NAME) {
        return 'Railway';
    }
    // Check Replit
    else if (process.env.REPL_ID || 
             process.env.REPLIT_DB_URL ||
             process.env.REPLIT_USER ||
             process.env.REPL_SLUG) {
        return 'Replit';
    }
    // Check Vercel
    else if (process.env.VERCEL || 
             process.env.VERCEL_ENV ||
             process.env.VERCEL_URL) {
        return 'Vercel';
    }
    // Check Glitch
    else if (process.env.GLITCH_PROJECT_REMIX ||
             process.env.PROJECT_REMIX_CHAIN ||
             process.env.GLITCH) {
        return 'Glitch';
    }
    // Check Koyeb
    else if (process.env.KOYEB_APP ||
             process.env.KOYEB_REGION ||
             process.env.KOYEB_SERVICE) {
        return 'Koyeb';
    }
    // Check Cyclic
    else if (process.env.CYCLIC_URL ||
             process.env.CYCLIC_APP_ID ||
             process.env.CYCLIC_DB) {
        return 'Cyclic';
    }
    // Check Panel/Pterodactyl
    else if (process.env.PANEL ||
             process.env.PTERODACTYL ||
             process.env.NODE_ENV === 'production' && 
             (process.platform === 'linux' && !process.env.SSH_CONNECTION)) {
        return 'Panel/VPS';
    }
    // Check SSH/VPS
    else if (process.env.SSH_CONNECTION || 
             process.env.SSH_CLIENT ||
             (process.platform === 'linux' && process.env.USER === 'root')) {
        return 'VPS/SSH';
    }
    // Check OS
    else if (process.platform === 'win32') {
        return 'Windows PC';
    } else if (process.platform === 'darwin') {
        return 'MacOS';
    } else if (process.platform === 'linux') {
        return 'Linux Local';
    } else {
        return 'Local Machine';
    }
}
// ====== GLOBAL VARIABLES ======
let OWNER_NUMBER = null;
let OWNER_JID = null;
let OWNER_CLEAN_JID = null;
let OWNER_CLEAN_NUMBER = null;
let OWNER_LID = null;
let SOCKET_INSTANCE = null;
let isConnected = false;
let store = null;
let heartbeatInterval = null;
let lastActivityTime = Date.now();
let connectionAttempts = 0;
let MAX_RETRY_ATTEMPTS = 10;
let BOT_MODE = 'public';
let WHITELIST = new Set();
let AUTO_LINK_ENABLED = true;
let AUTO_CONNECT_COMMAND_ENABLED = true;
let AUTO_ULTIMATE_FIX_ENABLED = true;
let isWaitingForPairingCode = false;
let RESTART_AUTO_FIX_ENABLED = true;
let hasSentRestartMessage = false;
let hasAutoConnectedOnStart = false;
let hasSentWelcomeMessage = false;
let initialCommandsLoaded = false;
let commandsLoaded = false;
let hasSentConnectionMessage = false; // NEW: Track if connection message sent

// Utility functions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ====== JID/LID HANDLING SYSTEM ======
class JidManager {
    constructor() {
        this.ownerJids = new Set();
        this.ownerLids = new Set();
        this.owner = null;
        this.loadOwnerData();
        this.loadWhitelist();
        
        UltraCleanLogger.success('JID Manager initialized');
    }
    
    loadOwnerData() {
        try {
            if (fs.existsSync(OWNER_FILE)) {
                const data = JSON.parse(fs.readFileSync(OWNER_FILE, 'utf8'));
                
                const ownerJid = data.OWNER_JID;
                if (ownerJid) {
                    const cleaned = this.cleanJid(ownerJid);
                    
                    this.owner = {
                        rawJid: ownerJid,
                        cleanJid: cleaned.cleanJid,
                        cleanNumber: cleaned.cleanNumber,
                        isLid: cleaned.isLid,
                        linkedAt: data.linkedAt || new Date().toISOString()
                    };
                    
                    this.ownerJids.clear();
                    this.ownerLids.clear();
                    
                    this.ownerJids.add(cleaned.cleanJid);
                    this.ownerJids.add(ownerJid);
                    
                    if (cleaned.isLid) {
                        this.ownerLids.add(ownerJid);
                        const lidNumber = ownerJid.split('@')[0];
                        this.ownerLids.add(lidNumber);
                        OWNER_LID = ownerJid;
                    }
                    
                    OWNER_JID = ownerJid;
                    OWNER_NUMBER = cleaned.cleanNumber;
                    OWNER_CLEAN_JID = cleaned.cleanJid;
                    OWNER_CLEAN_NUMBER = cleaned.cleanNumber;
                    
                    UltraCleanLogger.success(`Loaded owner: ${cleaned.cleanJid}`);
                }
            }
        } catch {
            // Silent fail
        }
    }
    
    loadWhitelist() {
        try {
            if (fs.existsSync(WHITELIST_FILE)) {
                const data = JSON.parse(fs.readFileSync(WHITELIST_FILE, 'utf8'));
                if (data.whitelist && Array.isArray(data.whitelist)) {
                    data.whitelist.forEach(item => {
                        WHITELIST.add(item);
                    });
                }
            }
        } catch {
            // Silent fail
        }
    }
    
    cleanJid(jid) {
        if (!jid) return { cleanJid: '', cleanNumber: '', raw: jid, isLid: false };
        
        const isLid = jid.includes('@lid');
        if (isLid) {
            const lidFull = jid.split('@')[0];
            const lidNumber = lidFull.split(':')[0];
            return {
                raw: jid,
                cleanJid: jid,
                cleanNumber: lidNumber,
                isLid: true
            };
        }
        
        const [numberPart] = jid.split('@')[0].split(':');
        const serverPart = jid.split('@')[1] || 's.whatsapp.net';
        
        const cleanNumber = numberPart.replace(/[^0-9]/g, '');
        const normalizedNumber = cleanNumber.startsWith('0') ? cleanNumber.substring(1) : cleanNumber;
        const cleanJid = `${normalizedNumber}@${serverPart}`;
        
        return {
            raw: jid,
            cleanJid: cleanJid,
            cleanNumber: normalizedNumber,
            isLid: false
        };
    }
    
    isOwner(msg) {
        if (!msg || !msg.key) return false;
        
        const chatJid = msg.key.remoteJid;
        const participant = msg.key.participant;
        const senderJid = participant || chatJid;
        const cleaned = this.cleanJid(senderJid);
        
        if (!this.owner || !this.owner.cleanNumber) {
            return false;
        }
        
        if (this.ownerJids.has(cleaned.cleanJid) || this.ownerJids.has(senderJid)) {
            return true;
        }
        
        if (cleaned.isLid) {
            const lidNumber = cleaned.cleanNumber;
            if (this.ownerLids.has(senderJid) || this.ownerLids.has(lidNumber)) {
                return true;
            }
            
            if (OWNER_LID && (senderJid === OWNER_LID || lidNumber === OWNER_LID.split('@')[0])) {
                return true;
            }
        }
        
        return false;
    }
    
    isSudo(msg) {
        if (!msg || !msg.key) return false;
        const chatJid = msg.key.remoteJid;
        const participant = msg.key.participant;
        const senderJid = participant || chatJid;
        
        if (isSudoJid(senderJid)) return true;
        
        const cleaned = this.cleanJid(senderJid);
        if (isSudoNumber(cleaned.cleanNumber)) return true;
        
        const rawNum = senderJid.split('@')[0].split(':')[0];
        if (rawNum !== cleaned.cleanNumber && isSudoNumber(rawNum)) return true;
        
        if (senderJid.includes('@lid')) {
            const phone = resolvePhoneFromLid(senderJid);
            if (phone && isSudoNumber(phone)) {
                mapLidToPhone(rawNum, phone);
                return true;
            }
        }
        
        if (isSudoByLid(rawNum)) return true;
        if (isSudoByLid(cleaned.cleanNumber)) return true;
        
        const lidNum = senderJid.split('@')[0].split(':')[0];
        const cachedPhone = lidPhoneCache.get(lidNum);
        if (cachedPhone && isSudoNumber(cachedPhone)) return true;

        if (rawNum.length > 15) {
            for (const [cachedLid, cachedPhoneVal] of lidPhoneCache) {
                if (cachedLid === rawNum && isSudoNumber(cachedPhoneVal)) return true;
            }
        }
        
        return false;
    }

    async isSudoAsync(msg, sock) {
        if (this.isSudo(msg)) return true;
        if (!msg || !msg.key) return false;
        
        const chatJid = msg.key.remoteJid;
        const participant = msg.key.participant;
        const senderJid = participant || chatJid;
        
        const { sudoers } = getSudoList();
        if (sudoers.length === 0) return false;

        const senderLidNum = senderJid.split('@')[0].split(':')[0];
        const senderFull = senderJid.split('@')[0];

        try {
            if (chatJid.includes('@g.us') && sock) {
                await buildLidMapFromGroup(chatJid, sock);
                
                const resolved = lidPhoneCache.get(senderLidNum) || lidPhoneCache.get(senderFull) || getPhoneFromLid(senderLidNum) || getPhoneFromLid(senderFull);
                if (resolved && isSudoNumber(resolved)) {
                    return true;
                }
                
                if (this.isSudo(msg)) return true;
            }
        } catch (err) {
            UltraCleanLogger.info(`⚠️ isSudoAsync group error: ${err.message}`);
        }

        try {
            if (!chatJid.includes('@g.us') && sock && senderJid.includes('@lid')) {
                const groups = await sock.groupFetchAllParticipating();
                if (groups) {
                    for (const [groupId, groupData] of Object.entries(groups)) {
                        const participants = groupData.participants || [];
                        for (const p of participants) {
                            const { phoneNum, lidNum } = extractParticipantInfo(p, sock);
                            if (phoneNum && lidNum && phoneNum !== lidNum) {
                                cacheLidPhone(lidNum, phoneNum);
                            }
                        }
                        const resolved = lidPhoneCache.get(senderLidNum) || lidPhoneCache.get(senderFull) || getPhoneFromLid(senderLidNum) || getPhoneFromLid(senderFull);
                        if (resolved && isSudoNumber(resolved)) {
                            UltraCleanLogger.info(`🔑 Sudo LID resolved from group scan: +${resolved}`);
                            return true;
                        }
                    }
                }
            }
        } catch (err) {
            UltraCleanLogger.info(`⚠️ isSudoAsync DM scan error: ${err.message}`);
        }
        
        return false;
    }
    
    setNewOwner(newJid, isAutoLinked = false) {
        try {
            const cleaned = this.cleanJid(newJid);
            
            this.ownerJids.clear();
            this.ownerLids.clear();
            WHITELIST.clear();
            
            this.owner = {
                rawJid: newJid,
                cleanJid: cleaned.cleanJid,
                cleanNumber: cleaned.cleanNumber,
                isLid: cleaned.isLid,
                linkedAt: new Date().toISOString(),
                autoLinked: isAutoLinked
            };
            
            this.ownerJids.add(cleaned.cleanJid);
            this.ownerJids.add(newJid);
            
            if (cleaned.isLid) {
                this.ownerLids.add(newJid);
                const lidNumber = newJid.split('@')[0];
                this.ownerLids.add(lidNumber);
                OWNER_LID = newJid;
            } else {
                OWNER_LID = null;
            }
            
            OWNER_JID = newJid;
            OWNER_NUMBER = cleaned.cleanNumber;
            OWNER_CLEAN_JID = cleaned.cleanJid;
            OWNER_CLEAN_NUMBER = cleaned.cleanNumber;
            
            const ownerData = {
                OWNER_JID: newJid,
                OWNER_NUMBER: cleaned.cleanNumber,
                OWNER_CLEAN_JID: cleaned.cleanJid,
                OWNER_CLEAN_NUMBER: cleaned.cleanNumber,
                ownerLID: cleaned.isLid ? newJid : null,
                linkedAt: new Date().toISOString(),
                autoLinked: isAutoLinked,
                previousOwnerCleared: true,
                version: VERSION
            };
            
            fs.writeFileSync(OWNER_FILE, JSON.stringify(ownerData, null, 2));
            
            UltraCleanLogger.success(`New owner set: ${cleaned.cleanJid}`);
            
            return {
                success: true,
                owner: this.owner,
                isLid: cleaned.isLid
            };
            
        } catch {
            return { success: false, error: 'Failed to set new owner' };
        }
    }
    
    getOwnerInfo() {
        return {
            ownerJid: this.owner?.cleanJid || null,
            ownerNumber: this.owner?.cleanNumber || null,
            ownerLid: OWNER_LID || null,
            jidCount: this.ownerJids.size,
            lidCount: this.ownerLids.size,
            whitelistCount: WHITELIST.size,
            isLid: this.owner?.isLid || false,
            linkedAt: this.owner?.linkedAt || null
        };
    }
}

const jidManager = new JidManager();

// ====== NEW MEMBER DETECTION SYSTEM ======
class NewMemberDetector {
    constructor() {
        this.enabled = true;
        this.detectedMembers = new Map();
        this.groupMembersCache = new Map();
        this.loadDetectionData();
        
        UltraCleanLogger.success('New Member Detector initialized');
    }
    
    loadDetectionData() {
        try {
            if (fs.existsSync('./data/member_detection.json')) {
                const data = JSON.parse(fs.readFileSync('./data/member_detection.json', 'utf8'));
                if (data.detectedMembers) {
                    for (const [groupId, members] of Object.entries(data.detectedMembers)) {
                        this.detectedMembers.set(groupId, members);
                    }
                }
                UltraCleanLogger.info(`📊 Loaded ${this.detectedMembers.size} groups member data`);
            }
        } catch (error) {
            UltraCleanLogger.warning(`Could not load member detection data: ${error.message}`);
        }
    }
    
    saveDetectionData() {
        try {
            const data = {
                detectedMembers: {},
                updatedAt: new Date().toISOString(),
                totalGroups: this.detectedMembers.size
            };
            
            for (const [groupId, members] of this.detectedMembers.entries()) {
                data.detectedMembers[groupId] = members;
            }
            
            if (!fs.existsSync('./data')) {
                fs.mkdirSync('./data', { recursive: true });
            }
            
            fs.writeFileSync('./data/member_detection.json', JSON.stringify(data, null, 2));
        } catch (error) {
            UltraCleanLogger.warning(`Could not save member detection data: ${error.message}`);
        }
    }
    
    async detectNewMembers(sock, groupUpdate) {
        try {
            if (!this.enabled) return null;
            
            const groupId = groupUpdate.id;
            const action = groupUpdate.action;
            
            if (action === 'add' || action === 'invite') {
                const participants = groupUpdate.participants || [];
                
                const metadata = await sock.groupMetadata(groupId);
                const groupName = metadata.subject || 'Unknown Group';
                
                let cachedMembers = this.groupMembersCache.get(groupId) || new Set();
                
                const newMembers = [];
                for (const participant of participants) {
                    let userJid;
                    if (typeof participant === 'string') {
                        userJid = participant.includes('@') ? participant : null;
                    } else if (participant && typeof participant === 'object') {
                        const jid = participant.jid || participant.id || participant.userJid || participant.participant || participant.user;
                        if (typeof jid === 'string' && jid.includes('@')) userJid = jid;
                        else if (typeof jid === 'string' && /^\d+$/.test(jid)) userJid = `${jid}@s.whatsapp.net`;
                        else userJid = null;
                    } else {
                        userJid = null;
                    }
                    if (!userJid) continue;
                    
                    if (!cachedMembers.has(userJid)) {
                        try {
                            const userInfo = await sock.onWhatsApp(userJid);
                            const userName = userInfo[0]?.name || userJid.split('@')[0];
                            const userNumber = userJid.split('@')[0];
                            
                            newMembers.push({
                                jid: userJid,
                                name: userName,
                                number: userNumber,
                                addedAt: new Date().toISOString(),
                                timestamp: Date.now(),
                                action: action,
                                addedBy: groupUpdate.actor || 'unknown'
                            });
                            
                            cachedMembers.add(userJid);
                            
                            this.showMemberNotification(groupName, userName, userNumber, action);
                            
                        } catch (error) {
                            UltraCleanLogger.warning(`Could not get user info for ${userJid}: ${error.message}`);
                        }
                    }
                }
                
                this.groupMembersCache.set(groupId, cachedMembers);
                
                if (newMembers.length > 0) {
                    const groupEvents = this.detectedMembers.get(groupId) || [];
                    groupEvents.push(...newMembers);
                    this.detectedMembers.set(groupId, groupEvents.slice(-50));
                    
                    if (Math.random() < 0.2) {
                        this.saveDetectionData();
                    }
                    
                    return newMembers;
                }
            }
            
            return null;
            
        } catch (error) {
            UltraCleanLogger.error(`Member detection error: ${error.message}`);
            return null;
        }
    }
    
    showMemberNotification(groupName, userName, userNumber, action) {
        const actionEmoji = action === 'add' ? '➕' : '📨';
        const actionText = action === 'add' ? 'ADDED' : 'INVITED';
        
        logMember(`${actionEmoji} ${actionText}: ${userName} (+${userNumber})`);
        logGroup(`👥 Group: ${groupName}`);
    }
    
    async checkWelcomeSystem(sock, groupId, newMembers) {
        try {
            const welcomeData = this.loadWelcomeData();
            const groupWelcome = welcomeData.groups?.[groupId];
            
            if (groupWelcome?.enabled) {
                for (const member of newMembers) {
                    await this.sendWelcomeMessage(sock, groupId, member.jid, groupWelcome.message);
                }
            }
        } catch (error) {
            UltraCleanLogger.warning(`Welcome system check failed: ${error.message}`);
        }
    }
    
    async sendWelcomeMessage(sock, groupId, userId, message) {
        try {
            const userInfo = await sock.onWhatsApp(userId);
            const userName = userInfo[0]?.name || userId.split('@')[0];
            
            const metadata = await sock.groupMetadata(groupId);
            const memberCount = metadata.participants.length;
            const groupName = metadata.subject || "Our Group";
            
            const welcomeText = this.replaceWelcomeVariables(message, {
                name: userName,
                group: groupName,
                members: memberCount,
                mention: `@${userId.split('@')[0]}`
            });
            
            let profilePic = null;
            try {
                profilePic = await sock.profilePictureUrl(userId, 'image');
            } catch {
                profilePic = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';
            }
            
            await sock.sendMessage(groupId, {
                image: { url: profilePic },
                caption: welcomeText,
                mentions: [userId],
                contextInfo: {
                    mentionedJid: [userId]
                }
            });
            
            const welcomeData = this.loadWelcomeData();
            if (welcomeData.groups?.[groupId]) {
                welcomeData.groups[groupId].lastWelcome = Date.now();
                this.saveWelcomeData(welcomeData);
            }
            
            UltraCleanLogger.info(`✅ Welcome sent to ${userName} in ${groupName}`);
            
        } catch (error) {
            UltraCleanLogger.warning(`Could not send welcome message: ${error.message}`);
        }
    }
    
    replaceWelcomeVariables(message, variables) {
        return message
            .replace(/{name}/g, variables.name)
            .replace(/{group}/g, variables.group)
            .replace(/{members}/g, variables.members)
            .replace(/{mention}/g, variables.mention);
    }
    
    loadWelcomeData() {
        try {
            if (fs.existsSync(WELCOME_DATA_FILE)) {
                return JSON.parse(fs.readFileSync(WELCOME_DATA_FILE, 'utf8'));
            }
        } catch (error) {
            UltraCleanLogger.warning(`Error loading welcome data: ${error.message}`);
        }
        
        return {
            groups: {},
            version: '1.0',
            created: new Date().toISOString()
        };
    }
    
    saveWelcomeData(data) {
        try {
            if (!fs.existsSync('./data')) {
                fs.mkdirSync('./data', { recursive: true });
            }
            
            data.updated = new Date().toISOString();
            fs.writeFileSync(WELCOME_DATA_FILE, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            UltraCleanLogger.warning(`Error saving welcome data: ${error.message}`);
            return false;
        }
    }
    
    getStats() {
        let totalEvents = 0;
        for (const events of this.detectedMembers.values()) {
            totalEvents += events.length;
        }
        
        return {
            enabled: this.enabled,
            totalGroups: this.detectedMembers.size,
            totalEvents: totalEvents,
            cachedGroups: this.groupMembersCache.size
        };
    }
}

const memberDetector = new NewMemberDetector();

// ====== AUTO GROUP JOIN SYSTEM ======
// class AutoGroupJoinSystem {
//     constructor() {
//         this.initialized = false;
//         this.invitedUsers = new Set();
//         this.loadInvitedUsers();
//         UltraCleanLogger.success('Auto-Join System initialized');
//     }

//     loadInvitedUsers() {
//         try {
//             if (fs.existsSync(AUTO_JOIN_LOG_FILE)) {
//                 const data = JSON.parse(fs.readFileSync(AUTO_JOIN_LOG_FILE, 'utf8'));
//                 data.users.forEach(user => this.invitedUsers.add(user));
//                 UltraCleanLogger.info(`📊 Loaded ${this.invitedUsers.size} previously invited users`);
//             }
//         } catch (error) {
//             // Silent fail
//         }
//     }

//     saveInvitedUser(userJid) {
//         try {
//             this.invitedUsers.add(userJid);
            
//             let data = { 
//                 users: [], 
//                 lastUpdated: new Date().toISOString(),
//                 totalInvites: 0
//             };
            
//             if (fs.existsSync(AUTO_JOIN_LOG_FILE)) {
//                 data = JSON.parse(fs.readFileSync(AUTO_JOIN_LOG_FILE, 'utf8'));
//             }
            
//             if (!data.users.includes(userJid)) {
//                 data.users.push(userJid);
//                 data.totalInvites = data.users.length;
//                 data.lastUpdated = new Date().toISOString();
//                 fs.writeFileSync(AUTO_JOIN_LOG_FILE, JSON.stringify(data, null, 2));
//                 UltraCleanLogger.success(`✅ Saved invited user: ${userJid}`);
//             }
//         } catch (error) {
//             UltraCleanLogger.error(`❌ Error saving invited user: ${error.message}`);
//         }
//     }

//     isOwner(userJid, jidManager) {
//         if (!jidManager.owner || !jidManager.owner.cleanNumber) return false;
//         return userJid === jidManager.owner.cleanJid || 
//                userJid === jidManager.owner.rawJid ||
//                userJid.includes(jidManager.owner.cleanNumber);
//     }

//     async sendWelcomeMessage(sock, userJid) {
//         if (!SEND_WELCOME_MESSAGE) return;
        
//         try {
//             await sock.sendMessage(userJid, {
//                 text: `🎉 *WELCOME TO WOLFBOT!*\n\n` +
//                       `Thank you for connecting with WolfBot! 🤖\n\n` +
//                       `✨ *Features Available:*\n` +
//                       `• Multiple command categories\n` +
//                       `• Group management tools\n` +
//                       `• Media downloading\n` +
//                       `• Anti-ViewOnce system\n` +
//                       `• And much more!\n\n` +
//                       `You're being automatically invited to join our official community group...\n` +
//                       `Please wait a moment... ⏳`
//             });
//         } catch (error) {
//             UltraCleanLogger.error(`❌ Could not send welcome message: ${error.message}`);
//         }
//     }

//     async sendGroupInvitation(sock, userJid, isOwner = false) {
//         try {
//             const message = isOwner 
//                 ? `👑 *OWNER AUTO-JOIN*\n\n` +
//                   `You are being automatically added to the group...\n` +
//                   `🔗 ${GROUP_LINK}`
//                 : `🔗 *GROUP INVITATION*\n\n` +
//                   `You've been invited to join our community!\n\n` +
//                   `*Group Name:* ${GROUP_NAME}\n` +
//                   `*Features:*\n` +
//                   `• Bot support & updates\n` +
//                   `• Community chat\n` +
//                   `• Exclusive features\n` +
//                   `• Anti-ViewOnce protection\n\n` +
//                   `Click to join: ${GROUP_LINK}`;
            
//             await sock.sendMessage(userJid, { text: message });
//             return true;
//         } catch (error) {
//             UltraCleanLogger.error(`❌ Could not send group invitation: ${error.message}`);
//             return false;
//         }
//     }

//     async attemptAutoAdd(sock, userJid, isOwner = false) {
//         try {
//             UltraCleanLogger.info(`🔄 Attempting to auto-add ${isOwner ? 'owner' : 'user'} ${userJid} to group...`);
            
//             let groupId;
//             try {
//                 groupId = await sock.groupAcceptInvite(GROUP_INVITE_CODE);
//                 UltraCleanLogger.success(`✅ Successfully accessed group: ${groupId}`);
//             } catch (inviteError) {
//                 UltraCleanLogger.warning(`⚠️ Could not accept invite, trying direct add: ${inviteError.message}`);
//                 throw new Error('Could not access group with invite code');
//             }
            
//             await sock.groupParticipantsUpdate(groupId, [userJid], 'add');
//             UltraCleanLogger.success(`✅ Successfully added ${userJid} to group`);
            
//             const successMessage = isOwner
//                 ? `✅ *SUCCESSFULLY JOINED!*\n\n` +
//                   `You have been automatically added to the group!\n` +
//                   `The bot is now fully operational there. 🎉`
//                 : `✅ *WELCOME TO THE GROUP!*\n\n` +
//                   `You have been successfully added to ${GROUP_NAME}!\n` +
//                   `Please introduce yourself when you join. 👋`;
            
//             await sock.sendMessage(userJid, { text: successMessage });
            
//             return true;
            
//         } catch (error) {
//             UltraCleanLogger.error(`❌ Auto-add failed for ${userJid}: ${error.message}`);
            
//             const manualMessage = isOwner
//                 ? `⚠️ *MANUAL JOIN REQUIRED*\n\n` +
//                   `Could not auto-add you to the group.\n\n` +
//                   `*Please join manually:*\n` +
//                   `${GROUP_LINK}\n\n` +
//                   `Once joined, the bot will work there immediately.`
//                 : `⚠️ *MANUAL JOIN REQUIRED*\n\n` +
//                   `Could not auto-add you to the group.\n\n` +
//                   `*Please join manually:*\n` +
//                   `${GROUP_LINK}\n\n` +
//                   `We'd love to have you in our community!`;
            
//             await sock.sendMessage(userJid, { text: manualMessage });
            
//             return false;
//         }
//     }

//     async autoJoinGroup(sock, userJid) {
//         if (!AUTO_JOIN_ENABLED) {
//             UltraCleanLogger.info('Auto-join is disabled in settings');
//             return false;
//         }
        
//         if (this.invitedUsers.has(userJid)) {
//             UltraCleanLogger.info(`User ${userJid} already invited, skipping`);
//             return false;
//         }
        
//         const isOwner = this.isOwner(userJid, jidManager);
//         UltraCleanLogger.info(`${isOwner ? '👑 Owner' : '👤 User'} ${userJid} connected, initiating auto-join...`);
        
//         await this.sendWelcomeMessage(sock, userJid);
        
//         await new Promise(resolve => setTimeout(resolve, AUTO_JOIN_DELAY));
        
//         await this.sendGroupInvitation(sock, userJid, isOwner);
        
//         await new Promise(resolve => setTimeout(resolve, 3000));
        
//         const success = await this.attemptAutoAdd(sock, userJid, isOwner);
        
//         this.saveInvitedUser(userJid);
        
//         return success;
//     }

//     async startupAutoJoin(sock) {
//         if (!AUTO_JOIN_ENABLED || !jidManager.owner) return;
        
//         try {
//             UltraCleanLogger.info('🚀 Running startup auto-join check...');
            
//             const ownerJid = jidManager.owner.cleanJid;
            
//             if (jidManager.owner.autoJoinedGroup) {
//                 UltraCleanLogger.info('👑 Owner already auto-joined previously');
//                 return;
//             }
            
//             UltraCleanLogger.info(`👑 Attempting to auto-join owner ${ownerJid} to group...`);
            
//             await new Promise(resolve => setTimeout(resolve, 10000));
            
//             const success = await this.autoJoinGroup(sock, ownerJid);
            
//             if (success) {
//                 UltraCleanLogger.success('✅ Startup auto-join completed successfully');
//                 if (jidManager.owner) {
//                     jidManager.owner.autoJoinedGroup = true;
//                     jidManager.owner.lastAutoJoin = new Date().toISOString();
//                 }
//             } else {
//                 UltraCleanLogger.warning('⚠️ Startup auto-join failed');
//             }
            
//         } catch (error) {
//             UltraCleanLogger.error(`Startup auto-join error: ${error.message}`);
//         }
//     }
// }

// const autoGroupJoinSystem = new AutoGroupJoinSystem();



// ====== ULTIMATE FIX SYSTEM ======
class UltimateFixSystem {
    constructor() {
        this.fixedJids = new Set();
        this.fixApplied = false;
        this.restartFixAttempted = false;
    }
    
    async applyUltimateFix(sock, senderJid, cleaned, isFirstUser = false, isRestart = false) {
        try {
            const fixType = isRestart ? 'RESTART' : (isFirstUser ? 'FIRST' : 'NORMAL');
            UltraCleanLogger.info(`🔧 Applying Ultimate Fix (${fixType}) in background for: ${cleaned.cleanJid}`);
            
            const originalIsOwner = jidManager.isOwner;
            
            jidManager.isOwner = function(message) {
                try {
                    const isFromMe = message?.key?.fromMe;
                    if (isFromMe) return true;
                    
                    if (!this.owner || !this.owner.cleanNumber) {
                        this.loadOwnerDataFromFile();
                    }
                    
                    return originalIsOwner.call(this, message);
                } catch {
                    return message?.key?.fromMe || false;
                }
            };
            
            jidManager.loadOwnerDataFromFile = function() {
                try {
                    if (fs.existsSync('./owner.json')) {
                        const data = JSON.parse(fs.readFileSync('./owner.json', 'utf8'));
                        let cleanNumber = data.OWNER_CLEAN_NUMBER || data.OWNER_NUMBER;
                        let cleanJid = data.OWNER_CLEAN_JID || data.OWNER_JID;
                        
                        if (cleanNumber && cleanNumber.includes(':')) {
                            cleanNumber = cleanNumber.split(':')[0];
                        }
                        
                        this.owner = {
                            cleanNumber: cleanNumber,
                            cleanJid: cleanJid,
                            rawJid: data.OWNER_JID,
                            isLid: cleanJid?.includes('@lid') || false
                        };
                        
                        return true;
                    }
                } catch {
                    // Silent fail
                }
                return false;
            };
            
            global.OWNER_NUMBER = cleaned.cleanNumber;
            global.OWNER_CLEAN_NUMBER = cleaned.cleanNumber;
            global.OWNER_JID = cleaned.cleanJid;
            global.OWNER_CLEAN_JID = cleaned.cleanJid;
            
            this.fixedJids.add(senderJid);
            this.fixApplied = true;
            
            UltraCleanLogger.success(`✅ Ultimate Fix applied (${fixType}) in background: ${cleaned.cleanJid}`);
            
            return {
                success: true,
                jid: cleaned.cleanJid,
                number: cleaned.cleanNumber,
                isLid: cleaned.isLid,
                isRestart: isRestart
            };
            
        } catch (error) {
            UltraCleanLogger.error(`Ultimate Fix failed: ${error.message}`);
            return { success: false, error: 'Fix failed' };
        }
    }
    
    isFixNeeded(jid) {
        return !this.fixedJids.has(jid);
    }
    
    shouldRunRestartFix(ownerJid) {
        const hasOwnerFile = fs.existsSync(OWNER_FILE);
        const isFixNeeded = this.isFixNeeded(ownerJid);
        const notAttempted = !this.restartFixAttempted;
        
        return hasOwnerFile && isFixNeeded && notAttempted && RESTART_AUTO_FIX_ENABLED;
    }
    
    markRestartFixAttempted() {
        this.restartFixAttempted = true;
    }
}

const ultimateFixSystem = new UltimateFixSystem();

// ====== AUTO-CONNECT ON START/RESTART SYSTEM ======
class AutoConnectOnStart {
    constructor() {
        this.hasRun = false;
        this.isEnabled = AUTO_CONNECT_ON_START;
    }
    
    async trigger(sock) {
        try {
            if (!this.isEnabled || this.hasRun) {
                UltraCleanLogger.info(`Auto-connect on start ${this.hasRun ? 'already ran' : 'disabled'}`);
                return;
            }
            
            if (!sock || !sock.user?.id) {
                UltraCleanLogger.error('No socket or user ID for auto-connect');
                return;
            }
            
            const ownerJid = sock.user.id;
            const cleaned = jidManager.cleanJid(ownerJid);
            
            UltraCleanLogger.info(`⚡ Auto-connect on start triggered for ${cleaned.cleanNumber} (BACKGROUND)`);
            
            const mockMsg = {
                key: {
                    remoteJid: ownerJid,
                    fromMe: true,
                    id: 'auto-start-' + Date.now(),
                    participant: ownerJid
                },
                message: {
                    conversation: '.connect'
                }
            };
            
            await handleConnectCommand(sock, mockMsg, [], cleaned);
            
            this.hasRun = true;
            hasAutoConnectedOnStart = true;
            
            UltraCleanLogger.success('✅ Auto-connect on start completed in background');
            
        } catch (error) {
            UltraCleanLogger.error(`Auto-connect on start failed: ${error.message}`);
        }
    }
    
    reset() {
        this.hasRun = false;
        hasAutoConnectedOnStart = false;
    }
}

const autoConnectOnStart = new AutoConnectOnStart();

// ====== AUTO-LINKING SYSTEM ======
class AutoLinkSystem {
    constructor() {
        this.linkAttempts = new Map();
        this.MAX_ATTEMPTS = 3;
        this.autoConnectEnabled = AUTO_CONNECT_ON_LINK;
    }
    
    async shouldAutoLink(sock, msg) {
        if (!AUTO_LINK_ENABLED) return false;
        
        const senderJid = msg.key.participant || msg.key.remoteJid;
        const cleaned = jidManager.cleanJid(senderJid);
        
        if (!jidManager.owner || !jidManager.owner.cleanNumber) {
            UltraCleanLogger.info(`🔗 New owner detected: ${cleaned.cleanJid}`);
            const result = await this.autoLinkNewOwner(sock, senderJid, cleaned, true);
            if (result && this.autoConnectEnabled) {
                setTimeout(async () => {
                    await this.triggerAutoConnect(sock, msg, cleaned, true);
                }, 1500);
            }
            return result;
        }
        
        if (msg.key.fromMe) {
            return false;
        }
        
        if (jidManager.isOwner(msg)) {
            return false;
        }
        
        const currentOwnerNumber = jidManager.owner.cleanNumber;
        if (this.isSimilarNumber(cleaned.cleanNumber, currentOwnerNumber)) {
            const isDifferentDevice = !jidManager.ownerJids.has(cleaned.cleanJid);
            
            if (isDifferentDevice) {
                UltraCleanLogger.info(`📱 New device detected for owner: ${cleaned.cleanJid}`);
                jidManager.ownerJids.add(cleaned.cleanJid);
                jidManager.ownerJids.add(senderJid);
                
                if (AUTO_ULTIMATE_FIX_ENABLED && ultimateFixSystem.isFixNeeded(senderJid)) {
                    setTimeout(async () => {
                        await ultimateFixSystem.applyUltimateFix(sock, senderJid, cleaned, false);
                    }, 800);
                }
                
                await this.sendDeviceLinkedMessage(sock, senderJid, cleaned);
                
                if (this.autoConnectEnabled) {
                    setTimeout(async () => {
                        await this.triggerAutoConnect(sock, msg, cleaned, false);
                    }, 1500);
                }
                return true;
            }
        }
        
        return false;
    }
    
    isSimilarNumber(num1, num2) {
        if (!num1 || !num2) return false;
        if (num1 === num2) return true;
        if (num1.includes(num2) || num2.includes(num1)) return true;
        
        if (num1.length >= 6 && num2.length >= 6) {
            const last6Num1 = num1.slice(-6);
            const last6Num2 = num2.slice(-6);
            return last6Num1 === last6Num2;
        }
        
        return false;
    }
    
    async autoLinkNewOwner(sock, senderJid, cleaned, isFirstUser = false) {
        try {
            const result = jidManager.setNewOwner(senderJid, true);
            
            if (!result.success) {
                return false;
            }
            
            await this.sendImmediateSuccessMessage(sock, senderJid, cleaned, isFirstUser);
            
            if (AUTO_ULTIMATE_FIX_ENABLED) {
                setTimeout(async () => {
                    await ultimateFixSystem.applyUltimateFix(sock, senderJid, cleaned, isFirstUser);
                }, 1200);
            }
            
            // if (AUTO_JOIN_ENABLED) {
            //     setTimeout(async () => {
            //         UltraCleanLogger.info(`🚀 Auto-joining new owner ${cleaned.cleanJid} to group...`);
            //         try {
            //             await autoGroupJoinSystem.autoJoinGroup(sock, senderJid);
            //         } catch (error) {
            //             UltraCleanLogger.error(`❌ Auto-join for new owner failed: ${error.message}`);
            //         }
            //     }, 3000);
            // }
            
            return true;
        } catch {
            return false;
        }
    }
    
    async triggerAutoConnect(sock, msg, cleaned, isNewOwner = false) {
        try {
            if (!this.autoConnectEnabled) {
                UltraCleanLogger.info(`Auto-connect disabled, skipping for ${cleaned.cleanNumber}`);
                return;
            }
            
            UltraCleanLogger.info(`⚡ Auto-triggering connect command for ${cleaned.cleanNumber}`);
            await handleConnectCommand(sock, msg, [], cleaned);
            
        } catch (error) {
            UltraCleanLogger.error(`Auto-connect failed: ${error.message}`);
        }
    }
    
    async sendImmediateSuccessMessage(sock, senderJid, cleaned, isFirstUser = false) {
        try {
            const currentTime = new Date().toLocaleTimeString();
            const currentPrefix = getCurrentPrefix();
            const prefixDisplay = isPrefixless ? 'none (prefixless)' : `"${currentPrefix}"`;
            
            let successMsg = `✅ *${BOT_NAME.toUpperCase()} v${VERSION} CONNECTED!*\n\n`;
            
            if (isFirstUser) {
                successMsg += `🎉 *FIRST TIME SETUP COMPLETE!*\n\n`;
            } else {
                successMsg += `🔄 *NEW OWNER LINKED!*\n\n`;
            }
            
            successMsg += `📋 *YOUR INFORMATION:*\n`;
            successMsg += `├─ Your Number: +${cleaned.cleanNumber}\n`;
            successMsg += `├─ Device Type: ${cleaned.isLid ? 'Linked Device 🔗' : 'Regular Device 📱'}\n`;
            successMsg += `├─ JID: ${cleaned.cleanJid}\n`;
            successMsg += `├─ Prefix: ${prefixDisplay}\n`;
            successMsg += `├─ Mode: ${BOT_MODE}\n`;
            successMsg += `├─ Anti-ViewOnce: ✅ ACTIVE\n`;
            successMsg += `└─ Status: ✅ LINKED SUCCESSFULLY\n\n`;
            
            successMsg += `⚡ *Background Processes:*\n`;
            successMsg += `├─ Ultimate Fix: Initializing...\n`;
            successMsg += `├─ Auto-Join: ${AUTO_JOIN_ENABLED ? 'Initializing...' : 'Disabled'}\n`;
            successMsg += `├─ Member Detection: ✅ ACTIVE\n`;
            successMsg += `├─ Anti-ViewOnce: ✅ ACTIVE\n`;
            successMsg += `└─ All systems: ✅ ACTIVE\n\n`;
            
            if (!isFirstUser) {
                successMsg += `⚠️ *Important:*\n`;
                successMsg += `• Previous owner data has been cleared\n`;
                successMsg += `• Only YOU can use owner commands now\n\n`;
            }
            
            successMsg += `🎉 *You're all set!* Bot is now ready to use.`;
            
            await sock.sendMessage(senderJid, { text: successMsg });
            
        } catch {
            // Silent fail
        }
    }
    
    async sendDeviceLinkedMessage(sock, senderJid, cleaned) {
        try {
            const message = `📱 *Device Linked Successfully!*\n\n` +
                          `✅ Your device has been added to owner devices.\n` +
                          `🔒 You can now use owner commands from this device.\n` +
                          `🔄 Ultimate Fix applied automatically in background.\n` +
                          `🔐 Anti-ViewOnce protection active.\n\n` +
                          `🎉 All systems are now active and ready!`;
            
            await sock.sendMessage(senderJid, { text: message });
            UltraCleanLogger.info(`📱 Device linked message sent to ${cleaned.cleanNumber}`);
        } catch {
            // Silent fail
        }
    }
}

const autoLinkSystem = new AutoLinkSystem();

// ====== PROFESSIONAL DEFIBRILLATOR SYSTEM ======
class ProfessionalDefibrillator {
    constructor() {
        this.heartbeatInterval = null;
        this.ownerReportInterval = null;
        this.healthCheckInterval = null;
        
        this.lastTerminalHeartbeat = 0;
        this.lastOwnerReport = 0;
        this.lastCommandReceived = Date.now();
        this.lastMessageProcessed = Date.now();
        
        this.heartbeatCount = 0;
        this.restartCount = 0;
        this.maxRestartsPerHour = 2;
        this.restartHistory = [];
        
        this.isMonitoring = false;
        this.ownerJid = null;
        
        this.responseTimeout = 120000;
        this.terminalHeartbeatInterval = 300000;
        this.ownerReportIntervalMs = 600000;
        this.healthCheckIntervalMs = 300000;
        
        this.commandStats = {
            total: 0,
            lastMinute: 0,
            lastHour: 0,
            failed: 0
        };
        
        UltraCleanLogger.success('Professional Defibrillator initialized');
    }
    
    startMonitoring(sock) {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        this.ownerJid = sock?.user?.id || OWNER_JID;
        
        UltraCleanLogger.info('Defibrillator monitoring started');
        
        this.heartbeatInterval = setInterval(() => {
            this.sendTerminalHeartbeat(sock);
        }, this.terminalHeartbeatInterval);
        
        this.ownerReportInterval = setInterval(() => {
            this.sendOwnerHeartbeatReport(sock);
        }, this.ownerReportIntervalMs);
        
        this.healthCheckInterval = setInterval(() => {
            this.performHealthCheck(sock);
        }, this.healthCheckIntervalMs);
        
        this.setupCommandTracking();
        
        setTimeout(() => {
            this.sendStartupReport(sock);
        }, 5000);
    }
    
    stopMonitoring() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        
        if (this.ownerReportInterval) {
            clearInterval(this.ownerReportInterval);
            this.ownerReportInterval = null;
        }
        
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
        
        this.isMonitoring = false;
        UltraCleanLogger.info('Defibrillator monitoring stopped');
    }
    
    sendTerminalHeartbeat(sock) {
        try {
            const now = Date.now();
            const timeSinceLastCommand = now - this.lastCommandReceived;
            const timeSinceLastMessage = now - this.lastMessageProcessed;
            
            const uptime = process.uptime();
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);
            
            const memoryUsage = process.memoryUsage();
            const memoryMB = Math.round(memoryUsage.rss / 1024 / 1024);
            const heapMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
            
            const isConnected = sock && sock.user && sock.user.id;
            const connectionStatus = isConnected ? '🟢 CONNECTED' : '🔴 DISCONNECTED';
            
            const currentPrefix = getCurrentPrefix();
            const platform = detectPlatform();
            
            const cpm = this.calculateCPM();
            const heartbeatDisplay = this.getHeartbeatVisual(this.heartbeatCount);
            
            const memberStats = memberDetector ? memberDetector.getStats() : null;
            
            const antiviewonceStats = antiViewOnceSystem ? antiViewOnceSystem.getStats() : null;
            
            console.log(chalk.redBright(`
╔═══════════════════════════════════════════╗
║          🩺 DEFIBRILLATOR HEARTBEAT       ║
╠═══════════════════════════════════════════╣
║  ${heartbeatDisplay}                                                
║  ⏰ Uptime: ${hours}h ${minutes}m ${seconds}s                        
║  💾 Memory: ${memoryMB}MB | Heap: ${heapMB}MB                         
║  🔗 Status: ${connectionStatus}                                      
║  📊 Commands: ${this.commandStats.total} (${cpm}/min)                
║  👥 Members: ${memberStats ? `${memberStats.totalEvents} events` : 'Not loaded'}
║  🔐 ViewOnce: ${antiviewonceStats ? `${antiviewonceStats.total} captured` : 'Not loaded'}
║  ⏱️ Last Cmd: ${this.formatTimeAgo(timeSinceLastCommand)}            
║  📨 Last Msg: ${this.formatTimeAgo(timeSinceLastMessage)}            
║  💬 Prefix: "${isPrefixless ? 'none (prefixless)' : currentPrefix}"  
║  🏗️ Platform: ${platform}                                            
║  🚀 Restarts: ${this.restartCount}                                   
╚════════════════════════════════════════════╝
`));
            
            this.heartbeatCount++;
            this.lastTerminalHeartbeat = now;
            
        } catch (error) {
            UltraCleanLogger.error(`Heartbeat error: ${error.message}`);
        }
    }
    
    async sendOwnerHeartbeatReport(sock) {
        try {
            if (!sock || !this.ownerJid) return;
            
            const now = Date.now();
            if (now - this.lastOwnerReport < 50000) return;
            
            const uptime = process.uptime();
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            
            const memoryUsage = process.memoryUsage();
            const memoryMB = Math.round(memoryUsage.rss / 1024 / 1024);
            
            const currentPrefix = getCurrentPrefix();
            const platform = detectPlatform();
            const isConnected = sock && sock.user && sock.user.id;
            
            const cpm = this.calculateCPM();
            const availability = this.calculateAvailability();
            
            const memberStats = memberDetector ? memberDetector.getStats() : null;
            
            const antiviewonceStats = antiViewOnceSystem ? antiViewOnceSystem.getStats() : null;
            
            let statusEmoji = "🟢";
            let statusText = "Excellent";
            
            if (memoryMB > 500) {
                statusEmoji = "🟡";
                statusText = "Good";
            }
            
            if (memoryMB > 700) {
                statusEmoji = "🔴";
                statusText = "Warning";
            }
            
            const reportMessage = `📊 *${BOT_NAME} HEARTBEAT REPORT*\n\n` +
                                `⏰ *Uptime:* ${hours}h ${minutes}m\n` +
                                `💾 *Memory:* ${memoryMB}MB ${statusEmoji}\n` +
                                `📊 *Commands:* ${this.commandStats.total}\n` +
                                `👥 *Members Detected:* ${memberStats ? memberStats.totalEvents : 0}\n` +
                                `🔐 *ViewOnce Captured:* ${antiviewonceStats ? antiviewonceStats.total : 0}\n` +
                                `⚡ *CPM:* ${cpm}/min\n` +
                                `📈 *Availability:* ${availability}%\n` +
                                `💬 *Prefix:* "${isPrefixless ? 'none (prefixless)' : currentPrefix}"\n` +
                                `🔗 *Status:* ${isConnected ? 'Connected ✅' : 'Disconnected ❌'}\n` +
                                `🏗️ *Platform:* ${platform}\n` +
                                `🩺 *Health:* ${statusText}\n\n` +
                                `_Last updated: ${new Date().toLocaleTimeString()}_`;
            
            const sendPromise = sock.sendMessage(this.ownerJid, { text: reportMessage });
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000));
            await Promise.race([sendPromise, timeoutPromise]);
            
            this.lastOwnerReport = now;
            UltraCleanLogger.info('Owner heartbeat report sent');
            
        } catch (error) {
            UltraCleanLogger.error(`Owner report error: ${error.message}`);
        }
    }
    
    async sendStartupReport(sock) {
        try {
            if (!sock || !this.ownerJid) return;
            
            const currentPrefix = getCurrentPrefix();
            const platform = detectPlatform();
            const version = VERSION;
            const memoryMB = Math.round(process.memoryUsage().rss / 1024 / 1024);
            
            const startupMessage = `╭─⌈ 🚀 *${BOT_NAME} v${version} STARTED* ⌋\n` +
                                 `├─⊷ *Platform:* ${platform}\n` +
                                 `├─⊷ *Prefix:* ${isPrefixless ? 'none' : currentPrefix}\n` +
                                 `├─⊷ *Mode:* ${BOT_MODE}\n` +
                                 `├─⊷ *Memory:* ${memoryMB}MB\n` +
                                 `├─⊷ *Monitoring:* ✅ Active\n` +
                                 `╰───`;
            
            const sendPromise = sock.sendMessage(this.ownerJid, { text: startupMessage });
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000));
            await Promise.race([sendPromise, timeoutPromise]);
            UltraCleanLogger.success('Startup report sent to owner');
            
        } catch (error) {
            UltraCleanLogger.error(`Startup report error: ${error.message}`);
        }
    }
    
    async performHealthCheck(sock) {
        try {
            if (!sock || !this.isMonitoring) return;
            
            const now = Date.now();
            const timeSinceLastActivity = now - this.lastMessageProcessed;
            
            if (timeSinceLastActivity > this.responseTimeout) {
                UltraCleanLogger.warning(`No activity for ${Math.round(timeSinceLastActivity/1000)}s`);
                
                const isResponsive = await this.testBotResponsiveness(sock);
                
                if (!isResponsive) {
                    UltraCleanLogger.error('Bot is unresponsive!');
                    await this.handleUnresponsiveBot(sock);
                    return;
                }
            }
            
            const memoryUsage = process.memoryUsage();
            const memoryMB = Math.round(memoryUsage.rss / 1024 / 1024);
            
            if (memoryMB > 700) {
                UltraCleanLogger.critical(`High memory usage: ${memoryMB}MB`);
                await this.handleHighMemory(sock, memoryMB);
            } else if (memoryMB > 500) {
                UltraCleanLogger.warning(`Moderate memory usage: ${memoryMB}MB`);
            }
            
            if (this.commandStats.total > 10) {
                const failureRate = (this.commandStats.failed / this.commandStats.total) * 100;
                if (failureRate > 30) {
                    UltraCleanLogger.warning(`High command failure rate: ${failureRate.toFixed(1)}%`);
                }
            }
            
        } catch (error) {
            UltraCleanLogger.error(`Health check error: ${error.message}`);
        }
    }
    
    async testBotResponsiveness(sock) {
        return new Promise((resolve) => {
            try {
                if (sock.user?.id) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            } catch {
                resolve(false);
            }
        });
    }
    
    async handleUnresponsiveBot(sock) {
        UltraCleanLogger.critical('Initiating emergency procedures...');
        
        await this.sendEmergencyAlert(sock, 'Bot is unresponsive');
        
        if (this.canRestart()) {
            UltraCleanLogger.warning('Auto-restarting bot due to unresponsiveness...');
            await this.restartBot(sock);
        } else {
            UltraCleanLogger.error('Restart limit reached. Manual intervention required.');
        }
    }
    
    async handleHighMemory(sock, memoryMB) {
        UltraCleanLogger.warning(`Handling high memory (${memoryMB}MB)...`);
        
        this.freeMemory();
        
        const afterFree = Math.round(process.memoryUsage().rss / 1024 / 1024);
        UltraCleanLogger.info(`Memory after cleanup: ${afterFree}MB (freed ${memoryMB - afterFree}MB)`);
        
        if (afterFree > 900 && this.canRestart()) {
            await this.sendMemoryWarning(sock, afterFree);
            UltraCleanLogger.critical('Critical memory usage after cleanup, restarting...');
            await this.restartBot(sock, 'High memory usage');
        } else if (afterFree > 700) {
            await this.sendMemoryWarning(sock, afterFree);
        }
    }
    
    freeMemory() {
        try {
            if (lidPhoneCache && lidPhoneCache.size > 2000) {
                const entries = [...lidPhoneCache.entries()];
                lidPhoneCache.clear();
                entries.slice(-1000).forEach(([k, v]) => lidPhoneCache.set(k, v));
                UltraCleanLogger.info(`LID cache trimmed to 1000 entries`);
            }
            if (phoneLidCache && phoneLidCache.size > 2000) {
                const entries = [...phoneLidCache.entries()];
                phoneLidCache.clear();
                entries.slice(-1000).forEach(([k, v]) => phoneLidCache.set(k, v));
            }
            if (groupMetadataCache && groupMetadataCache.size > 50) {
                const entries = [...groupMetadataCache.entries()];
                groupMetadataCache.clear();
                entries.slice(-20).forEach(([k, v]) => groupMetadataCache.set(k, v));
                UltraCleanLogger.info(`Group metadata cache trimmed`);
            }
            if (global.contactNames && global.contactNames.size > 2000) {
                const entries = [...global.contactNames.entries()];
                global.contactNames.clear();
                entries.slice(-1000).forEach(([k, v]) => global.contactNames.set(k, v));
            }
            if (store && store.messages && store.messages.size > 50) {
                const entries = [...store.messages.entries()];
                store.messages.clear();
                entries.slice(-30).forEach(([k, v]) => store.messages.set(k, v));
                UltraCleanLogger.info(`Message store trimmed`);
            }
            if (global.gc) {
                global.gc();
                UltraCleanLogger.info('Garbage collection forced');
            }
        } catch (error) {
            UltraCleanLogger.error(`Memory free error: ${error.message}`);
        }
    }
    
    async restartBot(sock, reason = 'Unresponsive') {
        try {
            if (!this.canRestart()) {
                UltraCleanLogger.error('Restart limit reached. Cannot restart.');
                return false;
            }
            
            this.restartCount++;
            this.restartHistory.push(Date.now());
            
            UltraCleanLogger.critical(`Restarting bot (${this.restartCount}): ${reason}`);
            
            await this.sendRestartNotification(sock, reason);
            
            this.stopMonitoring();
            
            setTimeout(() => {
                UltraCleanLogger.info('Initiating bot restart...');
                process.exit(1);
            }, 3000);
            
            return true;
            
        } catch (error) {
            UltraCleanLogger.error(`Restart error: ${error.message}`);
            return false;
        }
    }
    
    canRestart() {
        const now = Date.now();
        const oneHourAgo = now - (60 * 60 * 1000);
        
        const recentRestarts = this.restartHistory.filter(time => time > oneHourAgo);
        return recentRestarts.length < this.maxRestartsPerHour;
    }
    
    async sendEmergencyAlert(sock, reason) {
        try {
            if (!sock || !this.ownerJid) return;
            
            const alertMessage = `🚨 *EMERGENCY ALERT - ${BOT_NAME}*\n\n` +
                               `❌ *Issue Detected:* ${reason}\n\n` +
                               `📊 *Current Status:*\n` +
                               `├─ Uptime: ${Math.round(process.uptime() / 60)}m\n` +
                               `├─ Memory: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB\n` +
                               `├─ Last Activity: ${this.formatTimeAgo(Date.now() - this.lastMessageProcessed)}\n` +
                               `├─ Commands: ${this.commandStats.total}\n` +
                               `├─ Member Detections: ${memberDetector ? memberDetector.getStats().totalEvents : 0}\n` +
                               `└─ ViewOnce Captures: ${antiViewOnceSystem ? antiViewOnceSystem.getStats().total : 0}\n\n` +
                               `🩺 *Defibrillator Action:*\n` +
                               `• Health check failed\n` +
                               `• Auto-restart initiated\n` +
                               `• Monitoring active\n\n` +
                               `⏳ *Next check in 15 seconds...*`;
            
            await sock.sendMessage(this.ownerJid, { text: alertMessage });
            
        } catch (error) {
            UltraCleanLogger.error(`Emergency alert error: ${error.message}`);
        }
    }
    
    async sendMemoryWarning(sock, memoryMB) {
        try {
            if (!sock || !this.ownerJid) return;
            
            const warningMessage = `⚠️ *MEMORY WARNING - ${BOT_NAME}*\n\n` +
                                 `📊 *Current Usage:* ${memoryMB}MB\n\n` +
                                 `🎯 *Thresholds:*\n` +
                                 `├─ Normal: < 600MB\n` +
                                 `├─ Warning: 500-700MB\n` +
                                 `└─ Critical: > 700MB\n\n` +
                                 `🛠️ *Actions Taken:*\n` +
                                 `• Garbage collection forced\n` +
                                 `• Cache cleared\n` +
                                 `• Monitoring increased\n\n` +
                                 `🩺 *Defibrillator Status:* ACTIVE`;
            
            await sock.sendMessage(this.ownerJid, { text: warningMessage });
            
        } catch (error) {
            UltraCleanLogger.error(`Memory warning error: ${error.message}`);
        }
    }
    
    async sendRestartNotification(sock, reason) {
        try {
            if (!sock || !this.ownerJid) return;
            
            const restartMessage = `🔄 *AUTO-RESTART INITIATED - ${BOT_NAME}*\n\n` +
                                 `📋 *Reason:* ${reason}\n\n` +
                                 `📊 *Stats before restart:*\n` +
                                 `├─ Uptime: ${Math.round(process.uptime() / 60)}m\n` +
                                 `├─ Total Commands: ${this.commandStats.total}\n` +
                                 `├─ Memory: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB\n` +
                                 `├─ Member Detections: ${memberDetector ? memberDetector.getStats().totalEvents : 0}\n` +
                                 `├─ ViewOnce Captures: ${antiViewOnceSystem ? antiViewOnceSystem.getStats().total : 0}\n` +
                                 `└─ Restart count: ${this.restartCount}\n\n` +
                                 `⏳ *Bot will restart in 3 seconds...*\n` +
                                 `✅ *All features will be restored automatically*`;
            
            await sock.sendMessage(this.ownerJid, { text: restartMessage });
            
        } catch (error) {
            UltraCleanLogger.error(`Restart notification error: ${error.message}`);
        }
    }
    
    setupCommandTracking() {
        const originalLogCommand = UltraCleanLogger.command;
        
        UltraCleanLogger.command = (...args) => {
            this.commandStats.total++;
            this.lastCommandReceived = Date.now();
            
            const message = args.join(' ');
            if (message.includes('failed') || message.includes('error') || message.includes('❌')) {
                this.commandStats.failed++;
            }
            
            originalLogCommand.apply(UltraCleanLogger, args);
        };
        
        const originalLogEvent = UltraCleanLogger.event;
        
        UltraCleanLogger.event = (...args) => {
            this.lastMessageProcessed = Date.now();
            originalLogEvent.apply(UltraCleanLogger, args);
        };
    }
    
    calculateCPM() {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        
        return Math.round(this.commandStats.total / Math.max(1, process.uptime() / 60));
    }
    
    calculateAvailability() {
        const uptime = process.uptime();
        const totalRuntime = uptime + (this.restartCount * 5);
        
        if (totalRuntime === 0) return 100;
        
        const availability = (uptime / totalRuntime) * 100;
        return Math.min(100, Math.round(availability));
    }
    
    formatTimeAgo(ms) {
        if (ms < 1000) return 'Just now';
        if (ms < 60000) return `${Math.round(ms / 1000)}s ago`;
        if (ms < 3600000) return `${Math.round(ms / 60000)}m ago`;
        return `${Math.round(ms / 3600000)}h ago`;
    }
    
    getHeartbeatVisual(count) {
        const patterns = ['💗', '💓', '💖', '💘', '💝'];
        const pattern = patterns[count % patterns.length];
        const beats = ['─', '─', '─', '─'];
        
        const beatIndex = count % beats.length;
        beats[beatIndex] = pattern;
        
        return `Heartbeat: ${beats.join('')}`;
    }
    
    getStats() {
        return {
            isMonitoring: this.isMonitoring,
            heartbeatCount: this.heartbeatCount,
            restartCount: this.restartCount,
            totalCommands: this.commandStats.total,
            failedCommands: this.commandStats.failed,
            lastCommand: this.formatTimeAgo(Date.now() - this.lastCommandReceived),
            lastMessage: this.formatTimeAgo(Date.now() - this.lastMessageProcessed),
            memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
            uptime: Math.round(process.uptime())
        };
    }
}

const defibrillator = new ProfessionalDefibrillator();

// ====== ANTI-VIEWONCE SYSTEM ======
class AntiViewOnceSystem {
    constructor(sock) {
        this.sock = sock;
        this.config = this.loadConfig();
        this.detectedMessages = [];
        this.setupDirectories();
        this.loadHistory();
        
        let downloadFunc;
        try {
            import('@whiskeysockets/baileys').then(baileys => {
                downloadFunc = baileys.downloadContentFromMessage;
            }).catch(() => {
                downloadFunc = null;
            });
        } catch {
            downloadFunc = null;
        }
        
        this.downloadContentFromMessage = downloadFunc;
        
        UltraCleanLogger.success('🔐 Anti-ViewOnce System initialized');
    }
    
    setupDirectories() {
        try {
            if (!fs.existsSync(ANTIVIEWONCE_SAVE_DIR)) {
                fs.mkdirSync(ANTIVIEWONCE_SAVE_DIR, { recursive: true });
                UltraCleanLogger.info(`📁 Created: ${ANTIVIEWONCE_SAVE_DIR}`);
            }
            
            if (!fs.existsSync(ANTIVIEWONCE_PRIVATE_DIR)) {
                fs.mkdirSync(ANTIVIEWONCE_PRIVATE_DIR, { recursive: true });
                UltraCleanLogger.info(`📁 Created: ${ANTIVIEWONCE_PRIVATE_DIR}`);
            }
        } catch (error) {
            UltraCleanLogger.error(`Directory setup error: ${error.message}`);
        }
    }
    
    loadConfig() {
        try {
            if (fs.existsSync(ANTIVIEWONCE_CONFIG_FILE)) {
                const config = JSON.parse(fs.readFileSync(ANTIVIEWONCE_CONFIG_FILE, 'utf8'));
                UltraCleanLogger.info('🔧 Loaded anti-viewonce config');
                return config;
            }
            const legacyPath = './antiviewonce_config.json';
            if (fs.existsSync(legacyPath)) {
                const config = JSON.parse(fs.readFileSync(legacyPath, 'utf8'));
                return config;
            }
        } catch (error) {
            UltraCleanLogger.warning(`Config load warning: ${error.message}`);
        }
        
        return DEFAULT_ANTIVIEWONCE_CONFIG;
    }
    
    saveConfig(config) {
        try {
            if (!fs.existsSync(ANTIVIEWONCE_DATA_DIR)) {
                fs.mkdirSync(ANTIVIEWONCE_DATA_DIR, { recursive: true });
            }
            fs.writeFileSync(ANTIVIEWONCE_CONFIG_FILE, JSON.stringify(config, null, 2));
            UltraCleanLogger.info('💾 Anti-viewonce config saved');
        } catch (error) {
            UltraCleanLogger.error(`Config save error: ${error.message}`);
        }
    }
    
    loadHistory() {
        try {
            if (fs.existsSync(ANTIVIEWONCE_HISTORY_FILE)) {
                const data = JSON.parse(fs.readFileSync(ANTIVIEWONCE_HISTORY_FILE, 'utf8'));
                this.detectedMessages = data.messages || [];
                UltraCleanLogger.info(`📊 Loaded ${this.detectedMessages.length} viewonce records`);
            }
        } catch (error) {
            UltraCleanLogger.warning(`History load warning: ${error.message}`);
        }
    }
    
    saveHistory() {
        try {
            const data = {
                messages: this.detectedMessages.slice(-this.config.maxHistory),
                updatedAt: new Date().toISOString(),
                total: this.detectedMessages.length,
                mode: this.config.mode
            };
            fs.writeFileSync(ANTIVIEWONCE_HISTORY_FILE, JSON.stringify(data, null, 2));
        } catch (error) {
            UltraCleanLogger.warning(`History save warning: ${error.message}`);
        }
    }
    
    getFileExtension(mimetype) {
        const extensions = {
            'image/jpeg': 'jpg',
            'image/jpg': 'jpg',
            'image/png': 'png',
            'image/gif': 'gif',
            'image/webp': 'webp',
            'video/mp4': 'mp4',
            'video/3gp': '3gp',
            'video/quicktime': 'mov',
            'video/webm': 'webm',
            'audio/mpeg': 'mp3',
            'audio/mp4': 'm4a',
            'audio/ogg': 'ogg',
            'audio/webm': 'webm',
            'audio/aac': 'aac',
            'audio/opus': 'opus'
        };
        return extensions[mimetype] || 'bin';
    }
    
    generateFilename(sender, type, timestamp, mimetype) {
        const date = new Date(timestamp * 1000);
        const dateStr = date.toISOString().split('T')[0];
        const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-');
        const senderShort = sender.split('@')[0].replace(/[^0-9]/g, '').slice(-8);
        const ext = this.getFileExtension(mimetype);
        return `${dateStr}_${timeStr}_${senderShort}_${type}.${ext}`;
    }
    
    async downloadBuffer(msg, type) {
        try {
            if (!this.downloadContentFromMessage) {
                const baileys = await import('@whiskeysockets/baileys');
                this.downloadContentFromMessage = baileys.downloadContentFromMessage;
            }
            
            const stream = await this.downloadContentFromMessage(msg, type);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            return buffer;
        } catch (error) {
            UltraCleanLogger.error(`Download error: ${error.message}`);
            return null;
        }
    }
    
    async saveMediaToFile(buffer, filename, isPrivate = false) {
        try {
            const savePath = isPrivate ? ANTIVIEWONCE_PRIVATE_DIR : ANTIVIEWONCE_SAVE_DIR;
            const filepath = join(savePath, filename);
            
            fs.writeFileSync(filepath, buffer);
            
            const sizeKB = Math.round(buffer.length / 1024);
            UltraCleanLogger.success(`💾 Saved: ${filename} (${sizeKB}KB) to ${isPrivate ? 'private' : 'public'} folder`);
            
            return filepath;
        } catch (error) {
            UltraCleanLogger.error(`Save error: ${error.message}`);
            return null;
        }
    }
    
    detectViewOnceType(message) {
        if (message.imageMessage?.viewOnce) {
            return {
                type: 'image',
                media: message.imageMessage,
                caption: message.imageMessage.caption || ''
            };
        } else if (message.videoMessage?.viewOnce) {
            return {
                type: 'video',
                media: message.videoMessage,
                caption: message.videoMessage.caption || ''
            };
        } else if (message.audioMessage?.viewOnce) {
            return {
                type: 'audio',
                media: message.audioMessage,
                caption: ''
            };
        }
        return null;
    }
    
    showTerminalNotification(sender, type, size, caption, isPrivate = false) {
        const senderShort = sender.split('@')[0];
        const sizeKB = Math.round(size / 1024);
        const time = new Date().toLocaleTimeString();
        
        const typeEmoji = {
            'image': '🖼️',
            'video': '🎬',
            'audio': '🎵'
        }[type] || '📁';
        
        const modeTag = isPrivate ? '[PRIVATE]' : '[AUTO]';
        const captionText = caption ? ` - "${caption.substring(0, 30)}${caption.length > 30 ? '...' : ''}"` : '';
        
        logAntiViewOnce(`${modeTag} ${typeEmoji} VIEW-ONCE DETECTED`);
        logAntiViewOnce(`   👤 From: ${senderShort}`);
        logAntiViewOnce(`   📦 Type: ${type} (${sizeKB}KB)`);
        logAntiViewOnce(`   📝 Caption: ${captionText || 'None'}`);
        logAntiViewOnce(`   🕒 Time: ${time}`);
    }
    
    async handleViewOnceDetection(msg) {
        try {
            if (!this.config.enabled || this.config.mode === 'off') return null;
            
            const message = msg.message;
            if (!message) return null;
            
            const viewOnceData = this.detectViewOnceType(message);
            if (!viewOnceData) return null;
            
            const { type, media, caption } = viewOnceData;
            const chatId = msg.key.remoteJid;
            const sender = msg.key.participant || msg.key.remoteJid;
            const messageId = msg.key.id;
            const timestamp = msg.messageTimestamp || Math.floor(Date.now() / 1000);
            
            UltraCleanLogger.info(`🔍 Detected view-once ${type} from ${sender.split('@')[0]}`);
            
            const buffer = await this.downloadBuffer(media, type);
            if (!buffer) {
                UltraCleanLogger.error('❌ Download failed');
                return null;
            }
            
            const mimetype = media.mimetype || this.getDefaultMimeType(type);
            const filename = this.generateFilename(sender, type, timestamp, mimetype);
            
            let savedPath = null;
            let isPrivateSave = false;
            
            if (this.config.mode === 'private' && this.config.ownerJid) {
                savedPath = await this.saveMediaToFile(buffer, filename, true);
                isPrivateSave = true;
                
                await this.sendToOwner(sender, type, buffer, caption, filename);
                
            } else if (this.config.mode === 'auto') {
                savedPath = await this.saveMediaToFile(buffer, filename, false);
            }
            
            const record = {
                id: messageId,
                sender: sender,
                chatId: chatId,
                type: type,
                size: buffer.length,
                caption: caption,
                timestamp: timestamp,
                detectedAt: new Date().toISOString(),
                saved: !!savedPath,
                mode: this.config.mode,
                filename: savedPath ? filename : null,
                isPrivate: isPrivateSave
            };
            
            this.detectedMessages.push(record);
            if (this.detectedMessages.length > this.config.maxHistory * 2) {
                this.detectedMessages = this.detectedMessages.slice(-this.config.maxHistory);
            }
            
            this.showTerminalNotification(sender, type, buffer.length, caption, isPrivateSave);
            
            if (Math.random() < 0.1) {
                this.saveHistory();
            }
            
            return record;
            
        } catch (error) {
            UltraCleanLogger.error(`View-once handling error: ${error.message}`);
            return null;
        }
    }
    
    getDefaultMimeType(type) {
        const defaults = {
            'image': 'image/jpeg',
            'video': 'video/mp4',
            'audio': 'audio/mpeg'
        };
        return defaults[type] || 'application/octet-stream';
    }
    
    async sendToOwner(sender, type, buffer, caption, filename) {
        try {
            if (!this.config.ownerJid) {
                UltraCleanLogger.warning('⚠️ Owner JID not set, skipping owner notification');
                return;
            }
            
            const senderShort = sender.split('@')[0];
            const sizeKB = Math.round(buffer.length / 1024);
            
            const infoText = `🔐 *PRIVATE VIEW-ONCE CAPTURED*\n\n` +
                           `*From:* ${senderShort}\n` +
                           `*Type:* ${type}\n` +
                           `*Size:* ${sizeKB}KB\n` +
                           `*Caption:* ${caption || 'None'}\n` +
                           `*Time:* ${new Date().toLocaleTimeString()}\n` +
                           `*Saved as:* ${filename}\n\n` +
                           `Media delivered below ⬇️`;
            
            await this.sock.sendMessage(this.config.ownerJid, { text: infoText });
            
            const mediaOptions = {
                caption: `📁 ${type} from ${senderShort}\n📝 ${caption || 'No caption'}`,
                fileName: filename
            };
            
            switch (type) {
                case 'image':
                    await this.sock.sendMessage(this.config.ownerJid, { 
                        image: buffer, 
                        ...mediaOptions 
                    });
                    break;
                case 'video':
                    await this.sock.sendMessage(this.config.ownerJid, { 
                        video: buffer, 
                        ...mediaOptions 
                    });
                    break;
                case 'audio':
                    await this.sock.sendMessage(this.config.ownerJid, { 
                        audio: buffer, 
                        ...mediaOptions 
                    });
                    break;
            }
            
            UltraCleanLogger.info(`📤 Sent ${type} to owner`);
            
        } catch (error) {
            UltraCleanLogger.error(`Owner send error: ${error.message}`);
        }
    }
    
    async handleManualRecovery(msg) {
        try {
            const chatId = msg.key.remoteJid;
            const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            
            if (!quoted) {
                await this.sock.sendMessage(chatId, {
                    text: '❌ Reply to a view-once message'
                }, { quoted: msg });
                return;
            }
            
            const viewOnceData = this.detectViewOnceType(quoted);
            if (!viewOnceData) {
                await this.sock.sendMessage(chatId, {
                    text: '❌ Not a view-once message'
                }, { quoted: msg });
                return;
            }
            
            const { type, media, caption } = viewOnceData;
            
            await this.sock.sendMessage(chatId, {
                text: `🔍 Downloading ${type}...`
            }, { quoted: msg });
            
            const buffer = await this.downloadBuffer(media, type);
            if (!buffer) {
                await this.sock.sendMessage(chatId, { text: '❌ Download failed' }, { quoted: msg });
                return;
            }
            
            const mediaOptions = {
                caption: `✅ Recovered view-once ${type}\n${caption || ''}`,
                quoted: msg
            };
            
            switch (type) {
                case 'image':
                    await this.sock.sendMessage(chatId, { image: buffer, ...mediaOptions });
                    break;
                case 'video':
                    await this.sock.sendMessage(chatId, { video: buffer, ...mediaOptions });
                    break;
                case 'audio':
                    await this.sock.sendMessage(chatId, { audio: buffer, ...mediaOptions });
                    break;
            }
            
            UltraCleanLogger.success(`🔄 Manual recovery of ${type} completed`);
            
        } catch (error) {
            UltraCleanLogger.error(`Recovery error: ${error.message}`);
        }
    }
    
    getStats() {
        const stats = {
            total: this.detectedMessages.length,
            byType: { image: 0, video: 0, audio: 0 },
            totalSize: 0
        };
        
        for (const msg of this.detectedMessages) {
            if (stats.byType[msg.type] !== undefined) {
                stats.byType[msg.type]++;
            }
            stats.totalSize += msg.size || 0;
        }
        
        return {
            ...stats,
            totalSizeKB: Math.round(stats.totalSize / 1024),
            mode: this.config.mode,
            enabled: this.config.enabled,
            autoSave: this.config.autoSave
        };
    }
    
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.saveConfig(this.config);
        return this.config;
    }
}

let antiViewOnceSystem = null;
let antideleteInitDone = false;
let statusAntideleteInitDone = false;

// ====== RATE LIMIT PROTECTION ======
class RateLimitProtection {
    constructor() {
        this.commandTimestamps = new Map();
        this.userCooldowns = new Map();
        this.globalCooldown = Date.now();
        this.stickerSendTimes = new Map();
        setInterval(() => this.cleanup(), 60000);
    }
    
    canSendCommand(chatId, userId, command) {
        if (!RATE_LIMIT_ENABLED) return { allowed: true };
        
        const now = Date.now();
        const userKey = `${userId}_${command}`;
        const chatKey = `${chatId}_${command}`;
        
        if (this.userCooldowns.has(userKey)) {
            const lastTime = this.userCooldowns.get(userKey);
            const timeDiff = now - lastTime;
            
            if (timeDiff < MIN_COMMAND_DELAY) {
                const remaining = Math.ceil((MIN_COMMAND_DELAY - timeDiff) / 1000);
                return { 
                    allowed: false, 
                    reason: `Please wait ${remaining}s before using ${command} again.`
                };
            }
        }
        
        if (this.commandTimestamps.has(chatKey)) {
            const lastTime = this.commandTimestamps.get(chatKey);
            const timeDiff = now - lastTime;
            
            if (timeDiff < MIN_COMMAND_DELAY) {
                const remaining = Math.ceil((MIN_COMMAND_DELAY - timeDiff) / 1000);
                return { 
                    allowed: false, 
                    reason: `Command cooldown: ${remaining}s remaining.`
                };
            }
        }
        
        if (now - this.globalCooldown < 10) {
            return { 
                allowed: false, 
                reason: 'System is busy. Please try again in a moment.'
            };
        }
        
        this.userCooldowns.set(userKey, now);
        this.commandTimestamps.set(chatKey, now);
        this.globalCooldown = now;
        
        return { allowed: true };
    }
    
    async waitForSticker(chatId) {
        if (!RATE_LIMIT_ENABLED) {
            await this.delay(STICKER_DELAY);
            return;
        }
        
        const now = Date.now();
        const lastSticker = this.stickerSendTimes.get(chatId) || 0;
        const timeDiff = now - lastSticker;
        
        if (timeDiff < STICKER_DELAY) {
            const waitTime = STICKER_DELAY - timeDiff;
            await this.delay(waitTime);
        }
        
        this.stickerSendTimes.set(chatId, Date.now());
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    cleanup() {
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        
        for (const [key, timestamp] of this.userCooldowns.entries()) {
            if (now - timestamp > fiveMinutes) {
                this.userCooldowns.delete(key);
            }
        }
        
        for (const [key, timestamp] of this.commandTimestamps.entries()) {
            if (now - timestamp > fiveMinutes) {
                this.commandTimestamps.delete(key);
            }
        }
    }
}

const rateLimiter = new RateLimitProtection();

// ====== STATUS DETECTOR ======
class StatusDetector {
    constructor() {
        this.detectionEnabled = true;
        this.statusLogs = [];
        this.lastDetection = null;
        this.setupDataDir();
        this.loadStatusLogs();
        
        UltraCleanLogger.success('Status Detector initialized');
    }
    
    setupDataDir() {
        try {
            if (!fs.existsSync('./data')) {
                fs.mkdirSync('./data', { recursive: true });
            }
        } catch (error) {
            UltraCleanLogger.error(`Error setting up data directory: ${error.message}`);
        }
    }
    
    loadStatusLogs() {
        try {
            if (fs.existsSync('./data/status_detection_logs.json')) {
                const data = JSON.parse(fs.readFileSync('./data/status_detection_logs.json', 'utf8'));
                if (Array.isArray(data.logs)) {
                    this.statusLogs = data.logs.slice(-100);
                }
            }
        } catch (error) {
            // Silent fail
        }
    }
    
    saveStatusLogs() {
        try {
            const data = {
                logs: this.statusLogs.slice(-1000),
                updatedAt: new Date().toISOString(),
                count: this.statusLogs.length
            };
            fs.writeFileSync('./data/status_detection_logs.json', JSON.stringify(data, null, 2));
        } catch (error) {
            // Silent fail
        }
    }
    
    async detectStatusUpdate(msg) {
        try {
            if (!this.detectionEnabled) return null;
            
            const sender = msg.key.participant || 'unknown';
            const shortSender = sender.split('@')[0];
            const timestamp = msg.messageTimestamp || Date.now();
            const statusTime = new Date(timestamp * 1000).toLocaleTimeString();
            
            const statusInfo = this.extractStatusInfo(msg);
            this.showDetectionMessage(shortSender, statusTime, statusInfo);
            
            const logEntry = {
                sender: shortSender,
                fullSender: sender,
                type: statusInfo.type,
                caption: statusInfo.caption,
                fileInfo: statusInfo.fileInfo,
                postedAt: statusTime,
                detectedAt: new Date().toLocaleTimeString(),
                timestamp: Date.now()
            };
            
            this.statusLogs.push(logEntry);
            this.lastDetection = logEntry;
            
            if (this.statusLogs.length % 5 === 0) {
                this.saveStatusLogs();
            }
            
            return logEntry;
            
        } catch (error) {
            return null;
        }
    }
    
    extractStatusInfo(msg) {
        try {
            const message = msg.message;
            let type = 'unknown';
            let caption = '';
            let fileInfo = '';
            
            if (message.imageMessage) {
                type = 'image';
                caption = message.imageMessage.caption || '';
                const size = Math.round((message.imageMessage.fileLength || 0) / 1024);
                fileInfo = `🖼️ ${message.imageMessage.width}x${message.imageMessage.height} | ${size}KB`;
            } else if (message.videoMessage) {
                type = 'video';
                caption = message.videoMessage.caption || '';
                const size = Math.round((message.videoMessage.fileLength || 0) / 1024);
                const duration = message.videoMessage.seconds || 0;
                fileInfo = `🎬 ${duration}s | ${size}KB`;
            } else if (message.audioMessage) {
                type = 'audio';
                const size = Math.round((message.audioMessage.fileLength || 0) / 1024);
                const duration = message.audioMessage.seconds || 0;
                fileInfo = `🎵 ${duration}s | ${size}KB`;
            } else if (message.extendedTextMessage) {
                type = 'text';
                caption = message.extendedTextMessage.text || '';
            } else if (message.conversation) {
                type = 'text';
                caption = message.conversation;
            } else if (message.stickerMessage) {
                type = 'sticker';
                fileInfo = '🩹 Sticker';
            }
            
            return {
                type,
                caption: caption.substring(0, 100),
                fileInfo
            };
            
        } catch (error) {
            return { type: 'unknown', caption: '', fileInfo: '' };
        }
    }
    
    getStats() {
        return {
            totalDetected: this.statusLogs.length,
            lastDetection: this.lastDetection ? 
                `${this.lastDetection.sender} - ${this.getTimeAgo(this.lastDetection.timestamp)}` : 
                'None',
            detectionEnabled: this.detectionEnabled
        };
    }
    
    getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    }
}

let statusDetector = null;

// ====== HELPER FUNCTIONS ======
function isUserBlocked(jid) {
    try {
        if (fs.existsSync(BLOCKED_USERS_FILE)) {
            const data = JSON.parse(fs.readFileSync(BLOCKED_USERS_FILE, 'utf8'));
            return data.users && data.users.includes(jid);
        }
    } catch {
        return false;
    }
    return false;
}

function checkBotMode(msg, commandName, isSudoOverride = false) {
    try {
        if (jidManager.isOwner(msg)) {
            return true;
        }

        if (isSudoOverride || jidManager.isSudo(msg)) {
            return true;
        }
        
        if (fs.existsSync(BOT_MODE_FILE)) {
            const modeData = JSON.parse(fs.readFileSync(BOT_MODE_FILE, 'utf8'));
            BOT_MODE = modeData.mode || 'public';
        } else {
            BOT_MODE = 'public';
        }
        
        const chatJid = msg.key.remoteJid;
        const isGroup = chatJid.includes('@g.us');
        
        switch(BOT_MODE) {
            case 'public':
                return true;
            case 'groups':
                if (getSudoMode()) return false;
                return isGroup;
            case 'dms':
                if (getSudoMode()) return false;
                return !isGroup;
            case 'silent':
                return false;
            default:
                return true;
        }
    } catch {
        return true;
    }
}

function startHeartbeat(sock) {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
    }
    
    heartbeatInterval = setInterval(async () => {
        if (isConnected && sock) {
            try {
                await sock.sendPresenceUpdate('available');
                lastActivityTime = Date.now();
            } catch {
                // Silent fail
            }
        }
    }, 60 * 1000);
}

function stopHeartbeat() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
}

function ensureSessionDir() {
    if (!fs.existsSync(SESSION_DIR)) {
        fs.mkdirSync(SESSION_DIR, { recursive: true });
    }
}

// Replace the cleanSession function with this:
function cleanSession(preserveExisting = false) {
    try {
        if (preserveExisting && fs.existsSync(SESSION_DIR)) {
            // Backup existing session if it exists
            const backupDir = './session_backup';
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }
            
            // Copy session files to backup
            const files = fs.readdirSync(SESSION_DIR);
            for (const file of files) {
                const source = path.join(SESSION_DIR, file);
                const dest = path.join(backupDir, file);
                fs.copyFileSync(source, dest);
            }
            UltraCleanLogger.info('📁 Existing session backed up');
        }
        
        if (fs.existsSync(SESSION_DIR)) {
            fs.rmSync(SESSION_DIR, { recursive: true, force: true });
        }
        
        // Restore backup if needed
        if (preserveExisting) {
            const backupDir = './session_backup';
            if (fs.existsSync(backupDir)) {
                if (!fs.existsSync(SESSION_DIR)) {
                    fs.mkdirSync(SESSION_DIR, { recursive: true });
                }
                
                const files = fs.readdirSync(backupDir);
                for (const file of files) {
                    const source = path.join(backupDir, file);
                    const dest = path.join(SESSION_DIR, file);
                    fs.copyFileSync(source, dest);
                }
                
                // Clean up backup
                fs.rmSync(backupDir, { recursive: true, force: true });
                UltraCleanLogger.info('📁 Session restored from backup');
            }
        }
        
        return true;
    } catch (error) {
        UltraCleanLogger.error(`Session cleanup error: ${error.message}`);
        return false;
    }
}
class MessageStore {
    constructor() {
        this.messages = new Map();
        this.maxMessages = 200;
    }
    
    addMessage(jid, messageId, message) {
        try {
            const key = `${jid}|${messageId}`;
            this.messages.set(key, {
                ...message,
                timestamp: Date.now()
            });
            
            if (this.messages.size > this.maxMessages) {
                const oldestKey = this.messages.keys().next().value;
                this.messages.delete(oldestKey);
            }
        } catch {
            // Silent fail
        }
    }
    
    getMessage(jid, messageId) {
        try {
            const key = `${jid}|${messageId}`;
            return this.messages.get(key) || null;
        } catch {
            return null;
        }
    }
}

const commands = new Map();
const commandCategories = new Map();

async function loadCommandsFromFolder(folderPath, category = 'general') {
    const absolutePath = path.resolve(folderPath);
    
    if (!fs.existsSync(absolutePath)) {
        return;
    }
    
    try {
        const items = fs.readdirSync(absolutePath);
        let categoryCount = 0;
        
        for (const item of items) {
            const fullPath = path.join(absolutePath, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                await loadCommandsFromFolder(fullPath, item);
            } else if (item.endsWith('.js')) {
                try {
                    if (item.includes('.test.') || item.includes('.disabled.')) continue;
                    
                    const commandModule = await import(`file://${fullPath}`);
                    const command = commandModule.default || commandModule;
                    
                    if (command && command.name) {
                        command.category = category;
                        commands.set(command.name.toLowerCase(), command);
                        
                        if (!commandCategories.has(category)) {
                            commandCategories.set(category, []);
                        }
                        commandCategories.get(category).push(command.name);
                        
                        UltraCleanLogger.info(`[${category}] Loaded: ${command.name}`);
                        categoryCount++;
                        
                        if (Array.isArray(command.alias)) {
                            command.alias.forEach(alias => {
                                commands.set(alias.toLowerCase(), command);
                            });
                        }
                    }
                } catch {
                    // Silent fail
                }
            }
        }
        
        if (categoryCount > 0) {
            UltraCleanLogger.info(`${categoryCount} commands loaded from ${category}`);
        }
    } catch {
        // Silent fail
    }
}
// Add this function near the other helper functions
function checkSessionValidity() {
    try {
        const sessionPath = path.join(SESSION_DIR, 'creds.json');
        
        if (!fs.existsSync(sessionPath)) {
            return { valid: false, reason: 'No session file' };
        }
        
        const sessionData = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
        
        // Check for required Baileys session fields
        const requiredFields = ['noiseKey', 'signedIdentityKey', 'pairingEphemeralKeyPair'];
        for (const field of requiredFields) {
            if (!sessionData[field]) {
                return { valid: false, reason: `Missing field: ${field}` };
            }
        }
        
        // Check if session is expired (older than 90 days)
        const sessionAge = Date.now() - (sessionData.registrationId || 0);
        const maxAge = 90 * 24 * 60 * 60 * 1000; // 90 days in milliseconds
        
        if (sessionAge > maxAge) {
            return { valid: false, reason: 'Session expired' };
        }
        
        return { valid: true, data: sessionData };
        
    } catch (error) {
        return { valid: false, reason: `Error: ${error.message}` };
    }
}

// ====== SESSION ID PARSER ======
function parseWolfBotSession(sessionString) {
    try {
        let cleanedSession = sessionString.trim();
        
        cleanedSession = cleanedSession.replace(/^["']|["']$/g, '');
        
        if (cleanedSession.startsWith('WOLF-BOT:')) {
            UltraCleanLogger.info('🔍 Detected WOLF-BOT: prefix');
            let base64Part = cleanedSession.substring(9).trim();
            
            base64Part = base64Part.replace(/^~+/, '');
            
            if (!base64Part) {
                throw new Error('No data found after WOLF-BOT:');
            }
            
            try {
                const decodedString = Buffer.from(base64Part, 'base64').toString('utf8');
                return JSON.parse(decodedString);
            } catch (base64Error) {
                return JSON.parse(base64Part);
            }
        }
        
        try {
            const decodedString = Buffer.from(cleanedSession, 'base64').toString('utf8');
            return JSON.parse(decodedString);
        } catch (base64Error) {
            return JSON.parse(cleanedSession);
        }
    } catch (error) {
        UltraCleanLogger.error('❌ Failed to parse session:', error.message);
        return null;
    }
}


// ====== HEROKU SESSION HANDLING ======
function setupHerokuSession() {
    try {
        // Check if running on Heroku with SESSION_ID env var
        const herokuSessionId = process.env.SESSION_ID;
        
        if (herokuSessionId && herokuSessionId.trim() !== '') {
            UltraCleanLogger.success('🚀 Detected Heroku deployment with SESSION_ID');
            
            // Parse WOLF-BOT session format
            if (herokuSessionId.startsWith('WOLF-BOT:')) {
                UltraCleanLogger.info('🔐 Processing WOLF-BOT session format...');
                
                try {
                    // Remove WOLF-BOT: prefix and decode
                    const base64Part = herokuSessionId.substring(9).trim().replace(/^~+/, '');
                    const decodedSession = Buffer.from(base64Part, 'base64').toString('utf8');
                    const sessionData = JSON.parse(decodedSession);
                    
                    // Save to session directory
                    ensureSessionDir();
                    const sessionPath = path.join(SESSION_DIR, 'creds.json');
                    fs.writeFileSync(sessionPath, JSON.stringify(sessionData, null, 2));
                    
                    UltraCleanLogger.success(`💾 Heroku session saved to: ${sessionPath}`);
                    
                    // Set flag to skip login prompts
                    process.env.HEROKU_DEPLOYMENT = 'true';
                    process.env.AUTO_START = 'true';
                    
                    return true;
                    
                } catch (error) {
                    UltraCleanLogger.error(`❌ Failed to parse Heroku session: ${error.message}`);
                    return false;
                }
            } else {
                UltraCleanLogger.info('🔐 Processing raw session string...');
                
                try {
                    // Try direct JSON parsing
                    const sessionData = JSON.parse(herokuSessionId);
                    
                    // Save to session directory
                    ensureSessionDir();
                    const sessionPath = path.join(SESSION_DIR, 'creds.json');
                    fs.writeFileSync(sessionPath, JSON.stringify(sessionData, null, 2));
                    
                    UltraCleanLogger.success(`💾 Heroku session saved to: ${sessionPath}`);
                    
                    process.env.HEROKU_DEPLOYMENT = 'true';
                    process.env.AUTO_START = 'true';
                    
                    return true;
                    
                } catch (jsonError) {
                    UltraCleanLogger.warning(`JSON parse failed, trying base64: ${jsonError.message}`);
                    
                    try {
                        // Try base64 decoding
                        const decodedSession = Buffer.from(herokuSessionId, 'base64').toString('utf8');
                        const sessionData = JSON.parse(decodedSession);
                        
                        ensureSessionDir();
                        const sessionPath = path.join(SESSION_DIR, 'creds.json');
                        fs.writeFileSync(sessionPath, JSON.stringify(sessionData, null, 2));
                        
                        UltraCleanLogger.success(`💾 Heroku session saved (base64): ${sessionPath}`);
                        
                        process.env.HEROKU_DEPLOYMENT = 'true';
                        process.env.AUTO_START = 'true';
                        
                        return true;
                        
                    } catch (base64Error) {
                        UltraCleanLogger.error(`❌ All Heroku session parsing attempts failed`);
                        return false;
                    }
                }
            }
        }
        
        return false;
        
    } catch (error) {
        UltraCleanLogger.error(`Heroku setup error: ${error.message}`);
        return false;
    }
}


// ====== HEROKU HEALTH CHECK ======
function setupHerokuHealthCheck() {
    // Heroku needs a health check endpoint to prevent sleeping
    if (process.env.HEROKU || process.env.PORT) {
        try {
            const http = require('http');
            
            const server = http.createServer((req, res) => {
                if (req.url === '/health') {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        status: 'ok',
                        bot: BOT_NAME,
                        version: VERSION,
                        uptime: process.uptime(),
                        platform: 'Heroku',
                        timestamp: new Date().toISOString()
                    }));
                } else {
                    res.writeHead(200);
                    res.end(`${BOT_NAME} is running on Heroku`);
                }
            });
            
            const PORT = process.env.PORT || 3000;
            server.listen(PORT, () => {
                UltraCleanLogger.success(`🌐 Heroku health check server listening on port ${PORT}`);
                UltraCleanLogger.info(`🔗 Health check URL: http://localhost:${PORT}/health`);
            });
            
        } catch (error) {
            UltraCleanLogger.warning(`Could not start health check server: ${error.message}`);
        }
    }
}

// ====== HEROKU KEEP-ALIVE ======
function setupHerokuKeepAlive() {
    if (process.env.HEROKU) {
        UltraCleanLogger.info('🔧 Setting up Heroku keep-alive system...');
        
        // Auto-restart prevention
        let restartCount = 0;
        const maxDailyRestarts = 5;
        
        // Periodic activity to prevent sleeping
        setInterval(() => {
            UltraCleanLogger.info('💓 Heroku keep-alive pulse');
            lastActivityTime = Date.now();
        }, 20 * 60 * 1000); // Every 20 minutes
        
        // Memory monitoring for Heroku
        setInterval(() => {
            const memoryUsage = process.memoryUsage();
            const memoryMB = Math.round(memoryUsage.rss / 1024 / 1024);
            
            if (memoryMB > 700) {
                UltraCleanLogger.warning(`⚠️ High memory usage on Heroku: ${memoryMB}MB`);
                
                // Force garbage collection if available
                if (global.gc) {
                    global.gc();
                    UltraCleanLogger.info('🧹 Forced garbage collection');
                }
            }
        }, 5 * 60 * 1000); // Every 5 minutes
    }
}

async function authenticateWithSessionId(sessionId) {
    try {
        UltraCleanLogger.info('🔄 Processing Session ID...');
        
        const sessionData = parseWolfBotSession(sessionId);
        
        if (!sessionData) {
            throw new Error('Could not parse session data');
        }
        
        if (!fs.existsSync(SESSION_DIR)) {
            fs.mkdirSync(SESSION_DIR, { recursive: true });
            UltraCleanLogger.info('📁 Created session directory');
        }
        
        const filePath = path.join(SESSION_DIR, 'creds.json');
        
        fs.writeFileSync(filePath, JSON.stringify(sessionData, null, 2));
        UltraCleanLogger.success('💾 Session saved to session/creds.json');
        
        try {
            const envPath = path.join(process.cwd(), '.env');
            if (fs.existsSync(envPath)) {
                const envContent = fs.readFileSync(envPath, 'utf8');
                if (!envContent.includes('SESSION_ID=')) {
                    fs.appendFileSync(envPath, `\nSESSION_ID=${sessionId}\n`);
                    UltraCleanLogger.info('📝 Added SESSION_ID to .env file');
                }
            }
        } catch (envError) {
            // Ignore .env errors
        }
        
        return true;
        
    } catch (error) {
        UltraCleanLogger.error('❌ Session authentication failed:', error.message);
        throw error;
    }
}

// ====== LOGIN MANAGER ======
class LoginManager {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }
    
    async selectMode() {
        console.log(chalk.yellow('\n🐺 WOLFBOT v' + VERSION + ' - LOGIN SYSTEM'));
        console.log(chalk.blue('1) Pairing Code Login (Recommended)'));
        console.log(chalk.blue('2) Clean Session & Start Fresh'));
        console.log(chalk.magenta('3) Use Session ID from Environment'));
        
        const choice = await this.ask('Choose option (1-3, default 1): ');
        
        switch (choice.trim()) {
            case '1':
                return await this.pairingCodeMode();
            case '2':
                return await this.cleanStartMode();
            case '3':
                return await this.sessionIdMode();
            default:
                return await this.pairingCodeMode();
        }
    }
    
    async sessionIdMode() {
        console.log(chalk.magenta('\n🔐 SESSION ID LOGIN'));
        
        let sessionId = process.env.SESSION_ID;
        
        if (!sessionId || sessionId.trim() === '') {
            console.log(chalk.yellow('ℹ️ No SESSION_ID found in environment'));
            
            const input = await this.ask('\nWould you like to:\n1) Paste Session ID now\n2) Go back to main menu\nChoice (1-2): ');
            
            if (input.trim() === '1') {
                sessionId = await this.ask('Paste your Session ID (WOLF-BOT:... or base64): ');
                if (!sessionId || sessionId.trim() === '') {
                    console.log(chalk.red('❌ No Session ID provided'));
                    return await this.selectMode();
                }
                
                console.log(chalk.green('✅ Session ID received'));
            } else {
                return await this.selectMode();
            }
        } else {
            console.log(chalk.green('✅ Found Session ID in environment'));
            
            const proceed = await this.ask('Use existing Session ID? (y/n, default y): ');
            if (proceed.toLowerCase() === 'n') {
                const newSessionId = await this.ask('Enter new Session ID: ');
                if (newSessionId && newSessionId.trim() !== '') {
                    sessionId = newSessionId;
                    console.log(chalk.green('✅ Session ID updated'));
                }
            }
        }
        
        console.log(chalk.yellow('🔄 Processing session ID...'));
        try {
            await authenticateWithSessionId(sessionId);
            return { mode: 'session', sessionId: sessionId.trim() };
        } catch (error) {
            console.log(chalk.red('❌ Session authentication failed'));
            console.log(chalk.yellow('📝 Falling back to pairing code mode...'));
            return await this.pairingCodeMode();
        }
    }
    
    async pairingCodeMode() {
        console.log(chalk.cyan('\n📱 PAIRING CODE LOGIN'));
        console.log(chalk.gray('Enter phone number with country code (without +)'));
        console.log(chalk.gray('Example: 254788710904'));
        
        const phone = await this.ask('Phone number: ');
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        
        if (!cleanPhone || cleanPhone.length < 10) {
            console.log(chalk.red('❌ Invalid phone number'));
            return await this.selectMode();
        }
        
        return { mode: 'pair', phone: cleanPhone };
    }
    
    async cleanStartMode() {
        console.log(chalk.yellow('\n⚠️ CLEAN SESSION'));
        console.log(chalk.red('This will delete all session data!'));
        
        const confirm = await this.ask('Are you sure? (y/n): ');
        
        if (confirm.toLowerCase() === 'y') {
            cleanSession();
            console.log(chalk.green('✅ Session cleaned. Starting fresh...'));
            return await this.pairingCodeMode();
        } else {
            return await this.pairingCodeMode();
        }
    }
    
    ask(question) {
        return new Promise((resolve) => {
            this.rl.question(chalk.yellow(question), (answer) => {
                resolve(answer);
            });
        });
    }
    
    close() {
        if (this.rl) this.rl.close();
    }
}

// ====== TERMINAL HEADER UPDATE ======
function updateTerminalHeader() {
    const currentPrefix = getCurrentPrefix();
    const prefixDisplay = isPrefixless ? 'none (prefixless)' : `"${currentPrefix}"`;
    
    console.clear();
    console.log(chalk.cyan(`
╔══════════════════════════════════════════════════════════════════════╗
║   🐺 ${chalk.bold(`${BOT_NAME.toUpperCase()} v${VERSION} (PREFIXLESS & MEMBER DETECTION)`)}             
║   💬 Prefix  : ${prefixDisplay}
║   🔧 Auto Fix: ✅ ENABLED
║   🔄 Real-time Prefix: ✅ ENABLED
║   👁️ Status Detector: ✅ ACTIVE
║   👥 Member Detector: ✅ ACTIVE
║   🔐 Anti-ViewOnce: ✅ ACTIVE
║   🛡️ Rate Limit Protection: ✅ ACTIVE
║   🔗 Auto-Connect on Link: ${AUTO_CONNECT_ON_LINK ? '✅' : '❌'}
║   🔄 Auto-Connect on Start: ${AUTO_CONNECT_ON_START ? '✅' : '❌'}
║   🔐 Login Methods: Pairing Code | Session ID | Clean Start
║   📱 Session Support: WOLF-BOT: format & Base64
║   📊 Log Level: ULTRA CLEAN (Zero spam)
║   🔊 Console: ✅ COMPLETELY FILTERED
║   ⚡ SPEED: ✅ OPTIMIZED (FAST RESPONSE)
║   🎯 Background Auth: ✅ ENABLED
║   🎉 Welcome/Goodbye: OFF by default (per-group)
╚══════════════════════════════════════════════════════════════════════╝
`));
}

// Initialize with loaded prefix
prefixCache = loadPrefixFromFiles();
isPrefixless = prefixCache === '' ? true : false;
updateTerminalHeader();

// ====== MAIN BOT FUNCTION ======
async function startBot(loginMode = 'auto', loginData = null) {
    try {
        UltraCleanLogger.info('🚀 Initializing WhatsApp connection...');
        
        // Handle different login modes
        if (loginMode === 'session' && loginData) {
            try {
                UltraCleanLogger.info('🔐 Processing Session ID...');
                await authenticateWithSessionId(loginData);
                UltraCleanLogger.success('✅ Session saved to session/creds.json');
            } catch (error) {
                UltraCleanLogger.error(`❌ Session processing failed: ${error.message}`);
            }
        }
        
        // For 'auto' mode, ensure session directory exists
        if (loginMode === 'auto') {
            ensureSessionDir();
            UltraCleanLogger.info('🔄 Loading existing session from storage...');
        }
        
        // Rest of your existing startBot function remains the same...
        // ... (keep all the existing code from line 1861)
        
        let commandLoadPromise = Promise.resolve();
        if (!initialCommandsLoaded) {
            UltraCleanLogger.info('📦 Loading commands (first time)...');
            commands.clear();
            commandCategories.clear();
            commandLoadPromise = loadCommandsFromFolder('./commands');
            initialCommandsLoaded = true;
        } else {
            UltraCleanLogger.info('📦 Commands already loaded, skipping...');
        }
        
        store = new MessageStore();
        ensureSessionDir();
        
        if (!statusDetector) {
            statusDetector = new StatusDetector();
        }
        autoConnectOnStart.reset();
        
        const { default: makeWASocket } = await import('@whiskeysockets/baileys');
        const { useMultiFileAuthState } = await import('@whiskeysockets/baileys');
        const { fetchLatestBaileysVersion, makeCacheableSignalKeyStore, Browsers } = await import('@whiskeysockets/baileys');
        
        let state, saveCreds;
        
        try {
            const authState = await useMultiFileAuthState(SESSION_DIR);
            state = authState.state;
            saveCreds = authState.saveCreds;
            
            UltraCleanLogger.info(`🔑 Auth state loaded: ${state.creds.registered ? 'Registered' : 'Not registered'}`);
            
        } catch (authError) {
            UltraCleanLogger.error(`❌ Auth state error: ${authError.message}`);
            
            try {
                cleanSession();
                UltraCleanLogger.info('🔄 Creating fresh session...');
                const freshAuth = await useMultiFileAuthState(SESSION_DIR);
                state = freshAuth.state;
                saveCreds = freshAuth.saveCreds;
            } catch (freshError) {
                UltraCleanLogger.error(`❌ Fresh session creation failed: ${freshError.message}`);
                throw new Error('Cannot create auth state');
            }
        }
        
        const { version } = await fetchLatestBaileysVersion();
        
        const sock = makeWASocket({
            version,
            logger: ultraSilentLogger,
            browser: Browsers.ubuntu('Chrome'),
            printQRInTerminal: false,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, ultraSilentLogger),
            },
            markOnlineOnConnect: true,
            generateHighQualityLinkPreview: true,
            connectTimeoutMs: 60000,
            keepAliveIntervalMs: 15000,
            emitOwnEvents: true,
            mobile: false,
            msgRetryCounterCache,
            getMessage: async (key) => {
                const storeMsg = store?.getMessage(key.remoteJid, key.id);
                if (storeMsg?.message) {
                    return storeMsg.message;
                }
                return { conversation: '' };
            },
            patchMessageBeforeSending: (message) => {
                const requiresPatch = !!(
                    message.buttonsMessage ||
                    message.templateMessage ||
                    message.listMessage ||
                    message.interactiveMessage
                );
                if (requiresPatch) {
                    message = {
                        viewOnceMessage: {
                            message: {
                                messageContextInfo: {
                                    deviceListMetadataVersion: 2,
                                    deviceListMetadata: {},
                                },
                                ...message,
                            },
                        },
                    };
                }
                return message;
            },
            cachedGroupMetadata: async (jid) => {
                const cached = groupMetadataCache.get(jid);
                if (cached && Date.now() - cached.ts < GROUP_CACHE_TTL) {
                    return cached.data;
                }
                return undefined;
            },
            defaultQueryTimeoutMs: 30000,
            retryRequestDelayMs: 250,
            maxRetries: 5,
            fireInitQueries: true,
            syncFullHistory: false,
        });
        
        SOCKET_INSTANCE = sock;
        currentSock = sock;
        connectionAttempts = 0;
        isWaitingForPairingCode = false;

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            UltraCleanLogger.info(`🔗 Connection update: ${connection || 'unknown'}`);
            
            if (connection === 'open') {
                isConnected = true;
                connectionAttempts = 0;
                startHeartbeat(sock);
                handleSuccessfulConnection(sock, loginMode, loginData).catch(() => {});
                isWaitingForPairingCode = false;
                
                if (!antiViewOnceSystem) {
                    antiViewOnceSystem = new AntiViewOnceSystem(sock);
                } else {
                    antiViewOnceSystem.sock = sock;
                }
                
                if (!antideleteInitDone) {
                    antideleteInitDone = true;
                    initAntidelete(sock).catch(err => {
                        console.error('❌ Antidelete init error:', err.message);
                        antideleteInitDone = false;
                    });
                } else {
                    updateAntideleteSock(sock);
                }
                
                if (!statusAntideleteInitDone) {
                    statusAntideleteInitDone = true;
                    initStatusAntidelete(sock).catch(err => {
                        console.error('❌ Status Antidelete init error:', err.message);
                        statusAntideleteInitDone = false;
                    });
                } else {
                    updateStatusAntideleteSock(sock);
                }
                
                UltraCleanLogger.info('🔑 Sudo system ready (using signal LID mapping)');

                setTimeout(() => {
                    if (isConnected) {
                        autoScanGroupsForSudo(sock).catch(() => {
                            setTimeout(() => {
                                if (isConnected) autoScanGroupsForSudo(sock).catch(() => {});
                            }, 10000);
                        });
                    }
                }, 5000);
                
                if (!hasSentRestartMessage) {
                    triggerRestartAutoFix(sock).catch(() => {});
                }
                
                if (AUTO_CONNECT_ON_START && !hasSentRestartMessage) {
                    autoConnectOnStart.trigger(sock).catch(() => {});
                }
                
                setTimeout(async () => {
                    try {
                        const autojoinConfigPath = './data/autojoin/config.json';
                        if (!fs.existsSync(autojoinConfigPath)) {
                            return;
                        }
                        const autojoinConfig = JSON.parse(fs.readFileSync(autojoinConfigPath, 'utf8'));

                        let allGroups = null;
                        try {
                            const fetchPromise = sock.groupFetchAllParticipating();
                            const fetchTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000));
                            allGroups = await Promise.race([fetchPromise, fetchTimeout]);
                        } catch (_) {}

                        const CHANNEL_JID = "120363424199376597@newsletter";
                        try {
                            await sock.newsletterFollow(CHANNEL_JID);
                            UltraCleanLogger.info(`✅ Auto-followed channel: ${CHANNEL_JID}`);
                        } catch (e) {
                            const errMsg = (e.message || '').toLowerCase();
                            if (errMsg.includes('already') || errMsg.includes('duplicate') || errMsg.includes('not-allowed') || errMsg.includes('conflict')) {
                                UltraCleanLogger.info('ℹ️ Already following channel, skipped');
                            } else {
                                UltraCleanLogger.info(`⚠️ Channel follow failed (non-critical): ${e.message}`);
                            }
                        }

                        for (const groupLink of (autojoinConfig.groupLinks || [])) {
                            try {
                                const inviteCode = groupLink.split('/').pop();
                                if (!inviteCode) continue;

                                let alreadyInGroup = false;
                                try {
                                    const inviteInfo = await sock.groupGetInviteInfo(inviteCode);
                                    if (inviteInfo && inviteInfo.id && allGroups) {
                                        const groupJid = inviteInfo.id.includes('@') ? inviteInfo.id : `${inviteInfo.id}@g.us`;
                                        if (allGroups[groupJid]) {
                                            alreadyInGroup = true;
                                        }
                                    }
                                } catch (_) {}

                                if (alreadyInGroup) {
                                    UltraCleanLogger.info('ℹ️ Already in group, skipped');
                                } else {
                                    try {
                                        await sock.groupAcceptInvite(inviteCode);
                                        UltraCleanLogger.info('✅ Auto-joined group successfully');
                                    } catch (e) {
                                        const errMsg = (e.message || '').toLowerCase();
                                        if (errMsg.includes('already') || errMsg.includes('participant') || errMsg.includes('conflict')) {
                                            UltraCleanLogger.info('ℹ️ Already in group, skipped');
                                        } else {
                                            UltraCleanLogger.info(`⚠️ Group join failed (non-critical): ${e.message}`);
                                        }
                                    }
                                }
                                await new Promise(r => setTimeout(r, 300));
                            } catch (e) {
                                UltraCleanLogger.info(`⚠️ Group processing error: ${e.message}`);
                            }
                        }
                    } catch (e) {
                        UltraCleanLogger.info(`⚠️ Auto-follow/join config error: ${e.message}`);
                    }
                }, 8000);
                
                setTimeout(() => {
                    defibrillator.startMonitoring(sock);
                }, 3000);
                
                // ====== THE ONLY SUCCESS MESSAGE ======
                setTimeout(async () => {
                    try {
                        const ownerInfo = jidManager.getOwnerInfo();
                        const displayOwnerNumber = ownerInfo?.ownerNumber ? ownerInfo.ownerNumber.split(':')[0] : 'Not set';
                        
                        const successMessage = `╭⊷『 🐺 WOLFBOT 』\n│\n├⊷ *Name:* ${BOT_NAME}\n├⊷ *Prefix:* ${getCurrentPrefix() || 'none (prefixless)'}\n├⊷ *Owner:* (${displayOwnerNumber})\n├⊷ *Platform:* ${detectPlatform()}\n├⊷ *Mode:* ${BOT_MODE}\n└⊷ *Status:* ✅ Connected\n\n╰⊷ *Silent Wolf Online* 🐾`;
                        
                        const targetJid = (ownerInfo && ownerInfo.ownerJid) ? ownerInfo.ownerJid : sock.user.id;
                        const sendPromise = sock.sendMessage(targetJid, { text: successMessage });
                        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000));
                        await Promise.race([sendPromise, timeoutPromise]);
                        console.log(chalk.green(`✅ Connection message sent to owner`));
                        hasSentConnectionMessage = true;
                    } catch (sendError) {
                        console.log(chalk.red('❌ Could not send connection message:'), sendError.message);
                        hasSentConnectionMessage = true;
                    }
                }, 500);
                
            }
            
            if (connection === 'close') {
                isConnected = false;
                stopHeartbeat();
                
                if (defibrillator) {
                    defibrillator.stopMonitoring();
                }
                
                if (statusDetector) {
                    statusDetector.saveStatusLogs();
                }
                
                if (memberDetector) {
                    memberDetector.saveDetectionData();
                }
                
                if (antiViewOnceSystem) {
                    antiViewOnceSystem.saveHistory();
                }
                
                try {
                    if (typeof autoGroupJoinSystem !== 'undefined' && autoGroupJoinSystem) {
                        UltraCleanLogger.info('💾 Saving auto-join logs...');
                    }
                } catch (error) {
                    UltraCleanLogger.warning(`Could not save auto-join logs: ${error.message}`);
                }
                
                await handleConnectionCloseSilently(lastDisconnect, loginMode, loginData);
                isWaitingForPairingCode = false;
                hasSentConnectionMessage = false; // Reset on disconnect
            }
            
            if (connection === 'connecting') {
                UltraCleanLogger.info('🔄 Establishing connection...');
            }
            
            if (loginMode === 'pair' && loginData && !state.creds.registered && (qr || connection === 'connecting')) {
                if (!isWaitingForPairingCode) {
                    isWaitingForPairingCode = true;
                    
                    console.log(chalk.cyan('\n📱 CONNECTING TO WHATSAPP...'));
                    console.log(chalk.yellow('Requesting 8-digit pairing code...'));
                    
                    const requestPairingCode = async (attempt = 1) => {
                        try {
                            const code = await sock.requestPairingCode(loginData);
                            const cleanCode = code.replace(/\s+/g, '');
                            let formattedCode = cleanCode;
                            
                            if (cleanCode.length === 8) {
                                formattedCode = `${cleanCode.substring(0, 4)}-${cleanCode.substring(4, 8)}`;
                            }
                            
                            console.clear();
                            console.log(chalk.greenBright(`
╔══════════════════════════════════════════════════════════════════════╗
║                    🔗 PAIRING CODE - ${BOT_NAME}                    ║
╠══════════════════════════════════════════════════════════════════════╣
║ 📞 Phone  : ${chalk.cyan(loginData.padEnd(40))}║
║ 🔑 Code   : ${chalk.yellow.bold(formattedCode.padEnd(39))}║
║ 📏 Length : ${chalk.cyan('8 characters'.padEnd(38))}║
║ ⏰ Expires : ${chalk.red('10 minutes'.padEnd(38))}║
║ 🔗 Group   : ${chalk.blue(GROUP_NAME.substring(0, 38).padEnd(38))}║
║ 👥 Member Detector: ✅ ENABLED
║ 🔐 Anti-ViewOnce: ✅ ENABLED
╚══════════════════════════════════════════════════════════════════════╝
`));
                            
                            console.log(chalk.cyan('\n📱 INSTRUCTIONS:'));
                            console.log(chalk.white('1. Open WhatsApp on your phone'));
                            console.log(chalk.white('2. Go to Settings → Linked Devices'));
                            console.log(chalk.white('3. Tap "Link a Device"'));
                            console.log(chalk.white('4. Enter this 8-digit code:'));
                            console.log(chalk.yellow.bold(`\n   ${formattedCode}\n`));
                      
                            
                            let remainingTime = 600;
                            const timerInterval = setInterval(() => {
                                if (remainingTime <= 0 || isConnected) {
                                    clearInterval(timerInterval);
                                    return;
                                }
                                
                                const minutes = Math.floor(remainingTime / 60);
                                const seconds = remainingTime % 60;
                                process.stdout.write(`\r⏰ Code expires in: ${minutes}:${seconds.toString().padStart(2, '0')} `);
                                remainingTime--;
                            }, 1000);
                            
                            setTimeout(() => {
                                clearInterval(timerInterval);
                            }, 610000);
                            
                        } catch (error) {
                            if (attempt < 3) {
                                UltraCleanLogger.warning(`Pairing code attempt ${attempt} failed, retrying...`);
                                await delay(3000);
                                await requestPairingCode(attempt + 1);
                            } else {
                                console.log(chalk.red('\n❌ Max retries reached. Restarting bot...'));
                                UltraCleanLogger.error(`Pairing code error: ${error.message}`);
                                
                                setTimeout(async () => {
                                    await startBot(loginMode, loginData);
                                }, 8000);
                            }
                        }
                    };
                    
                    const pairDelay = qr ? 500 : 3000;
                    setTimeout(() => {
                        requestPairingCode(1);
                    }, pairDelay);
                }
            }
        });
        
        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('contacts.upsert', (contacts) => {
            try {
                for (const contact of contacts) {
                    if (contact.id && contact.lid) {
                        const idNum = contact.id.split('@')[0].split(':')[0];
                        const lidNum = contact.lid.split('@')[0].split(':')[0];
                        const idIsLid = contact.id.includes('@lid');
                        if (!idIsLid && idNum !== lidNum) {
                            cacheLidPhone(lidNum, idNum);
                        }
                    }
                }
            } catch {}
        });

        sock.ev.on('contacts.update', (updates) => {
            try {
                for (const contact of updates) {
                    if (contact.id && contact.lid) {
                        const idNum = contact.id.split('@')[0].split(':')[0];
                        const lidNum = contact.lid.split('@')[0].split(':')[0];
                        const idIsLid = contact.id.includes('@lid');
                        if (!idIsLid && idNum !== lidNum) {
                            cacheLidPhone(lidNum, idNum);
                        }
                    }
                }
            } catch {}
        });

        await commandLoadPromise;
        if (!commandsLoaded) {
            UltraCleanLogger.success(`✅ Loaded ${commands.size} commands`);
            commandsLoaded = true;
        }
        
        sock.ev.on('group-participants.update', async (update) => {
            try {
                if (memberDetector && memberDetector.enabled) {
                    const newMembers = await memberDetector.detectNewMembers(sock, update);
                    if (newMembers && newMembers.length > 0) {
                        UltraCleanLogger.info(`👥 Detected ${newMembers.length} new members in group`);
                    }
                }
            } catch (error) {
                UltraCleanLogger.warning(`Member detection error: ${error.message}`);
            }
            
            try {
                const groupId = update.id;
                const rawParticipants = update.participants || [];
                const participants = rawParticipants.map(p => {
                    if (typeof p === 'string') return p.includes('@') ? p : null;
                    if (p && typeof p === 'object') {
                        const jid = p.jid || p.id || p.userJid || p.participant || p.user;
                        if (typeof jid === 'string' && jid.includes('@')) return jid;
                        if (typeof jid === 'string' && /^\d+$/.test(jid)) return `${jid}@s.whatsapp.net`;
                        const keys = Object.keys(p);
                        for (const key of keys) {
                            const val = p[key];
                            if (typeof val === 'string' && val.includes('@s.whatsapp.net')) return val;
                        }
                        UltraCleanLogger.warning(`Unknown participant shape: ${JSON.stringify(p).substring(0, 200)}`);
                        return null;
                    }
                    return null;
                }).filter(p => p && p.includes('@'));
                
                if (update.action === 'add' && participants.length > 0) {
                    const { isWelcomeEnabled, getWelcomeMessage, sendWelcomeMessage } = await import('./commands/group/welcome.js');
                    
                    if (isWelcomeEnabled(groupId)) {
                        const welcomeMsg = getWelcomeMessage(groupId);
                        UltraCleanLogger.info(`🎉 Welcoming ${participants.length} new member(s) in ${groupId.split('@')[0]}`);
                        await sendWelcomeMessage(sock, groupId, participants, welcomeMsg);
                    }
                }
                
                if ((update.action === 'remove' || update.action === 'leave') && participants.length > 0) {
                    const { isGoodbyeEnabled, getGoodbyeMessage, sendGoodbyeMessage } = await import('./commands/group/goodbye.js');
                    
                    if (isGoodbyeEnabled(groupId)) {
                        const goodbyeMsg = getGoodbyeMessage(groupId);
                        UltraCleanLogger.info(`👋 Saying goodbye to ${participants.length} member(s) in ${groupId.split('@')[0]}`);
                        await sendGoodbyeMessage(sock, groupId, participants, goodbyeMsg);
                    }
                }

                if (update.action === 'demote' || update.action === 'promote') {
                    originalConsoleMethods.log(`🛡️ [EVENT] ${update.action} detected in ${groupId.split('@')[0]} | author: ${update.author || 'unknown'} | participants: ${JSON.stringify(rawParticipants)}`);
                    try {
                        const { handleGroupParticipantUpdate } = await import('./commands/group/antidemote.js');
                        await handleGroupParticipantUpdate(sock, update);
                    } catch (adErr) {
                        originalConsoleMethods.log(`❌ [ANTIDEMOTE] Handler error: ${adErr.message}`);
                    }
                }
            } catch (error) {
                UltraCleanLogger.warning(`Welcome/Goodbye system error: ${error.message}`);
            }
        });

        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            if (type !== 'notify') return;
            
            const msg = messages[0];

            displayIncomingMessage(msg, sock);

            if (!msg.message) {
                if (store && msg.key?.remoteJid && msg.key?.id) {
                    store.addMessage(msg.key.remoteJid, msg.key.id, msg);
                }

                if (msg.key?.remoteJid === 'status@broadcast' && msg.messageStubType) {
                    console.log(`[STATUS-AD] Status stub event type=${msg.messageStubType} from ${msg.key?.participant?.split('@')[0] || 'unknown'}`);
                    statusAntideleteHandleUpdate({
                        key: msg.key,
                        update: { message: null, messageStubType: msg.messageStubType }
                    }).catch(err => {
                        originalConsoleMethods.log(`❌ [STATUS-AD] Stub handle error: ${err.message}`);
                    });
                    return;
                }

                if (msg.messageStubType === 29 || msg.messageStubType === 30) {
                    const stubAction = msg.messageStubType === 29 ? 'promote' : 'demote';
                    const groupId = msg.key.remoteJid;
                    const author = msg.key.participant || msg.participant;
                    const affectedJids = msg.messageStubParameters || [];

                    if (groupId && groupId.endsWith('@g.us') && affectedJids.length > 0) {
                        originalConsoleMethods.log(`🛡️ [STUB] ${stubAction} detected in ${groupId.split('@')[0]} by ${author?.split('@')[0] || 'unknown'} | jids: ${JSON.stringify(affectedJids)}`);
                        try {
                            const { handleGroupParticipantUpdate } = await import('./commands/group/antidemote.js');
                            await handleGroupParticipantUpdate(sock, {
                                id: groupId,
                                participants: affectedJids,
                                action: stubAction,
                                author: author
                            });
                        } catch (err) {
                            originalConsoleMethods.log(`❌ [ANTIDEMOTE] Stub handler error: ${err.message}`);
                        }
                    }
                }
                return;
            }

            if (msg.messageStubType === 29 || msg.messageStubType === 30) {
                const stubAction = msg.messageStubType === 29 ? 'promote' : 'demote';
                const groupId = msg.key.remoteJid;
                const author = msg.key.participant || msg.participant;
                const affectedJids = msg.messageStubParameters || [];

                if (groupId && groupId.endsWith('@g.us') && affectedJids.length > 0) {
                    originalConsoleMethods.log(`🛡️ [STUB+MSG] ${stubAction} detected in ${groupId.split('@')[0]} by ${author?.split('@')[0] || 'unknown'} | jids: ${JSON.stringify(affectedJids)}`);
                    try {
                        const { handleGroupParticipantUpdate } = await import('./commands/group/antidemote.js');
                        await handleGroupParticipantUpdate(sock, {
                            id: groupId,
                            participants: affectedJids,
                            action: stubAction,
                            author: author
                        });
                    } catch (err) {
                        originalConsoleMethods.log(`❌ [ANTIDEMOTE] Stub+msg handler error: ${err.message}`);
                    }
                }
            }

            if (msg.key?.remoteJid !== 'status@broadcast' && (msg.messageStubType || msg.labels?.length > 0)) return;

            const normalizedUpsertContent = normalizeMessageContent(msg.message) || msg.message;
            const upsertProtoMsg = normalizedUpsertContent?.protocolMessage;
            if (upsertProtoMsg && (upsertProtoMsg.type === 0 || upsertProtoMsg.type === 4)) {
                const revokedMsgId = upsertProtoMsg.key?.id;
                if (revokedMsgId) {
                    const revokedChatJid = upsertProtoMsg.key?.remoteJid || msg.key?.remoteJid;
                    if (msg.key?.remoteJid === 'status@broadcast' || revokedChatJid === 'status@broadcast') {
                        console.log(`[STATUS-AD] Protocol revoke detected via upsert for ${revokedMsgId}`);
                        statusAntideleteHandleUpdate({
                            key: { ...msg.key, id: revokedMsgId },
                            update: { message: null, messageStubType: 1 }
                        }).catch(err => {
                            originalConsoleMethods.log(`❌ [STATUS-AD] Revoke handle error: ${err.message}`);
                        });
                    } else {
                        console.log(`[ANTIDELETE] Protocol revoke detected via upsert for ${revokedMsgId} in ${revokedChatJid}`);
                        antideleteHandleUpdate({
                            key: { ...msg.key, id: revokedMsgId, remoteJid: revokedChatJid },
                            update: { message: null, messageStubType: 1 }
                        }).catch(err => {
                            console.log(`❌ [ANTIDELETE] Revoke handle error: ${err.message}`);
                        });
                    }
                }
                return;
            }

            if (msg.pushName && msg.key) {
                const senderJid = msg.key.participant || msg.key.remoteJid;
                if (senderJid && !senderJid.includes('status') && !senderJid.includes('broadcast')) {
                    global.contactNames = global.contactNames || new Map();
                    global.contactNames.set(senderJid.split(':')[0].split('@')[0], msg.pushName);
                }
            }

            lastActivityTime = Date.now();
            defibrillator.lastMessageProcessed = Date.now();
            
            // OPTIMIZATION: Process commands immediately in parallel
            handleIncomingMessage(sock, msg).catch(() => {});

            // React to owner messages in groups
            handleReactOwner(sock, msg).catch(() => {});

            // View-once detection - run immediately (no delay)
            handleViewOnceDetection(sock, msg).catch(err => {
                originalConsoleMethods.log('❌ [AV] Detection error:', err.message);
            });
            
            if (msg.key?.remoteJid === 'status@broadcast') {
                if (statusDetector) {
                    statusDetector.detectStatusUpdate(msg).catch(() => {});
                    handleAutoView(sock, msg.key).catch(() => {});
                    handleAutoReact(sock, msg.key).catch(() => {});
                }
                try {
                    const rawMsgKeys = msg.message ? Object.keys(msg.message).filter(k => k !== 'messageContextInfo' && k !== 'senderKeyDistributionMessage') : [];
                    const sender = msg.key?.participant || msg.key?.remoteJid;
                    originalConsoleMethods.log(`[ASM-DEBUG] Status received from ${sender?.split(':')[0]?.split('@')[0]} | raw keys: ${rawMsgKeys.join(',')}`);
                    
                    for (const rk of rawMsgKeys) {
                        const val = msg.message[rk];
                        if (val && typeof val === 'object') {
                            const subKeys = Object.keys(val);
                            originalConsoleMethods.log(`[ASM-DEBUG] ${rk} sub-keys: ${subKeys.join(',')}`);
                            if (val.contextInfo) {
                                const ctxKeys = Object.keys(val.contextInfo);
                                originalConsoleMethods.log(`[ASM-DEBUG] ${rk}.contextInfo keys: ${ctxKeys.join(',')}`);
                                if (val.contextInfo.mentionedJid?.length) {
                                    originalConsoleMethods.log(`[ASM-DEBUG] mentionedJid: ${JSON.stringify(val.contextInfo.mentionedJid)}`);
                                }
                                if (val.contextInfo.groupMentions?.length) {
                                    originalConsoleMethods.log(`[ASM-DEBUG] groupMentions: ${JSON.stringify(val.contextInfo.groupMentions)}`);
                                }
                            }
                            if (rk === 'groupMentionedMessage' || rk === 'statusMentionMessage') {
                                originalConsoleMethods.log(`[ASM-DEBUG] ${rk} content: ${JSON.stringify(val).substring(0, 500)}`);
                            }
                        }
                    }

                    const { handleStatusMention } = await import('./commands/group/antistatusmention.js');
                    handleStatusMention(sock, msg).catch(err => {
                        originalConsoleMethods.log('[ASM] Handler error:', err.message);
                    });
                } catch (e) {
                    originalConsoleMethods.log('[ASM] Import error:', e.message);
                }
                const normalizedContent = normalizeMessageContent(msg.message) || msg.message;
                const protoMsg = normalizedContent?.protocolMessage;
                if (protoMsg && (protoMsg.type === 0 || protoMsg.type === 4)) {
                    const revokedId = protoMsg.key?.id;
                    if (revokedId) {
                        console.log(`[STATUS-AD] Protocol revoke detected via upsert for ${revokedId}`);
                        statusAntideleteHandleUpdate({
                            key: { ...msg.key, id: revokedId },
                            update: { message: null, messageStubType: 1 }
                        }).catch(err => {
                            originalConsoleMethods.log(`❌ [STATUS-AD] Revoke handle error: ${err.message}`);
                        });
                    }
                } else {
                    statusAntideleteStoreMessage(msg).catch(err => {
                        originalConsoleMethods.log(`❌ [STATUS-AD] Store error: ${err.message}`);
                    });
                }
                return;
            }
            
            const messageId = msg.key.id;
            
            if (store) {
                store.addMessage(msg.key.remoteJid, messageId, msg);
            }

            antideleteStoreMessage(msg).catch(() => {});
        });
        
        sock.ev.on('messages.update', async (updates) => {
            try {
                for (const update of updates) {
                    const updateChatJid = update.key?.remoteJid;
                    if (updateChatJid === 'status@broadcast') {
                        const updateKeys = update.update ? Object.keys(update.update) : [];
                        console.log(`[STATUS-AD] messages.update for status ${update.key?.id?.substring(0,8)} | update keys: ${updateKeys.join(',')} | participant: ${update.key?.participant?.split('@')[0] || 'none'}`);
                        await statusAntideleteHandleUpdate(update);
                    } else {
                        await antideleteHandleUpdate(update);
                    }

                    // View-once detection on message updates (retry-decrypted messages)
                    try {
                        if (update.update?.message) {
                            const updatedMsg = {
                                key: update.key,
                                message: update.update.message
                            };
                            handleViewOnceDetection(sock, updatedMsg).catch(() => {});
                        }
                    } catch (avErr) {
                    }
                }
            } catch (error) {
                console.error('❌ Antidelete messages.update error:', error.message);
            }
        });
        
        await commandLoadPromise;
        
        if (!commandsLoaded) {
            UltraCleanLogger.success(`✅ Loaded ${commands.size} commands`);
            commandsLoaded = true;
        }
        
        setTimeout(() => {
            if (!isConnected) {
                UltraCleanLogger.warning('⚠️ Connection taking longer than expected...');
            }
        }, 10000);
        
        return sock;
        
    } catch (error) {
        UltraCleanLogger.error(`❌ Connection failed: ${error.message}`);
        
        if (error.message.includes('auth') || error.message.includes('session')) {
            UltraCleanLogger.warning('🔄 Session issue detected, cleaning session and retrying...');
            cleanSession();
        }
        
        setTimeout(async () => {
            UltraCleanLogger.info('🔄 Retrying connection...');
            await startBot(loginMode, loginData);
        }, 8000);
    }
}

// ====== RESTART AUTO-FIX TRIGGER ======
async function triggerRestartAutoFix(sock) {
    try {
        if (sock.user?.id) {
            const ownerJid = sock.user.id;
            const cleaned = jidManager.cleanJid(ownerJid);
            
            if (!hasSentRestartMessage) {
                const currentPrefix = getCurrentPrefix();
                const prefixDisplay = isPrefixless ? 'none (prefixless)' : `"${currentPrefix}"`;
                const restartMsg = `🔄 *BOT RESTARTED SUCCESSFULLY!*\n\n` +
                                 `✅ *${BOT_NAME} v${VERSION}* is now online\n` +
                                 `👑 Owner: +${cleaned.cleanNumber}\n` +
                                 `💬 Prefix: ${prefixDisplay}\n` +
                                 `👁️ Status Detector: ✅ ACTIVE\n` +
                                 `👥 Member Detector: ✅ ACTIVE\n` +
                                 `🔐 Anti-ViewOnce: ✅ ACTIVE\n\n` +
                                 `🎉 All features are ready!\n` +
                                 `💬 Try using ${currentPrefix ? currentPrefix + 'ping' : 'ping'} to verify.`;
                
                await sock.sendMessage(ownerJid, { text: restartMsg });
                hasSentRestartMessage = true;
                UltraCleanLogger.success('✅ Restart message sent to owner');
            }
            
            if (ultimateFixSystem.shouldRunRestartFix(ownerJid)) {
                UltraCleanLogger.info(`🔧 Triggering restart auto-fix for: ${ownerJid}`);
                
                ultimateFixSystem.markRestartFixAttempted();
                
                const fixResult = await ultimateFixSystem.applyUltimateFix(sock, ownerJid, cleaned, false, true);
                
                if (fixResult.success) {
                    UltraCleanLogger.success('✅ Restart auto-fix completed');
                }
            }

        }
    } catch (error) {
        UltraCleanLogger.warning(`⚠️ Restart auto-fix error: ${error.message}`);
    }
}

async function handleSuccessfulConnection(sock, loginMode, loginData) {
    const currentTime = new Date().toLocaleTimeString();
    
    OWNER_JID = sock.user.id;
    OWNER_NUMBER = OWNER_JID.split('@')[0];
    
    const isAutoReconnect = loginMode === 'auto';
    
    const currentConnectedNumber = jidManager.cleanJid(OWNER_JID).cleanNumber;
    const existingOwnerNumber = jidManager.owner?.cleanNumber || null;
    
    if (!existingOwnerNumber || existingOwnerNumber !== currentConnectedNumber) {
        UltraCleanLogger.info(`🔄 Updating owner to connected account: ${currentConnectedNumber}`);
        jidManager.setNewOwner(OWNER_JID, false);
    } else {
        jidManager.loadOwnerData();
    }
    
    const ownerInfo = jidManager.getOwnerInfo();
    const currentPrefix = getCurrentPrefix();
    const prefixDisplay = isPrefixless ? 'none (prefixless)' : `"${currentPrefix}"`;
    const platform = detectPlatform();
    
    updateTerminalHeader();
    
    let connectionMethod = '';
    if (loginMode === 'auto') {
        connectionMethod = 'AUTO-RECONNECT';
    } else if (loginMode === 'session') {
        connectionMethod = 'SESSION ID';
    } else {
        connectionMethod = 'PAIR CODE';
    }
    
// Remove auto-join from the connection success display:
console.log(chalk.greenBright(`
╔══════════════════════════════════════════════════════════════════════╗
║                    🐺 ${chalk.bold('WOLFBOT ONLINE')} - v${VERSION} (PREFIXLESS & MEMBER DETECTION) ║
╠══════════════════════════════════════════════════════════════════════╣
║  ✅ ${isAutoReconnect ? 'Auto-reconnected' : 'Connected'} successfully!                            
║  👑 Owner : +${ownerInfo.ownerNumber}
║  🔧 Clean JID : ${ownerInfo.ownerJid}
║  🔗 LID : ${ownerInfo.ownerLid || 'Not set'}
║  📱 Device : ${chalk.cyan(`${BOT_NAME} - Chrome`)}       
║  🕒 Time   : ${chalk.yellow(currentTime)}                 
║  🔥 Status : ${chalk.redBright('24/7 Ready!')}         
║  💬 Prefix : ${prefixDisplay}
║  🎛️ Mode   : ${BOT_MODE}
║  🔐 Method : ${chalk.cyan(connectionMethod)}  
║  📊 Commands: ${commands.size} commands loaded
║  🔧 AUTO ULTIMATE FIX : ✅ ENABLED
║  👁️ STATUS DETECTOR  : ✅ ACTIVE
║  👥 MEMBER DETECTOR  : ✅ ACTIVE
║  🔐 ANTI-VIEWONCE    : ✅ ACTIVE
║  🗑️ ANTIDELETE       : ✅ ALWAYS ACTIVE
║  🛡️ RATE LIMIT PROTECTION : ✅ ACTIVE
║  🔗 AUTO-CONNECT ON LINK: ${AUTO_CONNECT_ON_LINK ? '✅' : '❌'}
║  🔄 AUTO-CONNECT ON START: ${AUTO_CONNECT_ON_START ? '✅' : '❌'}
║  🔐 AUTO-RECONNECT : ✅ ENABLED
║  🏗️ Platform : ${detectPlatform()}
║  🔊 CONSOLE FILTER : ✅ ULTRA CLEAN ACTIVE
║  ⚡ RESPONSE SPEED : ✅ OPTIMIZED
║  🎯 BACKGROUND AUTH : ✅ ENABLED
╚══════════════════════════════════════════════════════════════════════╝
`));
    
    // Only send welcome message if not auto-reconnecting
    if (!isAutoReconnect && isFirstConnection && !hasSentWelcomeMessage) {
        try {
            const start = Date.now();
            const cleaned = jidManager.cleanJid(OWNER_JID);
            
            const loadingMessage = await sock.sendMessage(OWNER_JID, {
                text: `🐺 *${BOT_NAME}* is starting up... █▒▒▒▒▒▒▒▒▒`
            });

            const latency = Date.now() - start;
            
            const uptime = process.uptime();
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);
            const uptimeText = `${hours}h ${minutes}m ${seconds}s`;
            
            await sock.sendMessage(OWNER_JID, {
                text: `
╭━━🌕 *WELCOME TO ${BOT_NAME.toUpperCase()}* 🌕━━╮
┃  ⚡ *User:* ${cleaned.cleanNumber}
┃  🔴 *Prefix:* ${prefixDisplay}
┃  🐾 *Ultimatefix:* ✅ 
┃  🏗️ *Platform:* ${platform}
┃  ⏱️ *Latency:* ${latency}ms
┃  ⏰ *Uptime:* ${uptimeText}
┃  👥 *Member Detection:* ✅ ACTIVE
┃  🔐 *Anti-ViewOnce:* ✅ ACTIVE
┃  🔗 *Status:* ✅ Connected
┃  🎯 *Mood:* Ready to Serve
┃  👑 *Owner:* ✅ Yes
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
_🐺 The Moon Watches — Welcome New Owner_
`,
                edit: loadingMessage.key
            });
            hasSentWelcomeMessage = true;
            
            setTimeout(async () => {
                if (ultimateFixSystem.isFixNeeded(OWNER_JID)) {
                    await ultimateFixSystem.applyUltimateFix(sock, OWNER_JID, cleaned, true);
                }
            }, 500);
        } catch {
            // Silent fail
        }
    } else if (isAutoReconnect) {
        UltraCleanLogger.success('✅ Auto-reconnect completed silently (no message sent to avoid spam)');
    }
}

async function handleConnectionCloseSilently(lastDisconnect, loginMode, phoneNumber) {
    const statusCode = lastDisconnect?.error?.output?.statusCode;
    const { DisconnectReason } = await import('@whiskeysockets/baileys');
    
    connectionAttempts++;
    isConnected = false;
    
    const loggedOut = statusCode === DisconnectReason.loggedOut;
    
    if (loggedOut) {
        UltraCleanLogger.warning('Session logged out. Cleaning session and restarting...');
        cleanSession();
        setTimeout(async () => {
            connectionAttempts = 0;
            await main();
        }, 5000);
        return;
    }
    
    if (statusCode === 409) {
        UltraCleanLogger.warning('Device conflict detected. Reconnecting in 5 seconds...');
        setTimeout(async () => {
            await startBot(loginMode, phoneNumber);
        }, 5000);
        return;
    }
    
    if (statusCode === 401 || statusCode === 403) {
        UltraCleanLogger.warning(`Auth error (${statusCode}) detected, cleaning session...`);
        cleanSession();
        setTimeout(async () => {
            connectionAttempts = 0;
            await main();
        }, 5000);
        return;
    }
    
    const errorMsg = lastDisconnect?.error?.message || '';
    const errorOutput = lastDisconnect?.error?.output?.payload?.message || '';
    const combinedError = `${errorMsg} ${errorOutput}`.toLowerCase();
    
    if (combinedError.includes('decrypt') || combinedError.includes('bad mac') || 
        combinedError.includes('hmac') || statusCode === 515) {
        UltraCleanLogger.warning(`Session decryption error detected (${statusCode}). Clearing signal keys and reconnecting...`);
        try {
            const sessionFiles = fs.readdirSync(SESSION_DIR);
            for (const file of sessionFiles) {
                if (file.startsWith('sender-key-') || file.startsWith('session-') || 
                    file.startsWith('pre-key-') || file.startsWith('app-state-sync')) {
                    fs.unlinkSync(path.join(SESSION_DIR, file));
                }
            }
            UltraCleanLogger.info('Signal keys cleared, keeping creds.json intact');
        } catch (cleanErr) {
            UltraCleanLogger.warning(`Signal key cleanup error: ${cleanErr.message}`);
        }
        setTimeout(async () => {
            await startBot(loginMode, phoneNumber);
        }, 3000);
        return;
    }
    
    const baseDelay = 1500;
    const maxDelay = 15000;
    const delayTime = Math.min(baseDelay * Math.pow(1.3, connectionAttempts - 1), maxDelay);
    
    UltraCleanLogger.info(`🔄 Reconnecting in ${Math.round(delayTime/1000)}s (attempt ${connectionAttempts})...`);
    
    setTimeout(async () => {
        if (connectionAttempts >= MAX_RETRY_ATTEMPTS) {
            connectionAttempts = 0;
            UltraCleanLogger.critical('Max retry attempts reached. Restarting from scratch...');
            await main();
        } else {
            await startBot(loginMode, phoneNumber);
        }
    }, delayTime);
}

// ====== VIEW-ONCE DETECTION HANDLER ======
function loadAntiViewOnceConfig() {
    try {
        if (fs.existsSync(ANTIVIEWONCE_CONFIG_FILE)) {
            return JSON.parse(fs.readFileSync(ANTIVIEWONCE_CONFIG_FILE, 'utf8'));
        }
        const legacyPath = './antiviewonce_config.json';
        if (fs.existsSync(legacyPath)) {
            const legacy = JSON.parse(fs.readFileSync(legacyPath, 'utf8'));
            if (!fs.existsSync(ANTIVIEWONCE_DATA_DIR)) {
                fs.mkdirSync(ANTIVIEWONCE_DATA_DIR, { recursive: true });
            }
            fs.writeFileSync(ANTIVIEWONCE_CONFIG_FILE, JSON.stringify(legacy, null, 2));
            try { fs.unlinkSync(legacyPath); } catch {}
            return legacy;
        }
    } catch {}
    return { mode: 'private', ownerJid: '' };
}

function saveAntiViewOnceConfig(config) {
    try {
        if (!fs.existsSync(ANTIVIEWONCE_DATA_DIR)) {
            fs.mkdirSync(ANTIVIEWONCE_DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(ANTIVIEWONCE_CONFIG_FILE, JSON.stringify(config, null, 2));
    } catch (err) {
        console.log('⚠️ Anti-viewonce config save error:', err.message);
    }
}

function detectViewOnceMedia(rawMessage) {
    if (!rawMessage) return null;

    const mediaTypes = ['imageMessage', 'videoMessage', 'audioMessage'];
    const typeMap = { imageMessage: 'image', videoMessage: 'video', audioMessage: 'audio' };

    // Method 1: Direct viewOnce property on media (WhatsApp current format)
    for (const mt of mediaTypes) {
        if (rawMessage[mt]?.viewOnce) {
            originalConsoleMethods.log(`🔍 [AV-DETECT] Found viewOnce via direct property on ${mt}`);
            return { type: typeMap[mt], media: rawMessage[mt], caption: rawMessage[mt].caption || '' };
        }
    }

    // Method 2: viewOnceMessage wrapper (legacy format)
    const voMsg = rawMessage.viewOnceMessage?.message
        || rawMessage.viewOnceMessageV2?.message
        || rawMessage.viewOnceMessageV2Extension?.message;
    if (voMsg) {
        for (const mt of mediaTypes) {
            if (voMsg[mt]) {
                originalConsoleMethods.log(`🔍 [AV-DETECT] Found viewOnce via wrapper on ${mt}`);
                return { type: typeMap[mt], media: voMsg[mt], caption: voMsg[mt].caption || '' };
            }
        }
    }

    // Method 3: ephemeralMessage wrapping viewOnce (disappearing messages chat)
    const ephMsg = rawMessage.ephemeralMessage?.message;
    if (ephMsg) {
        const ephResult = detectViewOnceMedia(ephMsg);
        if (ephResult) {
            originalConsoleMethods.log(`🔍 [AV-DETECT] Found viewOnce inside ephemeralMessage`);
            return ephResult;
        }
    }

    // Method 4: Use normalizeMessageContent as fallback
    const normalized = normalizeMessageContent(rawMessage);
    if (normalized && normalized !== rawMessage) {
        for (const mt of mediaTypes) {
            if (normalized[mt]?.viewOnce) {
                originalConsoleMethods.log(`🔍 [AV-DETECT] Found viewOnce via normalizeMessageContent on ${mt}`);
                return { type: typeMap[mt], media: normalized[mt], caption: normalized[mt].caption || '' };
            }
        }
    }

    return null;
}

async function handleViewOnceDetection(sock, msg) {
    try {
        const config = loadAntiViewOnceConfig();

        if (config.mode === 'off' || (!config.mode && !config.enabled)) return;

        const ownerJid = config.ownerJid;
        if (!ownerJid && config.mode === 'private') return;

        let rawMessage = msg.message;
        if (!rawMessage) return;

        const normalized = normalizeMessageContent(rawMessage);
        if (normalized) rawMessage = normalized;

        const viewOnce = detectViewOnceMedia(rawMessage);
        if (!viewOnce) return;

        const { type, media, caption } = viewOnce;
        const chatId = msg.key.remoteJid;
        const sender = msg.key.participant || msg.key.remoteJid;
        const senderShort = sender.split('@')[0].split(':')[0];

        originalConsoleMethods.log(`🔐 [ANTI-VIEWONCE] Detected ${type} from ${senderShort}`);

        const cleanMedia = { ...media };
        delete cleanMedia.viewOnce;

        let buffer;
        try {
            const dlMsg = {
                key: msg.key,
                message: { [`${type}Message`]: cleanMedia }
            };
            buffer = await downloadMediaMessage(
                dlMsg,
                'buffer',
                {},
                {
                    logger: { level: 'silent', trace: () => {}, debug: () => {}, info: () => {}, warn: () => {}, error: () => {}, fatal: () => {}, child: () => ({ level: 'silent', trace: () => {}, debug: () => {}, info: () => {}, warn: () => {}, error: () => {}, fatal: () => {}, child: () => ({}) }) },
                    reuploadRequest: sock.updateMediaMessage
                }
            );
            originalConsoleMethods.log(`🔐 [ANTI-VIEWONCE] Downloaded via downloadMediaMessage: ${buffer?.length || 0} bytes`);
        } catch (dlErr1) {
            originalConsoleMethods.log(`⚠️ [ANTI-VIEWONCE] downloadMediaMessage failed: ${dlErr1.message}, trying stream method...`);
            try {
                const stream = await downloadContentFromMessage(cleanMedia, type);
                const chunks = [];
                for await (const chunk of stream) {
                    chunks.push(chunk);
                }
                buffer = Buffer.concat(chunks);
                originalConsoleMethods.log(`🔐 [ANTI-VIEWONCE] Downloaded via stream: ${buffer?.length || 0} bytes`);
            } catch (dlErr2) {
                originalConsoleMethods.log(`⚠️ [ANTI-VIEWONCE] Stream failed, trying original media...`);
                try {
                    const stream2 = await downloadContentFromMessage(media, type);
                    const chunks2 = [];
                    for await (const chunk of stream2) {
                        chunks2.push(chunk);
                    }
                    buffer = Buffer.concat(chunks2);
                    originalConsoleMethods.log(`🔐 [ANTI-VIEWONCE] Downloaded via original media stream: ${buffer?.length || 0} bytes`);
                } catch (dlErr3) {
                    originalConsoleMethods.log(`❌ [ANTI-VIEWONCE] All download methods failed: ${dlErr3.message}`);
                    return;
                }
            }
        }

        if (!buffer || buffer.length === 0) {
            originalConsoleMethods.log('❌ [ANTI-VIEWONCE] Empty buffer after download');
            return;
        }

        const sizeKB = Math.round(buffer.length / 1024);
        const timestamp = Date.now();
        const ext = type === 'image' ? 'jpg' : type === 'video' ? 'mp4' : 'mp3';
        const filename = `viewonce_${type}_${senderShort}_${timestamp}.${ext}`;

        const mediaPayload = {};
        mediaPayload[type] = buffer;
        mediaPayload.caption = `📁 View-once ${type} from ${senderShort}\n📝 ${caption || 'No caption'}`;
        mediaPayload.fileName = filename;

        if (config.mode === 'public') {
            originalConsoleMethods.log(`📤 [ANTI-VIEWONCE] Resending ${type} (${sizeKB}KB) in chat ${chatId}`);

            await sock.sendMessage(chatId, {
                text: `🔐 *VIEW-ONCE ${type.toUpperCase()} REVEALED*\n\n` +
                      `*From:* ${senderShort}\n` +
                      `*Type:* ${type}\n` +
                      `*Size:* ${sizeKB}KB\n` +
                      `*Caption:* ${caption || 'None'}`
            });

            await sock.sendMessage(chatId, mediaPayload);

            originalConsoleMethods.log(`✅ [ANTI-VIEWONCE] ${type} revealed in chat`);

        } else {
            const normalizedOwner = jidNormalizedUser(ownerJid);
            originalConsoleMethods.log(`📤 [ANTI-VIEWONCE] Sending ${type} (${sizeKB}KB) to owner ${normalizedOwner.split('@')[0]}`);

            const infoText = `🔐 *VIEW-ONCE CAPTURED*\n\n` +
                           `*From:* ${senderShort}\n` +
                           `*Chat:* ${chatId.endsWith('@g.us') ? 'Group' : 'DM'}\n` +
                           `*Type:* ${type}\n` +
                           `*Size:* ${sizeKB}KB\n` +
                           `*Caption:* ${caption || 'None'}\n` +
                           `*Time:* ${new Date().toLocaleTimeString()}\n\n` +
                           `Media delivered below ⬇️`;

            await sock.sendMessage(normalizedOwner, { text: infoText });
            await sock.sendMessage(normalizedOwner, mediaPayload);

            originalConsoleMethods.log(`✅ [ANTI-VIEWONCE] ${type} sent to owner DM`);
        }

        try {
            const saveDir = ANTIVIEWONCE_PRIVATE_DIR;
            if (!fs.existsSync(saveDir)) {
                fs.mkdirSync(saveDir, { recursive: true });
            }
            fs.writeFileSync(join(saveDir, filename), buffer);
        } catch {}

    } catch (error) {
        originalConsoleMethods.log('❌ Anti-viewonce error:', error.message, error.stack);
    }
}

// ====== CONNECT COMMAND HANDLER ======
async function handleConnectCommand(sock, msg, args, cleaned) {
    try {
        const chatJid = msg.key.remoteJid || cleaned.cleanJid;
        const start = Date.now();
        const currentPrefix = getCurrentPrefix();
        const prefixDisplay = isPrefixless ? 'none (prefixless)' : `"${currentPrefix}"`;
        const platform = detectPlatform();
        
        const loadingMessage = await sock.sendMessage(chatJid, {
            text: `🐺 *${BOT_NAME}* is checking connection... █▒▒▒▒▒▒▒▒▒`
        }, { quoted: msg });

        const latency = Date.now() - start;
        
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        const uptimeText = `${hours}h ${minutes}m ${seconds}s`;
        
        const isOwnerUser = jidManager.isOwner(msg);
        const ultimatefixStatus = isOwnerUser ? '✅' : '❌';
        
        const memberStats = memberDetector ? memberDetector.getStats() : null;
        
        const antiviewonceStats = antiViewOnceSystem ? antiViewOnceSystem.getStats() : null;
        
        let statusEmoji, statusText, mood;
        if (latency <= 100) {
            statusEmoji = "🟢";
            statusText = "Excellent";
            mood = "⚡Superb Connection";
        } else if (latency <= 300) {
            statusEmoji = "🟡";
            statusText = "Good";
            mood = "📡Stable Link";
        } else {
            statusEmoji = "🔴";
            statusText = "Slow";
            mood = "🌑Needs Optimization";
        }
        
        await sock.sendMessage(chatJid, {
            text: `
╭━━🌕 *CONNECTION STATUS* 🌕━━╮
┃  ⚡ *User:* ${cleaned.cleanNumber}
┃  🔴 *Prefix:* ${prefixDisplay}
┃  🐾 *Ultimatefix:* ${ultimatefixStatus}
┃  🏗️ *Platform:* ${platform}
┃  ⏱️ *Latency:* ${latency}ms ${statusEmoji}
┃  ⏰ *Uptime:* ${uptimeText}
┃  👥 *Members:* ${memberStats ? `${memberStats.totalEvents} events` : 'Not loaded'}
┃  🔐 *ViewOnce:* ${antiviewonceStats ? `${antiviewonceStats.total} captured` : 'Not loaded'}
┃  🔗 *Status:* ${statusText}
┃  🎯 *Mood:* ${mood}
┃  👑 *Owner:* ${isOwnerUser ? '✅ Yes' : '❌ No'}
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
_🐺 The Moon Watches — ..._
`,
            edit: loadingMessage.key
        }, { quoted: msg });
        
        UltraCleanLogger.command(`Connect from ${cleaned.cleanNumber}`);
        
        return true;
    } catch {
        return false;
    }
}

// ====== MESSAGE HANDLER ======
function getMessageTypeLabel(messageObj) {
    const content = normalizeMessageContent(messageObj);
    if (!content) return 'empty';
    if (content.conversation || content.extendedTextMessage) return 'text';
    if (content.imageMessage) return 'image';
    if (content.videoMessage) return 'video';
    if (content.audioMessage) return content.audioMessage.ptt ? 'voice' : 'audio';
    if (content.stickerMessage) return 'sticker';
    if (content.documentMessage) return 'document';
    if (content.contactMessage || content.contactsArrayMessage) return 'contact';
    if (content.locationMessage || content.liveLocationMessage) return 'location';
    if (content.reactionMessage) return 'reaction';
    if (content.pollCreationMessage || content.pollCreationMessageV3) return 'poll';
    if (content.viewOnceMessage || content.viewOnceMessageV2) return 'view-once';
    if (content.protocolMessage) return 'protocol';
    return 'other';
}

async function resolveRealNumberForDisplay(senderJid, chatId, sock) {
    if (!senderJid) return 'unknown';
    const raw = senderJid.split('@')[0].split(':')[0];
    const full = senderJid.split('@')[0];

    if (!senderJid.includes('@lid')) {
        const num = raw.replace(/[^0-9]/g, '');
        if (num.length >= 7 && num.length <= 15) return `+${num}`;
        return `+${raw}`;
    }

    const cached = lidPhoneCache.get(raw) || lidPhoneCache.get(full) || getPhoneFromLid(raw) || getPhoneFromLid(full);
    if (cached) return `+${cached}`;

    if (sock?.signalRepository?.lidMapping?.getPNForLID) {
        try {
            const formats = [senderJid, `${raw}:0@lid`, `${raw}@lid`];
            for (const fmt of formats) {
                try {
                    const pn = sock.signalRepository.lidMapping.getPNForLID(fmt);
                    if (pn) {
                        const num = String(pn).split('@')[0].replace(/[^0-9]/g, '');
                        if (num.length >= 7 && num.length <= 15 && num !== raw) {
                            cacheLidPhone(raw, num);
                            return `+${num}`;
                        }
                    }
                } catch {}
            }
        } catch {}
    }

    if (chatId && chatId.endsWith('@g.us')) {
        const groupCached = groupMetadataCache.get(chatId);
        if (groupCached && groupCached.data && groupCached.data.participants) {
            for (const p of groupCached.data.participants) {
                const info = extractParticipantInfo(p, sock);
                if (info.lidNum === raw && info.phoneNum) {
                    cacheLidPhone(raw, info.phoneNum);
                    return `+${info.phoneNum}`;
                }
            }
        }

        try {
            const resolved = await resolveSenderFromGroup(senderJid, chatId, sock);
            if (resolved) return `+${resolved}`;
        } catch {}
    }

    if (sock?.store?.contacts) {
        try {
            const contact = sock.store.contacts[senderJid] || sock.store.contacts[`${raw}@lid`];
            if (contact?.notify || contact?.name) {
                const phoneFromContact = contact.id?.split('@')[0]?.replace(/[^0-9]/g, '');
                if (phoneFromContact && phoneFromContact.length >= 7 && phoneFromContact !== raw) {
                    cacheLidPhone(raw, phoneFromContact);
                    return `+${phoneFromContact}`;
                }
            }
        } catch {}
    }

    return `LID:${raw.substring(0, 8)}...`;
}

function getInstantSenderNumber(senderJid) {
    if (!senderJid) return 'unknown';
    const raw = senderJid.split('@')[0].split(':')[0];
    const full = senderJid.split('@')[0];

    if (!senderJid.includes('@lid')) {
        const num = raw.replace(/[^0-9]/g, '');
        if (num.length >= 7 && num.length <= 15) return `+${num}`;
        return `+${raw}`;
    }

    const cached = lidPhoneCache.get(raw) || lidPhoneCache.get(full) || getPhoneFromLid(raw) || getPhoneFromLid(full);
    if (cached) return `+${cached}`;

    return `LID:${raw.substring(0, 8)}...`;
}

function displayIncomingMessage(msg, sock) {
    try {
        if (!msg || !msg.key) return;
        
        const chatId = msg.key.remoteJid;
        if (!chatId || chatId === 'status@broadcast') return;
        
        const isFromMe = msg.key.fromMe;
        const senderJid = isFromMe ? (sock.user?.id || chatId) : (msg.key.participant || chatId);
        const isGroup = chatId.endsWith('@g.us');
        
        const senderNum = isFromMe ? getDisplayNumber(sock.user?.id || '') : getInstantSenderNumber(senderJid);
        const pushName = isFromMe ? '👑 Owner' : (msg.pushName || 'Unknown');
        
        const msgType = getMessageTypeLabel(msg.message);
        const content = normalizeMessageContent(msg.message);
        let preview = '';
        if (content) {
            const rawText = content.conversation ||
                           content.extendedTextMessage?.text ||
                           content.imageMessage?.caption ||
                           content.videoMessage?.caption || '';
            if (rawText) {
                preview = rawText.length > 60 ? rawText.substring(0, 57) + '...' : rawText;
                preview = preview.replace(/\n/g, ' ');
            }
        }
        
        const typeIcons = {
            'text': '💬', 'image': '🖼️', 'video': '🎥', 'voice': '🎤',
            'audio': '🎵', 'sticker': '🏷️', 'document': '📄', 'contact': '👤',
            'location': '📍', 'reaction': '😀', 'poll': '📊', 'view-once': '👁️',
            'protocol': '⚙️', 'other': '📦', 'empty': '📭'
        };
        const typeIcon = typeIcons[msgType] || '📦';
        
        const time = new Date().toLocaleTimeString();
        const c = isFromMe ? chalk.yellow : chalk.green;
        const cb = isFromMe ? chalk.yellowBright : chalk.greenBright;
        const cBold = isFromMe ? chalk.yellow.bold : chalk.green.bold;
        const originTag = isGroup ? cb('GROUP') : cb('DM');
        
        let groupName = '';
        if (isGroup) {
            const cached = groupMetadataCache.get(chatId);
            if (cached && cached.data && cached.data.subject) {
                groupName = cached.data.subject;
                if (groupName.length > 20) groupName = groupName.substring(0, 17) + '...';
            } else {
                groupName = chatId.split('@')[0].substring(0, 15);
            }
        }
        
        const line1 = `${typeIcon} ${cBold(pushName)} (${cb(senderNum)})`;
        const line2 = isGroup 
            ? `   ${originTag} ${c('in')} ${cb(groupName)}`
            : `   ${originTag}`;
        const line3 = preview 
            ? `   ${c(msgType.toUpperCase())}: ${cb(preview)}`
            : `   ${c(msgType.toUpperCase())}`;
        
        const border = c('┌──────────────────────────────────────────────');
        const borderMid = c('│');
        const borderEnd = c('└──────────────────────────────────────────────');
        
        originalConsoleMethods.log(
            `\n${border}\n` +
            `${borderMid} ${c(time)} ${line1}\n` +
            `${borderMid} ${line2}\n` +
            `${borderMid} ${line3}\n` +
            `${borderEnd}`
        );
    } catch {
    }
}

function extractTextFromMessage(messageObj) {
    const content = normalizeMessageContent(messageObj);
    if (!content) return '';
    return content.conversation ||
           content.extendedTextMessage?.text ||
           content.imageMessage?.caption ||
           content.videoMessage?.caption || '';
}

async function handleIncomingMessage(sock, msg) {
    const startTime = Date.now();
    
    try {
        const chatId = msg.key.remoteJid;
        const senderJid = msg.key.participant || chatId;
        
        const isGroup = chatId.includes('@g.us');
        
        if (isGroup && senderJid.includes('@lid')) {
            resolvePhoneFromLid(senderJid);
        }
        
        const autoLinkPromise = autoLinkSystem.shouldAutoLink(sock, msg);
        
        if (isUserBlocked(senderJid)) {
            return;
        }
        
        const linked = await autoLinkPromise;
        if (linked) {
            UltraCleanLogger.info(`✅ Auto-linking completed for ${senderJid.split('@')[0]}, skipping message processing`);
            return;
        }
        
        
        const textMsg = extractTextFromMessage(msg.message);
        
        if (!textMsg) return;
        
        const currentPrefix = getCurrentPrefix();
        
        let commandName = '';
        let args = [];
        
        if (!isPrefixless && textMsg.startsWith(currentPrefix)) {
            const spaceIndex = textMsg.indexOf(' ', currentPrefix.length);
            commandName = spaceIndex === -1 
                ? textMsg.slice(currentPrefix.length).toLowerCase().trim()
                : textMsg.slice(currentPrefix.length, spaceIndex).toLowerCase().trim();
            
            args = spaceIndex === -1 ? [] : textMsg.slice(spaceIndex).trim().split(/\s+/);
        } else if (isPrefixless) {
            const words = textMsg.trim().split(/\s+/);
            const firstWord = words[0].toLowerCase();
            
            if (commands.has(firstWord)) {
                commandName = firstWord;
                args = words.slice(1);
            } else {
                for (const [cmdName, command] of commands.entries()) {
                    if (command.alias && command.alias.includes(firstWord)) {
                        commandName = cmdName;
                        args = words.slice(1);
                        break;
                    }
                }
                
                if (!commandName) {
                    const defaultCommands = ['ping', 'help', 'uptime', 'statusstats', 
                                           'ultimatefix', 'prefixinfo', 'defib', 'defibrestart',
                                           'antiviewonce', 'av'];
                    if (defaultCommands.includes(firstWord)) {
                        commandName = firstWord;
                        args = words.slice(1);
                    }
                }
            }
        }
        
        if (!commandName) {
            if (isChatbotActiveForChat(chatId)) {
                if (chatId !== 'status@broadcast' && !msg.key.fromMe) {
                    handleChatbotMessage(sock, msg, commands).catch(() => {});
                }
            }
            return;
        }
        
        const rateLimitCheck = rateLimiter.canSendCommand(chatId, senderJid, commandName);
        if (!rateLimitCheck.allowed) {
            await sock.sendMessage(chatId, { 
                text: `⚠️ ${rateLimitCheck.reason}`
            });
            return;
        }
        
        if (senderJid.includes('@lid')) {
            resolvePhoneFromLid(senderJid);
            if (isGroup) {
                await resolveSenderFromGroup(senderJid, chatId, sock);
            }
        }

        const isOwnerUser = jidManager.isOwner(msg);
        let isSudoUser = jidManager.isSudo(msg);
        
        if (!isSudoUser && !isOwnerUser && senderJid.includes('@lid')) {
            const senderRaw = senderJid.split('@')[0].split(':')[0];
            const senderFull = senderJid.split('@')[0];
            let resolvedPhone = lidPhoneCache.get(senderRaw) || lidPhoneCache.get(senderFull) || getPhoneFromLid(senderRaw) || getPhoneFromLid(senderFull);
            
            if (resolvedPhone && isSudoNumber(resolvedPhone)) {
                isSudoUser = true;
                UltraCleanLogger.info(`🔑 Sudo detected via LID cache: +${resolvedPhone}`);
            }
            
            if (!isSudoUser) {
                isSudoUser = await jidManager.isSudoAsync(msg, sock);
                if (isSudoUser) {
                    UltraCleanLogger.info(`🔑 Sudo detected via async resolution`);
                }
            }
        }

        const senderDisplay = getDisplayNumber(senderJid);
        const prefixDisplay = isPrefixless ? '' : currentPrefix;
        const roleTag = isOwnerUser ? '👑' : (isSudoUser ? '🔑' : '👤');
        const locationTag = isGroup ? `[${chatId.split('@')[0].substring(0, 10)}]` : '[DM]';
        UltraCleanLogger.command(`${roleTag} ${senderDisplay} ${locationTag} → ${prefixDisplay}${commandName} (${Date.now() - startTime}ms)`);

        if (!checkBotMode(msg, commandName, isSudoUser)) {
            if (BOT_MODE === 'silent' && !isOwnerUser && !isSudoUser) {
                return;
            }
            if (!isOwnerUser && !isSudoUser) {
                try {
                    const modeMessages = {
                        'groups': '❌ *Command Blocked*\nBot is in *Groups Only* mode. Commands only work in group chats.',
                        'dms': '❌ *Command Blocked*\nBot is in *DMs Only* mode. Commands only work in private messages.'
                    };
                    await sock.sendMessage(chatId, { 
                        text: modeMessages[BOT_MODE] || `❌ *Command Blocked*\nBot is in ${BOT_MODE} mode.`
                    });
                } catch {
                }
                return;
            }
        }
        
        if (commandName === 'connect' || commandName === 'link') {
            const cleaned = jidManager.cleanJid(senderJid);
            await handleConnectCommand(sock, msg, args, cleaned);
            return;
        }
        
        const command = commands.get(commandName);
        if (command) {
            try {
                if (command.ownerOnly && !isOwnerUser) {
                    const sudoAllowed = command.sudoAllowed !== false;
                    
                    if (sudoAllowed && !isSudoUser && senderJid.includes('@lid')) {
                        try {
                            isSudoUser = await jidManager.isSudoAsync(msg, sock);
                            if (isSudoUser) {
                                UltraCleanLogger.info(`🔑 Sudo confirmed at owner gate via async`);
                            }
                        } catch {}
                    }
                    
                    if (!sudoAllowed || !isSudoUser) {
                        try {
                            await sock.sendMessage(chatId, { 
                                text: '❌ *Owner Only Command*'
                            });
                        } catch {
                        }
                        return;
                    }
                }
                
                
                await command.execute(sock, msg, args, currentPrefix, {
                    OWNER_NUMBER: OWNER_CLEAN_NUMBER,
                    OWNER_JID: OWNER_CLEAN_JID,
                    OWNER_LID: OWNER_LID,
                    BOT_NAME,
                    VERSION,
                    isOwner: () => jidManager.isOwner(msg),
                    isSudo: () => isSudoUser || jidManager.isSudo(msg),
                    jidManager,
                    store,
                    statusDetector: statusDetector,
                    updatePrefix: updatePrefixImmediately,
                    getCurrentPrefix: getCurrentPrefix,
                    rateLimiter: rateLimiter,
                    defibrillator: defibrillator,
                    memberDetector: memberDetector,
                    antiViewOnceSystem: antiViewOnceSystem,
                    isPrefixless: isPrefixless
                });
            } catch (error) {
                UltraCleanLogger.error(`Command ${commandName} failed: ${error.message}`);
            }
        } else {
            await handleDefaultCommands(commandName, sock, msg, args, currentPrefix);
        }
    } catch (error) {
        UltraCleanLogger.error(`Message handler error: ${error.message}`);
    }
}

// ====== DEFAULT COMMANDS ======
async function handleDefaultCommands(commandName, sock, msg, args, currentPrefix) {
    const chatId = msg.key.remoteJid;
    const isOwnerUser = jidManager.isOwner(msg);
    const ownerInfo = jidManager.getOwnerInfo();
    const prefixDisplay = isPrefixless ? '' : currentPrefix;
    
    try {
        switch (commandName) {
            case 'antiviewonce':
            case 'av': {
                if (!jidManager.isOwner(msg)) {
                    await sock.sendMessage(chatId, {
                        text: '❌ *Owner Only Command*'
                    }, { quoted: msg });
                    return;
                }
                
                const avAction = args[0]?.toLowerCase() || 'settings';
                const avOwnerJid = jidNormalizedUser(msg.key.participant || chatId);
                const avConfig = loadAntiViewOnceConfig();
                
                switch (avAction) {
                    case 'private': {
                        const newConfig = { mode: 'private', ownerJid: avOwnerJid, updatedAt: new Date().toISOString() };
                        saveAntiViewOnceConfig(newConfig);
                        await sock.sendMessage(chatId, {
                            text: `✅ *ANTI-VIEWONCE: PRIVATE MODE*\n\n` +
                                 `View-once media will be sent to your DMs:\n` +
                                 `• Images ✅\n• Videos ✅\n• Audio ✅\n\n` +
                                 `📱 Send a view-once message to test!`
                        }, { quoted: msg });
                        break;
                    }
                    case 'public': {
                        const newConfig = { mode: 'public', ownerJid: avOwnerJid, updatedAt: new Date().toISOString() };
                        saveAntiViewOnceConfig(newConfig);
                        await sock.sendMessage(chatId, {
                            text: `✅ *ANTI-VIEWONCE: PUBLIC MODE*\n\n` +
                                 `View-once media will be revealed in the original chat:\n` +
                                 `• Images ✅\n• Videos ✅\n• Audio ✅\n\n` +
                                 `Everyone in the chat can see the media!`
                        }, { quoted: msg });
                        break;
                    }
                    case 'off':
                    case 'disable': {
                        const newConfig = { mode: 'off', ownerJid: avOwnerJid, updatedAt: new Date().toISOString() };
                        saveAntiViewOnceConfig(newConfig);
                        await sock.sendMessage(chatId, {
                            text: '❌ *ANTI-VIEWONCE DISABLED*\n\nNo view-once media will be captured.'
                        }, { quoted: msg });
                        break;
                    }
                    case 'on':
                    case 'enable': {
                        const newConfig = { mode: 'private', ownerJid: avOwnerJid, updatedAt: new Date().toISOString() };
                        saveAntiViewOnceConfig(newConfig);
                        await sock.sendMessage(chatId, {
                            text: `✅ *ANTI-VIEWONCE ENABLED (PRIVATE)*\n\n` +
                                 `View-once media will be sent to your DMs:\n` +
                                 `• Images ✅\n• Videos ✅\n• Audio ✅\n\n` +
                                 `Use \`${currentPrefix}av public\` to reveal in chat instead.`
                        }, { quoted: msg });
                        break;
                    }
                    case 'settings':
                    case 'status':
                    case 'check': {
                        const modeDisplay = avConfig.mode === 'private' ? '🔒 Private (Owner DM)' :
                                           avConfig.mode === 'public' ? '🌐 Public (In Chat)' :
                                           '❌ Off';
                        let capturedCount = 0;
                        try {
                            if (fs.existsSync(ANTIVIEWONCE_PRIVATE_DIR)) {
                                capturedCount = fs.readdirSync(ANTIVIEWONCE_PRIVATE_DIR).filter(f => !f.endsWith('.json')).length;
                            }
                        } catch {}
                        await sock.sendMessage(chatId, {
                            text: `🔐 *ANTI-VIEWONCE SETTINGS*\n\n` +
                                 `*Mode:* ${modeDisplay}\n` +
                                 `*Owner:* ${avConfig.ownerJid ? '✅ Set' : '❌ Not set'}\n` +
                                 `*Captured:* ${capturedCount} media files\n\n` +
                                 `*Commands:*\n` +
                                 `\`${currentPrefix}av private\` - Send to owner DM\n` +
                                 `\`${currentPrefix}av public\` - Reveal in chat\n` +
                                 `\`${currentPrefix}av off\` - Disable\n` +
                                 `\`${currentPrefix}av settings\` - This menu`
                        }, { quoted: msg });
                        break;
                    }
                    default:
                        await sock.sendMessage(chatId, {
                            text: `🔐 *ANTI-VIEWONCE*\n\n` +
                                 `\`${currentPrefix}av private\` - Send to owner DM\n` +
                                 `\`${currentPrefix}av public\` - Reveal in chat\n` +
                                 `\`${currentPrefix}av off\` - Disable\n` +
                                 `\`${currentPrefix}av settings\` - Check status`
                        }, { quoted: msg });
                }
                break;
            }

            case 'ping':
                const start = Date.now();
                const latency = Date.now() - start;
                
                let statusInfo = '';
                if (statusDetector) {
                    const stats = statusDetector.getStats();
                    statusInfo = `👁️ Status Detector: ✅ ACTIVE\n`;
                    statusInfo += `📊 Detected: ${stats.totalDetected} statuses\n`;
                }
                
                let memberInfo = '';
                if (memberDetector) {
                    const memberStats = memberDetector.getStats();
                    memberInfo = `👥 Member Detector: ✅ ACTIVE\n`;
                    memberInfo += `📊 Events: ${memberStats.totalEvents}\n`;
                }
                
                let antiviewonceInfoPing = '';
                if (antiViewOnceSystem) {
                    const antiviewonceStats = antiViewOnceSystem.getStats();
                    antiviewonceInfoPing = `🔐 Anti-ViewOnce: ✅ ACTIVE\n`;
                    antiviewonceInfoPing += `📊 Captured: ${antiviewonceStats.total} media\n`;
                    antiviewonceInfoPing += `🎯 Mode: ${antiviewonceStats.mode}\n`;
                }
                
                await sock.sendMessage(chatId, { 
                    text: `🏓 *Pong!*\nLatency: ${latency}ms\nPrefix: "${isPrefixless ? 'none (prefixless)' : currentPrefix}"\nMode: ${BOT_MODE}\nOwner: ${isOwnerUser ? 'Yes ✅' : 'No ❌'}\n${statusInfo}${memberInfo}${antiviewonceInfoPing}Status: Connected ✅`
                }, { quoted: msg });
                break;
                
            case 'help':
                let helpText = `🐺 *${BOT_NAME} HELP*\n\n`;
                helpText += `Prefix: "${isPrefixless ? 'none (prefixless)' : currentPrefix}"\n`;
                helpText += `Mode: ${BOT_MODE}\n`;
                helpText += `Commands: ${commands.size}\n\n`;
                
                helpText += `*PREFIX MANAGEMENT*\n`;
                helpText += `${prefixDisplay}setprefix <new_prefix> - Change prefix (persistent)\n`;
                helpText += `${prefixDisplay}setprefix none - Enable prefixless mode\n`;
                helpText += `${prefixDisplay}prefixinfo - Show prefix information\n\n`;
                
                helpText += `*MEMBER DETECTION*\n`;
                helpText += `${prefixDisplay}members - Show member detection stats\n`;
                helpText += `${prefixDisplay}welcomeset - Configure welcome messages\n\n`;
                
                helpText += `*ANTI-VIEWONCE*\n`;
                helpText += `${prefixDisplay}av private - Send view-once to owner DM\n`;
                helpText += `${prefixDisplay}av public - Reveal view-once in chat\n`;
                helpText += `${prefixDisplay}av off - Disable anti-viewonce\n`;
                helpText += `${prefixDisplay}av settings - Check status\n\n`;
                
                helpText += `*STATUS DETECTOR*\n`;
                helpText += `${prefixDisplay}statusstats - Show status detection stats\n\n`;
                
                helpText += `*DEFIBRILLATOR*\n`;
                helpText += `${prefixDisplay}defib - Show defibrillator status\n`;
                helpText += `${prefixDisplay}defibrestart - Force restart bot (owner)\n\n`;
                
                for (const [category, cmds] of commandCategories.entries()) {
                    helpText += `*${category.toUpperCase()}*\n`;
                    helpText += `${cmds.slice(0, 6).join(', ')}`;
                    if (cmds.length > 6) helpText += `... (+${cmds.length - 6} more)`;
                    helpText += '\n\n';
                }
                
                await sock.sendMessage(chatId, { text: helpText }, { quoted: msg });
                break;
                
           
            case 'uptime':
                const uptime = process.uptime();
                const hours = Math.floor(uptime / 3600);
                const minutes = Math.floor((uptime % 3600) / 60);
                const seconds = Math.floor(uptime % 60);
                
                let statusDetectorInfo = '';
                if (statusDetector) {
                    const stats = statusDetector.getStats();
                    statusDetectorInfo = `👁️ Status Detector: ✅ ACTIVE\n`;
                    statusDetectorInfo += `📊 Detected: ${stats.totalDetected} statuses\n`;
                    statusDetectorInfo += `🕒 Last: ${stats.lastDetection}\n`;
                }
                
                let memberDetectorInfo = '';
                if (memberDetector) {
                    const memberStats = memberDetector.getStats();
                    memberDetectorInfo = `👥 Member Detector: ✅ ACTIVE\n`;
                    memberDetectorInfo += `📊 Events: ${memberStats.totalEvents}\n`;
                    memberDetectorInfo += `📈 Groups: ${memberStats.totalGroups}\n`;
                }
                
                let antiviewonceInfo = '';
                if (antiViewOnceSystem) {
                    const antiviewonceStats = antiViewOnceSystem.getStats();
                    antiviewonceInfo = `🔐 Anti-ViewOnce: ✅ ACTIVE\n`;
                    antiviewonceInfo += `📊 Captured: ${antiviewonceStats.total} media\n`;
                    antiviewonceInfo += `🎯 Mode: ${antiviewonceStats.mode}\n`;
                    antiviewonceInfo += `💾 Size: ${antiviewonceStats.totalSizeKB}KB\n`;
                }
                
                await sock.sendMessage(chatId, {
                    text: `⏰ *UPTIME*\n\n${hours}h ${minutes}m ${seconds}s\n📊 Commands: ${commands.size}\n👑 Owner: +${ownerInfo.ownerNumber}\n💬 Prefix: "${isPrefixless ? 'none (prefixless)' : currentPrefix}"\n🎛️ Mode: ${BOT_MODE}\n${statusDetectorInfo}${memberDetectorInfo}${antiviewonceInfo}`
                }, { quoted: msg });
                break;
                
            case 'statusstats':
                if (statusDetector) {
                    const stats = statusDetector.getStats();
                    const recent = statusDetector.statusLogs.slice(-3).reverse();
                    
                    let statsText = `📊 *STATUS DETECTION STATS*\n\n`;
                    statsText += `🔍 Status: ✅ ACTIVE\n`;
                    statsText += `📈 Total detected: ${stats.totalDetected}\n`;
                    statsText += `🕒 Last detection: ${stats.lastDetection}\n\n`;
                    
                    if (recent.length > 0) {
                        statsText += `📱 *Recent Statuses:*\n`;
                        recent.forEach((status, index) => {
                            statsText += `${index + 1}. ${status.sender}: ${status.type} (${new Date(status.timestamp).toLocaleTimeString()})\n`;
                        });
                    }
                    
                    await sock.sendMessage(chatId, { text: statsText }, { quoted: msg });
                } else {
                    await sock.sendMessage(chatId, { 
                        text: '❌ Status detector not initialized.'
                    }, { quoted: msg });
                }
                break;
                
            case 'members':
            case 'memberstats':
                if (memberDetector) {
                    const stats = memberDetector.getStats();
                    
                    let membersText = `👥 *MEMBER DETECTION STATS*\n\n`;
                    membersText += `🔍 Status: ${stats.enabled ? '✅ ACTIVE' : '❌ DISABLED'}\n`;
                    membersText += `📈 Total events: ${stats.totalEvents}\n`;
                    membersText += `👥 Groups monitored: ${stats.totalGroups}\n`;
                    membersText += `📊 Groups cached: ${stats.cachedGroups}\n\n`;
                    
                    membersText += `🎯 *Features:*\n`;
                    membersText += `• Auto-detect new members\n`;
                    membersText += `• Terminal notifications\n`;
                    membersText += `• Welcome message system\n`;
                    membersText += `• Profile picture support\n`;
                    
                    await sock.sendMessage(chatId, { text: membersText }, { quoted: msg });
                } else {
                    await sock.sendMessage(chatId, { 
                        text: '❌ Member detector not initialized.'
                    }, { quoted: msg });
                }
                break;
                
            case 'welcomeset':
            case 'welcomeconfig':
                const welcomeText = `🎉 *WELCOME SYSTEM CONFIGURATION*\n\n` +
                                  `The welcome system is automatically enabled!\n\n` +
                                  `*How it works:*\n` +
                                  `1. Bot detects new members in groups\n` +
                                  `2. Sends welcome message with profile picture\n` +
                                  `3. Mentions the new member\n` +
                                  `4. Shows terminal notification\n\n` +
                                  `*Default Welcome Message:*\n` +
                                  `"🎉 Welcome {name} to {group}! 🎊\n\n` +
                                  `We're now {members} members strong! 💪\n\n` +
                                  `Please read the group rules and enjoy your stay! 😊"\n\n` +
                                  `*Variables:*\n` +
                                  `{name} - Member's name\n` +
                                  `{group} - Group name\n` +
                                  `{members} - Total members\n` +
                                  `{mention} - Mention the member\n\n` +
                                  `*Note:* System runs automatically in background!`;
                
                await sock.sendMessage(chatId, { text: welcomeText }, { quoted: msg });
                break;
        
            case 'ultimatefix':
            case 'solveowner':
            case 'fixall':
                const fixSenderJid = msg.key.participant || chatId;
                const fixCleaned = jidManager.cleanJid(fixSenderJid);
                
                if (!jidManager.isOwner(msg) && !msg.key.fromMe) {
                    await sock.sendMessage(chatId, {
                        text: '❌ *Owner Only Command*'
                    }, { quoted: msg });
                    return;
                }
                
                const fixResult = await ultimateFixSystem.applyUltimateFix(sock, fixSenderJid, fixCleaned, false);
                
                if (fixResult.success) {
                    await sock.sendMessage(chatId, {
                        text: `✅ *ULTIMATE FIX APPLIED*\n\nYou should now have full owner access!`
                    }, { quoted: msg });
                } else {
                    await sock.sendMessage(chatId, {
                        text: `❌ *Ultimate Fix Failed*`
                    }, { quoted: msg });
                }
                break;
                
            case 'prefixinfo':
                const prefixFiles = {
                    'bot_settings.json': fs.existsSync('./bot_settings.json'),
                    'prefix_config.json': fs.existsSync('./prefix_config.json')
                };
                
                let infoText = `⚡ *PREFIX INFORMATION*\n\n`;
                infoText += `📝 Current Prefix: *${isPrefixless ? 'none (prefixless)' : currentPrefix}*\n`;
                infoText += `⚙️ Default Prefix: ${DEFAULT_PREFIX}\n`;
                infoText += `🌐 Global Prefix: ${global.prefix || 'Not set'}\n`;
                infoText += `📁 ENV Prefix: ${process.env.PREFIX || 'Not set'}\n`;
                infoText += `🎯 Prefixless Mode: ${isPrefixless ? '✅ ENABLED' : '❌ DISABLED'}\n\n`;
                
                infoText += `📋 *File Status:*\n`;
                for (const [fileName, exists] of Object.entries(prefixFiles)) {
                    infoText += `├─ ${fileName}: ${exists ? '✅' : '❌'}\n`;
                }
                
                infoText += `\n💡 *Changes are saved and persist after restart!*`;
                
                await sock.sendMessage(chatId, { text: infoText }, { quoted: msg });
                break;
                
            case 'defib':
            case 'defibrillator':
            case 'heartbeat':
                if (!jidManager.isOwner(msg)) {
                    await sock.sendMessage(chatId, {
                        text: '❌ *Owner Only Command*'
                    }, { quoted: msg });
                    return;
                }
                
                const stats = defibrillator.getStats();
                const memoryUsage = process.memoryUsage();
                const memoryMB = Math.round(memoryUsage.rss / 1024 / 1024);
                
                const memberStats = memberDetector ? memberDetector.getStats() : null;
                
                const antiviewonceStats = antiViewOnceSystem ? antiViewOnceSystem.getStats() : null;
                
                let defibText = `🩺 *${BOT_NAME} DEFIBRILLATOR STATUS*\n\n`;
                defibText += `📊 *Monitoring:* ${stats.isMonitoring ? '✅ ACTIVE' : '❌ INACTIVE'}\n`;
                defibText += `💓 *Heartbeats:* ${stats.heartbeatCount}\n`;
                defibText += `🔁 *Restarts:* ${stats.restartCount}\n`;
                defibText += `📨 *Commands:* ${stats.totalCommands}\n`;
                defibText += `❌ *Failed:* ${stats.failedCommands}\n`;
                defibText += `💾 *Memory:* ${memoryMB}MB\n`;
                defibText += `👥 *Member Events:* ${memberStats ? memberStats.totalEvents : 0}\n`;
                defibText += `🔐 *ViewOnce Captures:* ${antiviewonceStats ? antiviewonceStats.total : 0}\n`;
                defibText += `⏰ *Last Command:* ${stats.lastCommand}\n`;
                defibText += `📨 *Last Message:* ${stats.lastMessage}\n`;
                defibText += `🕒 *Uptime:* ${stats.uptime}s\n\n`;
                
                defibText += `⚡ *Features:*\n`;
                defibText += `├─ Terminal Heartbeat: Every 10s\n`;
                defibText += `├─ Owner Reports: Every 1m\n`;
                defibText += `├─ Auto Health Checks: Every 15s\n`;
                defibText += `├─ Memory Monitoring: Active\n`;
                defibText += `├─ Member Detection: ${memberDetector ? '✅ ACTIVE' : '❌ INACTIVE'}\n`;
                defibText += `├─ Anti-ViewOnce: ${antiViewOnceSystem ? '✅ ACTIVE' : '❌ INACTIVE'}\n`;
                defibText += `├─ Auto-restart: Enabled\n`;
                defibText += `└─ Command Tracking: Active\n\n`;
                
                defibText += `🎯 *Status:* ${defibrillator.isMonitoring ? '🟢 HEALTHY' : '🔴 INACTIVE'}`;
                
                await sock.sendMessage(chatId, { text: defibText }, { quoted: msg });
                break;
                
            case 'defibrestart':
            case 'forcerestart':
                if (!jidManager.isOwner(msg)) {
                    await sock.sendMessage(chatId, {
                        text: '❌ *Owner Only Command*'
                    }, { quoted: msg });
                    return;
                }
                
                await sock.sendMessage(chatId, {
                    text: '🔄 *Initiating forced restart...*\n\nBot will restart in 5 seconds.'
                }, { quoted: msg });
                
                setTimeout(() => {
                    defibrillator.restartBot(sock, 'Manual restart by owner');
                }, 5000);
                break;
        }
    } catch (error) {
        UltraCleanLogger.error(`Default command error: ${error.message}`);
    }
}

// // ====== MAIN APPLICATION ======
// // ====== MAIN APPLICATION ======
// // ====== MAIN APPLICATION ======
// async function main() {
//     try {
//         UltraCleanLogger.success(`🚀 Starting ${BOT_NAME} v${VERSION} (PREFIXLESS & MEMBER DETECTION & ANTI-VIEWONCE)`);
//         UltraCleanLogger.info(`Loaded prefix: "${isPrefixless ? 'none (prefixless)' : getCurrentPrefix()}"`);
//         UltraCleanLogger.info(`Prefixless mode: ${isPrefixless ? '✅ ENABLED' : '❌ DISABLED'}`);
//         UltraCleanLogger.info(`Auto-connect on link: ${AUTO_CONNECT_ON_LINK ? '✅' : '❌'}`);
//         UltraCleanLogger.info(`Auto-connect on start: ${AUTO_CONNECT_ON_START ? '✅' : '❌'}`);
//         UltraCleanLogger.info(`Rate limit protection: ${RATE_LIMIT_ENABLED ? '✅' : '❌'}`);
//         UltraCleanLogger.info(`Console filtering: ✅ ULTRA CLEAN ACTIVE`);
//         UltraCleanLogger.info(`⚡ Response speed: OPTIMIZED (Reduced delays by 50-70%)`);
//         UltraCleanLogger.info(`🔐 Session ID support: ✅ ENABLED (WOLF-BOT: format)`);
//         UltraCleanLogger.info(`🎯 Member Detection: ✅ ENABLED (New members in groups)`);
//         UltraCleanLogger.info(`🔐 Anti-ViewOnce: ✅ ENABLED (Private/Auto modes)`);
//         UltraCleanLogger.info(`👥 Welcome System: ✅ ENABLED (Auto-welcome new members)`);
//         UltraCleanLogger.info(`🎯 Background processes: ✅ ENABLED`);

//         // ====== AGGRESSIVE AUTO-RECONNECT LOGIC ======
//         // 1. First try to load existing session directory
//         const sessionDirExists = fs.existsSync(SESSION_DIR);
//         const credsExist = fs.existsSync(path.join(SESSION_DIR, 'creds.json'));
        
//         if (sessionDirExists && credsExist) {
//             UltraCleanLogger.success('🔐 Found session directory with creds.json, attempting auto-reconnect...');
            
//             try {
//                 // Try to read the session file
//                 const sessionData = JSON.parse(fs.readFileSync(path.join(SESSION_DIR, 'creds.json'), 'utf8'));
                
//                 // Check for basic required fields (more lenient check)
//                 if (sessionData && (sessionData.noiseKey || sessionData.signedIdentityKey || sessionData.creds)) {
//                     UltraCleanLogger.success('✅ Session file looks valid, auto-connecting...');
//                     await startBot('auto', null);
//                     return;
//                 } else {
//                     UltraCleanLogger.warning('⚠️ Session file exists but may be corrupted');
//                 }
//             } catch (sessionError) {
//                 UltraCleanLogger.error(`❌ Error loading session: ${sessionError.message}`);
//             }
//         }
        
//         // 2. Check for SESSION_ID in .env as secondary option
//         const sessionIdFromEnv = process.env.SESSION_ID;
//         const hasEnvSession = sessionIdFromEnv && sessionIdFromEnv.trim() !== '';
        
//         if (hasEnvSession) {
//             UltraCleanLogger.info('🔐 Found SESSION_ID in .env, attempting auto-login...');
            
//             try {
//                 const sessionData = parseWolfBotSession(sessionIdFromEnv);
//                 if (sessionData) {
//                     UltraCleanLogger.success('✅ Valid session ID found in .env, auto-connecting...');
//                     await startBot('session', sessionIdFromEnv);
//                     return;
//                 }
//             } catch (error) {
//                 UltraCleanLogger.warning(`❌ Session ID validation failed: ${error.message}`);
//             }
//         }
        
//         // 3. If no session found, check if we should attempt pairing with saved phone
//         const ownerFileExists = fs.existsSync(OWNER_FILE);
//         if (ownerFileExists) {
//             try {
//                 const ownerData = JSON.parse(fs.readFileSync(OWNER_FILE, 'utf8'));
//                 if (ownerData.OWNER_NUMBER) {
//                     UltraCleanLogger.info(`📱 Found saved owner number: ${ownerData.OWNER_NUMBER}, attempting to reconnect...`);
                    
//                     // Try to reconnect with saved phone number
//                     await startBot('pair', ownerData.OWNER_NUMBER);
//                     return;
//                 }
//             } catch (error) {
//                 UltraCleanLogger.warning(`Could not load owner data: ${error.message}`);
//             }
//         }
        
//         // 4. If all else fails, show login options
//         UltraCleanLogger.info('📱 No valid session found, showing login options...');
//         const loginManager = new LoginManager();
//         const loginInfo = await loginManager.selectMode();
//         loginManager.close();
        
//         const loginData = loginInfo.mode === 'session' ? loginInfo.sessionId : loginInfo.phone;
//         await startBot(loginInfo.mode, loginData);
        
//     } catch (error) {
//         UltraCleanLogger.error(`Main error: ${error.message}`);
//         setTimeout(async () => {
//             await main();
//         }, 8000);
//     }
// }







// ====== MAIN APPLICATION ======
// ====== MAIN APPLICATION ======
async function main() {
    try {
        UltraCleanLogger.success(`🚀 Starting ${BOT_NAME} v${VERSION} (PREFIXLESS & MEMBER DETECTION & ANTI-VIEWONCE)`);
        
        // ====== HEROKU INITIALIZATION ======
        UltraCleanLogger.info(`🌐 Environment: ${process.env.NODE_ENV || 'production'}`);
        UltraCleanLogger.info(`🔧 Platform: ${detectPlatform()}`);
        
        // Initialize Heroku systems
        setupHerokuHealthCheck();
        setupHerokuKeepAlive();
        
        // ====== HEROKU DETECTION & SETUP ======
        //const isHeroku = process.env.HEROKU || process.env.DYNO || false;
        // ====== HEROKU DETECTION & SETUP ======
const isHeroku = process.env.HEROKU_APP_NAME || process.env.DYNO || process.env.HEROKU_API_KEY || false;
        const herokuSessionId = process.env.SESSION_ID;
        
        if (isHeroku) {
            UltraCleanLogger.info(`🏗️ Platform: Heroku`);
            UltraCleanLogger.info(`📦 Dyno: ${process.env.DYNO || 'Unknown'}`);
            
            // Check if we have SESSION_ID from Heroku Config Vars
            if (herokuSessionId && herokuSessionId.trim() !== '') {
                UltraCleanLogger.success('🔐 Heroku SESSION_ID detected');
                
                // Setup Heroku session automatically
                const herokuSetupSuccess = setupHerokuSession();
                
                if (herokuSetupSuccess) {
                    UltraCleanLogger.success('✅ Heroku session configured successfully');
                    UltraCleanLogger.info('🔄 Starting bot with Heroku session...');
                    
                    // Auto-start with Heroku session
                    await startBot('auto', null);
                    return;
                } else {
                    UltraCleanLogger.warning('⚠️ Heroku session setup failed, falling back to normal login');
                }
            } else {
                UltraCleanLogger.warning('⚠️ Heroku detected but no SESSION_ID found');
                UltraCleanLogger.info('💡 Add SESSION_ID to Heroku Config Vars for auto-login');
            }
        }
        
        // Show bot features
        UltraCleanLogger.info(`Loaded prefix: "${isPrefixless ? 'none (prefixless)' : getCurrentPrefix()}"`);
        UltraCleanLogger.info(`Prefixless mode: ${isPrefixless ? '✅ ENABLED' : '❌ DISABLED'}`);
        UltraCleanLogger.info(`Auto-connect on link: ${AUTO_CONNECT_ON_LINK ? '✅' : '❌'}`);
        UltraCleanLogger.info(`Auto-connect on start: ${AUTO_CONNECT_ON_START ? '✅' : '❌'}`);
        UltraCleanLogger.info(`Rate limit protection: ${RATE_LIMIT_ENABLED ? '✅' : '❌'}`);
        UltraCleanLogger.info(`Console filtering: ✅ ULTRA CLEAN ACTIVE`);
        UltraCleanLogger.info(`⚡ Response speed: OPTIMIZED (Reduced delays by 50-70%)`);
        UltraCleanLogger.info(`🔐 Session ID support: ✅ ENABLED (WOLF-BOT: format)`);
        UltraCleanLogger.info(`🎯 Member Detection: ✅ ENABLED (New members in groups)`);
        UltraCleanLogger.info(`🔐 Anti-ViewOnce: ✅ ENABLED (Private/Auto modes)`);
        UltraCleanLogger.info(`👥 Welcome/Goodbye System: ✅ AVAILABLE (Off by default, enable per-group)`);
        UltraCleanLogger.info(`🎯 Background processes: ✅ ENABLED`);
        
        // ====== AUTO-RECONNECT LOGIC ======
        // 1. First try SESSION_ID from .env (works on any platform)
        const sessionIdFromEnv = process.env.SESSION_ID;
        const hasEnvSession = sessionIdFromEnv && sessionIdFromEnv.trim() !== '';
        
        if (hasEnvSession) {
            UltraCleanLogger.info('🔐 Found SESSION_ID in environment, processing...');
            try {
                const parsedSession = parseWolfBotSession(sessionIdFromEnv);
                if (parsedSession) {
                    ensureSessionDir();
                    const credsPath = path.join(SESSION_DIR, 'creds.json');
                    fs.writeFileSync(credsPath, JSON.stringify(parsedSession, null, 2));
                    UltraCleanLogger.success('✅ Session ID applied to creds.json, auto-connecting...');
                    await startBot('auto', null);
                    return;
                }
            } catch (error) {
                UltraCleanLogger.warning(`⚠️ SESSION_ID parsing failed: ${error.message}`);
            }
        }
        
        // 2. Try existing session directory with creds.json
        const sessionDirExists = fs.existsSync(SESSION_DIR);
        const credsExist = fs.existsSync(path.join(SESSION_DIR, 'creds.json'));
        
        if (sessionDirExists && credsExist) {
            UltraCleanLogger.success('🔐 Found existing session, attempting auto-reconnect...');
            
            try {
                const sessionData = JSON.parse(fs.readFileSync(path.join(SESSION_DIR, 'creds.json'), 'utf8'));
                
                if (sessionData && (sessionData.noiseKey || sessionData.signedIdentityKey || sessionData.creds)) {
                    UltraCleanLogger.success('✅ Session file valid, auto-connecting...');
                    await startBot('auto', null);
                    return;
                } else {
                    UltraCleanLogger.warning('⚠️ Session file exists but may be corrupted');
                }
            } catch (sessionError) {
                UltraCleanLogger.error(`❌ Error loading session: ${sessionError.message}`);
            }
        }
        
        // 3. Check for saved owner number to attempt pairing
        const ownerFileExists = fs.existsSync(OWNER_FILE);
        if (ownerFileExists) {
            try {
                const ownerData = JSON.parse(fs.readFileSync(OWNER_FILE, 'utf8'));
                if (ownerData.OWNER_NUMBER) {
                    UltraCleanLogger.info(`📱 Found saved owner number: ${ownerData.OWNER_NUMBER}, attempting to reconnect...`);
                    await startBot('pair', ownerData.OWNER_NUMBER);
                    return;
                }
            } catch (error) {
                UltraCleanLogger.warning(`Could not load owner data: ${error.message}`);
            }
        }
        
        // 4. If all else fails, show login options (skip on Heroku)
        if (isHeroku) {
            UltraCleanLogger.error('❌ Heroku deployment failed: No valid session found');
            UltraCleanLogger.info('💡 Please add a valid SESSION_ID to Heroku Config Vars');
            setInterval(() => {
                UltraCleanLogger.warning('⏳ Waiting for valid session configuration...');
            }, 30000);
            return;
        }
        
        // 5. Show login options for interactive environments
        UltraCleanLogger.info('📱 No valid session found, showing login options...');
        const loginManager = new LoginManager();
        const loginInfo = await loginManager.selectMode();
        loginManager.close();
        
        const loginData = loginInfo.mode === 'session' ? loginInfo.sessionId : loginInfo.phone;
        await startBot(loginInfo.mode, loginData);
        
    } catch (error) {
        UltraCleanLogger.error(`Main error: ${error.message}`);
        
        // Handle restarts based on platform
        if (process.env.HEROKU) {
            // Longer delay on Heroku to avoid rapid restarts
            UltraCleanLogger.warning('🔄 Heroku restart scheduled in 30 seconds...');
            setTimeout(async () => {
                await main();
            }, 30000);
        } else {
            // Faster restart for local/panel deployments
            UltraCleanLogger.warning('🔄 Restarting in 8 seconds...');
            setTimeout(async () => {
                await main();
            }, 8000);
        }
    }
}
// ====== PROCESS HANDLERS ======
process.on('SIGINT', () => {
    console.log(chalk.yellow('\n👋 Shutting down gracefully...'));
    stopHeartbeat();
    
    if (defibrillator) {
        defibrillator.stopMonitoring();
    }
    
    if (SOCKET_INSTANCE) SOCKET_INSTANCE.ws.close();
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    UltraCleanLogger.error(`Uncaught exception: ${error.message}`);
    UltraCleanLogger.error(error.stack);
});

process.on('unhandledRejection', (error) => {
    UltraCleanLogger.error(`Unhandled rejection: ${error.message}`);
});

// Start the bot
main().catch((error) => {
    UltraCleanLogger.critical(`Fatal error: ${error.message}`);
    process.exit(1);
});













