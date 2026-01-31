// // commands/status/autoreactstatus.js

// import fs from 'fs';
// import path from 'path';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Configuration file path
// const CONFIG_FILE = './data/autoReactConfig.json';

// // Initialize config directory and file
// function initConfig() {
//     const configDir = path.dirname(CONFIG_FILE);
//     if (!fs.existsSync(configDir)) {
//         fs.mkdirSync(configDir, { recursive: true });
//     }
    
//     if (!fs.existsSync(CONFIG_FILE)) {
//         const defaultConfig = {
//             enabled: true, // ON BY DEFAULT
//             mode: 'fixed', // fixed mode by default
//             fixedEmoji: '🐺', // WOLF EMOJI AS DEFAULT
//             reactions: ["🐺", "❤️", "👍", "🔥", "🎉", "😂", "😮", "👏", "🎯", "💯", "🌟", "✨", "⚡", "💥", "🫶"],
//             logs: [],
//             totalReacted: 0,
//             lastReacted: null,
//             consecutiveReactions: 0,
//             lastSender: null,
//             settings: {
//                 rateLimitDelay: 500, // Faster reaction
//                 reactToAll: true, // React to all statuses
//                 ignoreConsecutiveLimit: true, // React to consecutive statuses
//                 noHourlyLimit: true // NO HOURLY LIMIT
//             }
//         };
//         fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
//     }
// }

// initConfig();

// // Auto React Manager
// class AutoReactManager {
//     constructor() {
//         this.config = this.loadConfig();
//         this.reactionQueue = [];
//         this.lastReactionTime = 0;
        
//         // Log initialization
//         console.log(`🐺 AutoReactStatus initialized: ${this.config.enabled ? '✅ ACTIVE' : '❌ INACTIVE'}`);
//         console.log(`🎭 Default mode: ${this.config.mode}`);
//         console.log(`😄 Default emoji: ${this.config.fixedEmoji}`);
//     }
    
//     loadConfig() {
//         try {
//             const data = fs.readFileSync(CONFIG_FILE, 'utf8');
//             return JSON.parse(data);
//         } catch (error) {
//             console.error('Error loading auto react config:', error);
//             return {
//                 enabled: true,
//                 mode: 'fixed',
//                 fixedEmoji: '🐺',
//                 reactions: ["🐺", "❤️", "👍", "🔥", "🎉", "😂", "😮", "👏", "🎯", "💯", "🌟", "✨", "⚡", "💥", "🫶"],
//                 logs: [],
//                 totalReacted: 0,
//                 lastReacted: null,
//                 consecutiveReactions: 0,
//                 lastSender: null,
//                 settings: {
//                     rateLimitDelay: 500,
//                     reactToAll: true,
//                     ignoreConsecutiveLimit: true,
//                     noHourlyLimit: true
//                 }
//             };
//         }
//     }
    
//     saveConfig() {
//         try {
//             fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2));
//         } catch (error) {
//             console.error('Error saving auto react config:', error);
//         }
//     }
    
//     get enabled() {
//         return this.config.enabled;
//     }
    
//     get mode() {
//         return this.config.mode;
//     }
    
//     get fixedEmoji() {
//         return this.config.fixedEmoji;
//     }
    
//     get reactions() {
//         return this.config.reactions;
//     }
    
//     get logs() {
//         return this.config.logs;
//     }
    
//     get totalReacted() {
//         return this.config.totalReacted;
//     }
    
//     // Smart toggle: if already ON, just confirm instead of toggling
//     toggle(forceOff = false) {
//         if (forceOff) {
//             // Force turn off
//             this.config.enabled = false;
//             this.saveConfig();
//             return false;
//         }
        
//         // If already enabled, don't toggle - just return true (enabled)
//         if (this.config.enabled) {
//             return true; // Still enabled
//         }
        
//         // If disabled, enable it
//         this.config.enabled = true;
//         this.saveConfig();
//         return true;
//     }
    
//     setMode(newMode) {
//         if (newMode === 'random' || newMode === 'fixed') {
//             this.config.mode = newMode;
//             this.saveConfig();
//             return true;
//         }
//         return false;
//     }
    
//     setFixedEmoji(emoji) {
//         if (emoji.length <= 2) {
//             this.config.fixedEmoji = emoji;
//             this.saveConfig();
//             return true;
//         }
//         return false;
//     }
    
//     addReaction(emoji) {
//         if (!this.config.reactions.includes(emoji) && emoji.length <= 2) {
//             this.config.reactions.push(emoji);
//             this.saveConfig();
//             return true;
//         }
//         return false;
//     }
    
//     removeReaction(emoji) {
//         const index = this.config.reactions.indexOf(emoji);
//         if (index !== -1) {
//             this.config.reactions.splice(index, 1);
//             this.saveConfig();
//             return true;
//         }
//         return false;
//     }
    
//     resetReactions() {
//         this.config.reactions = ["🐺", "❤️", "👍", "🔥", "🎉", "😂", "😮", "👏", "🎯", "💯", "🌟", "✨", "⚡", "💥", "🫶"];
//         this.saveConfig();
//     }
    
//     addLog(sender, reaction, type = 'status') {
//         const logEntry = {
//             sender,
//             reaction,
//             type,
//             timestamp: Date.now()
//         };
        
//         this.config.logs.push(logEntry);
//         this.config.totalReacted++;
//         this.config.lastReacted = logEntry;
        
//         // Check for consecutive statuses from same sender
//         if (this.config.lastSender === sender) {
//             this.config.consecutiveReactions++;
//         } else {
//             this.config.consecutiveReactions = 1;
//             this.config.lastSender = sender;
//         }
        
//         // Keep only last 100 logs
//         if (this.config.logs.length > 100) {
//             this.config.logs.shift();
//         }
        
//         this.saveConfig();
//     }
    
//     clearLogs() {
//         this.config.logs = [];
//         this.config.totalReacted = 0;
//         this.config.lastReacted = null;
//         this.config.consecutiveReactions = 0;
//         this.config.lastSender = null;
//         this.saveConfig();
//     }
    
//     getStats() {
//         return {
//             enabled: this.config.enabled,
//             mode: this.config.mode,
//             fixedEmoji: this.config.fixedEmoji,
//             reactions: [...this.config.reactions],
//             logsCount: this.config.logs.length,
//             totalReacted: this.config.totalReacted,
//             lastReacted: this.config.lastReacted,
//             consecutiveReactions: this.config.consecutiveReactions,
//             settings: { ...this.config.settings }
//         };
//     }
    
//     shouldReact(sender) {
//         if (!this.config.enabled) return false;
        
//         // Check rate limiting
//         const now = Date.now();
//         if (now - this.lastReactionTime < this.config.settings.rateLimitDelay) {
//             return false;
//         }
        
//         // Check if we should react to consecutive statuses
//         if (!this.config.settings.ignoreConsecutiveLimit && 
//             this.config.lastSender === sender && 
//             this.config.consecutiveReactions >= 3) {
//             return false;
//         }
        
//         return true;
//     }
    
//     getReaction() {
//         if (this.config.mode === 'fixed') {
//             return this.config.fixedEmoji;
//         } else {
//             // Random mode
//             if (this.config.reactions.length === 0) return '🐺';
//             const randomIndex = Math.floor(Math.random() * this.config.reactions.length);
//             return this.config.reactions[randomIndex];
//         }
//     }
    
//     async reactToStatus(sock, statusKey) {
//         try {
//             const sender = statusKey.participant || statusKey.remoteJid;
//             const cleanSender = sender.split('@')[0];
            
//             if (!this.shouldReact(sender)) {
//                 return false;
//             }
            
//             const reactionEmoji = this.getReaction();
            
//             await sock.relayMessage(
//                 'status@broadcast',
//                 {
//                     reactionMessage: {
//                         key: {
//                             remoteJid: 'status@broadcast',
//                             id: statusKey.id,
//                             participant: statusKey.participant || statusKey.remoteJid,
//                             fromMe: false
//                         },
//                         text: reactionEmoji
//                     }
//                 },
//                 {
//                     messageId: statusKey.id,
//                     statusJidList: [statusKey.remoteJid, statusKey.participant || statusKey.remoteJid]
//                 }
//             );
            
//             // Update reaction time
//             this.lastReactionTime = Date.now();
            
//             // Add to logs
//             this.addLog(cleanSender, reactionEmoji, 'status');
            
//             console.log(`🐺 AutoReact: Reacted to ${cleanSender}'s status with ${reactionEmoji}`);
//             return true;
            
//         } catch (error) {
//             console.error('❌ Error reacting to status:', error.message);
            
//             // Handle rate limiting by increasing delay
//             if (error.message?.includes('rate-overlimit')) {
//                 console.log('⚠️ Rate limit hit, increasing delay...');
//                 this.config.settings.rateLimitDelay = Math.min(
//                     this.config.settings.rateLimitDelay * 2,
//                     5000
//                 );
//                 this.saveConfig();
//             }
            
//             return false;
//         }
//     }
// }

// // Create singleton instance
// const autoReactManager = new AutoReactManager();

// // Export the function for index.js
// export async function handleAutoReact(sock, statusKey) {
//     return await autoReactManager.reactToStatus(sock, statusKey);
// }

// // Export the manager for other uses
// export { autoReactManager };

// // The command module
// export default {
//     name: "autoreactstatus",
//     alias: [ "reactstatus", "statusreact", "sr", "reacts"],
//     desc: "Automatically react to WhatsApp statuses 🐺",
//     category: "Status",
//     ownerOnly: false,
    
//     async execute(sock, m, args, prefix, extra) {
//         try {
//             // Check if sender is owner
//             const isOwner = extra?.isOwner?.() || false;
            
//             if (args.length === 0) {
//                 // Show current status
//                 const stats = autoReactManager.getStats();
                
//                 let statusText = `🐺 *AUTOREACTSTATUS*\n\n`;
//                 statusText += `Status: ${stats.enabled ? '✅ **ACTIVE**' : '❌ **INACTIVE**'}\n`;
//                 statusText += `Mode: ${stats.mode === 'fixed' ? `Fixed (${stats.fixedEmoji})` : 'Random'}\n`;
//                 //statusText += `📊 Total Reacted: ${stats.totalReacted}\n`;
//                 //statusText += `🔄 Consecutive: ${stats.consecutiveReactions}\n\n`;
                
//                 // if (stats.lastReacted) {
//                 //     const timeAgo = Math.floor((Date.now() - stats.lastReacted.timestamp) / 60000);
//                 //     statusText += `🕒 Last Reaction:\n`;
//                 //     statusText += `• To: ${stats.lastReacted.sender}\n`;
//                 //     statusText += `• With: ${stats.lastReacted.reaction}\n`;
//                 //     statusText += `• ${timeAgo < 1 ? 'Just now' : `${timeAgo} minutes ago`}\n`;
//                 // }
                
//                 //statusText += `\n📋 *Commands:*\n`;
//                 statusText += `• \`${prefix}autoreactstatus on\`\n`;
//                 statusText += `• \`${prefix}autoreactstatus off\`\n`;
//                 statusText += `• \`${prefix}autoreactstatus random\`\n`;
//                 statusText += `• \`${prefix}autoreactstatus emoji <choose emoji>\``;
              
                
//                 await sock.sendMessage(m.key.remoteJid, { text: statusText }, { quoted: m });
//                 return;
//             }
            
//             const action = args[0].toLowerCase();
            
//             switch (action) {
//                 case 'on':
//                 case 'enable':
//                 case 'start':
//                     if (!isOwner) {
//                         await sock.sendMessage(m.key.remoteJid, {
//                             text: "❌ Owner only command!"
//                         }, { quoted: m });
//                         return;
//                     }
                    
//                     // Use smart toggle that doesn't toggle if already on
//                     const currentlyEnabled = autoReactManager.enabled;
//                     const result = autoReactManager.toggle(false); // false = don't force off
                    
//                     if (currentlyEnabled) {
//                         // Already enabled, just show confirmation
//                         await sock.sendMessage(m.key.remoteJid, {
//                             text: `✅ *AUTOREACTSTATUS IS ALREADY ACTIVE*\n\n🐺 Auto reactions are already enabled!\n\nCurrent settings:\n• Mode: ${autoReactManager.mode}\n• Emoji: ${autoReactManager.mode === 'fixed' ? autoReactManager.fixedEmoji : 'Random'}\n• Total reacted: ${autoReactManager.totalReacted}\n\nUse \`${prefix}autoreactstatus off\` to disable.`
//                         }, { quoted: m });
//                     } else {
//                         // Was disabled, now enabled
//                         await sock.sendMessage(m.key.remoteJid, {
//                             text: `✅ *AUTOREACTSTATUS ENABLED*\n\n🐺 I will now automatically react to ALL statuses!\n\nDefault emoji: ${autoReactManager.fixedEmoji}\nMode: ${autoReactManager.mode}`
//                         }, { quoted: m });
//                     }
//                     break;
                    
//                 case 'off':
//                 case 'disable':
//                 case 'stop':
//                     if (!isOwner) {
//                         await sock.sendMessage(m.key.remoteJid, {
//                             text: "❌ Owner only command!"
//                         }, { quoted: m });
//                         return;
//                     }
                    
//                     // Force turn off
//                     const wasEnabled = autoReactManager.enabled;
//                     autoReactManager.toggle(true); // true = force off
                    
//                     if (wasEnabled) {
//                         await sock.sendMessage(m.key.remoteJid, {
//                             text: `❌ *AUTOREACTSTATUS DISABLED*\n\nAuto reactions have been turned off.\n\nUse \`${prefix}autoreactstatus on\` to enable again.`
//                         }, { quoted: m });
//                     } else {
//                         await sock.sendMessage(m.key.remoteJid, {
//                             text: `⚠️ *AUTOREACTSTATUS ALREADY DISABLED*\n\nAuto reactions are already turned off.\n\nUse \`${prefix}autoreactstatus on\` to enable.`
//                         }, { quoted: m });
//                     }
//                     break;
                    
//                 case 'random':
//                     autoReactManager.setMode('random');
//                     await sock.sendMessage(m.key.remoteJid, {
//                         text: `🎲 *Mode set to RANDOM*\n\nI will react with random emojis from the list!\n\nCurrent emoji list: ${autoReactManager.reactions.join(' ')}`
//                     }, { quoted: m });
//                     break;
                    
//                 case 'emoji':
//                     if (args.length < 2) {
//                         await sock.sendMessage(m.key.remoteJid, {
//                             text: `🐺 *Current Fixed Emoji:* ${autoReactManager.fixedEmoji}\n\nUsage: ${prefix}autoreactstatus emoji 🐺\n\nSets a fixed emoji for reactions.`
//                         }, { quoted: m });
//                         return;
//                     }
                    
//                     const emoji = args[1];
//                     if (emoji.length > 2) {
//                         await sock.sendMessage(m.key.remoteJid, {
//                             text: '❌ Please use a single emoji (max 2 characters).'
//                         }, { quoted: m });
//                         return;
//                     }
                    
//                     if (autoReactManager.setFixedEmoji(emoji)) {
//                         autoReactManager.setMode('fixed');
//                         await sock.sendMessage(m.key.remoteJid, {
//                             text: `✅ *Fixed Emoji Set*\n\nReactions will now use: ${emoji}\n\nMode automatically switched to FIXED.`
//                         }, { quoted: m });
//                     } else {
//                         await sock.sendMessage(m.key.remoteJid, {
//                             text: '❌ Failed to set emoji.'
//                         }, { quoted: m });
//                     }
//                     break;
                    
//                 case 'stats':
//                 case 'statistics':
//                 case 'info':
//                     const detailedStats = autoReactManager.getStats();
//                     let statsText = `📊 *AUTOREACTSTATUS STATISTICS*\n\n`;
//                     statsText += `🟢 Status: ${detailedStats.enabled ? '**ACTIVE** ✅' : '**INACTIVE** ❌'}\n`;
//                     statsText += `🎭 Mode: ${detailedStats.mode === 'fixed' ? `FIXED (${detailedStats.fixedEmoji})` : 'RANDOM'}\n`;
//                     statsText += `🐺 Total Reacted: **${detailedStats.totalReacted}**\n`;
//                     statsText += `🔄 Consecutive Reactions: ${detailedStats.consecutiveReactions}\n`;
//                     statsText += `📝 Logs Stored: ${detailedStats.logsCount}\n\n`;
                    
//                     if (detailedStats.lastReacted) {
//                         const timeAgo = Math.floor((Date.now() - detailedStats.lastReacted.timestamp) / 60000);
//                         statsText += `🕒 *Last Reaction:*\n`;
//                         statsText += `• To: ${detailedStats.lastReacted.sender}\n`;
//                         statsText += `• With: ${detailedStats.lastReacted.reaction}\n`;
//                         statsText += `• ${timeAgo < 1 ? 'Just now' : `${timeAgo} minutes ago`}\n`;
//                     }
                    
//                     statsText += `\n⚙️ *Settings:*\n`;
//                     statsText += `• Rate Limit: ${detailedStats.settings.rateLimitDelay}ms\n`;
//                     statsText += `• React to All: ${detailedStats.settings.reactToAll ? '✅' : '❌'}\n`;
//                     statsText += `• Ignore Consecutive: ${detailedStats.settings.ignoreConsecutiveLimit ? '✅' : '❌'}\n`;
//                     statsText += `• Hourly Limit: ❌ DISABLED\n`;
                    
//                     await sock.sendMessage(m.key.remoteJid, { text: statsText }, { quoted: m });
//                     break;
                    
//                 case 'list':
//                 case 'emojis':
//                     const emojiList = autoReactManager.reactions;
//                     await sock.sendMessage(m.key.remoteJid, {
//                         text: `😄 *Random Emoji List (${emojiList.length}):*\n\n${emojiList.join(' ')}\n\nCurrent mode: ${autoReactManager.mode}\nFixed emoji: ${autoReactManager.fixedEmoji}`
//                     }, { quoted: m });
//                     break;
                    
//                 case 'add':
//                     if (!isOwner) {
//                         await sock.sendMessage(m.key.remoteJid, {
//                             text: "❌ Owner only command!"
//                         }, { quoted: m });
//                         return;
//                     }
                    
//                     if (args.length < 2) {
//                         await sock.sendMessage(m.key.remoteJid, {
//                             text: `Usage: ${prefix}autoreactstatus add ❤️\n\nAdds an emoji to the random emoji list.`
//                         }, { quoted: m });
//                         return;
//                     }
                    
//                     const addEmoji = args[1];
//                     if (addEmoji.length > 2) {
//                         await sock.sendMessage(m.key.remoteJid, {
//                             text: '❌ Please use a single emoji (max 2 characters).'
//                         }, { quoted: m });
//                         return;
//                     }
                    
//                     if (autoReactManager.addReaction(addEmoji)) {
//                         await sock.sendMessage(m.key.remoteJid, {
//                             text: `✅ *Emoji Added*\n\n${addEmoji} has been added to the random list.\n\nCurrent list (${autoReactManager.reactions.length}):\n${autoReactManager.reactions.join(' ')}`
//                         }, { quoted: m });
//                     } else {
//                         await sock.sendMessage(m.key.remoteJid, {
//                             text: `⚠️ Emoji ${addEmoji} is already in the list or invalid.\n\nCurrent list: ${autoReactManager.reactions.join(' ')}`
//                         }, { quoted: m });
//                     }
//                     break;
                    
//                 case 'remove':
//                     if (!isOwner) {
//                         await sock.sendMessage(m.key.remoteJid, {
//                             text: "❌ Owner only command!"
//                         }, { quoted: m });
//                         return;
//                     }
                    
//                     if (args.length < 2) {
//                         await sock.sendMessage(m.key.remoteJid, {
//                             text: `Usage: ${prefix}autoreactstatus remove 🔥\n\nRemoves an emoji from the random emoji list.`
//                         }, { quoted: m });
//                         return;
//                     }
                    
//                     const removeEmoji = args[1];
//                     if (autoReactManager.removeReaction(removeEmoji)) {
//                         await sock.sendMessage(m.key.remoteJid, {
//                             text: `✅ *Emoji Removed*\n\n${removeEmoji} has been removed from the random list.\n\nCurrent list (${autoReactManager.reactions.length}):\n${autoReactManager.reactions.join(' ')}`
//                         }, { quoted: m });
//                     } else {
//                         await sock.sendMessage(m.key.remoteJid, {
//                             text: `❌ Emoji ${removeEmoji} not found in the list.\n\nCurrent list: ${autoReactManager.reactions.join(' ')}`
//                         }, { quoted: m });
//                     }
//                     break;
                    
//                 case 'reset':
//                 case 'clear':
//                     if (!isOwner) {
//                         await sock.sendMessage(m.key.remoteJid, {
//                             text: "❌ Owner only command!"
//                         }, { quoted: m });
//                         return;
//                     }
//                     autoReactManager.resetReactions();
//                     await sock.sendMessage(m.key.remoteJid, {
//                         text: `🔄 *Emoji List Reset*\n\nReset to default emojis:\n${autoReactManager.reactions.join(' ')}`
//                     }, { quoted: m });
//                     break;
                    
//                 default:
//                     await sock.sendMessage(m.key.remoteJid, {
//                         text: `❓ *Invalid Command*\n\nUse:\n• ${prefix}autoreactstatus on/off\n• ${prefix}autoreactstatus random\n• ${prefix}autoreactstatus emoji 🐺\n• ${prefix}autoreactstatus stats\n• ${prefix}autoreactstatus list`
//                     }, { quoted: m });
//             }
            
//         } catch (error) {
//             console.error('AutoReactStatus command error:', error);
//             await sock.sendMessage(m.key.remoteJid, {
//                 text: `❌ Command failed: ${error.message}`
//             }, { quoted: m });
//         }
//     }
// };

























// commands/status/autoreactstatus.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration file path
const CONFIG_FILE = './data/autoReactConfig.json';

// Track reacted statuses to prevent duplicates
const alreadyReactedStatuses = new Set();
const statusCheckInterval = 60 * 60 * 1000; // Clear cache every hour

// Initialize config directory and file
function initConfig() {
    const configDir = path.dirname(CONFIG_FILE);
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }
    
    if (!fs.existsSync(CONFIG_FILE)) {
        const defaultConfig = {
            enabled: true, // ON BY DEFAULT
            mode: 'fixed', // fixed mode by default
            fixedEmoji: '🐺', // WOLF EMOJI AS DEFAULT
            reactions: ["🐺", "❤️", "👍", "🔥", "🎉", "😂", "😮", "👏", "🎯", "💯", "🌟", "✨", "⚡", "💥", "🫶"],
            logs: [],
            totalReacted: 0,
            lastReacted: null,
            consecutiveReactions: 0,
            lastSender: null,
            lastReactionTime: 0, // Track last reaction time
            reactedStatuses: [], // Track which statuses we've reacted to
            settings: {
                rateLimitDelay: 2000, // Increased to prevent rate limits
                reactToAll: true,
                ignoreConsecutiveLimit: true,
                noHourlyLimit: true
            }
        };
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
    }
    
    // Clear reacted status cache periodically
    setInterval(() => {
        alreadyReactedStatuses.clear();
    }, statusCheckInterval);
}

initConfig();

// Auto React Manager
class AutoReactManager {
    constructor() {
        this.config = this.loadConfig();
        this.reactionQueue = [];
        this.lastReactionTime = this.config.lastReactionTime || 0;
        this.reactedStatuses = new Set(this.config.reactedStatuses || []);
        
        // Clean up old reacted statuses (older than 24 hours)
        this.cleanupOldReactedStatuses();
        
        // Log initialization
        console.log(`🐺 AutoReactStatus initialized: ${this.config.enabled ? '✅ ACTIVE' : '❌ INACTIVE'}`);
        console.log(`🎭 Default mode: ${this.config.mode}`);
        console.log(`😄 Default emoji: ${this.config.fixedEmoji}`);
    }
    
    loadConfig() {
        try {
            const data = fs.readFileSync(CONFIG_FILE, 'utf8');
            const config = JSON.parse(data);
            
            // Ensure new fields exist
            config.reactedStatuses = config.reactedStatuses || [];
            config.lastReactionTime = config.lastReactionTime || 0;
            
            return config;
        } catch (error) {
            console.error('Error loading auto react config:', error);
            return {
                enabled: true,
                mode: 'fixed',
                fixedEmoji: '🐺',
                reactions: ["🐺", "❤️", "👍", "🔥", "🎉", "😂", "😮", "👏", "🎯", "💯", "🌟", "✨", "⚡", "💥", "🫶"],
                logs: [],
                totalReacted: 0,
                lastReacted: null,
                consecutiveReactions: 0,
                lastSender: null,
                lastReactionTime: 0,
                reactedStatuses: [],
                settings: {
                    rateLimitDelay: 2000,
                    reactToAll: true,
                    ignoreConsecutiveLimit: true,
                    noHourlyLimit: true
                }
            };
        }
    }
    
    saveConfig() {
        try {
            // Convert Set to array for saving
            this.config.reactedStatuses = Array.from(this.reactedStatuses);
            this.config.lastReactionTime = this.lastReactionTime;
            
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2));
        } catch (error) {
            console.error('Error saving auto react config:', error);
        }
    }
    
    // Clean up reacted statuses older than 24 hours
    cleanupOldReactedStatuses() {
        const now = Date.now();
        const statusKeys = Array.from(this.reactedStatuses);
        let cleaned = false;
        
        for (const statusKey of statusKeys) {
            try {
                const parts = statusKey.split('|');
                if (parts.length >= 3) {
                    const timestamp = parseInt(parts[2]);
                    if (now - timestamp > 24 * 60 * 60 * 1000) { // 24 hours
                        this.reactedStatuses.delete(statusKey);
                        cleaned = true;
                    }
                }
            } catch (e) {
                // If parsing fails, remove the entry
                this.reactedStatuses.delete(statusKey);
                cleaned = true;
            }
        }
        
        if (cleaned) {
            this.saveConfig();
        }
    }
    
    get enabled() {
        return this.config.enabled;
    }
    
    get mode() {
        return this.config.mode;
    }
    
    get fixedEmoji() {
        return this.config.fixedEmoji;
    }
    
    get reactions() {
        return this.config.reactions;
    }
    
    get logs() {
        return this.config.logs;
    }
    
    get totalReacted() {
        return this.config.totalReacted;
    }
    
    // Generate unique key for a status
    generateStatusKey(statusKey) {
        const sender = statusKey.participant || statusKey.remoteJid;
        const statusId = statusKey.id;
        const timestamp = Date.now();
        return `${sender}|${statusId}|${timestamp}`;
    }
    
    // Check if we've already reacted to this status
    hasReactedToStatus(statusKey) {
        const statusUniqueKey = this.generateStatusKey(statusKey);
        return this.reactedStatuses.has(statusUniqueKey);
    }
    
    // Mark status as reacted
    markStatusAsReacted(statusKey) {
        const statusUniqueKey = this.generateStatusKey(statusKey);
        this.reactedStatuses.add(statusUniqueKey);
        this.saveConfig();
    }
    
    // Smart toggle: if already ON, just confirm instead of toggling
    toggle(forceOff = false) {
        if (forceOff) {
            // Force turn off
            this.config.enabled = false;
            this.saveConfig();
            return false;
        }
        
        // If already enabled, don't toggle - just return true (enabled)
        if (this.config.enabled) {
            return true; // Still enabled
        }
        
        // If disabled, enable it
        this.config.enabled = true;
        this.saveConfig();
        return true;
    }
    
    setMode(newMode) {
        if (newMode === 'random' || newMode === 'fixed') {
            this.config.mode = newMode;
            this.saveConfig();
            return true;
        }
        return false;
    }
    
    setFixedEmoji(emoji) {
        if (emoji.length <= 2) {
            this.config.fixedEmoji = emoji;
            this.saveConfig();
            return true;
        }
        return false;
    }
    
    addReaction(emoji) {
        if (!this.config.reactions.includes(emoji) && emoji.length <= 2) {
            this.config.reactions.push(emoji);
            this.saveConfig();
            return true;
        }
        return false;
    }
    
    removeReaction(emoji) {
        const index = this.config.reactions.indexOf(emoji);
        if (index !== -1) {
            this.config.reactions.splice(index, 1);
            this.saveConfig();
            return true;
        }
        return false;
    }
    
    resetReactions() {
        this.config.reactions = ["🐺", "❤️", "👍", "🔥", "🎉", "😂", "😮", "👏", "🎯", "💯", "🌟", "✨", "⚡", "💥", "🫶"];
        this.saveConfig();
    }
    
    addLog(sender, reaction, statusId, type = 'status') {
        const logEntry = {
            sender,
            reaction,
            statusId,
            type,
            timestamp: Date.now()
        };
        
        this.config.logs.push(logEntry);
        this.config.totalReacted++;
        this.config.lastReacted = logEntry;
        
        // Check for consecutive statuses from same sender
        if (this.config.lastSender === sender) {
            this.config.consecutiveReactions++;
        } else {
            this.config.consecutiveReactions = 1;
            this.config.lastSender = sender;
        }
        
        // Keep only last 100 logs
        if (this.config.logs.length > 100) {
            this.config.logs.shift();
        }
        
        this.saveConfig();
    }
    
    clearLogs() {
        this.config.logs = [];
        this.config.totalReacted = 0;
        this.config.lastReacted = null;
        this.config.consecutiveReactions = 0;
        this.config.lastSender = null;
        this.reactedStatuses.clear();
        this.saveConfig();
    }
    
    getStats() {
        return {
            enabled: this.config.enabled,
            mode: this.config.mode,
            fixedEmoji: this.config.fixedEmoji,
            reactions: [...this.config.reactions],
            logsCount: this.config.logs.length,
            totalReacted: this.config.totalReacted,
            lastReacted: this.config.lastReacted,
            consecutiveReactions: this.config.consecutiveReactions,
            reactedStatusesCount: this.reactedStatuses.size,
            settings: { ...this.config.settings }
        };
    }
    
    shouldReact(sender, statusKey) {
        if (!this.config.enabled) return false;
        
        // Check if we've already reacted to this status
        if (this.hasReactedToStatus(statusKey)) {
            console.log(`🐺 Skipping already reacted status: ${statusKey.id}`);
            return false;
        }
        
        // Check rate limiting
        const now = Date.now();
        if (now - this.lastReactionTime < this.config.settings.rateLimitDelay) {
            console.log(`🐺 Rate limiting, waiting...`);
            return false;
        }
        
        // Check if we should react to consecutive statuses
        if (!this.config.settings.ignoreConsecutiveLimit && 
            this.config.lastSender === sender && 
            this.config.consecutiveReactions >= 3) {
            console.log(`🐺 Skipping consecutive status from ${sender}`);
            return false;
        }
        
        return true;
    }
    
    getReaction() {
        if (this.config.mode === 'fixed') {
            return this.config.fixedEmoji;
        } else {
            // Random mode - pick ONE random emoji per status
            if (this.config.reactions.length === 0) return '🐺';
            const randomIndex = Math.floor(Math.random() * this.config.reactions.length);
            return this.config.reactions[randomIndex];
        }
    }
    
    async checkIfStatusExists(sock, statusKey) {
        try {
            // Try to fetch status info to see if it exists
            // This is a simple check - WhatsApp doesn't always provide a way to verify
            // We'll use the timestamp as a heuristic
            const statusTimestamp = statusKey.timestamp || Date.now();
            const timeSinceStatus = Date.now() - statusTimestamp;
            
            // If status is older than 48 hours, it's probably expired/deleted
            if (timeSinceStatus > 48 * 60 * 60 * 1000) {
                console.log(`🐺 Status ${statusKey.id} is too old, skipping`);
                return false;
            }
            
            // We could also check if we're still receiving updates for this status
            // For now, we'll assume it exists if it's not too old
            return true;
            
        } catch (error) {
            console.error('❌ Error checking status existence:', error.message);
            return false; // If we can't check, assume it doesn't exist
        }
    }
    
    async reactToStatus(sock, statusKey) {
        try {
            const sender = statusKey.participant || statusKey.remoteJid;
            const cleanSender = sender.split('@')[0];
            const statusId = statusKey.id;
            
            console.log(`🐺 Processing status from ${cleanSender}, ID: ${statusId}`);
            
            // Check if we should react
            if (!this.shouldReact(sender, statusKey)) {
                return false;
            }
            
            // Verify status still exists (basic check)
            const statusExists = await this.checkIfStatusExists(sock, statusKey);
            if (!statusExists) {
                console.log(`🐺 Status ${statusId} doesn't exist or is too old, skipping`);
                return false;
            }
            
            // Get reaction emoji (ONE emoji only)
            const reactionEmoji = this.getReaction();
            
            console.log(`🐺 Attempting to react with: ${reactionEmoji}`);
            
            // React to status
            await sock.relayMessage(
                'status@broadcast',
                {
                    reactionMessage: {
                        key: {
                            remoteJid: 'status@broadcast',
                            id: statusKey.id,
                            participant: statusKey.participant || statusKey.remoteJid,
                            fromMe: false
                        },
                        text: reactionEmoji
                    }
                },
                {
                    messageId: statusKey.id,
                    statusJidList: [statusKey.remoteJid, statusKey.participant || statusKey.remoteJid]
                }
            );
            
            // Update reaction time
            this.lastReactionTime = Date.now();
            
            // Mark this status as reacted to
            this.markStatusAsReacted(statusKey);
            
            // Add to logs
            this.addLog(cleanSender, reactionEmoji, statusId, 'status');
            
            console.log(`✅ AutoReact: Reacted to ${cleanSender}'s status with ${reactionEmoji}`);
            return true;
            
        } catch (error) {
            console.error('❌ Error reacting to status:', error.message);
            
            // Handle rate limiting by increasing delay
            if (error.message?.includes('rate-overlimit') || error.message?.includes('rate limit')) {
                console.log('⚠️ Rate limit hit, increasing delay...');
                this.config.settings.rateLimitDelay = Math.min(
                    this.config.settings.rateLimitDelay * 2,
                    10000
                );
                this.saveConfig();
            }
            
            // Handle message not found (deleted status)
            if (error.message?.includes('not found') || error.message?.includes('message deleted')) {
                console.log(`🐺 Status was deleted, marking as reacted anyway`);
                this.markStatusAsReacted(statusKey);
            }
            
            return false;
        }
    }
}

// Create singleton instance
const autoReactManager = new AutoReactManager();

// Export the function for index.js
export async function handleAutoReact(sock, statusKey) {
    return await autoReactManager.reactToStatus(sock, statusKey);
}

// Export the manager for other uses
export { autoReactManager };

// The command module
export default {
    name: "autoreactstatus",
    alias: [ "reactstatus", "statusreact", "sr", "reacts"],
    desc: "Automatically react to WhatsApp statuses 🐺",
    category: "Status",
    ownerOnly: false,
    
    async execute(sock, m, args, prefix, extra) {
        try {
            // Check if sender is owner
            const isOwner = extra?.isOwner?.() || false;
            
            if (args.length === 0) {
                // Show current status
                const stats = autoReactManager.getStats();
                
                let statusText = `🐺 *AUTOREACTSTATUS*\n\n`;
                statusText += `Status: ${stats.enabled ? '✅ **ACTIVE**' : '❌ **INACTIVE**'}\n`;
                statusText += `Mode: ${stats.mode === 'fixed' ? `Fixed (${stats.fixedEmoji})` : 'Random (1 emoji per status)'}\n`;
                
                statusText += `\n📋 *Commands:*\n`;
                statusText += `• \`${prefix}autoreactstatus on\`\n`;
                statusText += `• \`${prefix}autoreactstatus off\`\n`;
                statusText += `• \`${prefix}autoreactstatus random\`\n`;
                statusText += `• \`${prefix}autoreactstatus emoji <choose emoji>\``;
                
                await sock.sendMessage(m.key.remoteJid, { text: statusText }, { quoted: m });
                return;
            }
            
            const action = args[0].toLowerCase();
            
            switch (action) {
                case 'on':
                case 'enable':
                case 'start':
                    if (!isOwner) {
                        await sock.sendMessage(m.key.remoteJid, {
                            text: "❌ Owner only command!"
                        }, { quoted: m });
                        return;
                    }
                    
                    // Use smart toggle that doesn't toggle if already on
                    const currentlyEnabled = autoReactManager.enabled;
                    const result = autoReactManager.toggle(false); // false = don't force off
                    
                    if (currentlyEnabled) {
                        // Already enabled, just show confirmation
                        await sock.sendMessage(m.key.remoteJid, {
                            text: `✅ *AUTOREACTSTATUS IS ALREADY ACTIVE*\n\n🐺 Auto reactions are already enabled!\n\nCurrent settings:\n• Mode: ${autoReactManager.mode}\n• Emoji: ${autoReactManager.mode === 'fixed' ? autoReactManager.fixedEmoji : 'Random'}\n• Total reacted: ${autoReactManager.totalReacted}\n\nUse \`${prefix}autoreactstatus off\` to disable.`
                        }, { quoted: m });
                    } else {
                        // Was disabled, now enabled
                        await sock.sendMessage(m.key.remoteJid, {
                            text: `✅ *AUTOREACTSTATUS ENABLED*\n\n🐺 I will now automatically react to ALL statuses!\n\nIMPORTANT: Random mode now reacts with ONLY ONE emoji per status.\n\nDefault emoji: ${autoReactManager.fixedEmoji}\nMode: ${autoReactManager.mode}`
                        }, { quoted: m });
                    }
                    break;
                    
                case 'off':
                case 'disable':
                case 'stop':
                    if (!isOwner) {
                        await sock.sendMessage(m.key.remoteJid, {
                            text: "❌ Owner only command!"
                        }, { quoted: m });
                        return;
                    }
                    
                    // Force turn off
                    const wasEnabled = autoReactManager.enabled;
                    autoReactManager.toggle(true); // true = force off
                    
                    if (wasEnabled) {
                        await sock.sendMessage(m.key.remoteJid, {
                            text: `❌ *AUTOREACTSTATUS DISABLED*\n\nAuto reactions have been turned off.\n\nUse \`${prefix}autoreactstatus on\` to enable again.`
                        }, { quoted: m });
                    } else {
                        await sock.sendMessage(m.key.remoteJid, {
                            text: `⚠️ *AUTOREACTSTATUS ALREADY DISABLED*\n\nAuto reactions are already turned off.\n\nUse \`${prefix}autoreactstatus on\` to enable.`
                        }, { quoted: m });
                    }
                    break;
                    
                case 'random':
                    autoReactManager.setMode('random');
                    await sock.sendMessage(m.key.remoteJid, {
                        text: `🎲 *Mode set to RANDOM*\n\nI will react with ONE random emoji per status!\n\nCurrent emoji list: ${autoReactManager.reactions.join(' ')}`
                    }, { quoted: m });
                    break;
                    
                case 'emoji':
                    if (args.length < 2) {
                        await sock.sendMessage(m.key.remoteJid, {
                            text: `🐺 *Current Fixed Emoji:* ${autoReactManager.fixedEmoji}\n\nUsage: ${prefix}autoreactstatus emoji 🐺\n\nSets a fixed emoji for reactions.`
                        }, { quoted: m });
                        return;
                    }
                    
                    const emoji = args[1];
                    if (emoji.length > 2) {
                        await sock.sendMessage(m.key.remoteJid, {
                            text: '❌ Please use a single emoji (max 2 characters).'
                        }, { quoted: m });
                        return;
                    }
                    
                    if (autoReactManager.setFixedEmoji(emoji)) {
                        autoReactManager.setMode('fixed');
                        await sock.sendMessage(m.key.remoteJid, {
                            text: `✅ *Fixed Emoji Set*\n\nReactions will now use: ${emoji}\n\nMode automatically switched to FIXED.`
                        }, { quoted: m });
                    } else {
                        await sock.sendMessage(m.key.remoteJid, {
                            text: '❌ Failed to set emoji.'
                        }, { quoted: m });
                    }
                    break;
                    
                case 'stats':
                case 'statistics':
                case 'info':
                    const detailedStats = autoReactManager.getStats();
                    let statsText = `📊 *AUTOREACTSTATUS STATISTICS*\n\n`;
                    statsText += `🟢 Status: ${detailedStats.enabled ? '**ACTIVE** ✅' : '**INACTIVE** ❌'}\n`;
                    statsText += `🎭 Mode: ${detailedStats.mode === 'fixed' ? `FIXED (${detailedStats.fixedEmoji})` : 'RANDOM (1 emoji/status)'}\n`;
                    statsText += `🐺 Total Reacted: **${detailedStats.totalReacted}**\n`;
                    statsText += `📝 Tracked Statuses: ${detailedStats.reactedStatusesCount}\n`;
                    statsText += `🔄 Consecutive Reactions: ${detailedStats.consecutiveReactions}\n\n`;
                    
                    if (detailedStats.lastReacted) {
                        const timeAgo = Math.floor((Date.now() - detailedStats.lastReacted.timestamp) / 60000);
                        statsText += `🕒 *Last Reaction:*\n`;
                        statsText += `• To: ${detailedStats.lastReacted.sender}\n`;
                        statsText += `• With: ${detailedStats.lastReacted.reaction}\n`;
                        statsText += `• ${timeAgo < 1 ? 'Just now' : `${timeAgo} minutes ago`}\n`;
                    }
                    
                    statsText += `\n⚙️ *Settings:*\n`;
                    statsText += `• Rate Limit: ${detailedStats.settings.rateLimitDelay}ms\n`;
                    statsText += `• React to All: ${detailedStats.settings.reactToAll ? '✅' : '❌'}\n`;
                    statsText += `• Ignore Consecutive: ${detailedStats.settings.ignoreConsecutiveLimit ? '✅' : '❌'}\n`;
                    statsText += `• Hourly Limit: ❌ DISABLED\n`;
                    
                    await sock.sendMessage(m.key.remoteJid, { text: statsText }, { quoted: m });
                    break;
                    
                case 'list':
                case 'emojis':
                    const emojiList = autoReactManager.reactions;
                    await sock.sendMessage(m.key.remoteJid, {
                        text: `😄 *Random Emoji List (${emojiList.length}):*\n\n${emojiList.join(' ')}\n\nCurrent mode: ${autoReactManager.mode}\nFixed emoji: ${autoReactManager.fixedEmoji}\n\nNOTE: Random mode uses ONE random emoji per status.`
                    }, { quoted: m });
                    break;
                    
                case 'add':
                    if (!isOwner) {
                        await sock.sendMessage(m.key.remoteJid, {
                            text: "❌ Owner only command!"
                        }, { quoted: m });
                        return;
                    }
                    
                    if (args.length < 2) {
                        await sock.sendMessage(m.key.remoteJid, {
                            text: `Usage: ${prefix}autoreactstatus add ❤️\n\nAdds an emoji to the random emoji list.`
                        }, { quoted: m });
                        return;
                    }
                    
                    const addEmoji = args[1];
                    if (addEmoji.length > 2) {
                        await sock.sendMessage(m.key.remoteJid, {
                            text: '❌ Please use a single emoji (max 2 characters).'
                        }, { quoted: m });
                        return;
                    }
                    
                    if (autoReactManager.addReaction(addEmoji)) {
                        await sock.sendMessage(m.key.remoteJid, {
                            text: `✅ *Emoji Added*\n\n${addEmoji} has been added to the random list.\n\nCurrent list (${autoReactManager.reactions.length}):\n${autoReactManager.reactions.join(' ')}`
                        }, { quoted: m });
                    } else {
                        await sock.sendMessage(m.key.remoteJid, {
                            text: `⚠️ Emoji ${addEmoji} is already in the list or invalid.\n\nCurrent list: ${autoReactManager.reactions.join(' ')}`
                        }, { quoted: m });
                    }
                    break;
                    
                case 'remove':
                    if (!isOwner) {
                        await sock.sendMessage(m.key.remoteJid, {
                            text: "❌ Owner only command!"
                        }, { quoted: m });
                        return;
                    }
                    
                    if (args.length < 2) {
                        await sock.sendMessage(m.key.remoteJid, {
                            text: `Usage: ${prefix}autoreactstatus remove 🔥\n\nRemoves an emoji from the random emoji list.`
                        }, { quoted: m });
                        return;
                    }
                    
                    const removeEmoji = args[1];
                    if (autoReactManager.removeReaction(removeEmoji)) {
                        await sock.sendMessage(m.key.remoteJid, {
                            text: `✅ *Emoji Removed*\n\n${removeEmoji} has been removed from the random list.\n\nCurrent list (${autoReactManager.reactions.length}):\n${autoReactManager.reactions.join(' ')}`
                        }, { quoted: m });
                    } else {
                        await sock.sendMessage(m.key.remoteJid, {
                            text: `❌ Emoji ${removeEmoji} not found in the list.\n\nCurrent list: ${autoReactManager.reactions.join(' ')}`
                        }, { quoted: m });
                    }
                    break;
                    
                case 'reset':
                case 'clear':
                    if (!isOwner) {
                        await sock.sendMessage(m.key.remoteJid, {
                            text: "❌ Owner only command!"
                        }, { quoted: m });
                        return;
                    }
                    
                    // Clear everything
                    autoReactManager.clearLogs();
                    await sock.sendMessage(m.key.remoteJid, {
                        text: `🔄 *All Data Reset*\n\n• Logs cleared\n• Reaction count reset to 0\n• Tracked statuses cleared\n\nFresh start! 🐺`
                    }, { quoted: m });
                    break;
                    
                case 'clean':
                case 'cleanup':
                    if (!isOwner) {
                        await sock.sendMessage(m.key.remoteJid, {
                            text: "❌ Owner only command!"
                        }, { quoted: m });
                        return;
                    }
                    
                    autoReactManager.resetReactions();
                    await sock.sendMessage(m.key.remoteJid, {
                        text: `🔄 *Emoji List Reset*\n\nReset to default emojis:\n${autoReactManager.reactions.join(' ')}`
                    }, { quoted: m });
                    break;
                    
                default:
                    await sock.sendMessage(m.key.remoteJid, {
                        text: `❓ *Invalid Command*\n\nUse:\n• ${prefix}autoreactstatus on/off\n• ${prefix}autoreactstatus random\n• ${prefix}autoreactstatus emoji 🐺\n• ${prefix}autoreactstatus stats\n• ${prefix}autoreactstatus list`
                    }, { quoted: m });
            }
            
        } catch (error) {
            console.error('AutoReactStatus command error:', error);
            await sock.sendMessage(m.key.remoteJid, {
                text: `❌ Command failed: ${error.message}`
            }, { quoted: m });
        }
    }
};