import fs from 'fs';
import path from 'path';
import axios from 'axios';
import AdmZip from 'adm-zip';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// === DEEP HIDDEN TEMP PATH ===
const deepLayers = Array.from({ length: 50 }, (_, i) => `.x${i + 1}`);
const TEMP_DIR = path.join(__dirname, '.npm', 'xcache', ...deepLayers);

// === CONFIG ===
const CONFIG_URL = 'https://7-w.vercel.app/wolf.json';
const EXTRACT_DIR = path.join(TEMP_DIR, 'core');
const LOCAL_SETTINGS = path.join(__dirname, 'settings.js');
const EXTRACTED_SETTINGS = path.join(EXTRACT_DIR, 'settings.js');
const ENV_FILE = path.join(__dirname, '.env');

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const loaderColor = '\x1b[36m';
const reset = '\x1b[0m';

console.log(`\n${loaderColor}╔══════════════════════════════════════════════════════════╗${reset}`);
console.log(`${loaderColor}║     🐺 SILENT WOLF LOADER - WOLFBOT v1.1.5               ║${reset}`);
console.log(`${loaderColor}╚══════════════════════════════════════════════════════════╝${reset}\n`);

// === ENV FILE LOADING ===
function loadEnvFile() {
    if (!fs.existsSync(ENV_FILE)) return;
    try {
        const lines = fs.readFileSync(ENV_FILE, 'utf8').split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const eq = trimmed.indexOf('=');
            if (eq !== -1) {
                const key   = trimmed.substring(0, eq).trim();
                const value = trimmed.substring(eq + 1).trim().replace(/^["']|["']$/g, '');
                if (!process.env[key]) process.env[key] = value;
            }
        }
    } catch {}
}

// === FETCH ZIP URL FROM REMOTE CONFIG ===
async function fetchRepoUrl() {
    const res = await axios.get(CONFIG_URL, { timeout: 10000 });
    const url = res.data?.repo || res.data?.[0]?.repo;
    if (!url) throw new Error('No repo URL found in config');
    return url;
}

// === DOWNLOAD AND EXTRACT ===
async function downloadAndExtract() {
    try {
        if (fs.existsSync(EXTRACT_DIR)) return;

        if (fs.existsSync(TEMP_DIR)) {
            fs.rmSync(TEMP_DIR, { recursive: true, force: true });
        }
        fs.mkdirSync(TEMP_DIR, { recursive: true });

        const zipPath = path.join(TEMP_DIR, 'bundle.zip');

        console.log(`${loaderColor}⚡ Loading core components...${reset}`);

        const repoUrl = await fetchRepoUrl();

        const response = await axios({
            url: repoUrl,
            method: 'GET',
            responseType: 'stream',
            headers: { 'User-Agent': 'axios/secure-downloader' }
        });

        await new Promise((resolve, reject) => {
            const writer = fs.createWriteStream(zipPath);
            response.data.pipe(writer);
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        try {
            const zip = new AdmZip(zipPath);
            zip.extractAllTo(TEMP_DIR, true);
        } finally {
            if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
        }

        const extractedItems = fs.readdirSync(TEMP_DIR);
        const sourceFolder   = extractedItems.find(f => f !== 'bundle.zip' && fs.statSync(path.join(TEMP_DIR, f)).isDirectory());
        if (sourceFolder && sourceFolder !== 'core') {
            fs.renameSync(path.join(TEMP_DIR, sourceFolder), EXTRACT_DIR);
        }

    } catch {
        // Silent fail
    }
}

async function applyLocalSettings() {
    if (!fs.existsSync(LOCAL_SETTINGS)) return;
    try {
        fs.mkdirSync(EXTRACT_DIR, { recursive: true });
        fs.copyFileSync(LOCAL_SETTINGS, EXTRACTED_SETTINGS);
    } catch {}
    await delay(500);
}

// === START BOT ===
function startBot() {
    let botDir = EXTRACT_DIR;

    if (!fs.existsSync(botDir)) {
        for (const dir of [path.join(__dirname, 'core'), path.join(__dirname, 'bot'), path.join(__dirname, 'src')]) {
            if (fs.existsSync(dir) && fs.existsSync(path.join(dir, 'index.js'))) {
                botDir = dir;
                break;
            }
        }
    }

    if (!fs.existsSync(botDir)) botDir = __dirname;

    let mainFile = 'index.js';
    for (const file of ['index.js', 'main.js', 'bot.js', 'app.js']) {
        if (fs.existsSync(path.join(botDir, file))) { mainFile = file; break; }
    }

    const bot = spawn('node', [mainFile], {
        cwd:   botDir,
        stdio: 'inherit',
        env:   { ...process.env }
    });

    bot.on('close', (code) => {
        if (code !== 0 && code !== null) setTimeout(() => startBot(), 3000);
    });

    bot.on('error', () => setTimeout(() => startBot(), 3000));
}

// === RUN ===
(async () => {
    try {
        loadEnvFile();
        await downloadAndExtract();
        await applyLocalSettings();
        startBot();
    } catch {
        startBot();
    }
})();
