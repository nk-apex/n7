import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './supabase.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data', 'warnings');
const warningsFile = path.join(DATA_DIR, 'warnings.json');
const limitsFile = path.join(DATA_DIR, 'limits.json');

function ensureFiles() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(warningsFile)) fs.writeFileSync(warningsFile, '{}');
    if (!fs.existsSync(limitsFile)) fs.writeFileSync(limitsFile, '{}');
}

function loadWarningsLocal() {
    try {
        ensureFiles();
        return JSON.parse(fs.readFileSync(warningsFile, 'utf8'));
    } catch {
        return {};
    }
}

function saveWarningsLocal(data) {
    ensureFiles();
    fs.writeFileSync(warningsFile, JSON.stringify(data, null, 2));
}

function loadLimitsLocal() {
    try {
        ensureFiles();
        return JSON.parse(fs.readFileSync(limitsFile, 'utf8'));
    } catch {
        return {};
    }
}

function saveLimitsLocal(data) {
    ensureFiles();
    fs.writeFileSync(limitsFile, JSON.stringify(data, null, 2));
}

export function getWarnLimit(groupJid) {
    if (db.isAvailable()) {
        (async () => {})();
    }
    const limits = loadLimitsLocal();
    return limits[groupJid] || 3;
}

export async function getWarnLimitAsync(groupJid) {
    if (db.isAvailable()) {
        const row = await db.get('warning_limits', groupJid, 'group_id');
        if (row) return row.max_warnings || 3;
    }
    return loadLimitsLocal()[groupJid] || 3;
}

export function setWarnLimit(groupJid, limit) {
    const limits = loadLimitsLocal();
    limits[groupJid] = limit;
    saveLimitsLocal(limits);

    if (db.isAvailable()) {
        db.upsert('warning_limits', {
            group_id: groupJid,
            max_warnings: limit,
            updated_at: new Date().toISOString()
        }, 'group_id').catch(() => {});
    }
}

export function getWarnings(groupJid, userJid) {
    const data = loadWarningsLocal();
    const key = `${groupJid}:${userJid}`;
    return data[key] || 0;
}

export async function getWarningsAsync(groupJid, userJid) {
    if (db.isAvailable()) {
        const row = await db.get('warnings', null);
        const rows = await db.getAll('warnings', { group_id: groupJid, user_id: userJid });
        if (rows && rows.length > 0) return rows[0].count || 0;
    }
    const data = loadWarningsLocal();
    return data[`${groupJid}:${userJid}`] || 0;
}

export function addWarning(groupJid, userJid) {
    const data = loadWarningsLocal();
    const key = `${groupJid}:${userJid}`;
    data[key] = (data[key] || 0) + 1;
    saveWarningsLocal(data);

    if (db.isAvailable()) {
        db.upsert('warnings', {
            group_id: groupJid,
            user_id: userJid,
            count: data[key],
            updated_at: new Date().toISOString()
        }, 'group_id,user_id').catch(() => {});
    }

    return data[key];
}

export function resetWarnings(groupJid, userJid) {
    const data = loadWarningsLocal();
    const key = `${groupJid}:${userJid}`;
    const had = data[key] > 0;
    delete data[key];
    saveWarningsLocal(data);

    if (db.isAvailable()) {
        db.removeWhere('warnings', { group_id: groupJid, user_id: userJid }).catch(() => {});
    }

    return had;
}

export function resetAllGroupWarnings(groupJid) {
    const data = loadWarningsLocal();
    let count = 0;
    for (const key of Object.keys(data)) {
        if (key.startsWith(groupJid + ':')) {
            delete data[key];
            count++;
        }
    }
    saveWarningsLocal(data);

    if (db.isAvailable()) {
        db.removeWhere('warnings', { group_id: groupJid }).catch(() => {});
    }

    return count;
}

export function getGroupWarnings(groupJid) {
    const data = loadWarningsLocal();
    const result = [];
    for (const [key, count] of Object.entries(data)) {
        if (key.startsWith(groupJid + ':')) {
            const userJid = key.split(':').slice(1).join(':');
            result.push({ userJid, count });
        }
    }
    return result;
}

export async function getGroupWarningsAsync(groupJid) {
    if (db.isAvailable()) {
        const rows = await db.getAll('warnings', { group_id: groupJid });
        if (rows && rows.length > 0) {
            return rows.map(r => ({ userJid: r.user_id, count: r.count }));
        }
    }
    return getGroupWarnings(groupJid);
}

export function getGlobalWarnLimit() {
    try {
        const globalFile = path.join(DATA_DIR, '..', 'warnlimit.json');
        if (fs.existsSync(globalFile)) {
            const data = JSON.parse(fs.readFileSync(globalFile, 'utf8'));
            return data.limit || 3;
        }
    } catch {}
    return 3;
}

export async function migrateWarningsToSupabase() {
    if (!db.isAvailable()) return false;
    try {
        const warnings = loadWarningsLocal();
        for (const [key, count] of Object.entries(warnings)) {
            const [groupJid, ...userParts] = key.split(':');
            const userJid = userParts.join(':');
            await db.upsert('warnings', {
                group_id: groupJid,
                user_id: userJid,
                count,
                updated_at: new Date().toISOString()
            }, 'group_id,user_id');
        }

        const limits = loadLimitsLocal();
        for (const [groupJid, limit] of Object.entries(limits)) {
            await db.upsert('warning_limits', {
                group_id: groupJid,
                max_warnings: limit,
                updated_at: new Date().toISOString()
            }, 'group_id');
        }

        console.log(`✅ Supabase: Migrated ${Object.keys(warnings).length} warnings, ${Object.keys(limits).length} limits`);
        return true;
    } catch (err) {
        console.error('⚠️ Supabase: Warning migration error:', err.message);
        return false;
    }
}
