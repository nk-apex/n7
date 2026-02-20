import fs from 'fs';
import path from 'path';
import supabase from '../../lib/supabase.js';

const CONFIG_FILE = './data/channelReactConfig.json';

const alreadyReactedMessages = new Set();

function initConfig() {
    const configDir = path.dirname(CONFIG_FILE);
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }

    if (!fs.existsSync(CONFIG_FILE)) {
        const defaultConfig = {
            enabled: true,
            emoji: '🐺',
            totalReacted: 0,
            lastReacted: null,
            lastReactionTime: 0,
            settings: {
                rateLimitDelay: 2000
            }
        };
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
    }

    setInterval(() => {
        alreadyReactedMessages.clear();
    }, 60 * 60 * 1000);
}

initConfig();

class ChannelReactManager {
    constructor() {
        this.config = this.loadConfig();
        this.lastReactionTime = this.config.lastReactionTime || 0;
        this.syncFromDatabase();
    }

    async syncFromDatabase() {
        try {
            if (supabase.isAvailable()) {
                const dbData = await supabase.getConfig('channel_react_config');
                if (dbData && typeof dbData === 'object' && Object.keys(dbData).length > 0) {
                    this.config = { ...this.config, ...dbData };
                    this.lastReactionTime = this.config.lastReactionTime || 0;
                    fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2));
                }
            }
        } catch {}
    }

    loadConfig() {
        try {
            const data = fs.readFileSync(CONFIG_FILE, 'utf8');
            return JSON.parse(data);
        } catch {
            return { enabled: true, emoji: '🐺', totalReacted: 0, lastReacted: null, lastReactionTime: 0, settings: { rateLimitDelay: 2000 } };
        }
    }

    saveConfig() {
        try {
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2));
            if (supabase.isAvailable()) {
                supabase.saveConfig('channel_react_config', this.config).catch(() => {});
            }
        } catch {}
    }

    get enabled() { return this.config.enabled; }
    get emoji() { return this.config.emoji || '🐺'; }

    toggle(forceOff = false) {
        if (forceOff) {
            this.config.enabled = false;
        } else {
            this.config.enabled = !this.config.enabled;
        }
        this.saveConfig();
        return this.config.enabled;
    }

    enable() {
        this.config.enabled = true;
        this.saveConfig();
        return true;
    }

    disable() {
        this.config.enabled = false;
        this.saveConfig();
        return false;
    }

    setEmoji(emoji) {
        this.config.emoji = emoji;
        this.saveConfig();
        return emoji;
    }

    async reactToChannelMessage(sock, newsletterJid, serverId) {
        if (!this.config.enabled) return false;

        const msgKey = `${newsletterJid}|${serverId}`;
        if (alreadyReactedMessages.has(msgKey)) return false;

        const now = Date.now();
        const delay = this.config.settings?.rateLimitDelay || 2000;
        if (now - this.lastReactionTime < delay) {
            await new Promise(r => setTimeout(r, delay - (now - this.lastReactionTime)));
        }

        try {
            await sock.newsletterReactMessage(newsletterJid, serverId, this.emoji);
            alreadyReactedMessages.add(msgKey);
            this.lastReactionTime = Date.now();
            this.config.totalReacted = (this.config.totalReacted || 0) + 1;
            this.config.lastReacted = new Date().toISOString();
            this.config.lastReactionTime = this.lastReactionTime;
            this.saveConfig();
            return true;
        } catch (err) {
            return false;
        }
    }

    getStats() {
        return {
            enabled: this.config.enabled,
            emoji: this.emoji,
            totalReacted: this.config.totalReacted || 0,
            lastReacted: this.config.lastReacted
        };
    }
}

const channelReactManager = new ChannelReactManager();

export async function handleChannelReact(sock, msg) {
    try {
        if (!channelReactManager.enabled) return;

        const chatId = msg.key?.remoteJid;
        if (!chatId || !chatId.endsWith('@newsletter')) return;

        if (msg.key?.fromMe) return;

        const serverId = msg.key?.server_id || msg.key?.id;
        if (!serverId) return;

        await channelReactManager.reactToChannelMessage(sock, chatId, serverId);
    } catch (err) {
        console.log(`[CHANNEL-REACT] Error: ${err?.message || err}`);
    }
}

export { channelReactManager };

export default {
    name: 'channelreact',
    alias: ['chreact', 'cr', 'reactchannel', 'channelautoreact'],
    desc: 'Auto-react to WhatsApp channel messages with emoji',
    category: 'channel',
    ownerOnly: false,

    async execute(sock, m, args, prefix, extra) {
        try {
            const isOwner = extra?.isOwner?.() || false;
            const chatId = m.key.remoteJid;

            if (args.length === 0) {
                const stats = channelReactManager.getStats();

                let text = `╭─⌈ 📢 *CHANNEL AUTO-REACT* ⌋\n│\n`;
                text += `│ Status: ${stats.enabled ? '✅ *ACTIVE*' : '❌ *INACTIVE*'}\n`;
                text += `│ Emoji: ${stats.emoji}\n`;
                text += `│ Total Reacted: ${stats.totalReacted}\n`;
                if (stats.lastReacted) {
                    text += `│ Last Reacted: ${new Date(stats.lastReacted).toLocaleString()}\n`;
                }
                text += `│\n`;
                text += `├─⊷ *${prefix}channelreact on*\n│  └⊷ Enable auto-react\n`;
                text += `├─⊷ *${prefix}channelreact off*\n│  └⊷ Disable auto-react\n`;
                text += `├─⊷ *${prefix}channelreact emoji <emoji>*\n│  └⊷ Set reaction emoji\n`;
                text += `├─⊷ *${prefix}channelreact stats*\n│  └⊷ View statistics\n`;
                text += `╰───`;

                await sock.sendMessage(chatId, { text }, { quoted: m });
                return;
            }

            const action = args[0].toLowerCase();

            switch (action) {
                case 'on':
                case 'enable':
                case 'start': {
                    if (!isOwner) {
                        await sock.sendMessage(chatId, { text: '❌ Owner only command!' }, { quoted: m });
                        return;
                    }

                    channelReactManager.enable();
                    await sock.sendMessage(chatId, {
                        text: `✅ *CHANNEL AUTO-REACT ENABLED*\n\n🐺 Bot will now auto-react to channel messages with ${channelReactManager.emoji}\n\nUse \`${prefix}channelreact off\` to disable.`
                    }, { quoted: m });
                    break;
                }

                case 'off':
                case 'disable':
                case 'stop': {
                    if (!isOwner) {
                        await sock.sendMessage(chatId, { text: '❌ Owner only command!' }, { quoted: m });
                        return;
                    }

                    channelReactManager.disable();
                    await sock.sendMessage(chatId, {
                        text: `❌ *CHANNEL AUTO-REACT DISABLED*\n\nBot will no longer auto-react to channel messages.\n\nUse \`${prefix}channelreact on\` to re-enable.`
                    }, { quoted: m });
                    break;
                }

                case 'emoji':
                case 'setemoji':
                case 'set': {
                    if (!isOwner) {
                        await sock.sendMessage(chatId, { text: '❌ Owner only command!' }, { quoted: m });
                        return;
                    }

                    const emoji = args.slice(1).join(' ').trim();
                    if (!emoji) {
                        await sock.sendMessage(chatId, {
                            text: `❌ Please provide an emoji!\n\nUsage: \`${prefix}channelreact emoji ❤️\`\n\nCurrent emoji: ${channelReactManager.emoji}`
                        }, { quoted: m });
                        return;
                    }

                    const oldEmoji = channelReactManager.emoji;
                    channelReactManager.setEmoji(emoji);
                    await sock.sendMessage(chatId, {
                        text: `✅ *REACTION EMOJI UPDATED*\n\n${oldEmoji} → ${emoji}\n\nAll channel reactions will now use ${emoji}`
                    }, { quoted: m });
                    break;
                }

                case 'stats':
                case 'info': {
                    const stats = channelReactManager.getStats();
                    let text = `📊 *CHANNEL REACT STATS*\n\n`;
                    text += `Status: ${stats.enabled ? '✅ Active' : '❌ Inactive'}\n`;
                    text += `Emoji: ${stats.emoji}\n`;
                    text += `Total Reacted: ${stats.totalReacted}\n`;
                    if (stats.lastReacted) {
                        text += `Last Reacted: ${new Date(stats.lastReacted).toLocaleString()}\n`;
                    }

                    await sock.sendMessage(chatId, { text }, { quoted: m });
                    break;
                }

                default: {
                    await sock.sendMessage(chatId, {
                        text: `❌ Unknown option: *${action}*\n\nUse \`${prefix}channelreact\` to see available options.`
                    }, { quoted: m });
                    break;
                }
            }
        } catch (error) {
            console.error('channelreact error:', error);
            await sock.sendMessage(m.key.remoteJid, {
                text: `❌ Error: ${error.message}`
            }, { quoted: m });
        }
    }
};
