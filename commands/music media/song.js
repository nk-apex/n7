import axios from "axios";
import yts from "yt-search";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KEITH_API = "https://apiskeith.top";

const audioEndpoints = [
  `${KEITH_API}/download/audio`,
  `${KEITH_API}/download/ytmp3`,
  `${KEITH_API}/download/dlmp3`,
  `${KEITH_API}/download/mp3`,
  `${KEITH_API}/download/yta`,
  `${KEITH_API}/download/yta2`,
  `${KEITH_API}/download/yta3`
];

const keithSearch = async (query) => {
  try {
    const response = await axios.get(
      `${KEITH_API}/search/yts?query=${encodeURIComponent(query)}`,
      { timeout: 10000 }
    );
    return response.data?.result || [];
  } catch (error) {
    console.error("Keith search error:", error.message);
    return [];
  }
};

const keithDownloadAudio = async (url) => {
  for (const endpoint of audioEndpoints) {
    try {
      const response = await axios.get(
        `${endpoint}?url=${encodeURIComponent(url)}`,
        { timeout: 15000 }
      );
      if (response.data?.status && response.data?.result) {
        console.log(`[SONG] Download success via: ${endpoint}`);
        return response.data.result;
      }
    } catch (error) {
      console.log(`[SONG] Endpoint failed: ${endpoint} - ${error.message}`);
      continue;
    }
  }
  return null;
};

export default {
  name: "song",
  aliases: ["music", "audio", "mp3", "ytmusic"],
  category: "Downloader",
  description: "Download YouTube audio with embedded thumbnail using Keith API",
  
  async execute(sock, m, args, prefix) {
    const jid = m.key.remoteJid;
    const quoted = m.quoted;
    
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
    
    if (quoted && quoted.text) {
      searchQuery = quoted.text;
    }

    console.log(`🎵 [SONG] Query: "${searchQuery}"`);

    try {
      await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });

      let videoUrl = '';
      let videoTitle = '';
      let videoId = '';
      let author = '';
      let duration = '';

      if (searchQuery.match(/(youtube\.com|youtu\.be)/i)) {
        videoUrl = searchQuery;
        videoId = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)?.[1];
        
        if (!videoId) {
          await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
          await sock.sendMessage(jid, { 
            text: "❌ Invalid YouTube URL format."
          }, { quoted: m });
          return;
        }
        
        try {
          const { videos } = await yts({ videoId });
          if (videos && videos.length > 0) {
            videoTitle = videos[0].title;
            author = videos[0].author?.name || 'Unknown Artist';
            duration = videos[0].timestamp || videos[0].duration || '';
          } else {
            videoTitle = "YouTube Audio";
          }
        } catch (error) {
          videoTitle = "YouTube Audio";
        }
      } else {
        try {
          const videos = await keithSearch(searchQuery);
          
          if (videos && videos.length > 0) {
            const video = videos[0];
            videoUrl = video.url;
            videoTitle = video.title;
            author = video.author?.name || video.channel?.name || 'Unknown Artist';
            duration = video.duration || '';
            videoId = video.id || video.videoId;
          } else {
            const { videos: ytResults } = await yts(searchQuery);
            if (!ytResults || ytResults.length === 0) {
              await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
              await sock.sendMessage(jid, { 
                text: `❌ No songs found for "${searchQuery}"`
              }, { quoted: m });
              return;
            }
            
            const video = ytResults[0];
            videoUrl = video.url;
            videoTitle = video.title;
            author = video.author?.name || 'Unknown Artist';
            duration = video.timestamp || video.duration || '';
            videoId = video.videoId;
          }
          
        } catch (error) {
          console.error("Search error:", error);
          await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
          await sock.sendMessage(jid, { 
            text: `❌ Search failed: ${error.message}`
          }, { quoted: m });
          return;
        }
      }

      if (!videoId) {
        videoId = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)?.[1] || '';
      }

      console.log(`🎵 [SONG] Selected: "${videoTitle}" | URL: ${videoUrl}`);

      await sock.sendMessage(jid, { react: { text: '📥', key: m.key } });

      let downloadUrl = await keithDownloadAudio(videoUrl);

      if (!downloadUrl) {
        console.error("❌ All Keith API audio endpoints failed");
        await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
        await sock.sendMessage(jid, { 
          text: `❌ Failed to get audio download link. Please try another song or URL.`
        }, { quoted: m });
        return;
      }

      const tempDir = path.join(__dirname, "../temp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const cleanTitle = videoTitle.replace(/[^\w\s.-]/gi, '').substring(0, 50);
      const fileName = `${cleanTitle}.mp3`;
      const tempFile = path.join(tempDir, `song_${Date.now()}_${Math.random().toString(36).substring(7)}.mp3`);

      try {
        const response = await axios({
          url: downloadUrl,
          method: 'GET',
          responseType: 'stream',
          timeout: 60000,
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

        const stats = fs.statSync(tempFile);
        const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
        
        if (stats.size === 0) {
          throw new Error("Downloaded file is empty");
        }
        
        if (fileSizeMB > 50) {
          console.log(`⚠️ File too large: ${fileSizeMB}MB`);
          await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
          await sock.sendMessage(jid, { 
            text: `❌ File too large (${fileSizeMB}MB). Maximum size is 50MB.`
          }, { quoted: m });
          fs.unlinkSync(tempFile);
          return;
        }

        const fileBuffer = fs.readFileSync(tempFile);

        let thumbnailBuffer = null;
        if (videoId) {
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
              if (thumbResponse.status === 200 && thumbResponse.data.length > 1000) {
                thumbnailBuffer = Buffer.from(thumbResponse.data);
                break;
              }
            } catch (e) {
              continue;
            }
          }
        }

        const contextInfo = {
          externalAdReply: {
            title: videoTitle.substring(0, 60),
            body: `🎵 ${author}${duration ? ` | ⏱️ ${duration}` : ''} | Powered by Keith API`,
            mediaType: 2,
            sourceUrl: videoUrl,
            thumbnail: thumbnailBuffer,
            mediaUrl: videoUrl,
            renderLargerThumbnail: true
          }
        };

        await sock.sendMessage(jid, {
          audio: fileBuffer,
          mimetype: 'audio/mpeg',
          ptt: false,
          fileName: fileName,
          contextInfo: contextInfo
        }, { quoted: m });

        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }

        await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });

        console.log(`✅ [SONG] Success: "${videoTitle}" (${fileSizeMB}MB) via Keith API`);

      } catch (downloadError) {
        console.error("❌ [SONG] Download error:", downloadError.message);
        await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
        await sock.sendMessage(jid, { 
          text: `❌ Failed to download audio: ${downloadError.message}`
        }, { quoted: m });
        if (fs.existsSync(tempFile)) {
          try { fs.unlinkSync(tempFile); } catch {}
        }
      }

    } catch (error) {
      console.error("❌ [SONG] ERROR:", error);
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      await sock.sendMessage(jid, { 
        text: `❌ Error: ${error.message}` 
      }, { quoted: m });
    }
  }
};
