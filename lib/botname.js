import { readFileSync, writeFileSync, existsSync } from 'fs';

const BOT_NAME_FILE = './bot_name.json';
let _cachedName = null;
let _cacheTime = 0;
const CACHE_TTL = 5000;

function readBotNameFile() {
    try {
        if (existsSync(BOT_NAME_FILE)) {
            const data = JSON.parse(readFileSync(BOT_NAME_FILE, 'utf8'));
            if (data.botName && data.botName.trim()) {
                return data.botName.trim();
            }
        }
    } catch {}
    return null;
}

export function getBotName() {
    const now = Date.now();
    if (_cachedName && (now - _cacheTime) < CACHE_TTL) {
        return _cachedName;
    }

    if (global.BOT_NAME && global.BOT_NAME.trim()) {
        _cachedName = global.BOT_NAME.trim();
        _cacheTime = now;
        return _cachedName;
    }

    if (process.env.BOT_NAME && process.env.BOT_NAME.trim()) {
        _cachedName = process.env.BOT_NAME.trim();
        _cacheTime = now;
        return _cachedName;
    }

    const fromFile = readBotNameFile();
    if (fromFile) {
        _cachedName = fromFile;
        _cacheTime = now;
        global.BOT_NAME = fromFile;
        return _cachedName;
    }

    try {
        if (existsSync('./bot_settings.json')) {
            const settings = JSON.parse(readFileSync('./bot_settings.json', 'utf8'));
            if (settings.botName && settings.botName.trim()) {
                _cachedName = settings.botName.trim();
                _cacheTime = now;
                return _cachedName;
            }
        }
    } catch {}

    _cachedName = 'WOLFBOT';
    _cacheTime = now;
    return _cachedName;
}

export function clearBotNameCache() {
    _cachedName = null;
    _cacheTime = 0;
}

export function saveBotName(name) {
    try {
        writeFileSync(BOT_NAME_FILE, JSON.stringify({ botName: name, updatedAt: new Date().toISOString() }, null, 2));
        global.BOT_NAME = name;
        _cachedName = name;
        _cacheTime = Date.now();
        return true;
    } catch (err) {
        console.warn('⚠️ Could not save bot name to file:', err.message);
        return false;
    }
}

export function loadBotName() {
    const name = readBotNameFile();
    if (name) {
        global.BOT_NAME = name;
        _cachedName = name;
        _cacheTime = Date.now();
        console.log(`✅ Bot name loaded from bot_name.json: "${name}"`);
        return name;
    }
    return null;
}
