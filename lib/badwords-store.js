import fs from 'fs';

const DATA_FILE = './data/badwords.json';

function loadData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        }
    } catch {}
    return { words: [], config: {} };
}

function saveData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch {}
}

export function addBadWord(word) {
    const data = loadData();
    const clean = word.toLowerCase().trim();
    if (!data.words.includes(clean)) {
        data.words.push(clean);
        saveData(data);
        return true;
    }
    return false;
}

export function removeBadWord(word) {
    const data = loadData();
    const clean = word.toLowerCase().trim();
    const idx = data.words.indexOf(clean);
    if (idx !== -1) {
        data.words.splice(idx, 1);
        saveData(data);
        return true;
    }
    return false;
}

export function getBadWords() {
    return loadData().words;
}

export function checkMessageForBadWord(text) {
    if (!text) return null;
    const lower = text.toLowerCase();
    const words = loadData().words;
    for (const word of words) {
        if (lower.includes(word)) return word;
    }
    return null;
}

export function isGroupEnabled(groupJid) {
    const data = loadData();
    if (groupJid === 'global') return data.config['global']?.enabled || false;
    if (data.config['global']?.enabled) return true;
    return data.config[groupJid]?.enabled !== false && (data.config[groupJid]?.enabled === true || false);
}

export function setGroupConfig(groupJid, enabled, action = 'warn') {
    const data = loadData();
    data.config[groupJid] = { enabled, action };
    saveData(data);
}

export function getGroupAction(groupJid) {
    const data = loadData();
    return data.config[groupJid]?.action || data.config['global']?.action || 'warn';
}

export function getFullConfig() {
    return loadData().config;
}
