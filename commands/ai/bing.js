import axios from 'axios';
import https from 'https';
import FormData from 'form-data';

// Resolution options
const reso = {
  'square': { width: 1024, height: 1024 },
  'portrait': { width: 768, height: 1024 },
  'landscape': { width: 1024, height: 768 },
  'tall': { width: 512, height: 1024 },
  'wide': { width: 1024, height: 512 },
  'ultra': { width: 1536, height: 1536 },
  'hd': { width: 1920, height: 1080 },
  'mobile': { width: 720, height: 1280 },
  'desktop': { width: 1920, height: 1080 }
};

export default {
  name: "bing",
  aliases: ["text2image", "text2img", "aiimage", "imggen", "createimg"],
  category: "ai",
  description: "Generate AI image from text prompt",
  
  async execute(sock, m, args, PREFIX) {
    const jid = m.key.remoteJid;
    
    // Check if prompt is provided
    if (args.length === 0) {
      return sock.sendMessage(jid, {
        text: `╭─⌈ 🎨 *AI IMAGE GENERATOR* ⌋\n│\n├─⊷ *${PREFIX}bing <prompt>*\n│  └⊷ Generate AI image\n│\n├─⊷ *${PREFIX}bing <prompt> | <resolution>*\n│  └⊷ Generate with resolution (landscape/portrait/ultra/hd)\n│\n╰───`
      }, { quoted: m });
    }

    // Parse arguments
    const query = args.join(' ');
    const queryParts = query.split('|');
    const prompt = queryParts[0].trim();
    const resolution = (queryParts[1]?.trim().toLowerCase() || 'portrait').toLowerCase();
    const upscale = 2;

    // Validate resolution
    if (!reso[resolution]) {
      const validResolutions = Object.keys(reso).join(', ');
      return sock.sendMessage(jid, {
        text: `╭─⌈ ❌ *INVALID RESOLUTION* ⌋\n│\n│ "${resolution}" is not valid.\n│\n│ ✅ Available: ${validResolutions}\n│\n├─⊷ *${PREFIX}bing <prompt> | <resolution>*\n│  └⊷ Use a valid resolution\n│\n╰───`
      }, { quoted: m });
    }

    try {
      // Show generating status
      const statusMsg = await sock.sendMessage(jid, {
        text: `🎨 *Generating AI Image...*\n\n` +
                 ``
      }, { quoted: m });

      const { width, height } = reso[resolution];
      
      console.log(`[BING] Generating image: "${prompt}" (${width}x${height})`);

      // Create form data
      const form = new FormData();
      form.append('Prompt', prompt);
      form.append('Language', 'eng_Latn');
      form.append('Size', `${width}x${height}`);
      form.append('Upscale', upscale.toString());
      form.append('Batch_Index', '0');

      // HTTPS agent for self-signed certificates
      const agent = new https.Agent({ 
        rejectUnauthorized: false 
      });

      // Make API request
      const response = await axios.post(
        'https://api.zonerai.com/zoner-ai/txt2img',
        form,
        {
          httpsAgent: agent,
          headers: {
            ...form.getHeaders(),
            'Origin': 'https://zonerai.com',
            'Referer': 'https://zonerai.com/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          responseType: 'arraybuffer',
          timeout: 60000 // 60 seconds
        }
      );

      if (!response.data || response.data.length === 0) {
        throw new Error('Empty image response from AI');
      }

      const imageBuffer = Buffer.from(response.data);
      const fileSizeKB = Math.round(imageBuffer.length / 1024);

      console.log(`[BING] Image generated: ${fileSizeKB} KB`);

      // Create caption
      const caption = `🎨 *AI GENERATED IMAGE*\n\n_Created by WOLFBOT_`;

      // Send the generated image
      await sock.sendMessage(jid, {
        image: imageBuffer,
        caption: caption
      }, { quoted: m });

      // Update status message
      await sock.sendMessage(jid, {
        text: `✅ *Image Generated Successfully!*\n\n` +
             `✨ AI Art created with Bing/Image Creator`,
        edit: statusMsg.key
      });

      // Send success reaction
      await sock.sendMessage(jid, {
        react: { text: '✅', key: m.key }
      });

    } catch (error) {
      console.error('[BING] Error:', error.message);
      
      let errorMessage = `❌ *Image Generation Failed*\n\n`;
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        errorMessage += `• AI image service is unavailable\n`;
        errorMessage += `• Try again later\n\n`;
      } else if (error.response) {
        if (error.response.status === 400) {
          errorMessage += `• Invalid prompt or parameters\n`;
          errorMessage += `• Try different wording\n\n`;
        } else if (error.response.status === 429) {
          errorMessage += `• Rate limit exceeded\n`;
          errorMessage += `• Please wait before trying again\n\n`;
        } else if (error.response.status === 500) {
          errorMessage += `• AI server error\n`;
          errorMessage += `• Try simpler prompt\n\n`;
        } else {
          errorMessage += `• API Error: ${error.response.status}\n\n`;
        }
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage += `• Generation timeout (60s)\n`;
        errorMessage += `• Try simpler prompt\n`;
        errorMessage += `• Server might be busy\n\n`;
      } else if (error.message.includes('Empty image')) {
        errorMessage += `• AI returned empty image\n`;
        errorMessage += `• Try different prompt\n\n`;
      } else {
        errorMessage += `• Error: ${error.message}\n\n`;
      }
      
      errorMessage += `💡 *Tips for better AI images:*\n`;
      errorMessage += `• Be descriptive with your prompt\n`;
      errorMessage += `• Add style words (anime, realistic, cartoon)\n`;
      errorMessage += `• Specify colors, lighting, mood\n`;
      errorMessage += `• Keep prompts under 200 characters\n\n`;
      
      errorMessage += `╭─⌈ 📌 *USAGE* ⌋\n│\n├─⊷ *${PREFIX}bing <prompt> | <resolution>*\n│  └⊷ Generate AI image\n│\n╰───`;
      
      await sock.sendMessage(jid, {
        text: errorMessage
      }, { quoted: m });
      
      // Send error reaction
      await sock.sendMessage(jid, {
        react: { text: '❌', key: m.key }
      });
    }
  }
};