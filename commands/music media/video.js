import axios from "axios";
import yts from "yt-search";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const XWOLF_API = "https://apis.xwolf.space";
const KEITH_API = "https://apiskeith.top";

const downloadVideo = async (url) => {
  const endpoints = [
    { name: 'XWolf', url: `${XWOLF_API}/download/mp4?url=${encodeURIComponent(url)}` },
    { name: 'Keith-1', url: `${KEITH_API}/download/ytmp4?url=${encodeURIComponent(url)}` },
    { name: 'Keith-2', url: `${KEITH_API}/download/video?url=${encodeURIComponent(url)}` }
  ];
  for (const ep of endpoints) {
    try {
      const response = await axios.get(ep.url, { timeout: 20000 });
      const data = response.data;
      const dlUrl = data?.result?.download_url || data?.result?.url || data?.result || data?.download_url || data?.url;
      if (dlUrl && typeof dlUrl === 'string' && dlUrl.startsWith('http')) {
        console.log(`[VIDEO] Download success via: ${ep.name}`);
        return dlUrl;
      }
      if (data?.status && data?.result && typeof data.result === 'string') {
        console.log(`[VIDEO] Download success via: ${ep.name}`);
        return data.result;
      }
    } catch (error) {
      console.log(`[VIDEO] ${ep.name} failed: ${error.message}`);
      continue;
    }
  }
  return null;
};

export default {
  name: "video",
  aliases: ["vid"],
  description: "Download YouTube videos",
  async execute(sock, m, args, prefix) {
    const jid = m.key.remoteJid;

    try {
      if (args.length === 0) {
        return sock.sendMessage(jid, {
          text: `╭─⌈ 🎬 *VIDEO DOWNLOADER* ⌋\n│\n├─⊷ *${prefix}video <name/URL>*\n│  └⊷ Download video from YouTube\n│\n├─⊷ *Examples:*\n│  └⊷ ${prefix}video funny cats\n│  └⊷ ${prefix}video https://youtube.com/...\n│\n╰───`
        }, { quoted: m });
      }

      await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });

      let searchQuery = args.join(" ");

      if (!searchQuery) {
        return sock.sendMessage(jid, { 
          text: `╭─⌈ ❌ *NO QUERY PROVIDED* ⌋\n│\n├─⊷ *${prefix}video <name/URL>*\n│  └⊷ Example: ${prefix}video funny cats\n│\n╰───`
        }, { quoted: m });
      }

      let videoUrl = '';
      let videoTitle = '';
      let videoId = '';
      
      if (searchQuery.startsWith('http')) {
        videoUrl = searchQuery;
        videoId = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)?.[1] || '';
        
        try {
          if (videoId) {
            const { videos } = await yts({ videoId });
            if (videos && videos.length > 0) {
              videoTitle = videos[0].title;
            }
          }
        } catch (error) {
          videoTitle = "YouTube Video";
        }
      } else {
        try {
          const { videos: ytResults } = await yts(searchQuery);
          if (!ytResults || ytResults.length === 0) {
            await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
            return sock.sendMessage(jid, { 
              text: `❌ No videos found for "${searchQuery}"\nTry different keywords or direct link`
            }, { quoted: m });
          }
          videoUrl = ytResults[0].url;
          videoTitle = ytResults[0].title;
          videoId = ytResults[0].videoId;
        } catch (error) {
          await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
          return sock.sendMessage(jid, { 
            text: `❌ Search failed\nUse direct YouTube link`
          }, { quoted: m });
        }
      }

      await sock.sendMessage(jid, { react: { text: '📥', key: m.key } });

      let downloadUrl = await downloadVideo(videoUrl);
      
      if (!downloadUrl) {
        await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
        return sock.sendMessage(jid, { 
          text: `❌ Failed to get video download link\nTry again later`
        }, { quoted: m });
      }

      const tempDir = path.join(__dirname, "../temp");
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
      
      const tempFile = path.join(tempDir, `video_${Date.now()}.mp4`);
      
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

        const writer = fs.createWriteStream(tempFile);
        response.data.pipe(writer);
        
        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        const stats = fs.statSync(tempFile);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(1);
        
        if (stats.size === 0) {
          throw new Error("Downloaded file is empty");
        }
        
        if (parseFloat(fileSizeMB) > 99) {
          await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
          await sock.sendMessage(jid, { 
            text: `❌ Video too large (${fileSizeMB}MB)\nMax size: 99MB`
          }, { quoted: m });
          fs.unlinkSync(tempFile);
          return;
        }

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

        await sock.sendMessage(jid, {
          video: fs.readFileSync(tempFile),
          caption: `🎬 ${videoTitle}\n📦 ${fileSizeMB}MB`,
          mimetype: 'video/mp4',
          thumbnail: thumbnailBuffer
        }, { quoted: m });

        fs.unlinkSync(tempFile);

        await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });

      } catch (error) {
        await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
        await sock.sendMessage(jid, { 
          text: `❌ Download failed\nTry again later`
        }, { quoted: m });
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      }

    } catch (error) {
      console.error("Video error:", error);
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      await sock.sendMessage(jid, { 
        text: `❌ Error downloading video\nTry again later`
      }, { quoted: m });
    }
  }
};
