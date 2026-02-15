import fs from 'fs';

const CONFIG_FILE = './data/autotyping/config.json';

const autoTypingConfig = {
    mode: 'off',
    duration: 10,
    activeTypers: new Map(),
    botSock: null,
    isHooked: false
};

function ensureDir() {
    if (!fs.existsSync('./data/autotyping')) fs.mkdirSync('./data/autotyping', { recursive: true });
}

function loadConfig() {
    try {
        ensureDir();
        if (fs.existsSync(CONFIG_FILE)) {
            const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
            autoTypingConfig.mode = data.mode || 'off';
            autoTypingConfig.duration = data.duration || 10;
        }
    } catch {}
}

function saveConfig() {
    try {
        ensureDir();
        fs.writeFileSync(CONFIG_FILE, JSON.stringify({
            mode: autoTypingConfig.mode,
            duration: autoTypingConfig.duration
        }, null, 2));
    } catch {}
}

loadConfig();

function shouldTypeInChat(chatJid) {
    const mode = autoTypingConfig.mode;
    if (mode === 'off') return false;
    const isGroup = chatJid.endsWith('@g.us');
    if (mode === 'both') return true;
    if (mode === 'groups' && isGroup) return true;
    if (mode === 'dm' && !isGroup) return true;
    return false;
}

class AutoTypingManager {
    static initialize(sock) {
        if (!autoTypingConfig.isHooked && sock) {
            autoTypingConfig.botSock = sock;
            this.hookIntoBot();
            autoTypingConfig.isHooked = true;
        }
    }

    static hookIntoBot() {
        if (!autoTypingConfig.botSock?.ev) return;
        autoTypingConfig.botSock.ev.on('messages.upsert', async (data) => {
            await this.handleIncomingMessage(data);
        });
    }

    static async handleIncomingMessage(data) {
        try {
            if (!data?.messages?.length) return;
            const m = data.messages[0];
            const sock = autoTypingConfig.botSock;
            if (!m?.key || m.key.fromMe || autoTypingConfig.mode === 'off') return;

            const messageText = m.message?.conversation ||
                m.message?.extendedTextMessage?.text ||
                m.message?.imageMessage?.caption || '';
            if (messageText.trim().startsWith('.')) return;

            const chatJid = m.key.remoteJid;
            if (!chatJid || !shouldTypeInChat(chatJid)) return;

            const now = Date.now();

            if (autoTypingConfig.activeTypers.has(chatJid)) {
                const typerData = autoTypingConfig.activeTypers.get(chatJid);
                typerData.lastMessageTime = now;
                if (typerData.timeoutId) clearTimeout(typerData.timeoutId);
                typerData.timeoutId = setTimeout(async () => {
                    await this.stopTypingInChat(chatJid, sock);
                }, autoTypingConfig.duration * 1000);
                return;
            }

            await sock.sendPresenceUpdate('composing', chatJid);

            const keepAlive = setInterval(async () => {
                try {
                    if (autoTypingConfig.activeTypers.has(chatJid)) {
                        await sock.sendPresenceUpdate('composing', chatJid);
                    }
                } catch {}
            }, 2000);

            const timeoutId = setTimeout(async () => {
                await this.stopTypingInChat(chatJid, sock);
            }, autoTypingConfig.duration * 1000);

            autoTypingConfig.activeTypers.set(chatJid, {
                intervalId: keepAlive,
                timeoutId,
                startTime: now,
                lastMessageTime: now
            });

        } catch (err) {
            console.error("Auto-typing handler error:", err.message);
        }
    }

    static async stopTypingInChat(chatJid, sock) {
        if (autoTypingConfig.activeTypers.has(chatJid)) {
            const typerData = autoTypingConfig.activeTypers.get(chatJid);
            clearInterval(typerData.intervalId);
            if (typerData.timeoutId) clearTimeout(typerData.timeoutId);
            autoTypingConfig.activeTypers.delete(chatJid);
            try { await sock.sendPresenceUpdate('paused', chatJid); } catch {}
        }
    }

    static clearAllTypers() {
        autoTypingConfig.activeTypers.forEach((typerData) => {
            clearInterval(typerData.intervalId);
            if (typerData.timeoutId) clearTimeout(typerData.timeoutId);
        });
        autoTypingConfig.activeTypers.clear();
    }
}

export default {
    name: "autotyping",
    alias: ["autotype", "fake", "typingsim", "typingtoggle", "atype", "typingmode", "typing"],
    desc: "Toggle auto fake typing/recording indicator",
    category: "Owner",
    usage: ".autotyping [dm|groups|both|off|status]",

    async execute(sock, m, args, PREFIX, extra) {
        try {
            const targetJid = m.key.remoteJid;

            if (!autoTypingConfig.isHooked) {
                autoTypingConfig.botSock = sock;
                AutoTypingManager.hookIntoBot();
                autoTypingConfig.isHooked = true;
            }

            const isOwner = extra?.jidManager?.isOwner(m) || m.key.fromMe;
            if (!isOwner) {
                return sock.sendMessage(targetJid, {
                    text: '❌ *Owner Only Command*'
                }, { quoted: m });
            }

            const sub = (args[0] || '').toLowerCase();

            if (!sub || sub === 'status' || sub === 'info') {
                const mode = autoTypingConfig.mode;
                const modeLabels = {
                    off: '❌ OFF',
                    dm: '💬 DMs only',
                    groups: '👥 Groups only',
                    both: '🌐 DMs + Groups'
                };

                return sock.sendMessage(targetJid, {
                    text: `🤖 *Auto-Typing Status*\n\n` +
                        `• Mode: ${modeLabels[mode] || mode}\n` +
                        `• Duration: ${autoTypingConfig.duration}s\n` +
                        `• Active sessions: ${autoTypingConfig.activeTypers.size}\n\n` +
                        `*Commands:*\n` +
                        `• \`${PREFIX}autotyping dm\` — DMs only\n` +
                        `• \`${PREFIX}autotyping groups\` — Groups only\n` +
                        `• \`${PREFIX}autotyping both\` — Both DMs & groups\n` +
                        `• \`${PREFIX}autotyping off\` — Disable\n` +
                        `• \`${PREFIX}autotyping <1-60>\` — Set duration`
                }, { quoted: m });
            }

            if (['dm', 'dms', 'private'].includes(sub)) {
                autoTypingConfig.mode = 'dm';
                saveConfig();
                AutoTypingManager.clearAllTypers();
                return sock.sendMessage(targetJid, {
                    text: `✅ *Auto-Typing: DMs Only*\n\nBot will show typing indicator in private messages only.\nDuration: ${autoTypingConfig.duration}s`
                }, { quoted: m });
            }

            if (['groups', 'group', 'gc'].includes(sub)) {
                autoTypingConfig.mode = 'groups';
                saveConfig();
                AutoTypingManager.clearAllTypers();
                return sock.sendMessage(targetJid, {
                    text: `✅ *Auto-Typing: Groups Only*\n\nBot will show typing indicator in group chats only.\nDuration: ${autoTypingConfig.duration}s`
                }, { quoted: m });
            }

            if (['both', 'all', 'on', 'enable'].includes(sub)) {
                autoTypingConfig.mode = 'both';
                saveConfig();
                return sock.sendMessage(targetJid, {
                    text: `✅ *Auto-Typing: DMs + Groups*\n\nBot will show typing indicator in all chats.\nDuration: ${autoTypingConfig.duration}s`
                }, { quoted: m });
            }

            if (['off', 'disable', 'stop'].includes(sub)) {
                autoTypingConfig.mode = 'off';
                saveConfig();
                AutoTypingManager.clearAllTypers();
                return sock.sendMessage(targetJid, {
                    text: `❌ *Auto-Typing Disabled*\n\nBot will no longer show typing indicator.`
                }, { quoted: m });
            }

            const duration = parseInt(sub);
            if (!isNaN(duration) && duration >= 1 && duration <= 60) {
                autoTypingConfig.duration = duration;
                saveConfig();
                return sock.sendMessage(targetJid, {
                    text: `✅ *Duration set to ${duration}s*\n\nCurrent mode: ${autoTypingConfig.mode}`
                }, { quoted: m });
            }

            return sock.sendMessage(targetJid, {
                text: `🤖 *Auto-Typing*\n\n` +
                    `*Modes:*\n` +
                    `• \`${PREFIX}autotyping dm\` — DMs only\n` +
                    `• \`${PREFIX}autotyping groups\` — Groups only\n` +
                    `• \`${PREFIX}autotyping both\` — Both\n` +
                    `• \`${PREFIX}autotyping off\` — Disable\n` +
                    `• \`${PREFIX}autotyping <1-60>\` — Set duration`
            }, { quoted: m });

        } catch (err) {
            console.error("AutoTyping error:", err);
            await sock.sendMessage(m.key.remoteJid, {
                text: `❌ AutoTyping error: ${err.message}`
            }, { quoted: m });
        }
    }
};
