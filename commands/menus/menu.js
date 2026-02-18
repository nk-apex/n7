


















import os from "os";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getCurrentMenuStyle } from "./menustyle.js";
import { setLastMenu, getAllFieldsStatus } from "../menus/menuToggles.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: "menu",
  description: "Shows the Wolf Command Center in various styles",
  async execute(sock, m, args) {
    const jid = m.key.remoteJid;
    const style = getCurrentMenuStyle();
    
    // Set the last used menu for toggle commands
    setLastMenu(style);

    console.log(`\n🐺 [MENU] Command received from: ${jid} | Using style: ${style}`);

    try {
      switch (style) {





























// case 1: {
//   // First, get the bot name BEFORE showing loading message
//   const getBotName = () => {
//     try {
//       const possiblePaths = [
//         './bot_settings.json',
//         path.join(__dirname, 'bot_settings.json'),
//         path.join(__dirname, '../bot_settings.json'),
//         path.join(__dirname, '../../bot_settings.json'),
//         path.join(__dirname, '../../../bot_settings.json'),
//         path.join(__dirname, '../commands/owner/bot_settings.json'),
//       ];
      
//       for (const settingsPath of possiblePaths) {
//         if (fs.existsSync(settingsPath)) {
//           try {
//             const settingsData = fs.readFileSync(settingsPath, 'utf8');
//             const settings = JSON.parse(settingsData);
            
//             if (settings.botName && settings.botName.trim() !== '') {
//               return settings.botName.trim();
//             }
//           } catch (parseError) {}
//         }
//       }
      
//       if (global.BOT_NAME) {
//         return global.BOT_NAME;
//       }
      
//       if (process.env.BOT_NAME) {
//         return process.env.BOT_NAME;
//       }
      
//     } catch (error) {}
    
//     return 'WOLFBOT';
//   };
  
//   // Get the current bot name
//   const currentBotName = getBotName();
  
//   // ========== CREATE FAKE CONTACT FUNCTION ==========
//   const createFakeContact = (message) => {
//     const jid = message.key.participant?.split('@')[0] || message.key.remoteJid.split('@')[0];
//     return {
//       key: {
//         remoteJid: "status@broadcast",
//         fromMe: false,
//         id: "WOLF-X"
//       },
//       message: {
//         contactMessage: {
//           displayName: "WOLF BOT",
//           vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:WOLF BOT\nitem1.TEL;waid=${jid}:${jid}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
//         }
//       },
//       participant: "0@s.whatsapp.net"
//     };
//   };
  
//   // Create fake contact for quoted messages
//   const fkontak = createFakeContact(m);
  
//   // ========== SIMPLE LOADING MESSAGE ==========
//   const loadingMessage = `⚡ ${currentBotName} menu loading...`;
  
//   // Send loading message with fake contact
//   await sock.sendMessage(jid, { 
//     text: loadingMessage 
//   }, { 
//     quoted: fkontak 
//   });
  
//   // Add a small delay
//   await new Promise(resolve => setTimeout(resolve, 800));
  
//   // ========== REST OF YOUR EXISTING CODE ==========
//   // 🖼️ Full info + image + commands (with individual toggles)
//   let finalCaption = "";
  
//   // ========== ADD FADED TEXT HELPER FUNCTION ==========
//   const createFadedEffect = (text) => {
//     /**
//      * Creates WhatsApp's "faded/spoiler" text effect
//      * @param {string} text - Text to apply faded effect to
//      * @returns {string} Formatted text with faded effect
//      */
    
//     const fadeChars = [
//       '\u200D', // ZERO WIDTH JOINER
//       '\u200C', // ZERO WIDTH NON-JOINER
//       '\u2060', // WORD JOINER
//       '\uFEFF', // ZERO WIDTH NO-BREAK SPACE
//     ];
    
//     // Create initial fade (80-100 characters for good effect)
//     const initialFade = Array.from({ length: 90 }, 
//       (_, i) => fadeChars[i % fadeChars.length]
//     ).join('');
    
//     return `${initialFade}${text}`;
//   };
  
//   // ========== ADD "READ MORE" HELPER FUNCTION ==========
//   const createReadMoreEffect = (text1, text2) => {
//     /**
//      * Creates WhatsApp's "Read more" effect using invisible characters
//      * @param {string} text1 - First part (visible before "Read more")
//      * @param {string} text2 - Second part (hidden after "Read more")
//      * @returns {string} Formatted text with "Read more" effect
//      */
    
//     // WhatsApp needs MORE invisible characters to trigger "Read more"
//     // Use 500+ characters for better reliability
//     const invisibleChars = [
//       '\u200E',    // LEFT-TO-RIGHT MARK
//       '\u200F',    // RIGHT-TO-LEFT MARK
//       '\u200B',    // ZERO WIDTH SPACE
//       '\u200C',    // ZERO WIDTH NON-JOINER
//       '\u200D',    // ZERO WIDTH JOINER
//       '\u2060',    // WORD JOINER
//       '\uFEFF',    // ZERO WIDTH NO-BREAK SPACE
//     ];
    
//     // Create a LONG string of invisible characters (500-600 chars)
//     // WhatsApp needs enough to break the line detection
//     const invisibleString = Array.from({ length: 550 }, 
//       (_, i) => invisibleChars[i % invisibleChars.length]
//     ).join('');
    
//     // Add a newline after invisible characters for cleaner break
//     return `${text1}${invisibleString}\n${text2}`;
//   };
//   // ========== END OF HELPER FUNCTION ==========
  
//   // Helper functions (same as case 5)
//   const getBotMode = () => {
//     try {
//       const possiblePaths = [
//         './bot_mode.json',
//         path.join(__dirname, 'bot_mode.json'),
//         path.join(__dirname, '../bot_mode.json'),
//         path.join(__dirname, '../../bot_mode.json'),
//         path.join(__dirname, '../../../bot_mode.json'),
//         path.join(__dirname, '../commands/owner/bot_mode.json'),
//       ];
      
//       for (const modePath of possiblePaths) {
//         if (fs.existsSync(modePath)) {
//           try {
//             const modeData = JSON.parse(fs.readFileSync(modePath, 'utf8'));
            
//             if (modeData.mode) {
//               let displayMode;
//               switch(modeData.mode.toLowerCase()) {
//                 case 'public':
//                   displayMode = '🌍 Public';
//                   break;
//                 case 'silent':
//                   displayMode = '🔇 Silent';
//                   break;
//                 case 'private':
//                   displayMode = '🔒 Private';
//                   break;
//                 case 'group-only':
//                   displayMode = '👥 Group Only';
//                   break;
//                 case 'maintenance':
//                   displayMode = '🛠️ Maintenance';
//                   break;
//                 default:
//                   displayMode = `⚙️ ${modeData.mode.charAt(0).toUpperCase() + modeData.mode.slice(1)}`;
//               }
//               return displayMode;
//             }
//           } catch (parseError) {}
//         }
//       }
      
//       // Fallback to global variables
//       if (global.BOT_MODE) {
//         return global.BOT_MODE === 'silent' ? '🔇 Silent' : '🌍 Public';
//       }
//       if (global.mode) {
//         return global.mode === 'silent' ? '🔇 Silent' : '🌍 Public';
//       }
//       if (process.env.BOT_MODE) {
//         return process.env.BOT_MODE === 'silent' ? '🔇 Silent' : '🌍 Public';
//       }
      
//     } catch (error) {}
    
//     return '🌍 Public';
//   };
  
//   const getOwnerName = () => {
//     try {
//       const botSettingsPaths = [
//         './bot_settings.json',
//         path.join(__dirname, 'bot_settings.json'),
//         path.join(__dirname, '../bot_settings.json'),
//         path.join(__dirname, '../../bot_settings.json'),
//       ];
      
//       for (const settingsPath of botSettingsPaths) {
//         if (fs.existsSync(settingsPath)) {
//           try {
//             const settingsData = fs.readFileSync(settingsPath, 'utf8');
//             const settings = JSON.parse(settingsData);
            
//             if (settings.ownerName && settings.ownerName.trim() !== '') {
//               return settings.ownerName.trim();
//             }
//           } catch (parseError) {}
//         }
//       }
      
//       const ownerPath = path.join(__dirname, 'owner.json');
//       if (fs.existsSync(ownerPath)) {
//         const ownerData = fs.readFileSync(ownerPath, 'utf8');
//         const ownerInfo = JSON.parse(ownerData);
        
//         if (ownerInfo.owner && ownerInfo.owner.trim() !== '') {
//           return ownerInfo.owner.trim();
//         } else if (ownerInfo.number && ownerInfo.number.trim() !== '') {
//           return ownerInfo.number.trim();
//         } else if (ownerInfo.phone && ownerInfo.phone.trim() !== '') {
//           return ownerInfo.phone.trim();
//         } else if (ownerInfo.contact && ownerInfo.contact.trim() !== '') {
//           return ownerInfo.contact.trim();
//         } else if (Array.isArray(ownerInfo) && ownerInfo.length > 0) {
//           const owner = typeof ownerInfo[0] === 'string' ? ownerInfo[0] : "Unknown";
//           return owner;
//         }
//       }
      
//       if (global.OWNER_NAME) {
//         return global.OWNER_NAME;
//       }
//       if (global.owner) {
//         return global.owner;
//       }
//       if (process.env.OWNER_NUMBER) {
//         return process.env.OWNER_NUMBER;
//       }
      
//     } catch (error) {}
    
//     return 'Unknown';
//   };
  
//   const getBotPrefix = () => {
//     try {
//       const botSettingsPaths = [
//         './bot_settings.json',
//         path.join(__dirname, 'bot_settings.json'),
//         path.join(__dirname, '../bot_settings.json'),
//         path.join(__dirname, '../../bot_settings.json'),
//       ];
      
//       for (const settingsPath of botSettingsPaths) {
//         if (fs.existsSync(settingsPath)) {
//           try {
//             const settingsData = fs.readFileSync(settingsPath, 'utf8');
//             const settings = JSON.parse(settingsData);
            
//             if (settings.prefix && settings.prefix.trim() !== '') {
//               return settings.prefix.trim();
//             }
//           } catch (parseError) {}
//         }
//       }
      
//       if (global.prefix) {
//         return global.prefix;
//       }
      
//       if (process.env.PREFIX) {
//         return process.env.PREFIX;
//       }
      
//     } catch (error) {}
    
//     return '.';
//   };
  
//   const getBotVersion = () => {
//     try {
//       const ownerPath = path.join(__dirname, 'owner.json');
//       if (fs.existsSync(ownerPath)) {
//         const ownerData = fs.readFileSync(ownerPath, 'utf8');
//         const ownerInfo = JSON.parse(ownerData);
        
//         if (ownerInfo.version && ownerInfo.version.trim() !== '') {
//           return ownerInfo.version.trim();
//         }
//       }
      
//       const botSettingsPaths = [
//         './bot_settings.json',
//         path.join(__dirname, 'bot_settings.json'),
//         path.join(__dirname, '../bot_settings.json'),
//       ];
      
//       for (const settingsPath of botSettingsPaths) {
//         if (fs.existsSync(settingsPath)) {
//           try {
//             const settingsData = fs.readFileSync(settingsPath, 'utf8');
//             const settings = JSON.parse(settingsData);
            
//             if (settings.version && settings.version.trim() !== '') {
//               return settings.version.trim();
//             }
//           } catch (parseError) {}
//         }
//       }
      
//       if (global.VERSION) {
//         return global.VERSION;
//       }
      
//       if (global.version) {
//         return global.version;
//       }
      
//       if (process.env.VERSION) {
//         return process.env.VERSION;
//       }
      
//     } catch (error) {}
    
//     return 'v1.0.0';
//   };
  
//   const getDeploymentPlatform = () => {
//     // Detect deployment platform
//     if (process.env.REPL_ID || process.env.REPLIT_DB_URL) {
//       return {
//         name: 'Replit',
//         status: 'Active',
//         icon: '🌀'
//       };
//     } else if (process.env.HEROKU_APP_NAME) {
//       return {
//         name: 'Heroku',
//         status: 'Active',
//         icon: '🦸'
//       };
//     } else if (process.env.RENDER_SERVICE_ID) {
//       return {
//         name: 'Render',
//         status: 'Active',
//         icon: '⚡'
//       };
//     } else if (process.env.RAILWAY_ENVIRONMENT) {
//       return {
//         name: 'Railway',
//         status: 'Active',
//         icon: '🚂'
//       };
//     } else if (process.env.VERCEL) {
//       return {
//         name: 'Vercel',
//         status: 'Active',
//         icon: '▲'
//       };
//     } else if (process.env.GLITCH_PROJECT_REMIX) {
//       return {
//         name: 'Glitch',
//         status: 'Active',
//         icon: '🎏'
//       };
//     } else if (process.env.KOYEB) {
//       return {
//         name: 'Koyeb',
//         status: 'Active',
//         icon: '☁️'
//       };
//     } else if (process.env.CYCLIC_URL) {
//       return {
//         name: 'Cyclic',
//         status: 'Active',
//         icon: '🔄'
//       };
//     } else if (process.env.PANEL) {
//       return {
//         name: 'PteroPanel',
//         status: 'Active',
//         icon: '🖥️'
//       };
//     } else if (process.env.SSH_CONNECTION || process.env.SSH_CLIENT) {
//       return {
//         name: 'VPS/SSH',
//         status: 'Active',
//         icon: '🖥️'
//       };
//     } else if (process.platform === 'win32') {
//       return {
//         name: 'Windows PC',
//         status: 'Active',
//         icon: '💻'
//       };
//     } else if (process.platform === 'linux') {
//       return {
//         name: 'Linux VPS',
//         status: 'Active',
//         icon: '🐧'
//       };
//     } else if (process.platform === 'darwin') {
//       return {
//         name: 'MacOS',
//         status: 'Active',
//         icon: '🍎'
//       };
//     } else {
//       return {
//         name: 'Local Machine',
//         status: 'Active',
//         icon: '🏠'
//       };
//     }
//   };
  
//   // Get current time and date
//   const now = new Date();
//   const currentTime = now.toLocaleTimeString('en-US', { 
//     hour12: true, 
//     hour: '2-digit', 
//     minute: '2-digit',
//     second: '2-digit'
//   });
  
//   const currentDate = now.toLocaleDateString('en-US', {
//     weekday: 'long',
//     year: 'numeric',
//     month: 'long',
//     day: 'numeric'
//   });
  
//   // Load bot information using helper functions
//   const ownerName = getOwnerName();
//   const botPrefix = getBotPrefix();
//   const botVersion = getBotVersion();
//   const botMode = getBotMode();
//   const deploymentPlatform = getDeploymentPlatform();
  
//   // ========== ADDED HELPER FUNCTIONS FOR SYSTEM METRICS ==========
//   const formatUptime = (seconds) => {
//     const hours = Math.floor(seconds / 3600);
//     const minutes = Math.floor((seconds % 3600) / 60);
//     const secs = Math.floor(seconds % 60);
//     return `${hours}h ${minutes}m ${secs}s`;
//   };
  
//   const getRAMUsage = () => {
//     const used = process.memoryUsage().heapUsed / 1024 / 1024;
//     const total = os.totalmem() / 1024 / 1024 / 1024;
//     const percent = (used / (total * 1024)) * 100;
//     return Math.round(percent);
//   };
  
//   // ========== SIMPLIFIED INFO SECTION WITH BOX STYLE ==========
//   let infoSection = `╭─⊷「 *${currentBotName} *MENU* 」
// │
// ├─⊷ *📊 BOT INFO*
// │  ├⊷ *User:* ${m.pushName || "Anonymous"}
// │  ├⊷ *Date:* ${currentDate}
// │  ├⊷ *Time:* ${currentTime}
// │  ├⊷ *Owner:* ${ownerName}
// │  ├⊷ *Mode:* ${botMode}
// │  ├⊷ *Prefix:* [ ${botPrefix} ]
// │  ├⊷ *Version:* ${botVersion}
// │  ├⊷ *Platform:* ${deploymentPlatform.name}
// │  └⊷ *Status:* ${deploymentPlatform.status}
// │
// ├─⊷ *📈 SYSTEM STATUS*
// │  ├⊷ *Uptime:* ${formatUptime(process.uptime())}
// │  ├⊷ *RAM Usage:* ${getRAMUsage()}%
// │  └⊷ *Speed:* ${(performance.now() - performance.now()).toFixed(2)}ms
// │
// ╰─⊷`;

//   // Apply faded effect to the info section
//   const fadedInfoSection = createFadedEffect(infoSection);

//   // ========== COMMANDS SECTION ==========
//   const commandsText = `╭─⊷ *🏠 GROUP MANAGEMENT*
// │
// ├─⊷ *🛡️ ADMIN & MODERATION*
// │  • add
// │  • promote
// │  • demote
// │  • kick
// │  • kickall
// │  • ban
// │  • unban
// │  • banlist
// │  • clearbanlist
// │  • warn
// │  • resetwarn
// │  • setwarn
// │  • mute
// │  • unmute
// │  • gctime
// │  • antileave
// │  • antilink
// │  • welcome
// │
// ├─⊷ *🚫 AUTO-MODERATION*
// │  • antisticker
// │  • antiviewonce
// │  • antilink
// │  • antiimage
// │  • antivideo
// │  • antiaudio
// │  • antimention
// │  • antistatusmention
// │  • antigrouplink
// │
// ├─⊷ *📊 GROUP INFO & TOOLS*
// │  • groupinfo
// │  • tagadmin
// │  • tagall
// │  • hidetag
// │  • link
// │  • invite
// │  • revoke
// │  • setdesc
// │  • fangtrace
// │  • getgpp
// │  • togstatus
// │
// ╰─⊷

// ╭─⊷ *🎨 MENU COMMANDS*
// │
// │  • togglemenuinfo
// │  • setmenuimage
// │  • resetmenuinfo
// │  • menustyle
// │
// ╰─⊷

// ╭─⊷ *👑 OWNER CONTROLS*
// │
// ├─⊷ *⚡ CORE MANAGEMENT*
// │  • setbotname
// │  • setowner
// │  • setprefix
// │  • iamowner
// │  • about
// │  • block
// │  • unblock
// │  • blockdetect
// │  • silent
// │  • anticall
// │  • mode
// │  • online
// │  • setpp
// │  • repo
// │  • antidelete
// │  • antideletestatus
// │
// ├─⊷ *🔄 SYSTEM & MAINTENANCE*
// │  • restart
// │  • workingreload
// │  • reloadenv
// │  • getsettings
// │  • setsetting
// │  • test
// │  • disk
// │  • hostip
// │  • findcommands
// │
// ╰─⊷

// ╭─⊷ *⚙️ AUTOMATION*
// │
// │  • autoread
// │  • autotyping
// │  • autorecording
// │  • autoreact
// │  • autoreactstatus
// │  • autobio
// │  • autorec
// │
// ╰─⊷

// ╭─⊷ *✨ GENERAL UTILITIES*
// │
// ├─⊷ *🔍 INFO & SEARCH*
// │  • alive
// │  • ping
// │  • ping2
// │  • time
// │  • connection
// │  • define
// │  • news
// │  • covid
// │  • iplookup
// │  • getip
// │  • getpp
// │  • getgpp
// │  • prefixinfo
// │
// ├─⊷ *🔗 CONVERSION & MEDIA*
// │  • shorturl
// │  • qrencode
// │  • take
// │  • imgbb
// │  • tiktok
// │  • save
// │  • toimage
// │  • tosticker
// │  • toaudio
// │  • tts
// │
// ├─⊷ *📝 PERSONAL TOOLS*
// │  • pair
// │  • resetwarn
// │  • setwarn
// │
// ╰─⊷

// ╭─⊷ *🎵 MUSIC & MEDIA*
// │
// │  • play
// │  • song
// │  • lyrics
// │  • spotify
// │
// ╰─⊷

// ╭─⊷ *🤖 MEDIA & AI COMMANDS*
// │
// ├─⊷ *⬇️ MEDIA DOWNLOADS*
// │  • youtube
// │  • tiktok
// │  • instagram
// │  • facebook
// │  • snapchat
// │  • apk
// │  • yts
// │  • ytplay
// │  • ytmp3
// │  • ytv
// │  • ytmp4
// │  • ytplaydoc
// │  • song
// │  • play
// │  • spotify
// │  • video
// │  • image
// │
// ├─⊷ *🎨 AI GENERATION*
// │  • gpt
// │  • gemini
// │  • deepseek
// │  • deepseek+
// │  • analyze
// │  • suno
// │  • wolfbot
// │  • bard
// │  • claudeai
// │  • venice
// │  • grok
// │  • wormgpt
// │  • speechwriter
// │  • blackbox
// │  • mistral
// │  • metai
// │
// ├─⊷ *🎨 AI TOOLS*
// │  • videogen
// │  • aiscanner
// │  • humanizer
// │  • summarize
// │
// ╰─⊷

// ╭─⊷*🎨 EPHOTO EFFECTS*
// │  • tigervideo
// │  • introvideo
// │  • lightningpubg
// │  • lovevideo
// │  • blackpink
// │  • 1917
// │  • advancedglow
// │  • cartoonstyle
// │  • deletetext
// │  • dragonball
// │  • cloudeffect
// │  • galaxy
// │  • galaxywallpaper
// │  • glitch
// │  • glowingtext
// │  • gradient
// │  • graffitipaint
// │  • greenneon
// │  • hologram
// │  • icetext
// │  • incadescent
// │  • tattoo
// │  • zodiac
// │  • comic
// │  • graffiti
// │  • firework
// │  • underwater
// │  • lighteffect
// │  • thunder
// │
// ╰─⊷

// ╭─⊷ *🖼️ IMAGE TOOLS*
// │
// │  • image
// │  • imagegenerate
// │  • anime
// │  • art
// │  • real
// │
// ╰─⊷

// ╭─⊷ *🛡️ SECURITY & HACKING*
// │
// ├─⊷ *🌐 NETWORK & INFO*
// │  • ipinfo
// │  • shodan
// │  • iplookup
// │  • getip
// │
// ╰─⊷

// ╭─⊷ *🎨 LOGO DESIGN STUDIO*
// │
// ├─⊷ *🌟 PREMIUM METALS*
// │  • goldlogo
// │  • silverlogo
// │  • platinumlogo
// │  • chromelogo
// │  • diamondlogo
// │  • bronzelogo
// │  • steelogo
// │  • copperlogo
// │  • titaniumlogo
// │
// ├─⊷ *🔥 ELEMENTAL EFFECTS*
// │  • firelogo
// │  • icelogo
// │  • iceglowlogo
// │  • lightninglogo
// │  • aqualogo
// │  • rainbowlogo
// │  • sunlogo
// │  • moonlogo
// │
// ├─⊷ *🎭 MYTHICAL & MAGICAL*
// │  • dragonlogo
// │  • phoenixlogo
// │  • wizardlogo
// │  • crystallogo
// │  • darkmagiclogo
// │
// ├─⊷ *🌌 DARK & GOTHIC*
// │  • shadowlogo
// │  • smokelogo
// │  • bloodlogo
// │
// ├─⊷ *💫 GLOW & NEON EFFECTS*
// │  • neonlogo
// │  • glowlogo
// │
// ├─⊷ *🤖 TECH & FUTURISTIC*
// │  • matrixlogo
// │
// ╰─⊷

// ╭─⊷ *🐙 GITHUB COMMANDS*
// │
// │  • gitclone
// │  • gitinfo
// │  • repo
// │  • commits
// │  • stars
// │  • watchers
// │  • release
// │
// ╰─⊷

// ╭─⊷ *🌸 ANIME COMMANDS*
// │
// │  • awoo
// │  • bj
// │  • bully
// │  • cringe
// │  • cry
// │  • cuddle
// │  • dance
// │  • glomp
// │  • highfive
// │  • kill
// │  • kiss
// │  • lick
// │  • megumin
// │  • neko
// │  • pat
// │  • shinobu
// │  • trap
// │  • trap2
// │  • waifu
// │  • wink
// │  • yeet
// │
// ╰─⊷

// 🐺 *POWERED BY WOLF TECH* 🐺`;

//   // ========== APPLY "READ MORE" EFFECT ==========
//   // Combine faded info section (visible) and commands (hidden) with "Read more"
//   finalCaption = createReadMoreEffect(fadedInfoSection, commandsText);
//   // ========== END "READ MORE" EFFECT ==========

//   // Load and send the image
//   const imgPath1 = path.join(__dirname, "media", "wolfbot.jpg");
//   const imgPath2 = path.join(__dirname, "../media/wolfbot.jpg");
//   const imagePath = fs.existsSync(imgPath1) ? imgPath1 : fs.existsSync(imgPath2) ? imgPath2 : null;
  
//   if (!imagePath) {
//     await sock.sendMessage(jid, { text: "⚠️ Image 'wolfbot.jpg' not found!" }, { quoted: fkontak });
//     return;
//   }
  
//   const buffer = fs.readFileSync(imagePath);

//   // Send the menu with image and fake contact
//   await sock.sendMessage(jid, { 
//     image: buffer, 
//     caption: finalCaption, 
//     mimetype: "image/jpeg"
//   }, { 
//     quoted: fkontak 
//   });
  
//   console.log(`✅ ${currentBotName} menu sent with faded effect, box style, and "Read more" effect`);
//   break;
// }

case 1: {
  // First, get the bot name BEFORE showing loading message
  const getBotName = () => {
    try {
      const possiblePaths = [
        './bot_settings.json',
        path.join(__dirname, 'bot_settings.json'),
        path.join(__dirname, '../bot_settings.json'),
        path.join(__dirname, '../../bot_settings.json'),
        path.join(__dirname, '../../../bot_settings.json'),
        path.join(__dirname, '../commands/owner/bot_settings.json'),
      ];
      
      for (const settingsPath of possiblePaths) {
        if (fs.existsSync(settingsPath)) {
          try {
            const settingsData = fs.readFileSync(settingsPath, 'utf8');
            const settings = JSON.parse(settingsData);
            
            if (settings.botName && settings.botName.trim() !== '') {
              return settings.botName.trim();
            }
          } catch (parseError) {}
        }
      }
      
      if (global.BOT_NAME) {
        return global.BOT_NAME;
      }
      
      if (process.env.BOT_NAME) {
        return process.env.BOT_NAME;
      }
      
    } catch (error) {}
    
    return 'WOLFBOT';
  };
  
  // Get the current bot name
  const currentBotName = getBotName();
  
  // ========== CREATE FAKE CONTACT FUNCTION ==========
  const createFakeContact = (message) => {
    const jid = message.key.participant?.split('@')[0] || message.key.remoteJid.split('@')[0];
    return {
      key: {
        remoteJid: "status@broadcast",
        fromMe: false,
        id: "WOLF-X"
      },
      message: {
        contactMessage: {
          displayName: "WOLF BOT",
          vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:WOLF BOT\nitem1.TEL;waid=${jid}:${jid}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
        }
      },
      participant: "0@s.whatsapp.net"
    };
  };
  
  // Create fake contact for quoted messages
  const fkontak = createFakeContact(m);
  
  // ========== SIMPLE LOADING MESSAGE ==========
  const loadingMessage = `⚡ ${currentBotName} menu loading...`;
  
  // Send loading message with fake contact
  await sock.sendMessage(jid, { 
    text: loadingMessage 
  }, { 
    quoted: fkontak 
  });
  
  // Add a small delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // ========== REST OF YOUR EXISTING CODE ==========
  // 🖼️ Full info + image + commands (with individual toggles)
  let finalCaption = "";
  
  // ========== ADD FADED TEXT HELPER FUNCTION ==========
  const createFadedEffect = (text) => {
    /**
     * Creates WhatsApp's "faded/spoiler" text effect
     * @param {string} text - Text to apply faded effect to
     * @returns {string} Formatted text with faded effect
     */
    
    const fadeChars = [
      '\u200D', // ZERO WIDTH JOINER
      '\u200C', // ZERO WIDTH NON-JOINER
      '\u2060', // WORD JOINER
      '\uFEFF', // ZERO WIDTH NO-BREAK SPACE
    ];
    
    // Create initial fade (80-100 characters for good effect)
    const initialFade = Array.from({ length: 90 }, 
      (_, i) => fadeChars[i % fadeChars.length]
    ).join('');
    
    return `${initialFade}${text}`;
  };
  
  // ========== ADD "READ MORE" HELPER FUNCTION ==========
  const createReadMoreEffect = (text1, text2) => {
    /**
     * Creates WhatsApp's "Read more" effect using invisible characters
     * @param {string} text1 - First part (visible before "Read more")
     * @param {string} text2 - Second part (hidden after "Read more")
     * @returns {string} Formatted text with "Read more" effect
     */
    
    // WhatsApp needs MORE invisible characters to trigger "Read more"
    // Use 500+ characters for better reliability
    const invisibleChars = [
      '\u200E',    // LEFT-TO-RIGHT MARK
      '\u200F',    // RIGHT-TO-LEFT MARK
      '\u200B',    // ZERO WIDTH SPACE
      '\u200C',    // ZERO WIDTH NON-JOINER
      '\u200D',    // ZERO WIDTH JOINER
      '\u2060',    // WORD JOINER
      '\uFEFF',    // ZERO WIDTH NO-BREAK SPACE
    ];
    
    // Create a LONG string of invisible characters (500-600 chars)
    // WhatsApp needs enough to break the line detection
    const invisibleString = Array.from({ length: 550 }, 
      (_, i) => invisibleChars[i % invisibleChars.length]
    ).join('');
    
    // Add a newline after invisible characters for cleaner break
    return `${text1}${invisibleString}\n${text2}`;
  };
  // ========== END OF HELPER FUNCTION ==========
  
  // Helper functions (same as case 5)
  const getBotMode = () => {
    try {
      const possiblePaths = [
        './bot_mode.json',
        path.join(__dirname, 'bot_mode.json'),
        path.join(__dirname, '../bot_mode.json'),
        path.join(__dirname, '../../bot_mode.json'),
        path.join(__dirname, '../../../bot_mode.json'),
        path.join(__dirname, '../commands/owner/bot_mode.json'),
      ];
      
      for (const modePath of possiblePaths) {
        if (fs.existsSync(modePath)) {
          try {
            const modeData = JSON.parse(fs.readFileSync(modePath, 'utf8'));
            
            if (modeData.mode) {
              let displayMode;
              switch(modeData.mode.toLowerCase()) {
                case 'public':
                  displayMode = '🌍 Public';
                  break;
                case 'silent':
                  displayMode = '🔇 Silent';
                  break;
                case 'private':
                  displayMode = '🔒 Private';
                  break;
                case 'group-only':
                  displayMode = '👥 Group Only';
                  break;
                case 'maintenance':
                  displayMode = '🛠️ Maintenance';
                  break;
                default:
                  displayMode = `⚙️ ${modeData.mode.charAt(0).toUpperCase() + modeData.mode.slice(1)}`;
              }
              return displayMode;
            }
          } catch (parseError) {}
        }
      }
      
      // Fallback to global variables
      if (global.BOT_MODE) {
        return global.BOT_MODE === 'silent' ? '🔇 Silent' : '🌍 Public';
      }
      if (global.mode) {
        return global.mode === 'silent' ? '🔇 Silent' : '🌍 Public';
      }
      if (process.env.BOT_MODE) {
        return process.env.BOT_MODE === 'silent' ? '🔇 Silent' : '🌍 Public';
      }
      
    } catch (error) {}
    
    return '🌍 Public';
  };
  
  const getOwnerName = () => {
    try {
      const botSettingsPaths = [
        './bot_settings.json',
        path.join(__dirname, 'bot_settings.json'),
        path.join(__dirname, '../bot_settings.json'),
        path.join(__dirname, '../../bot_settings.json'),
      ];
      
      for (const settingsPath of botSettingsPaths) {
        if (fs.existsSync(settingsPath)) {
          try {
            const settingsData = fs.readFileSync(settingsPath, 'utf8');
            const settings = JSON.parse(settingsData);
            
            if (settings.ownerName && settings.ownerName.trim() !== '') {
              return settings.ownerName.trim();
            }
          } catch (parseError) {}
        }
      }
      
      const ownerPath = path.join(__dirname, 'owner.json');
      if (fs.existsSync(ownerPath)) {
        const ownerData = fs.readFileSync(ownerPath, 'utf8');
        const ownerInfo = JSON.parse(ownerData);
        
        if (ownerInfo.owner && ownerInfo.owner.trim() !== '') {
          return ownerInfo.owner.trim();
        } else if (ownerInfo.number && ownerInfo.number.trim() !== '') {
          return ownerInfo.number.trim();
        } else if (ownerInfo.phone && ownerInfo.phone.trim() !== '') {
          return ownerInfo.phone.trim();
        } else if (ownerInfo.contact && ownerInfo.contact.trim() !== '') {
          return ownerInfo.contact.trim();
        } else if (Array.isArray(ownerInfo) && ownerInfo.length > 0) {
          const owner = typeof ownerInfo[0] === 'string' ? ownerInfo[0] : "Unknown";
          return owner;
        }
      }
      
      if (global.OWNER_NAME) {
        return global.OWNER_NAME;
      }
      if (global.owner) {
        return global.owner;
      }
      if (process.env.OWNER_NUMBER) {
        return process.env.OWNER_NUMBER;
      }
      
    } catch (error) {}
    
    return 'Unknown';
  };
  
  const getBotPrefix = () => {
    try {
      const botSettingsPaths = [
        './bot_settings.json',
        path.join(__dirname, 'bot_settings.json'),
        path.join(__dirname, '../bot_settings.json'),
        path.join(__dirname, '../../bot_settings.json'),
      ];
      
      for (const settingsPath of botSettingsPaths) {
        if (fs.existsSync(settingsPath)) {
          try {
            const settingsData = fs.readFileSync(settingsPath, 'utf8');
            const settings = JSON.parse(settingsData);
            
            if (settings.prefix && settings.prefix.trim() !== '') {
              return settings.prefix.trim();
            }
          } catch (parseError) {}
        }
      }
      
      if (global.prefix) {
        return global.prefix;
      }
      
      if (process.env.PREFIX) {
        return process.env.PREFIX;
      }
      
    } catch (error) {}
    
    return '.';
  };
  
  const getBotVersion = () => {
    try {
      const ownerPath = path.join(__dirname, 'owner.json');
      if (fs.existsSync(ownerPath)) {
        const ownerData = fs.readFileSync(ownerPath, 'utf8');
        const ownerInfo = JSON.parse(ownerData);
        
        if (ownerInfo.version && ownerInfo.version.trim() !== '') {
          return ownerInfo.version.trim();
        }
      }
      
      const botSettingsPaths = [
        './bot_settings.json',
        path.join(__dirname, 'bot_settings.json'),
        path.join(__dirname, '../bot_settings.json'),
      ];
      
      for (const settingsPath of botSettingsPaths) {
        if (fs.existsSync(settingsPath)) {
          try {
            const settingsData = fs.readFileSync(settingsPath, 'utf8');
            const settings = JSON.parse(settingsData);
            
            if (settings.version && settings.version.trim() !== '') {
              return settings.version.trim();
            }
          } catch (parseError) {}
        }
      }
      
      if (global.VERSION) {
        return global.VERSION;
      }
      
      if (global.version) {
        return global.version;
      }
      
      if (process.env.VERSION) {
        return process.env.VERSION;
      }
      
    } catch (error) {}
    
    return 'v1.0.0';
  };
  
  // ========== IMPROVED DEPLOYMENT PLATFORM DETECTION ==========
  const getDeploymentPlatform = () => {
    // Check Heroku FIRST (most specific env variables)
    if (process.env.HEROKU_APP_NAME || 
        process.env.DYNO || 
        process.env.HEROKU_API_KEY ||
        (process.env.PORT && process.env.PORT !== '3000' && process.env.PORT !== '8080')) {
      return {
        name: 'Heroku',
        status: 'Active',
        icon: '🦸'
      };
    }
    // Check Render
    else if (process.env.RENDER_SERVICE_ID || 
             process.env.RENDER_SERVICE_NAME ||
             process.env.RENDER) {
      return {
        name: 'Render',
        status: 'Active',
        icon: '⚡'
      };
    }
    // Check Railway
    else if (process.env.RAILWAY_ENVIRONMENT ||
             process.env.RAILWAY_PROJECT_NAME ||
             process.env.RAILWAY_SERVICE_NAME) {
      return {
        name: 'Railway',
        status: 'Active',
        icon: '🚂'
      };
    }
    // Check Replit
    else if (process.env.REPL_ID || 
             process.env.REPLIT_DB_URL ||
             process.env.REPLIT_USER ||
             process.env.REPL_SLUG) {
      return {
        name: 'Replit',
        status: 'Active',
        icon: '🌀'
      };
    }
    // Check Vercel
    else if (process.env.VERCEL || 
             process.env.VERCEL_ENV ||
             process.env.VERCEL_URL) {
      return {
        name: 'Vercel',
        status: 'Active',
        icon: '▲'
      };
    }
    // Check Glitch
    else if (process.env.GLITCH_PROJECT_REMIX ||
             process.env.PROJECT_REMIX_CHAIN ||
             process.env.GLITCH) {
      return {
        name: 'Glitch',
        status: 'Active',
        icon: '🎏'
      };
    }
    // Check Koyeb
    else if (process.env.KOYEB_APP ||
             process.env.KOYEB_REGION ||
             process.env.KOYEB_SERVICE) {
      return {
        name: 'Koyeb',
        status: 'Active',
        icon: '☁️'
      };
    }
    // Check Cyclic
    else if (process.env.CYCLIC_URL ||
             process.env.CYCLIC_APP_ID ||
             process.env.CYCLIC_DB) {
      return {
        name: 'Cyclic',
        status: 'Active',
        icon: '🔄'
      };
    }
    // Check Panel/Pterodactyl
    else if (process.env.PANEL ||
             process.env.PTERODACTYL ||
             process.env.NODE_ENV === 'production' && 
             (process.platform === 'linux' && !process.env.SSH_CONNECTION)) {
      return {
        name: 'Panel/VPS',
        status: 'Active',
        icon: '🖥️'
      };
    }
    // Check SSH/VPS
    else if (process.env.SSH_CONNECTION || 
             process.env.SSH_CLIENT ||
             (process.platform === 'linux' && process.env.USER === 'root')) {
      return {
        name: 'VPS/SSH',
        status: 'Active',
        icon: '🖥️'
      };
    }
    // Check OS
    else if (process.platform === 'win32') {
      return {
        name: 'Windows PC',
        status: 'Active',
        icon: '💻'
      };
    } else if (process.platform === 'darwin') {
      return {
        name: 'MacOS',
        status: 'Active',
        icon: '🍎'
      };
    } else if (process.platform === 'linux') {
      return {
        name: 'Linux Local',
        status: 'Active',
        icon: '🐧'
      };
    } else {
      return {
        name: 'Local Machine',
        status: 'Active',
        icon: '🏠'
      };
    }
  };
  
  // Get current time and date (keeping for potential future use)
  const now = new Date();
  const currentTime = now.toLocaleTimeString('en-US', { 
    hour12: true, 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  });
  
  const currentDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Load bot information using helper functions
  const ownerName = getOwnerName();
  const botPrefix = getBotPrefix();
  const botVersion = getBotVersion();
  const botMode = getBotMode();
  const deploymentPlatform = getDeploymentPlatform();
  
  // ========== IMPROVED REAL-TIME SYSTEM METRICS ==========
  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };
  
  // REAL RAM USAGE CALCULATION WITH VISUAL BAR
  const getRAMUsage = () => {
    try {
      const mem = process.memoryUsage();
      const used = mem.heapUsed / 1024 / 1024; // MB
      const total = mem.heapTotal / 1024 / 1024; // MB
      const percent = Math.round((used / total) * 100);
      
      // Create visual progress bar (10 segments total)
      const barLength = 10;
      const filledBars = Math.round((percent / 100) * barLength);
      const emptyBars = barLength - filledBars;
      
      // Choose different bar styles for better visibility
      const barStyle = '█';
      const emptyStyle = '░';
      
      // Create the visual bar
      const memBar = barStyle.repeat(filledBars) + emptyStyle.repeat(emptyBars);
      
      // Get system RAM info (optional)
      let systemTotal = os.totalmem() / 1024 / 1024 / 1024; // GB
      let systemUsed = (os.totalmem() - os.freemem()) / 1024 / 1024 / 1024; // GB
      let systemPercent = Math.round((systemUsed / systemTotal) * 100);
      
      return {
        bar: memBar,
        percent: percent,
        usedMB: Math.round(used * 100) / 100,
        totalMB: Math.round(total * 100) / 100,
        systemPercent: systemPercent,
        systemUsedGB: Math.round(systemUsed * 100) / 100,
        systemTotalGB: Math.round(systemTotal * 100) / 100
      };
    } catch (error) {
      // Fallback if something goes wrong
      return {
        bar: '░░░░░░░░░░',
        percent: 0,
        usedMB: 0,
        totalMB: 0,
        systemPercent: 0,
        systemUsedGB: 0,
        systemTotalGB: 0
      };
    }
  };
  
  // Get real RAM usage
  const ramUsage = getRAMUsage();
  
  // ========== UPDATED MENU WITH CURVED FORMAT ==========
  let infoSection = `╭─⌈ \`${currentBotName}\` ⌋
│  ╭⊷ *User:* ${m.pushName || "Anonymous"}
│  ├⊷ *Owner:* ${ownerName}
│  ├⊷ *Mode:* ${botMode}
│  ├⊷ *Prefix:* [ ${botPrefix} ]
│  ├⊷ *Version:* ${botVersion}
│  ├⊷ *Platform:* ${deploymentPlatform.name}
│  ├⊷ *Status:* ${deploymentPlatform.status}
│  ├⊷ *Uptime:* ${formatUptime(process.uptime())}
│  ├⊷ *RAM Usage:* ${ramUsage.percent}%
│  │  ${ramUsage.bar}
│  ╰⊷ *Memory:* ${ramUsage.usedMB}MB / ${ramUsage.totalMB}MB
╰─⊷`;

  // Apply faded effect to the info section
  const fadedInfoSection = createFadedEffect(infoSection);

  // ========== COMMANDS SECTION ==========
  const commandsText = `╭─⊷ *🏠 GROUP MANAGEMENT*
│
├─⊷ *🛡️ ADMIN & MODERATION*
│  • add
│  • promote
│  • promoteall
│  • demote
│  • demoteall
│  • kick
│  • kickall
│  • ban
│  • unban
│  • ex
│  • clearbanlist
│  • warn
│  • resetwarn
│  • setwarn
│  • warnings
│  • mute
│  • unmute
│  • gctime
│  • antileave
│  • antilink
│  • welcome
│  • goodbye
│  • leave
│  • creategroup
│
├─⊷ *🚫 AUTO-MODERATION*
│  • antisticker
│  • antiimage
│  • antivideo
│  • antiaudio
│  • antimention
│  • antistatusmention
│  • antigrouplink
│  • antidemote
│  • antipromote
│  • antiviewonce
│
├─⊷ *📊 GROUP INFO & TOOLS*
│  • groupinfo
│  • grouplink
│  • tagadmin
│  • tagall
│  • hidetag
│  • link
│  • invite
│  • revoke
│  • setdesc
│  • fangtrace
│  • getgpp
│  • togstatus
│  • getparticipants
│  • listonline
│  • listinactive
│  • approveall
│  • rejectall
│  • stickerpack
│
╰─⊷

╭─⊷ *🎨 MENU COMMANDS*
│
│  • menu
│  • menustyle
│  • togglemenuinfo
│  • setmenuimage
│  • restoremenuimage
│
╰─⊷

╭─⊷ *👑 OWNER CONTROLS*
│
├─⊷ *⚡ CORE MANAGEMENT*
│  • setbotname
│  • resetbotname
│  • setowner
│  • resetowner
│  • setprefix
│  • prefix
│  • iamowner
│  • about
│  • owner
│  • block
│  • unblock
│  • blockdetect
│  • silent
│  • anticall
│  • mode
│  • setpp
│  • setfooter
│  • repo
│  • pair
│  • antidelete
│  • antideletestatus
│  • antiedit
│  • chatbot
│  • shutdown
│
├─⊷ *🔄 SYSTEM & MAINTENANCE*
│  • restart
│  • workingreload
│  • reloadenv
│  • getsettings
│  • setsetting
│  • test
│  • disk
│  • hostip
│  • findcommands
│  • latestupdates
│  • panel
│  • debugchat
│
├─⊷ *🔒 PRIVACY CONTROLS*
│  • online
│  • privacy
│  • receipt
│  • profilepic
│  • viewer
│
╰─⊷

╭─⊷ *👥 SUDO*
│
│  • addsudo
│  • delsudo
│  • listsudo
│  • checksudo
│  • clearsudo
│  • sudomode
│  • sudoinfo
│  • mysudo
│  • sudodebug
│  • linksudo
│
╰─⊷

╭─⊷ *⚙️ AUTOMATION*
│
│  • autoread
│  • autotyping
│  • autorecording
│  • autoreact
│  • autoreactstatus
│  • autoviewstatus
│  • autobio
│  • autorec
│  • reactowner
│
╰─⊷

╭─⊷ *✨ GENERAL UTILITIES*
│
├─⊷ *🔍 INFO & SEARCH*
│  • alive
│  • ping
│  • ping2
│  • time
│  • uptime
│  • define
│  • news
│  • covid
│  • weather
│  • wiki
│  • translate
│  • iplookup
│  • getip
│  • getpp
│  • getgpp
│  • prefixinfo
│
├─⊷ *🔗 CONVERSION & MEDIA*
│  • shorturl
│  • url
│  • fetch
│  • qrencode
│  • take
│  • imgbb
│  • tiktok
│  • save
│  • screenshot
│  • inspect
│  • toimage
│  • tosticker
│  • toaudio
│  • tovoice
│  • tts
│  • trebleboost
│  • jarvis
│
├─⊷ *📇 CONTACT TOOLS*
│  • vcf
│  • viewvcf
│  • vv
│  • vv2
│
╰─⊷

╭─⊷ *🎵 MUSIC & MEDIA*
│
│  • play
│  • song
│  • video
│  • videodoc
│  • lyrics
│  • shazam
│  • spotify
│
╰─⊷

╭─⊷ *⬇️ MEDIA DOWNLOADS*
│
│  • tiktok
│  • instagram
│  • facebook
│  • snapchat
│  • apk
│  • yts
│  • ytplay
│  • ytmp3
│  • ytv
│  • ytmp4
│  • ytvdoc
│  • videodl
│  • playlist
│
╰─⊷

╭─⊷ *🤖 AI COMMANDS*
│
├─⊷ *💬 AI CHAT*
│  • gpt
│  • chatgpt
│  • copilot
│  • bing
│  • bard
│  • claudeai
│  • grok
│  • blackbox
│  • mistral
│  • metai
│  • perplexity
│  • qwenai
│  • ilama
│  • venice
│  • wormgpt
│  • deepseek+
│  • chatbot
│
├─⊷ *🎨 AI GENERATION*
│  • imagine
│  • imagegen
│  • flux
│  • analyze
│  • suno
│  • speechwriter
│  • humanizer
│  • summarize
│  • totext
│  • removebg
│  • vision
│
├─⊷ *🎬 AI TOOLS*
│  • videogen
│  • aiscanner
│  • aimenu
│  • brandlogo
│  • companylogo
│  • logoai
│
╰─⊷

╭─⊷ *🎬 AI VIDEO EFFECTS*
│
│  • tigervideo
│  • introvideo
│  • lightningpubg
│  • lovevideo
│  • videogen
│
╰─⊷

╭─⊷ *🖼️ IMAGE TOOLS*
│
│  • image
│  • imagegen
│  • imagine
│  • anime
│  • art
│  • real
│  • remini
│  • vision
│
╰─⊷

╭─⊷ *🛡️ SECURITY & HACKING*
│
│  • ipinfo
│  • nmap
│  • shodan
│  • nglflood
│
╰─⊷

╭─⊷ *🎨 LOGO DESIGN STUDIO*
│
├─⊷ *🌟 PREMIUM METALS*
│  • goldlogo
│  • silverlogo
│  • platinumlogo
│  • chromelogo
│  • diamondlogo
│  • bronzelogo
│  • steelogo
│  • copperlogo
│  • titaniumlogo
│
├─⊷ *🔥 ELEMENTAL EFFECTS*
│  • firelogo
│  • icelogo
│  • iceglowlogo
│  • lightninglogo
│  • rainbowlogo
│  • sunlogo
│  • moonlogo
│
├─⊷ *🎭 MYTHICAL & MAGICAL*
│  • dragonlogo
│  • phoenixlogo
│  • wizardlogo
│  • crystallogo
│  • darkmagiclogo
│
├─⊷ *🌌 DARK & GOTHIC*
│  • shadowlogo
│  • smokelogo
│  • bloodlogo
│
├─⊷ *💫 GLOW & NEON*
│  • neonlogo
│  • glowlogo
│  • gradientlogo
│  • matrixlogo
│
╰─⊷

╭─⊷ *🐙 GITHUB COMMANDS*
│
│  • gitclone
│  • gitinfo
│  • repanalyze
│  • zip
│  • update
│  • repo
│
╰─⊷

╭─⊷ *🌸 ANIME COMMANDS*
│
│  • animemenu
│  • awoo
│  • bully
│  • cringe
│  • cry
│  • cuddle
│  • dance
│  • glomp
│  • highfive
│  • hug
│  • kill
│  • kiss
│  • lick
│  • megumin
│  • neko
│  • pat
│  • shinobu
│  • trap
│  • trap2
│  • waifu
│  • wink
│  • yeet
│
╰─⊷

╭─⊷ *🎮 GAMES*
│
│  • coinflip
│  • dare
│  • dice
│  • emojimix
│  • joke
│  • quiz
│  • rps
│  • snake
│  • tetris
│  • truth
│  • tictactoe
│  • quote
│
╰─⊷

╭─⊷ *🎭 FUN & TOOLS*
│
│  • bf
│  • gf
│  • couple
│  • gay
│  • getjid
│  • movie
│  • trailer
│  • goodmorning
│  • goodnight
│  • channelstatus
│  • hack
│
╰─⊷

╭─⊷ *⚡ QUICK COMMANDS*
│
│  • p
│  • up
│
╰─⊷

🐺 *POWERED BY WOLF TECH* 🐺`;

  // ========== APPLY "READ MORE" EFFECT ==========
  // Combine faded info section (visible) and commands (hidden) with "Read more"
  finalCaption = createReadMoreEffect(fadedInfoSection, commandsText);
  // ========== END "READ MORE" EFFECT ==========

  // Load and send the image
  const imgPath1 = path.join(__dirname, "media", "wolfbot.jpg");
  const imgPath2 = path.join(__dirname, "../media/wolfbot.jpg");
  const imagePath = fs.existsSync(imgPath1) ? imgPath1 : fs.existsSync(imgPath2) ? imgPath2 : null;
  
  if (!imagePath) {
    await sock.sendMessage(jid, { text: "⚠️ Image 'wolfbot.jpg' not found!" }, { quoted: fkontak });
    return;
  }
  
  const buffer = fs.readFileSync(imagePath);

  // Send the menu with image and fake contact
  await sock.sendMessage(jid, { 
    image: buffer, 
    caption: finalCaption, 
    mimetype: "image/jpeg"
  }, { 
    quoted: fkontak 
  });
  
  console.log(`✅ ${currentBotName} menu sent with faded effect, box style, and "Read more" effect`);
  break;
}





case 2: {
  // Add these helper functions (same as other cases)
  const getBotMode = () => {
    try {
      // Check multiple possible locations with priority order
      const possiblePaths = [
        './bot_mode.json',  // Root directory (most likely)
        path.join(__dirname, 'bot_mode.json'),  // Same directory as menu
        path.join(__dirname, '../bot_mode.json'),  // Parent directory
        path.join(__dirname, '../../bot_mode.json'),  // 2 levels up
        path.join(__dirname, '../../../bot_mode.json'),  // 3 levels up
        path.join(__dirname, '../commands/owner/bot_mode.json'),  // Owner commands directory
      ];
      
      for (const modePath of possiblePaths) {
        if (fs.existsSync(modePath)) {
          try {
            const modeData = JSON.parse(fs.readFileSync(modePath, 'utf8'));
            
            if (modeData.mode) {
              // Format for display
              let displayMode;
              switch(modeData.mode.toLowerCase()) {
                case 'public':
                  displayMode = '🌍 Public';
                  break;
                case 'silent':
                  displayMode = '🔇 Silent';
                  break;
                default:
                  displayMode = `⚙️ ${modeData.mode.charAt(0).toUpperCase() + modeData.mode.slice(1)}`;
              }
              
              return displayMode;
            }
          } catch (parseError) {
            // Continue to next path
          }
        }
      }
      
      // Fallback to global variables
      if (global.BOT_MODE) {
        return global.BOT_MODE === 'silent' ? '🔇 Silent' : '🌍 Public';
      }
      if (global.mode) {
        return global.mode === 'silent' ? '🔇 Silent' : '🌍 Public';
      }
      if (process.env.BOT_MODE) {
        return process.env.BOT_MODE === 'silent' ? '🔇 Silent' : '🌍 Public';
      }
      
    } catch (error) {
      // Error handling
    }
    
    return '🌍 Public'; // Default fallback
  };
  
  const getBotName = () => {
    try {
      // Check multiple possible locations with priority order
      const possiblePaths = [
        './bot_settings.json',  // Root directory (most likely)
        path.join(__dirname, 'bot_settings.json'),  // Same directory as menu
        path.join(__dirname, '../bot_settings.json'),  // Parent directory
        path.join(__dirname, '../../bot_settings.json'),  // 2 levels up
        path.join(__dirname, '../../../bot_settings.json'),  // 3 levels up
        path.join(__dirname, '../commands/owner/bot_settings.json'),  // Owner commands directory
      ];
      
      for (const settingsPath of possiblePaths) {
        if (fs.existsSync(settingsPath)) {
          try {
            const settingsData = fs.readFileSync(settingsPath, 'utf8');
            const settings = JSON.parse(settingsData);
            
            if (settings.botName && settings.botName.trim() !== '') {
              return settings.botName.trim();
            }
          } catch (parseError) {
            // Continue to next path
          }
        }
      }
      
      // Fallback to global variables
      if (global.BOT_NAME) {
        return global.BOT_NAME;
      }
      
      // Fallback to environment variable
      if (process.env.BOT_NAME) {
        return process.env.BOT_NAME;
      }
      
    } catch (error) {
      // Error handling
    }
    
    return 'WOLFBOT'; // Default fallback
  };

  // Load bot name and mode
  const botName = getBotName();
  const botMode = getBotMode();
  
  // 📝 Text Only
  const text = `🐺🌕 *${botName}* 🌕🐺 | Mode: ${botMode}
────────────────
> 🏠 *GROUP MANAGEMENT* — manage members & group
> • add — add user
> • promote — make admin
> • demote — remove admin
> • kick — remove user
> • ban — ban user
> • unban — unban user
> • banlist — show banned
> • clearbanlist — clear bans
> • warn — warn user
> • unwarn — remove warning
> • clearwarns — reset warnings
> • mute — mute user
> • unmute — unmute user
> • gctime — group time settings
> • lock — lock group
> • unlock — unlock group
> • welcome — set welcome message
> • goodbye — set goodbye message

> 🚫 *AUTO-MODERATION* — auto-protect group
> • antilink — block links
> • antisticker — block stickers
> • antiimage — block images
> • antivideo — block videos
> • antiaudio — block audio
> • antimention — block mentions
> • antistatusmention — block status mentions
> • antigrouplink — block group links

> 📊 *GROUP INFO & TOOLS* — group info commands
> • groupinfo — show info
> • tagadmin — mention admins
> • tagall — mention all
> • hidetag — hide mentions
> • link — show group link
> • invite — generate invite
> • revoke — revoke link
> • setname — change name
> • setdesc — change description
> • setgcpp — change group picture
> • fangtrace — trace user
> • disp — display group stats
> • kickall — kick all members
> • getgpp — get group picture

> 👑 *OWNER CONTROLS* — bot owner commands
> • setbotname — change bot name
> • setprefix — change prefix
> • block — block user
> • unblock — unblock user
> • silent — silent mode
> • mode — change bot mode (${botMode})
> • restart — restart bot
> • setpp — set bot profile
> • resetbotname — reset to default
> • quickname — set quick name

> 🔄 *SYSTEM & MAINTENANCE* — bot maintenance
> • restart — restart bot
> • update — update bot
> • backup — backup data
> • restore — restore data
> • cleardb — clear database
> • cleartemp — clear temp files
> • reloadenv — reload environment
> • test — test system
> • disk — check disk space
> • hostip — get host IP
> • findcommands — search commands

> ✨ *GENERAL UTILITIES* — info & conversions
> • ping — bot ping
> • time — current time
> • uptime — bot uptime
> • alive — check if bot is alive
> • define — word definition
> • news — latest news
> • weather — weather info
> • covid — covid stats
> • quote — random quotes
> • translate — translate text
> • shorturl — shorten URL
> • qrencode — QR encode
> • take — screenshot website
> • toimage — convert to image
> • tostatus — convert to status
> • toaudio — convert to audio
> • tovoice — convert to voice
> • save — save content
> • url — get URL info
> • goodmorning — morning message
> • goodnight — night message

> 🎵 *MUSIC & MEDIA* — entertainment
> • play — play music
> • song — download song
> • lyrics — get lyrics
> • spotify — spotify music
> • video — download video
> • video2 — alternative video
> • bassboost — bass boost audio
> • trebleboost — treble boost

> 🤖 *MEDIA & AI* — media & AI tools
> • youtube — YouTube downloader
> • tiktok — TikTok downloader
> • instagram — Instagram downloader
> • facebook — Facebook downloader
> • snapchat — Snapchat downloader
> • apk — APK downloader
> • gemini — Google AI
> • gpt — OpenAI ChatGPT
> • deepseek — DeepSeek AI
> • deepseek+ — DeepSeek advanced
> • wolfbot — Wolf AI assistant
> • analyze — analyze content
> • suno — Suno AI music
> • videogen — video generator

> 🖼️ *IMAGE TOOLS* — image generation
> • image — generate images
> • imagegenerate — AI image gen
> • anime — anime images
> • art — art images
> • real — realistic images

> 🛡️ *SECURITY & NETWORK* — network & scans
> • ipinfo — IP information
> • shodan — device scanning
> • iplookup — IP lookup
> • getip — get IP address
> • pwcheck — password strength
> • portscan — scan ports
> • subdomains — find subdomains

> 🎨 *LOGO DESIGN STUDIO* — design logos
> • goldlogo — gold style
> • silverlogo — silver style
> • platinumlogo — platinum style
> • chromelogo — chrome style
> • diamondlogo — diamond style
> • bronzelogo — bronze style
> • steelogo — steel style
> • copperlogo — copper style
> • titaniumlogo — titanium style
> • firelogo — fire effect
> • icelogo — ice effect
> • iceglowlogo — glowing ice
> • lightninglogo — lightning effect
> • aqualogo — water effect
> • rainbowlogo — rainbow colors
> • sunlogo — sun style
> • moonlogo — moon style
> • dragonlogo — dragon theme
> • phoenixlogo — phoenix theme
> • wizardlogo — wizard theme
> • crystallogo — crystal style
> • darkmagiclogo — dark magic
> • shadowlogo — shadow effect
> • smokelogo — smoke effect
> • bloodlogo — blood style
> • neonlogo — neon lights
> • glowlogo — glowing effect
> • matrixlogo — matrix style
> • 50+ more logo styles available

> ⚙️ *AUTOMATION* — auto features
> • autoread — auto read messages
> • autotyping — auto typing
> • autorecording — auto recording
> • autoreact — auto reactions
> • autoreactstatus — auto react to status
> • autobio — auto update bio
> • autorec — auto record

> 🐙 *GITHUB COMMANDS* — GitHub tools
> • gitclone — clone repository
> • gitinfo — repo information
> • repo — repository info
> • commits — view commits
> • stars — check stars
> • watchers — check watchers
> • release — view releases

────────────────
📌 *Prefix:* ${global.prefix || "."}
📌 *Mode:* ${botMode}
📌 *Total Commands:* 200+
📌 *Type "${global.prefix || "."}menu <style>" to change menu style*
📌 *Available styles: 1-7*

🐺🌕*POWERED BY WOLF TECH*🌕🐺
`; 
  await sock.sendMessage(jid, { text }, { quoted: m });
  break;
}









case 3: {
  // First, get the bot name BEFORE showing loading message
  const getBotName = () => {
    try {
      const possiblePaths = [
        './bot_settings.json',
        path.join(__dirname, 'bot_settings.json'),
        path.join(__dirname, '../bot_settings.json'),
        path.join(__dirname, '../../bot_settings.json'),
        path.join(__dirname, '../../../bot_settings.json'),
        path.join(__dirname, '../commands/owner/bot_settings.json'),
      ];
      
      for (const settingsPath of possiblePaths) {
        if (fs.existsSync(settingsPath)) {
          try {
            const settingsData = fs.readFileSync(settingsPath, 'utf8');
            const settings = JSON.parse(settingsData);
            
            if (settings.botName && settings.botName.trim() !== '') {
              return settings.botName.trim();
            }
          } catch (parseError) {}
        }
      }
      
      if (global.BOT_NAME) {
        return global.BOT_NAME;
      }
      
      if (process.env.BOT_NAME) {
        return process.env.BOT_NAME;
      }
      
    } catch (error) {}
    
    return 'WOLFBOT';
  };
  
  // Get the current bot name
  const currentBotName = getBotName();
  
  // ========== CREATE FAKE CONTACT FUNCTION ==========
  const createFakeContact = (message) => {
    const jid = message.key.participant?.split('@')[0] || message.key.remoteJid.split('@')[0];
    return {
      key: {
        remoteJid: "status@broadcast",
        fromMe: false,
        id: "WOLF-X"
      },
      message: {
        contactMessage: {
          displayName: "WOLF BOT",
          vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:WOLF BOT\nitem1.TEL;waid=${jid}:${jid}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
        }
      },
      participant: "0@s.whatsapp.net"
    };
  };
  
  // Create fake contact for quoted messages
  const fkontak = createFakeContact(m);
  
  // ========== LOADING MESSAGE ==========
  const loadingMessage = `⚡ ${currentBotName} menu loading...`;
  
  // Send loading message with fake contact
  await sock.sendMessage(jid, { 
    text: loadingMessage 
  }, { 
    quoted: fkontak 
  });
  
  // Add a small delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // ========== REST OF YOUR EXISTING CODE ==========
  // 🖼️ Full info + commands (with individual toggles)
  let finalCaption = "";
  
  // ========== IMPROVED HELPER FUNCTION ==========
  const createReadMoreEffect = (text1, text2) => {
    /**
     * Creates WhatsApp's "Read more" effect using invisible characters
     * @param {string} text1 - First part (visible before "Read more")
     * @param {string} text2 - Second part (hidden after "Read more")
     * @returns {string} Formatted text with "Read more" effect
     */
    
    // WhatsApp needs MORE invisible characters to trigger "Read more"
    // Use 500+ characters for better reliability
    const invisibleChars = [
      '\u200E',    // LEFT-TO-RIGHT MARK
      '\u200F',    // RIGHT-TO-LEFT MARK
      '\u200B',    // ZERO WIDTH SPACE
      '\u200C',    // ZERO WIDTH NON-JOINER
      '\u200D',    // ZERO WIDTH JOINER
      '\u2060',    // WORD JOINER
      '\uFEFF',    // ZERO WIDTH NO-BREAK SPACE
    ];
    
    // Create a LONG string of invisible characters (500-600 chars)
    // WhatsApp needs enough to break the line detection
    const invisibleString = Array.from({ length: 550 }, 
      (_, i) => invisibleChars[i % invisibleChars.length]
    ).join('');
    
    // Add a newline after invisible characters for cleaner break
    return `${text1}${invisibleString}\n${text2}`;
  };
  // ========== END OF HELPER FUNCTION ==========
  
  // Add these helper functions at the start of case 3
  const getBotMode = () => {
    try {
      const possiblePaths = [
        './bot_mode.json',
        path.join(__dirname, 'bot_mode.json'),
        path.join(__dirname, '../bot_mode.json'),
        path.join(__dirname, '../../bot_mode.json'),
        path.join(__dirname, '../../../bot_mode.json'),
        path.join(__dirname, '../commands/owner/bot_mode.json'),
      ];
      
      for (const modePath of possiblePaths) {
        if (fs.existsSync(modePath)) {
          try {
            const modeData = JSON.parse(fs.readFileSync(modePath, 'utf8'));
            
            if (modeData.mode) {
              let displayMode;
              switch(modeData.mode.toLowerCase()) {
                case 'public':
                  displayMode = '🌍 Public';
                  break;
                case 'silent':
                  displayMode = '🔇 Silent';
                  break;
                case 'private':
                  displayMode = '🔒 Private';
                  break;
                case 'group-only':
                  displayMode = '👥 Group Only';
                  break;
                case 'maintenance':
                  displayMode = '🛠️ Maintenance';
                  break;
                default:
                  displayMode = `⚙️ ${modeData.mode.charAt(0).toUpperCase() + modeData.mode.slice(1)}`;
              }
              return displayMode;
            }
          } catch (parseError) {}
        }
      }
      
      // Fallback to global variables
      if (global.BOT_MODE) {
        return global.BOT_MODE === 'silent' ? '🔇 Silent' : '🌍 Public';
      }
      if (global.mode) {
        return global.mode === 'silent' ? '🔇 Silent' : '🌍 Public';
      }
      if (process.env.BOT_MODE) {
        return process.env.BOT_MODE === 'silent' ? '🔇 Silent' : '🌍 Public';
      }
      
    } catch (error) {}
    
    return '🌍 Public';
  };
  
  const getOwnerName = () => {
    try {
      const botSettingsPaths = [
        './bot_settings.json',
        path.join(__dirname, 'bot_settings.json'),
        path.join(__dirname, '../bot_settings.json'),
        path.join(__dirname, '../../bot_settings.json'),
      ];
      
      for (const settingsPath of botSettingsPaths) {
        if (fs.existsSync(settingsPath)) {
          try {
            const settingsData = fs.readFileSync(settingsPath, 'utf8');
            const settings = JSON.parse(settingsData);
            
            if (settings.ownerName && settings.ownerName.trim() !== '') {
              return settings.ownerName.trim();
            }
          } catch (parseError) {}
        }
      }
      
      const ownerPath = path.join(__dirname, 'owner.json');
      if (fs.existsSync(ownerPath)) {
        const ownerData = fs.readFileSync(ownerPath, 'utf8');
        const ownerInfo = JSON.parse(ownerData);
        
        if (ownerInfo.owner && ownerInfo.owner.trim() !== '') {
          return ownerInfo.owner.trim();
        } else if (ownerInfo.number && ownerInfo.number.trim() !== '') {
          return ownerInfo.number.trim();
        } else if (ownerInfo.phone && ownerInfo.phone.trim() !== '') {
          return ownerInfo.phone.trim();
        } else if (ownerInfo.contact && ownerInfo.contact.trim() !== '') {
          return ownerInfo.contact.trim();
        } else if (Array.isArray(ownerInfo) && ownerInfo.length > 0) {
          const owner = typeof ownerInfo[0] === 'string' ? ownerInfo[0] : "Unknown";
          return owner;
        }
      }
      
      if (global.OWNER_NAME) {
        return global.OWNER_NAME;
      }
      if (global.owner) {
        return global.owner;
      }
      if (process.env.OWNER_NUMBER) {
        return process.env.OWNER_NUMBER;
      }
      
    } catch (error) {}
    
    return 'Unknown';
  };
  
  const getBotPrefix = () => {
    try {
      const botSettingsPaths = [
        './bot_settings.json',
        path.join(__dirname, 'bot_settings.json'),
        path.join(__dirname, '../bot_settings.json'),
        path.join(__dirname, '../../bot_settings.json'),
      ];
      
      for (const settingsPath of botSettingsPaths) {
        if (fs.existsSync(settingsPath)) {
          try {
            const settingsData = fs.readFileSync(settingsPath, 'utf8');
            const settings = JSON.parse(settingsData);
            
            if (settings.prefix && settings.prefix.trim() !== '') {
              return settings.prefix.trim();
            }
          } catch (parseError) {}
        }
      }
      
      if (global.prefix) {
        return global.prefix;
      }
      
      if (process.env.PREFIX) {
        return process.env.PREFIX;
      }
      
    } catch (error) {}
    
    return '.';
  };
  
  const getBotVersion = () => {
    try {
      const ownerPath = path.join(__dirname, 'owner.json');
      if (fs.existsSync(ownerPath)) {
        const ownerData = fs.readFileSync(ownerPath, 'utf8');
        const ownerInfo = JSON.parse(ownerData);
        
        if (ownerInfo.version && ownerInfo.version.trim() !== '') {
          return ownerInfo.version.trim();
        }
      }
      
      const botSettingsPaths = [
        './bot_settings.json',
        path.join(__dirname, 'bot_settings.json'),
        path.join(__dirname, '../bot_settings.json'),
      ];
      
      for (const settingsPath of botSettingsPaths) {
        if (fs.existsSync(settingsPath)) {
          try {
            const settingsData = fs.readFileSync(settingsPath, 'utf8');
            const settings = JSON.parse(settingsData);
            
            if (settings.version && settings.version.trim() !== '') {
              return settings.version.trim();
            }
          } catch (parseError) {}
        }
      }
      
      if (global.VERSION) {
        return global.VERSION;
      }
      
      if (global.version) {
        return global.version;
      }
      
      if (process.env.VERSION) {
        return process.env.VERSION;
      }
      
    } catch (error) {}
    
    return 'v1.0.0';
  };
  
  const getDeploymentPlatform = () => {
    // Detect deployment platform
    if (process.env.REPL_ID || process.env.REPLIT_DB_URL) {
      return {
        name: 'Replit',
        status: 'Active',
        icon: '🌀'
      };
    } else if (process.env.HEROKU_APP_NAME) {
      return {
        name: 'Heroku',
        status: 'Active',
        icon: '🦸'
      };
    } else if (process.env.RENDER_SERVICE_ID) {
      return {
        name: 'Render',
        status: 'Active',
        icon: '⚡'
      };
    } else if (process.env.RAILWAY_ENVIRONMENT) {
      return {
        name: 'Railway',
        status: 'Active',
        icon: '🚂'
      };
    } else if (process.env.VERCEL) {
      return {
        name: 'Vercel',
        status: 'Active',
        icon: '▲'
      };
    } else if (process.env.GLITCH_PROJECT_REMIX) {
      return {
        name: 'Glitch',
        status: 'Active',
        icon: '🎏'
      };
    } else if (process.env.KOYEB) {
      return {
        name: 'Koyeb',
        status: 'Active',
        icon: '☁️'
      };
    } else if (process.env.CYCLIC_URL) {
      return {
        name: 'Cyclic',
        status: 'Active',
        icon: '🔄'
      };
    } else if (process.env.PANEL) {
      return {
        name: 'PteroPanel',
        status: 'Active',
        icon: '🖥️'
      };
    } else if (process.env.SSH_CONNECTION || process.env.SSH_CLIENT) {
      return {
        name: 'VPS/SSH',
        status: 'Active',
        icon: '🖥️'
      };
    } else if (process.platform === 'win32') {
      return {
        name: 'Windows PC',
        status: 'Active',
        icon: '💻'
      };
    } else if (process.platform === 'linux') {
      return {
        name: 'Linux VPS',
        status: 'Active',
        icon: '🐧'
      };
    } else if (process.platform === 'darwin') {
      return {
        name: 'MacOS',
        status: 'Active',
        icon: '🍎'
      };
    } else {
      return {
        name: 'Local Machine',
        status: 'Active',
        icon: '🏠'
      };
    }
  };
  
  // Get current time and date
  const now = new Date();
  const currentTime = now.toLocaleTimeString('en-US', { 
    hour12: true, 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  });
  
  const currentDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Load bot information using helper functions
  const ownerName = getOwnerName();
  const botPrefix = getBotPrefix();
  const botVersion = getBotVersion();
  const botMode = getBotMode();
  const deploymentPlatform = getDeploymentPlatform();
  
  // Add info section only if any field is enabled
  const fieldsStatus = getAllFieldsStatus(style);
  
  // ========== FIX: Add safety check for fieldsStatus ==========
  let hasInfoFields = false;
  if (fieldsStatus && typeof fieldsStatus === 'object') {
    hasInfoFields = Object.values(fieldsStatus).some(val => val);
  } else {
    // If getAllFieldsStatus doesn't exist or returns invalid, show all info
    hasInfoFields = true;
  }
  
  let infoSection = "";
  
  if (hasInfoFields) {
    const start = performance.now();
    const uptime = process.uptime();
    const h = Math.floor(uptime / 3600);
    const mnt = Math.floor((uptime % 3600) / 60);
    const s = Math.floor(uptime % 60);
    const uptimeStr = `${h}h ${mnt}m ${s}s`;
    const speed = (performance.now() - start).toFixed(2);
    
    // FIXED RAM CALCULATION - Proper conversion
    const usedMemBytes = process.memoryUsage().rss; // in bytes
    const usedMem = (usedMemBytes / 1024 / 1024).toFixed(1); // Convert to MB
    
    // Get total memory in bytes first
    const totalMemBytes = os.totalmem(); // in bytes
    const totalMemGB = (totalMemBytes / 1024 / 1024 / 1024).toFixed(1); // Convert to GB
    
    // Calculate percentage CORRECTLY
    const memPercent = Math.min(Math.max((usedMemBytes / totalMemBytes) * 100, 0), 100);
    const memPercentDisplay = Math.floor(memPercent); // Round down for display
    
    // FIXED RAM BAR CALCULATION - Based on actual percentage
    const filledBars = Math.max(Math.floor(memPercent / 10), 0);
    const emptyBars = Math.max(10 - filledBars, 0);
    
    // Use different bar styles for better visibility
    const memBar = "█".repeat(filledBars) + "░".repeat(emptyBars);
    
    // Alternative bar style (uncomment if you prefer):
    // const memBar = "🟩".repeat(filledBars) + "⬜".repeat(emptyBars);
    // const memBar = "🟢".repeat(filledBars) + "⚪".repeat(emptyBars);
    
    // Calculate command speed in milliseconds
    const commandSpeed = `${speed}ms`;
    
    const infoLines = [];
    
    if ((fieldsStatus && fieldsStatus.user) || (!fieldsStatus)) infoLines.push(`┃ User: ▣『◆』《 ${m.pushName || "Anonymous"} 》『◆』▣`);
    if ((fieldsStatus && fieldsStatus.owner) || (!fieldsStatus)) infoLines.push(`┃ Owner: ${ownerName}`);
    if ((fieldsStatus && fieldsStatus.mode) || (!fieldsStatus)) infoLines.push(`┃ Mode: ${botMode}`);
    if ((fieldsStatus && fieldsStatus.prefix) || (!fieldsStatus)) infoLines.push(`┃ Prefix: [ ${botPrefix} ]`);
    if ((fieldsStatus && fieldsStatus.version) || (!fieldsStatus)) infoLines.push(`┃ Version: ${botVersion}`);
    if ((fieldsStatus && fieldsStatus.host) || (!fieldsStatus)) {
      infoLines.push(`┃ Panel: ${deploymentPlatform.name}`);
      infoLines.push(`┃ Status: ${deploymentPlatform.status}`);
    }
    if ((fieldsStatus && fieldsStatus.uptime) || (!fieldsStatus)) infoLines.push(`┃ Uptime: ${uptimeStr}`);
    if ((fieldsStatus && fieldsStatus.ram) || (!fieldsStatus)) {
      infoLines.push(`┃ RAM: ${memBar} ${memPercentDisplay}%`);
    }
    if ((fieldsStatus && fieldsStatus.usage) || (!fieldsStatus)) infoLines.push(`┃ Memory: ${usedMem}MB / ${totalMemGB}GB`);

    if (infoLines.length > 0) {
      infoSection = `┌──⌈ \`${currentBotName}\` ⌋\n${infoLines.join('\n')}\n└────────────────\n`;
    }
  } else {
    // If no info fields are enabled, still show basic header
    infoSection = `*No additional information is enabled.*\n*Use .togglemenuinfo to customize*\n\n`;
  }

  const commandsText = `┌────────────────
│ 🏠 GROUP MANAGEMENT 🏠 
├────────────────
│ 🛡️ ADMIN & MODERATION 🛡️ 
├────────────────
│ add                     
│ promote                 
│ demote                  
│ kick                    
│ kickall                 
│ ban                     
│ unban                   
│ banlist                 
│ clearbanlist            
│ warn                    
│ resetwarn               
│ setwarn                 
│ mute                    
│ unmute                  
│ gctime                  
│ antileave               
│ antilink                
│ welcome                 
├────────────────
│ 🚫 AUTO-MODERATION 🚫   
├────────────────
│ antisticker             
│ antiviewonce  
│ antilink  
│ antiimage
│ antivideo
│ antiaudio
│ antimention
│ antistatusmention  
│ antigrouplink
├────────────────
│ 📊 GROUP INFO & TOOLS 📊 
├────────────────
│ groupinfo               
│ tagadmin                
│ tagall                  
│ hidetag                 
│ link                    
│ invite                  
│ revoke                 
│ setdesc                 
│ fangtrace               
│ getgpp 
│ togstatus                 
└────────────────

┌────────────────
│ 🎨 MENU COMMANDS 🎨
├────────────────
│ togglemenuinfo
│ setmenuimage
│ resetmenuinfo
│ menustyle
└────────────────

┌────────────────
│ 👑 OWNER CONTROLS 👑    
├────────────────
│ ⚡ CORE MANAGEMENT ⚡    
├────────────────
│ setbotname              
│ setowner                
│ setprefix               
│ iamowner                
│ about                   
│ block                   
│ unblock                 
│ blockdetect             
│ silent                  
│ anticall                
│ mode                    
│ online                  
│ setpp                   
│ repo                    
│ antidelete              
│ antideletestatus                  
├────────────────
│ 🔄 SYSTEM & MAINTENANCE 🛠️ 
├────────────────
│ restart                 
│ workingreload           
│ reloadenv               
│ getsettings             
│ setsetting              
│ test                    
│ disk                    
│ hostip                  
│ findcommands            
└────────────────

┌────────────────
│ ⚙️ AUTOMATION ⚙️
├────────────────
│ autoread                
│ autotyping              
│ autorecording           
│ autoreact               
│ autoreactstatus         
│ autobio                 
│ autorec                 
└────────────────
┌────────────────
│ ✨ GENERAL UTILITIES ✨
├────────────────
│ 🔍 INFO & SEARCH 🔎
├────────────────
│ alive
│ ping
│ ping2
│ time
│ connection
│ define
│ news
│ covid
│ iplookup
│ getip
│ getpp
│ getgpp
│ prefixinfo
├───────────────
│ 🔗 CONVERSION & MEDIA 📁
├───────────────
│ shorturl
│ qrencode
│ take
│ imgbb
│ tiktok
│ save
│ toimage
│ tosticker
│ toaudio
│ tts
├───────────────
│ 📝 PERSONAL TOOLS 📅
├───────────────
│ pair
│ resetwarn
│ setwarn
└────────────────


├────────────────
│ 🎵 MUSIC  🎶
├────────────────
│ play                    
│ song                    
│ lyrics                  
│ spotify                             
└────────────────
┌────────────────
│ 🤖 MEDIA & AI COMMANDS 🧠 
├────────────────
│ ⬇️ MEDIA DOWNLOADS 📥     
├────────────────
│ youtube                 
│ tiktok                 
│ instagram               
│ facebook                
│ snapchat                
│ apk   
│ yts
│ ytplay
│ ytmp3
│ ytv
│ ytmp4
│ ytplaydoc
│ song
│ play
│ spotify
│ video
│ image                  
├────────────────
│ 🎨 AI GENERATION 💡    
├────────────────
│ gpt                     
│ gemini                  
│ deepseek                
│ deepseek+               
│ analyze                 
│ suno                    
│ wolfbot
│ bard
│ claudeai
│ venice
│ grok
│ wormgpt
│ speechwriter
│ blackbox
│ mistral
│ metai                        
├────────────────
│ 🎨 AI TOOLS💡    
├────────────────
│ videogen   
│ aiscanner
│ humanizer
│ summarize     
└───────────────
┌───────────────
│ 🖼️ IMAGE TOOLS 🖼️
├───────────────
│ image                   
│ imagegenerate           
│ anime                   
│ art                     
│ real                    
└───────────────

┌───────────────
│ 🛡️ SECURITY & HACKING 🔒 
├───────────────
│ 🌐 NETWORK & INFO 📡   
├───────────────
│ ipinfo                  
│ shodan                  
│ iplookup                
│ getip                   
└───────────────

┌────────────────
│ 🎨 LOGO DESIGN STUDIO 🎨
├────────────────
│ 🌟 PREMIUM METALS 🌟    
├────────────────
│ goldlogo                
│ silverlogo              
│ platinumlogo            
│ chromelogo              
│ diamondlogo             
│ bronzelogo              
│ steelogo                
│ copperlogo              
│ titaniumlogo            
├────────────────
│ 🔥 ELEMENTAL EFFECTS 🔥  
├────────────────
│ firelogo                
│ icelogo                 
│ iceglowlogo             
│ lightninglogo           
│ aqualogo                
│ rainbowlogo             
│ sunlogo                 
│ moonlogo                
├────────────────
│ 🎭 MYTHICAL & MAGICAL 🧙  
├────────────────
│ dragonlogo              
│ phoenixlogo             
│ wizardlogo              
│ crystallogo             
│ darkmagiclogo           
├────────────────
│ 🌌 DARK & GOTHIC 🌑     
├────────────────
│ shadowlogo              
│ smokelogo               
│ bloodlogo               
├────────────────
│ 💫 GLOW & NEON EFFECTS 🌈  
├────────────────
│ neonlogo                
│ glowlogo                
├────────────────
│ 🤖 TECH & FUTURISTIC 🚀  
├────────────────
│ matrixlogo              
└────────────────
┌────────────────
│ 🐙 GITHUB COMMANDS 🐙
├────────────────
│ gitclone
│ gitinfo
│ repo
│ commits
│ stars
│ watchers
│ release
└────────────────
┌────────────────
│ 🌸 ANIME COMMANDS 🌸
├────────────────
│ awoo
│ bj
│ bully
│ cringe
│ cry
│ cuddle
│ dance
│ glomp
│ highfive
│ kill
│ kiss
│ lick
│ megumin
│ neko
│ pat
│ shinobu
│ trap
│ trap2
│ waifu
│ wink
│ yeet
└────────────────



🐺POWERED BY WOLFTECH🐺

`;

  // ========== APPLY "READ MORE" EFFECT ==========
  // Combine info section (visible) and commands (hidden) with "Read more"
  finalCaption = createReadMoreEffect(infoSection, commandsText);
  // ========== END "READ MORE" EFFECT ==========

  // Send text-only menu (removed image sending)
  await sock.sendMessage(jid, { 
    text: finalCaption
  }, { 
    quoted: fkontak 
  });
  
  console.log(`✅ ${currentBotName} menu sent as text-only with "Read more" effect`);
  break;
}













case 4: {
  // First, get the bot name BEFORE showing loading message
  const getBotName = () => {
    try {
      const possiblePaths = [
        './bot_settings.json',
        path.join(__dirname, 'bot_settings.json'),
        path.join(__dirname, '../bot_settings.json'),
        path.join(__dirname, '../../bot_settings.json'),
        path.join(__dirname, '../../../bot_settings.json'),
        path.join(__dirname, '../commands/owner/bot_settings.json'),
      ];
      
      for (const settingsPath of possiblePaths) {
        if (fs.existsSync(settingsPath)) {
          try {
            const settingsData = fs.readFileSync(settingsPath, 'utf8');
            const settings = JSON.parse(settingsData);
            
            if (settings.botName && settings.botName.trim() !== '') {
              return settings.botName.trim();
            }
          } catch (parseError) {}
        }
      }
      
      if (global.BOT_NAME) {
        return global.BOT_NAME;
      }
      
      if (process.env.BOT_NAME) {
        return process.env.BOT_NAME;
      }
      
    } catch (error) {}
    
    return 'WOLFBOT';
  };
  
  // Get the current bot name
  const currentBotName = getBotName();
  
  // ========== CREATE FAKE CONTACT FUNCTION ==========
  const createFakeContact = (message) => {
    const jid = message.key.participant?.split('@')[0] || message.key.remoteJid.split('@')[0];
    return {
      key: {
        remoteJid: "status@broadcast",
        fromMe: false,
        id: "WOLF-X"
      },
      message: {
        contactMessage: {
          displayName: "WOLF BOT",
          vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:WOLF BOT\nitem1.TEL;waid=${jid}:${jid}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
        }
      },
      participant: "0@s.whatsapp.net"
    };
  };
  
  // Create fake contact for quoted messages
  const fkontak = createFakeContact(m);
  
  // ========== SIMPLE LOADING MESSAGE ==========
  const loadingMessage = `⚡ ${currentBotName} menu loading...`;
  
  // Send loading message with fake contact
  await sock.sendMessage(jid, { 
    text: loadingMessage 
  }, { 
    quoted: fkontak 
  });
  
  // Add a small delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // ========== REST OF YOUR EXISTING CODE ==========
  // 📝 Full info + commands (with individual toggles)
  let finalText = "";
  
  // ========== ADD FADED TEXT HELPER FUNCTION ==========
  const createFadedEffect = (text) => {
    /**
     * Creates WhatsApp's "faded/spoiler" text effect
     * @param {string} text - Text to apply faded effect to
     * @returns {string} Formatted text with faded effect
     */
    
    // WhatsApp needs a LOT of invisible characters for the fade effect
    // Create a string with 800-1000 invisible characters
    const invisibleChars = [
      '\u200D', // ZERO WIDTH JOINER
      '\u200C', // ZERO WIDTH NON-JOINER
      '\u2060', // WORD JOINER
      '\uFEFF', // ZERO WIDTH NO-BREAK SPACE
      '\u200B', // ZERO WIDTH SPACE
      '\u200E', // LEFT-TO-RIGHT MARK
      '\u200F', // RIGHT-TO-LEFT MARK
      '\u2061', // FUNCTION APPLICATION
      '\u2062', // INVISIBLE TIMES
      '\u2063', // INVISIBLE SEPARATOR
      '\u2064', // INVISIBLE PLUS
    ];
    
    // Create a long string of invisible characters (900 chars)
    let fadeString = '';
    for (let i = 0; i < 900; i++) {
      fadeString += invisibleChars[i % invisibleChars.length];
    }
    
    // Add some line breaks and more invisible chars for better effect
    fadeString += '\n\u200B\u200B\u200B\u200B\u200B\u200B\u200B\u200B\n';
    
    return `${fadeString}${text}`;
  };
  
  // ========== ADD "READ MORE" HELPER FUNCTION ==========
  const createReadMoreEffect = (text1, text2) => {
    /**
     * Creates WhatsApp's "Read more" effect using invisible characters
     * @param {string} text1 - First part (visible before "Read more")
     * @param {string} text2 - Second part (hidden after "Read more")
     * @returns {string} Formatted text with "Read more" effect
     */
    
    // WhatsApp needs MORE invisible characters to trigger "Read more"
    // Use 500+ characters for better reliability
    const invisibleChars = [
      '\u200E',    // LEFT-TO-RIGHT MARK
      '\u200F',    // RIGHT-TO-LEFT MARK
      '\u200B',    // ZERO WIDTH SPACE
      '\u200C',    // ZERO WIDTH NON-JOINER
      '\u200D',    // ZERO WIDTH JOINER
      '\u2060',    // WORD JOINER
      '\uFEFF',    // ZERO WIDTH NO-BREAK SPACE
    ];
    
    // Create a LONG string of invisible characters (500-600 chars)
    // WhatsApp needs enough to break the line detection
    const invisibleString = Array.from({ length: 550 }, 
      (_, i) => invisibleChars[i % invisibleChars.length]
    ).join('');
    
    // Add a newline after invisible characters for cleaner break
    return `${text1}${invisibleString}\n${text2}`;
  };
  // ========== END OF HELPER FUNCTIONS ==========
  
  // Helper functions (same as before)
  const getBotMode = () => {
    try {
      const possiblePaths = [
        './bot_mode.json',
        path.join(__dirname, 'bot_mode.json'),
        path.join(__dirname, '../bot_mode.json'),
        path.join(__dirname, '../../bot_mode.json'),
        path.join(__dirname, '../../../bot_mode.json'),
        path.join(__dirname, '../commands/owner/bot_mode.json'),
      ];
      
      for (const modePath of possiblePaths) {
        if (fs.existsSync(modePath)) {
          try {
            const modeData = JSON.parse(fs.readFileSync(modePath, 'utf8'));
            
            if (modeData.mode) {
              let displayMode;
              switch(modeData.mode.toLowerCase()) {
                case 'public':
                  displayMode = '🌍 Public';
                  break;
                case 'silent':
                  displayMode = '🔇 Silent';
                  break;
                case 'private':
                  displayMode = '🔒 Private';
                  break;
                case 'group-only':
                  displayMode = '👥 Group Only';
                  break;
                case 'maintenance':
                  displayMode = '🛠️ Maintenance';
                  break;
                default:
                  displayMode = `⚙️ ${modeData.mode.charAt(0).toUpperCase() + modeData.mode.slice(1)}`;
              }
              return displayMode;
            }
          } catch (parseError) {}
        }
      }
      
      // Fallback to global variables
      if (global.BOT_MODE) {
        return global.BOT_MODE === 'silent' ? '🔇 Silent' : '🌍 Public';
      }
      if (global.mode) {
        return global.mode === 'silent' ? '🔇 Silent' : '🌍 Public';
      }
      if (process.env.BOT_MODE) {
        return process.env.BOT_MODE === 'silent' ? '🔇 Silent' : '🌍 Public';
      }
      
    } catch (error) {}
    
    return '🌍 Public';
  };
  
  const getOwnerName = () => {
    try {
      const botSettingsPaths = [
        './bot_settings.json',
        path.join(__dirname, 'bot_settings.json'),
        path.join(__dirname, '../bot_settings.json'),
        path.join(__dirname, '../../bot_settings.json'),
      ];
      
      for (const settingsPath of botSettingsPaths) {
        if (fs.existsSync(settingsPath)) {
          try {
            const settingsData = fs.readFileSync(settingsPath, 'utf8');
            const settings = JSON.parse(settingsData);
            
            if (settings.ownerName && settings.ownerName.trim() !== '') {
              return settings.ownerName.trim();
            }
          } catch (parseError) {}
        }
      }
      
      const ownerPath = path.join(__dirname, 'owner.json');
      if (fs.existsSync(ownerPath)) {
        const ownerData = fs.readFileSync(ownerPath, 'utf8');
        const ownerInfo = JSON.parse(ownerData);
        
        if (ownerInfo.owner && ownerInfo.owner.trim() !== '') {
          return ownerInfo.owner.trim();
        } else if (ownerInfo.number && ownerInfo.number.trim() !== '') {
          return ownerInfo.number.trim();
        } else if (ownerInfo.phone && ownerInfo.phone.trim() !== '') {
          return ownerInfo.phone.trim();
        } else if (ownerInfo.contact && ownerInfo.contact.trim() !== '') {
          return ownerInfo.contact.trim();
        } else if (Array.isArray(ownerInfo) && ownerInfo.length > 0) {
          const owner = typeof ownerInfo[0] === 'string' ? ownerInfo[0] : "Unknown";
          return owner;
        }
      }
      
      if (global.OWNER_NAME) {
        return global.OWNER_NAME;
      }
      if (global.owner) {
        return global.owner;
      }
      if (process.env.OWNER_NUMBER) {
        return process.env.OWNER_NUMBER;
      }
      
    } catch (error) {}
    
    return 'Unknown';
  };
  
  const getBotPrefix = () => {
    try {
      const botSettingsPaths = [
        './bot_settings.json',
        path.join(__dirname, 'bot_settings.json'),
        path.join(__dirname, '../bot_settings.json'),
        path.join(__dirname, '../../bot_settings.json'),
      ];
      
      for (const settingsPath of botSettingsPaths) {
        if (fs.existsSync(settingsPath)) {
          try {
            const settingsData = fs.readFileSync(settingsPath, 'utf8');
            const settings = JSON.parse(settingsData);
            
            if (settings.prefix && settings.prefix.trim() !== '') {
              return settings.prefix.trim();
            }
          } catch (parseError) {}
        }
      }
      
      if (global.prefix) {
        return global.prefix;
      }
      
      if (process.env.PREFIX) {
        return process.env.PREFIX;
      }
      
    } catch (error) {}
    
    return '.';
  };
  
  const getBotVersion = () => {
    try {
      const ownerPath = path.join(__dirname, 'owner.json');
      if (fs.existsSync(ownerPath)) {
        const ownerData = fs.readFileSync(ownerPath, 'utf8');
        const ownerInfo = JSON.parse(ownerData);
        
        if (ownerInfo.version && ownerInfo.version.trim() !== '') {
          return ownerInfo.version.trim();
        }
      }
      
      const botSettingsPaths = [
        './bot_settings.json',
        path.join(__dirname, 'bot_settings.json'),
        path.join(__dirname, '../bot_settings.json'),
      ];
      
      for (const settingsPath of botSettingsPaths) {
        if (fs.existsSync(settingsPath)) {
          try {
            const settingsData = fs.readFileSync(settingsPath, 'utf8');
            const settings = JSON.parse(settingsData);
            
            if (settings.version && settings.version.trim() !== '') {
              return settings.version.trim();
            }
          } catch (parseError) {}
        }
      }
      
      if (global.VERSION) {
        return global.VERSION;
      }
      
      if (global.version) {
        return global.version;
      }
      
      if (process.env.VERSION) {
        return process.env.VERSION;
      }
      
    } catch (error) {}
    
    return 'v1.0.0';
  };
  
  const getDeploymentPlatform = () => {
    // Detect deployment platform
    if (process.env.REPL_ID || process.env.REPLIT_DB_URL) {
      return {
        name: 'Replit',
        status: 'Active',
        icon: '🌀'
      };
    } else if (process.env.HEROKU_APP_NAME) {
      return {
        name: 'Heroku',
        status: 'Active',
        icon: '🦸'
      };
    } else if (process.env.RENDER_SERVICE_ID) {
      return {
        name: 'Render',
        status: 'Active',
        icon: '⚡'
      };
    } else if (process.env.RAILWAY_ENVIRONMENT) {
      return {
        name: 'Railway',
        status: 'Active',
        icon: '🚂'
      };
    } else if (process.env.VERCEL) {
      return {
        name: 'Vercel',
        status: 'Active',
        icon: '▲'
      };
    } else if (process.env.GLITCH_PROJECT_REMIX) {
      return {
        name: 'Glitch',
        status: 'Active',
        icon: '🎏'
      };
    } else if (process.env.KOYEB) {
      return {
        name: 'Koyeb',
        status: 'Active',
        icon: '☁️'
      };
    } else if (process.env.CYCLIC_URL) {
      return {
        name: 'Cyclic',
        status: 'Active',
        icon: '🔄'
      };
    } else if (process.env.PANEL) {
      return {
        name: 'PteroPanel',
        status: 'Active',
        icon: '🖥️'
      };
    } else if (process.env.SSH_CONNECTION || process.env.SSH_CLIENT) {
      return {
        name: 'VPS/SSH',
        status: 'Active',
        icon: '🖥️'
      };
    } else if (process.platform === 'win32') {
      return {
        name: 'Windows PC',
        status: 'Active',
        icon: '💻'
      };
    } else if (process.platform === 'linux') {
      return {
        name: 'Linux VPS',
        status: 'Active',
        icon: '🐧'
      };
    } else if (process.platform === 'darwin') {
      return {
        name: 'MacOS',
        status: 'Active',
        icon: '🍎'
      };
    } else {
      return {
        name: 'Local Machine',
        status: 'Active',
        icon: '🏠'
      };
    }
  };
  
  // Get current time and date
  const now = new Date();
  const currentTime = now.toLocaleTimeString('en-US', { 
    hour12: true, 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  });
  
  const currentDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Load bot information using helper functions (botName already loaded above)
  const ownerName = getOwnerName();
  const botPrefix = getBotPrefix();
  const botVersion = getBotVersion();
  const botMode = getBotMode();
  const deploymentPlatform = getDeploymentPlatform();
  
  // ========== ADDED HELPER FUNCTIONS FOR SYSTEM METRICS ==========
  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  };
  
  const getRAMUsage = () => {
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    const total = os.totalmem() / 1024 / 1024 / 1024;
    const percent = (used / (total * 1024)) * 100;
    return Math.round(percent);
  };
  
  // ========== SIMPLIFIED MENU WITH FADED EFFECT ==========
  let infoSection = `╭─⊷ *${currentBotName} MENU*
│
│
│  ├─⊷ *User:* ${m.pushName || "Anonymous"}
│  ├─⊷ *Date:* ${currentDate}
│  ├─⊷ *Time:* ${currentTime}
│  ├─⊷ *Owner:* ${ownerName}
│  ├─⊷ *Mode:* ${botMode}
│  ├─⊷ *Prefix:* [ ${botPrefix} ]
│  ├─⊷ *Version:* ${botVersion}
│  ├─⊷ *Platform:* ${deploymentPlatform.name}
│  └─⊷ *Status:* ${deploymentPlatform.status}
│
├─⊷ *📈 SYSTEM STATUS*
│  ├─⊷ *Uptime:* ${formatUptime(process.uptime())}
│  ├─⊷ *RAM Usage:* ${getRAMUsage()}%
│  └─⊷ *Speed:* ${(performance.now() - performance.now()).toFixed(2)}ms
│
╰─⊷ *Type .help <command> for details*\n\n`;

  // Apply faded effect to the info section with MORE invisible chars
  const fadedInfoSection = createFadedEffect(infoSection);

  // ========== MENU LIST WITH BOX STYLE AND DOTS ==========
  const commandsText = `╭─⊷ *🏠 GROUP MANAGEMENT*
│
├─⊷ *🛡️ ADMIN & MODERATION*
│  • add
│  • promote
│  • demote
│  • kick
│  • kickall
│  • ban
│  • unban
│  • banlist
│  • clearbanlist
│  • warn
│  • resetwarn
│  • setwarn
│  • mute
│  • unmute
│  • gctime
│  • antileave
│  • antilink
│  • welcome
│
├─⊷ *🚫 AUTO-MODERATION*
│  • antisticker
│  • antiviewonce
│  • antilink
│  • antiimage
│  • antivideo
│  • antiaudio
│  • antimention
│  • antistatusmention
│  • antigrouplink
│
├─⊷ *📊 GROUP INFO & TOOLS*
│  • groupinfo
│  • tagadmin
│  • tagall
│  • hidetag
│  • link
│  • invite
│  • revoke
│  • setdesc
│  • fangtrace
│  • getgpp
│
╰─⊷

╭─⊷ *🎨 MENU COMMANDS*
│
│  • togglemenuinfo
│  • setmenuimage
│  • resetmenuinfo
│  • menustyle
│
╰─⊷

╭─⊷ *👑 OWNER CONTROLS*
│
├─⊷ *⚡ CORE MANAGEMENT*
│  • setbotname
│  • setowner
│  • setprefix
│  • iamowner
│  • about
│  • block
│  • unblock
│  • blockdetect
│  • silent
│  • anticall
│  • mode
│  • online
│  • setpp
│  • repo
│
├─⊷ *🔄 SYSTEM & MAINTENANCE*
│  • restart
│  • workingreload
│  • reloadenv
│  • getsettings
│  • setsetting
│  • test
│  • disk
│  • hostip
│  • findcommands
│
╰─⊷

╭─⊷ *⚙️ AUTOMATION*
│
│  • autoread
│  • autotyping
│  • autorecording
│  • autoreact
│  • autoreactstatus
│  • autobio
│  • autorec
│
╰─⊷

╭─⊷ *✨ GENERAL UTILITIES*
│
├─⊷ *🔍 INFO & SEARCH*
│  • alive
│  • ping
│  • ping2
│  • time
│  • connection
│  • define
│  • news
│  • covid
│  • iplookup
│  • getip
│  • getpp
│  • getgpp
│  • prefixinfo
│
├─⊷ *🔗 CONVERSION & MEDIA*
│  • shorturl
│  • qrencode
│  • take
│  • imgbb
│  • tiktok
│  • save
│
├─⊷ *📝 PERSONAL TOOLS*
│  • pair
│  • resetwarn
│  • setwarn
│
╰─⊷

╭─⊷ *🎵 MUSIC & MEDIA*
│
│  • play
│  • song
│  • lyrics
│  • spotify
│  • video
│  • video2
│  • bassboost
│  • trebleboost
│
╰─⊷

╭─⊷ *🤖 MEDIA & AI COMMANDS*
│
├─⊷ *⬇️ MEDIA DOWNLOADS*
│  • youtube
│  • tiktok
│  • instagram
│  • facebook
│  • snapchat
│  • apk
│
├─⊷ *🎨 AI GENERATION*
│  • gpt
│  • gemini
│  • deepseek
│  • deepseek+
│  • analyze
│  • suno
│  • wolfbot
│  • videogen
│
╰─⊷

╭─⊷ *🖼️ IMAGE TOOLS*
│
│  • image
│  • imagegenerate
│  • anime
│  • art
│  • real
│
╰─⊷

╭─⊷ *🛡️ SECURITY & HACKING*
│
├─⊷ *🌐 NETWORK & INFO*
│  • ipinfo
│  • shodan
│  • iplookup
│  • getip
│
╰─⊷

╭─⊷ *🎨 LOGO DESIGN STUDIO*
│
├─⊷ *🌟 PREMIUM METALS*
│  • goldlogo
│  • silverlogo
│  • platinumlogo
│  • chromelogo
│  • diamondlogo
│  • bronzelogo
│  • steelogo
│  • copperlogo
│  • titaniumlogo
│
├─⊷ *🔥 ELEMENTAL EFFECTS*
│  • firelogo
│  • icelogo
│  • iceglowlogo
│  • lightninglogo
│  • aqualogo
│  • rainbowlogo
│  • sunlogo
│  • moonlogo
│
├─⊷ *🎭 MYTHICAL & MAGICAL*
│  • dragonlogo
│  • phoenixlogo
│  • wizardlogo
│  • crystallogo
│  • darkmagiclogo
│
├─⊷ *🌌 DARK & GOTHIC*
│  • shadowlogo
│  • smokelogo
│  • bloodlogo
│
├─⊷ *💫 GLOW & NEON EFFECTS*
│  • neonlogo
│  • glowlogo
│
├─⊷ *🤖 TECH & FUTURISTIC*
│  • matrixlogo
│
╰─⊷

╭─⊷ *🐙 GITHUB COMMANDS*
│
│  • gitclone
│  • gitinfo
│  • repo
│  • commits
│  • stars
│  • watchers
│  • release
│
╰─⊷

╭─⊷ *🌸 ANIME COMMANDS*
│
│  • awoo
│  • bj
│  • bully
│  • cringe
│  • cry
│  • dance
│  • glomp
│  • highfive
│  • kill
│  • kiss
│  • lick
│  • megumin
│  • neko
│  • pat
│  • shinobu
│  • trap
│  • trap2
│  • waifu
│  • wink
│  • yeet
│
╰─⊷

🐺 *POWERED BY WOLF TECH* 🐺`;

  // ========== APPLY "READ MORE" EFFECT ==========
  // Combine faded info section (visible) and commands (hidden) with "Read more"
  finalText = createReadMoreEffect(fadedInfoSection, commandsText);
  // ========== END "READ MORE" EFFECT ==========

  // Send the menu with fake contact
  await sock.sendMessage(jid, { 
    text: finalText 
  }, { 
    quoted: fkontak 
  });
  
  console.log(`✅ ${currentBotName} menu sent with faded effect and dot style`);
  break;
}




















// case 5: {
//   // First, get the bot name BEFORE showing loading message
//   const getBotName = () => {
//     try {
//       const possiblePaths = [
//         './bot_settings.json',
//         path.join(__dirname, 'bot_settings.json'),
//         path.join(__dirname, '../bot_settings.json'),
//         path.join(__dirname, '../../bot_settings.json'),
//         path.join(__dirname, '../../../bot_settings.json'),
//         path.join(__dirname, '../commands/owner/bot_settings.json'),
//       ];
      
//       for (const settingsPath of possiblePaths) {
//         if (fs.existsSync(settingsPath)) {
//           try {
//             const settingsData = fs.readFileSync(settingsPath, 'utf8');
//             const settings = JSON.parse(settingsData);
            
//             if (settings.botName && settings.botName.trim() !== '') {
//               return settings.botName.trim();
//             }
//           } catch (parseError) {}
//         }
//       }
      
//       if (global.BOT_NAME) {
//         return global.BOT_NAME;
//       }
      
//       if (process.env.BOT_NAME) {
//         return process.env.BOT_NAME;
//       }
      
//     } catch (error) {}
    
//     return 'WOLFBOT';
//   };
  
//   // Get the current bot name
//   const currentBotName = getBotName();
  
//   // ========== CREATE FAKE CONTACT FUNCTION ==========
//   const createFakeContact = (message) => {
//     const jid = message.key.participant?.split('@')[0] || message.key.remoteJid.split('@')[0];
//     return {
//       key: {
//         remoteJid: "status@broadcast",
//         fromMe: false,
//         id: "WOLF-X"
//       },
//       message: {
//         contactMessage: {
//           displayName: "WOLF BOT",
//           vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:WOLF BOT\nitem1.TEL;waid=${jid}:${jid}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
//         }
//       },
//       participant: "0@s.whatsapp.net"
//     };
//   };
  
//   // Create fake contact for quoted messages
//   const fkontak = createFakeContact(m);
  
//   // ========== SIMPLE LOADING MESSAGE ==========
//   const loadingMessage = `⚡ ${currentBotName} menu loading...`;
  
//   // Send loading message with fake contact
//   await sock.sendMessage(jid, { 
//     text: loadingMessage 
//   }, { 
//     quoted: fkontak 
//   });
  
//   // Add a small delay
//   await new Promise(resolve => setTimeout(resolve, 800));
  
//   // ========== REST OF YOUR EXISTING CODE ==========
//   // 📝 Full info + commands (with individual toggles)
//   let finalText = "";
  
//   // ========== ADD FADED TEXT HELPER FUNCTION ==========
//   const createFadedEffect = (text) => {
//     /**
//      * Creates WhatsApp's "faded/spoiler" text effect
//      * @param {string} text - Text to apply faded effect to
//      * @returns {string} Formatted text with faded effect
//      */
    
//     const fadeChars = [
//       '\u200D', // ZERO WIDTH JOINER
//       '\u200C', // ZERO WIDTH NON-JOINER
//       '\u2060', // WORD JOINER
//       '\uFEFF', // ZERO WIDTH NO-BREAK SPACE
//     ];
    
//     // Create initial fade (80-100 characters for good effect)
//     const initialFade = Array.from({ length: 90 }, 
//       (_, i) => fadeChars[i % fadeChars.length]
//     ).join('');
    
//     return `${initialFade}${text}`;
//   };
  
//   // ========== ADD "READ MORE" HELPER FUNCTION ==========
//   const createReadMoreEffect = (text1, text2) => {
//     /**
//      * Creates WhatsApp's "Read more" effect using invisible characters
//      * @param {string} text1 - First part (visible before "Read more")
//      * @param {string} text2 - Second part (hidden after "Read more")
//      * @returns {string} Formatted text with "Read more" effect
//      */
    
//     // WhatsApp needs MORE invisible characters to trigger "Read more"
//     // Use 500+ characters for better reliability
//     const invisibleChars = [
//       '\u200E',    // LEFT-TO-RIGHT MARK
//       '\u200F',    // RIGHT-TO-LEFT MARK
//       '\u200B',    // ZERO WIDTH SPACE
//       '\u200C',    // ZERO WIDTH NON-JOINER
//       '\u200D',    // ZERO WIDTH JOINER
//       '\u2060',    // WORD JOINER
//       '\uFEFF',    // ZERO WIDTH NO-BREAK SPACE
//     ];
    
//     // Create a LONG string of invisible characters (500-600 chars)
//     // WhatsApp needs enough to break the line detection
//     const invisibleString = Array.from({ length: 550 }, 
//       (_, i) => invisibleChars[i % invisibleChars.length]
//     ).join('');
    
//     // Add a newline after invisible characters for cleaner break
//     return `${text1}${invisibleString}\n${text2}`;
//   };
//   // ========== END OF HELPER FUNCTION ==========
  
//   // Helper functions (same as before)
//   const getBotMode = () => {
//     try {
//       const possiblePaths = [
//         './bot_mode.json',
//         path.join(__dirname, 'bot_mode.json'),
//         path.join(__dirname, '../bot_mode.json'),
//         path.join(__dirname, '../../bot_mode.json'),
//         path.join(__dirname, '../../../bot_mode.json'),
//         path.join(__dirname, '../commands/owner/bot_mode.json'),
//       ];
      
//       for (const modePath of possiblePaths) {
//         if (fs.existsSync(modePath)) {
//           try {
//             const modeData = JSON.parse(fs.readFileSync(modePath, 'utf8'));
            
//             if (modeData.mode) {
//               let displayMode;
//               switch(modeData.mode.toLowerCase()) {
//                 case 'public':
//                   displayMode = '🌍 Public';
//                   break;
//                 case 'silent':
//                   displayMode = '🔇 Silent';
//                   break;
//                 case 'private':
//                   displayMode = '🔒 Private';
//                   break;
//                 case 'group-only':
//                   displayMode = '👥 Group Only';
//                   break;
//                 case 'maintenance':
//                   displayMode = '🛠️ Maintenance';
//                   break;
//                 default:
//                   displayMode = `⚙️ ${modeData.mode.charAt(0).toUpperCase() + modeData.mode.slice(1)}`;
//               }
//               return displayMode;
//             }
//           } catch (parseError) {}
//         }
//       }
      
//       // Fallback to global variables
//       if (global.BOT_MODE) {
//         return global.BOT_MODE === 'silent' ? '🔇 Silent' : '🌍 Public';
//       }
//       if (global.mode) {
//         return global.mode === 'silent' ? '🔇 Silent' : '🌍 Public';
//       }
//       if (process.env.BOT_MODE) {
//         return process.env.BOT_MODE === 'silent' ? '🔇 Silent' : '🌍 Public';
//       }
      
//     } catch (error) {}
    
//     return '🌍 Public';
//   };
  
//   const getOwnerName = () => {
//     try {
//       const botSettingsPaths = [
//         './bot_settings.json',
//         path.join(__dirname, 'bot_settings.json'),
//         path.join(__dirname, '../bot_settings.json'),
//         path.join(__dirname, '../../bot_settings.json'),
//       ];
      
//       for (const settingsPath of botSettingsPaths) {
//         if (fs.existsSync(settingsPath)) {
//           try {
//             const settingsData = fs.readFileSync(settingsPath, 'utf8');
//             const settings = JSON.parse(settingsData);
            
//             if (settings.ownerName && settings.ownerName.trim() !== '') {
//               return settings.ownerName.trim();
//             }
//           } catch (parseError) {}
//         }
//       }
      
//       const ownerPath = path.join(__dirname, 'owner.json');
//       if (fs.existsSync(ownerPath)) {
//         const ownerData = fs.readFileSync(ownerPath, 'utf8');
//         const ownerInfo = JSON.parse(ownerData);
        
//         if (ownerInfo.owner && ownerInfo.owner.trim() !== '') {
//           return ownerInfo.owner.trim();
//         } else if (ownerInfo.number && ownerInfo.number.trim() !== '') {
//           return ownerInfo.number.trim();
//         } else if (ownerInfo.phone && ownerInfo.phone.trim() !== '') {
//           return ownerInfo.phone.trim();
//         } else if (ownerInfo.contact && ownerInfo.contact.trim() !== '') {
//           return ownerInfo.contact.trim();
//         } else if (Array.isArray(ownerInfo) && ownerInfo.length > 0) {
//           const owner = typeof ownerInfo[0] === 'string' ? ownerInfo[0] : "Unknown";
//           return owner;
//         }
//       }
      
//       if (global.OWNER_NAME) {
//         return global.OWNER_NAME;
//       }
//       if (global.owner) {
//         return global.owner;
//       }
//       if (process.env.OWNER_NUMBER) {
//         return process.env.OWNER_NUMBER;
//       }
      
//     } catch (error) {}
    
//     return 'Unknown';
//   };
  
//   const getBotPrefix = () => {
//     try {
//       const botSettingsPaths = [
//         './bot_settings.json',
//         path.join(__dirname, 'bot_settings.json'),
//         path.join(__dirname, '../bot_settings.json'),
//         path.join(__dirname, '../../bot_settings.json'),
//       ];
      
//       for (const settingsPath of botSettingsPaths) {
//         if (fs.existsSync(settingsPath)) {
//           try {
//             const settingsData = fs.readFileSync(settingsPath, 'utf8');
//             const settings = JSON.parse(settingsData);
            
//             if (settings.prefix && settings.prefix.trim() !== '') {
//               return settings.prefix.trim();
//             }
//           } catch (parseError) {}
//         }
//       }
      
//       if (global.prefix) {
//         return global.prefix;
//       }
      
//       if (process.env.PREFIX) {
//         return process.env.PREFIX;
//       }
      
//     } catch (error) {}
    
//     return '.';
//   };
  
//   const getBotVersion = () => {
//     try {
//       const ownerPath = path.join(__dirname, 'owner.json');
//       if (fs.existsSync(ownerPath)) {
//         const ownerData = fs.readFileSync(ownerPath, 'utf8');
//         const ownerInfo = JSON.parse(ownerData);
        
//         if (ownerInfo.version && ownerInfo.version.trim() !== '') {
//           return ownerInfo.version.trim();
//         }
//       }
      
//       const botSettingsPaths = [
//         './bot_settings.json',
//         path.join(__dirname, 'bot_settings.json'),
//         path.join(__dirname, '../bot_settings.json'),
//       ];
      
//       for (const settingsPath of botSettingsPaths) {
//         if (fs.existsSync(settingsPath)) {
//           try {
//             const settingsData = fs.readFileSync(settingsPath, 'utf8');
//             const settings = JSON.parse(settingsData);
            
//             if (settings.version && settings.version.trim() !== '') {
//               return settings.version.trim();
//             }
//           } catch (parseError) {}
//         }
//       }
      
//       if (global.VERSION) {
//         return global.VERSION;
//       }
      
//       if (global.version) {
//         return global.version;
//       }
      
//       if (process.env.VERSION) {
//         return process.env.VERSION;
//       }
      
//     } catch (error) {}
    
//     return 'v1.0.0';
//   };
  
//   // ========== IMPROVED DEPLOYMENT PLATFORM DETECTION ==========
//   const getDeploymentPlatform = () => {
//     // Check Heroku FIRST (most specific env variables)
//     if (process.env.HEROKU_APP_NAME || 
//         process.env.DYNO || 
//         process.env.HEROKU_API_KEY ||
//         (process.env.PORT && process.env.PORT !== '3000' && process.env.PORT !== '8080')) {
//       return {
//         name: 'Heroku',
//         status: 'Active',
//         icon: '🦸'
//       };
//     }
//     // Check Render
//     else if (process.env.RENDER_SERVICE_ID || 
//              process.env.RENDER_SERVICE_NAME ||
//              process.env.RENDER) {
//       return {
//         name: 'Render',
//         status: 'Active',
//         icon: '⚡'
//       };
//     }
//     // Check Railway
//     else if (process.env.RAILWAY_ENVIRONMENT ||
//              process.env.RAILWAY_PROJECT_NAME ||
//              process.env.RAILWAY_SERVICE_NAME) {
//       return {
//         name: 'Railway',
//         status: 'Active',
//         icon: '🚂'
//       };
//     }
//     // Check Replit
//     else if (process.env.REPL_ID || 
//              process.env.REPLIT_DB_URL ||
//              process.env.REPLIT_USER ||
//              process.env.REPL_SLUG) {
//       return {
//         name: 'Replit',
//         status: 'Active',
//         icon: '🌀'
//       };
//     }
//     // Check Vercel
//     else if (process.env.VERCEL || 
//              process.env.VERCEL_ENV ||
//              process.env.VERCEL_URL) {
//       return {
//         name: 'Vercel',
//         status: 'Active',
//         icon: '▲'
//       };
//     }
//     // Check Glitch
//     else if (process.env.GLITCH_PROJECT_REMIX ||
//              process.env.PROJECT_REMIX_CHAIN ||
//              process.env.GLITCH) {
//       return {
//         name: 'Glitch',
//         status: 'Active',
//         icon: '🎏'
//       };
//     }
//     // Check Koyeb
//     else if (process.env.KOYEB_APP ||
//              process.env.KOYEB_REGION ||
//              process.env.KOYEB_SERVICE) {
//       return {
//         name: 'Koyeb',
//         status: 'Active',
//         icon: '☁️'
//       };
//     }
//     // Check Cyclic
//     else if (process.env.CYCLIC_URL ||
//              process.env.CYCLIC_APP_ID ||
//              process.env.CYCLIC_DB) {
//       return {
//         name: 'Cyclic',
//         status: 'Active',
//         icon: '🔄'
//       };
//     }
//     // Check Panel/Pterodactyl
//     else if (process.env.PANEL ||
//              process.env.PTERODACTYL ||
//              process.env.NODE_ENV === 'production' && 
//              (process.platform === 'linux' && !process.env.SSH_CONNECTION)) {
//       return {
//         name: 'Panel/VPS',
//         status: 'Active',
//         icon: '🖥️'
//       };
//     }
//     // Check SSH/VPS
//     else if (process.env.SSH_CONNECTION || 
//              process.env.SSH_CLIENT ||
//              (process.platform === 'linux' && process.env.USER === 'root')) {
//       return {
//         name: 'VPS/SSH',
//         status: 'Active',
//         icon: '🖥️'
//       };
//     }
//     // Check OS
//     else if (process.platform === 'win32') {
//       return {
//         name: 'Windows PC',
//         status: 'Active',
//         icon: '💻'
//       };
//     } else if (process.platform === 'darwin') {
//       return {
//         name: 'MacOS',
//         status: 'Active',
//         icon: '🍎'
//       };
//     } else if (process.platform === 'linux') {
//       return {
//         name: 'Linux Local',
//         status: 'Active',
//         icon: '🐧'
//       };
//     } else {
//       return {
//         name: 'Local Machine',
//         status: 'Active',
//         icon: '🏠'
//       };
//     }
//   };
  
//   // Get current time and date
//   const now = new Date();
//   const currentTime = now.toLocaleTimeString('en-US', { 
//     hour12: true, 
//     hour: '2-digit', 
//     minute: '2-digit',
//     second: '2-digit'
//   });
  
//   const currentDate = now.toLocaleDateString('en-US', {
//     weekday: 'long',
//     year: 'numeric',
//     month: 'long',
//     day: 'numeric'
//   });
  
//   // Load bot information using helper functions (botName already loaded above)
//   const ownerName = getOwnerName();
//   const botPrefix = getBotPrefix();
//   const botVersion = getBotVersion();
//   const botMode = getBotMode();
//   const deploymentPlatform = getDeploymentPlatform();
  
//   // ========== IMPROVED REAL-TIME SYSTEM METRICS ==========
//   const formatUptime = (seconds) => {
//     const hours = Math.floor(seconds / 3600);
//     const minutes = Math.floor((seconds % 3600) / 60);
//     const secs = Math.floor(seconds % 60);
    
//     if (hours > 0) {
//       return `${hours}h ${minutes}m ${secs}s`;
//     } else if (minutes > 0) {
//       return `${minutes}m ${secs}s`;
//     } else {
//       return `${secs}s`;
//     }
//   };
  
//   // REAL RAM USAGE CALCULATION
//   const getRAMUsage = () => {
//     try {
//       const mem = process.memoryUsage();
//       const used = mem.heapUsed / 1024 / 1024; // MB
//       const total = mem.heapTotal / 1024 / 1024; // MB
      
//       // For system total RAM (if available)
//       let systemTotal = os.totalmem() / 1024 / 1024; // MB
//       let systemFree = os.freemem() / 1024 / 1024; // MB
//       let systemUsed = systemTotal - systemFree;
//       let systemPercent = (systemUsed / systemTotal) * 100;
      
//       // Process RAM percentage
//       let processPercent = (used / total) * 100;
      
//       // Return both process and system info
//       return {
//         process: {
//           used: Math.round(used * 100) / 100,
//           total: Math.round(total * 100) / 100,
//           percent: Math.round(processPercent)
//         },
//         system: {
//           used: Math.round(systemUsed * 100) / 100,
//           total: Math.round(systemTotal * 100) / 100,
//           free: Math.round(systemFree * 100) / 100,
//           percent: Math.round(systemPercent)
//         }
//       };
//     } catch (error) {
//       return {
//         process: { used: 0, total: 0, percent: 0 },
//         system: { used: 0, total: 0, free: 0, percent: 0 }
//       };
//     }
//   };
  
//   // Get real RAM usage
//   const ramUsage = getRAMUsage();
  
//   // Calculate speed/ping
//   const startTime = Date.now();
//   // Simulate a small calculation to measure speed
//   let dummyCalc = 0;
//   for (let i = 0; i < 1000000; i++) {
//     dummyCalc += Math.random();
//   }
//   const endTime = Date.now();
//   const responseTime = endTime - startTime;
  
//   // ========== UPDATED MENU WITH CURVED FORMAT ==========
//   let infoSection = `╭─⊷ *${currentBotName} MENU*
// │
// │  ╭─⊷ *User:* ${m.pushName || "Anonymous"}
// │  ├─⊷ *Date:* ${currentDate}
// │  ├─⊷ *Time:* ${currentTime}
// │  ├─⊷ *Owner:* ${ownerName}
// │  ├─⊷ *Mode:* ${botMode}
// │  ├─⊷ *Prefix:* [ ${botPrefix} ]
// │  ├─⊷ *Version:* ${botVersion}
// │  ├─⊷ *Platform:* ${deploymentPlatform.name}
// │  ├─⊷ *Status:* ${deploymentPlatform.status}
// │  ├─⊷ *Uptime:* ${formatUptime(process.uptime())}
// │  ├─⊷ *RAM Usage:* ${ramUsage.process.percent}% (${ramUsage.process.used}MB/${ramUsage.process.total}MB)
// │  ╰─⊷ *Speed:* ${responseTime}ms
// │
// ╰─⊷`;

//   // Apply faded effect to the info section
//   const fadedInfoSection = createFadedEffect(infoSection);

//   // ========== MENU LIST WITH BOX STYLE ==========
//   const commandsText = `╭─⊷ *🏠 GROUP MANAGEMENT*
// │
// ├─⊷ *🛡️ ADMIN & MODERATION*
// │  • add
// │  • promote
// │  • demote
// │  • kick
// │  • kickall
// │  • ban
// │  • unban
// │  • banlist
// │  • clearbanlist
// │  • warn
// │  • resetwarn
// │  • setwarn
// │  • mute
// │  • unmute
// │  • gctime
// │  • antileave
// │  • antilink
// │  • welcome
// │
// ├─⊷ *🚫 AUTO-MODERATION*
// │  • antisticker
// │  • antiviewonce
// │  • antilink
// │  • antiimage
// │  • antivideo
// │  • antiaudio
// │  • antimention
// │  • antistatusmention
// │  • antigrouplink
// │
// ├─⊷ *📊 GROUP INFO & TOOLS*
// │  • groupinfo
// │  • tagadmin
// │  • tagall
// │  • hidetag
// │  • link
// │  • invite
// │  • revoke
// │  • setdesc
// │  • fangtrace
// │  • getgpp
// │
// ╰─⊷

// ╭─⊷ *🎨 MENU COMMANDS*
// │
// │  • togglemenuinfo
// │  • setmenuimage
// │  • resetmenuinfo
// │  • menustyle
// │
// ╰─⊷

// ╭─⊷ *👑 OWNER CONTROLS*
// │
// ├─⊷ *⚡ CORE MANAGEMENT*
// │  • setbotname
// │  • setowner
// │  • setprefix
// │  • iamowner
// │  • about
// │  • block
// │  • unblock
// │  • blockdetect
// │  • silent
// │  • anticall
// │  • mode
// │  • online
// │  • setpp
// │  • repo
// │
// ├─⊷ *🔄 SYSTEM & MAINTENANCE*
// │  • restart
// │  • workingreload
// │  • reloadenv
// │  • getsettings
// │  • setsetting
// │  • test
// │  • disk
// │  • hostip
// │  • findcommands
// │
// ╰─⊷

// ╭─⊷ *⚙️ AUTOMATION*
// │
// │  • autoread
// │  • autotyping
// │  • autorecording
// │  • autoreact
// │  • autoreactstatus
// │  • autobio
// │  • autorec
// │
// ╰─⊷

// ╭─⊷ *✨ GENERAL UTILITIES*
// │
// ├─⊷ *🔍 INFO & SEARCH*
// │  • alive
// │  • ping
// │  • ping2
// │  • time
// │  • connection
// │  • define
// │  • news
// │  • covid
// │  • iplookup
// │  • getip
// │  • getpp
// │  • getgpp
// │  • prefixinfo
// │
// ├─⊷ *🔗 CONVERSION & MEDIA*
// │  • shorturl
// │  • qrencode
// │  • take
// │  • imgbb
// │  • tiktok
// │  • save
// │
// ├─⊷ *📝 PERSONAL TOOLS*
// │  • pair
// │  • resetwarn
// │  • setwarn
// │
// ╰─⊷

// ╭─⊷ *🎵 MUSIC & MEDIA*
// │
// │  • play
// │  • song
// │  • lyrics
// │  • spotify
// │  • video
// │  • video2
// │  • bassboost
// │  • trebleboost
// │
// ╰─⊷

// ╭─⊷ *🤖 MEDIA & AI COMMANDS*
// │
// ├─⊷ *⬇️ MEDIA DOWNLOADS*
// │  • youtube
// │  • tiktok
// │  • instagram
// │  • facebook
// │  • snapchat
// │  • apk
// │
// ├─⊷ *🎨 AI GENERATION*
// │  • gpt
// │  • gemini
// │  • deepseek
// │  • deepseek+
// │  • analyze
// │  • suno
// │  • wolfbot
// │  • videogen
// │
// ╰─⊷

// ╭─⊷ *🖼️ IMAGE TOOLS*
// │
// │  • image
// │  • imagegenerate
// │  • anime
// │  • art
// │  • real
// │
// ╰─⊷

// ╭─⊷ *🛡️ SECURITY & HACKING*
// │
// ├─⊷ *🌐 NETWORK & INFO*
// │  • ipinfo
// │  • shodan
// │  • iplookup
// │  • getip
// │
// ╰─⊷

// ╭─⊷ *🎨 LOGO DESIGN STUDIO*
// │
// ├─⊷ *🌟 PREMIUM METALS*
// │  • goldlogo
// │  • silverlogo
// │  • platinumlogo
// │  • chromelogo
// │  • diamondlogo
// │  • bronzelogo
// │  • steelogo
// │  • copperlogo
// │  • titaniumlogo
// │
// ├─⊷ *🔥 ELEMENTAL EFFECTS*
// │  • firelogo
// │  • icelogo
// │  • iceglowlogo
// │  • lightninglogo
// │  • aqualogo
// │  • rainbowlogo
// │  • sunlogo
// │  • moonlogo
// │
// ├─⊷ *🎭 MYTHICAL & MAGICAL*
// │  • dragonlogo
// │  • phoenixlogo
// │  • wizardlogo
// │  • crystallogo
// │  • darkmagiclogo
// │
// ├─⊷ *🌌 DARK & GOTHIC*
// │  • shadowlogo
// │  • smokelogo
// │  • bloodlogo
// │
// ├─⊷ *💫 GLOW & NEON EFFECTS*
// │  • neonlogo
// │  • glowlogo
// │
// ├─⊷ *🤖 TECH & FUTURISTIC*
// │  • matrixlogo
// │
// ╰─⊷

// ╭─⊷ *🐙 GITHUB COMMANDS*
// │
// │  • gitclone
// │  • gitinfo
// │  • repo
// │  • commits
// │  • stars
// │  • watchers
// │  • release
// │
// ╰─⊷

// ╭─⊷ *🌸 ANIME COMMANDS*
// │
// │  • awoo
// │  • bj
// │  • bully
// │  • cringe
// │  • cry
// │  • dance
// │  • glomp
// │  • highfive
// │  • kill
// │  • kiss
// │  • lick
// │  • megumin
// │  • neko
// │  • pat
// │  • shinobu
// │  • trap
// │  • trap2
// │  • waifu
// │  • wink
// │  • yeet
// │
// ╰─⊷

// 🐺 *POWERED BY WOLF TECH* 🐺`;

//   // ========== APPLY "READ MORE" EFFECT ==========
//   // Combine faded info section (visible) and commands (hidden) with "Read more"
//   finalText = createReadMoreEffect(fadedInfoSection, commandsText);
//   // ========== END "READ MORE" EFFECT ==========

//   // Send the menu with fake contact
//   await sock.sendMessage(jid, { 
//     text: finalText 
//   }, { 
//     quoted: fkontak 
//   });
  
//   console.log(`✅ ${currentBotName} menu sent with faded effect and box style`);
//   break;
// }











case 5: {
  // First, get the bot name BEFORE showing loading message
  const getBotName = () => {
    try {
      const possiblePaths = [
        './bot_settings.json',
        path.join(__dirname, 'bot_settings.json'),
        path.join(__dirname, '../bot_settings.json'),
        path.join(__dirname, '../../bot_settings.json'),
        path.join(__dirname, '../../../bot_settings.json'),
        path.join(__dirname, '../commands/owner/bot_settings.json'),
      ];
      
      for (const settingsPath of possiblePaths) {
        if (fs.existsSync(settingsPath)) {
          try {
            const settingsData = fs.readFileSync(settingsPath, 'utf8');
            const settings = JSON.parse(settingsData);
            
            if (settings.botName && settings.botName.trim() !== '') {
              return settings.botName.trim();
            }
          } catch (parseError) {}
        }
      }
      
      if (global.BOT_NAME) {
        return global.BOT_NAME;
      }
      
      if (process.env.BOT_NAME) {
        return process.env.BOT_NAME;
      }
      
    } catch (error) {}
    
    return 'WOLFBOT';
  };
  
  // Get the current bot name
  const currentBotName = getBotName();
  
  // ========== CREATE FAKE CONTACT FUNCTION ==========
  const createFakeContact = (message) => {
    const jid = message.key.participant?.split('@')[0] || message.key.remoteJid.split('@')[0];
    return {
      key: {
        remoteJid: "status@broadcast",
        fromMe: false,
        id: "WOLF-X"
      },
      message: {
        contactMessage: {
          displayName: "WOLF BOT",
          vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:WOLF BOT\nitem1.TEL;waid=${jid}:${jid}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
        }
      },
      participant: "0@s.whatsapp.net"
    };
  };
  
  // Create fake contact for quoted messages
  const fkontak = createFakeContact(m);
  
  // ========== SIMPLE LOADING MESSAGE ==========
  const loadingMessage = `⚡ ${currentBotName} menu loading...`;
  
  // Send loading message with fake contact
  await sock.sendMessage(jid, { 
    text: loadingMessage 
  }, { 
    quoted: fkontak 
  });
  
  // Add a small delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // ========== REST OF YOUR EXISTING CODE ==========
  // 📝 Full info + commands (with individual toggles)
  let finalText = "";
  
  // ========== ADD FADED TEXT HELPER FUNCTION ==========
  const createFadedEffect = (text) => {
    /**
     * Creates WhatsApp's "faded/spoiler" text effect
     * @param {string} text - Text to apply faded effect to
     * @returns {string} Formatted text with faded effect
     */
    
    const fadeChars = [
      '\u200D', // ZERO WIDTH JOINER
      '\u200C', // ZERO WIDTH NON-JOINER
      '\u2060', // WORD JOINER
      '\uFEFF', // ZERO WIDTH NO-BREAK SPACE
    ];
    
    // Create initial fade (80-100 characters for good effect)
    const initialFade = Array.from({ length: 90 }, 
      (_, i) => fadeChars[i % fadeChars.length]
    ).join('');
    
    return `${initialFade}${text}`;
  };
  
  // ========== ADD "READ MORE" HELPER FUNCTION ==========
  const createReadMoreEffect = (text1, text2) => {
    /**
     * Creates WhatsApp's "Read more" effect using invisible characters
     * @param {string} text1 - First part (visible before "Read more")
     * @param {string} text2 - Second part (hidden after "Read more")
     * @returns {string} Formatted text with "Read more" effect
     */
    
    // WhatsApp needs MORE invisible characters to trigger "Read more"
    // Use 500+ characters for better reliability
    const invisibleChars = [
      '\u200E',    // LEFT-TO-RIGHT MARK
      '\u200F',    // RIGHT-TO-LEFT MARK
      '\u200B',    // ZERO WIDTH SPACE
      '\u200C',    // ZERO WIDTH NON-JOINER
      '\u200D',    // ZERO WIDTH JOINER
      '\u2060',    // WORD JOINER
      '\uFEFF',    // ZERO WIDTH NO-BREAK SPACE
    ];
    
    // Create a LONG string of invisible characters (500-600 chars)
    // WhatsApp needs enough to break the line detection
    const invisibleString = Array.from({ length: 550 }, 
      (_, i) => invisibleChars[i % invisibleChars.length]
    ).join('');
    
    // Add a newline after invisible characters for cleaner break
    return `${text1}${invisibleString}\n${text2}`;
  };
  // ========== END OF HELPER FUNCTION ==========
  
  // Helper functions (same as before)
  const getBotMode = () => {
    try {
      const possiblePaths = [
        './bot_mode.json',
        path.join(__dirname, 'bot_mode.json'),
        path.join(__dirname, '../bot_mode.json'),
        path.join(__dirname, '../../bot_mode.json'),
        path.join(__dirname, '../../../bot_mode.json'),
        path.join(__dirname, '../commands/owner/bot_mode.json'),
      ];
      
      for (const modePath of possiblePaths) {
        if (fs.existsSync(modePath)) {
          try {
            const modeData = JSON.parse(fs.readFileSync(modePath, 'utf8'));
            
            if (modeData.mode) {
              let displayMode;
              switch(modeData.mode.toLowerCase()) {
                case 'public':
                  displayMode = '🌍 Public';
                  break;
                case 'silent':
                  displayMode = '🔇 Silent';
                  break;
                case 'private':
                  displayMode = '🔒 Private';
                  break;
                case 'group-only':
                  displayMode = '👥 Group Only';
                  break;
                case 'maintenance':
                  displayMode = '🛠️ Maintenance';
                  break;
                default:
                  displayMode = `⚙️ ${modeData.mode.charAt(0).toUpperCase() + modeData.mode.slice(1)}`;
              }
              return displayMode;
            }
          } catch (parseError) {}
        }
      }
      
      // Fallback to global variables
      if (global.BOT_MODE) {
        return global.BOT_MODE === 'silent' ? '🔇 Silent' : '🌍 Public';
      }
      if (global.mode) {
        return global.mode === 'silent' ? '🔇 Silent' : '🌍 Public';
      }
      if (process.env.BOT_MODE) {
        return process.env.BOT_MODE === 'silent' ? '🔇 Silent' : '🌍 Public';
      }
      
    } catch (error) {}
    
    return '🌍 Public';
  };
  
  const getOwnerName = () => {
    try {
      const botSettingsPaths = [
        './bot_settings.json',
        path.join(__dirname, 'bot_settings.json'),
        path.join(__dirname, '../bot_settings.json'),
        path.join(__dirname, '../../bot_settings.json'),
      ];
      
      for (const settingsPath of botSettingsPaths) {
        if (fs.existsSync(settingsPath)) {
          try {
            const settingsData = fs.readFileSync(settingsPath, 'utf8');
            const settings = JSON.parse(settingsData);
            
            if (settings.ownerName && settings.ownerName.trim() !== '') {
              return settings.ownerName.trim();
            }
          } catch (parseError) {}
        }
      }
      
      const ownerPath = path.join(__dirname, 'owner.json');
      if (fs.existsSync(ownerPath)) {
        const ownerData = fs.readFileSync(ownerPath, 'utf8');
        const ownerInfo = JSON.parse(ownerData);
        
        if (ownerInfo.owner && ownerInfo.owner.trim() !== '') {
          return ownerInfo.owner.trim();
        } else if (ownerInfo.number && ownerInfo.number.trim() !== '') {
          return ownerInfo.number.trim();
        } else if (ownerInfo.phone && ownerInfo.phone.trim() !== '') {
          return ownerInfo.phone.trim();
        } else if (ownerInfo.contact && ownerInfo.contact.trim() !== '') {
          return ownerInfo.contact.trim();
        } else if (Array.isArray(ownerInfo) && ownerInfo.length > 0) {
          const owner = typeof ownerInfo[0] === 'string' ? ownerInfo[0] : "Unknown";
          return owner;
        }
      }
      
      if (global.OWNER_NAME) {
        return global.OWNER_NAME;
      }
      if (global.owner) {
        return global.owner;
      }
      if (process.env.OWNER_NUMBER) {
        return process.env.OWNER_NUMBER;
      }
      
    } catch (error) {}
    
    return 'Unknown';
  };
  
  const getBotPrefix = () => {
    try {
      const botSettingsPaths = [
        './bot_settings.json',
        path.join(__dirname, 'bot_settings.json'),
        path.join(__dirname, '../bot_settings.json'),
        path.join(__dirname, '../../bot_settings.json'),
      ];
      
      for (const settingsPath of botSettingsPaths) {
        if (fs.existsSync(settingsPath)) {
          try {
            const settingsData = fs.readFileSync(settingsPath, 'utf8');
            const settings = JSON.parse(settingsData);
            
            if (settings.prefix && settings.prefix.trim() !== '') {
              return settings.prefix.trim();
            }
          } catch (parseError) {}
        }
      }
      
      if (global.prefix) {
        return global.prefix;
      }
      
      if (process.env.PREFIX) {
        return process.env.PREFIX;
      }
      
    } catch (error) {}
    
    return '.';
  };
  
  const getBotVersion = () => {
    try {
      const ownerPath = path.join(__dirname, 'owner.json');
      if (fs.existsSync(ownerPath)) {
        const ownerData = fs.readFileSync(ownerPath, 'utf8');
        const ownerInfo = JSON.parse(ownerData);
        
        if (ownerInfo.version && ownerInfo.version.trim() !== '') {
          return ownerInfo.version.trim();
        }
      }
      
      const botSettingsPaths = [
        './bot_settings.json',
        path.join(__dirname, 'bot_settings.json'),
        path.join(__dirname, '../bot_settings.json'),
      ];
      
      for (const settingsPath of botSettingsPaths) {
        if (fs.existsSync(settingsPath)) {
          try {
            const settingsData = fs.readFileSync(settingsPath, 'utf8');
            const settings = JSON.parse(settingsData);
            
            if (settings.version && settings.version.trim() !== '') {
              return settings.version.trim();
            }
          } catch (parseError) {}
        }
      }
      
      if (global.VERSION) {
        return global.VERSION;
      }
      
      if (global.version) {
        return global.version;
      }
      
      if (process.env.VERSION) {
        return process.env.VERSION;
      }
      
    } catch (error) {}
    
    return 'v1.0.0';
  };
  
  // ========== IMPROVED DEPLOYMENT PLATFORM DETECTION ==========
  const getDeploymentPlatform = () => {
    // Check Heroku FIRST (most specific env variables)
    if (process.env.HEROKU_APP_NAME || 
        process.env.DYNO || 
        process.env.HEROKU_API_KEY ||
        (process.env.PORT && process.env.PORT !== '3000' && process.env.PORT !== '8080')) {
      return {
        name: 'Heroku',
        status: 'Active',
        icon: '🦸'
      };
    }
    // Check Render
    else if (process.env.RENDER_SERVICE_ID || 
             process.env.RENDER_SERVICE_NAME ||
             process.env.RENDER) {
      return {
        name: 'Render',
        status: 'Active',
        icon: '⚡'
      };
    }
    // Check Railway
    else if (process.env.RAILWAY_ENVIRONMENT ||
             process.env.RAILWAY_PROJECT_NAME ||
             process.env.RAILWAY_SERVICE_NAME) {
      return {
        name: 'Railway',
        status: 'Active',
        icon: '🚂'
      };
    }
    // Check Replit
    else if (process.env.REPL_ID || 
             process.env.REPLIT_DB_URL ||
             process.env.REPLIT_USER ||
             process.env.REPL_SLUG) {
      return {
        name: 'Replit',
        status: 'Active',
        icon: '🌀'
      };
    }
    // Check Vercel
    else if (process.env.VERCEL || 
             process.env.VERCEL_ENV ||
             process.env.VERCEL_URL) {
      return {
        name: 'Vercel',
        status: 'Active',
        icon: '▲'
      };
    }
    // Check Glitch
    else if (process.env.GLITCH_PROJECT_REMIX ||
             process.env.PROJECT_REMIX_CHAIN ||
             process.env.GLITCH) {
      return {
        name: 'Glitch',
        status: 'Active',
        icon: '🎏'
      };
    }
    // Check Koyeb
    else if (process.env.KOYEB_APP ||
             process.env.KOYEB_REGION ||
             process.env.KOYEB_SERVICE) {
      return {
        name: 'Koyeb',
        status: 'Active',
        icon: '☁️'
      };
    }
    // Check Cyclic
    else if (process.env.CYCLIC_URL ||
             process.env.CYCLIC_APP_ID ||
             process.env.CYCLIC_DB) {
      return {
        name: 'Cyclic',
        status: 'Active',
        icon: '🔄'
      };
    }
    // Check Panel/Pterodactyl
    else if (process.env.PANEL ||
             process.env.PTERODACTYL ||
             process.env.NODE_ENV === 'production' && 
             (process.platform === 'linux' && !process.env.SSH_CONNECTION)) {
      return {
        name: 'Panel/VPS',
        status: 'Active',
        icon: '🖥️'
      };
    }
    // Check SSH/VPS
    else if (process.env.SSH_CONNECTION || 
             process.env.SSH_CLIENT ||
             (process.platform === 'linux' && process.env.USER === 'root')) {
      return {
        name: 'VPS/SSH',
        status: 'Active',
        icon: '🖥️'
      };
    }
    // Check OS
    else if (process.platform === 'win32') {
      return {
        name: 'Windows PC',
        status: 'Active',
        icon: '💻'
      };
    } else if (process.platform === 'darwin') {
      return {
        name: 'MacOS',
        status: 'Active',
        icon: '🍎'
      };
    } else if (process.platform === 'linux') {
      return {
        name: 'Linux Local',
        status: 'Active',
        icon: '🐧'
      };
    } else {
      return {
        name: 'Local Machine',
        status: 'Active',
        icon: '🏠'
      };
    }
  };
  
  // Load bot information using helper functions (botName already loaded above)
  const ownerName = getOwnerName();
  const botPrefix = getBotPrefix();
  const botVersion = getBotVersion();
  const botMode = getBotMode();
  const deploymentPlatform = getDeploymentPlatform();
  
  // ========== IMPROVED REAL-TIME SYSTEM METRICS ==========
  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };
  
  // REAL RAM USAGE CALCULATION WITH VISUAL BAR
  const getRAMUsage = () => {
    try {
      const mem = process.memoryUsage();
      const used = mem.heapUsed / 1024 / 1024; // MB
      const total = mem.heapTotal / 1024 / 1024; // MB
      const percent = Math.round((used / total) * 100);
      
      // Create visual progress bar (10 segments total)
      const barLength = 10;
      const filledBars = Math.round((percent / 100) * barLength);
      const emptyBars = barLength - filledBars;
      
      // Use block characters for the bar
      const barStyle = '█';
      const emptyStyle = '░';
      
      // Create the visual bar
      const memBar = barStyle.repeat(filledBars) + emptyStyle.repeat(emptyBars);
      
      return {
        bar: memBar,
        percent: percent,
        usedMB: Math.round(used * 100) / 100,
        totalMB: Math.round(total * 100) / 100
      };
    } catch (error) {
      // Fallback if something goes wrong
      return {
        bar: '░░░░░░░░░░',
        percent: 0,
        usedMB: 0,
        totalMB: 0
      };
    }
  };
  
  // Get real RAM usage
  const ramUsage = getRAMUsage();
  
  // ========== UPDATED MENU WITH CURVED FORMAT ==========
  let infoSection = `╭─⌈ \`${currentBotName}\` ⌋
│  ╭⊷ *User:* ${m.pushName || "Anonymous"}
│  ├⊷ *Owner:* ${ownerName}
│  ├⊷ *Mode:* ${botMode}
│  ├⊷ *Prefix:* [ ${botPrefix} ]
│  ├⊷ *Version:* ${botVersion}
│  ├⊷ *Platform:* ${deploymentPlatform.name}
│  ├⊷ *Status:* ${deploymentPlatform.status}
│  ├⊷ *Uptime:* ${formatUptime(process.uptime())}
│  ├⊷ *RAM Usage:* ${ramUsage.percent}%
│  │  ${ramUsage.bar}
│  ╰⊷ *Memory:* ${ramUsage.usedMB}MB / ${ramUsage.totalMB}MB
╰─⊷`;

  // Apply faded effect to the info section
  const fadedInfoSection = createFadedEffect(infoSection);

  // ========== MENU LIST WITH BOX STYLE ==========
  const commandsText = `╭─⊷ *🏠 GROUP MANAGEMENT*
│
├─⊷ *🛡️ ADMIN & MODERATION*
│  • add
│  • promote
│  • demote
│  • kick
│  • kickall
│  • ban
│  • unban
│  • banlist
│  • clearbanlist
│  • warn
│  • resetwarn
│  • setwarn
│  • mute
│  • unmute
│  • gctime
│  • antileave
│  • antilink
│  • welcome
│
├─⊷ *🚫 AUTO-MODERATION*
│  • antisticker
│  • antiviewonce
│  • antilink
│  • antiimage
│  • antivideo
│  • antiaudio
│  • antimention
│  • antistatusmention
│  • antigrouplink
│
├─⊷ *📊 GROUP INFO & TOOLS*
│  • groupinfo
│  • tagadmin
│  • tagall
│  • hidetag
│  • link
│  • invite
│  • revoke
│  • setdesc
│  • fangtrace
│  • getgpp
│
╰─⊷

╭─⊷ *🎨 MENU COMMANDS*
│
│  • togglemenuinfo
│  • setmenuimage
│  • resetmenuinfo
│  • menustyle
│
╰─⊷

╭─⊷ *👑 OWNER CONTROLS*
│
├─⊷ *⚡ CORE MANAGEMENT*
│  • setbotname
│  • setowner
│  • setprefix
│  • iamowner
│  • about
│  • block
│  • unblock
│  • blockdetect
│  • silent
│  • anticall
│  • mode
│  • online
│  • setpp
│  • repo
│
├─⊷ *🔄 SYSTEM & MAINTENANCE*
│  • restart
│  • workingreload
│  • reloadenv
│  • getsettings
│  • setsetting
│  • test
│  • disk
│  • hostip
│  • findcommands
│
╰─⊷

╭─⊷ *⚙️ AUTOMATION*
│
│  • autoread
│  • autotyping
│  • autorecording
│  • autoreact
│  • autoreactstatus
│  • autobio
│  • autorec
│
╰─⊷

╭─⊷ *✨ GENERAL UTILITIES*
│
├─⊷ *🔍 INFO & SEARCH*
│  • alive
│  • ping
│  • ping2
│  • time
│  • connection
│  • define
│  • news
│  • covid
│  • iplookup
│  • getip
│  • getpp
│  • getgpp
│  • prefixinfo
│
├─⊷ *🔗 CONVERSION & MEDIA*
│  • shorturl
│  • qrencode
│  • take
│  • imgbb
│  • tiktok
│  • save
│
├─⊷ *📝 PERSONAL TOOLS*
│  • pair
│  • resetwarn
│  • setwarn
│
╰─⊷

╭─⊷ *🎵 MUSIC & MEDIA*
│
│  • play
│  • song
│  • lyrics
│  • spotify
│  • video
│  • video2
│  • bassboost
│  • trebleboost
│
╰─⊷

╭─⊷ *🤖 MEDIA & AI COMMANDS*
│
├─⊷ *⬇️ MEDIA DOWNLOADS*
│  • youtube
│  • tiktok
│  • instagram
│  • facebook
│  • snapchat
│  • apk
│
├─⊷ *🎨 AI GENERATION*
│  • gpt
│  • gemini
│  • deepseek
│  • deepseek+
│  • analyze
│  • suno
│  • wolfbot
│  • videogen
│
╰─⊷

╭─⊷ *🖼️ IMAGE TOOLS*
│
│  • image
│  • imagegenerate
│  • anime
│  • art
│  • real
│
╰─⊷

╭─⊷ *🛡️ SECURITY & HACKING*
│
├─⊷ *🌐 NETWORK & INFO*
│  • ipinfo
│  • shodan
│  • iplookup
│  • getip
│
╰─⊷

╭─⊷ *🎨 LOGO DESIGN STUDIO*
│
├─⊷ *🌟 PREMIUM METALS*
│  • goldlogo
│  • silverlogo
│  • platinumlogo
│  • chromelogo
│  • diamondlogo
│  • bronzelogo
│  • steelogo
│  • copperlogo
│  • titaniumlogo
│
├─⊷ *🔥 ELEMENTAL EFFECTS*
│  • firelogo
│  • icelogo
│  • iceglowlogo
│  • lightninglogo
│  • aqualogo
│  • rainbowlogo
│  • sunlogo
│  • moonlogo
│
├─⊷ *🎭 MYTHICAL & MAGICAL*
│  • dragonlogo
│  • phoenixlogo
│  • wizardlogo
│  • crystallogo
│  • darkmagiclogo
│
├─⊷ *🌌 DARK & GOTHIC*
│  • shadowlogo
│  • smokelogo
│  • bloodlogo
│
├─⊷ *💫 GLOW & NEON EFFECTS*
│  • neonlogo
│  • glowlogo
│
├─⊷ *🤖 TECH & FUTURISTIC*
│  • matrixlogo
│
╰─⊷

╭─⊷ *🐙 GITHUB COMMANDS*
│
│  • gitclone
│  • gitinfo
│  • repo
│  • commits
│  • stars
│  • watchers
│  • release
│
╰─⊷

╭─⊷ *🌸 ANIME COMMANDS*
│
│  • awoo
│  • bj
│  • bully
│  • cringe
│  • cry
│  • dance
│  • glomp
│  • highfive
│  • kill
│  • kiss
│  • lick
│  • megumin
│  • neko
│  • pat
│  • shinobu
│  • trap
│  • trap2
│  • waifu
│  • wink
│  • yeet
│
╰─⊷

🐺 *POWERED BY WOLF TECH* 🐺`;

  // ========== APPLY "READ MORE" EFFECT ==========
  // Combine faded info section (visible) and commands (hidden) with "Read more"
  finalText = createReadMoreEffect(fadedInfoSection, commandsText);
  // ========== END "READ MORE" EFFECT ==========

  // Send the menu with fake contact
  await sock.sendMessage(jid, { 
    text: finalText 
  }, { 
    quoted: fkontak 
  });
  
  console.log(`✅ ${currentBotName} menu sent with faded effect and box style`);
  break;
}










case 6: {
  // First, get the bot name BEFORE showing loading message
  const getBotName = () => {
    try {
      const possiblePaths = [
        './bot_settings.json',
        path.join(__dirname, 'bot_settings.json'),
        path.join(__dirname, '../bot_settings.json'),
        path.join(__dirname, '../../bot_settings.json'),
        path.join(__dirname, '../../../bot_settings.json'),
        path.join(__dirname, '../commands/owner/bot_settings.json'),
      ];
      
      for (const settingsPath of possiblePaths) {
        if (fs.existsSync(settingsPath)) {
          try {
            const settingsData = fs.readFileSync(settingsPath, 'utf8');
            const settings = JSON.parse(settingsData);
            
            if (settings.botName && settings.botName.trim() !== '') {
              return settings.botName.trim();
            }
          } catch (parseError) {}
        }
      }
      
      if (global.BOT_NAME) {
        return global.BOT_NAME;
      }
      
      if (process.env.BOT_NAME) {
        return process.env.BOT_NAME;
      }
      
    } catch (error) {}
    
    return 'WOLFBOT';
  };
  
  // Get the current bot name
  const currentBotName = getBotName();
  
  // ========== LOADING MESSAGE ==========
  const loadingMessage = `⚡ ${currentBotName} menu loading...`;
  
  // Send loading message
  await sock.sendMessage(jid, { text: loadingMessage }, { quoted: m });
  
  // Add a small delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // ========== REST OF YOUR EXISTING CODE ==========
  // 🖼️ Full info + image + commands (with individual toggles)
  let finalCaption = "";
  
  // ========== ENHANCED "READ MORE" HELPER FUNCTION ==========
  const createReadMoreEffect = (text1, text2) => {
    /**
     * Creates WhatsApp's "Read more" effect using invisible characters
     * Works on ALL screens: phones, tablets, laptops
     * @param {string} text1 - First part (visible before "Read more")
     * @param {string} text2 - Second part (hidden after "Read more")
     * @returns {string} Formatted text with "Read more" effect
     */
    
    // WhatsApp needs MORE invisible characters for wider screens (laptops/tablets)
    // Use 600+ characters for cross-device compatibility
    const invisibleChars = [
      '\u200E',    // LEFT-TO-RIGHT MARK
      '\u200F',    // RIGHT-TO-LEFT MARK
      '\u200B',    // ZERO WIDTH SPACE
      '\u200C',    // ZERO WIDTH NON-JOINER
      '\u200D',    // ZERO WIDTH JOINER
      '\u2060',    // WORD JOINER
      '\uFEFF',    // ZERO WIDTH NO-BREAK SPACE
      '\u180E',    // MONGOLIAN VOWEL SEPARATOR
      '\u202A',    // LEFT-TO-RIGHT EMBEDDING
      '\u202B',    // RIGHT-TO-LEFT EMBEDDING
      '\u202C',    // POP DIRECTIONAL FORMATTING
      '\u202D',    // LEFT-TO-RIGHT OVERRIDE
      '\u202E',    // RIGHT-TO-LEFT OVERRIDE
    ];
    
    // Create 650+ invisible characters for reliable "Read more" on all devices
    // Laptops have wider screens, need more characters to trigger the effect
    const invisibleString = Array.from({ length: 680 }, 
      (_, i) => invisibleChars[i % invisibleChars.length]
    ).join('');
    
    // Add multiple newlines after invisible characters for better cross-device compatibility
    return `${text1}${invisibleString}\n\n${text2}`;
  };
  // ========== END OF HELPER FUNCTION ==========
  
  // Add these helper functions at the start of case 6
  const getBotMode = () => {
    try {
      const possiblePaths = [
        './bot_mode.json',
        path.join(__dirname, 'bot_mode.json'),
        path.join(__dirname, '../bot_mode.json'),
        path.join(__dirname, '../../bot_mode.json'),
        path.join(__dirname, '../../../bot_mode.json'),
        path.join(__dirname, '../commands/owner/bot_mode.json'),
      ];
      
      for (const modePath of possiblePaths) {
        if (fs.existsSync(modePath)) {
          try {
            const modeData = JSON.parse(fs.readFileSync(modePath, 'utf8'));
            
            if (modeData.mode) {
              let displayMode;
              switch(modeData.mode.toLowerCase()) {
                case 'public':
                  displayMode = '🌍 Public';
                  break;
                case 'silent':
                  displayMode = '🔇 Silent';
                  break;
                case 'private':
                  displayMode = '🔒 Private';
                  break;
                case 'group-only':
                  displayMode = '👥 Group Only';
                  break;
                case 'maintenance':
                  displayMode = '🛠️ Maintenance';
                  break;
                default:
                  displayMode = `⚙️ ${modeData.mode.charAt(0).toUpperCase() + modeData.mode.slice(1)}`;
              }
              return displayMode;
            }
          } catch (parseError) {}
        }
      }
      
      // Fallback to global variables
      if (global.BOT_MODE) {
        return global.BOT_MODE === 'silent' ? '🔇 Silent' : '🌍 Public';
      }
      if (global.mode) {
        return global.mode === 'silent' ? '🔇 Silent' : '🌍 Public';
      }
      if (process.env.BOT_MODE) {
        return process.env.BOT_MODE === 'silent' ? '🔇 Silent' : '🌍 Public';
      }
      
    } catch (error) {}
    
    return '🌍 Public';
  };
  
  const getOwnerName = () => {
    try {
      const botSettingsPaths = [
        './bot_settings.json',
        path.join(__dirname, 'bot_settings.json'),
        path.join(__dirname, '../bot_settings.json'),
        path.join(__dirname, '../../bot_settings.json'),
      ];
      
      for (const settingsPath of botSettingsPaths) {
        if (fs.existsSync(settingsPath)) {
          try {
            const settingsData = fs.readFileSync(settingsPath, 'utf8');
            const settings = JSON.parse(settingsData);
            
            if (settings.ownerName && settings.ownerName.trim() !== '') {
              return settings.ownerName.trim();
            }
          } catch (parseError) {}
        }
      }
      
      const ownerPath = path.join(__dirname, 'owner.json');
      if (fs.existsSync(ownerPath)) {
        const ownerData = fs.readFileSync(ownerPath, 'utf8');
        const ownerInfo = JSON.parse(ownerData);
        
        if (ownerInfo.owner && ownerInfo.owner.trim() !== '') {
          return ownerInfo.owner.trim();
        } else if (ownerInfo.number && ownerInfo.number.trim() !== '') {
          return ownerInfo.number.trim();
        } else if (ownerInfo.phone && ownerInfo.phone.trim() !== '') {
          return ownerInfo.phone.trim();
        } else if (ownerInfo.contact && ownerInfo.contact.trim() !== '') {
          return ownerInfo.contact.trim();
        } else if (Array.isArray(ownerInfo) && ownerInfo.length > 0) {
          const owner = typeof ownerInfo[0] === 'string' ? ownerInfo[0] : "Unknown";
          return owner;
        }
      }
      
      if (global.OWNER_NAME) {
        return global.OWNER_NAME;
      }
      if (global.owner) {
        return global.owner;
      }
      if (process.env.OWNER_NUMBER) {
        return process.env.OWNER_NUMBER;
      }
      
    } catch (error) {}
    
    return 'Unknown';
  };
  
  const getBotPrefix = () => {
    try {
      const botSettingsPaths = [
        './bot_settings.json',
        path.join(__dirname, 'bot_settings.json'),
        path.join(__dirname, '../bot_settings.json'),
        path.join(__dirname, '../../bot_settings.json'),
      ];
      
      for (const settingsPath of botSettingsPaths) {
        if (fs.existsSync(settingsPath)) {
          try {
            const settingsData = fs.readFileSync(settingsPath, 'utf8');
            const settings = JSON.parse(settingsData);
            
            if (settings.prefix && settings.prefix.trim() !== '') {
              return settings.prefix.trim();
            }
          } catch (parseError) {}
        }
      }
      
      if (global.prefix) {
        return global.prefix;
      }
      
      if (process.env.PREFIX) {
        return process.env.PREFIX;
      }
      
    } catch (error) {}
    
    return '.';
  };
  
  const getBotVersion = () => {
    try {
      const ownerPath = path.join(__dirname, 'owner.json');
      if (fs.existsSync(ownerPath)) {
        const ownerData = fs.readFileSync(ownerPath, 'utf8');
        const ownerInfo = JSON.parse(ownerData);
        
        if (ownerInfo.version && ownerInfo.version.trim() !== '') {
          return ownerInfo.version.trim();
        }
      }
      
      const botSettingsPaths = [
        './bot_settings.json',
        path.join(__dirname, 'bot_settings.json'),
        path.join(__dirname, '../bot_settings.json'),
      ];
      
      for (const settingsPath of botSettingsPaths) {
        if (fs.existsSync(settingsPath)) {
          try {
            const settingsData = fs.readFileSync(settingsPath, 'utf8');
            const settings = JSON.parse(settingsData);
            
            if (settings.version && settings.version.trim() !== '') {
              return settings.version.trim();
            }
          } catch (parseError) {}
        }
      }
      
      if (global.VERSION) {
        return global.VERSION;
      }
      
      if (global.version) {
        return global.version;
      }
      
      if (process.env.VERSION) {
        return process.env.VERSION;
      }
      
    } catch (error) {}
    
    return 'v1.0.0';
  };
  
  const getDeploymentPlatform = () => {
    // Detect deployment platform
    if (process.env.REPL_ID || process.env.REPLIT_DB_URL) {
      return {
        name: 'Replit',
        status: 'Active',
        icon: '🌀'
      };
    } else if (process.env.HEROKU_APP_NAME) {
      return {
        name: 'Heroku',
        status: 'Active',
        icon: '🦸'
      };
    } else if (process.env.RENDER_SERVICE_ID) {
      return {
        name: 'Render',
        status: 'Active',
        icon: '⚡'
      };
    } else if (process.env.RAILWAY_ENVIRONMENT) {
      return {
        name: 'Railway',
        status: 'Active',
        icon: '🚂'
      };
    } else if (process.env.VERCEL) {
      return {
        name: 'Vercel',
        status: 'Active',
        icon: '▲'
      };
    } else if (process.env.GLITCH_PROJECT_REMIX) {
      return {
        name: 'Glitch',
        status: 'Active',
        icon: '🎏'
      };
    } else if (process.env.KOYEB) {
      return {
        name: 'Koyeb',
        status: 'Active',
        icon: '☁️'
      };
    } else if (process.env.CYCLIC_URL) {
      return {
        name: 'Cyclic',
        status: 'Active',
        icon: '🔄'
      };
    } else if (process.env.PANEL) {
      return {
        name: 'PteroPanel',
        status: 'Active',
        icon: '🖥️'
      };
    } else if (process.env.SSH_CONNECTION || process.env.SSH_CLIENT) {
      return {
        name: 'VPS/SSH',
        status: 'Active',
        icon: '🖥️'
      };
    } else if (process.platform === 'win32') {
      return {
        name: 'Windows PC',
        status: 'Active',
        icon: '💻'
      };
    } else if (process.platform === 'linux') {
      return {
        name: 'Linux VPS',
        status: 'Active',
        icon: '🐧'
      };
    } else if (process.platform === 'darwin') {
      return {
        name: 'MacOS',
        status: 'Active',
        icon: '🍎'
      };
    } else {
      return {
        name: 'Local Machine',
        status: 'Active',
        icon: '🏠'
      };
    }
  };
  
  // Get current time and date
  const now = new Date();
  const currentTime = now.toLocaleTimeString('en-US', { 
    hour12: true, 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  });
  
  const currentDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Load bot information using helper functions
  const botName = getBotName();
  const ownerName = getOwnerName();
  const botPrefix = getBotPrefix();
  const botVersion = getBotVersion();
  const botMode = getBotMode();
  const deploymentPlatform = getDeploymentPlatform();
  
  // Add bot name header before the info section
  let infoSection = `> 🐺🌕 *${currentBotName}* 🌕🐺\n`;
  
  // Add info section only if any field is enabled
  const fieldsStatus = getAllFieldsStatus(style);
  
  // ========== CROSS-DEVICE COMPATIBILITY FIX ==========
  let hasInfoFields = false;
  if (fieldsStatus && typeof fieldsStatus === 'object') {
    hasInfoFields = Object.values(fieldsStatus).some(val => val);
  } else {
    // If getAllFieldsStatus doesn't exist or returns invalid, show all info
    hasInfoFields = true;
  }
  
  if (hasInfoFields) {
    const start = performance.now();
    const uptime = process.uptime();
    const h = Math.floor(uptime / 3600);
    const mnt = Math.floor((uptime % 3600) / 60);
    const s = Math.floor(uptime % 60);
    const uptimeStr = `${h}h ${mnt}m ${s}s`;
    const speed = (performance.now() - start).toFixed(2);
    const usedMem = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
    const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(0);
    
    // SAFE CALCULATION: Prevent negative or invalid percentages
    const memPercentNum = ((usedMem / (totalMem * 1024)) * 100);
    const memPercent = Math.min(Math.max(parseFloat(memPercentNum.toFixed(0)), 0), 100);
    
    // SAFE BAR CALCULATION: Prevent negative repeat values
    const filledBars = Math.max(Math.floor(memPercent / 10), 0);
    const emptyBars = Math.max(10 - filledBars, 0);
    const memBar = "█".repeat(filledBars) + "░".repeat(emptyBars);
    
    // Calculate command speed in milliseconds
    const commandSpeed = `${speed}ms`;
    
    const infoLines = [];
    
    // ========== CROSS-DEVICE FRIENDLY FORMAT ==========
    // Keep formatting simple for all screen sizes
    if ((fieldsStatus && fieldsStatus.time) || (!fieldsStatus)) {
      infoLines.push(`> ┃ Date: ${currentDate}`);
      infoLines.push(`> ┃ Time: ${currentTime}`);
    }
    if ((fieldsStatus && fieldsStatus.user) || (!fieldsStatus)) infoLines.push(`> ┃ User: ${m.pushName || "Anonymous"}`);
    if ((fieldsStatus && fieldsStatus.owner) || (!fieldsStatus)) infoLines.push(`> ┃ Owner: ${ownerName}`);
    if ((fieldsStatus && fieldsStatus.mode) || (!fieldsStatus)) infoLines.push(`> ┃ Mode: ${botMode}`);
    if ((fieldsStatus && fieldsStatus.prefix) || (!fieldsStatus)) infoLines.push(`> ┃ Prefix: [ ${botPrefix} ]`);
    if ((fieldsStatus && fieldsStatus.version) || (!fieldsStatus)) infoLines.push(`> ┃ Version: ${botVersion}`);
    if ((fieldsStatus && fieldsStatus.host) || (!fieldsStatus)) {
      infoLines.push(`> ┃ Panel: ${deploymentPlatform.name}`);
      infoLines.push(`> ┃ Status: ${deploymentPlatform.status}`);
    }
    if ((fieldsStatus && fieldsStatus.speed) || (!fieldsStatus)) {
      infoLines.push(`> ┃ Speed: ${commandSpeed}`);
    }
    if ((fieldsStatus && fieldsStatus.uptime) || (!fieldsStatus)) infoLines.push(`> ┃ Uptime: ${uptimeStr}`);
    if ((fieldsStatus && fieldsStatus.usage) || (!fieldsStatus)) infoLines.push(`> ┃ Usage: ${usedMem} MB of ${totalMem} GB`);
    if ((fieldsStatus && fieldsStatus.ram) || (!fieldsStatus)) infoLines.push(`> ┃ RAM: ${memBar} ${memPercent}%`);

    if (infoLines.length > 0) {
      const infoCaption = `> ┌────────────────\n${infoLines.join('\n')}\n> └────────────────\n`;
      infoSection += infoCaption;
    }
  } else {
    // If no info fields are enabled, still show basic header
    infoSection += `> *No additional information is enabled.*\n> *Use .togglemenuinfo to customize*\n`;
  }

  const commandsText = `> ┌────────────────
> │ 🏠 *GROUP MANAGEMENT* 🏠 
> ├────────────────
> │ 🛡️ *ADMIN & MODERATION* 🛡️ 
> ├────────────────
> │ • add                     
> │ • promote                 
> │ • demote                  
> │ • kick                    
> │ • kickall                 
> │ • ban                     
> │ • unban                   
> │ • banlist                 
> │ • clearbanlist            
> │ • warn                    
> │ • resetwarn               
> │ • setwarn                 
> │ • mute                    
> │ • unmute                  
> │ • gctime                  
> │ • antileave               
> │ • antilink                
> │ • welcome                 
> ├────────────────
> │ 🚫 *AUTO-MODERATION* 🚫   
> ├────────────────
> │ • antisticker             
> │ • antiviewonce  
> │ • antilink  
> │ • antiimage
> │ • antivideo
> │ • antiaudio
> │ • antimention
> │ • antistatusmention  
> │ • antigrouplink
> ├────────────────
> │ 📊 *GROUP INFO & TOOLS* 📊 
> ├────────────────
> │ • groupinfo               
> │ • tagadmin                
> │ • tagall                  
> │ • hidetag                 
> │ • link                    
> │ • invite                  
> │ • revoke                  
> │ • setdesc                 
> │ • fangtrace               
> │ • getgpp                  
> └────────────────

> ┌────────────────
> │ 🎨 *MENU COMMANDS* 🎨
> ├────────────────
> │ • togglemenuinfo
> │ • setmenuimage
> │ • resetmenuinfo
> │ • menustyle
> └────────────────

> ┌────────────────
> │ 👑 *OWNER CONTROLS* 👑    
> ├────────────────
> │ ⚡ *CORE MANAGEMENT* ⚡    
> ├────────────────
> │ • setbotname              
> │ • setowner                
> │ • setprefix               
> │ • iamowner                
> │ • about                   
> │ • block                   
> │ • unblock                 
> │ • blockdetect             
> │ • silent                  
> │ • anticall                
> │ • mode                    
> │ • online                  
> │ • setpp                   
> │ • repo                    
> ├────────────────
> │ 🔄 *SYSTEM & MAINTENANCE* 🛠️ 
> ├────────────────
> │ • restart                 
> │ • workingreload           
> │ • reloadenv               
> │ • getsettings             
> │ • setsetting              
> │ • test                    
> │ • disk                    
> │ • hostip                  
> │ • findcommands            
> └────────────────

> ┌────────────────
> │ ⚙️ *AUTOMATION* ⚙️
> ├────────────────
> │ • autoread                
> │ • autotyping              
> │ • autorecording           
> │ • autoreact               
> │ • autoreactstatus         
> │ • autobio                 
> │ • autorec                 
> └────────────────

> ┌────────────────
> │ ✨ *GENERAL UTILITIES* ✨
> ├────────────────
> │ 🔍 *INFO & SEARCH* 🔎
> ├────────────────
> │ • alive
> │ • ping
> │ • ping2
> │ • time
> │ • connection
> │ • define
> │ • news
> │ • covid
> │ • iplookup
> │ • getip
> │ • getpp
> │ • getgpp
> │ • prefixinfo
> ├───────────────
> │ 🔗 *CONVERSION & MEDIA* 📁
> ├───────────────
> │ • shorturl
> │ • qrencode
> │ • take
> │ • imgbb
> │ • tiktok
> │ • save
> ├───────────────
> │ 📝 *PERSONAL TOOLS* 📅
> ├───────────────
> │ • pair
> │ • resetwarn
> │ • setwarn
> └────────────────

> ┌────────────────
> │ 🎵 *MUSIC & MEDIA* 🎶
> ├────────────────
> │ • play                    
> │ • song                    
> │ • lyrics                  
> │ • spotify                 
> │ • video                   
> │ • video2                  
> │ • bassboost               
> │ • trebleboost             
> └────────────────

> ┌───────────────
> │ 🤖 *MEDIA & AI COMMANDS* 🧠 
> ├───────────────
> │ ⬇️ *MEDIA DOWNLOADS* 📥     
> ├───────────────
> │ • youtube                 
> │ • tiktok                 
> │ • instagram               
> │ • facebook                
> │ • snapchat                
> │ • apk                     
> ├───────────────
> │ 🎨 *AI GENERATION* 💡    
> ├───────────────
> │ • gpt                     
> │ • gemini                  
> │ • deepseek                
> │ • deepseek+               
> │ • analyze                 
> │ • suno                    
> │ • wolfbot                 
> │ • videogen                
> └───────────────

> ┌───────────────
> │ 🖼️ *IMAGE TOOLS* 🖼️
> ├───────────────
> │ • image                   
> │ • imagegenerate           
> │ • anime                   
> │ • art                     
> │ • real                    
> └───────────────

> ┌───────────────
> │ 🛡️ *SECURITY & HACKING* 🔒 
> ├───────────────
> │ 🌐 *NETWORK & INFO* 📡   
> ├───────────────
> │ • ipinfo                  
> │ • shodan                  
> │ • iplookup                
> │ • getip                   
> └───────────────

> 🐺🌕*POWERED BY WOLF TECH*🌕🐺
`;
  
  // ========== APPLY "READ MORE" EFFECT ==========
  // Combine info section (visible) and commands (hidden) with "Read more"
  finalCaption = createReadMoreEffect(infoSection, commandsText);
  // ========== END "READ MORE" EFFECT ==========

  const imgPath1 = path.join(__dirname, "media", "wolfbot.jpg");
  const imgPath2 = path.join(__dirname, "../media/wolfbot.jpg");
  const imagePath = fs.existsSync(imgPath1) ? imgPath1 : fs.existsSync(imgPath2) ? imgPath2 : null;
  if (!imagePath) {
    await sock.sendMessage(jid, { text: "⚠️ Image 'wolfbot.jpg' not found!" }, { quoted: m });
    return;
  }
  const buffer = fs.readFileSync(imagePath);

  await sock.sendMessage(jid, { 
    image: buffer, 
    caption: finalCaption, 
    mimetype: "image/jpeg"
  }, { quoted: m });
  
  console.log(`✅ ${currentBotName} menu sent with image and "Read more" effect`);
  break;
}



// case 7: {
//   // First, get the bot name BEFORE showing loading message
//   const getBotName = () => {
//     try {
//       const possiblePaths = [
//         './bot_settings.json',
//         path.join(__dirname, 'bot_settings.json'),
//         path.join(__dirname, '../bot_settings.json'),
//         path.join(__dirname, '../../bot_settings.json'),
//         path.join(__dirname, '../../../bot_settings.json'),
//         path.join(__dirname, '../commands/owner/bot_settings.json'),
//       ];
      
//       for (const settingsPath of possiblePaths) {
//         if (fs.existsSync(settingsPath)) {
//           try {
//             const settingsData = fs.readFileSync(settingsPath, 'utf8');
//             const settings = JSON.parse(settingsData);
            
//             if (settings.botName && settings.botName.trim() !== '') {
//               return settings.botName.trim();
//             }
//           } catch (parseError) {}
//         }
//       }
      
//       if (global.BOT_NAME) {
//         return global.BOT_NAME;
//       }
      
//       if (process.env.BOT_NAME) {
//         return process.env.BOT_NAME;
//       }
      
//     } catch (error) {}
    
//     return 'WOLFBOT';
//   };
  
//   // Get the current bot name
//   const currentBotName = getBotName();
  
//   // ========== LOADING MESSAGE ==========
//   const loadingMessage = `⚡ ${currentBotName} menu loading...`;
  
//   // Send loading message
//   await sock.sendMessage(jid, { text: loadingMessage }, { quoted: m });
  
//   // Add a small delay
//   await new Promise(resolve => setTimeout(resolve, 800));
  
//   // ========== REST OF YOUR EXISTING CODE ==========
//   // 🖼️ Full info + image + commands (with individual toggles)
//   let finalCaption = "";
  
//   // ========== IMPROVED HELPER FUNCTION ==========
//   const createReadMoreEffect = (text1, text2) => {
//     /**
//      * Creates WhatsApp's "Read more" effect using invisible characters
//      * @param {string} text1 - First part (visible before "Read more")
//      * @param {string} text2 - Second part (hidden after "Read more")
//      * @returns {string} Formatted text with "Read more" effect
//      */
    
//     // WhatsApp needs MORE invisible characters to trigger "Read more"
//     // Use 500+ characters for better reliability
//     const invisibleChars = [
//       '\u200E',    // LEFT-TO-RIGHT MARK
//       '\u200F',    // RIGHT-TO-LEFT MARK
//       '\u200B',    // ZERO WIDTH SPACE
//       '\u200C',    // ZERO WIDTH NON-JOINER
//       '\u200D',    // ZERO WIDTH JOINER
//       '\u2060',    // WORD JOINER
//       '\uFEFF',    // ZERO WIDTH NO-BREAK SPACE
//     ];
    
//     // Create a LONG string of invisible characters (500-600 chars)
//     // WhatsApp needs enough to break the line detection
//     const invisibleString = Array.from({ length: 550 }, 
//       (_, i) => invisibleChars[i % invisibleChars.length]
//     ).join('');
    
//     // Add a newline after invisible characters for cleaner break
//     return `${text1}${invisibleString}\n${text2}`;
//   };
//   // ========== END OF HELPER FUNCTION ==========
  
//   // Add these helper functions at the start of case 7
//   const getBotMode = () => {
//     try {
//       const possiblePaths = [
//         './bot_mode.json',
//         path.join(__dirname, 'bot_mode.json'),
//         path.join(__dirname, '../bot_mode.json'),
//         path.join(__dirname, '../../bot_mode.json'),
//         path.join(__dirname, '../../../bot_mode.json'),
//         path.join(__dirname, '../commands/owner/bot_mode.json'),
//       ];
      
//       for (const modePath of possiblePaths) {
//         if (fs.existsSync(modePath)) {
//           try {
//             const modeData = JSON.parse(fs.readFileSync(modePath, 'utf8'));
            
//             if (modeData.mode) {
//               let displayMode;
//               switch(modeData.mode.toLowerCase()) {
//                 case 'public':
//                   displayMode = '🌍 Public';
//                   break;
//                 case 'silent':
//                   displayMode = '🔇 Silent';
//                   break;
//                 case 'private':
//                   displayMode = '🔒 Private';
//                   break;
//                 case 'group-only':
//                   displayMode = '👥 Group Only';
//                   break;
//                 case 'maintenance':
//                   displayMode = '🛠️ Maintenance';
//                   break;
//                 default:
//                   displayMode = `⚙️ ${modeData.mode.charAt(0).toUpperCase() + modeData.mode.slice(1)}`;
//               }
//               return displayMode;
//             }
//           } catch (parseError) {}
//         }
//       }
      
//       // Fallback to global variables
//       if (global.BOT_MODE) {
//         return global.BOT_MODE === 'silent' ? '🔇 Silent' : '🌍 Public';
//       }
//       if (global.mode) {
//         return global.mode === 'silent' ? '🔇 Silent' : '🌍 Public';
//       }
//       if (process.env.BOT_MODE) {
//         return process.env.BOT_MODE === 'silent' ? '🔇 Silent' : '🌍 Public';
//       }
      
//     } catch (error) {}
    
//     return '🌍 Public';
//   };
  
//   const getOwnerName = () => {
//     try {
//       const botSettingsPaths = [
//         './bot_settings.json',
//         path.join(__dirname, 'bot_settings.json'),
//         path.join(__dirname, '../bot_settings.json'),
//         path.join(__dirname, '../../bot_settings.json'),
//       ];
      
//       for (const settingsPath of botSettingsPaths) {
//         if (fs.existsSync(settingsPath)) {
//           try {
//             const settingsData = fs.readFileSync(settingsPath, 'utf8');
//             const settings = JSON.parse(settingsData);
            
//             if (settings.ownerName && settings.ownerName.trim() !== '') {
//               return settings.ownerName.trim();
//             }
//           } catch (parseError) {}
//         }
//       }
      
//       const ownerPath = path.join(__dirname, 'owner.json');
//       if (fs.existsSync(ownerPath)) {
//         const ownerData = fs.readFileSync(ownerPath, 'utf8');
//         const ownerInfo = JSON.parse(ownerData);
        
//         if (ownerInfo.owner && ownerInfo.owner.trim() !== '') {
//           return ownerInfo.owner.trim();
//         } else if (ownerInfo.number && ownerInfo.number.trim() !== '') {
//           return ownerInfo.number.trim();
//         } else if (ownerInfo.phone && ownerInfo.phone.trim() !== '') {
//           return ownerInfo.phone.trim();
//         } else if (ownerInfo.contact && ownerInfo.contact.trim() !== '') {
//           return ownerInfo.contact.trim();
//         } else if (Array.isArray(ownerInfo) && ownerInfo.length > 0) {
//           const owner = typeof ownerInfo[0] === 'string' ? ownerInfo[0] : "Unknown";
//           return owner;
//         }
//       }
      
//       if (global.OWNER_NAME) {
//         return global.OWNER_NAME;
//       }
//       if (global.owner) {
//         return global.owner;
//       }
//       if (process.env.OWNER_NUMBER) {
//         return process.env.OWNER_NUMBER;
//       }
      
//     } catch (error) {}
    
//     return 'Unknown';
//   };
  
//   const getBotPrefix = () => {
//     try {
//       const botSettingsPaths = [
//         './bot_settings.json',
//         path.join(__dirname, 'bot_settings.json'),
//         path.join(__dirname, '../bot_settings.json'),
//         path.join(__dirname, '../../bot_settings.json'),
//       ];
      
//       for (const settingsPath of botSettingsPaths) {
//         if (fs.existsSync(settingsPath)) {
//           try {
//             const settingsData = fs.readFileSync(settingsPath, 'utf8');
//             const settings = JSON.parse(settingsData);
            
//             if (settings.prefix && settings.prefix.trim() !== '') {
//               return settings.prefix.trim();
//             }
//           } catch (parseError) {}
//         }
//       }
      
//       if (global.prefix) {
//         return global.prefix;
//       }
      
//       if (process.env.PREFIX) {
//         return process.env.PREFIX;
//       }
      
//     } catch (error) {}
    
//     return '.';
//   };
  
//   const getBotVersion = () => {
//     try {
//       const ownerPath = path.join(__dirname, 'owner.json');
//       if (fs.existsSync(ownerPath)) {
//         const ownerData = fs.readFileSync(ownerPath, 'utf8');
//         const ownerInfo = JSON.parse(ownerData);
        
//         if (ownerInfo.version && ownerInfo.version.trim() !== '') {
//           return ownerInfo.version.trim();
//         }
//       }
      
//       const botSettingsPaths = [
//         './bot_settings.json',
//         path.join(__dirname, 'bot_settings.json'),
//         path.join(__dirname, '../bot_settings.json'),
//       ];
      
//       for (const settingsPath of botSettingsPaths) {
//         if (fs.existsSync(settingsPath)) {
//           try {
//             const settingsData = fs.readFileSync(settingsPath, 'utf8');
//             const settings = JSON.parse(settingsData);
            
//             if (settings.version && settings.version.trim() !== '') {
//               return settings.version.trim();
//             }
//           } catch (parseError) {}
//         }
//       }
      
//       if (global.VERSION) {
//         return global.VERSION;
//       }
      
//       if (global.version) {
//         return global.version;
//       }
      
//       if (process.env.VERSION) {
//         return process.env.VERSION;
//       }
      
//     } catch (error) {}
    
//     return 'v1.0.0';
//   };
  
//   const getDeploymentPlatform = () => {
//     // Detect deployment platform
//     if (process.env.REPL_ID || process.env.REPLIT_DB_URL) {
//       return {
//         name: 'Replit',
//         status: 'Active',
//         icon: '🌀'
//       };
//     } else if (process.env.HEROKU_APP_NAME) {
//       return {
//         name: 'Heroku',
//         status: 'Active',
//         icon: '🦸'
//       };
//     } else if (process.env.RENDER_SERVICE_ID) {
//       return {
//         name: 'Render',
//         status: 'Active',
//         icon: '⚡'
//       };
//     } else if (process.env.RAILWAY_ENVIRONMENT) {
//       return {
//         name: 'Railway',
//         status: 'Active',
//         icon: '🚂'
//       };
//     } else if (process.env.VERCEL) {
//       return {
//         name: 'Vercel',
//         status: 'Active',
//         icon: '▲'
//       };
//     } else if (process.env.GLITCH_PROJECT_REMIX) {
//       return {
//         name: 'Glitch',
//         status: 'Active',
//         icon: '🎏'
//       };
//     } else if (process.env.KOYEB) {
//       return {
//         name: 'Koyeb',
//         status: 'Active',
//         icon: '☁️'
//       };
//     } else if (process.env.CYCLIC_URL) {
//       return {
//         name: 'Cyclic',
//         status: 'Active',
//         icon: '🔄'
//       };
//     } else if (process.env.PANEL) {
//       return {
//         name: 'PteroPanel',
//         status: 'Active',
//         icon: '🖥️'
//       };
//     } else if (process.env.SSH_CONNECTION || process.env.SSH_CLIENT) {
//       return {
//         name: 'VPS/SSH',
//         status: 'Active',
//         icon: '🖥️'
//       };
//     } else if (process.platform === 'win32') {
//       return {
//         name: 'Windows PC',
//         status: 'Active',
//         icon: '💻'
//       };
//     } else if (process.platform === 'linux') {
//       return {
//         name: 'Linux VPS',
//         status: 'Active',
//         icon: '🐧'
//       };
//     } else if (process.platform === 'darwin') {
//       return {
//         name: 'MacOS',
//         status: 'Active',
//         icon: '🍎'
//       };
//     } else {
//       return {
//         name: 'Local Machine',
//         status: 'Active',
//         icon: '🏠'
//       };
//     }
//   };
  
//   // Get current time and date
//   const now = new Date();
//   const currentTime = now.toLocaleTimeString('en-US', { 
//     hour12: true, 
//     hour: '2-digit', 
//     minute: '2-digit',
//     second: '2-digit'
//   });
  
//   const currentDate = now.toLocaleDateString('en-US', {
//     weekday: 'long',
//     year: 'numeric',
//     month: 'long',
//     day: 'numeric'
//   });
  
//   // Load bot information using helper functions
//   const ownerName = getOwnerName();
//   const botPrefix = getBotPrefix();
//   const botVersion = getBotVersion();
//   const botMode = getBotMode();
//   const deploymentPlatform = getDeploymentPlatform();
  
//   // Add bot name header before the info section
//   let infoSection = `┌────────────────
// │ 🐺 *${currentBotName} MENU* 🐺
// └────────────────\n\n`;
  
//   // Add info section only if any field is enabled
//   const fieldsStatus = getAllFieldsStatus(style);
  
//   // ========== FIX: Add safety check for fieldsStatus ==========
//   let hasInfoFields = false;
//   if (fieldsStatus && typeof fieldsStatus === 'object') {
//     hasInfoFields = Object.values(fieldsStatus).some(val => val);
//   } else {
//     // If getAllFieldsStatus doesn't exist or returns invalid, show all info
//     hasInfoFields = true;
//   }
  
//   if (hasInfoFields) {
//     const start = performance.now();
//     const uptime = process.uptime();
//     const h = Math.floor(uptime / 3600);
//     const mnt = Math.floor((uptime % 3600) / 60);
//     const s = Math.floor(uptime % 60);
//     const uptimeStr = `${h}h ${mnt}m ${s}s`;
//     const speed = (performance.now() - start).toFixed(2);
//     const usedMem = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
//     const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(0);
    
//     // SAFE CALCULATION: Prevent negative or invalid percentages
//     const memPercentNum = ((usedMem / (totalMem * 1024)) * 100);
//     const memPercent = Math.min(Math.max(parseFloat(memPercentNum.toFixed(0)), 0), 100);
    
//     // SAFE BAR CALCULATION: Prevent negative repeat values
//     const filledBars = Math.max(Math.floor(memPercent / 10), 0);
//     const emptyBars = Math.max(10 - filledBars, 0);
//     const memBar = "█".repeat(filledBars) + "░".repeat(emptyBars);
    
//     // Calculate command speed in milliseconds
//     const commandSpeed = `${speed}ms`;
    
//     // Get CPU load (keeping for internal calculation but not displaying)
//     const cpuLoad = Math.min(parseFloat(os.loadavg()[0].toFixed(2)), 5);
//     const cpuLoadBars = Math.max(Math.floor(cpuLoad), 0);
//     const cpuLoadEmpty = Math.max(5 - cpuLoadBars, 0);
//     const cpuLoadBar = "█".repeat(cpuLoadBars) + "░".repeat(cpuLoadEmpty);
    
//     const infoLines = [];
    
//     // ========== FIX: Check each field individually ==========
//     if ((fieldsStatus && fieldsStatus.time) || (!fieldsStatus)) infoLines.push(`*┃ Date: ${currentDate}*`);
//     if ((fieldsStatus && fieldsStatus.time) || (!fieldsStatus)) infoLines.push(`*┃ Time: ${currentTime}*`);
//     if ((fieldsStatus && fieldsStatus.user) || (!fieldsStatus)) infoLines.push(`*┃ User: ${m.pushName || "Anonymous"}*`);
//     if ((fieldsStatus && fieldsStatus.owner) || (!fieldsStatus)) infoLines.push(`*┃ Owner: ${ownerName}*`);
//     if ((fieldsStatus && fieldsStatus.mode) || (!fieldsStatus)) infoLines.push(`*┃ Mode: ${botMode}*`);
//     if ((fieldsStatus && fieldsStatus.prefix) || (!fieldsStatus)) infoLines.push(`*┃ Prefix: [ ${botPrefix} ]*`);
//     if ((fieldsStatus && fieldsStatus.version) || (!fieldsStatus)) infoLines.push(`*┃ Version: ${botVersion}*`);
//     if ((fieldsStatus && fieldsStatus.host) || (!fieldsStatus)) {
//       infoLines.push(`*┃ Panel: ${deploymentPlatform.name}*`);
//       infoLines.push(`*┃ Status: ${deploymentPlatform.status}*`);
//     }
//     if ((fieldsStatus && fieldsStatus.speed) || (!fieldsStatus)) {
//       infoLines.push(`*┃ Speed: ${commandSpeed}*`);
//     }
//     if ((fieldsStatus && fieldsStatus.uptime) || (!fieldsStatus)) infoLines.push(`*┃ Uptime: ${uptimeStr}*`);
//     if ((fieldsStatus && fieldsStatus.usage) || (!fieldsStatus)) infoLines.push(`*┃ Usage: ${usedMem} MB of ${totalMem} GB*`);
//     if ((fieldsStatus && fieldsStatus.ram) || (!fieldsStatus)) infoLines.push(`*┃ RAM: ${memBar} ${memPercent}%*`);

//     if (infoLines.length > 0) {
//       const infoCaption = `┌────────────────\n${infoLines.join('\n')}\n└────────────────\n\n`;
//       infoSection += infoCaption;
//     }
//   } else {
//     // If no info fields are enabled, still show basic header
//     infoSection += `*No additional information is enabled.*\n*Use .togglemenuinfo to customize*\n\n`;
//   }

//   const commandsText = `┌────────────────
// │ 🏠 GROUP MANAGEMENT 🏠 
// ├────────────────
// │ 🛡️ ADMIN & MODERATION 🛡️ 
// ├────────────────
// │ add                     
// │ promote                 
// │ demote                  
// │ kick                    
// │ kickall                 
// │ ban                     
// │ unban                   
// │ banlist                 
// │ clearbanlist            
// │ warn                    
// │ resetwarn               
// │ setwarn                 
// │ mute                    
// │ unmute                  
// │ gctime                  
// │ antileave               
// │ antilink                
// │ welcome                 
// ├────────────────
// │ 🚫 AUTO-MODERATION 🚫   
// ├────────────────
// │ antisticker             
// │ antiviewonce  
// │ antilink  
// │ antiimage
// │ antivideo
// │ antiaudio
// │ antimention
// │ antistatusmention  
// │ antigrouplink
// ├────────────────
// │ 📊 GROUP INFO & TOOLS 📊 
// ├────────────────
// │ groupinfo               
// │ tagadmin                
// │ tagall                  
// │ hidetag                 
// │ link                    
// │ invite                  
// │ revoke                 
// │ setdesc                 
// │ fangtrace               
// │ getgpp 
// │ togstatus                 
// └────────────────

// ┌────────────────
// │ 🎨 MENU COMMANDS 🎨
// ├────────────────
// │ togglemenuinfo
// │ setmenuimage
// │ resetmenuinfo
// │ menustyle
// └────────────────

// ┌────────────────
// │ 👑 OWNER CONTROLS 👑    
// ├────────────────
// │ ⚡ CORE MANAGEMENT ⚡    
// ├────────────────
// │ setbotname              
// │ setowner                
// │ setprefix               
// │ iamowner                
// │ about                   
// │ block                   
// │ unblock                 
// │ blockdetect             
// │ silent                  
// │ anticall                
// │ mode                    
// │ online                  
// │ setpp                   
// │ repo                    
// │ antidelete              
// │ antideletestatus                  
// ├────────────────
// │ 🔄 SYSTEM & MAINTENANCE 🛠️ 
// ├────────────────
// │ restart                 
// │ workingreload           
// │ reloadenv               
// │ getsettings             
// │ setsetting              
// │ test                    
// │ disk                    
// │ hostip                  
// │ findcommands            
// └────────────────

// ┌────────────────
// │ ⚙️ AUTOMATION ⚙️
// ├────────────────
// │ autoread                
// │ autotyping              
// │ autorecording           
// │ autoreact               
// │ autoreactstatus         
// │ autobio                 
// │ autorec                 
// └────────────────
// ┌────────────────
// │ ✨ GENERAL UTILITIES ✨
// ├────────────────
// │ 🔍 INFO & SEARCH 🔎
// ├────────────────
// │ alive
// │ ping
// │ ping2
// │ time
// │ connection
// │ define
// │ news
// │ covid
// │ iplookup
// │ getip
// │ getpp
// │ getgpp
// │ prefixinfo
// ├───────────────
// │ 🔗 CONVERSION & MEDIA 📁
// ├───────────────
// │ shorturl
// │ qrencode
// │ take
// │ imgbb
// │ tiktok
// │ save
// │ toimage
// │ tosticker
// │ toaudio
// │ tts
// ├───────────────
// │ 📝 PERSONAL TOOLS 📅
// ├───────────────
// │ pair
// │ resetwarn
// │ setwarn
// └────────────────


// ├────────────────
// │ 🎵 MUSIC  🎶
// ├────────────────
// │ play                    
// │ song                    
// │ lyrics                  
// │ spotify                             
// └────────────────
// ┌────────────────
// │ 🤖 MEDIA & AI COMMANDS 🧠 
// ├────────────────
// │ ⬇️ MEDIA DOWNLOADS 📥     
// ├────────────────
// │ youtube                 
// │ tiktok                 
// │ instagram               
// │ facebook                
// │ snapchat                
// │ apk   
// │ yts
// │ ytplay
// │ ytmp3
// │ ytv
// │ ytmp4
// │ ytplaydoc
// │ song
// │ play
// │ spotify
// │ video
// │ image                  
// ├────────────────
// │ 🎨 AI GENERATION 💡    
// ├────────────────
// │ gpt                     
// │ gemini                  
// │ deepseek                
// │ deepseek+               
// │ analyze                 
// │ suno                    
// │ wolfbot
// │ bard
// │ claudeai
// │ venice
// │ grok
// │ wormgpt
// │ speechwriter
// │ blackbox
// │ mistral
// │ metai                        
// ├────────────────
// │ 🎨 AI TOOLS💡    
// ├────────────────
// │ videogen   
// │ aiscanner
// │ humanizer
// │ summarize     
// └───────────────
// ┌───────────────
// │ 🖼️ IMAGE TOOLS 🖼️
// ├───────────────
// │ image                   
// │ imagegenerate           
// │ anime                   
// │ art                     
// │ real                    
// └───────────────

// ┌───────────────
// │ 🛡️ SECURITY & HACKING 🔒 
// ├───────────────
// │ 🌐 NETWORK & INFO 📡   
// ├───────────────
// │ ipinfo                  
// │ shodan                  
// │ iplookup                
// │ getip                   
// └───────────────

// ┌────────────────
// │ 🎨 LOGO DESIGN STUDIO 🎨
// ├────────────────
// │ 🌟 PREMIUM METALS 🌟    
// ├────────────────
// │ goldlogo                
// │ silverlogo              
// │ platinumlogo            
// │ chromelogo              
// │ diamondlogo             
// │ bronzelogo              
// │ steelogo                
// │ copperlogo              
// │ titaniumlogo            
// ├────────────────
// │ 🔥 ELEMENTAL EFFECTS 🔥  
// ├────────────────
// │ firelogo                
// │ icelogo                 
// │ iceglowlogo             
// │ lightninglogo           
// │ aqualogo                
// │ rainbowlogo             
// │ sunlogo                 
// │ moonlogo                
// ├────────────────
// │ 🎭 MYTHICAL & MAGICAL 🧙  
// ├────────────────
// │ dragonlogo              
// │ phoenixlogo             
// │ wizardlogo              
// │ crystallogo             
// │ darkmagiclogo           
// ├────────────────
// │ 🌌 DARK & GOTHIC 🌑     
// ├────────────────
// │ shadowlogo              
// │ smokelogo               
// │ bloodlogo               
// ├────────────────
// │ 💫 GLOW & NEON EFFECTS 🌈  
// ├────────────────
// │ neonlogo                
// │ glowlogo                
// ├────────────────
// │ 🤖 TECH & FUTURISTIC 🚀  
// ├────────────────
// │ matrixlogo              
// └────────────────
// ┌────────────────
// │ 🐙 GITHUB COMMANDS 🐙
// ├────────────────
// │ gitclone
// │ gitinfo
// │ repo
// │ commits
// │ stars
// │ watchers
// │ release
// └────────────────
// ┌────────────────
// │ 🌸 ANIME COMMANDS 🌸
// ├────────────────
// │ awoo
// │ bj
// │ bully
// │ cringe
// │ cry
// │ cuddle
// │ dance
// │ glomp
// │ highfive
// │ kill
// │ kiss
// │ lick
// │ megumin
// │ neko
// │ pat
// │ shinobu
// │ trap
// │ trap2
// │ waifu
// │ wink
// │ yeet
// └────────────────



// 🐺POWERED BY WOLFTECH🐺

// `;

//   // ========== APPLY "READ MORE" EFFECT ==========
//   // Combine info section (visible) and commands (hidden) with "Read more"
//   finalCaption = createReadMoreEffect(infoSection, commandsText);
//   // ========== END "READ MORE" EFFECT ==========

//   const imgPath1 = path.join(__dirname, "media", "wolfbot.jpg");
//   const imgPath2 = path.join(__dirname, "../media/wolfbot.jpg");
//   const imagePath = fs.existsSync(imgPath1) ? imgPath1 : fs.existsSync(imgPath2) ? imgPath2 : null;
//   if (!imagePath) {
//     await sock.sendMessage(jid, { text: "⚠️ Image 'wolfbot.jpg' not found!" }, { quoted: m });
//     return;
//   }
//   const buffer = fs.readFileSync(imagePath);

//   await sock.sendMessage(jid, { 
//     image: buffer, 
//     caption: finalCaption, 
//     mimetype: "image/jpeg"
//   }, { quoted: m });
  
//   console.log(`✅ ${currentBotName} menu sent with "Read more" effect`);
//   break;
// }


case 7: {
  // First, get the bot name BEFORE showing loading message
  const getBotName = () => {
    try {
      const possiblePaths = [
        './bot_settings.json',
        path.join(__dirname, 'bot_settings.json'),
        path.join(__dirname, '../bot_settings.json'),
        path.join(__dirname, '../../bot_settings.json'),
        path.join(__dirname, '../../../bot_settings.json'),
        path.join(__dirname, '../commands/owner/bot_settings.json'),
      ];
      
      for (const settingsPath of possiblePaths) {
        if (fs.existsSync(settingsPath)) {
          try {
            const settingsData = fs.readFileSync(settingsPath, 'utf8');
            const settings = JSON.parse(settingsData);
            
            if (settings.botName && settings.botName.trim() !== '') {
              return settings.botName.trim();
            }
          } catch (parseError) {}
        }
      }
      
      if (global.BOT_NAME) {
        return global.BOT_NAME;
      }
      
      if (process.env.BOT_NAME) {
        return process.env.BOT_NAME;
      }
      
    } catch (error) {}
    
    return 'WOLFBOT';
  };
  
  // Get the current bot name
  const currentBotName = getBotName();
  
  // ========== LOADING MESSAGE ==========
  const loadingMessage = `⚡ ${currentBotName} menu loading...`;
  
  // Send loading message
  await sock.sendMessage(jid, { text: loadingMessage }, { quoted: m });
  
  // Add a small delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // ========== REST OF YOUR EXISTING CODE ==========
  // 🖼️ Full info + image + commands (with individual toggles)
  let finalCaption = "";
  
  // ========== IMPROVED HELPER FUNCTION ==========
  const createReadMoreEffect = (text1, text2) => {
    /**
     * Creates WhatsApp's "Read more" effect using invisible characters
     * @param {string} text1 - First part (visible before "Read more")
     * @param {string} text2 - Second part (hidden after "Read more")
     * @returns {string} Formatted text with "Read more" effect
     */
    
    // WhatsApp needs MORE invisible characters to trigger "Read more"
    // Use 500+ characters for better reliability
    const invisibleChars = [
      '\u200E',    // LEFT-TO-RIGHT MARK
      '\u200F',    // RIGHT-TO-LEFT MARK
      '\u200B',    // ZERO WIDTH SPACE
      '\u200C',    // ZERO WIDTH NON-JOINER
      '\u200D',    // ZERO WIDTH JOINER
      '\u2060',    // WORD JOINER
      '\uFEFF',    // ZERO WIDTH NO-BREAK SPACE
    ];
    
    // Create a LONG string of invisible characters (500-600 chars)
    // WhatsApp needs enough to break the line detection
    const invisibleString = Array.from({ length: 550 }, 
      (_, i) => invisibleChars[i % invisibleChars.length]
    ).join('');
    
    // Add a newline after invisible characters for cleaner break
    return `${text1}${invisibleString}\n${text2}`;
  };
  // ========== END OF HELPER FUNCTION ==========
  
  // Add these helper functions at the start of case 7
  const getBotMode = () => {
    try {
      const possiblePaths = [
        './bot_mode.json',
        path.join(__dirname, 'bot_mode.json'),
        path.join(__dirname, '../bot_mode.json'),
        path.join(__dirname, '../../bot_mode.json'),
        path.join(__dirname, '../../../bot_mode.json'),
        path.join(__dirname, '../commands/owner/bot_mode.json'),
      ];
      
      for (const modePath of possiblePaths) {
        if (fs.existsSync(modePath)) {
          try {
            const modeData = JSON.parse(fs.readFileSync(modePath, 'utf8'));
            
            if (modeData.mode) {
              let displayMode;
              switch(modeData.mode.toLowerCase()) {
                case 'public':
                  displayMode = '🌍 Public';
                  break;
                case 'silent':
                  displayMode = '🔇 Silent';
                  break;
                case 'private':
                  displayMode = '🔒 Private';
                  break;
                case 'group-only':
                  displayMode = '👥 Group Only';
                  break;
                case 'maintenance':
                  displayMode = '🛠️ Maintenance';
                  break;
                default:
                  displayMode = `⚙️ ${modeData.mode.charAt(0).toUpperCase() + modeData.mode.slice(1)}`;
              }
              return displayMode;
            }
          } catch (parseError) {}
        }
      }
      
      // Fallback to global variables
      if (global.BOT_MODE) {
        return global.BOT_MODE === 'silent' ? '🔇 Silent' : '🌍 Public';
      }
      if (global.mode) {
        return global.mode === 'silent' ? '🔇 Silent' : '🌍 Public';
      }
      if (process.env.BOT_MODE) {
        return process.env.BOT_MODE === 'silent' ? '🔇 Silent' : '🌍 Public';
      }
      
    } catch (error) {}
    
    return '🌍 Public';
  };
  
  const getOwnerName = () => {
    try {
      const botSettingsPaths = [
        './bot_settings.json',
        path.join(__dirname, 'bot_settings.json'),
        path.join(__dirname, '../bot_settings.json'),
        path.join(__dirname, '../../bot_settings.json'),
      ];
      
      for (const settingsPath of botSettingsPaths) {
        if (fs.existsSync(settingsPath)) {
          try {
            const settingsData = fs.readFileSync(settingsPath, 'utf8');
            const settings = JSON.parse(settingsData);
            
            if (settings.ownerName && settings.ownerName.trim() !== '') {
              return settings.ownerName.trim();
            }
          } catch (parseError) {}
        }
      }
      
      const ownerPath = path.join(__dirname, 'owner.json');
      if (fs.existsSync(ownerPath)) {
        const ownerData = fs.readFileSync(ownerPath, 'utf8');
        const ownerInfo = JSON.parse(ownerData);
        
        if (ownerInfo.owner && ownerInfo.owner.trim() !== '') {
          return ownerInfo.owner.trim();
        } else if (ownerInfo.number && ownerInfo.number.trim() !== '') {
          return ownerInfo.number.trim();
        } else if (ownerInfo.phone && ownerInfo.phone.trim() !== '') {
          return ownerInfo.phone.trim();
        } else if (ownerInfo.contact && ownerInfo.contact.trim() !== '') {
          return ownerInfo.contact.trim();
        } else if (Array.isArray(ownerInfo) && ownerInfo.length > 0) {
          const owner = typeof ownerInfo[0] === 'string' ? ownerInfo[0] : "Unknown";
          return owner;
        }
      }
      
      if (global.OWNER_NAME) {
        return global.OWNER_NAME;
      }
      if (global.owner) {
        return global.owner;
      }
      if (process.env.OWNER_NUMBER) {
        return process.env.OWNER_NUMBER;
      }
      
    } catch (error) {}
    
    return 'Unknown';
  };
  
  const getBotPrefix = () => {
    try {
      const botSettingsPaths = [
        './bot_settings.json',
        path.join(__dirname, 'bot_settings.json'),
        path.join(__dirname, '../bot_settings.json'),
        path.join(__dirname, '../../bot_settings.json'),
      ];
      
      for (const settingsPath of botSettingsPaths) {
        if (fs.existsSync(settingsPath)) {
          try {
            const settingsData = fs.readFileSync(settingsPath, 'utf8');
            const settings = JSON.parse(settingsData);
            
            if (settings.prefix && settings.prefix.trim() !== '') {
              return settings.prefix.trim();
            }
          } catch (parseError) {}
        }
      }
      
      if (global.prefix) {
        return global.prefix;
      }
      
      if (process.env.PREFIX) {
        return process.env.PREFIX;
      }
      
    } catch (error) {}
    
    return '.';
  };
  
  const getBotVersion = () => {
    try {
      const ownerPath = path.join(__dirname, 'owner.json');
      if (fs.existsSync(ownerPath)) {
        const ownerData = fs.readFileSync(ownerPath, 'utf8');
        const ownerInfo = JSON.parse(ownerData);
        
        if (ownerInfo.version && ownerInfo.version.trim() !== '') {
          return ownerInfo.version.trim();
        }
      }
      
      const botSettingsPaths = [
        './bot_settings.json',
        path.join(__dirname, 'bot_settings.json'),
        path.join(__dirname, '../bot_settings.json'),
      ];
      
      for (const settingsPath of botSettingsPaths) {
        if (fs.existsSync(settingsPath)) {
          try {
            const settingsData = fs.readFileSync(settingsPath, 'utf8');
            const settings = JSON.parse(settingsData);
            
            if (settings.version && settings.version.trim() !== '') {
              return settings.version.trim();
            }
          } catch (parseError) {}
        }
      }
      
      if (global.VERSION) {
        return global.VERSION;
      }
      
      if (global.version) {
        return global.version;
      }
      
      if (process.env.VERSION) {
        return process.env.VERSION;
      }
      
    } catch (error) {}
    
    return 'v1.0.0';
  };
  
  // ========== IMPROVED DEPLOYMENT PLATFORM DETECTION ==========
  const getDeploymentPlatform = () => {
    // Check Heroku FIRST (most specific env variables)
    if (process.env.HEROKU_APP_NAME || 
        process.env.DYNO || 
        process.env.HEROKU_API_KEY ||
        (process.env.PORT && process.env.PORT !== '3000' && process.env.PORT !== '8080')) {
      return {
        name: 'Heroku',
        status: 'Active',
        icon: '🦸'
      };
    }
    // Check Render
    else if (process.env.RENDER_SERVICE_ID || 
             process.env.RENDER_SERVICE_NAME ||
             process.env.RENDER) {
      return {
        name: 'Render',
        status: 'Active',
        icon: '⚡'
      };
    }
    // Check Railway
    else if (process.env.RAILWAY_ENVIRONMENT ||
             process.env.RAILWAY_PROJECT_NAME ||
             process.env.RAILWAY_SERVICE_NAME) {
      return {
        name: 'Railway',
        status: 'Active',
        icon: '🚂'
      };
    }
    // Check Replit
    else if (process.env.REPL_ID || 
             process.env.REPLIT_DB_URL ||
             process.env.REPLIT_USER ||
             process.env.REPL_SLUG) {
      return {
        name: 'Replit',
        status: 'Active',
        icon: '🌀'
      };
    }
    // Check Vercel
    else if (process.env.VERCEL || 
             process.env.VERCEL_ENV ||
             process.env.VERCEL_URL) {
      return {
        name: 'Vercel',
        status: 'Active',
        icon: '▲'
      };
    }
    // Check Glitch
    else if (process.env.GLITCH_PROJECT_REMIX ||
             process.env.PROJECT_REMIX_CHAIN ||
             process.env.GLITCH) {
      return {
        name: 'Glitch',
        status: 'Active',
        icon: '🎏'
      };
    }
    // Check Koyeb
    else if (process.env.KOYEB_APP ||
             process.env.KOYEB_REGION ||
             process.env.KOYEB_SERVICE) {
      return {
        name: 'Koyeb',
        status: 'Active',
        icon: '☁️'
      };
    }
    // Check Cyclic
    else if (process.env.CYCLIC_URL ||
             process.env.CYCLIC_APP_ID ||
             process.env.CYCLIC_DB) {
      return {
        name: 'Cyclic',
        status: 'Active',
        icon: '🔄'
      };
    }
    // Check Panel/Pterodactyl
    else if (process.env.PANEL ||
             process.env.PTERODACTYL ||
             process.env.NODE_ENV === 'production' && 
             (process.platform === 'linux' && !process.env.SSH_CONNECTION)) {
      return {
        name: 'Panel/VPS',
        status: 'Active',
        icon: '🖥️'
      };
    }
    // Check SSH/VPS
    else if (process.env.SSH_CONNECTION || 
             process.env.SSH_CLIENT ||
             (process.platform === 'linux' && process.env.USER === 'root')) {
      return {
        name: 'VPS/SSH',
        status: 'Active',
        icon: '🖥️'
      };
    }
    // Check OS
    else if (process.platform === 'win32') {
      return {
        name: 'Windows PC',
        status: 'Active',
        icon: '💻'
      };
    } else if (process.platform === 'darwin') {
      return {
        name: 'MacOS',
        status: 'Active',
        icon: '🍎'
      };
    } else if (process.platform === 'linux') {
      return {
        name: 'Linux Local',
        status: 'Active',
        icon: '🐧'
      };
    } else {
      return {
        name: 'Local Machine',
        status: 'Active',
        icon: '🏠'
      };
    }
  };
  
  // Load bot information using helper functions
  const ownerName = getOwnerName();
  const botPrefix = getBotPrefix();
  const botVersion = getBotVersion();
  const botMode = getBotMode();
  const deploymentPlatform = getDeploymentPlatform();
  
//   // Add bot name header before the info section
//   let infoSection = `┌────────────────
// │ 🐺 *${currentBotName} MENU* 🐺
// └────────────────\n\n`;
  


  let infoSection = "";
  
  const fieldsStatus = getAllFieldsStatus(style);
  
  let hasInfoFields = false;
  if (fieldsStatus && typeof fieldsStatus === 'object') {
    hasInfoFields = Object.values(fieldsStatus).some(val => val);
  } else {
    hasInfoFields = true;
  }
  
  if (hasInfoFields) {
    const uptime = process.uptime();
    const h = Math.floor(uptime / 3600);
    const mnt = Math.floor((uptime % 3600) / 60);
    const s = Math.floor(uptime % 60);
    const uptimeStr = `${h}h ${mnt}m ${s}s`;
    
    const getRAMUsage = () => {
      try {
        const mem = process.memoryUsage();
        const used = mem.heapUsed / 1024 / 1024;
        const total = mem.heapTotal / 1024 / 1024;
        const percent = Math.round((used / total) * 100);
        const barLength = 10;
        const filledBars = Math.round((percent / 100) * barLength);
        const emptyBars = barLength - filledBars;
        const memBar = '█'.repeat(filledBars) + '░'.repeat(emptyBars);
        return {
          bar: memBar,
          percent: percent,
          usedMB: Math.round(used * 100) / 100,
          totalMB: Math.round(total * 100) / 100
        };
      } catch (error) {
        return { bar: '░░░░░░░░░░', percent: 0, usedMB: 0, totalMB: 0 };
      }
    };
    
    const ramUsage = getRAMUsage();
    
    const infoLines = [];
    
    if ((fieldsStatus && fieldsStatus.user) || (!fieldsStatus)) infoLines.push(`┃ User: ▣『◆』《 ${m.pushName || "Anonymous"} 》『◆』▣`);
    if ((fieldsStatus && fieldsStatus.owner) || (!fieldsStatus)) infoLines.push(`┃ Owner: ${ownerName}`);
    if ((fieldsStatus && fieldsStatus.mode) || (!fieldsStatus)) infoLines.push(`┃ Mode: ${botMode}`);
    if ((fieldsStatus && fieldsStatus.prefix) || (!fieldsStatus)) infoLines.push(`┃ Prefix: [ ${botPrefix} ]`);
    if ((fieldsStatus && fieldsStatus.version) || (!fieldsStatus)) infoLines.push(`┃ Version: ${botVersion}`);
    if ((fieldsStatus && fieldsStatus.host) || (!fieldsStatus)) {
      infoLines.push(`┃ Panel: ${deploymentPlatform.name}`);
      infoLines.push(`┃ Status: ${deploymentPlatform.status}`);
    }
    if ((fieldsStatus && fieldsStatus.uptime) || (!fieldsStatus)) infoLines.push(`┃ Uptime: ${uptimeStr}`);
    if ((fieldsStatus && fieldsStatus.ram) || (!fieldsStatus)) infoLines.push(`┃ RAM: ${ramUsage.bar} ${ramUsage.percent}%`);
    if ((fieldsStatus && fieldsStatus.usage) || (!fieldsStatus)) infoLines.push(`┃ Memory: ${ramUsage.usedMB}MB / ${ramUsage.totalMB}MB`);

    if (infoLines.length > 0) {
      infoSection = `┌──⌈ \`${currentBotName}\` ⌋\n${infoLines.join('\n')}\n└────────────────\n\n`;
    }
  } else {
    infoSection = `*No additional information is enabled.*\n*Use .togglemenuinfo to customize*\n\n`;
  }

  const commandsText = `┌────────────────
│ 🏠 GROUP MANAGEMENT 🏠 
├────────────────
│ 🛡️ ADMIN & MODERATION 🛡️ 
├────────────────
│ add                     
│ promote                 
│ demote                  
│ kick                    
│ kickall                 
│ ban                     
│ unban                   
│ banlist                 
│ clearbanlist            
│ warn                    
│ resetwarn               
│ setwarn                 
│ mute                    
│ unmute                  
│ gctime                  
│ antileave               
│ antilink                
│ welcome                 
├────────────────
│ 🚫 AUTO-MODERATION 🚫   
├────────────────
│ antisticker             
│ antiviewonce  
│ antilink  
│ antiimage
│ antivideo
│ antiaudio
│ antimention
│ antistatusmention  
│ antigrouplink
├────────────────
│ 📊 GROUP INFO & TOOLS 📊 
├────────────────
│ groupinfo               
│ tagadmin                
│ tagall                  
│ hidetag                 
│ link                    
│ invite                  
│ revoke                 
│ setdesc                 
│ fangtrace               
│ getgpp 
│ togstatus                 
└────────────────

┌────────────────
│ 🎨 MENU COMMANDS 🎨
├────────────────
│ togglemenuinfo
│ setmenuimage
│ resetmenuinfo
│ menustyle
└────────────────

┌────────────────
│ 👑 OWNER CONTROLS 👑    
├────────────────
│ ⚡ CORE MANAGEMENT ⚡    
├────────────────
│ setbotname              
│ setowner                
│ setprefix               
│ iamowner                
│ about                   
│ block                   
│ unblock                 
│ blockdetect             
│ silent                  
│ anticall                
│ mode                    
│ online                  
│ setpp                   
│ repo                    
│ antidelete              
│ antideletestatus                  
├────────────────
│ 🔄 SYSTEM & MAINTENANCE 🛠️ 
├────────────────
│ restart                 
│ workingreload           
│ reloadenv               
│ getsettings             
│ setsetting              
│ test                    
│ disk                    
│ hostip                  
│ findcommands            
└────────────────

┌────────────────
│ ⚙️ AUTOMATION ⚙️
├────────────────
│ autoread                
│ autotyping              
│ autorecording           
│ autoreact               
│ autoreactstatus         
│ autobio                 
│ autorec                 
└────────────────
┌────────────────
│ ✨ GENERAL UTILITIES ✨
├────────────────
│ 🔍 INFO & SEARCH 🔎
├────────────────
│ alive
│ ping
│ ping2
│ time
│ connection
│ define
│ news
│ covid
│ iplookup
│ getip
│ getpp
│ getgpp
│ prefixinfo
├───────────────
│ 🔗 CONVERSION & MEDIA 📁
├───────────────
│ shorturl
│ qrencode
│ take
│ imgbb
│ tiktok
│ save
│ toimage
│ tosticker
│ toaudio
│ tts
├───────────────
│ 📝 PERSONAL TOOLS 📅
├───────────────
│ pair
│ resetwarn
│ setwarn
└────────────────


├────────────────
│ 🎵 MUSIC  🎶
├────────────────
│ play                    
│ song                    
│ lyrics                  
│ spotify                             
└────────────────
┌────────────────
│ 🤖 MEDIA & AI COMMANDS 🧠 
├────────────────
│ ⬇️ MEDIA DOWNLOADS 📥     
├────────────────
│ youtube                 
│ tiktok                 
│ instagram               
│ facebook                
│ snapchat                
│ apk   
│ yts
│ ytplay
│ ytmp3
│ ytv
│ ytmp4
│ ytplaydoc
│ song
│ play
│ spotify
│ video
│ image                  
├────────────────
│ 🎨 AI GENERATION 💡    
├────────────────
│ gpt                     
│ gemini                  
│ deepseek                
│ deepseek+               
│ analyze                 
│ suno                    
│ wolfbot
│ bard
│ claudeai
│ venice
│ grok
│ wormgpt
│ speechwriter
│ blackbox
│ mistral
│ metai                        
├────────────────
│ 🎨 AI TOOLS💡    
├────────────────
│ videogen   
│ aiscanner
│ humanizer
│ summarize     
└───────────────
┌───────────────
│ 🖼️ IMAGE TOOLS 🖼️
├───────────────
│ image                   
│ imagegenerate           
│ anime                   
│ art                     
│ real                    
└───────────────

┌───────────────
│ 🛡️ SECURITY & HACKING 🔒 
├───────────────
│ 🌐 NETWORK & INFO 📡   
├───────────────
│ ipinfo                  
│ shodan                  
│ iplookup                
│ getip                   
└───────────────

┌────────────────
│ 🎨 LOGO DESIGN STUDIO 🎨
├────────────────
│ 🌟 PREMIUM METALS 🌟    
├────────────────
│ goldlogo                
│ silverlogo              
│ platinumlogo            
│ chromelogo              
│ diamondlogo             
│ bronzelogo              
│ steelogo                
│ copperlogo              
│ titaniumlogo            
├────────────────
│ 🔥 ELEMENTAL EFFECTS 🔥  
├────────────────
│ firelogo                
│ icelogo                 
│ iceglowlogo             
│ lightninglogo           
│ aqualogo                
│ rainbowlogo             
│ sunlogo                 
│ moonlogo                
├────────────────
│ 🎭 MYTHICAL & MAGICAL 🧙  
├────────────────
│ dragonlogo              
│ phoenixlogo             
│ wizardlogo              
│ crystallogo             
│ darkmagiclogo           
├────────────────
│ 🌌 DARK & GOTHIC 🌑     
├────────────────
│ shadowlogo              
│ smokelogo               
│ bloodlogo               
├────────────────
│ 💫 GLOW & NEON EFFECTS 🌈  
├────────────────
│ neonlogo                
│ glowlogo                
├────────────────
│ 🤖 TECH & FUTURISTIC 🚀  
├────────────────
│ matrixlogo              
└────────────────
┌────────────────
│ 🐙 GITHUB COMMANDS 🐙
├────────────────
│ gitclone
│ gitinfo
│ repo
│ commits
│ stars
│ watchers
│ release
└────────────────
┌────────────────
│ 🌸 ANIME COMMANDS 🌸
├────────────────
│ awoo
│ bj
│ bully
│ cringe
│ cry
│ cuddle
│ dance
│ glomp
│ highfive
│ kill
│ kiss
│ lick
│ megumin
│ neko
│ pat
│ shinobu
│ trap
│ trap2
│ waifu
│ wink
│ yeet
└────────────────



🐺POWERED BY WOLFTECH🐺

`;

  // ========== APPLY "READ MORE" EFFECT ==========
  // Combine info section (visible) and commands (hidden) with "Read more"
  finalCaption = createReadMoreEffect(infoSection, commandsText);
  // ========== END "READ MORE" EFFECT ==========

  const imgPath1 = path.join(__dirname, "media", "wolfbot.jpg");
  const imgPath2 = path.join(__dirname, "../media/wolfbot.jpg");
  const imagePath = fs.existsSync(imgPath1) ? imgPath1 : fs.existsSync(imgPath2) ? imgPath2 : null;
  if (!imagePath) {
    await sock.sendMessage(jid, { text: "⚠️ Image 'wolfbot.jpg' not found!" }, { quoted: m });
    return;
  }
  const buffer = fs.readFileSync(imagePath);

  await sock.sendMessage(jid, { 
    image: buffer, 
    caption: finalCaption, 
    mimetype: "image/jpeg"
  }, { quoted: m });
  
  console.log(`✅ ${currentBotName} menu sent with "Read more" effect`);
  break;
}








       

        
   
      }

      console.log("✅ Menu sent successfully");

    } catch (err) {
      console.error("❌ [MENU] ERROR:", err);
      await sock.sendMessage(jid, { text: "⚠ Failed to load menu." }, { quoted: m });
    }
  },
};
