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
  name: "play",
  aliases: ["ytmp3", "ytmp3doc", "audiodoc", "yta", "ytplay", "music"],
  category: "Downloader",
  description: "Download YouTube audio with Keith API",
  
  async execute(sock, m, args, prefix) {
    const jid = m.key.remoteJid;
    const quoted = m.quoted;
    let searchQuery = "";
    
    // Parse arguments
    const flags = {
      doc: args.includes('doc') || args.includes('document'),
      audio: args.includes('audio') || !args.includes('doc'),
      list: args.includes('list') || args.includes('search'),
      video: args.includes('video') || args.includes('vid'),
      quality: args.find(arg => ['128', '192', '256', '320'].includes(arg)) || '128'
    };
    
    // Filter out flags from query
    const queryArgs = args.filter(arg => 
      !['doc', 'document', 'audio', 'list', 'search', 'video', 'vid', '128', '192', '256', '320'].includes(arg)
    );
    
    // Get search query
    if (queryArgs.length > 0) {
      searchQuery = queryArgs.join(" ");
    } else if (quoted && quoted.text) {
      searchQuery = quoted.text;
    } else if (args.length === 0) {
      return sock.sendMessage(jid, {
        text: `🎵 *PLAY COMMAND*\n\n` +
              `📌 *Usage:* \`${prefix}play song name\`\n` +
              `📝 *Examples:*\n` +
              `• \`${prefix}play Home by NF\`\n` +
              `• \`${prefix}play https://youtube.com/...\`\n` +
              `• \`${prefix}play Ed Sheeran Shape of You\`\n\n` +
              `✨ Downloads audio from YouTube using Keith API`
      }, { quoted: m });
    }

    console.log(`🎵 [PLAY] Query: "${searchQuery}"`);

    try {
      // LIST/SEARCH MODE
      if (flags.list) {
        const listQuery = searchQuery.replace('list', '').replace('search', '').trim();
        if (!listQuery) {
          await sock.sendMessage(jid, { 
            text: "Please specify search query. Example: .play list Ed Sheeran" 
          }, { quoted: m });
          return;
        }

        const statusMsg = await sock.sendMessage(jid, { 
          text: `🔍 *Searching:* "${listQuery}"` 
        }, { quoted: m });

        let videos = [];
        
        // Use Keith API for search
        videos = await keithAPI.search(listQuery);
        
        // Fallback to yt-search if Keith API fails
        if (!videos || videos.length === 0) {
          try {
            const { videos: ytResults } = await yts(listQuery);
            videos = ytResults || [];
          } catch (error) {
            console.error("YT search error:", error);
          }
        }

        if (videos.length === 0) {
          await sock.sendMessage(jid, { 
            text: `❌ No results found for "${listQuery}"`,
            edit: statusMsg.key 
          });
          return;
        }

        // Create list message
        let listText = `🔍 *Search Results:* "${listQuery}"\n\n`;
        videos.slice(0, 10).forEach((video, index) => {
          const title = video.title || "Unknown Title";
          const author = video.author?.name || video.channel?.name || 'Unknown';
          const duration = video.timestamp || video.duration || 'N/A';
          const url = video.url || `https://youtube.com/watch?v=${video.videoId || video.id}`;
          
          listText += `${index + 1}. ${title}\n`;
          listText += `   👤 ${author}\n`;
          listText += `   ⏱️ ${duration}\n`;
          listText += `   📺 .play ${url}\n\n`;
        });

        listText += `\n*Usage:* Reply with number (1-10) or use .play <URL>`;
        
        await sock.sendMessage(jid, { 
          text: listText,
          edit: statusMsg.key 
        });
        return;
      }

      // DOWNLOAD MODE
      const statusMsg = await sock.sendMessage(jid, { 
        text: `🔍 *Processing:* "${searchQuery}"` 
      }, { quoted: m });

      // Determine if URL or search
      let videoUrl = '';
      let videoTitle = '';
      let thumbnail = '';
      let videoId = '';

      if (searchQuery.match(/(youtube\.com|youtu\.be)/i)) {
        videoUrl = searchQuery;
        videoId = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)?.[1];
        if (!videoId) {
          await sock.sendMessage(jid, { 
            text: "❌ Invalid YouTube URL format.",
            edit: statusMsg.key 
          });
          return;
        }
        videoTitle = "YouTube Audio";
        thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
      } else {
        // Search for video using Keith API
        try {
          const videos = await keithAPI.search(searchQuery);
          if (!videos || videos.length === 0) {
            // Fallback to yt-search
            const { videos: ytResults } = await yts(searchQuery);
            if (!ytResults || ytResults.length === 0) {
              await sock.sendMessage(jid, { 
                text: `❌ No results found for "${searchQuery}"`,
                edit: statusMsg.key 
              });
              return;
            }
            videoUrl = ytResults[0].url;
            videoTitle = ytResults[0].title;
            thumbnail = ytResults[0].thumbnail;
            videoId = ytResults[0].videoId;
          } else {
            videoUrl = videos[0].url;
            videoTitle = videos[0].title;
            thumbnail = videos[0].thumbnail;
            videoId = videos[0].videoId || videos[0].id;
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

      console.log(`🎵 [PLAY] Selected: "${videoTitle}" | URL: ${videoUrl}`);

      await sock.sendMessage(jid, { 
        text: `🔍 *Found:* "${videoTitle}" ✅\n⬇️ *Downloading with Keith API...*`,
        edit: statusMsg.key 
      });

      // Use Keith API for download
      let downloadUrl = await keithAPI.downloadAudio(videoUrl);
      
      if (!downloadUrl) {
        console.error("❌ Keith API download failed");
        await sock.sendMessage(jid, { 
          text: `❌ Download failed. Please try:\n1. Another song/video\n2. Direct YouTube URL\n3. Try again later`,
          edit: statusMsg.key 
        });
        return;
      }

      console.log(`✅ [PLAY] Using Keith API for download`);
      
      await sock.sendMessage(jid, { 
        text: `🔍 *Found:* "${videoTitle}" ✅\n⬇️ *Downloading...* ✅\n📤 *Processing file...*`,
        edit: statusMsg.key 
      });

      // Create temp directory
      const tempDir = path.join(__dirname, "../temp");
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
      
      // Clean filename
      const fileName = `${videoTitle.replace(/[^\w\s.-]/gi, '').substring(0, 50)}.mp3`;
      const tempFile = path.join(tempDir, `play_${Date.now()}_${Math.random().toString(36).substring(7)}.mp3`);

      // Download and process file
      try {
        // Download file
        const response = await axios({
          url: downloadUrl,
          method: 'GET',
          responseType: 'stream',
          timeout: 45000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
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

        // Check file size
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
          const thumbResponse = await axios.get(thumbnail, {
            responseType: 'arraybuffer',
            timeout: 10000
          });
          thumbnailBuffer = Buffer.from(thumbResponse.data);
        } catch (thumbError) {
          console.log("⚠️ Could not fetch thumbnail");
        }

        // Prepare context info
        const contextInfo = {
          externalAdReply: {
            title: videoTitle.substring(0, 60),
            body: 'Powered by Keith API',
            mediaType: 1,
            sourceUrl: videoUrl,
            thumbnail: thumbnailBuffer,
            renderLargerThumbnail: true
          }
        };

        // Send audio stream
        await sock.sendMessage(jid, {
          audio: fileBuffer,
          mimetype: "audio/mpeg",
          fileName: fileName,
          contextInfo: contextInfo
        }, { quoted: m });

        // Send document stream
        await sock.sendMessage(jid, {
          document: fileBuffer,
          mimetype: "audio/mpeg",
          fileName: fileName,
          contextInfo: {
            ...contextInfo,
            externalAdReply: {
              ...contextInfo.externalAdReply,
              body: 'Document version - Powered by Keith API'
            }
          }
        }, { quoted: m });

        // Clean up
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
          console.log(`🧹 Cleaned temp file: ${tempFile}`);
        }

        await sock.sendMessage(jid, { 
          text: `✅ *Download Complete!*\n\n"${videoTitle}"\n📦 Size: ${fileSizeMB}MB\n📤 Format: Audio & Document\n🔧 API: Keith API`,
          edit: statusMsg.key 
        });

        console.log(`✅ [PLAY] Success: "${videoTitle}" (${fileSizeMB}MB) via Keith API`);

      } catch (downloadError) {
        console.error("❌ [PLAY] Download error:", downloadError.message);
        await sock.sendMessage(jid, { 
          text: `❌ Failed to process file: ${downloadError.message}`,
          edit: statusMsg.key 
        });
        if (fs.existsSync(tempFile)) {
          try { fs.unlinkSync(tempFile); } catch {}
        }
      }

    } catch (error) {
      console.error("❌ [PLAY] ERROR:", error);
      await sock.sendMessage(jid, { 
        text: `❌ Error: ${error.message}` 
      }, { quoted: m });
    }
  },
  
  // Helper function to format duration
  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
};
