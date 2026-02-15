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
        console.log(`[PLAY] Download success via: ${endpoint}`);
        return response.data.result;
      }
    } catch (error) {
      console.log(`[PLAY] Endpoint failed: ${endpoint} - ${error.message}`);
      continue;
    }
  }
  return null;
};

export default {
  name: "play",
  aliases: ["ytmp3doc", "audiodoc", "ytplay"],
  category: "Downloader",
  description: "Download YouTube audio with Keith API",
  
  async execute(sock, m, args, prefix) {
    const jid = m.key.remoteJid;
    const quoted = m.quoted;
    let searchQuery = "";
    
    const flags = {
      doc: args.includes('doc') || args.includes('document'),
      list: args.includes('list') || args.includes('search'),
    };
    
    const queryArgs = args.filter(arg => 
      !['doc', 'document', 'list', 'search'].includes(arg)
    );
    
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
      if (flags.list) {
        const listQuery = searchQuery.replace('list', '').replace('search', '').trim();
        if (!listQuery) {
          await sock.sendMessage(jid, { 
            text: "Please specify search query. Example: .play list Ed Sheeran" 
          }, { quoted: m });
          return;
        }

        await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });

        let videos = await keithSearch(listQuery);
        
        if (!videos || videos.length === 0) {
          try {
            const { videos: ytResults } = await yts(listQuery);
            videos = ytResults || [];
          } catch (error) {
            console.error("YT search error:", error);
          }
        }

        if (videos.length === 0) {
          await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
          await sock.sendMessage(jid, { 
            text: `❌ No results found for "${listQuery}"`
          }, { quoted: m });
          return;
        }

        let listText = `🔍 *Search Results:* "${listQuery}"\n\n`;
        videos.slice(0, 10).forEach((video, index) => {
          const title = video.title || "Unknown Title";
          const vidAuthor = video.author?.name || video.channel?.name || 'Unknown';
          const dur = video.timestamp || video.duration || 'N/A';
          const url = video.url || `https://youtube.com/watch?v=${video.id || video.videoId}`;
          
          listText += `${index + 1}. ${title}\n`;
          listText += `   👤 ${vidAuthor}\n`;
          listText += `   ⏱️ ${dur}\n`;
          listText += `   📺 .play ${url}\n\n`;
        });

        listText += `\n*Usage:* Reply with number (1-10) or use .play <URL>`;
        
        await sock.sendMessage(jid, { 
          text: listText
        }, { quoted: m });

        await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
        return;
      }

      await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });

      let videoUrl = '';
      let videoTitle = '';
      let thumbnail = '';
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
        videoTitle = "YouTube Audio";
        thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
      } else {
        try {
          const videos = await keithSearch(searchQuery);
          if (videos && videos.length > 0) {
            videoUrl = videos[0].url;
            videoTitle = videos[0].title;
            author = videos[0].author?.name || videos[0].channel?.name || 'Unknown Artist';
            duration = videos[0].duration || '';
            thumbnail = videos[0].thumbnail;
            videoId = videos[0].id || videos[0].videoId;
          } else {
            const { videos: ytResults } = await yts(searchQuery);
            if (!ytResults || ytResults.length === 0) {
              await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
              await sock.sendMessage(jid, { 
                text: `❌ No results found for "${searchQuery}"`
              }, { quoted: m });
              return;
            }
            videoUrl = ytResults[0].url;
            videoTitle = ytResults[0].title;
            author = ytResults[0].author?.name || 'Unknown Artist';
            duration = ytResults[0].timestamp || '';
            thumbnail = ytResults[0].thumbnail;
            videoId = ytResults[0].videoId;
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

      console.log(`🎵 [PLAY] Selected: "${videoTitle}" | URL: ${videoUrl}`);

      await sock.sendMessage(jid, { react: { text: '📥', key: m.key } });

      let downloadUrl = await keithDownloadAudio(videoUrl);
      
      if (!downloadUrl) {
        console.error("❌ All Keith API audio endpoints failed");
        await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
        await sock.sendMessage(jid, { 
          text: `❌ Download failed. Please try:\n1. Another song/video\n2. Direct YouTube URL\n3. Try again later`
        }, { quoted: m });
        return;
      }

      const tempDir = path.join(__dirname, "../temp");
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
      
      const fileName = `${videoTitle.replace(/[^\w\s.-]/gi, '').substring(0, 50)}.mp3`;
      const tempFile = path.join(tempDir, `play_${Date.now()}_${Math.random().toString(36).substring(7)}.mp3`);

      try {
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

        const stats = fs.statSync(tempFile);
        const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
        
        if (stats.size === 0) {
          throw new Error("Downloaded file is empty");
        }
        
        if (fileSizeMB > 50) {
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
          mimetype: "audio/mpeg",
          fileName: fileName,
          contextInfo: contextInfo
        }, { quoted: m });

        await sock.sendMessage(jid, {
          document: fileBuffer,
          mimetype: "audio/mpeg",
          fileName: fileName,
          contextInfo: {
            ...contextInfo,
            externalAdReply: {
              ...contextInfo.externalAdReply,
              body: `📄 Document version | ${author}${duration ? ` | ⏱️ ${duration}` : ''}`
            }
          }
        }, { quoted: m });

        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }

        await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });

        console.log(`✅ [PLAY] Success: "${videoTitle}" (${fileSizeMB}MB) via Keith API`);

      } catch (downloadError) {
        console.error("❌ [PLAY] Download error:", downloadError.message);
        await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
        await sock.sendMessage(jid, { 
          text: `❌ Failed to process file: ${downloadError.message}`
        }, { quoted: m });
        if (fs.existsSync(tempFile)) {
          try { fs.unlinkSync(tempFile); } catch {}
        }
      }

    } catch (error) {
      console.error("❌ [PLAY] ERROR:", error);
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      await sock.sendMessage(jid, { 
        text: `❌ Error: ${error.message}` 
      }, { quoted: m });
    }
  }
};
