import axios from "axios";
import yts from "yt-search";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WOLF_API = "https://apis.xwolf.space/download/mp3";
const WOLF_STREAM = "https://apis.xwolf.space/download/stream/mp3";
const KEITH_API = "https://apiskeith.top";

const keithFallbackEndpoints = [
  `${KEITH_API}/download/ytmp3`,
  `${KEITH_API}/download/audio`,
  `${KEITH_API}/download/dlmp3`,
  `${KEITH_API}/download/mp3`,
  `${KEITH_API}/download/yta`,
  `${KEITH_API}/download/yta2`,
  `${KEITH_API}/download/yta3`
];

async function getKeithDownloadUrl(videoUrl) {
  for (const endpoint of keithFallbackEndpoints) {
    try {
      const response = await axios.get(
        `${endpoint}?url=${encodeURIComponent(videoUrl)}`,
        { timeout: 15000 }
      );
      if (response.data?.status && response.data?.result) {
        return response.data.result;
      }
    } catch {
      continue;
    }
  }
  return null;
}

async function downloadAndValidate(downloadUrl) {
  const response = await axios({
    url: downloadUrl,
    method: 'GET',
    responseType: 'arraybuffer',
    timeout: 60000,
    maxRedirects: 5,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    validateStatus: (status) => status >= 200 && status < 400
  });

  const buffer = Buffer.from(response.data);

  if (buffer.length < 1000) {
    throw new Error('File too small, likely not audio');
  }

  const headerStr = buffer.slice(0, 50).toString('utf8').toLowerCase();
  if (headerStr.includes('<!doctype') || headerStr.includes('<html') || headerStr.includes('bad gateway')) {
    throw new Error('Received HTML instead of audio');
  }

  return buffer;
}

export default {
  name: "play",
  aliases: ["ytmp3doc", "audiodoc", "ytplay"],
  category: "Downloader",
  description: "Download YouTube audio via WOLF API",
  
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
        text: `╭─⌈ 🎵 *PLAY COMMAND* ⌋\n│\n├─⊷ *${prefix}play <song name>*\n│  └⊷ Download audio from YouTube\n│\n├─⊷ *${prefix}play <YouTube URL>*\n│  └⊷ Download from direct link\n│\n├─⊷ *${prefix}play list <query>*\n│  └⊷ Search and list results\n│\n╰───`
      }, { quoted: m });
    }

    console.log(`🎵 [PLAY] Query: "${searchQuery}"`);

    try {
      if (flags.list) {
        const listQuery = searchQuery.replace('list', '').replace('search', '').trim();
        if (!listQuery) {
          await sock.sendMessage(jid, { 
            text: `╭─⌈ ❌ *PLAY LIST* ⌋\n│\n├─⊷ *${prefix}play list <query>*\n│  └⊷ Provide a search query\n│\n╰───`
          }, { quoted: m });
          return;
        }

        await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });

        let videos = [];
        try {
          const { videos: ytResults } = await yts(listQuery);
          videos = ytResults || [];
        } catch (error) {
          console.error("YT search error:", error);
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
          listText += `   📺 ${prefix}play ${url}\n\n`;
        });

        listText += `\n*Usage:* Reply with number (1-10) or use ${prefix}play <URL>`;
        
        await sock.sendMessage(jid, { 
          text: listText
        }, { quoted: m });

        await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
        return;
      }

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
            duration = videos[0].timestamp || '';
          } else {
            videoTitle = "YouTube Audio";
          }
        } catch {
          videoTitle = "YouTube Audio";
        }
      } else {
        try {
          const { videos: ytResults } = await yts(searchQuery);
          if (!ytResults || ytResults.length === 0) {
            await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
            await sock.sendMessage(jid, { 
              text: `❌ No results found for "${searchQuery}"`
            }, { quoted: m });
            return;
          }
          const video = ytResults[0];
          videoUrl = video.url;
          videoTitle = video.title;
          author = video.author?.name || 'Unknown Artist';
          duration = video.timestamp || video.duration || '';
          videoId = video.videoId;
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

      let audioBuffer = null;
      let sourceUsed = '';

      try {
        console.log(`🎵 [PLAY] Trying WOLF API...`);
        const wolfRes = await axios.get(`${WOLF_API}?url=${encodeURIComponent(videoUrl)}`, { timeout: 20000 });

        if (wolfRes.data?.success) {
          const data = wolfRes.data;
          const streamUrl = data.streamUrl ? data.streamUrl.replace('http://', 'https://') : null;
          const downloadUrl = data.downloadUrl;

          const wolfSources = [];
          if (streamUrl) wolfSources.push({ url: streamUrl, label: 'WOLF Stream' });
          if (downloadUrl && downloadUrl !== 'In Processing...' && downloadUrl.startsWith('http')) {
            wolfSources.push({ url: downloadUrl, label: 'WOLF Direct' });
          }
          wolfSources.push({ url: `${WOLF_STREAM}?url=${encodeURIComponent(videoUrl)}`, label: 'WOLF Stream URL' });

          for (const source of wolfSources) {
            try {
              console.log(`🎵 [PLAY] Trying: ${source.label}`);
              audioBuffer = await downloadAndValidate(source.url);
              sourceUsed = source.label;
              break;
            } catch (err) {
              console.log(`🎵 [PLAY] ${source.label} failed: ${err.message}`);
              continue;
            }
          }
        }
      } catch (wolfErr) {
        console.log(`🎵 [PLAY] WOLF API failed: ${wolfErr.message}`);
      }

      if (!audioBuffer) {
        console.log(`🎵 [PLAY] WOLF failed, trying Keith fallback...`);
        const keithUrl = await getKeithDownloadUrl(videoUrl);
        if (keithUrl) {
          try {
            audioBuffer = await downloadAndValidate(keithUrl);
            sourceUsed = 'Keith Fallback';
          } catch (err) {
            console.log(`🎵 [PLAY] Keith fallback failed: ${err.message}`);
          }
        }
      }

      if (!audioBuffer) {
        await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
        await sock.sendMessage(jid, { 
          text: `❌ Download failed for "${videoTitle}". All sources exhausted.\nTry another song or direct YouTube URL.`
        }, { quoted: m });
        return;
      }

      const fileSizeMB = (audioBuffer.length / (1024 * 1024)).toFixed(1);

      if (parseFloat(fileSizeMB) > 50) {
        await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
        await sock.sendMessage(jid, { 
          text: `❌ File too large (${fileSizeMB}MB). Maximum size is 50MB.`
        }, { quoted: m });
        return;
      }

      let thumbnailBuffer = null;
      if (videoId) {
        const thumbUrls = [
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          `https://i.ytimg.com/vi/${videoId}/sddefault.jpg`
        ];
        for (const thumbUrl of thumbUrls) {
          try {
            const thumbRes = await axios.get(thumbUrl, {
              responseType: 'arraybuffer',
              timeout: 10000
            });
            if (thumbRes.status === 200 && thumbRes.data.length > 1000) {
              thumbnailBuffer = Buffer.from(thumbRes.data);
              break;
            }
          } catch {
            continue;
          }
        }
      }

      const cleanTitle = videoTitle.replace(/[^\w\s.-]/gi, '').substring(0, 50);
      const fileName = `${cleanTitle}.mp3`;

      const contextInfo = {
        externalAdReply: {
          title: videoTitle.substring(0, 60),
          body: `🎵 ${author}${duration ? ` | ⏱️ ${duration}` : ''} | ${fileSizeMB}MB | WOLF API`,
          mediaType: 2,
          sourceUrl: videoUrl,
          thumbnail: thumbnailBuffer,
          mediaUrl: videoUrl,
          renderLargerThumbnail: true
        }
      };

      await sock.sendMessage(jid, {
        audio: audioBuffer,
        mimetype: "audio/mpeg",
        fileName: fileName,
        contextInfo: contextInfo
      }, { quoted: m });

      await sock.sendMessage(jid, {
        document: audioBuffer,
        mimetype: "audio/mpeg",
        fileName: fileName,
        contextInfo: {
          ...contextInfo,
          externalAdReply: {
            ...contextInfo.externalAdReply,
            body: `📄 Document | ${author}${duration ? ` | ⏱️ ${duration}` : ''}`
          }
        }
      }, { quoted: m });

      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
      console.log(`✅ [PLAY] Success: "${videoTitle}" (${fileSizeMB}MB) [${sourceUsed}]`);

    } catch (error) {
      console.error("❌ [PLAY] ERROR:", error);
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      await sock.sendMessage(jid, { 
        text: `❌ Error: ${error.message}` 
      }, { quoted: m });
    }
  }
};
