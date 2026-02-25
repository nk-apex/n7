import { readFileSync, existsSync } from 'fs';

let _cachedName = null;
let _cacheTime = 0;
const CACHE_TTL = 5000;

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
