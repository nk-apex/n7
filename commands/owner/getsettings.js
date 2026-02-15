import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getWarnLimit as getPerGroupLimit } from '../../lib/warnings-store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function safeReadJSON(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
    } catch {}
    return null;
}

function getPrefix() {
    const prefixData = safeReadJSON(path.join(__dirname, '../../data/prefix.json'));
    if (prefixData?.prefix !== undefined) return prefixData.prefix || 'none (prefixless)';

    const settingsData = safeReadJSON(path.join(__dirname, '../../settings.json'));
    if (settingsData?.prefix) return settingsData.prefix;

    const botSettings = safeReadJSON(path.join(__dirname, '../../bot_settings.json'));
    if (botSettings?.prefix) return botSettings.prefix;

    if (global.prefix) return global.prefix;
    if (global.CURRENT_PREFIX) return global.CURRENT_PREFIX;
    if (process.env.PREFIX) return process.env.PREFIX;

    return '?';
}

function getPrefixlessStatus() {
    const prefixData = safeReadJSON(path.join(__dirname, '../../data/prefix.json'));
    if (prefixData?.isPrefixless) return true;
    return false;
}

function getBotMode() {
    const data = safeReadJSON(path.join(__dirname, '../../bot_mode.json'));
    return data?.mode || 'public';
}

function getAutotypingState() {
    const data = safeReadJSON(path.join(__dirname, '../../data/autotyping/config.json'));
    if (!data) return 'OFF';
    if (!data.enabled) return 'OFF';
    return `ON (${data.mode || 'all'})`;
}

function getAutorecordingState() {
    const data = safeReadJSON(path.join(__dirname, '../../data/autorecording/config.json'));
    if (!data) return 'OFF';
    if (!data.enabled) return 'OFF';
    return `ON (${data.mode || 'all'})`;
}

function getAnticallState() {
    const data = safeReadJSON(path.join(__dirname, '../../data/anticall/config.json'));
    if (!data) return 'OFF';
    if (!data.enabled) return 'OFF';
    return `ON (${data.action || 'reject'})`;
}

function getAnticallMessage() {
    const data = safeReadJSON(path.join(__dirname, '../../data/anticall/config.json'));
    return data?.message || 'Calls are not allowed!';
}

function getMenuStyle() {
    const data = safeReadJSON(path.join(__dirname, '../../data/menustyle.json'));
    return data?.style || '1';
}

function getMenuImage() {
    const imgPath1 = path.join(__dirname, '../menus/media/wolfbot.jpg');
    const imgPath2 = path.join(__dirname, '../media/wolfbot.jpg');
    if (fs.existsSync(imgPath1)) return imgPath1;
    if (fs.existsSync(imgPath2)) return imgPath2;
    return null;
}

function getMenuImageUrl() {
    const configPaths = [
        path.join(__dirname, '../../data/menuimage.json'),
        path.join(__dirname, '../../data/menu_image.json')
    ];
    for (const p of configPaths) {
        const data = safeReadJSON(p);
        if (data?.url) return data.url;
    }
    const imgPath = getMenuImage();
    if (imgPath) return 'Local (wolfbot.jpg)';
    return 'Default';
}

function getWelcomeStatus() {
    const data = safeReadJSON(path.join(__dirname, '../../data/welcome_data.json'));
    if (!data) return 'No groups configured';
    const count = Object.keys(data).length;
    return `${count} group(s) configured`;
}

function getGoodbyeStatus() {
    const data = safeReadJSON(path.join(__dirname, '../../data/goodbye_data.json'));
    if (!data) return 'No groups configured';
    const count = Object.keys(data).length;
    return `${count} group(s) configured`;
}

function getFooter() {
    const data = safeReadJSON(path.join(__dirname, '../../data/footer.json'));
    return data?.footer || 'WOLFBOT is the ALPHA';
}

function getAntideleteState() {
    const data = safeReadJSON(path.join(__dirname, '../../data/antidelete/antidelete.json'));
    if (!data) return 'PRIVATE (default)';
    return (data.mode || 'private').toUpperCase();
}

function getAntiViewOnceState() {
    const data = safeReadJSON(path.join(__dirname, '../../data/antiviewonce/config.json'));
    if (!data) return 'PRIVATE (default)';
    return (data.mode || 'private').toUpperCase();
}

function getAutoreadState() {
    const data = safeReadJSON(path.join(__dirname, '../../data/autoread/config.json'));
    if (!data) return 'OFF';
    return data.enabled ? 'ON' : 'OFF';
}

function getAntibugState() {
    const data = safeReadJSON(path.join(__dirname, '../../data/antibug/config.json'));
    if (!data) return 'No groups enabled';
    const enabled = Object.values(data).filter(v => v?.enabled);
    if (enabled.length === 0) return 'No groups enabled';
    return `${enabled.length} group(s) enabled`;
}

function detectPlatform() {
    if (process.env.REPL_ID || process.env.REPLIT_DB_URL || process.env.REPL_SLUG || process.env.REPL_OWNER) return 'Replit';
    if (process.env.DYNO || process.env.HEROKU_APP_NAME) return 'Heroku';
    if (process.env.RENDER || process.env.RENDER_SERVICE_ID) return 'Render';
    if (process.env.RAILWAY_STATIC_URL || process.env.RAILWAY_SERVICE_ID) return 'Railway';
    if (process.env.VERCEL || process.env.VERCEL_URL) return 'Vercel';
    if (process.env.AWS_LAMBDA_FUNCTION_NAME) return 'AWS';
    if (process.env.GOOGLE_CLOUD_PROJECT) return 'Google Cloud';
    if (process.env.FLY_APP_NAME) return 'Fly.io';
    if (process.env.KOYEB_APP_NAME) return 'Koyeb';
    if (fs.existsSync('/.dockerenv')) return 'Docker';
    return 'VPS / Local';
}

function formatUptime(seconds) {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const min = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (min > 0) parts.push(`${min}m`);
    parts.push(`${s}s`);
    return parts.join(' ');
}

function countCommands(dir) {
    let count = 0;
    try {
        const items = fs.readdirSync(dir);
        for (const item of items) {
            const full = path.join(dir, item);
            const stat = fs.statSync(full);
            if (stat.isDirectory()) count += countCommands(full);
            else if (item.endsWith('.js')) count++;
        }
    } catch {}
    return count;
}

export default {
    name: 'getsettings',
    alias: ['settings', 'config', 'botconfig', 'showconfig'],
    description: 'View all bot settings and configuration',
    category: 'owner',

    async execute(sock, msg, args, PREFIX, extra) {
        const chatId = msg.key.remoteJid;
        const { jidManager } = extra;

        const isSudoUser = extra?.isSudo ? extra.isSudo() : false;
        if (!jidManager.isOwner(msg) && !isSudoUser) {
            return sock.sendMessage(chatId, {
                text: '❌ *Owner Only Command!*\n\nOnly the bot owner can view settings.'
            }, { quoted: msg });
        }

        try {
            const ownerData = safeReadJSON(path.join(__dirname, '../../owner.json')) || {};
            const ownerNumber = ownerData.OWNER_NUMBER || sock.user?.id?.split('@')[0] || 'Unknown';
            const isPrefixless = getPrefixlessStatus();
            const prefix = isPrefixless ? 'none (prefixless)' : getPrefix();
            const mode = getBotMode();
            const autotyping = getAutotypingState();
            const autorecording = getAutorecordingState();
            const anticall = getAnticallState();
            const anticallMsg = getAnticallMessage();
            const menuStyle = getMenuStyle();
            const menuImageUrl = getMenuImageUrl();
            const warnLimit = getPerGroupLimit('default');
            const welcomeStatus = getWelcomeStatus();
            const goodbyeStatus = getGoodbyeStatus();
            const footer = getFooter();
            const antidelete = getAntideleteState();
            const antiViewOnce = getAntiViewOnceState();
            const autoread = getAutoreadState();
            const antibug = getAntibugState();
            const platform = detectPlatform();
            const uptime = formatUptime(process.uptime());
            const memUsage = `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)}MB`;
            const totalCmds = countCommands(path.join(__dirname, '../../commands'));

            let caption = `⚙️  \`W.O.L.F  𝚂𝙴𝚃𝚃𝙸𝙽𝙶𝚂\`\n\n`;

            caption += `┌─── *BASIC CONFIG* ───\n`;
            caption += `│ ◎ *Bot Name:* WOLFBOT\n`;
            caption += `│ ◎ *Owner:* ${ownerNumber}\n`;
            caption += `│ ◎ *Prefix:* ${prefix}\n`;
            caption += `│ ◎ *Prefixless:* ${isPrefixless ? '✅ ON' : '❌ OFF'}\n`;
            caption += `│ ◎ *Mode:* ${mode.toUpperCase()}\n`;
            caption += `│ ◎ *Menu Style:* ${menuStyle}\n`;
            caption += `│ ◎ *Menu Image:* ${menuImageUrl}\n`;
            caption += `│ ◎ *Footer/Caption:* ${footer}\n`;
            caption += `└──────────────\n\n`;

            caption += `┌─── *AUTOMATION* ───\n`;
            caption += `│ ◎ *Autotyping:* ${autotyping}\n`;
            caption += `│ ◎ *Autorecording:* ${autorecording}\n`;
            caption += `│ ◎ *Autoread:* ${autoread}\n`;
            caption += `└──────────────\n\n`;

            caption += `┌─── *PROTECTION* ───\n`;
            caption += `│ ◎ *Anticall:* ${anticall}\n`;
            caption += `│ ◎ *Anticall Msg:* ${anticallMsg.substring(0, 40)}${anticallMsg.length > 40 ? '...' : ''}`;
            caption += `\n│ ◎ *Antidelete:* ${antidelete}\n`;
            caption += `│ ◎ *Anti-ViewOnce:* ${antiViewOnce}\n`;
            caption += `│ ◎ *Antibug:* ${antibug}\n`;
            caption += `│ ◎ *Warn Limit:* ${warnLimit}\n`;
            caption += `└──────────────\n\n`;

            caption += `┌─── *GROUP FEATURES* ───\n`;
            caption += `│ ◎ *Welcome:* ${welcomeStatus}\n`;
            caption += `│ ◎ *Goodbye:* ${goodbyeStatus}\n`;
            caption += `└──────────────\n\n`;

            caption += `┌─── *BOT STATS* ───\n`;
            caption += `│ ◎ *Uptime:* ${uptime}\n`;
            caption += `│ ◎ *Memory:* ${memUsage}\n`;
            caption += `│ ◎ *Commands:* ${totalCmds}\n`;
            caption += `│ ◎ *Node:* ${process.version}\n`;
            caption += `│ ◎ *Platform:* ${platform}\n`;
            caption += `│ ◎ *OS:* ${process.platform} ${process.arch}\n`;
            caption += `└──────────────\n\n`;

            caption += `🕒 *Updated:* ${new Date().toLocaleString()}\n`;
            caption += `🔧 *Use* \`${PREFIX}setsetting\` *to change settings*`;

            const imagePath = getMenuImage();

            if (imagePath) {
                const imageBuffer = fs.readFileSync(imagePath);
                await sock.sendMessage(chatId, {
                    image: imageBuffer,
                    caption: caption,
                    mimetype: 'image/jpeg'
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: caption }, { quoted: msg });
            }

        } catch (error) {
            console.error('[GetSettings] Error:', error);
            await sock.sendMessage(chatId, {
                text: '❌ Failed to load settings: ' + error.message
            }, { quoted: msg });
        }
    }
};
