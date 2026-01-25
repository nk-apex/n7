import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lightning PUBG Video generator API
const ephotoApis = {
  generateLightningPubgVideo: async (text) => {
    try {
      // First, submit the text to generate the video
      const response = await axios.post(
        "https://en.ephoto360.com/lightning-pubg-video-logo-maker-online-615.html",
        new URLSearchParams({
          text: text,
          submit: "Create"
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://en.ephoto360.com/lightning-pubg-video-logo-maker-online-615.html'
          },
          timeout: 30000,
          maxRedirects: 5
        }
      );
      
      // Try to extract video URL from response
      const videoUrl = extractVideoUrl(response.data);
      return videoUrl;
      
    } catch (error) {
      console.error("Ephoto Lightning PUBG error:", error.message);
      
      // Try alternative API endpoints
      try {
        // Alternative 1: Direct API call
        const altResponse = await axios.get(
          `https://api.ephoto360.com/lightning-pubg-video-logo-maker-online-615?text=${encodeURIComponent(text)}`,
          { timeout: 15000 }
        );
        if (altResponse.data?.url) return altResponse.data.url;
      } catch (e) {}
      
      // Alternative 2: Alternative service
      try {
        const alt2Response = await axios.get(
          `https://ephoto-api.vercel.app/api/lightning-pubg?text=${encodeURIComponent(text)}`,
          { timeout: 15000 }
        );
        if (alt2Response.data?.url) return alt2Response.data.url;
      } catch (e) {}
      
      return null;
    }
  }
};

// Helper function to extract video URL from HTML response
function extractVideoUrl(html) {
  try {
    // Try to find video URL in HTML
    const videoRegex = /<video[^>]+src="([^"]+)"/i;
    const match = html.match(videoRegex);
    if (match && match[1]) {
      return match[1].startsWith('http') ? match[1] : `https://en.ephoto360.com${match[1]}`;
    }
    
    // Try to find download link
    const downloadRegex = /<a[^>]+href="([^"]+\.(mp4|webm|mov))"[^>]*>/i;
    const downloadMatch = html.match(downloadRegex);
    if (downloadMatch && downloadMatch[1]) {
      return downloadMatch[1].startsWith('http') ? downloadMatch[1] : `https://en.ephoto360.com${downloadMatch[1]}`;
    }
    
    // Try to find iframe source
    const iframeRegex = /<iframe[^>]+src="([^"]+)"/i;
    const iframeMatch = html.match(iframeRegex);
    if (iframeMatch && iframeMatch[1]) {
      return iframeMatch[1];
    }
    
    return null;
  } catch (error) {
    console.error("Extract video error:", error);
    return null;
  }
}

export default {
  name: "lightningpubg",
  aliases: ["pubgvideo", "pubglightning", "pubglogo", "pubgintro", "lightningpubgvideo"],
  category: "Generator",
  description: "Create lightning PUBG video logo with your text",
  
  async execute(sock, m, args, prefix) {
    const jid = m.key.remoteJid;
    const quoted = m.quoted;
    
    // Add loading reaction
    await sock.sendMessage(jid, {
      react: { text: '⏳', key: m.key }
    });

    try {
      if (args.length === 0) {
        return sock.sendMessage(jid, {
          text: `⚡ *LIGHTNING PUBG VIDEO LOGO*\n\n` +
                `📌 *Usage:* \`${prefix}lightningpubg text\`\n` +
                `📝 *Examples:*\n` +
                `• \`${prefix}lightningpubg WOLF\`\n` +
             ``
        }, { quoted: m });
      }

      // Get text from args or quoted message
      let text = "";
      if (args.length > 0) {
        text = args.join(" ").trim();
      } else if (quoted && quoted.text) {
        text = quoted.text.trim();
      }

      // Limit text length
      if (text.length > 25) {
        return sock.sendMessage(jid, { 
          text: "❌ Text is too long! Please use maximum 25 characters for better effect." 
        }, { quoted: m });
      }
      
      console.log(`⚡ [LIGHTNINGPUBG] Generating for: "${text}"`);
      
      // Send initial status
      const statusMsg = await sock.sendMessage(jid, { 
        text: `⚡ *Creating Lightning PUBG Video:*\n"${text}"\n⏳ *Generating epic effects...*` 
      }, { quoted: m });
      
      // Generate video
      let videoUrl = null;
      let apiUsed = "Ephoto360";
      
      // Try main API
      videoUrl = await ephotoApis.generateLightningPubgVideo(text);
      
      // If main API fails, try fallbacks
      if (!videoUrl) {
        console.log("⚠️ Main API failed, trying alternatives...");
        
        // Fallback 1: Use different PUBG effect
        try {
          const fallbackResponse = await axios.post(
            "https://ephoto360.com/effect/create-lightning-pubg-video",
            { text: text },
            { timeout: 20000 }
          );
          if (fallbackResponse.data?.url) {
            videoUrl = fallbackResponse.data.url;
            apiUsed = "Fallback API 1";
          }
        } catch (e) {}
        
        // Fallback 2: Use gaming video generator
        if (!videoUrl) {
          try {
            const fallback2 = await axios.get(
              `https://api.textpro.me/create-pubg-lightning-video?text=${encodeURIComponent(text)}`,
              { timeout: 15000 }
            );
            if (fallback2.data?.url) {
              videoUrl = fallback2.data.url;
              apiUsed = "TextPro API";
            }
          } catch (e) {}
        }
        
        // Fallback 3: Gaming logo API
        if (!videoUrl) {
          try {
            const fallback3 = await axios.get(
              `https://gaming-logo-api.vercel.app/lightning-pubg?text=${encodeURIComponent(text)}`,
              { timeout: 15000 }
            );
            if (fallback3.data?.url) {
              videoUrl = fallback3.data.url;
              apiUsed = "Gaming Logo API";
            }
          } catch (e) {}
        }
      }
      
      if (!videoUrl) {
        await sock.sendMessage(jid, { 
          text: `❌ Failed to generate lightning PUBG video for "${text}"\n\nPlease try:\n• Shorter text (max 25 chars)\n• Gaming related text\n• Try again later`,
          edit: statusMsg.key 
        });
        return;
      }
      
      console.log(`✅ Got video URL from ${apiUsed}`);
      
      // Update status
      await sock.sendMessage(jid, { 
        text: `⚡ *Creating Lightning PUBG Video:*\n"${text}" ✅\n⚡ *Adding lightning effects...*\n⬇️ *Downloading video...*`,
        edit: statusMsg.key 
      });
      
      // Download video
      const tempDir = path.join(__dirname, "../temp");
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
      
      const fileName = `lightning_pubg_${Date.now()}.mp4`;
      const tempFile = path.join(tempDir, fileName);
      
      try {
        // Download the video
        const response = await axios({
          url: videoUrl,
          method: 'GET',
          responseType: 'stream',
          timeout: 60000, // 1 minute for complex effects
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8',
            'Referer': 'https://en.ephoto360.com/'
          }
        });
        
        if (response.status !== 200) {
          throw new Error(`Download failed with status ${response.status}`);
        }
        
        const writer = fs.createWriteStream(tempFile);
        response.data.pipe(writer);
        
        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });
        
        // Check file
        const stats = fs.statSync(tempFile);
        const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
        
        if (stats.size === 0) {
          throw new Error("Generated video is empty");
        }
        
        if (fileSizeMB > 50) {
          console.log(`⚠️ Video too large: ${fileSizeMB}MB`);
          await sock.sendMessage(jid, { 
            text: `❌ Generated video is too large (${fileSizeMB}MB). Maximum is 50MB.`,
            edit: statusMsg.key 
          });
          fs.unlinkSync(tempFile);
          return;
        }
        
        const fileBuffer = fs.readFileSync(tempFile);
        
        // Send the video
        await sock.sendMessage(jid, {
          video: fileBuffer,
          caption: `⚡ *LIGHTNING PUBG VIDEO LOGO*\n📝 *Text:* ${text}\n`,
          mimetype: 'video/mp4',
          gifPlayback: false
        }, { quoted: m });
        
        // Clean up
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
          console.log(`🧹 Cleaned temp file: ${tempFile}`);
        }
        
        // Send completion message
        await sock.sendMessage(jid, { 
          text: `✅ *Lightning PUBG Video Created!*\n`,
          edit: statusMsg.key 
        });
        
        console.log(`✅ [LIGHTNINGPUBG] Success: "${text}" (${fileSizeMB}MB) via ${apiUsed}`);
        
      } catch (downloadError) {
        console.error("❌ [LIGHTNINGPUBG] Download error:", downloadError.message);
        
        // If download fails, send the direct URL
        await sock.sendMessage(jid, { 
          text: `❌ Couldn't download video. Here's the direct link:\n\n🔗 ${videoUrl}\n\n*Text:* ${text}\n*Source:* ${apiUsed}\n\n⚠️ Try downloading manually from the link`,
          edit: statusMsg.key 
        });
        
        if (fs.existsSync(tempFile)) {
          try { fs.unlinkSync(tempFile); } catch {}
        }
      }
      
    } catch (error) {
      console.error("❌ [LIGHTNINGPUBG] ERROR:", error);
      await sock.sendMessage(jid, { 
        text: `❌ Error generating lightning PUBG video:\n${error.message}` 
      }, { quoted: m });
    }
  }
};
