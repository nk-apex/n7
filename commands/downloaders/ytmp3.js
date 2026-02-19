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

const WOLF_API = "https://wolfmusicapi-al6b.onrender.com/download/ytmp3";
const WOLF_STREAM = "https://wolfmusicapi-al6b.onrender.com/download/stream/mp3";
const WOLF_API_2 = "https://wolfmusicapi-al6b.onrender.com/download/yta2";
const WOLF_API_3 = "https://wolfmusicapi-al6b.onrender.com/download/yta3";

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
  if (buffer.length < 1000) throw new Error('File too small, likely not audio');

  const headerStr = buffer.slice(0, 50).toString('utf8').toLowerCase();
  if (headerStr.includes('<!doctype') || headerStr.includes('<html') || headerStr.includes('bad gateway')) {
    throw new Error('Received HTML instead of audio');
  }

  return buffer;
}

export default {
  name: "ytmp3",
  description: "Download YouTube audio as MP3",
  category: "Downloader",
  async execute(sock, m, args, prefix) {
    const jid = m.key.remoteJid;
    const quoted = m.quoted;
    const quotedText = quoted?.text?.trim() || (m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation)?.trim() || '';

    try {
      const searchQuery = args.length > 0 ? args.join(" ") : quotedText;
      
      if (!searchQuery) {
        await sock.sendMessage(jid, { 
          text: `╭─⌈ 🎵 *YTMP3 DOWNLOADER* ⌋\n│\n├─⊷ *${prefix}ytmp3 <song name>*\n│  └⊷ Download audio\n├─⊷ *${prefix}ytmp3 <YouTube URL>*\n│  └⊷ Download from link\n├─⊷ *Reply to a text message*\n│  └⊷ Uses replied text as search\n╰───`
        }, { quoted: m });
        return;
      }
      console.log(`🎵 [YTMP3] Request: ${searchQuery}`);

      await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });

      let videoTitle = '';
      let videoId = '';
      let youtubeUrl = '';
      let duration = '';

      if (searchQuery.match(/(youtube\.com|youtu\.be)/i)) {
        youtubeUrl = searchQuery;
        videoId = youtubeUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)?.[1] || '';
        try {
          const { videos } = await yts({ videoId });
          if (videos && videos.length > 0) {
            videoTitle = videos[0].title;
            duration = videos[0].timestamp || '';
          }
        } catch {}
      } else {
        try {
          const { videos: ytResults } = await yts(searchQuery);
          if (ytResults && ytResults.length > 0) {
            videoTitle = ytResults[0].title;
            videoId = ytResults[0].videoId;
            youtubeUrl = ytResults[0].url;
            duration = ytResults[0].timestamp || '';
          }
        } catch (e) {}
      }

      if (!videoTitle) videoTitle = "YouTube Audio";

      console.log(`🎵 [YTMP3] Found: ${videoTitle}`);
      await sock.sendMessage(jid, { react: { text: '📥', key: m.key } });

      let audioBuffer = null;
      let sourceUsed = '';

      const downloadTarget = youtubeUrl || searchQuery;

      console.log(`🎵 [YTMP3] Trying Keith API (primary)...`);
      const keithResult = await getKeithDownloadUrl(downloadTarget);
      if (keithResult) {
        try {
          audioBuffer = await downloadAndValidate(keithResult.url);
          sourceUsed = keithResult.source;
          console.log(`🎵 [YTMP3] Keith success: ${keithResult.source}`);
        } catch (err) {
          console.log(`🎵 [YTMP3] Keith download failed: ${err.message}`);
        }
      }

      if (!audioBuffer) {
        try {
          console.log(`🎵 [YTMP3] Keith failed, trying WOLF API fallback...`);
          const wolfRes = await axios.get(`${WOLF_API}?url=${encodeURIComponent(downloadTarget)}`, { timeout: 25000 });
          if (wolfRes.data?.success) {
            const apiData = wolfRes.data;

            const downloadSources = [];
            if (apiData.downloadUrl && apiData.downloadUrl !== 'In Processing...' && apiData.downloadUrl.startsWith('http')) {
              downloadSources.push({ url: apiData.downloadUrl, label: 'Wolf Direct' });
            }
            if (apiData.streamUrl) {
              downloadSources.push({ url: apiData.streamUrl.replace('http://', 'https://'), label: 'Wolf Stream' });
            }
            downloadSources.push({ url: `${WOLF_STREAM}?url=${encodeURIComponent(downloadTarget)}`, label: 'Wolf Stream Q' });

            for (const source of downloadSources) {
              try {
                console.log(`🎵 [YTMP3] Trying: ${source.label}`);
                audioBuffer = await downloadAndValidate(source.url);
                sourceUsed = source.label;
                break;
              } catch (err) {
                console.log(`🎵 [YTMP3] ${source.label} failed: ${err.message}`);
              }
            }
          }
        } catch (err) {
          console.log(`🎵 [YTMP3] Wolf API failed: ${err.message}`);
        }
      }

      if (!audioBuffer) {
        for (const altApi of [WOLF_API_2, WOLF_API_3]) {
          try {
            console.log(`🎵 [YTMP3] Trying alt Wolf API`);
            const altRes = await axios.get(`${altApi}?url=${encodeURIComponent(downloadTarget)}`, { timeout: 20000 });
            if (altRes.data?.success && altRes.data?.downloadUrl) {
              audioBuffer = await downloadAndValidate(altRes.data.downloadUrl);
              sourceUsed = 'Wolf Alt';
              break;
            }
          } catch (err) {
            console.log(`🎵 [YTMP3] Alt failed: ${err.message}`);
          }
        }
      }

      if (!audioBuffer) {
        await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
        await sock.sendMessage(jid, { 
          text: `❌ MP3 download failed. Try again later or use ${prefix}song command.`
        }, { quoted: m });
        return;
      }

      const fileSizeMB = (audioBuffer.length / (1024 * 1024)).toFixed(1);

      if (parseFloat(fileSizeMB) > 50) {
        await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
        await sock.sendMessage(jid, { 
          text: `❌ MP3 too large: ${fileSizeMB}MB\nMax size: 50MB`
        }, { quoted: m });
        return;
      }

      let thumbnailBuffer = null;
      if (videoId) {
        try {
          const thumbResponse = await axios.get(
            `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            { responseType: 'arraybuffer', timeout: 10000 }
          );
          if (thumbResponse.status === 200 && thumbResponse.data.length > 1000) {
            thumbnailBuffer = Buffer.from(thumbResponse.data);
          }
        } catch (e) {}
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
            body: `🎵 ${duration ? duration + ' • ' : ''}${fileSizeMB}MB`,
            mediaType: 2,
            thumbnail: thumbnailBuffer,
            sourceUrl: youtubeUrl || searchQuery,
            mediaUrl: youtubeUrl || searchQuery,
            renderLargerThumbnail: true
          }
        }
      }, { quoted: m });

      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
      console.log(`✅ [YTMP3] Success: ${videoTitle} (${fileSizeMB}MB) [${sourceUsed}]`);

    } catch (error) {
      console.error("❌ [YTMP3] Fatal error:", error);
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      await sock.sendMessage(jid, { 
        text: `❌ Error: ${error.message}`
      }, { quoted: m });
    }
  },
};
