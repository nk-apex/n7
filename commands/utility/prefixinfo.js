import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const PREFIX_CONFIG_FILE = path.join(__dirname, '../../prefix_config.json');

function getCurrentPrefix() {
    try {
        if (fs.existsSync(PREFIX_CONFIG_FILE)) {
            const config = JSON.parse(fs.readFileSync(PREFIX_CONFIG_FILE, 'utf8'));
            if (config.isPrefixless) return '(none - prefixless mode)';
            if (config.prefix && config.prefix.trim() !== '') return config.prefix.trim();
        }
    } catch (error) {
        console.error('Error reading prefix config:', error);
    }

    try {
        const settingsPath = path.join(__dirname, '../../settings.js');
        if (fs.existsSync(settingsPath)) {
            const content = fs.readFileSync(settingsPath, 'utf8');
            const match = content.match(/prefix\s*[:=]\s*['"](.+?)['"]/);
            if (match) return match[1];
        }
    } catch {}

    return '.';
}

export default {
    name: 'prefixinfo',
    alias: ['prefix', 'myprefix', 'botprefix'],
    description: 'Check the current bot prefix',
    category: 'info',
    usage: 'prefixinfo',

    async execute(sock, msg, args) {
        const { remoteJid } = msg.key;
        const currentPrefix = getCurrentPrefix();

        const text = `╭─⌈ 🐺 *BOT PREFIX* ⌋\n` +
                     `├─⊷ Your prefix: *${currentPrefix}*\n` +
                     `╰───────────────\n` +
                     `> *WOLFBOT*`;

        await sock.sendMessage(remoteJid, { text }, { quoted: msg });
    }
};