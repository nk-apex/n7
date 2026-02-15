import fs from 'fs';
import { join } from 'path';
import { jidNormalizedUser } from '@whiskeysockets/baileys';

const CONFIG_DIR = './data/antiviewonce';
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');
const PRIVATE_DIR = './data/viewonce_private';

function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        }
    } catch {}
    return { mode: 'private', ownerJid: '' };
}

function saveConfig(config) {
    try {
        if (!fs.existsSync(CONFIG_DIR)) {
            fs.mkdirSync(CONFIG_DIR, { recursive: true });
        }
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    } catch {}
}

export default {
    name: 'antiviewonce',
    alias: ['av'],
    description: 'Anti-ViewOnce: private/public/off modes',
    category: 'owner',
    ownerOnly: true,
    
    async execute(sock, msg, args, prefix, extras) {
        const chatId = msg.key.remoteJid;
        const isOwner = extras?.isOwner ? extras.isOwner() : false;
        const isSudoUser = extras?.isSudo ? extras.isSudo() : false;
        
        if (!isOwner && !isSudoUser) {
            await sock.sendMessage(chatId, {
                text: '❌ Owner only command'
            }, { quoted: msg });
            return;
        }
        
        const ownerJid = jidNormalizedUser(msg.key.participant || chatId);
        const action = args[0]?.toLowerCase() || 'settings';
        const config = loadConfig();
        
        switch (action) {
            case 'private': {
                saveConfig({ mode: 'private', ownerJid, updatedAt: new Date().toISOString() });
                await sock.sendMessage(chatId, {
                    text: `✅ *ANTI-VIEWONCE: PRIVATE MODE*\n\n` +
                         `View-once media will be sent to your DMs:\n` +
                         `• Images ✅\n• Videos ✅\n• Audio ✅\n\n` +
                         `📱 Send a view-once message to test!`
                }, { quoted: msg });
                break;
            }
            case 'public': {
                saveConfig({ mode: 'public', ownerJid, updatedAt: new Date().toISOString() });
                await sock.sendMessage(chatId, {
                    text: `✅ *ANTI-VIEWONCE: PUBLIC MODE*\n\n` +
                         `View-once media will be revealed in the original chat:\n` +
                         `• Images ✅\n• Videos ✅\n• Audio ✅\n\n` +
                         `Everyone in the chat can see the media!`
                }, { quoted: msg });
                break;
            }
            case 'off':
            case 'disable': {
                saveConfig({ mode: 'off', ownerJid, updatedAt: new Date().toISOString() });
                await sock.sendMessage(chatId, {
                    text: '❌ *ANTI-VIEWONCE DISABLED*\n\nNo view-once media will be captured.'
                }, { quoted: msg });
                break;
            }
            case 'on':
            case 'enable': {
                saveConfig({ mode: 'private', ownerJid, updatedAt: new Date().toISOString() });
                await sock.sendMessage(chatId, {
                    text: `✅ *ANTI-VIEWONCE ENABLED (PRIVATE)*\n\n` +
                         `View-once media will be sent to your DMs:\n` +
                         `• Images ✅\n• Videos ✅\n• Audio ✅\n\n` +
                         `Use \`${prefix}av public\` to reveal in chat instead.`
                }, { quoted: msg });
                break;
            }
            case 'settings':
            case 'status':
            case 'check':
            case 'info': {
                const modeDisplay = config.mode === 'private' ? '🔒 Private (Owner DM)' :
                                   config.mode === 'public' ? '🌐 Public (In Chat)' :
                                   '❌ Off';
                let capturedCount = 0;
                try {
                    if (fs.existsSync(PRIVATE_DIR)) {
                        capturedCount = fs.readdirSync(PRIVATE_DIR).filter(f => !f.endsWith('.json')).length;
                    }
                } catch {}
                await sock.sendMessage(chatId, {
                    text: `🔐 *ANTI-VIEWONCE SETTINGS*\n\n` +
                         `*Mode:* ${modeDisplay}\n` +
                         `*Owner:* ${config.ownerJid ? '✅ Set' : '❌ Not set'}\n` +
                         `*Captured:* ${capturedCount} media files\n\n` +
                         `*Commands:*\n` +
                         `\`${prefix}av private\` - Send to owner DM\n` +
                         `\`${prefix}av public\` - Reveal in chat\n` +
                         `\`${prefix}av off\` - Disable\n` +
                         `\`${prefix}av settings\` - This menu`
                }, { quoted: msg });
                break;
            }
            default:
                await sock.sendMessage(chatId, {
                    text: `🔐 *ANTI-VIEWONCE*\n\n` +
                         `\`${prefix}av private\` - Send to owner DM\n` +
                         `\`${prefix}av public\` - Reveal in chat\n` +
                         `\`${prefix}av off\` - Disable\n` +
                         `\`${prefix}av settings\` - Check status`
                }, { quoted: msg });
        }
    }
};
