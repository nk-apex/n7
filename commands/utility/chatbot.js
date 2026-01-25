
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { downloadMediaFromMessage } from "@whiskeysockets/baileys";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Available voices for text-to-speech
const availableVoices = [
  "alloy", "echo", "fable", "onyx", "nova", "shimmer", "adam", "antoni",
  "arnold", "bella", "callum", "charlie", "charlotte", "chris", "cora",
  "daniel", "dave", "domi", "dorothy", "elli", "emma", "fin", "freya",
  "gigi", "giovanni", "glinda", "grace", "harry", "james", "jessica",
  "joseph", "karen", "larissa", "liam", "matilda", "matthew", "michael",
  "mia", "minerva", "nicole", "patrick", "paul", "penelope", "rachel",
  "ryan", "sam", "sarah", "serena", "sophia", "thomas", "tracy", "vicki",
  "victoria", "walter"
];

// Default chatbot settings
const defaultSettings = {
  status: 'on', // 'on' or 'off'
  mode: 'both', // 'private', 'group', 'both'
  trigger: 'all', // 'dm' (only when mentioned), 'all' (all messages)
  default_response: 'text', // 'text' or 'audio'
  voice: 'alloy'
};

// Storage paths
const settingsPath = path.join(__dirname, "../data/chatbot_settings.json");
const historyPath = path.join(__dirname, "../data/chatbot_history.json");

// Load/save settings
async function loadSettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8');
      return { ...defaultSettings, ...JSON.parse(data) };
    }
    return defaultSettings;
  } catch (error) {
    console.error("Error loading chatbot settings:", error);
    return defaultSettings;
  }
}

async function saveSettings(settings) {
  try {
    const dir = path.dirname(settingsPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    console.error("Error saving chatbot settings:", error);
    return false;
  }
}

async function updateChatbotSettings(updates) {
  const settings = await loadSettings();
  const newSettings = { ...settings, ...updates };
  await saveSettings(newSettings);
  return newSettings;
}

async function getChatbotSettings() {
  return await loadSettings();
}

// Conversation history management
async function addToHistory(jid, userMessage, aiResponse, type = 'text') {
  try {
    if (!fs.existsSync(historyPath)) {
      const dir = path.dirname(historyPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(historyPath, JSON.stringify({}));
    }

    const data = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    if (!data[jid]) {
      data[jid] = [];
    }

    // Keep only last 50 messages per chat
    data[jid].push({
      timestamp: Date.now(),
      user: userMessage.substring(0, 500),
      ai: typeof aiResponse === 'string' ? aiResponse.substring(0, 1000) : aiResponse,
      type: type
    });

    if (data[jid].length > 50) {
      data[jid] = data[jid].slice(-50);
    }

    fs.writeFileSync(historyPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error("Error adding to history:", error);
    return false;
  }
}

async function getConversationHistory(jid, limit = 10) {
  try {
    if (!fs.existsSync(historyPath)) return [];
    
    const data = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    if (!data[jid]) return [];
    
    return data[jid].slice(-limit).reverse();
  } catch (error) {
    console.error("Error getting history:", error);
    return [];
  }
}

async function clearConversationHistory(jid) {
  try {
    if (!fs.existsSync(historyPath)) return true;
    
    const data = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    if (data[jid]) {
      delete data[jid];
      fs.writeFileSync(historyPath, JSON.stringify(data, null, 2));
    }
    return true;
  } catch (error) {
    console.error("Error clearing history:", error);
    return false;
  }
}

// AI APIs
const aiApis = {
  // Keith AI for text responses
  keithAI: async (query) => {
    try {
      const response = await axios.get(
        `https://apiskeith.vercel.app/keithai?q=${encodeURIComponent(query)}`,
        { timeout: 30000 }
      );
      if (response.data?.status && response.data?.result) {
        return {
          success: true,
          text: response.data.result,
          api: 'keith'
        };
      }
      throw new Error('Invalid response from Keith AI');
    } catch (error) {
      console.error("Keith AI error:", error.message);
      // Fallback to alternative AI
      return await aiApis.geminiAI(query);
    }
  },

  // Gemini AI as fallback
  geminiAI: async (query) => {
    try {
      const response = await axios.get(
        `https://apiskeith.vercel.app/ai/gemini?q=${encodeURIComponent(query)}`,
        { timeout: 30000 }
      );
      if (response.data?.status && response.data?.result) {
        return {
          success: true,
          text: response.data.result,
          api: 'gemini'
        };
      }
      throw new Error('Invalid response from Gemini');
    } catch (error) {
      console.error("Gemini error:", error.message);
      return {
        success: false,
        error: 'All AI services are currently unavailable'
      };
    }
  },

  // Text to Speech
  textToSpeech: async (text, voice = 'alloy') => {
    try {
      const response = await axios.get(
        `https://apiskeith.vercel.app/ai/text2speech?q=${encodeURIComponent(text)}&voice=${voice}`,
        { timeout: 30000 }
      );
      if (response.data?.status && response.data?.result?.URL) {
        return {
          success: true,
          url: response.data.result.URL,
          api: 'tts'
        };
      }
      throw new Error('Invalid TTS response');
    } catch (error) {
      console.error("TTS error:", error.message);
      return {
        success: false,
        error: 'TTS service unavailable'
      };
    }
  },

  // Image generation
  generateImage: async (prompt) => {
    try {
      const response = await axios.get(
        `https://apiskeith.vercel.app/ai/flux?q=${encodeURIComponent(prompt)}`,
        { timeout: 45000 }
      );
      if (response.data?.status && response.data?.result) {
        return {
          success: true,
          url: response.data.result,
          api: 'flux'
        };
      }
      throw new Error('Invalid image response');
    } catch (error) {
      console.error("Image generation error:", error.message);
      return {
        success: false,
        error: 'Image generation failed'
      };
    }
  },

  // Video generation
  generateVideo: async (prompt) => {
    try {
      const response = await axios.get(
        `https://apiskeith.vercel.app/text2video?q=${encodeURIComponent(prompt)}`,
        { timeout: 60000 }
      );
      if (response.data?.success && response.data?.results) {
        return {
          success: true,
          url: response.data.results,
          api: 'video'
        };
      }
      throw new Error('Invalid video response');
    } catch (error) {
      console.error("Video generation error:", error.message);
      return {
        success: false,
        error: 'Video generation failed'
      };
    }
  },

  // Vision analysis (image understanding)
  analyzeImage: async (imageUrl) => {
    try {
      const response = await axios.get(
        `https://apiskeith.vercel.app/ai/vision?q=${encodeURIComponent(imageUrl)}`,
        { timeout: 30000 }
      );
      if (response.data?.status && response.data?.result) {
        return {
          success: true,
          text: response.data.result,
          api: 'vision'
        };
      }
      throw new Error('Invalid vision response');
    } catch (error) {
      console.error("Vision error:", error.message);
      return {
        success: false,
        error: 'Vision analysis failed'
      };
    }
  }
};

// Helper functions
function downloadMedia(url) {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream',
        timeout: 30000
      });

      const tempFile = path.join(__dirname, `../temp/${Date.now()}_${Math.random().toString(36).substring(7)}`);
      const writer = fs.createWriteStream(tempFile);
      
      response.data.pipe(writer);
      
      writer.on('finish', () => {
        const buffer = fs.readFileSync(tempFile);
        fs.unlinkSync(tempFile);
        resolve(buffer);
      });
      
      writer.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
}

function getTypeIcon(type) {
  const icons = {
    'text': '📝',
    'audio': '🎵',
    'video': '🎥',
    'image': '🖼️',
    'vision': '🔍'
  };
  return icons[type] || '📝';
}

export default {
  name: "chatbot",
  aliases: ["chatai", "ai", "bot"],
  category: "Settings",
  description: "Manage chatbot settings and AI interactions",
  ownerOnly: true,

  async execute(sock, m, args) {
    const jid = m.key.remoteJid;
    const sender = m.key.participant || m.key.remoteJid;
    const quoted = m.quoted;
    const isGroup = jid.endsWith('@g.us');
    
    // Check if owner (you can adjust this logic)
    const isOwner = m.key.fromMe || sender.includes("947") || sender.includes("owner-number");
    if (!isOwner) {
      return sock.sendMessage(jid, {
        text: '❌ Only bot owner can use chatbot command'
      }, { quoted: m });
    }

    const settings = await getChatbotSettings();
    const subcommand = args[0]?.toLowerCase();
    const value = args.slice(1).join(" ");

    if (!subcommand) {
      // Show current settings
      const statusMap = {
        'on': '✅ ON',
        'off': '❌ OFF'
      };

      const modeMap = {
        'private': '🔒 Private Only',
        'group': '👥 Group Only', 
        'both': '🌐 Both'
      };

      const triggerMap = {
        'dm': '📨 DM Trigger',
        'all': '🔊 All Messages'
      };

      const responseMap = {
        'text': '📝 Text',
        'audio': '🎵 Audio'
      };

      const helpText = `*🤖 Chatbot Settings*\n\n` +
        `🔹 *Status:* ${statusMap[settings.status]}\n` +
        `🔹 *Mode:* ${modeMap[settings.mode]}\n` +
        `🔹 *Trigger:* ${triggerMap[settings.trigger]}\n` +
        `🔹 *Default Response:* ${responseMap[settings.default_response]}\n` +
        `🔹 *Voice:* ${settings.voice}\n\n` +
        `*🎯 Response Types:*\n` +
        `▸ *Text* - Normal AI conversation\n` +
        `▸ *Audio* - Add "audio" to get voice response\n` +
        `▸ *Video* - Add "video" to generate videos\n` +
        `▸ *Image* - Add "image" to generate images\n` +
        `▸ *Vision* - Send image + "analyze this"\n\n` +
        `*Usage Examples:*\n` +
        `▸ @bot hello how are you? (Text)\n` +
        `▸ @bot audio tell me a story (Audio response)\n` +
        `▸ @bot video a cat running (Video generation)\n` +
        `▸ @bot image a beautiful sunset (Image generation)\n` +
        `▸ [Send image] "analyze this" (Vision analysis)\n\n` +
        `*Commands:*\n` +
        `▸ chatbot on/off\n` +
        `▸ chatbot mode private/group/both\n` +
        `▸ chatbot trigger dm/all\n` +
        `▸ chatbot response text/audio\n` +
        `▸ chatbot voice <name>\n` +
        `▸ chatbot voices\n` +
        `▸ chatbot clear\n` +
        `▸ chatbot status\n` +
        `▸ chatbot test <type> <message>`;

      await sock.sendMessage(jid, { text: helpText }, { quoted: m });
      return;
    }

    switch (subcommand) {
      case 'on':
      case 'off':
        await updateChatbotSettings({ status: subcommand });
        await sock.sendMessage(jid, {
          text: `✅ Chatbot: *${subcommand.toUpperCase()}*`
        }, { quoted: m });
        break;

      case 'mode':
        if (!['private', 'group', 'both'].includes(value)) {
          await sock.sendMessage(jid, {
            text: "❌ Invalid mode! Use: private, group, or both"
          }, { quoted: m });
          return;
        }
        await updateChatbotSettings({ mode: value });
        await sock.sendMessage(jid, {
          text: `✅ Chatbot mode: *${value.toUpperCase()}*`
        }, { quoted: m });
        break;

      case 'trigger':
        if (!['dm', 'all'].includes(value)) {
          await sock.sendMessage(jid, {
            text: "❌ Invalid trigger! Use: dm or all"
          }, { quoted: m });
          return;
        }
        await updateChatbotSettings({ trigger: value });
        await sock.sendMessage(jid, {
          text: `✅ Chatbot trigger: *${value.toUpperCase()}*`
        }, { quoted: m });
        break;

      case 'response':
        if (!['text', 'audio'].includes(value)) {
          await sock.sendMessage(jid, {
            text: "❌ Invalid response type! Use: text or audio"
          }, { quoted: m });
          return;
        }
        await updateChatbotSettings({ default_response: value });
        await sock.sendMessage(jid, {
          text: `✅ Default response: *${value.toUpperCase()}*`
        }, { quoted: m });
        break;

      case 'voice':
        if (!availableVoices.includes(value)) {
          await sock.sendMessage(jid, {
            text: `❌ Invalid voice! Available voices:\n${availableVoices.join(', ')}`
          }, { quoted: m });
          return;
        }
        await updateChatbotSettings({ voice: value });
        await sock.sendMessage(jid, {
          text: `✅ Voice set to: *${value}*`
        }, { quoted: m });
        break;

      case 'voices':
        await sock.sendMessage(jid, {
          text: `*🎙️ Available Voices:*\n\n${availableVoices.join(', ')}`
        }, { quoted: m });
        break;

      case 'clear':
        const cleared = await clearConversationHistory(jid);
        if (cleared) {
          await sock.sendMessage(jid, {
            text: "✅ Chatbot conversation history cleared!"
          }, { quoted: m });
        } else {
          await sock.sendMessage(jid, {
            text: "❌ No conversation history to clear!"
          }, { quoted: m });
        }
        break;

      case 'status':
        const history = await getConversationHistory(jid, 5);
        if (history.length === 0) {
          await sock.sendMessage(jid, {
            text: "📝 No recent conversations found."
          }, { quoted: m });
          return;
        }
        
        let historyText = `*📚 Recent Conversations (${history.length})*\n\n`;
        history.forEach((conv, index) => {
          const typeIcon = getTypeIcon(conv.type);
          historyText += `*${index + 1}. ${typeIcon} You:* ${conv.user}\n`;
          historyText += `   *AI:* ${conv.type === 'audio' ? '[Voice Message]' : conv.ai}\n\n`;
        });
        
        await sock.sendMessage(jid, { text: historyText }, { quoted: m });
        break;

      case 'test':
        const testArgs = value.split(' ');
        const testType = testArgs[0]?.toLowerCase();
        const testMessage = testArgs.slice(1).join(' ') || "Hello, this is a test message";
        
        try {
          await sock.sendMessage(jid, {
            text: `🧪 Testing ${testType || 'text'} with: "${testMessage}"`
          }, { quoted: m });

          if (testType === 'audio') {
            // Test audio response
            const aiResult = await aiApis.keithAI(testMessage);
            if (aiResult.success) {
              const ttsResult = await aiApis.textToSpeech(aiResult.text, settings.voice);
              if (ttsResult.success) {
                const audioBuffer = await downloadMedia(ttsResult.url);
                await sock.sendMessage(jid, {
                  audio: audioBuffer,
                  ptt: true,
                  mimetype: 'audio/mpeg',
                  contextInfo: {
                    externalAdReply: {
                      title: "🎵 AI Audio Test",
                      body: testMessage.substring(0, 50),
                      mediaType: 2
                    }
                  }
                }, { quoted: m });
              }
            }
          } else if (testType === 'video') {
            // Test video generation
            const videoResult = await aiApis.generateVideo(testMessage);
            if (videoResult.success) {
              const videoBuffer = await downloadMedia(videoResult.url);
              await sock.sendMessage(jid, {
                video: videoBuffer,
                caption: `🎥 Test video: ${testMessage}`
              }, { quoted: m });
            }
          } else if (testType === 'image') {
            // Test image generation
            const imageResult = await aiApis.generateImage(testMessage);
            if (imageResult.success) {
              const imageBuffer = await downloadMedia(imageResult.url);
              await sock.sendMessage(jid, {
                image: imageBuffer,
                caption: `🖼️ Test image: ${testMessage}`
              }, { quoted: m });
            }
          } else {
            // Text test
            const textResult = await aiApis.keithAI(testMessage);
            if (textResult.success) {
              await sock.sendMessage(jid, {
                text: `📝 Text Response: ${textResult.text}`
              }, { quoted: m });
            }
          }
          
          await sock.sendMessage(jid, {
            text: "✅ Test completed!"
          }, { quoted: m });
        } catch (error) {
          console.error("Test error:", error);
          await sock.sendMessage(jid, {
            text: "❌ Test failed! " + error.message
          }, { quoted: m });
        }
        break;

      default:
        await sock.sendMessage(jid, {
          text: "❌ Invalid command!\n\n" +
          `▸ chatbot on/off\n` +
          `▸ chatbot mode private/group/both\n` +
          `▸ chatbot trigger dm/all\n` +
          `▸ chatbot response text/audio\n` +
          `▸ chatbot voice <name>\n` +
          `▸ chatbot voices\n` +
          `▸ chatbot clear\n` +
          `▸ chatbot status\n` +
          `▸ chatbot test <text/audio/video/image> <message>`
        }, { quoted: m });
    }
  },

  // Chatbot message handler (to be called from main bot file)
  async handleMessage(sock, m) {
    const jid = m.key.remoteJid;
    const sender = m.key.participant || m.key.remoteJid;
    const isGroup = jid.endsWith('@g.us');
    const messageText = m.message?.conversation || 
                       m.message?.extendedTextMessage?.text || 
                       m.message?.imageMessage?.caption ||
                       "";

    // Load settings
    const settings = await getChatbotSettings();
    
    // Check if chatbot is off
    if (settings.status !== 'on') return;

    // Check mode restrictions
    if (settings.mode === 'private' && isGroup) return;
    if (settings.mode === 'group' && !isGroup) return;

    // Check trigger mode
    const isMentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.includes(sock.user.id.split(':')[0]);
    if (settings.trigger === 'dm' && !isMentioned) return;

    // Check if message is for chatbot
    let query = messageText.trim();
    let responseType = settings.default_response;
    
    // Check for special commands
    if (query.toLowerCase().startsWith('audio ')) {
      responseType = 'audio';
      query = query.substring(6);
    } else if (query.toLowerCase().startsWith('video ')) {
      responseType = 'video';
      query = query.substring(6);
    } else if (query.toLowerCase().startsWith('image ')) {
      responseType = 'image';
      query = query.substring(6);
    } else if (query.toLowerCase().includes('analyze this') && m.message?.imageMessage) {
      responseType = 'vision';
    }

    if (!query && responseType !== 'vision') return;

    try {
      // Handle different response types
      if (responseType === 'audio') {
        // Get text response first
        const textResult = await aiApis.keithAI(query);
        if (textResult.success) {
          // Convert to speech
          const ttsResult = await aiApis.textToSpeech(textResult.text, settings.voice);
          if (ttsResult.success) {
            const audioBuffer = await downloadMedia(ttsResult.url);
            await sock.sendMessage(jid, {
              audio: audioBuffer,
              ptt: true,
              mimetype: 'audio/mpeg'
            }, { quoted: m });
            await addToHistory(jid, query, '[Voice Message]', 'audio');
          }
        }
      } else if (responseType === 'video') {
        const videoResult = await aiApis.generateVideo(query);
        if (videoResult.success) {
          const videoBuffer = await downloadMedia(videoResult.url);
          await sock.sendMessage(jid, {
            video: videoBuffer,
            caption: `🎥 ${query}`
          }, { quoted: m });
          await addToHistory(jid, query, '[Video Generated]', 'video');
        }
      } else if (responseType === 'image') {
        const imageResult = await aiApis.generateImage(query);
        if (imageResult.success) {
          const imageBuffer = await downloadMedia(imageResult.url);
          await sock.sendMessage(jid, {
            image: imageBuffer,
            caption: `🖼️ ${query}`
          }, { quoted: m });
          await addToHistory(jid, query, '[Image Generated]', 'image');
        }
      } else if (responseType === 'vision' && m.message?.imageMessage) {
        // Handle image analysis
        try {
          // Download the image
          const media = await downloadMediaFromMessage(m, 'image');
          // For now, send a placeholder response since we need to upload image
          const visionResult = await aiApis.analyzeImage("[IMAGE_UPLOADED]");
          if (visionResult.success) {
            await sock.sendMessage(jid, {
              text: `🔍 Image Analysis:\n${visionResult.text}`
            }, { quoted: m });
            await addToHistory(jid, '[Image]', visionResult.text, 'vision');
          }
        } catch (error) {
          console.error("Vision error:", error);
        }
      } else {
        // Text response
        const textResult = await aiApis.keithAI(query);
        if (textResult.success) {
          await sock.sendMessage(jid, {
            text: textResult.text
          }, { quoted: m });
          await addToHistory(jid, query, textResult.text, 'text');
        }
      }
    } catch (error) {
      console.error("Chatbot error:", error);
      await sock.sendMessage(jid, {
        text: "⚠️ Sorry, I encountered an error processing your request."
      }, { quoted: m });
    }
  }
};