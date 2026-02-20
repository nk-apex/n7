import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

let pool = null;
let isConnected = false;
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 5 * 60 * 1000;
const OP_TIMEOUT = 10000;
let pendingWrites = 0;
const MAX_PENDING_WRITES = 20;

const ALLOWED_TABLES = new Set([
    'bot_configs', 'warnings', 'warning_limits', 'sudoers', 'sudo_config',
    'lid_map', 'chatbot_conversations', 'chatbot_config', 'antidelete_messages',
    'antidelete_statuses', 'welcome_goodbye', 'group_features', 'auto_configs', 'media_store'
]);

const ALLOWED_COLUMNS = new Set([
    'key', 'value', 'updated_at', 'group_id', 'user_id', 'count', 'reasons',
    'max_warnings', 'phone_number', 'jid', 'added_at', 'id', 'sudomode',
    'lid', 'conversation', 'last_updated', 'config', 'message_id', 'chat_id',
    'sender_id', 'message_data', 'timestamp', 'created_at', 'status_id',
    'sender_number', 'push_name', 'status_type', 'status_data', 'media_meta',
    'has_media', 'text_content', 'deleted', 'welcome', 'goodbye', 'feature',
    'enabled', 'file_path', 'data', 'mimetype'
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

const SUPABASE_DB_URL = 'postgresql://postgres.hqmtygnjkquqsaosgkmr:Silentwolf906.@aws-1-eu-west-1.pooler.supabase.com:5432/postgres';

function getPool() {
    const dbUrl = process.env.DATABASE_URL || SUPABASE_DB_URL;
    if (!pool && dbUrl) {
        pool = new Pool({
            connectionString: dbUrl,
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
            ssl: { rejectUnauthorized: false }
        });
        pool.on('error', (err) => {
            console.error('⚠️ PostgreSQL pool error:', err.message);
            isConnected = false;
        });
    }
    return pool;
}

function getClient() {
    return getPool();
}

async function query(sql, params = [], timeoutMs = OP_TIMEOUT) {
    const p = getPool();
    if (!p) return null;
    const client = await p.connect();
    try {
        await client.query(`SET statement_timeout = ${timeoutMs}`);
        const result = await client.query(sql, params);
        return result;
    } finally {
        client.release();
    }
}

async function checkHealth() {
    const now = Date.now();
    if (now - lastHealthCheck < HEALTH_CHECK_INTERVAL && isConnected) {
        return true;
    }
    try {
        const p = getPool();
        if (!p) return false;
        const result = await query('SELECT 1 AS ok');
        isConnected = !!(result && result.rows);
        lastHealthCheck = now;
        return isConnected;
    } catch {
        isConnected = false;
        lastHealthCheck = now;
        return false;
    }
}

const TABLE_SCHEMAS = {
    bot_configs: `
        CREATE TABLE IF NOT EXISTS bot_configs (
            key TEXT PRIMARY KEY,
            value JSONB NOT NULL DEFAULT '{}',
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    `,
    warnings: `
        CREATE TABLE IF NOT EXISTS warnings (
            group_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            count INTEGER DEFAULT 0,
            reasons JSONB DEFAULT '[]',
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            PRIMARY KEY (group_id, user_id)
        );
    `,
    warning_limits: `
        CREATE TABLE IF NOT EXISTS warning_limits (
            group_id TEXT PRIMARY KEY,
            max_warnings INTEGER DEFAULT 3,
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    `,
    sudoers: `
        CREATE TABLE IF NOT EXISTS sudoers (
            phone_number TEXT PRIMARY KEY,
            jid TEXT,
            added_at TIMESTAMPTZ DEFAULT NOW()
        );
    `,
    sudo_config: `
        CREATE TABLE IF NOT EXISTS sudo_config (
            id TEXT PRIMARY KEY DEFAULT 'main',
            sudomode BOOLEAN DEFAULT FALSE,
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    `,
    lid_map: `
        CREATE TABLE IF NOT EXISTS lid_map (
            lid TEXT PRIMARY KEY,
            phone_number TEXT NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    `,
    chatbot_conversations: `
        CREATE TABLE IF NOT EXISTS chatbot_conversations (
            user_id TEXT PRIMARY KEY,
            conversation JSONB DEFAULT '[]',
            last_updated TIMESTAMPTZ DEFAULT NOW()
        );
    `,
    chatbot_config: `
        CREATE TABLE IF NOT EXISTS chatbot_config (
            key TEXT PRIMARY KEY DEFAULT 'main',
            config JSONB NOT NULL DEFAULT '{}',
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    `,
    antidelete_messages: `
        CREATE TABLE IF NOT EXISTS antidelete_messages (
            message_id TEXT PRIMARY KEY,
            chat_id TEXT,
            sender_id TEXT,
            message_data JSONB,
            timestamp BIGINT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    `,
    antidelete_statuses: `
        CREATE TABLE IF NOT EXISTS antidelete_statuses (
            status_id TEXT PRIMARY KEY,
            sender_id TEXT,
            sender_number TEXT,
            push_name TEXT,
            status_type TEXT,
            status_data JSONB,
            media_meta JSONB,
            has_media BOOLEAN DEFAULT FALSE,
            text_content TEXT,
            timestamp BIGINT,
            deleted BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    `,
    welcome_goodbye: `
        CREATE TABLE IF NOT EXISTS welcome_goodbye (
            group_id TEXT PRIMARY KEY,
            welcome JSONB DEFAULT NULL,
            goodbye JSONB DEFAULT NULL,
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    `,
    group_features: `
        CREATE TABLE IF NOT EXISTS group_features (
            group_id TEXT NOT NULL,
            feature TEXT NOT NULL,
            config JSONB NOT NULL DEFAULT '{}',
            enabled BOOLEAN DEFAULT TRUE,
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            PRIMARY KEY (group_id, feature)
        );
    `,
    auto_configs: `
        CREATE TABLE IF NOT EXISTS auto_configs (
            key TEXT PRIMARY KEY,
            value JSONB NOT NULL DEFAULT '{}',
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    `,
    media_store: `
        CREATE TABLE IF NOT EXISTS media_store (
            file_path TEXT PRIMARY KEY,
            data BYTEA NOT NULL,
            mimetype TEXT DEFAULT 'application/octet-stream',
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    `
};

async function initTables() {
    const p = getPool();
    if (!p) {
        console.log('⚠️ PostgreSQL: No DATABASE_URL found, using local JSON fallback');
        return false;
    }

    try {
        console.log('🔄 PostgreSQL: Initializing database tables...');

        for (const [name, sql] of Object.entries(TABLE_SCHEMAS)) {
            try {
                await query(sql);
            } catch (err) {
                console.error(`⚠️ PostgreSQL: Error creating table ${name}:`, err.message);
            }
        }

        try {
            await query('CREATE INDEX IF NOT EXISTS idx_antidelete_messages_timestamp ON antidelete_messages(timestamp)');
            await query('CREATE INDEX IF NOT EXISTS idx_antidelete_statuses_timestamp ON antidelete_statuses(timestamp)');
            await query('CREATE INDEX IF NOT EXISTS idx_antidelete_messages_chat ON antidelete_messages(chat_id)');
            await query('CREATE INDEX IF NOT EXISTS idx_group_features_group ON group_features(group_id)');
            await query('CREATE INDEX IF NOT EXISTS idx_media_store_created ON media_store(created_at)');
        } catch {}

        isConnected = true;
        lastHealthCheck = Date.now();
        console.log('✅ PostgreSQL: All tables ready');
        return true;
    } catch (err) {
        console.error('❌ PostgreSQL: Init error:', err.message);
        isConnected = false;
        return false;
    }
}

async function get(table, key, keyColumn = 'key') {
    try {
        if (!isConnected) return null;
        const t = validateTable(table);
        const col = validateColumn(keyColumn);
        const result = await query(
            `SELECT * FROM ${t} WHERE ${col} = $1 LIMIT 1`,
            [key]
        );
        return result?.rows?.[0] || null;
    } catch {
        return null;
    }
}

async function getAll(table, filters = {}) {
    try {
        if (!isConnected) return null;
        const t = validateTable(table);
        const keys = Object.keys(filters);
        let sql = `SELECT * FROM ${t}`;
        const params = [];
        if (keys.length > 0) {
            const conditions = keys.map((k, i) => `${validateColumn(k)} = $${i + 1}`);
            sql += ` WHERE ${conditions.join(' AND ')}`;
            params.push(...Object.values(filters));
        }
        const result = await query(sql, params);
        return result?.rows || null;
    } catch {
        return null;
    }
}

async function upsert(table, data, onConflict = undefined) {
    if (pendingWrites >= MAX_PENDING_WRITES) return false;
    pendingWrites++;
    try {
        if (!isConnected) return false;
        const t = validateTable(table);

        const keys = Object.keys(data).map(k => validateColumn(k));
        const values = Object.values(data);
        const placeholders = keys.map((_, i) => `$${i + 1}`);

        const conflictCols = onConflict
            ? onConflict.split(',').map(c => validateColumn(c.trim()))
            : [keys[0]];
        const conflictTarget = conflictCols.join(', ');

        const conflictSet = new Set(conflictCols);
        const updateCols = keys.filter(k => !conflictSet.has(k));
        const updateSet = updateCols.map(k => `${k} = EXCLUDED.${k}`).join(', ');

        let sql;
        if (updateCols.length > 0) {
            sql = `INSERT INTO ${t} (${keys.join(', ')}) VALUES (${placeholders.join(', ')})
                   ON CONFLICT (${conflictTarget}) DO UPDATE SET ${updateSet}`;
        } else {
            sql = `INSERT INTO ${t} (${keys.join(', ')}) VALUES (${placeholders.join(', ')})
                   ON CONFLICT (${conflictTarget}) DO NOTHING`;
        }

        await query(sql, values);
        return true;
    } catch (err) {
        return false;
    } finally {
        pendingWrites--;
    }
}

async function remove(table, key, keyColumn = 'key') {
    if (pendingWrites >= MAX_PENDING_WRITES) return false;
    pendingWrites++;
    try {
        if (!isConnected) return false;
        const t = validateTable(table);
        const col = validateColumn(keyColumn);
        await query(`DELETE FROM ${t} WHERE ${col} = $1`, [key]);
        return true;
    } catch {
        return false;
    } finally {
        pendingWrites--;
    }
}

async function removeWhere(table, filters = {}) {
    if (pendingWrites >= MAX_PENDING_WRITES) return false;
    pendingWrites++;
    try {
        if (!isConnected) return false;
        const t = validateTable(table);
        const keys = Object.keys(filters);
        if (keys.length === 0) return false;
        const conditions = keys.map((k, i) => `${validateColumn(k)} = $${i + 1}`);
        await query(`DELETE FROM ${t} WHERE ${conditions.join(' AND ')}`, Object.values(filters));
        return true;
    } catch {
        return false;
    } finally {
        pendingWrites--;
    }
}

async function count(table, filters = {}) {
    try {
        if (!isConnected) return null;
        const t = validateTable(table);
        const keys = Object.keys(filters);
        let sql = `SELECT COUNT(*) AS cnt FROM ${t}`;
        const params = [];
        if (keys.length > 0) {
            const conditions = keys.map((k, i) => `${validateColumn(k)} = $${i + 1}`);
            sql += ` WHERE ${conditions.join(' AND ')}`;
            params.push(...Object.values(filters));
        }
        const result = await query(sql, params);
        return parseInt(result?.rows?.[0]?.cnt || '0', 10);
    } catch {
        return null;
    }
}

async function cleanOlderThan(table, timestampColumn, maxAgeMs) {
    if (pendingWrites >= MAX_PENDING_WRITES) return 0;
    pendingWrites++;
    try {
        if (!isConnected) return 0;
        const t = validateTable(table);
        const col = validateColumn(timestampColumn);
        const cutoff = Date.now() - maxAgeMs;
        const result = await query(
            `DELETE FROM ${t} WHERE ${col} < $1`,
            [cutoff]
        );
        return result?.rowCount || 0;
    } catch {
        return 0;
    } finally {
        pendingWrites--;
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
    const dbData = await get('bot_configs', key);
    if (dbData && dbData.value !== undefined) {
        return dbData.value;
    }
    return defaultValue;
}

async function setConfig(key, value) {
    const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
    const saved = await upsert('bot_configs', {
        key,
        value: jsonValue,
        updated_at: new Date().toISOString()
    }, 'key');
    return saved;
}

async function getAutoConfig(key, defaultValue = {}) {
    const dbData = await get('auto_configs', key);
    if (dbData && dbData.value !== undefined) {
        return dbData.value;
    }
    return defaultValue;
}

async function setAutoConfig(key, value) {
    const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
    return await upsert('auto_configs', {
        key,
        value: jsonValue,
        updated_at: new Date().toISOString()
    }, 'key');
}


async function migrateJSONToConfig(filePath, configKey) {
    if (!isConnected) return false;
    try {
        const existing = await get('bot_configs', configKey);
        if (existing) return true;

        if (fs.existsSync(filePath)) {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            await setConfig(configKey, data);
            console.log(`✅ PostgreSQL: Migrated ${filePath} → bot_configs.${configKey}`);
            return true;
        }
    } catch (err) {
        console.error(`⚠️ PostgreSQL: Migration error for ${filePath}:`, err.message);
    }
    return false;
}

function isAvailable() {
    return isConnected && !!getPool();
}


async function uploadMedia(msgId, buffer, mimetype, folder = 'messages') {
    try {
        if (!isConnected) return null;
        const ext = mimetype?.split('/')[1]?.split(';')[0] || 'bin';
        const filePath = `${folder}/${msgId}.${ext}`;

        await query(
            `INSERT INTO media_store (file_path, data, mimetype, created_at) VALUES ($1, $2, $3, NOW())
             ON CONFLICT (file_path) DO UPDATE SET data = $2, mimetype = $3`,
            [filePath, buffer, mimetype || 'application/octet-stream']
        );
        return filePath;
    } catch (err) {
        console.error('⚠️ PostgreSQL Media: Upload failed:', err.message);
        return null;
    }
}

async function downloadMedia(storagePath) {
    try {
        if (!isConnected) return null;
        const result = await query(
            'SELECT data FROM media_store WHERE file_path = $1',
            [storagePath]
        );
        if (result?.rows?.[0]?.data) {
            return Buffer.from(result.rows[0].data);
        }
        return null;
    } catch (err) {
        console.error('⚠️ PostgreSQL Media: Download error:', err.message);
        return null;
    }
}

async function deleteMedia(storagePath) {
    try {
        if (!isConnected) return false;
        await query('DELETE FROM media_store WHERE file_path = $1', [storagePath]);
        return true;
    } catch (err) {
        console.error('⚠️ PostgreSQL Media: Delete error:', err.message);
        return false;
    }
}


async function storeAntideleteMessage(msgId, messageData) {
    try {
        return await upsert('antidelete_messages', {
            message_id: msgId,
            chat_id: messageData.chatJid || null,
            sender_id: messageData.senderJid || null,
            message_data: JSON.stringify(messageData),
            timestamp: messageData.timestamp || Date.now(),
            created_at: new Date().toISOString()
        }, 'message_id');
    } catch {
        return false;
    }
}

async function getAntideleteMessage(msgId) {
    try {
        const row = await get('antidelete_messages', msgId, 'message_id');
        if (!row) return null;
        const data = row.message_data;
        return typeof data === 'string' ? JSON.parse(data) : data;
    } catch {
        return null;
    }
}

async function deleteAntideleteMessage(msgId) {
    try {
        return await remove('antidelete_messages', msgId, 'message_id');
    } catch {
        return false;
    }
}

async function storeAntideleteStatus(statusId, statusData) {
    try {
        return await upsert('antidelete_statuses', {
            status_id: statusId,
            sender_id: statusData.senderJid || null,
            sender_number: statusData.senderNumber || null,
            push_name: statusData.pushName || null,
            status_type: statusData.type || null,
            status_data: JSON.stringify(statusData),
            media_meta: statusData.hasMedia ? JSON.stringify({ mimetype: statusData.mimetype, type: statusData.type }) : null,
            has_media: statusData.hasMedia || false,
            text_content: statusData.text || null,
            timestamp: statusData.timestamp || Date.now(),
            deleted: false,
            created_at: new Date().toISOString()
        }, 'status_id');
    } catch {
        return false;
    }
}

async function getAntideleteStatus(statusId) {
    try {
        const row = await get('antidelete_statuses', statusId, 'status_id');
        if (!row) return null;
        const data = row.status_data;
        return typeof data === 'string' ? JSON.parse(data) : data;
    } catch {
        return null;
    }
}

async function deleteAntideleteStatus(statusId) {
    try {
        return await remove('antidelete_statuses', statusId, 'status_id');
    } catch {
        return false;
    }
}

async function clearAllAntideleteData() {
    const results = { tables: 0, files: 0, errors: [] };
    try {
        if (!isConnected) {
            results.errors.push('PostgreSQL not connected');
            return results;
        }

        try {
            const msgResult = await query("DELETE FROM antidelete_messages WHERE message_id IS NOT NULL");
            results.tables += (msgResult?.rowCount || 0);
        } catch (err) {
            results.errors.push(`messages: ${err.message}`);
        }

        try {
            const statusResult = await query("DELETE FROM antidelete_statuses WHERE status_id IS NOT NULL");
            results.tables += (statusResult?.rowCount || 0);
        } catch (err) {
            results.errors.push(`statuses: ${err.message}`);
        }

        try {
            const mediaResult = await query("DELETE FROM media_store WHERE file_path IS NOT NULL");
            results.files += (mediaResult?.rowCount || 0);
        } catch (err) {
            results.errors.push(`media: ${err.message}`);
        }

        return results;
    } catch (err) {
        results.errors.push(err.message);
        return results;
    }
}

const CLEANUP_INTERVAL = 30 * 60 * 1000;
let cleanupTimer = null;

async function runPeriodicCleanup() {
    if (!isConnected) return;
    try {
        const maxAgeMs = 24 * 60 * 60 * 1000;
        const msgCleaned = await cleanOlderThan('antidelete_messages', 'timestamp', maxAgeMs);
        const statusCleaned = await cleanOlderThan('antidelete_statuses', 'timestamp', maxAgeMs);

        const mediaCutoff = new Date(Date.now() - maxAgeMs).toISOString();
        let mediaCleaned = 0;
        try {
            const result = await query('DELETE FROM media_store WHERE created_at < $1', [mediaCutoff]);
            mediaCleaned = result?.rowCount || 0;
        } catch {}

        const total = msgCleaned + statusCleaned + mediaCleaned;
        if (total > 0) {
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

const originalInitTables = initTables;
const wrappedInitTables = async function() {
    const result = await originalInitTables();
    if (result) {
        startPeriodicCleanup();
    }
    return result;
};

export {
    getClient,
    checkHealth,
    wrappedInitTables as initTables,
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
    clearAllAntideleteData
};

export default {
    getClient,
    checkHealth,
    initTables: wrappedInitTables,
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
    uploadMedia,
    downloadMedia,
    deleteMedia,
    storeAntideleteMessage,
    getAntideleteMessage,
    deleteAntideleteMessage,
    storeAntideleteStatus,
    getAntideleteStatus,
    deleteAntideleteStatus,
    clearAllAntideleteData
};
