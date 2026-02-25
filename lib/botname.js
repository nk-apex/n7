import { readFileSync, existsSync } from 'fs';

let _cachedName = null;
let _cacheTime = 0;
const CACHE_TTL = 5000;
let _supabaseLoaded = false;

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

export async function loadBotNameFromDB() {
    try {
        const supabase = await import('./supabase.js');
        const db = supabase.default || supabase;
        if (!db.isAvailable || !db.isAvailable()) return;
        const config = await db.getConfig('bot_name', null);
        if (config && typeof config === 'string' && config.trim()) {
            const name = config.trim();
            global.BOT_NAME = name;
            _cachedName = name;
            _cacheTime = Date.now();
            console.log(`✅ Bot name loaded from database: "${name}"`);
            return name;
        }
        if (config && typeof config === 'object' && config.name && config.name.trim()) {
            const name = config.name.trim();
            global.BOT_NAME = name;
            _cachedName = name;
            _cacheTime = Date.now();
            console.log(`✅ Bot name loaded from database: "${name}"`);
            return name;
        }
    } catch (err) {
        console.warn('⚠️ Could not load bot name from database:', err.message);
    }
    return null;
}

export async function saveBotNameToDB(name) {
    try {
        const supabase = await import('./supabase.js');
        const db = supabase.default || supabase;
        if (!db.isAvailable || !db.isAvailable()) return false;
        await db.setConfig('bot_name', name);
        return true;
    } catch (err) {
        console.warn('⚠️ Could not save bot name to database:', err.message);
        return false;
    }
}
