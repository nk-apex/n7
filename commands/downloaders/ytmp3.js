import axios from "axios";
import yts from "yt-search";

const WOLF_API = "https://wolfmusicapi-al6b.onrender.com/download/ytmp3";
const WOLF_STREAM = "https://wolfmusicapi-al6b.onrender.com/download/stream/mp3";
const WOLF_API_2 = "https://wolfmusicapi-al6b.onrender.com/download/yta2";
const WOLF_API_3 = "https://wolfmusicapi-al6b.onrender.com/download/yta3";
const KEITH_API = "https://apiskeith.top";

const keithFallbackEndpoints = [
  `${KEITH_API}/download/ytmp3`,
  `${KEITH_API}/download/audio`,
  `${KEITH_API}/download/dlmp3`,
  `${KEITH_API}/download/mp3`
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

      let apiData = null;
      try {
        const response = await axios.get(`${WOLF_API}?url=${encodeURIComponent(searchQuery)}`, { timeout: 25000 });
        if (response.data?.success) apiData = response.data;
      } catch (err) {
        console.log(`🎵 [YTMP3] Wolf API failed: ${err.message}`);
      }

      let videoTitle = apiData?.title || apiData?.searchResult?.title || '';
      let videoId = apiData?.videoId || '';
      let youtubeUrl = apiData?.youtubeUrl || '';
      let duration = apiData?.searchResult?.duration || '';

      if (!videoTitle && !searchQuery.startsWith('http')) {
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

      const downloadSources = [];

      if (apiData?.downloadUrl && apiData.downloadUrl !== 'In Processing...' && apiData.downloadUrl.startsWith('http')) {
        downloadSources.push({ url: apiData.downloadUrl, label: 'Wolf Direct' });
      }

      if (apiData?.streamUrl) {
        const streamUrl = apiData.streamUrl.replace('http://', 'https://');
        downloadSources.push({ url: streamUrl, label: 'Wolf Stream' });
      }

      downloadSources.push({ url: `${WOLF_STREAM}?url=${encodeURIComponent(searchQuery)}`, label: 'Wolf Stream Q' });

      for (const source of downloadSources) {
        try {
          console.log(`🎵 [YTMP3] Trying: ${source.label}`);
          audioBuffer = await downloadAndValidate(source.url);
          sourceUsed = source.label;
          break;
        } catch (err) {
          console.log(`🎵 [YTMP3] ${source.label} failed: ${err.message}`);
          continue;
        }
      }

      if (!audioBuffer) {
        for (const altApi of [WOLF_API_2, WOLF_API_3]) {
          try {
            console.log(`🎵 [YTMP3] Trying alt Wolf API`);
            const altRes = await axios.get(`${altApi}?url=${encodeURIComponent(searchQuery)}`, { timeout: 20000 });
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

      if (!audioBuffer && youtubeUrl) {
        console.log(`🎵 [YTMP3] Wolf failed, trying Keith fallback...`);
        const keithUrl = await getKeithDownloadUrl(youtubeUrl);
        if (keithUrl) {
          try {
            audioBuffer = await downloadAndValidate(keithUrl);
            sourceUsed = 'Keith Fallback';
          } catch (err) {
            console.log(`🎵 [YTMP3] Keith failed: ${err.message}`);
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
            body: `🎵 ${duration ? duration + ' • ' : ''}${fileSizeMB}MB | WOLF API`,
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
