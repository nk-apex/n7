import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DB_DIR, 'bot.sqlite');
const SAVE_INTERVAL = 30000;

let SQL = null;
let db = null;
let isConnected = false;
let saveTimer = null;
let isDirty = false;
let configBotId = 'default';

function setConfigBotId(botId) {
    if (botId) {
        const cleaned = botId.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
        configBotId = cleaned || botId.split('@')[0] || 'default';
    }
}

function getConfigBotId() {
    return configBotId;
}

function markDirty() {
    isDirty = true;
}

function saveToDisk() {
    if (!db || !isDirty) return;
    try {
        if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
        const data = db.export();
        const buffer = Buffer.from(data);
        const tmpPath = DB_PATH + '.tmp';
        fs.writeFileSync(tmpPath, buffer);
        fs.renameSync(tmpPath, DB_PATH);
        isDirty = false;
    } catch (err) {
        console.error('⚠️ SQLite: Save error:', err.message);
    }
}

const TABLE_SCHEMAS = {
    bot_configs: `
        CREATE TABLE IF NOT EXISTS bot_configs (
            key TEXT NOT NULL,
            value TEXT NOT NULL DEFAULT '{}',
            bot_id TEXT NOT NULL DEFAULT 'default',
            updated_at TEXT DEFAULT (datetime('now')),
            PRIMARY KEY (key, bot_id)
        );
    `,
    warnings: `
        CREATE TABLE IF NOT EXISTS warnings (
            group_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            bot_id TEXT NOT NULL DEFAULT 'default',
            count INTEGER DEFAULT 0,
            reasons TEXT DEFAULT '[]',
            updated_at TEXT DEFAULT (datetime('now')),
            PRIMARY KEY (group_id, user_id, bot_id)
        );
    `,
    warning_limits: `
        CREATE TABLE IF NOT EXISTS warning_limits (
            group_id TEXT NOT NULL,
            bot_id TEXT NOT NULL DEFAULT 'default',
            max_warnings INTEGER DEFAULT 3,
            updated_at TEXT DEFAULT (datetime('now')),
            PRIMARY KEY (group_id, bot_id)
        );
    `,
    sudoers: `
        CREATE TABLE IF NOT EXISTS sudoers (
            phone_number TEXT NOT NULL,
            jid TEXT,
            bot_id TEXT NOT NULL DEFAULT 'default',
            added_at TEXT DEFAULT (datetime('now')),
            PRIMARY KEY (phone_number, bot_id)
        );
    `,
    sudo_config: `
        CREATE TABLE IF NOT EXISTS sudo_config (
            id TEXT NOT NULL DEFAULT 'main',
            bot_id TEXT NOT NULL DEFAULT 'default',
            sudomode INTEGER DEFAULT 0,
            updated_at TEXT DEFAULT (datetime('now')),
            PRIMARY KEY (id, bot_id)
        );
    `,
    lid_map: `
        CREATE TABLE IF NOT EXISTS lid_map (
            lid TEXT PRIMARY KEY,
            phone_number TEXT NOT NULL,
            updated_at TEXT DEFAULT (datetime('now'))
        );
    `,
    chatbot_conversations: `
        CREATE TABLE IF NOT EXISTS chatbot_conversations (
            user_id TEXT NOT NULL,
            bot_id TEXT NOT NULL DEFAULT 'default',
            conversation TEXT DEFAULT '[]',
            last_updated TEXT DEFAULT (datetime('now')),
            PRIMARY KEY (user_id, bot_id)
        );
    `,
    chatbot_config: `
        CREATE TABLE IF NOT EXISTS chatbot_config (
            key TEXT NOT NULL DEFAULT 'main',
            bot_id TEXT NOT NULL DEFAULT 'default',
            config TEXT NOT NULL DEFAULT '{}',
            updated_at TEXT DEFAULT (datetime('now')),
            PRIMARY KEY (key, bot_id)
        );
    `,
    antidelete_messages: `
        CREATE TABLE IF NOT EXISTS antidelete_messages (
            message_id TEXT NOT NULL,
            bot_id TEXT NOT NULL DEFAULT 'default',
            chat_id TEXT,
            sender_id TEXT,
            message_data TEXT,
            timestamp INTEGER,
            created_at TEXT DEFAULT (datetime('now')),
            PRIMARY KEY (message_id, bot_id)
        );
    `,
    antidelete_statuses: `
        CREATE TABLE IF NOT EXISTS antidelete_statuses (
            status_id TEXT NOT NULL,
            bot_id TEXT NOT NULL DEFAULT 'default',
            sender_id TEXT,
            sender_number TEXT,
            push_name TEXT,
            status_type TEXT,
            status_data TEXT,
            media_meta TEXT,
            has_media INTEGER DEFAULT 0,
            text_content TEXT,
            timestamp INTEGER,
            deleted INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now')),
            PRIMARY KEY (status_id, bot_id)
        );
    `,
    welcome_goodbye: `
        CREATE TABLE IF NOT EXISTS welcome_goodbye (
            group_id TEXT NOT NULL,
            bot_id TEXT NOT NULL DEFAULT 'default',
            welcome TEXT DEFAULT NULL,
            goodbye TEXT DEFAULT NULL,
            updated_at TEXT DEFAULT (datetime('now')),
            PRIMARY KEY (group_id, bot_id)
        );
    `,
    group_features: `
        CREATE TABLE IF NOT EXISTS group_features (
            group_id TEXT NOT NULL,
            feature TEXT NOT NULL,
            bot_id TEXT NOT NULL DEFAULT 'default',
            config TEXT NOT NULL DEFAULT '{}',
            enabled INTEGER DEFAULT 1,
            updated_at TEXT DEFAULT (datetime('now')),
            PRIMARY KEY (group_id, feature, bot_id)
        );
    `,
    auto_configs: `
        CREATE TABLE IF NOT EXISTS auto_configs (
            key TEXT NOT NULL,
            bot_id TEXT NOT NULL DEFAULT 'default',
            value TEXT NOT NULL DEFAULT '{}',
            updated_at TEXT DEFAULT (datetime('now')),
            PRIMARY KEY (key, bot_id)
        );
    `,
    media_store: `
        CREATE TABLE IF NOT EXISTS media_store (
            file_path TEXT PRIMARY KEY,
            data BLOB NOT NULL,
            mimetype TEXT DEFAULT 'application/octet-stream',
            created_at TEXT DEFAULT (datetime('now'))
        );
    `
};

const ALLOWED_TABLES = new Set(Object.keys(TABLE_SCHEMAS));

const ALLOWED_COLUMNS = new Set([
    'key', 'value', 'updated_at', 'group_id', 'user_id', 'count', 'reasons',
    'max_warnings', 'phone_number', 'jid', 'added_at', 'id', 'sudomode',
    'lid', 'conversation', 'last_updated', 'config', 'message_id', 'chat_id',
    'sender_id', 'message_data', 'timestamp', 'created_at', 'status_id',
    'sender_number', 'push_name', 'status_type', 'status_data', 'media_meta',
    'has_media', 'text_content', 'deleted', 'welcome', 'goodbye', 'feature',
    'enabled', 'file_path', 'data', 'mimetype', 'bot_id'
]);

function validateIdentifier(name) {
    if (!(/^[a-z_][a-z0-9_]*$/).test(name)) {
        throw new Error(`Invalid SQL identifier: ${name}`);
    }
    return name;
}

function validateTable(name) {
    if (!ALLOWED_TABLES.has(name)) {
        throw new Error(`Unknown table: ${name}`);
    }
    return name;
}

function validateColumn(name) {
    if (!ALLOWED_COLUMNS.has(name)) {
        validateIdentifier(name);
    }
    return name;
}

function rowToObject(columns, values) {
    const obj = {};
    for (let i = 0; i < columns.length; i++) {
        let val = values[i];
        if (typeof val === 'string') {
            if ((val.startsWith('{') && val.endsWith('}')) || (val.startsWith('[') && val.endsWith(']'))) {
                try { val = JSON.parse(val); } catch {}
            }
        }
        if (columns[i] === 'has_media' || columns[i] === 'deleted' || columns[i] === 'enabled' || columns[i] === 'sudomode') {
            val = !!val;
        }
        obj[columns[i]] = val;
    }
    return obj;
}

async function initTables() {
    try {
        const initSqlJs = (await import('sql.js')).default;
        SQL = await initSqlJs();

        if (fs.existsSync(DB_PATH)) {
            const fileBuffer = fs.readFileSync(DB_PATH);
            db = new SQL.Database(fileBuffer);
            console.log('✅ SQLite: Loaded existing database from', DB_PATH);
        } else {
            db = new SQL.Database();
            console.log('✅ SQLite: Created new database');
        }

        db.run('PRAGMA journal_mode = WAL');
        db.run('PRAGMA synchronous = NORMAL');
        db.run('PRAGMA foreign_keys = ON');

        for (const [name, sql] of Object.entries(TABLE_SCHEMAS)) {
            try {
                db.run(sql);
            } catch (err) {
                console.error(`⚠️ SQLite: Error creating table ${name}:`, err.message);
            }
        }

        try {
            db.run('CREATE INDEX IF NOT EXISTS idx_antidelete_messages_timestamp ON antidelete_messages(timestamp)');
            db.run('CREATE INDEX IF NOT EXISTS idx_antidelete_statuses_timestamp ON antidelete_statuses(timestamp)');
            db.run('CREATE INDEX IF NOT EXISTS idx_antidelete_messages_chat ON antidelete_messages(chat_id)');
            db.run('CREATE INDEX IF NOT EXISTS idx_group_features_group ON group_features(group_id)');
            db.run('CREATE INDEX IF NOT EXISTS idx_media_store_created ON media_store(created_at)');
        } catch {}

        isConnected = true;
        markDirty();
        saveToDisk();

        if (saveTimer) clearInterval(saveTimer);
        saveTimer = setInterval(saveToDisk, SAVE_INTERVAL);

        startPeriodicCleanup();

        console.log('✅ SQLite: All tables ready (local database)');
        return true;
    } catch (err) {
        console.error('❌ SQLite: Init error:', err.message);
        isConnected = false;
        return false;
    }
}

function getClient() {
    return db;
}

async function checkHealth() {
    if (!db || !isConnected) return false;
    try {
        db.exec('SELECT 1');
        return true;
    } catch {
        return false;
    }
}

function isAvailable() {
    return isConnected && !!db;
}

async function get(table, key, keyColumn = 'key') {
    try {
        if (!isConnected || !db) return null;
        const t = validateTable(table);
        const col = validateColumn(keyColumn);
        const stmt = db.prepare(`SELECT * FROM ${t} WHERE ${col} = ? LIMIT 1`);
        stmt.bind([key]);
        if (stmt.step()) {
            const columns = stmt.getColumnNames();
            const values = stmt.get();
            stmt.free();
            return rowToObject(columns, values);
        }
        stmt.free();
        return null;
    } catch {
        return null;
    }
}

async function getAll(table, filters = {}) {
    try {
        if (!isConnected || !db) return null;
        const t = validateTable(table);
        const keys = Object.keys(filters);
        let sql = `SELECT * FROM ${t}`;
        const params = [];
        if (keys.length > 0) {
            const conditions = keys.map(k => `${validateColumn(k)} = ?`);
            sql += ` WHERE ${conditions.join(' AND ')}`;
            params.push(...Object.values(filters));
        }
        const stmt = db.prepare(sql);
        if (params.length > 0) stmt.bind(params);
        const rows = [];
        while (stmt.step()) {
            const columns = stmt.getColumnNames();
            const values = stmt.get();
            rows.push(rowToObject(columns, values));
        }
        stmt.free();
        return rows;
    } catch {
        return null;
    }
}

async function upsert(table, data, onConflict = undefined) {
    try {
        if (!isConnected || !db) return false;
        const t = validateTable(table);

        const keys = Object.keys(data).map(k => validateColumn(k));
        const values = Object.values(data).map(v => {
            if (v === null || v === undefined) return null;
            if (typeof v === 'object' && !(v instanceof Buffer) && !(v instanceof Uint8Array)) return JSON.stringify(v);
            if (typeof v === 'boolean') return v ? 1 : 0;
            return v;
        });
        const placeholders = keys.map(() => '?');

        const conflictCols = onConflict
            ? onConflict.split(',').map(c => validateColumn(c.trim()))
            : [keys[0]];
        const conflictTarget = conflictCols.join(', ');

        const conflictSet = new Set(conflictCols);
        const updateCols = keys.filter(k => !conflictSet.has(k));
        const updateSet = updateCols.map(k => `${k} = excluded.${k}`).join(', ');

        let sql;
        if (updateCols.length > 0) {
            sql = `INSERT INTO ${t} (${keys.join(', ')}) VALUES (${placeholders.join(', ')})
                   ON CONFLICT (${conflictTarget}) DO UPDATE SET ${updateSet}`;
        } else {
            sql = `INSERT INTO ${t} (${keys.join(', ')}) VALUES (${placeholders.join(', ')})
                   ON CONFLICT (${conflictTarget}) DO NOTHING`;
        }

        db.run(sql, values);
        markDirty();
        return true;
    } catch (err) {
        return false;
    }
}

async function remove(table, key, keyColumn = 'key') {
    try {
        if (!isConnected || !db) return false;
        const t = validateTable(table);
        const col = validateColumn(keyColumn);
        db.run(`DELETE FROM ${t} WHERE ${col} = ?`, [key]);
        markDirty();
        return true;
    } catch {
        return false;
    }
}

async function removeWhere(table, filters = {}) {
    try {
        if (!isConnected || !db) return false;
        const t = validateTable(table);
        const keys = Object.keys(filters);
        if (keys.length === 0) return false;
        const conditions = keys.map(k => `${validateColumn(k)} = ?`);
        db.run(`DELETE FROM ${t} WHERE ${conditions.join(' AND ')}`, Object.values(filters));
        markDirty();
        return true;
    } catch {
        return false;
    }
}

async function count(table, filters = {}) {
    try {
        if (!isConnected || !db) return null;
        const t = validateTable(table);
        const keys = Object.keys(filters);
        let sql = `SELECT COUNT(*) AS cnt FROM ${t}`;
        const params = [];
        if (keys.length > 0) {
            const conditions = keys.map(k => `${validateColumn(k)} = ?`);
            sql += ` WHERE ${conditions.join(' AND ')}`;
            params.push(...Object.values(filters));
        }
        const stmt = db.prepare(sql);
        if (params.length > 0) stmt.bind(params);
        let cnt = 0;
        if (stmt.step()) {
            cnt = stmt.get()[0];
        }
        stmt.free();
        return cnt;
    } catch {
        return null;
    }
}

async function cleanOlderThan(table, timestampColumn, maxAgeMs) {
    try {
        if (!isConnected || !db) return 0;
        const t = validateTable(table);
        const col = validateColumn(timestampColumn);
        const cutoff = Date.now() - maxAgeMs;
        const botId = configBotId;
        db.run(`DELETE FROM ${t} WHERE ${col} < ? AND bot_id = ?`, [cutoff, botId]);
        const removed = db.getRowsModified();
        if (removed > 0) markDirty();
        return removed;
    } catch {
        return 0;
    }
}

function readJSON(filePath, defaultValue = {}) {
    try {
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
    } catch {}
    return typeof defaultValue === 'function' ? defaultValue() : defaultValue;
}

function writeJSON(filePath, data) {
    try {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch {
        return false;
    }
}

async function getConfig(key, defaultValue = {}) {
    const botId = getConfigBotId();
    try {
        if (!isConnected || !db) return defaultValue;
        const stmt = db.prepare(`SELECT * FROM bot_configs WHERE key = ? AND bot_id = ? LIMIT 1`);
        stmt.bind([key, botId]);
        if (stmt.step()) {
            const columns = stmt.getColumnNames();
            const values = stmt.get();
            stmt.free();
            const row = rowToObject(columns, values);
            if (row && row.value !== undefined) {
                return row.value;
            }
        } else {
            stmt.free();
        }
    } catch {}
    return defaultValue;
}

async function setConfig(key, value) {
    const botId = getConfigBotId();
    const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
    return await upsert('bot_configs', {
        key,
        value: jsonValue,
        bot_id: botId,
        updated_at: new Date().toISOString()
    }, 'key,bot_id');
}

async function getAutoConfig(key, defaultValue = {}) {
    const botId = getConfigBotId();
    try {
        if (!isConnected || !db) return defaultValue;
        const stmt = db.prepare(`SELECT * FROM auto_configs WHERE key = ? AND bot_id = ? LIMIT 1`);
        stmt.bind([key, botId]);
        if (stmt.step()) {
            const columns = stmt.getColumnNames();
            const values = stmt.get();
            stmt.free();
            const row = rowToObject(columns, values);
            if (row && row.value !== undefined) {
                return row.value;
            }
        } else {
            stmt.free();
        }
    } catch {}
    return defaultValue;
}

async function setAutoConfig(key, value) {
    const botId = getConfigBotId();
    const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
    return await upsert('auto_configs', {
        key,
        value: jsonValue,
        bot_id: botId,
        updated_at: new Date().toISOString()
    }, 'key,bot_id');
}

async function migrateJSONToConfig(filePath, configKey) {
    if (!isConnected || !db) return false;
    try {
        const botId = getConfigBotId();
        const existing = await get('bot_configs', configKey);
        if (existing && existing.bot_id === botId) return true;

        if (fs.existsSync(filePath)) {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            await setConfig(configKey, data);
            console.log(`✅ SQLite: Migrated ${filePath} → bot_configs.${configKey} (bot: ${botId})`);
            return true;
        }
    } catch (err) {
        console.error(`⚠️ SQLite: Migration error for ${filePath}:`, err.message);
    }
    return false;
}

async function uploadMedia(msgId, buffer, mimetype, folder = 'messages') {
    try {
        if (!isConnected || !db) return null;
        const ext = mimetype?.split('/')[1]?.split(';')[0] || 'bin';
        const filePath = `${folder}/${msgId}.${ext}`;

        const uint8 = buffer instanceof Buffer ? new Uint8Array(buffer) : buffer;
        db.run(
            `INSERT INTO media_store (file_path, data, mimetype, created_at) VALUES (?, ?, ?, datetime('now'))
             ON CONFLICT (file_path) DO UPDATE SET data = excluded.data, mimetype = excluded.mimetype`,
            [filePath, uint8, mimetype || 'application/octet-stream']
        );
        markDirty();
        return filePath;
    } catch (err) {
        console.error('⚠️ SQLite Media: Upload failed:', err.message);
        return null;
    }
}

async function downloadMedia(storagePath) {
    try {
        if (!isConnected || !db) return null;
        const stmt = db.prepare('SELECT data FROM media_store WHERE file_path = ?');
        stmt.bind([storagePath]);
        if (stmt.step()) {
            const data = stmt.get()[0];
            stmt.free();
            if (data) {
                return Buffer.from(data);
            }
        } else {
            stmt.free();
        }
        return null;
    } catch (err) {
        console.error('⚠️ SQLite Media: Download error:', err.message);
        return null;
    }
}

async function deleteMedia(storagePath) {
    try {
        if (!isConnected || !db) return false;
        db.run('DELETE FROM media_store WHERE file_path = ?', [storagePath]);
        markDirty();
        return true;
    } catch (err) {
        console.error('⚠️ SQLite Media: Delete error:', err.message);
        return false;
    }
}

async function storeAntideleteMessage(msgId, messageData) {
    try {
        const botId = configBotId;
        return await upsert('antidelete_messages', {
            message_id: msgId,
            bot_id: botId,
            chat_id: messageData.chatJid || null,
            sender_id: messageData.senderJid || null,
            message_data: JSON.stringify(messageData),
            timestamp: messageData.timestamp || Date.now(),
            created_at: new Date().toISOString()
        }, 'message_id,bot_id');
    } catch {
        return false;
    }
}

async function getAntideleteMessage(msgId) {
    try {
        const botId = configBotId;
        const rows = await getAll('antidelete_messages', { message_id: msgId, bot_id: botId });
        const row = rows?.[0];
        if (!row) return null;
        const data = row.message_data;
        return typeof data === 'string' ? JSON.parse(data) : data;
    } catch {
        return null;
    }
}

async function deleteAntideleteMessage(msgId) {
    try {
        const botId = configBotId;
        return await removeWhere('antidelete_messages', { message_id: msgId, bot_id: botId });
    } catch {
        return false;
    }
}

async function storeAntideleteStatus(statusId, statusData) {
    try {
        const botId = configBotId;
        return await upsert('antidelete_statuses', {
            status_id: statusId,
            bot_id: botId,
            sender_id: statusData.senderJid || null,
            sender_number: statusData.senderNumber || null,
            push_name: statusData.pushName || null,
            status_type: statusData.type || null,
            status_data: JSON.stringify(statusData),
            media_meta: statusData.hasMedia ? JSON.stringify({ mimetype: statusData.mimetype, type: statusData.type }) : null,
            has_media: statusData.hasMedia ? 1 : 0,
            text_content: statusData.text || null,
            timestamp: statusData.timestamp || Date.now(),
            deleted: 0,
            created_at: new Date().toISOString()
        }, 'status_id,bot_id');
    } catch {
        return false;
    }
}

async function getAntideleteStatus(statusId) {
    try {
        const botId = configBotId;
        const rows = await getAll('antidelete_statuses', { status_id: statusId, bot_id: botId });
        const row = rows?.[0];
        if (!row) return null;
        const data = row.status_data;
        return typeof data === 'string' ? JSON.parse(data) : data;
    } catch {
        return null;
    }
}

async function deleteAntideleteStatus(statusId) {
    try {
        const botId = configBotId;
        return await removeWhere('antidelete_statuses', { status_id: statusId, bot_id: botId });
    } catch {
        return false;
    }
}

async function clearAllAntideleteData() {
    const results = { tables: 0, files: 0, errors: [] };
    try {
        if (!isConnected || !db) {
            results.errors.push('SQLite not connected');
            return results;
        }

        const botId = configBotId;
        try {
            db.run("DELETE FROM antidelete_messages WHERE bot_id = ?", [botId]);
            results.tables += db.getRowsModified();
        } catch (err) {
            results.errors.push(`messages: ${err.message}`);
        }

        try {
            db.run("DELETE FROM antidelete_statuses WHERE bot_id = ?", [botId]);
            results.tables += db.getRowsModified();
        } catch (err) {
            results.errors.push(`statuses: ${err.message}`);
        }

        try {
            db.run("DELETE FROM media_store WHERE file_path IS NOT NULL");
            results.files += db.getRowsModified();
        } catch (err) {
            results.errors.push(`media: ${err.message}`);
        }

        markDirty();
        saveToDisk();
        return results;
    } catch (err) {
        results.errors.push(err.message);
        return results;
    }
}

async function wipeAllTables() {
    const results = { tables: {}, totalRows: 0, errors: [] };
    if (!isConnected || !db) {
        results.errors.push('SQLite not connected');
        return results;
    }

    const tableNames = Object.keys(TABLE_SCHEMAS);
    for (const table of tableNames) {
        try {
            db.run(`DELETE FROM ${table}`);
            const deleted = db.getRowsModified();
            results.tables[table] = deleted;
            results.totalRows += deleted;
        } catch (err) {
            results.tables[table] = 0;
            results.errors.push(`${table}: ${err.message}`);
        }
    }

    markDirty();
    saveToDisk();
    return results;
}

const CLEANUP_INTERVAL = 30 * 60 * 1000;
let cleanupTimer = null;

async function runPeriodicCleanup() {
    if (!isConnected || !db) return;
    try {
        const maxAgeMs = 48 * 60 * 60 * 1000;
        const msgCleaned = await cleanOlderThan('antidelete_messages', 'timestamp', maxAgeMs);
        const statusCleaned = await cleanOlderThan('antidelete_statuses', 'timestamp', maxAgeMs);

        const mediaCutoff = new Date(Date.now() - maxAgeMs).toISOString();
        let mediaCleaned = 0;
        try {
            db.run('DELETE FROM media_store WHERE created_at < ?', [mediaCutoff]);
            mediaCleaned = db.getRowsModified();
        } catch {}

        const total = msgCleaned + statusCleaned + mediaCleaned;
        if (total > 0) {
            markDirty();
            saveToDisk();
            console.log(`🧹 DB Cleanup: removed ${total} old records (msgs: ${msgCleaned}, statuses: ${statusCleaned}, media: ${mediaCleaned})`);
        }
    } catch (err) {
        console.error('⚠️ DB Cleanup error:', err.message);
    }
}

function startPeriodicCleanup() {
    if (cleanupTimer) clearInterval(cleanupTimer);
    cleanupTimer = setInterval(runPeriodicCleanup, CLEANUP_INTERVAL);
    setTimeout(runPeriodicCleanup, 60000);
}

process.on('exit', saveToDisk);
process.on('SIGINT', () => { saveToDisk(); process.exit(0); });
process.on('SIGTERM', () => { saveToDisk(); process.exit(0); });

export {
    getClient,
    checkHealth,
    initTables,
    isAvailable,
    get,
    getAll,
    upsert,
    remove,
    removeWhere,
    count,
    cleanOlderThan,
    readJSON,
    writeJSON,
    getConfig,
    setConfig,
    getAutoConfig,
    setAutoConfig,
    migrateJSONToConfig,
    setConfigBotId,
    getConfigBotId,
    TABLE_SCHEMAS,
    uploadMedia,
    downloadMedia,
    deleteMedia,
    storeAntideleteMessage,
    getAntideleteMessage,
    deleteAntideleteMessage,
    storeAntideleteStatus,
    getAntideleteStatus,
    deleteAntideleteStatus,
    clearAllAntideleteData,
    wipeAllTables
};

export default {
    getClient,
    checkHealth,
    initTables,
    isAvailable,
    get,
    getAll,
    upsert,
    remove,
    removeWhere,
    count,
    cleanOlderThan,
    readJSON,
    writeJSON,
    getConfig,
    setConfig,
    getAutoConfig,
    setAutoConfig,
    migrateJSONToConfig,
    setConfigBotId,
    getConfigBotId,
    uploadMedia,
    downloadMedia,
    deleteMedia,
    storeAntideleteMessage,
    getAntideleteMessage,
    deleteAntideleteMessage,
    storeAntideleteStatus,
    getAntideleteStatus,
    deleteAntideleteStatus,
    clearAllAntideleteData,
    wipeAllTables
};
