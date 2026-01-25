import axios from "axios";
import yts from "yt-search";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Keith API functions
const keithAPI = {
  search: async (query) => {
    try {
      const response = await axios.get(
        `https://apiskeith.vercel.app/search/yts?query=${encodeURIComponent(query)}`,
        { timeout: 10000 }
      );
      return response.data?.result || [];
    } catch (error) {
      console.error("Keith search error:", error.message);
      return [];
    }
  },
  
  downloadAudio: async (url) => {
    try {
      const response = await axios.get(
        `https://apiskeith.vercel.app/download/audio?url=${encodeURIComponent(url)}`,
        { timeout: 15000 }
      );
      return response.data?.result;
    } catch (error) {
      console.error("Keith download error:", error.message);
      return null;
    }
  }
};

export default {
  name: "song",
  aliases: ["music", "audio", "mp3", "ytmusic"],
  category: "Downloader",
  description: "Download YouTube audio with embedded thumbnail using Keith API",
  
  async execute(sock, m, args, prefix) {
    const jid = m.key.remoteJid;
    const quoted = m.quoted;
    
    // Check if no arguments provided
    if (args.length === 0) {
      return sock.sendMessage(jid, {
        text: `🎵 *SONG DOWNLOADER*\n\n` +
              `📌 *Usage:* \`${prefix}song song name\`\n` +
              `📝 *Examples:*\n` +
              `• \`${prefix}song Home by NF\`\n` +
              `• \`${prefix}song https://youtube.com/...\`\n` +
              `• \`${prefix}song Ed Sheeran Shape of You\`\n\n` +
              `✨ Downloads audio from YouTube using Keith API`
      }, { quoted: m });
    }
    
    let searchQuery = args.join(" ");
    
    // If quoted message has text, use it instead
    if (quoted && quoted.text) {
      searchQuery = quoted.text;
    }

    console.log(`🎵 [SONG] Query: "${searchQuery}"`);

    try {
      // Send initial status
      const statusMsg = await sock.sendMessage(jid, { 
        text: `🔍 *Searching:* "${searchQuery}"` 
      }, { quoted: m });

      // Determine if URL or search
      let videoUrl = '';
      let videoTitle = '';
      let thumbnail = '';
      let videoId = '';
      let author = '';
      let duration = '';

      if (searchQuery.match(/(youtube\.com|youtu\.be)/i)) {
        // Direct YouTube URL
        videoUrl = searchQuery;
        videoId = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)?.[1];
        
        if (!videoId) {
          await sock.sendMessage(jid, { 
            text: "❌ Invalid YouTube URL format.",
            edit: statusMsg.key 
          });
          return;
        }
        
        // Get video info
        try {
          const { videos } = await yts({ videoId });
          if (videos && videos.length > 0) {
            videoTitle = videos[0].title;
            author = videos[0].author?.name || 'Unknown Artist';
            duration = videos[0].timestamp || videos[0].duration || '';
            thumbnail = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
          } else {
            videoTitle = "YouTube Audio";
            thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
          }
        } catch (error) {
          videoTitle = "YouTube Audio";
          thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
        }
      } else {
        // Search for video using Keith API first
        try {
          const videos = await keithAPI.search(searchQuery);
          
          if (!videos || videos.length === 0) {
            // Fallback to yt-search
            const { videos: ytResults } = await yts(searchQuery);
            if (!ytResults || ytResults.length === 0) {
              await sock.sendMessage(jid, { 
                text: `❌ No songs found for "${searchQuery}"`,
                edit: statusMsg.key 
              });
              return;
            }
            
            const video = ytResults[0];
            videoUrl = video.url;
            videoTitle = video.title;
            author = video.author?.name || 'Unknown Artist';
            duration = video.timestamp || video.duration || '';
            videoId = video.videoId;
            thumbnail = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
          } else {
            // Use Keith API result
            const video = videos[0];
            videoUrl = video.url;
            videoTitle = video.title;
            author = video.author?.name || video.channel?.name || 'Unknown Artist';
            duration = video.timestamp || video.duration || '';
            videoId = video.videoId || video.id;
            thumbnail = video.thumbnail || `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
          }
          
        } catch (error) {
          console.error("Search error:", error);
          await sock.sendMessage(jid, { 
            text: `❌ Search failed: ${error.message}`,
            edit: statusMsg.key 
          });
          return;
        }
      }

      console.log(`🎵 [SONG] Selected: "${videoTitle}" | URL: ${videoUrl}`);

      // Update status
      await sock.sendMessage(jid, { 
        text: `✅ *Found:* "${videoTitle}"\n⬇️ *Downloading audio with Keith API...*`,
        edit: statusMsg.key 
      });

      // Use Keith API for download
      let downloadUrl = await keithAPI.downloadAudio(videoUrl);

      if (!downloadUrl) {
        console.error("❌ Keith API download failed");
        await sock.sendMessage(jid, { 
          text: `❌ Failed to get audio download link from Keith API. Please try another song or URL.`,
          edit: statusMsg.key 
        });
        return;
      }

      console.log(`✅ [SONG] Using Keith API for download`);
      
      // Update status
      await sock.sendMessage(jid, { 
        text: `✅ *Found:* "${videoTitle}"\n⬇️ *Downloading...* ✅\n📤 *Processing audio...*`,
        edit: statusMsg.key 
      });

      // Create temp directory
      const tempDir = path.join(__dirname, "../temp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Clean filename
      const cleanTitle = videoTitle.replace(/[^\w\s.-]/gi, '').substring(0, 50);
      const fileName = `${cleanTitle}.mp3`;
      const tempFile = path.join(tempDir, `song_${Date.now()}_${Math.random().toString(36).substring(7)}.mp3`);

      // Download audio file
      try {
        // Download file
        const response = await axios({
          url: downloadUrl,
          method: 'GET',
          responseType: 'stream',
          timeout: 60000, // 1 minute timeout
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'audio/mpeg, audio/*'
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

        // Check file size and validity
        const stats = fs.statSync(tempFile);
        const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
        
        if (stats.size === 0) {
          throw new Error("Downloaded file is empty");
        }
        
        if (fileSizeMB > 50) {
          console.log(`⚠️ File too large: ${fileSizeMB}MB`);
          await sock.sendMessage(jid, { 
            text: `❌ File too large (${fileSizeMB}MB). Maximum size is 50MB.`,
            edit: statusMsg.key 
          });
          fs.unlinkSync(tempFile);
          return;
        }

        const fileBuffer = fs.readFileSync(tempFile);

        // Get thumbnail
        let thumbnailBuffer = null;
        try {
          // Try maxres thumbnail first, fallback to hqdefault
          const thumbUrls = [
            `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
            `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            `https://i.ytimg.com/vi/${videoId}/sddefault.jpg`
          ];
          
          for (const thumbUrl of thumbUrls) {
            try {
              const thumbResponse = await axios.get(thumbUrl, {
                responseType: 'arraybuffer',
                timeout: 10000
              });
              if (thumbResponse.status === 200) {
                thumbnailBuffer = Buffer.from(thumbResponse.data);
                break;
              }
            } catch (e) {
              continue;
            }
          }
        } catch (thumbError) {
          console.log("⚠️ Could not fetch thumbnail");
        }

        // Prepare message with embedded thumbnail
        const contextInfo = {
          externalAdReply: {
            title: videoTitle.substring(0, 60),
            body: `🎵 ${author}${duration ? ` | ⏱️ ${duration}` : ''} | Powered by Keith API`,
            mediaType: 2, // Audio message type
            sourceUrl: videoUrl,
            thumbnail: thumbnailBuffer,
            mediaUrl: videoUrl,
            renderLargerThumbnail: true
          }
        };

        // Send as audio message with thumbnail
        await sock.sendMessage(jid, {
          audio: fileBuffer,
          mimetype: 'audio/mpeg',
          ptt: false,
          fileName: fileName,
          contextInfo: contextInfo
        }, { quoted: m });

        // Clean up temp file
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
          console.log(`🧹 Cleaned temp file: ${tempFile}`);
        }

        // Send success message
        await sock.sendMessage(jid, { 
         // text: `✅ *Download Complete!*\n``,
          edit: statusMsg.key 
        });

        console.log(`✅ [SONG] Success: "${videoTitle}" (${fileSizeMB}MB) via Keith API`);

      } catch (downloadError) {
        console.error("❌ [SONG] Download error:", downloadError.message);
        await sock.sendMessage(jid, { 
          text: `❌ Failed to download audio: ${downloadError.message}`,
          edit: statusMsg.key 
        });
        if (fs.existsSync(tempFile)) {
          try { fs.unlinkSync(tempFile); } catch {}
        }
      }

    } catch (error) {
      console.error("❌ [SONG] ERROR:", error);
      await sock.sendMessage(jid, { 
        text: `❌ Error: ${error.message}` 
      }, { quoted: m });
    }
  }
};
