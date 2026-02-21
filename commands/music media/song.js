import axios from "axios";
import yts from "yt-search";

const KEITH_API = "https://apiskeith.top";
const KEITH_PRIMARY = `${KEITH_API}/download/audio`;

const keithFallbackEndpoints = [
  `${KEITH_API}/download/ytmp3`,
  `${KEITH_API}/download/dlmp3`,
  `${KEITH_API}/download/mp3`,
  `${KEITH_API}/download/yta`,
  `${KEITH_API}/download/yta2`,
  `${KEITH_API}/download/yta3`
];

const WOLF_API = "https://apis.xwolf.space/download/mp3";
const WOLF_STREAM = "https://apis.xwolf.space/download/stream/mp3";
const WOLF_API_2 = "https://apis.xwolf.space/download/yta";
const WOLF_API_3 = "https://apis.xwolf.space/download/dlmp3";

async function getKeithDownloadUrl(videoUrl) {
  try {
    const response = await axios.get(
      `${KEITH_PRIMARY}?url=${encodeURIComponent(videoUrl)}`,
      { timeout: 20000 }
    );
    if (response.data?.status && response.data?.result) {
      return { url: response.data.result, source: 'Keith Audio' };
    }
  } catch {}

  for (const endpoint of keithFallbackEndpoints) {
    try {
      const response = await axios.get(
        `${endpoint}?url=${encodeURIComponent(videoUrl)}`,
        { timeout: 15000 }
      );
      if (response.data?.status && response.data?.result) {
        return { url: response.data.result, source: 'Keith Fallback' };
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
  name: "song",
  aliases: ["music", "audio", "mp3", "ytmusic"],
  category: "Downloader",
  description: "Download YouTube audio with embedded thumbnail",
  
  async execute(sock, m, args, prefix) {
    const jid = m.key.remoteJid;
    const quoted = m.quoted;
    const quotedText = quoted?.text?.trim() || (m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation)?.trim() || '';
    
    let searchQuery = args.length > 0 ? args.join(" ") : quotedText;
    
    if (!searchQuery) {
      return sock.sendMessage(jid, {
        text: `╭─⌈ 🎵 *SONG DOWNLOADER* ⌋\n│\n├─⊷ *${prefix}song <song name>*\n│  └⊷ Download audio\n├─⊷ *${prefix}song <YouTube URL>*\n│  └⊷ Download from link\n├─⊷ *Reply to a text message*\n│  └⊷ Uses replied text as search\n╰───`
      }, { quoted: m });
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
        } catch {
          videoTitle = "YouTube Audio";
        }
      } else {
        try {
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

      let audioBuffer = null;
      let sourceUsed = '';

      console.log(`🎵 [SONG] Trying Keith API (primary)...`);
      const keithResult = await getKeithDownloadUrl(videoUrl);
      if (keithResult) {
        try {
          audioBuffer = await downloadAndValidate(keithResult.url);
          sourceUsed = keithResult.source;
          console.log(`🎵 [SONG] Keith success: ${keithResult.source}`);
        } catch (err) {
          console.log(`🎵 [SONG] Keith download failed: ${err.message}`);
        }
      }

      if (!audioBuffer) {
        try {
          console.log(`🎵 [SONG] Keith failed, trying WOLF API fallback...`);
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
                console.log(`🎵 [SONG] Trying: ${source.label}`);
                audioBuffer = await downloadAndValidate(source.url);
                sourceUsed = source.label;
                break;
              } catch (err) {
                console.log(`🎵 [SONG] ${source.label} failed: ${err.message}`);
                continue;
              }
            }
          }
        } catch (wolfErr) {
          console.log(`🎵 [SONG] WOLF API failed: ${wolfErr.message}`);
        }
      }

      if (!audioBuffer) {
        for (const altApi of [WOLF_API_2, WOLF_API_3]) {
          try {
            console.log(`🎵 [SONG] Trying alt Wolf API`);
            const altRes = await axios.get(`${altApi}?url=${encodeURIComponent(videoUrl)}`, { timeout: 20000 });
            if (altRes.data?.success && altRes.data?.downloadUrl) {
              audioBuffer = await downloadAndValidate(altRes.data.downloadUrl);
              sourceUsed = 'Wolf Alt';
              break;
            }
          } catch (err) {
            console.log(`🎵 [SONG] Alt failed: ${err.message}`);
          }
        }
      }

      if (!audioBuffer) {
        await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
        await sock.sendMessage(jid, { 
          text: `❌ Failed to download "${videoTitle}". All sources exhausted.\nTry another song or direct YouTube URL.`
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

      await sock.sendMessage(jid, {
        audio: audioBuffer,
        mimetype: 'audio/mpeg',
        ptt: false,
        fileName: `${cleanTitle}.mp3`,
        contextInfo: {
          externalAdReply: {
            title: videoTitle.substring(0, 60),
            body: `🎵 ${author}${duration ? ` | ⏱️ ${duration}` : ''} | ${fileSizeMB}MB`,
            mediaType: 2,
            thumbnail: thumbnailBuffer,
            sourceUrl: videoUrl,
            mediaUrl: videoUrl,
            renderLargerThumbnail: true
          }
        }
      }, { quoted: m });

      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
      console.log(`✅ [SONG] Success: "${videoTitle}" (${fileSizeMB}MB) [${sourceUsed}]`);

    } catch (error) {
      console.error("❌ [SONG] ERROR:", error);
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      await sock.sendMessage(jid, { 
        text: `❌ Error: ${error.message}` 
      }, { quoted: m });
    }
  }
};
