// File: ./commands/owner/resetbotname.js
import { writeFileSync, readFileSync, existsSync, unlinkSync } from 'fs';
import { getBotName, clearBotNameCache, saveBotNameToDB } from '../../lib/botname.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    name: 'resetbotname',
    alias: ['defaultname','dn','rbn', 'clearbotname', 'resettobotname', 'restorebotname', 'resetname', 'defaultbotname', 'clearname', 'removebotname', 'deletename', 'resetbot', 'botreset', 'name-reset', 'botname-reset'],
    category: 'owner',
    description: 'Reset bot name to default (WOLFBOT)',
    ownerOnly: true,
    
    async execute(sock, msg, args, PREFIX, extra) {
        const chatId = msg.key.remoteJid;
        const { jidManager } = extra;
        
        const isSudoUser = extra?.isSudo ? extra.isSudo() : false;
        if (!jidManager.isOwner(msg) && !isSudoUser) {
            return sock.sendMessage(chatId, {
                text: `❌ *Owner Only Command!*\n\nOnly the bot owner can reset the bot name.`
            }, { quoted: msg });
        }
        
        const DEFAULT_NAME = 'WOLFBOT';
        
        try {
            // Get owner info
            const senderJid = msg.key.participant || chatId;
            const cleaned = jidManager.cleanJid(senderJid);
            
            // Get old name before reset
            const oldName = this.getCurrentBotName();
            
            console.log(`🔄 Resetting bot name from "${oldName}" to "${DEFAULT_NAME}"...`);
            
            // Define all possible locations of bot_settings.json
            const settingsPaths = [
                './bot_settings.json',  // Root directory
                path.join(__dirname, 'bot_settings.json'),  // Owner commands directory
                path.join(__dirname, '../bot_settings.json'),  // Commands directory
                path.join(__dirname, '../../bot_settings.json'),  // 2 levels up
                path.join(__dirname, '../../../bot_settings.json'),  // 3 levels up (menu directory)
                path.join(__dirname, '../../../../bot_settings.json'),  // 4 levels up
            ];
            
            let deletedFiles = 0;
            let keptFiles = 0;
            
            // Ask for confirmation if user wants to delete or just reset
            const shouldDelete = args[0]?.toLowerCase() === 'delete' || 
                               args[0]?.toLowerCase() === 'remove' ||
                               args[0]?.toLowerCase() === 'clear';
            
            if (!shouldDelete && oldName !== DEFAULT_NAME) {
                // Create default settings with WOLFBOT
                const defaultSettings = {
                    botName: DEFAULT_NAME,
                    resetBy: cleaned.cleanNumber || 'Unknown',
                    resetAt: new Date().toISOString(),
                    resetFrom: oldName,
                    timestamp: Date.now(),
                    version: "1.0",
                    note: "Reset to default name"
                };
                
                // Write default settings to all locations
                for (const settingsPath of settingsPaths) {
                    try {
                        writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2));
                        console.log(`✅ Created/Updated: ${settingsPath}`);
                        keptFiles++;
                    } catch (err) {
                        console.log(`⚠️ Could not write to ${settingsPath}: ${err.message}`);
                    }
                }
                
                if (typeof global !== 'undefined') {
                    global.BOT_NAME = DEFAULT_NAME;
                    global.BOT_SETTINGS = defaultSettings;
                }
                
                process.env.BOT_NAME = DEFAULT_NAME;
                clearBotNameCache();
                try { await saveBotNameToDB(DEFAULT_NAME); } catch {}
                
                let successMsg = `✅ *Bot Name Reset Successfully!*\n`;
                successMsg += `📝 Previous Name: *${oldName}*\n`;
                successMsg += `🔄 New Name: *${DEFAULT_NAME}*\n`;
                // successMsg += `📊 Action: Created default settings file\n`;
                // successMsg += `📁 Files updated: ${keptFiles} location(s)\n\n`;
                // successMsg += `💡 The bot will now use the default name "${DEFAULT_NAME}" in:\n`;
                // successMsg += `├─ Menu header\n`;
                // successMsg += `├─ Command responses\n`;
                // successMsg += `└─ All bot interactions\n\n`;
                // successMsg += `🔧 Use \`${PREFIX}menu\` to see the updated name.\n\n`;
                // successMsg += `💡 *Tip:* Use \`${PREFIX}resetbotname delete\` to completely remove the settings file instead.`;
                
                await sock.sendMessage(chatId, {
                    text: successMsg
                }, { quoted: msg });
                
                console.log(`✅ Bot name reset from "${oldName}" to "${DEFAULT_NAME}" by ${cleaned.cleanNumber}`);
                
            } else {
                // Delete mode - remove files completely
                for (const settingsPath of settingsPaths) {
                    if (existsSync(settingsPath)) {
                        try {
                            unlinkSync(settingsPath);
                            deletedFiles++;
                            console.log(`🗑️ Deleted: ${settingsPath}`);
                        } catch (error) {
                            console.error(`Error deleting ${settingsPath}:`, error);
                        }
                    }
                }
                
                if (typeof global !== 'undefined') {
                    delete global.BOT_NAME;
                    delete global.BOT_SETTINGS;
                }
                
                delete process.env.BOT_NAME;
                clearBotNameCache();
                try { await saveBotNameToDB('WOLFBOT'); } catch {}
                
                let successMsg = `🗑️ *Bot Name Files Deleted!*\n\n`;
                successMsg += `📝 Previous Name: *${oldName}*\n`;
                successMsg += `🔄 Will now use: *${DEFAULT_NAME}*\n\n`;
                successMsg += `📊 Action: Deleted settings file(s)\n`;
                successMsg += `🗑️ Files deleted: ${deletedFiles}\n\n`;
                successMsg += `💡 The bot will now use the default name "${DEFAULT_NAME}"\n`;
                successMsg += `since no settings file exists.\n\n`;
                successMsg += `🔧 Use \`${PREFIX}setbotname <name>\` to set a new custom name.`;
                
                await sock.sendMessage(chatId, {
                    text: successMsg
                }, { quoted: msg });
                
                console.log(`🗑️ Deleted ${deletedFiles} bot_settings.json files by ${cleaned.cleanNumber}`);
            }
            
        } catch (error) {
            console.error('Error resetting bot name:', error);
            await sock.sendMessage(chatId, {
                text: `❌ Error resetting bot name: ${error.message}`
            }, { quoted: msg });
        }
    },
    
    // Helper function to get current bot name
    getCurrentBotName() {
        try {
            // Check multiple possible locations
            const possiblePaths = [
                './bot_settings.json',
                path.join(__dirname, 'bot_settings.json'),
                path.join(__dirname, '../bot_settings.json'),
                path.join(__dirname, '../../bot_settings.json'),
                path.join(__dirname, '../../../bot_settings.json'),
            ];
            
            console.log('🔍 Checking for bot_settings.json before reset...');
            
            for (const settingsPath of possiblePaths) {
                if (existsSync(settingsPath)) {
                    try {
                        const settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
                        if (settings.botName && settings.botName.trim() !== '') {
                            return settings.botName.trim();
                        }
                    } catch (error) {
                        console.error(`Error reading ${settingsPath}:`, error);
                    }
                }
            }
            
            // Fallback to global variable
            if (global.BOT_NAME) {
                return global.BOT_NAME;
            }
            
            if (process.env.BOT_NAME) {
                return process.env.BOT_NAME;
            }
            
        } catch (error) {
            console.error('Error reading bot name:', error);
        }
        
        return 'WOLFBOT'; // Default
    }
};