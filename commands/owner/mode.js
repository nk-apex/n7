import { writeFileSync, readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    name: 'mode',
    alias: ['botmode', 'setmode'],
    category: 'owner',
    description: 'Change bot operating mode',
    ownerOnly: true,
    
    async execute(sock, msg, args, PREFIX, extra) {
        const chatId = msg.key.remoteJid;
        const { jidManager } = extra;
        
        const isSudoUser = extra?.isSudo ? extra.isSudo() : false;
        if (!jidManager.isOwner(msg) && !isSudoUser) {
            return sock.sendMessage(chatId, {
                text: `❌ *Owner Only Command!*\n\nOnly the bot owner can change the bot mode.`
            }, { quoted: msg });
        }
        
        const modes = {
            'public': {
                name: '🌍 Public Mode',
                description: 'Bot responds to everyone in all chats',
                icon: '🌍'
            },
            'groups': {
                name: '👥 Groups Only',
                description: 'Bot responds only in group chats',
                icon: '👥'
            },
            'dms': {
                name: '💬 DMs Only',
                description: 'Bot responds only in private messages',
                icon: '💬'
            },
            'silent': {
                name: '🔇 Silent Mode',
                description: 'Bot responds only to the owner',
                icon: '🔇'
            }
        };
        
        if (!args[0]) {
            let currentMode = this.getCurrentMode();
            
            let modeList = '';
            for (const [mode, info] of Object.entries(modes)) {
                const isCurrent = mode === currentMode ? ' ✅' : '';
                modeList += `${info.icon} *${mode}* - ${info.description}${isCurrent}\n`;
            }
            
            return sock.sendMessage(chatId, {
                text: `╭─⌈ 🤖 *BOT MODE* ⌋\n│\n├─⊷ *${PREFIX}mode <mode_name>*\n│  └⊷ Change bot mode\n╰───`
            }, { quoted: msg });
        }
        
        const requestedMode = args[0].toLowerCase();
        
        if (!modes[requestedMode]) {
            const validModes = Object.keys(modes).join(', ');
            return sock.sendMessage(chatId, {
                text: `╭─⌈ ❌ *INVALID MODE* ⌋\n│\n├─⊷ *${PREFIX}mode <mode_name>*\n│  └⊷ Set bot mode\n╰───`
            }, { quoted: msg });
        }
        
        try {
            const senderJid = msg.key.participant || chatId;
            const cleaned = jidManager.cleanJid(senderJid);
            
            const modeData = {
                mode: requestedMode,
                modeName: modes[requestedMode].name,
                setBy: cleaned.cleanNumber || 'Unknown',
                setAt: new Date().toISOString(),
                timestamp: Date.now(),
                version: "2.0"
            };
            
            const rootModePath = './bot_mode.json';
            writeFileSync(rootModePath, JSON.stringify(modeData, null, 2));
            
            if (typeof global !== 'undefined') {
                global.BOT_MODE = requestedMode;
                global.mode = requestedMode;
                global.MODE_LAST_UPDATED = Date.now();
            }
            
            process.env.BOT_MODE = requestedMode;
            
            const modeInfo = modes[requestedMode];
            
            let successMsg = `✅ *Mode Updated Successfully!*\n\n`;
            successMsg += `${modeInfo.icon} New Mode: *${modeInfo.name}*\n`;
            successMsg += `📝 ${modeInfo.description}`;
            
            await sock.sendMessage(chatId, {
                text: successMsg
            }, { quoted: msg });
            
            console.log(`✅ Mode changed to ${requestedMode} by ${cleaned.cleanNumber}`);
            
        } catch (error) {
            console.error('Error saving mode:', error);
            await sock.sendMessage(chatId, {
                text: `❌ Error saving mode: ${error.message}`
            }, { quoted: msg });
        }
    },
    
    getCurrentMode() {
        try {
            const possiblePaths = [
                './bot_mode.json',
                path.join(__dirname, 'bot_mode.json'),
                path.join(__dirname, '../bot_mode.json'),
                path.join(__dirname, '../../bot_mode.json'),
            ];
            
            for (const modePath of possiblePaths) {
                if (existsSync(modePath)) {
                    const modeData = JSON.parse(readFileSync(modePath, 'utf8'));
                    return modeData.mode;
                }
            }
            
            if (global.BOT_MODE) return global.BOT_MODE;
            if (global.mode) return global.mode;
            if (process.env.BOT_MODE) return process.env.BOT_MODE;
            
        } catch (error) {
            console.error('Error reading bot mode:', error);
        }
        
        return 'public';
    }
};
