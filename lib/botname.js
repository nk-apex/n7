import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const BOT_NAME_FILE = join(PROJECT_ROOT, 'bot_name.json');
let _cachedName = null;
let _cacheTime = 0;
const CACHE_TTL = 5000;
const SUPABASE_KEY = 'bot_name';

let _supabase = null;
async function getSupabase() {
    if (_supabase) return _supabase;
    try {
        _supabase = await import('./supabase.js').then(m => m.default || m);
    } catch {
        _supabase = null;
    }
    return _supabase;
}

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

    const fromFile = readBotNameFile();
    if (fromFile) {
        _cachedName = fromFile;
        _cacheTime = now;
        global.BOT_NAME = fromFile;
        return _cachedName;
    }

    if (process.env.BOT_NAME && process.env.BOT_NAME.trim()) {
        _cachedName = process.env.BOT_NAME.trim();
        _cacheTime = now;
        return _cachedName;
    }

    try {
        if (existsSync(join(PROJECT_ROOT, 'bot_settings.json'))) {
            const settings = JSON.parse(readFileSync(join(PROJECT_ROOT, 'bot_settings.json'), 'utf8'));
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
    } catch (err) {
        console.warn('⚠️ Could not save bot name to file:', err.message);
    }
    global.BOT_NAME = name;
    _cachedName = name;
    _cacheTime = Date.now();
    saveBotNameToSupabase(name);
    return true;
}

async function saveBotNameToSupabase(name) {
    try {
        const db = await getSupabase();
        if (db && typeof db.upsert === 'function' && db.isAvailable()) {
            await db.upsert('bot_configs', {
                key: SUPABASE_KEY,
                value: JSON.stringify({ botName: name, updatedAt: new Date().toISOString() }),
                bot_id: 'global',
                updated_at: new Date().toISOString()
            }, 'key,bot_id');
            console.log(`✅ Bot name synced to Supabase: "${name}"`);
        }
    } catch (err) {
        console.warn('⚠️ Could not sync bot name to Supabase:', err.message);
    }
}

export async function loadBotNameFromSupabase() {
    try {
        const db = await getSupabase();
        if (db && typeof db.getAll === 'function' && db.isAvailable()) {
            const rows = await db.getAll('bot_configs', { key: SUPABASE_KEY, bot_id: 'global' });
            const row = Array.isArray(rows) ? rows[0] : rows;
            if (row && row.value) {
                const parsed = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
                if (parsed?.botName && parsed.botName.trim()) {
                    const name = parsed.botName.trim();
                    _cachedName = name;
                    _cacheTime = Date.now();
                    global.BOT_NAME = name;
                    try {
                        writeFileSync(BOT_NAME_FILE, JSON.stringify({ botName: name, updatedAt: parsed.updatedAt || new Date().toISOString() }, null, 2));
                    } catch {}
                    console.log(`✅ Bot name loaded from Supabase: "${name}"`);
                    return name;
                }
            }
        }
    } catch (err) {
        console.warn('⚠️ Could not load bot name from Supabase:', err.message);
    }
    return null;
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
