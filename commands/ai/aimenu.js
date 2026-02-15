import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: 'aimenu',
  description: 'AI Commands Menu',
  category: 'ai',
  aliases: ['aihelp', 'ai-cmds'],
  
  async execute(sock, m, args, PREFIX, extra) {
    const jid = m.key.remoteJid;
    
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
      
      return 'AI BOT';
    };
    
    // Get the current bot name
    const currentBotName = getBotName();
    
    // Get bot prefix function
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
    
    // Get current prefix
    const botPrefix = getBotPrefix();
    
    // ========== CREATE FAKE CONTACT FUNCTION ==========
    const createFakeContact = (message) => {
      const jid = message.key.participant?.split('@')[0] || message.key.remoteJid.split('@')[0];
      return {
        key: {
          remoteJid: "status@broadcast",
          fromMe: false,
          id: "AI-X"
        },
        message: {
          contactMessage: {
            displayName: "AI MENU",
            vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:AI MENU\nitem1.TEL;waid=${jid}:${jid}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
          }
        },
        participant: "0@s.whatsapp.net"
      };
    };
    
    // Create fake contact for quoted messages
    const fkontak = createFakeContact(m);
    
    // ========== SIMPLE LOADING MESSAGE ==========
    const loadingMessage = `⚡ ${currentBotName} AI menu loading...`;
    
    // Send loading message with fake contact
    await sock.sendMessage(jid, { 
      text: loadingMessage 
    }, { 
      quoted: fkontak 
    });
    
    // Add a small delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Create the AI commands list as caption
    const aiListCaption = `╭─⊷ *🤖 ${currentBotName} AI MENU*
│
├─⊷ *🔍 AI SCANNERS & ANALYZERS*
│  • ${botPrefix}aiscanner
│  • ${botPrefix}analyze
│  • ${botPrefix}removebg
│  • ${botPrefix}summarize
│  • ${botPrefix}vision
│
├─⊷ *🤖 MAJOR AI MODELS*
│  • ${botPrefix}bard
│  • ${botPrefix}bing
│  • ${botPrefix}blackbox
│  • ${botPrefix}chatgpt
│  • ${botPrefix}claudeai
│  • ${botPrefix}copilot
│  • ${botPrefix}deepseek
│  • ${botPrefix}deepseek+
│  • ${botPrefix}flux
│  • ${botPrefix}gpt
│  • ${botPrefix}grok
│  • ${botPrefix}ilama
│  • ${botPrefix}metai
│  • ${botPrefix}mistral
│  • ${botPrefix}perplexity
│  • ${botPrefix}qwenai
│  • ${botPrefix}venice
│  • ${botPrefix}wormgpt
│
├─⊷ *🎨 AI IMAGE GENERATION*
│  • ${botPrefix}brandlogo
│  • ${botPrefix}companylogo
│  • ${botPrefix}logoai
│  • ${botPrefix}suno
│
├─⊷ *📝 WRITING & CONTENT*
│  • ${botPrefix}humanizer
│  • ${botPrefix}speechwriter
│
╰─⊷

⚡ *POWERED BY WOLFTECH*`;

    // Send the image with AI list as caption
    await sock.sendMessage(jid, {
      image: {
        url: 'https://i.ibb.co/ymJJGmPS/Chat-GPT-Image-Jan-19-2026-09-36-33-PM.png'
      },
      caption: aiListCaption
    }, {
      quoted: fkontak
    });
    
    console.log(`✅ ${currentBotName} AI menu sent with prefix: ${botPrefix}`);
  }
};