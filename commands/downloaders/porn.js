import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Wolf-related APIs (educational/scientific wolf content)
const wolfApis = {
  keith: {
    searchWolf: async (query) => {
      try {
        const response = await axios.get(
          `https://apiskeith.vercel.app/search/yts?query=${encodeURIComponent(query + " wolf documentary")}`,
          { timeout: 10000 }
        );
        return response.data?.result || [];
      } catch (error) {
        console.error("Keith wolf search error:", error.message);
        return [];
      }
    },
    downloadVideo: async (url) => {
      try {
        const response = await axios.get(
          `https://apiskeith.vercel.app/download/video?url=${encodeURIComponent(url)}`,
          { timeout: 15000 }
        );
        return response.data?.result;
      } catch (error) {
        console.error("Keith download error:", error.message);
        return null;
      }
    }
  },
  
  // Alternative video download APIs
  y2mate: {
    downloadVideo: async (url) => {
      try {
        const response = await axios.get(
          `https://api.beautyofweb.com/y2mate?url=${encodeURIComponent(url)}&type=mp4`,
          { timeout: 15000 }
        );
        return response.data?.result?.video?.url;
      } catch (error) {
        console.error("Y2Mate error:", error.message);
        return null;
      }
    }
  },
  
  // Wolf facts API
  wolfFacts: {
    getRandomFact: async () => {
      try {
        const response = await axios.get(
          "https://some-random-api.ml/facts/wolf",
          { timeout: 5000 }
        );
        return response.data?.fact;
      } catch (error) {
        console.error("Wolf facts error:", error.message);
        return null;
      }
    },
    
    getWolfImage: async () => {
      try {
        const response = await axios.get(
          "https://some-random-api.ml/img/wolf",
          { timeout: 5000 }
        );
        return response.data?.link;
      } catch (error) {
        console.error("Wolf image error:", error.message);
        return null;
      }
    }
  }
};

export default {
  name: "porn",
  aliases: ["wolves", "wolfvideo", "wolfdoc", "wolfdocumentary"],
  category: "Animal",
  description: "Search and download wolf documentaries/educational videos",
  
  async execute(sock, m, args) {
    const jid = m.key.remoteJid;
    const quoted = m.quoted;
    let searchQuery = "";
    
    // Get search query
    if (args.length > 0) {
      searchQuery = args.join(" ").trim();
    } else if (quoted && quoted.text) {
      searchQuery = quoted.text.trim();
    } else {
      const helpText = 
        `🐺 *WOLF VIDEO DOWNLOADER*\n\n` +
        `📌 *Usage:* \`.wolf search query\`\n` +
        `📝 *Examples:*\n` +
        `• \`porn documentary\`\n` +
        `• \`.wolf hunting\`\n` +
        `• \`.wolf pack behavior\`\n` +
        `• \`.wolf https://youtube.com/...\`\n\n` +
        `✨ Downloads educational wolf content from YouTube`;
      
      await sock.sendMessage(jid, { text: helpText }, { quoted: m });
      return;
    }
    
    console.log(`🐺 [WOLF] Searching for: "${searchQuery}"`);
    
    try {
      // Send initial status
      const statusMsg = await sock.sendMessage(jid, { 
        text: `🔍 *Searching wolf content:* "${searchQuery}"` 
      }, { quoted: m });
      
      let videoUrl = '';
      let videoTitle = '';
      let videoDescription = '';
      let thumbnail = '';
      let duration = '';
      
      // Determine if it's a URL or search query
      if (searchQuery.match(/(youtube\.com|youtu\.be)/i)) {
        // Direct YouTube URL
        videoUrl = searchQuery;
        videoTitle = "Wolf Video";
        thumbnail = `https://i.ytimg.com/vi/${searchQuery.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)?.[1]}/maxresdefault.jpg`;
      } else {
        // Search for wolf content
        const wolfVideos = await wolfApis.keith.searchWolf(searchQuery);
        
        if (!wolfVideos || wolfVideos.length === 0) {
          // Try alternative search
          try {
            const searchTerms = [
              `${searchQuery} wolf documentary`,
              `${searchQuery} wolves`,
              `wolf ${searchQuery}`,
              `wolves ${searchQuery}`
            ];
            
            for (const term of searchTerms) {
              const response = await axios.get(
                `https://apiskeith.vercel.app/search/yts?query=${encodeURIComponent(term)}`,
                { timeout: 10000 }
              );
              if (response.data?.result?.length > 0) {
                const videos = response.data.result;
                // Filter for educational content
                const educationalVideos = videos.filter(video => 
                  !video.title.match(/fight|attack|violence|blood|kill|dead|hunt/g) ||
                  video.title.match(/documentary|national geographic|educational|science|nature/i)
                );
                
                if (educationalVideos.length > 0) {
                  videoUrl = educationalVideos[0].url;
                  videoTitle = educationalVideos[0].title;
                  videoDescription = educationalVideos[0].description || '';
                  thumbnail = educationalVideos[0].thumbnail;
                  duration = educationalVideos[0].timestamp || educationalVideos[0].duration || '';
                  break;
                } else if (videos.length > 0) {
                  // Fallback to first result if no educational content found
                  videoUrl = videos[0].url;
                  videoTitle = videos[0].title;
                  videoDescription = videos[0].description || '';
                  thumbnail = videos[0].thumbnail;
                  duration = videos[0].timestamp || videos[0].duration || '';
                  break;
                }
              }
            }
          } catch (searchError) {
            console.error("Alternative search error:", searchError.message);
          }
        } else {
          // Use Keith API results
          const firstVideo = wolfVideos[0];
          videoUrl = firstVideo.url;
          videoTitle = firstVideo.title;
          videoDescription = firstVideo.description || '';
          thumbnail = firstVideo.thumbnail;
          duration = firstVideo.timestamp || firstVideo.duration || '';
        }
        
        if (!videoUrl) {
          await sock.sendMessage(jid, { 
            text: `❌ No wolf content found for "${searchQuery}"\n\nTry:\n• Different search terms\n• More specific queries\n• Direct YouTube URL`,
            edit: statusMsg.key 
          });
          return;
        }
      }
      
      console.log(`🐺 [WOLF] Found: "${videoTitle}" | URL: ${videoUrl}`);
      
      // Update status
      await sock.sendMessage(jid, { 
        text: `✅ *Found:* "${videoTitle}"\n⏱️ *Duration:* ${duration || 'N/A'}\n⬇️ *Downloading...*`,
        edit: statusMsg.key 
      });
      
      // Try multiple download sources
      let downloadUrl = null;
      let apiUsed = "";
      
      // Priority 1: Keith API
      downloadUrl = await wolfApis.keith.downloadVideo(videoUrl);
      if (downloadUrl) apiUsed = "Keith API";
      
      // Priority 2: Y2Mate
      if (!downloadUrl) {
        console.log("⚠️ Keith failed, trying Y2Mate...");
        downloadUrl = await wolfApis.y2mate.downloadVideo(videoUrl);
        if (downloadUrl) apiUsed = "Y2Mate API";
      }
      
      // Priority 3: Alternative download
      if (!downloadUrl) {
        console.log("⚠️ Y2Mate failed, trying alternatives...");
        try {
          const response = await axios.get(
            `https://api.beautyofweb.com/y2mate?url=${encodeURIComponent(videoUrl)}&type=mp4`,
            { timeout: 15000 }
          );
          if (response.data?.result?.video?.url) {
            downloadUrl = response.data.result.video.url;
            apiUsed = "Alternative API";
          }
        } catch (error) {
          console.error("Alternative download error:", error.message);
        }
      }
      
      if (!downloadUrl) {
        console.error("❌ All download methods failed");
        await sock.sendMessage(jid, { 
          text: `❌ Failed to get download link for "${videoTitle}"\n\nHere's the direct link:\n🔗 ${videoUrl}`,
          edit: statusMsg.key 
        });
        return;
      }
      
      console.log(`✅ [WOLF] Using ${apiUsed} for download`);
      
      // Update status
      await sock.sendMessage(jid, { 
        text: `✅ *Found:* "${videoTitle}" ✅\n⬇️ *Downloading...* ✅\n🎬 *Processing video...*`,
        edit: statusMsg.key 
      });
      
      // Create temp directory
      const tempDir = path.join(__dirname, "../temp");
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
      
      // Clean filename
      const fileName = `${videoTitle.replace(/[^\w\s.-]/gi, '').substring(0, 50)}.mp4`;
      const tempFile = path.join(tempDir, `wolf_${Date.now()}_${Math.random().toString(36).substring(7)}.mp4`);
      
      // Download video
      try {
        const response = await axios({
          url: downloadUrl,
          method: 'GET',
          responseType: 'stream',
          timeout: 120000, // 2 minutes
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8'
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
          throw new Error("Downloaded file is empty");
        }
        
        if (fileSizeMB > 100) {
          console.log(`⚠️ File too large: ${fileSizeMB}MB`);
          await sock.sendMessage(jid, { 
            text: `❌ Video too large (${fileSizeMB}MB). Maximum size is 100MB.\n\nHere's the direct link:\n🔗 ${videoUrl}`,
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
          if (thumbResponse.status === 200) {
            thumbnailBuffer = Buffer.from(thumbResponse.data);
          }
        } catch (thumbError) {
          console.log("⚠️ Could not fetch thumbnail:", thumbError.message);
        }
        
        // Get wolf fact
        let wolfFact = null;
        try {
          wolfFact = await wolfApis.wolfFacts.getRandomFact();
        } catch (factError) {
          console.log("⚠️ Could not get wolf fact");
        }
        
        // Prepare caption
        let caption = `🐺 *${videoTitle}*\n\n`;
        
        if (duration) {
          caption += `⏱️ *Duration:* ${duration}\n`;
        }
        
        caption += `📦 *Size:* ${fileSizeMB}MB\n`;
        caption += `🔧 *Source:* ${apiUsed}\n`;
        
        if (wolfFact) {
          caption += `\n📚 *Wolf Fact:* ${wolfFact}\n`;
        }
        
        if (videoDescription && videoDescription.length < 200) {
          caption += `\n📝 *Description:* ${videoDescription.substring(0, 150)}...`;
        }
        
        // Send video
        await sock.sendMessage(jid, {
          video: fileBuffer,
          caption: caption,
          mimetype: 'video/mp4',
          thumbnail: thumbnailBuffer,
          fileName: fileName
        }, { quoted: m });
        
        // Clean up
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
          console.log(`🧹 Cleaned temp file: ${tempFile}`);
        }
        
        // Send success message
        await sock.sendMessage(jid, { 
          text: `✅ *Wolf Video Downloaded!*\n\n🐺 *Title:* ${videoTitle}\n📦 *Size:* ${fileSizeMB}MB\n⏱️ *Duration:* ${duration || 'N/A'}\n🔧 *Source:* ${apiUsed}`,
          edit: statusMsg.key 
        });
        
        console.log(`✅ [WOLF] Success: "${videoTitle}" (${fileSizeMB}MB) via ${apiUsed}`);
        
      } catch (downloadError) {
        console.error("❌ [WOLF] Download error:", downloadError.message);
        await sock.sendMessage(jid, { 
          text: `❌ Failed to download video: ${downloadError.message}\n\nHere's the direct link:\n🔗 ${videoUrl}`,
          edit: statusMsg.key 
        });
        if (fs.existsSync(tempFile)) {
          try { fs.unlinkSync(tempFile); } catch {}
        }
      }
      
    } catch (error) {
      console.error("❌ [WOLF] ERROR:", error);
      await sock.sendMessage(jid, { 
        text: `❌ Error: ${error.message}` 
      }, { quoted: m });
    }
  }
};