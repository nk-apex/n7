import fs from 'fs';
import path from 'path';

const CONFIG_FILE = './data/channelReactConfig.json';

const alreadyReactedMessages = new Set();
const knownNewsletters = new Set();
let _reactQueue = [];
let _processingQueue = false;

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
            subscribedJids: [],
            settings: {
                minDelay: 30000,
                maxDelay: 60000
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

        if (Array.isArray(this.config.subscribedJids)) {
            for (const jid of this.config.subscribedJids) {
                knownNewsletters.add(jid);
            }
        }
    }

    loadConfig() {
        try {
            const data = fs.readFileSync(CONFIG_FILE, 'utf8');
            const parsed = JSON.parse(data);
            if (!parsed.settings) parsed.settings = { minDelay: 30000, maxDelay: 60000 };
            if (!parsed.subscribedJids) parsed.subscribedJids = [];
            return parsed;
        } catch {
            return {
                enabled: true,
                emoji: '🐺',
                totalReacted: 0,
                lastReacted: null,
                lastReactionTime: 0,
                subscribedJids: [],
                settings: { minDelay: 30000, maxDelay: 60000 }
            };
        }
    }

    saveConfig() {
        try {
            this.config.subscribedJids = [...knownNewsletters];
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2));
        } catch {}
    }

    get enabled() { return this.config.enabled; }
    get emoji() { return this.config.emoji || '🐺'; }
    get minDelay() { return this.config.settings?.minDelay || 8000; }
    get maxDelay() { return this.config.settings?.maxDelay || 15000; }

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

    setDelay(min, max) {
        if (!this.config.settings) this.config.settings = {};
        this.config.settings.minDelay = Math.max(5000, min);
        this.config.settings.maxDelay = Math.max(this.config.settings.minDelay + 2000, max);
        this.saveConfig();
    }

    registerNewsletter(jid) {
        if (!jid || !jid.endsWith('@newsletter')) return;
        if (!knownNewsletters.has(jid)) {
            knownNewsletters.add(jid);
            this.saveConfig();
        }
    }

    isKnownNewsletter(jid) {
        return knownNewsletters.has(jid);
    }

    getKnownNewsletters() {
        return [...knownNewsletters];
    }

    removeNewsletter(jid) {
        knownNewsletters.delete(jid);
        this.saveConfig();
    }

    getRandomDelay() {
        const min = this.minDelay;
        const max = this.maxDelay;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    async queueReaction(sock, newsletterJid, serverId) {
        if (!this.config.enabled) return false;

        const msgKey = `${newsletterJid}|${serverId}`;
        if (alreadyReactedMessages.has(msgKey)) return false;

        alreadyReactedMessages.add(msgKey);

        const emojis = ['🐺', '🦊'];
        const selectedEmoji = emojis[Math.floor(Math.random() * emojis.length)];

        _reactQueue.push({ sock, newsletterJid, serverId, emoji: selectedEmoji });
        this._processQueue();
        return true;
    }

    async _processQueue() {
        if (_processingQueue) return;
        _processingQueue = true;

        while (_reactQueue.length > 0) {
            const { sock, newsletterJid, serverId, emoji } = _reactQueue.shift();

            const now = Date.now();
            const timeSinceLast = now - this.lastReactionTime;
            const delay = this.getRandomDelay();

            if (timeSinceLast < delay) {
                await new Promise(r => setTimeout(r, delay - timeSinceLast));
            }

            try {
                await sock.newsletterReactMessage(newsletterJid, serverId, emoji);
                this.lastReactionTime = Date.now();
                this.config.totalReacted = (this.config.totalReacted || 0) + 1;
                this.config.lastReacted = new Date().toISOString();
                this.config.lastReactionTime = this.lastReactionTime;

                if (this.config.totalReacted % 10 === 0) {
                    this.saveConfig();
                }
            } catch (err) {
                if (err?.message?.includes('rate') || err?.message?.includes('429')) {
                    const backoff = 30000 + Math.random() * 30000;
                    console.log(`[CHANNEL-REACT] Rate limited, backing off ${Math.round(backoff / 1000)}s`);
                    await new Promise(r => setTimeout(r, backoff));
                }
            }
        }

        this.saveConfig();
        _processingQueue = false;
    }

    getStats() {
        return {
            enabled: this.config.enabled,
            emoji: this.emoji,
            totalReacted: this.config.totalReacted || 0,
            lastReacted: this.config.lastReacted,
            knownChannels: knownNewsletters.size,
            minDelay: this.minDelay,
            maxDelay: this.maxDelay,
            queueLength: _reactQueue.length
        };
    }
}

const channelReactManager = new ChannelReactManager();

export async function discoverNewsletters(sock) {
    try {
        const chats = await sock.groupFetchAllParticipating?.();
        if (chats) {
            for (const jid of Object.keys(chats)) {
                if (jid.endsWith('@newsletter')) {
                    channelReactManager.registerNewsletter(jid);
                }
            }
        }
    } catch {}
}

export async function handleChannelReact(sock, msg) {
    try {
        const chatId = msg.key?.remoteJid;
        if (!chatId || !chatId.endsWith('@newsletter')) return;

        channelReactManager.registerNewsletter(chatId);

        if (!channelReactManager.enabled) return;
        if (msg.key?.fromMe) return;

        if (!channelReactManager.isKnownNewsletter(chatId)) return;

        const serverId = msg.key?.server_id || msg.key?.id;
        if (!serverId) return;

        await channelReactManager.queueReaction(sock, chatId, serverId);
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
                text += `│ Known Channels: ${stats.knownChannels}\n`;
                text += `│ Delay: ${stats.minDelay / 1000}s - ${stats.maxDelay / 1000}s\n`;
                if (stats.queueLength > 0) {
                    text += `│ Queue: ${stats.queueLength} pending\n`;
                }
                if (stats.lastReacted) {
                    text += `│ Last Reacted: ${new Date(stats.lastReacted).toLocaleString()}\n`;
                }
                text += `│\n`;
                text += `├─⊷ *${prefix}channelreact on*\n│  └⊷ Enable auto-react\n`;
                text += `├─⊷ *${prefix}channelreact off*\n│  └⊷ Disable auto-react\n`;
                text += `├─⊷ *${prefix}channelreact emoji <emoji>*\n│  └⊷ Set reaction emoji\n`;
                text += `├─⊷ *${prefix}channelreact delay <min> <max>*\n│  └⊷ Set delay in seconds (e.g. 8 15)\n`;
                text += `├─⊷ *${prefix}channelreact channels*\n│  └⊷ List known channels\n`;
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
                        text: `✅ *CHANNEL AUTO-REACT ENABLED*\n\nBot will auto-react to subscribed channel messages with ${channelReactManager.emoji}\nDelay: ${channelReactManager.minDelay / 1000}s - ${channelReactManager.maxDelay / 1000}s\nKnown channels: ${knownNewsletters.size}\n\nUse \`${prefix}channelreact off\` to disable.`
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

                case 'delay':
                case 'setdelay':
                case 'speed': {
                    if (!isOwner) {
                        await sock.sendMessage(chatId, { text: '❌ Owner only command!' }, { quoted: m });
                        return;
                    }

                    const minSec = parseInt(args[1]);
                    const maxSec = parseInt(args[2]);

                    if (!minSec || minSec < 5) {
                        await sock.sendMessage(chatId, {
                            text: `❌ Invalid delay!\n\nUsage: \`${prefix}channelreact delay <min_sec> <max_sec>\`\nExample: \`${prefix}channelreact delay 8 15\`\n\nMinimum: 5 seconds (to avoid bans)\nCurrent: ${channelReactManager.minDelay / 1000}s - ${channelReactManager.maxDelay / 1000}s`
                        }, { quoted: m });
                        return;
                    }

                    const finalMax = maxSec && maxSec > minSec ? maxSec : minSec + 7;
                    channelReactManager.setDelay(minSec * 1000, finalMax * 1000);

                    await sock.sendMessage(chatId, {
                        text: `✅ *REACTION DELAY UPDATED*\n\nDelay: ${channelReactManager.minDelay / 1000}s - ${channelReactManager.maxDelay / 1000}s\n\nReactions will be spaced with random delays in this range to avoid bans.`
                    }, { quoted: m });
                    break;
                }

                case 'channels':
                case 'list':
                case 'jids': {
                    const newsletters = channelReactManager.getKnownNewsletters();

                    if (newsletters.length === 0) {
                        await sock.sendMessage(chatId, {
                            text: `📢 *NO CHANNELS DETECTED YET*\n\nThe bot hasn't received any channel messages yet.\nChannels will be auto-detected as messages arrive.`
                        }, { quoted: m });
                        return;
                    }

                    let text = `╭─⌈ 📢 *SUBSCRIBED CHANNELS* ⌋\n│\n`;
                    text += `│ Total: ${newsletters.length}\n│\n`;
                    for (let i = 0; i < newsletters.length; i++) {
                        const jid = newsletters[i];
                        const shortId = jid.split('@')[0];
                        text += `├─ ${i + 1}. ${shortId}\n`;
                    }
                    text += `│\n╰───`;

                    await sock.sendMessage(chatId, { text }, { quoted: m });
                    break;
                }

                case 'stats':
                case 'info': {
                    const stats = channelReactManager.getStats();
                    let text = `📊 *CHANNEL REACT STATS*\n\n`;
                    text += `Status: ${stats.enabled ? '✅ Active' : '❌ Inactive'}\n`;
                    text += `Emoji: ${stats.emoji}\n`;
                    text += `Total Reacted: ${stats.totalReacted}\n`;
                    text += `Known Channels: ${stats.knownChannels}\n`;
                    text += `Delay: ${stats.minDelay / 1000}s - ${stats.maxDelay / 1000}s\n`;
                    if (stats.queueLength > 0) {
                        text += `Queue: ${stats.queueLength} pending\n`;
                    }
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
