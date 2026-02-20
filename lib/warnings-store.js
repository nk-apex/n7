import db from './supabase.js';

let warningsCache = {};
let limitsCache = {};

export async function initWarnings() {
    if (!db.isAvailable()) return;
    try {
        const warnings = await db.getAll('warnings', {});
        if (warnings) {
            warningsCache = {};
            for (const row of warnings) {
                const key = `${row.group_id}:${row.user_id}`;
                warningsCache[key] = row.count || 0;
            }
        }

        const limits = await db.getAll('warning_limits', {});
        if (limits) {
            limitsCache = {};
            for (const row of limits) {
                limitsCache[row.group_id] = row.max_warnings || 3;
            }
        }

        console.log(`✅ Warnings: Loaded ${Object.keys(warningsCache).length} warnings, ${Object.keys(limitsCache).length} limits from DB`);
    } catch (err) {
        console.error('⚠️ Warnings: Failed to load from DB:', err.message);
    }
}

export function getWarnLimit(groupJid) {
    return limitsCache[groupJid] || 3;
}

export async function getWarnLimitAsync(groupJid) {
    if (db.isAvailable()) {
        const row = await db.get('warning_limits', groupJid, 'group_id');
        if (row) return row.max_warnings || 3;
    }
    return limitsCache[groupJid] || 3;
}

export function setWarnLimit(groupJid, limit) {
    limitsCache[groupJid] = limit;

    if (db.isAvailable()) {
        db.upsert('warning_limits', {
            group_id: groupJid,
            max_warnings: limit,
            updated_at: new Date().toISOString()
        }, 'group_id').catch(() => {});
    }
}

export function getWarnings(groupJid, userJid) {
    const key = `${groupJid}:${userJid}`;
    return warningsCache[key] || 0;
}

export async function getWarningsAsync(groupJid, userJid) {
    if (db.isAvailable()) {
        const rows = await db.getAll('warnings', { group_id: groupJid, user_id: userJid });
        if (rows && rows.length > 0) return rows[0].count || 0;
    }
    return warningsCache[`${groupJid}:${userJid}`] || 0;
}

export function addWarning(groupJid, userJid) {
    const key = `${groupJid}:${userJid}`;
    warningsCache[key] = (warningsCache[key] || 0) + 1;

    if (db.isAvailable()) {
        db.upsert('warnings', {
            group_id: groupJid,
            user_id: userJid,
            count: warningsCache[key],
            updated_at: new Date().toISOString()
        }, 'group_id,user_id').catch(() => {});
    }

    return warningsCache[key];
}

export function resetWarnings(groupJid, userJid) {
    const key = `${groupJid}:${userJid}`;
    const had = warningsCache[key] > 0;
    delete warningsCache[key];

    if (db.isAvailable()) {
        db.removeWhere('warnings', { group_id: groupJid, user_id: userJid }).catch(() => {});
    }

    return had;
}

export function resetAllGroupWarnings(groupJid) {
    let count = 0;
    for (const key of Object.keys(warningsCache)) {
        if (key.startsWith(groupJid + ':')) {
            delete warningsCache[key];
            count++;
        }
    }

    if (db.isAvailable()) {
        db.removeWhere('warnings', { group_id: groupJid }).catch(() => {});
    }

    return count;
}

export function getGroupWarnings(groupJid) {
    const result = [];
    for (const [key, count] of Object.entries(warningsCache)) {
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

export async function getGlobalWarnLimit() {
    return await db.getConfig('global_warn_limit', 3);
}

export async function migrateWarningsToSupabase() {
    if (!db.isAvailable()) return false;
    try {
        for (const [key, count] of Object.entries(warningsCache)) {
            const [groupJid, ...userParts] = key.split(':');
            const userJid = userParts.join(':');
            await db.upsert('warnings', {
                group_id: groupJid,
                user_id: userJid,
                count,
                updated_at: new Date().toISOString()
            }, 'group_id,user_id');
        }

        for (const [groupJid, limit] of Object.entries(limitsCache)) {
            await db.upsert('warning_limits', {
                group_id: groupJid,
                max_warnings: limit,
                updated_at: new Date().toISOString()
            }, 'group_id');
        }

        console.log(`✅ Supabase: Migrated ${Object.keys(warningsCache).length} warnings, ${Object.keys(limitsCache).length} limits`);
        return true;
    } catch (err) {
        console.error('⚠️ Supabase: Warning migration error:', err.message);
        return false;
    }
}
