import axios from "axios";
import crypto from "crypto";
import yts from "yt-search";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple download function
const downloadVideo = async (url, quality = '360') => {
  const formats = ['144', '240', '360', '480', '720', '1080'];
  const selectedQuality = formats.includes(quality) ? quality : '360';
  
  try {
    // Extract video ID
    const getId = (link) => {
      const patterns = [
        /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
        /youtu\.be\/([a-zA-Z0-9_-]{11})/
      ];
      for (let pattern of patterns) {
        if (pattern.test(link)) return link.match(pattern)[1];
      }
      return null;
    };
    
    const videoId = getId(url);
    if (!videoId) throw new Error('Invalid YouTube URL');
    
    // Try simple APIs for download
    const apis = [
      `https://apiskeith.vercel.app/download/video?url=${encodeURIComponent(url)}`,
      `https://api.yupra.my.id/api/downloader/ytmp4?url=${encodeURIComponent(url)}`,
      `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp4?url=${encodeURIComponent(url)}`
    ];
    
    let downloadUrl = null;
    
    for (const api of apis) {
      try {
        const response = await axios.get(api, { timeout: 15000 });
        
        if (api.includes('apiskeith') && response.data?.result) {
          downloadUrl = response.data.result;
          break;
        } else if (api.includes('yupra') && response.data?.data?.download_url) {
          downloadUrl = response.data.data.download_url;
          break;
        } else if (api.includes('okatsu') && response.data?.result?.mp4) {
          downloadUrl = response.data.result.mp4;
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    if (!downloadUrl) throw new Error('No download link found');
    
    return {
      downloadUrl: downloadUrl,
      quality: selectedQuality
    };
    
  } catch (error) {
    throw new Error(error.message);
  }
};

export default {
  name: "video",
  aliases: ["vid", "ytv"],
  description: "Download YouTube videos",
  async execute(sock, m, args, prefix) {
    const jid = m.key.remoteJid;

    try {
      if (args.length === 0) {
        return sock.sendMessage(jid, {
          text: `🎬 *VIDEO DOWNLOADER*\n\n` +
                `📌 *Usage:* \`${prefix}video song name\`\n` +
                `📝 *Examples:*\n` +
                `• \`${prefix}video funny cats\`\n` +
                `• \`${prefix}video https://youtube.com/...\`\n` +
                `• \`${prefix}video 720 trending videos\`\n\n` +
                `✨ Downloads video from YouTube\n` +
                `📊 Qualities: 144, 240, 360, 480, 720, 1080`
        }, { quoted: m });
      }

      // Add loading reaction
      await sock.sendMessage(jid, {
        react: { text: '⏳', key: m.key }
      });

      let quality = '360';
      let searchQuery = args.join(" ");
      
      // Check for quality argument
      const qualities = ['144', '240', '360', '480', '720', '1080'];
      if (qualities.includes(args[0])) {
        quality = args[0];
        searchQuery = args.slice(1).join(" ");
      }

      if (!searchQuery) {
        return sock.sendMessage(jid, { 
          text: `❌ Please provide video name or URL\nExample: ${prefix}video funny cats`
        }, { quoted: m });
      }

      // Send initial message
      const statusMsg = await sock.sendMessage(jid, { 
        text: `🔍 *Searching:* "${searchQuery}"\n📊 *Quality:* ${quality}p` 
      }, { quoted: m });

      // Check if it's a URL or search term
      let videoUrl = '';
      let videoTitle = '';
      
      if (searchQuery.startsWith('http')) {
        videoUrl = searchQuery;
        
        // Get video title
        try {
          const videoId = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1];
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
        // Search YouTube
        try {
          await sock.sendMessage(jid, { 
            text: `🔍 *Searching:* "${searchQuery}"\n📊 *Quality:* ${quality}p\n⏳ *Finding video...*`,
            edit: statusMsg.key 
          });
          
          const { videos } = await yts(searchQuery);
          if (!videos || videos.length === 0) {
            return sock.sendMessage(jid, { 
              text: `❌ No videos found for "${searchQuery}"\nTry different keywords or direct link`,
              edit: statusMsg.key 
            });
          }
          videoUrl = videos[0].url;
          videoTitle = videos[0].title;
          
          await sock.sendMessage(jid, { 
            text: `✅ *Found:* ${videoTitle}\n📊 *Quality:* ${quality}p\n⬇️ *Downloading...*`,
            edit: statusMsg.key 
          });
          
        } catch (error) {
          return sock.sendMessage(jid, { 
            text: `❌ Search failed\nUse direct YouTube link`,
            edit: statusMsg.key 
          });
        }
      }

      // Get download link
      let videoData;
      try {
        videoData = await downloadVideo(videoUrl, quality);
      } catch (error) {
        return sock.sendMessage(jid, { 
          text: `❌ Failed to get video\nTry different quality`,
          edit: statusMsg.key 
        });
      }

      // Download video
      const tempDir = path.join(__dirname, "../temp");
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
      
      const tempFile = path.join(tempDir, `video_${Date.now()}.mp4`);
      
      try {
        const response = await axios({
          url: videoData.downloadUrl,
          method: 'GET',
          responseType: 'stream',
          timeout: 120000
        });

        const writer = fs.createWriteStream(tempFile);
        response.data.pipe(writer);
        
        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        // Check file size
        const stats = fs.statSync(tempFile);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(1);
        
        if (parseFloat(fileSizeMB) > 16) {
          await sock.sendMessage(jid, { 
            text: `❌ Video too large (${fileSizeMB}MB)\nMax size: 16MB\nTry lower quality (144, 240, 360)`,
            edit: statusMsg.key 
          });
          fs.unlinkSync(tempFile);
          return;
        }

        // Send video
        await sock.sendMessage(jid, {
          video: fs.readFileSync(tempFile),
          caption: `🎬 ${videoTitle}\n📊 ${quality}p • ${fileSizeMB}MB\n`,
          mimetype: 'video/mp4'
        });

        // Clean up
        fs.unlinkSync(tempFile);
        
        await sock.sendMessage(jid, { 
          text: `✅ *Video Sent!*\n\n${videoTitle}\n📊 ${quality}p • ${fileSizeMB}MB`,
          edit: statusMsg.key 
        });

      } catch (error) {
        await sock.sendMessage(jid, { 
          text: `❌ Download failed\nTry again later or use lower quality`,
          edit: statusMsg.key 
        });
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      }

    } catch (error) {
      console.error("Video error:", error);
      await sock.sendMessage(jid, { 
        text: `❌ Error downloading video\nTry again later`
      }, { quoted: m });
    }
  }
};
