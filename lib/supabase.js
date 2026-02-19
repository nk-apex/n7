import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hqmtygnjkquqsaosgkmr.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxbXR5Z25qa3F1cXNhb3Nna21yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQwOTIxMywiZXhwIjoyMDg2OTg1MjEzfQ.4TKGRIRaXy-eRMa-TRU4o7kwMefQh80xaI9UtH0qtCs';

let supabase = null;
let isConnected = false;
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 5 * 60 * 1000;
const OP_TIMEOUT = 5000;
let pendingWrites = 0;
const MAX_PENDING_WRITES = 5;

function withTimeout(promise, ms = OP_TIMEOUT) {
    let timer;
    return Promise.race([
        promise,
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('supabase_timeout')), ms); })
    ]).finally(() => clearTimeout(timer));
}

function getClient() {
    if (!supabase && SUPABASE_URL && SUPABASE_KEY) {
        supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: { persistSession: false, autoRefreshToken: false },
            db: { schema: 'public' }
        });
    }
    return supabase;
}

async function checkHealth() {
    const now = Date.now();
    if (now - lastHealthCheck < HEALTH_CHECK_INTERVAL && isConnected) {
        return true;
    }
    try {
        const client = getClient();
        if (!client) return false;
        const { error } = await withTimeout(
            client.from('bot_configs').select('key').limit(1),
            8000
        );
        if (error && (error.code === '42P01' || error.code === 'PGRST205')) {
            isConnected = true;
            lastHealthCheck = now;
            return true;
        }
        isConnected = !error;
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
    `
};

async function initTables() {
    const client = getClient();
    if (!client) {
        console.log('⚠️ Supabase: No credentials found, using local JSON fallback');
        return false;
    }

    try {
        console.log('🔄 Supabase: Initializing database tables...');

        const allTablesExist = await verifyTables();
        if (allTablesExist) {
            isConnected = true;
            lastHealthCheck = Date.now();
            console.log('✅ Supabase: All tables ready');
            return true;
        }

        console.log('🔄 Supabase: Creating missing tables via SQL...');
        const allSQL = Object.values(TABLE_SCHEMAS).join('\n');
        const created = await executeSQLDirect(allSQL);

        if (created) {
            const verified = await verifyTables();
            if (verified) {
                isConnected = true;
                lastHealthCheck = Date.now();
                console.log('✅ Supabase: All tables created successfully');
                return true;
            }
        }

        console.log('⚠️ Supabase: Tables need to be created manually.');
        await runSetupSQL();
        isConnected = true;
        lastHealthCheck = Date.now();
        console.log('✅ Supabase: Connection active (Storage ready, some DB tables may need manual setup)');
        return false;
    } catch (err) {
        console.error('❌ Supabase: Init error:', err.message);
        try {
            const client = getClient();
            if (client) {
                const { data } = await client.storage.listBuckets();
                if (data) {
                    isConnected = true;
                    lastHealthCheck = Date.now();
                    console.log('✅ Supabase: Storage connection verified (DB tables may need setup)');
                }
            }
        } catch {}
        return false;
    }
}

async function executeSQLDirect(sql) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ query: sql })
        });

        if (response.ok) return true;

        const pgResponse = await fetch(`${SUPABASE_URL}/pg`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            },
            body: JSON.stringify({ query: sql })
        });

        if (pgResponse.ok) return true;

        return false;
    } catch {
        return false;
    }
}

async function verifyTables() {
    const client = getClient();
    if (!client) return false;

    const tableNames = Object.keys(TABLE_SCHEMAS);
    for (const table of tableNames) {
        const { error } = await client.from(table).select('*').limit(1);
        if (error && (error.code === '42P01' || error.code === 'PGRST205')) {
            return false;
        }
    }
    return true;
}

async function runSetupSQL() {
    const client = getClient();
    if (!client) return;

    const allSQL = Object.values(TABLE_SCHEMAS).join('\n');
    console.log('\n📋 Supabase: Tables need to be created. Please run this SQL in your Supabase SQL Editor:\n');
    console.log('━'.repeat(60));
    console.log(allSQL);
    console.log('━'.repeat(60));
    console.log('\nAfter running the SQL, restart the bot.\n');

    const sqlPath = './supabase_setup.sql';
    fs.writeFileSync(sqlPath, allSQL);
    console.log(`💾 SQL also saved to: ${sqlPath}\n`);
}


async function get(table, key, keyColumn = 'key') {
    try {
        const client = getClient();
        if (!client || !isConnected) return null;

        const { data, error } = await withTimeout(
            client.from(table).select('*').eq(keyColumn, key).maybeSingle()
        );

        if (error) return null;
        return data;
    } catch {
        return null;
    }
}

async function getAll(table, filters = {}) {
    try {
        const client = getClient();
        if (!client || !isConnected) return null;

        let query = client.from(table).select('*');
        for (const [col, val] of Object.entries(filters)) {
            query = query.eq(col, val);
        }

        const { data, error } = await withTimeout(query);
        if (error) return null;
        return data;
    } catch {
        return null;
    }
}

async function upsert(table, data, onConflict = undefined) {
    if (pendingWrites >= MAX_PENDING_WRITES) return false;
    pendingWrites++;
    try {
        const client = getClient();
        if (!client || !isConnected) return false;

        const opts = onConflict ? { onConflict } : {};
        const { error } = await withTimeout(client.from(table).upsert(data, opts));
        if (error) return false;
        return true;
    } catch {
        return false;
    } finally {
        pendingWrites--;
    }
}

async function remove(table, key, keyColumn = 'key') {
    if (pendingWrites >= MAX_PENDING_WRITES) return false;
    pendingWrites++;
    try {
        const client = getClient();
        if (!client || !isConnected) return false;

        const { error } = await withTimeout(client.from(table).delete().eq(keyColumn, key));
        if (error) return false;
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
        const client = getClient();
        if (!client || !isConnected) return false;

        let query = client.from(table).delete();
        for (const [col, val] of Object.entries(filters)) {
            query = query.eq(col, val);
        }

        const { error } = await withTimeout(query);
        if (error) return false;
        return true;
    } catch {
        return false;
    } finally {
        pendingWrites--;
    }
}

async function count(table, filters = {}) {
    try {
        const client = getClient();
        if (!client || !isConnected) return null;

        let query = client.from(table).select('*', { count: 'exact', head: true });
        for (const [col, val] of Object.entries(filters)) {
            query = query.eq(col, val);
        }

        const { count: cnt, error } = await withTimeout(query);
        if (error) return null;
        return cnt;
    } catch {
        return null;
    }
}

async function cleanOlderThan(table, timestampColumn, maxAgeMs) {
    if (pendingWrites >= MAX_PENDING_WRITES) return 0;
    pendingWrites++;
    try {
        const client = getClient();
        if (!client || !isConnected) return 0;

        const cutoff = Date.now() - maxAgeMs;
        const { data, error } = await withTimeout(
            client.from(table).delete().lt(timestampColumn, cutoff).select('*', { count: 'exact', head: true })
        );

        if (error) return 0;
        return data?.length || 0;
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
    const saved = await upsert('bot_configs', {
        key,
        value,
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
    return await upsert('auto_configs', {
        key,
        value,
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
            console.log(`✅ Supabase: Migrated ${filePath} → bot_configs.${configKey}`);
            return true;
        }
    } catch (err) {
        console.error(`⚠️ Supabase: Migration error for ${filePath}:`, err.message);
    }
    return false;
}

function isAvailable() {
    return isConnected && !!getClient();
}

const ANTIDELETE_BUCKET = 'antidelete-media';
let bucketReady = false;

async function ensureStorageBucket() {
    if (bucketReady) return true;
    try {
        const client = getClient();
        if (!client) return false;
        if (!isConnected) {
            await checkHealth();
            if (!isConnected) return false;
        }

        const { data: buckets } = await client.storage.listBuckets();
        const exists = buckets?.some(b => b.name === ANTIDELETE_BUCKET);

        if (!exists) {
            const { error } = await client.storage.createBucket(ANTIDELETE_BUCKET, {
                public: false,
                fileSizeLimit: 15 * 1024 * 1024
            });
            if (error && !error.message?.includes('already exists')) {
                console.error('⚠️ Supabase Storage: Bucket creation failed:', error.message);
                return false;
            }
        }

        bucketReady = true;
        return true;
    } catch (err) {
        console.error('⚠️ Supabase Storage: Bucket error:', err.message);
        return false;
    }
}

async function uploadMedia(msgId, buffer, mimetype, folder = 'messages') {
    try {
        const client = getClient();
        if (!client) return null;
        if (!isConnected) {
            await checkHealth();
            if (!isConnected) return null;
        }

        const ready = await ensureStorageBucket();
        if (!ready) return null;

        const ext = mimetype?.split('/')[1]?.split(';')[0] || 'bin';
        const filePath = `${folder}/${msgId}.${ext}`;

        const { data, error } = await client.storage
            .from(ANTIDELETE_BUCKET)
            .upload(filePath, buffer, {
                contentType: mimetype || 'application/octet-stream',
                upsert: true
            });

        if (error) {
            console.error('⚠️ Supabase Storage: Upload failed:', error.message);
            return null;
        }

        return filePath;
    } catch (err) {
        console.error('⚠️ Supabase Storage: Upload error:', err.message);
        return null;
    }
}

async function downloadMedia(storagePath) {
    try {
        const client = getClient();
        if (!client) return null;
        if (!isConnected) {
            await checkHealth();
            if (!isConnected) return null;
        }

        const { data, error } = await client.storage
            .from(ANTIDELETE_BUCKET)
            .download(storagePath);

        if (error || !data) {
            return null;
        }

        const arrayBuffer = await data.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (err) {
        console.error('⚠️ Supabase Storage: Download error:', err.message);
        return null;
    }
}

async function deleteMedia(storagePath) {
    try {
        const client = getClient();
        if (!client) return false;
        if (!isConnected) {
            await checkHealth();
            if (!isConnected) return false;
        }

        const { error } = await client.storage
            .from(ANTIDELETE_BUCKET)
            .remove([storagePath]);

        if (error) {
            console.error('⚠️ Supabase Storage: Delete error:', error.message);
            return false;
        }

        return true;
    } catch (err) {
        console.error('⚠️ Supabase Storage: Delete error:', err.message);
        return false;
    }
}

async function storeAntideleteMessage(msgId, messageData) {
    try {
        return await upsert('antidelete_messages', {
            message_id: msgId,
            chat_id: messageData.chatJid || null,
            sender_id: messageData.senderJid || null,
            message_data: messageData,
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
        return row?.message_data || null;
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
            status_data: statusData,
            media_meta: statusData.hasMedia ? { mimetype: statusData.mimetype, type: statusData.type } : null,
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
        return row?.status_data || null;
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
        const client = getClient();
        if (!client || !isConnected) {
            results.errors.push('Supabase not connected');
            return results;
        }

        const { error: msgErr, count: msgCount } = await client
            .from('antidelete_messages')
            .delete()
            .neq('message_id', '')
            .select('*', { count: 'exact', head: true });
        if (msgErr) results.errors.push(`messages: ${msgErr.message}`);
        else results.tables += (msgCount || 0);

        const { error: statusErr, count: statusCount } = await client
            .from('antidelete_statuses')
            .delete()
            .neq('status_id', '')
            .select('*', { count: 'exact', head: true });
        if (statusErr) results.errors.push(`statuses: ${statusErr.message}`);
        else results.tables += (statusCount || 0);

        try {
            const ready = await ensureStorageBucket();
            if (ready) {
                for (const folder of ['messages', 'statuses']) {
                    let offset = 0;
                    const batchSize = 1000;
                    while (true) {
                        const { data: fileList } = await client.storage
                            .from(ANTIDELETE_BUCKET)
                            .list(folder, { limit: batchSize, offset });
                        if (!fileList || fileList.length === 0) break;
                        const paths = fileList.map(f => `${folder}/${f.name}`);
                        const { error: delErr } = await client.storage
                            .from(ANTIDELETE_BUCKET)
                            .remove(paths);
                        if (delErr) {
                            results.errors.push(`storage ${folder}: ${delErr.message}`);
                            break;
                        }
                        results.files += paths.length;
                        if (fileList.length < batchSize) break;
                    }
                }
            }
        } catch (storageErr) {
            results.errors.push(`storage: ${storageErr.message}`);
        }

        return results;
    } catch (err) {
        results.errors.push(err.message);
        return results;
    }
}

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
