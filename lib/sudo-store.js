import db from './supabase.js';

let sudoData = { sudoers: [], addedAt: {}, jidMap: {} };
let configData = { sudomode: false };
let lidMap = {};

function cleanNumber(num) {
    return num.replace(/[^0-9]/g, '');
}

export async function initSudo() {
    try {
        if (!db.isAvailable()) return;

        const rows = await db.getAll('sudoers');
        if (rows && rows.length > 0) {
            sudoData.sudoers = [];
            sudoData.addedAt = {};
            sudoData.jidMap = {};
            for (const row of rows) {
                const num = row.phone_number;
                sudoData.sudoers.push(num);
                if (row.added_at) sudoData.addedAt[num] = row.added_at;
                if (row.jid) {
                    sudoData.jidMap[num] = row.jid.split(',').filter(Boolean);
                }
            }
        }

        const configRow = await db.get('sudo_config', 'main', 'id');
        if (configRow) {
            configData.sudomode = configRow.sudomode || false;
        }

        const lidRows = await db.getAll('lid_map');
        if (lidRows && lidRows.length > 0) {
            lidMap = {};
            for (const row of lidRows) {
                lidMap[row.lid] = row.phone_number;
            }
        }

        console.log(`✅ Sudo: Loaded ${sudoData.sudoers.length} sudoers, ${Object.keys(lidMap).length} LID mappings from DB`);
    } catch (err) {
        console.error('⚠️ Sudo: Init error:', err.message);
    }
}

function syncSudoToDb(data) {
    if (!db.isAvailable()) return;
    try {
        for (const num of data.sudoers) {
            const jids = (data.jidMap && data.jidMap[num]) || [];
            db.upsert('sudoers', {
                phone_number: num,
                jid: jids.join(',') || null,
                added_at: (data.addedAt && data.addedAt[num]) || new Date().toISOString()
            }, 'phone_number').catch(() => {});
        }
    } catch {}
}

export function addSudo(number, jid) {
    const clean = cleanNumber(number);
    if (!clean) return { success: false, reason: 'Invalid number' };
    if (sudoData.sudoers.includes(clean)) {
        if (jid && jid !== clean) {
            sudoData.jidMap = sudoData.jidMap || {};
            sudoData.jidMap[clean] = sudoData.jidMap[clean] || [];
            if (!sudoData.jidMap[clean].includes(jid)) {
                sudoData.jidMap[clean].push(jid);
            }
            syncSudoToDb(sudoData);
        }
        return { success: false, reason: 'Already a sudo user' };
    }
    sudoData.sudoers.push(clean);
    sudoData.addedAt = sudoData.addedAt || {};
    sudoData.addedAt[clean] = new Date().toISOString();
    if (jid && jid !== clean) {
        sudoData.jidMap = sudoData.jidMap || {};
        sudoData.jidMap[clean] = [jid];
    }
    syncSudoToDb(sudoData);
    return { success: true, number: clean };
}

export function addSudoJid(number, jid) {
    const clean = cleanNumber(number);
    if (!clean) return;
    if (!sudoData.sudoers.includes(clean)) return;
    sudoData.jidMap = sudoData.jidMap || {};
    sudoData.jidMap[clean] = sudoData.jidMap[clean] || [];
    const rawJid = jid.split('@')[0].split(':')[0];
    if (!sudoData.jidMap[clean].includes(rawJid)) {
        sudoData.jidMap[clean].push(rawJid);
        syncSudoToDb(sudoData);
    }
}

export function removeSudo(number) {
    const clean = cleanNumber(number);
    if (!clean) return { success: false, reason: 'Invalid number' };
    const index = sudoData.sudoers.indexOf(clean);
    if (index === -1) {
        return { success: false, reason: 'Not a sudo user' };
    }
    sudoData.sudoers.splice(index, 1);
    if (sudoData.addedAt) delete sudoData.addedAt[clean];
    if (sudoData.jidMap) delete sudoData.jidMap[clean];

    if (db.isAvailable()) {
        db.remove('sudoers', clean, 'phone_number').catch(() => {});
    }

    return { success: true, number: clean };
}

export function getSudoList() {
    return { sudoers: sudoData.sudoers || [], addedAt: sudoData.addedAt || {}, jidMap: sudoData.jidMap || {} };
}

export function isSudoNumber(number) {
    const clean = cleanNumber(number);
    if (!clean) return false;
    if (sudoData.sudoers.includes(clean)) return true;
    if (sudoData.jidMap) {
        for (const [sudoNum, jids] of Object.entries(sudoData.jidMap)) {
            if (sudoData.sudoers.includes(sudoNum) && jids.includes(clean)) {
                return true;
            }
        }
    }
    return false;
}

export function isSudoJid(senderJid) {
    if (!senderJid) return false;
    const rawNumber = senderJid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
    if (!rawNumber) return false;
    if (sudoData.sudoers.includes(rawNumber)) return true;
    if (sudoData.jidMap) {
        for (const [sudoNum, jids] of Object.entries(sudoData.jidMap)) {
            if (sudoData.sudoers.includes(sudoNum) && jids.includes(rawNumber)) {
                return true;
            }
        }
    }
    return false;
}

export function clearAllSudo(ownerNumber) {
    const removed = sudoData.sudoers.length;
    const oldSudoers = [...sudoData.sudoers];
    sudoData.sudoers = [];
    sudoData.addedAt = {};
    sudoData.jidMap = {};

    if (db.isAvailable()) {
        for (const num of oldSudoers) {
            db.remove('sudoers', num, 'phone_number').catch(() => {});
        }
    }

    return { removed };
}

export function getSudoMode() {
    return configData.sudomode || false;
}

export function setSudoMode(enabled) {
    configData.sudomode = enabled;

    if (db.isAvailable()) {
        db.upsert('sudo_config', {
            id: 'main',
            sudomode: enabled,
            updated_at: new Date().toISOString()
        }, 'id').catch(() => {});
    }

    return enabled;
}

export function getSudoCount() {
    return sudoData.sudoers.length;
}

export function mapLidToPhone(lidNumber, phoneNumber) {
    if (!lidNumber || !phoneNumber || lidNumber === phoneNumber) return;
    if (lidMap[lidNumber] === phoneNumber) return;
    lidMap[lidNumber] = phoneNumber;

    if (db.isAvailable()) {
        db.upsert('lid_map', {
            lid: lidNumber,
            phone_number: phoneNumber,
            updated_at: new Date().toISOString()
        }, 'lid').catch(() => {});
    }
}

export function getPhoneFromLid(lidNumber) {
    return lidMap[lidNumber] || null;
}

export function isSudoByLid(lidNumber) {
    if (!lidNumber) return false;
    const phone = lidMap[lidNumber];
    if (!phone) return false;
    return sudoData.sudoers.includes(phone);
}

export async function migrateSudoToSupabase() {
    if (!db.isAvailable()) return false;
    try {
        for (const num of sudoData.sudoers) {
            const jids = (sudoData.jidMap && sudoData.jidMap[num]) || [];
            await db.upsert('sudoers', {
                phone_number: num,
                jid: jids.join(',') || null,
                added_at: (sudoData.addedAt && sudoData.addedAt[num]) || new Date().toISOString()
            }, 'phone_number');
        }

        await db.upsert('sudo_config', {
            id: 'main',
            sudomode: configData.sudomode || false,
            updated_at: new Date().toISOString()
        }, 'id');

        for (const [lid, phone] of Object.entries(lidMap)) {
            await db.upsert('lid_map', {
                lid,
                phone_number: phone,
                updated_at: new Date().toISOString()
            }, 'lid');
        }

        console.log(`✅ Supabase: Migrated ${sudoData.sudoers.length} sudoers, ${Object.keys(lidMap).length} LID mappings`);
        return true;
    } catch (err) {
        console.error('⚠️ Supabase: Sudo migration error:', err.message);
        return false;
    }
}
