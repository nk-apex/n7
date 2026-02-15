import axios from "axios";
import yts from "yt-search";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KEITH_API = "https://apiskeith.top";

const videoEndpoints = [
  `${KEITH_API}/download/video`,
  `${KEITH_API}/download/ytmp4`
];

const keithDownloadVideo = async (url) => {
  for (const endpoint of videoEndpoints) {
    try {
      const response = await axios.get(
        `${endpoint}?url=${encodeURIComponent(url)}`,
        { timeout: 20000 }
      );
      if (response.data?.status && response.data?.result) {
        console.log(`[YTV] Download success via: ${endpoint}`);
        return response.data.result;
      }
    } catch (error) {
      console.log(`[YTV] Endpoint failed: ${endpoint} - ${error.message}`);
      continue;
    }
  }
  return null;
};

export default {
  name: "ytv",
  description: "Download YouTube videos",
  category: "Downloader",
  async execute(sock, m, args, prefix) {
    const jid = m.key.remoteJid;

    try {
      if (args.length === 0) {
        await sock.sendMessage(jid, { 
          text: `🎬 *YouTube Video Downloader*\n\n` +
                `📌 *Usage:* \`${prefix}ytv video name\`\n` +
                `📝 *Examples:*\n` +
                `• \`${prefix}ytv funny cats\`\n` +
                `• \`${prefix}ytv https://youtube.com/...\`\n\n` +
                `✨ Downloads video from YouTube`
        }, { quoted: m });
        return;
      }

      const searchQuery = args.join(" ");
      console.log(`🎬 [YTV] Request: ${searchQuery}`);

      await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });

      let videoUrl = '';
      let videoTitle = '';
      let videoId = '';
      
      if (searchQuery.match(/(youtube\.com|youtu\.be)/i)) {
        videoUrl = searchQuery;
        videoId = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)?.[1] || '';
        
        if (videoId) {
          try {
            const { videos } = await yts({ videoId });
            if (videos && videos.length > 0) {
              videoTitle = videos[0].title;
            }
          } catch (e) {}
        }
        if (!videoTitle) videoTitle = "YouTube Video";
      } else {
        try {
          const searchRes = await axios.get(
            `${KEITH_API}/search/yts?query=${encodeURIComponent(searchQuery)}`,
            { timeout: 10000 }
          );
          const videos = searchRes.data?.result || [];
          
          if (videos.length > 0) {
            videoUrl = videos[0].url;
            videoTitle = videos[0].title;
            videoId = videos[0].id || videos[0].videoId;
          } else {
            const { videos: ytResults } = await yts(searchQuery);
            if (!ytResults || ytResults.length === 0) {
              await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
              await sock.sendMessage(jid, { 
                text: `❌ No videos found for "${searchQuery}"`
              }, { quoted: m });
              return;
            }
            videoUrl = ytResults[0].url;
            videoTitle = ytResults[0].title;
            videoId = ytResults[0].videoId;
          }
        } catch (searchError) {
          console.error("❌ [YTV] Search error:", searchError);
          await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
          await sock.sendMessage(jid, { 
            text: `❌ Search failed. Try direct YouTube link.`
          }, { quoted: m });
          return;
        }
      }

      console.log(`🎬 [YTV] Found: ${videoTitle} - ${videoUrl}`);

      await sock.sendMessage(jid, { react: { text: '📥', key: m.key } });

      let downloadUrl = await keithDownloadVideo(videoUrl);

      if (!downloadUrl) {
        await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
        await sock.sendMessage(jid, { 
          text: `❌ Video download failed. Try again later.`
        }, { quoted: m });
        return;
      }

      const tempDir = path.join(__dirname, "../temp");
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
      
      const tempFile = path.join(tempDir, `ytv_${Date.now()}.mp4`);
      
      try {
        const response = await axios({
          url: downloadUrl,
          method: 'GET',
          responseType: 'stream',
          timeout: 120000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        if (response.status !== 200) {
          throw new Error(`Download failed with status: ${response.status}`);
        }

        const writer = fs.createWriteStream(tempFile);
        response.data.pipe(writer);
        
        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        const stats = fs.statSync(tempFile);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(1);

        if (stats.size === 0) throw new Error("Downloaded file is empty");

        if (parseFloat(fileSizeMB) > 99) {
          await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
          await sock.sendMessage(jid, { 
            text: `❌ Video too large: ${fileSizeMB}MB\nMax size: 99MB`
          }, { quoted: m });
          fs.unlinkSync(tempFile);
          return;
        }

        const videoBuffer = fs.readFileSync(tempFile);

        let thumbnailBuffer = null;
        if (videoId) {
          try {
            const thumbResponse = await axios.get(
              `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
              { responseType: 'arraybuffer', timeout: 10000 }
            );
            if (thumbResponse.status === 200) {
              thumbnailBuffer = Buffer.from(thumbResponse.data);
            }
          } catch (e) {}
        }

        const cleanTitle = videoTitle.replace(/[^\w\s.-]/gi, '').substring(0, 50);

        await sock.sendMessage(jid, {
          video: videoBuffer,
          mimetype: 'video/mp4',
          caption: `🎬 ${videoTitle}\n📦 ${fileSizeMB}MB`,
          fileName: `${cleanTitle}.mp4`,
          thumbnail: thumbnailBuffer,
          gifPlayback: false
        }, { quoted: m });

        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);

        await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });

        console.log(`✅ [YTV] Success: ${videoTitle} (${fileSizeMB}MB)`);

      } catch (downloadError) {
        console.error("❌ [YTV] Download error:", downloadError);
        await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
        await sock.sendMessage(jid, { 
          text: `❌ Failed to download video: ${downloadError.message}`
        }, { quoted: m });
        if (fs.existsSync(tempFile)) {
          try { fs.unlinkSync(tempFile); } catch {}
        }
      }

    } catch (error) {
      console.error("❌ [YTV] Fatal error:", error);
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      await sock.sendMessage(jid, { 
        text: `❌ Error: ${error.message}`
      }, { quoted: m });
    }
  },
};
