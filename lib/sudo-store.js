import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data', 'sudo');
const SUDO_FILE = path.join(DATA_DIR, 'sudoers.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const LID_MAP_FILE = path.join(DATA_DIR, 'lid_map.json');

function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadSudoers() {
    try {
        ensureDataDir();
        if (fs.existsSync(SUDO_FILE)) {
            return JSON.parse(fs.readFileSync(SUDO_FILE, 'utf8'));
        }
    } catch {}
    return { sudoers: [], addedAt: {}, jidMap: {} };
}

function saveSudoers(data) {
    ensureDataDir();
    fs.writeFileSync(SUDO_FILE, JSON.stringify(data, null, 2));
}

function loadConfig() {
    try {
        ensureDataDir();
        if (fs.existsSync(CONFIG_FILE)) {
            return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        }
    } catch {}
    return { sudomode: false };
}

function saveConfig(data) {
    ensureDataDir();
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2));
}

function cleanNumber(num) {
    return num.replace(/[^0-9]/g, '');
}

export function addSudo(number, jid) {
    const clean = cleanNumber(number);
    if (!clean) return { success: false, reason: 'Invalid number' };
    const data = loadSudoers();
    if (data.sudoers.includes(clean)) {
        if (jid && jid !== clean) {
            data.jidMap = data.jidMap || {};
            data.jidMap[clean] = data.jidMap[clean] || [];
            if (!data.jidMap[clean].includes(jid)) {
                data.jidMap[clean].push(jid);
            }
            saveSudoers(data);
        }
        return { success: false, reason: 'Already a sudo user' };
    }
    data.sudoers.push(clean);
    data.addedAt = data.addedAt || {};
    data.addedAt[clean] = new Date().toISOString();
    if (jid && jid !== clean) {
        data.jidMap = data.jidMap || {};
        data.jidMap[clean] = [jid];
    }
    saveSudoers(data);
    return { success: true, number: clean };
}

export function addSudoJid(number, jid) {
    const clean = cleanNumber(number);
    if (!clean) return;
    const data = loadSudoers();
    if (!data.sudoers.includes(clean)) return;
    data.jidMap = data.jidMap || {};
    data.jidMap[clean] = data.jidMap[clean] || [];
    const rawJid = jid.split('@')[0].split(':')[0];
    if (!data.jidMap[clean].includes(rawJid)) {
        data.jidMap[clean].push(rawJid);
        saveSudoers(data);
    }
}

export function removeSudo(number) {
    const clean = cleanNumber(number);
    if (!clean) return { success: false, reason: 'Invalid number' };
    const data = loadSudoers();
    const index = data.sudoers.indexOf(clean);
    if (index === -1) {
        return { success: false, reason: 'Not a sudo user' };
    }
    data.sudoers.splice(index, 1);
    if (data.addedAt) delete data.addedAt[clean];
    if (data.jidMap) delete data.jidMap[clean];
    saveSudoers(data);
    return { success: true, number: clean };
}

export function getSudoList() {
    const data = loadSudoers();
    return { sudoers: data.sudoers || [], addedAt: data.addedAt || {}, jidMap: data.jidMap || {} };
}

export function isSudoNumber(number) {
    const clean = cleanNumber(number);
    if (!clean) return false;
    const data = loadSudoers();
    if (data.sudoers.includes(clean)) return true;
    if (data.jidMap) {
        for (const [sudoNum, jids] of Object.entries(data.jidMap)) {
            if (data.sudoers.includes(sudoNum) && jids.includes(clean)) {
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
    const data = loadSudoers();
    if (data.sudoers.includes(rawNumber)) return true;
    if (data.jidMap) {
        for (const [sudoNum, jids] of Object.entries(data.jidMap)) {
            if (data.sudoers.includes(sudoNum) && jids.includes(rawNumber)) {
                return true;
            }
        }
    }
    return false;
}

export function clearAllSudo(ownerNumber) {
    const data = loadSudoers();
    const removed = data.sudoers.length;
    data.sudoers = [];
    data.addedAt = {};
    data.jidMap = {};
    saveSudoers(data);
    return { removed };
}

export function getSudoMode() {
    const config = loadConfig();
    return config.sudomode || false;
}

export function setSudoMode(enabled) {
    const config = loadConfig();
    config.sudomode = enabled;
    config.updatedAt = new Date().toISOString();
    saveConfig(config);
    return enabled;
}

export function getSudoCount() {
    const data = loadSudoers();
    return data.sudoers.length;
}

function loadLidMap() {
    try {
        ensureDataDir();
        if (fs.existsSync(LID_MAP_FILE)) {
            return JSON.parse(fs.readFileSync(LID_MAP_FILE, 'utf8'));
        }
    } catch {}
    return {};
}

function saveLidMap(map) {
    ensureDataDir();
    fs.writeFileSync(LID_MAP_FILE, JSON.stringify(map, null, 2));
}

export function mapLidToPhone(lidNumber, phoneNumber) {
    if (!lidNumber || !phoneNumber || lidNumber === phoneNumber) return;
    const map = loadLidMap();
    if (map[lidNumber] === phoneNumber) return;
    map[lidNumber] = phoneNumber;
    saveLidMap(map);
}

export function getPhoneFromLid(lidNumber) {
    const map = loadLidMap();
    return map[lidNumber] || null;
}

export function isSudoByLid(lidNumber) {
    if (!lidNumber) return false;
    const map = loadLidMap();
    const phone = map[lidNumber];
    if (!phone) return false;
    const data = loadSudoers();
    return data.sudoers.includes(phone);
}
