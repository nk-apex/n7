import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data', 'warnings');
const warningsFile = path.join(DATA_DIR, 'warnings.json');
const limitsFile = path.join(DATA_DIR, 'limits.json');

function ensureFiles() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(warningsFile)) fs.writeFileSync(warningsFile, '{}');
    if (!fs.existsSync(limitsFile)) fs.writeFileSync(limitsFile, '{}');
}

function loadWarnings() {
    try {
        ensureFiles();
        return JSON.parse(fs.readFileSync(warningsFile, 'utf8'));
    } catch {
        return {};
    }
}

function saveWarnings(data) {
    ensureFiles();
    fs.writeFileSync(warningsFile, JSON.stringify(data, null, 2));
}

function loadLimits() {
    try {
        ensureFiles();
        return JSON.parse(fs.readFileSync(limitsFile, 'utf8'));
    } catch {
        return {};
    }
}

function saveLimits(data) {
    ensureFiles();
    fs.writeFileSync(limitsFile, JSON.stringify(data, null, 2));
}

export function getWarnLimit(groupJid) {
    const limits = loadLimits();
    return limits[groupJid] || 3;
}

export function setWarnLimit(groupJid, limit) {
    const limits = loadLimits();
    limits[groupJid] = limit;
    saveLimits(limits);
}

export function getWarnings(groupJid, userJid) {
    const data = loadWarnings();
    const key = `${groupJid}:${userJid}`;
    return data[key] || 0;
}

export function addWarning(groupJid, userJid) {
    const data = loadWarnings();
    const key = `${groupJid}:${userJid}`;
    data[key] = (data[key] || 0) + 1;
    saveWarnings(data);
    return data[key];
}

export function resetWarnings(groupJid, userJid) {
    const data = loadWarnings();
    const key = `${groupJid}:${userJid}`;
    const had = data[key] > 0;
    delete data[key];
    saveWarnings(data);
    return had;
}

export function resetAllGroupWarnings(groupJid) {
    const data = loadWarnings();
    let count = 0;
    for (const key of Object.keys(data)) {
        if (key.startsWith(groupJid + ':')) {
            delete data[key];
            count++;
        }
    }
    saveWarnings(data);
    return count;
}

export function getGroupWarnings(groupJid) {
    const data = loadWarnings();
    const result = [];
    for (const [key, count] of Object.entries(data)) {
        if (key.startsWith(groupJid + ':')) {
            const userJid = key.split(':').slice(1).join(':');
            result.push({ userJid, count });
        }
    }
    return result;
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
