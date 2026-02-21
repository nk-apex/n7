import axios from "axios";
import yts from "yt-search";

const WOLF_API = "https://apis.xwolf.space/download/mp4";
const WOLF_STREAM = "https://apis.xwolf.space/download/stream/mp4";
const KEITH_API = "https://apiskeith.top";

async function downloadAndValidate(downloadUrl, timeout = 120000) {
  const response = await axios({
    url: downloadUrl,
    method: 'GET',
    responseType: 'arraybuffer',
    timeout,
    maxRedirects: 5,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    validateStatus: (status) => status >= 200 && status < 400
  });

  const buffer = Buffer.from(response.data);
  if (buffer.length < 5000) throw new Error('File too small, likely not video');

  const headerStr = buffer.slice(0, 50).toString('utf8').toLowerCase();
  if (headerStr.includes('<!doctype') || headerStr.includes('<html') || headerStr.includes('bad gateway')) {
    throw new Error('Received HTML instead of video');
  }

  return buffer;
}

export default {
  name: "ytmp4",
  description: "Download YouTube videos as MP4",
  category: "Downloader",
  async execute(sock, m, args, prefix) {
    const jid = m.key.remoteJid;
    const quoted = m.quoted;
    const quotedText = quoted?.text?.trim() || (m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation)?.trim() || '';

    try {
      const searchQuery = args.length > 0 ? args.join(" ") : quotedText;
      
      if (!searchQuery) {
        await sock.sendMessage(jid, { 
          text: `╭─⌈ 🎬 *YTMP4 DOWNLOADER* ⌋\n│\n├─⊷ *${prefix}ytmp4 <video name>*\n│  └⊷ Download video\n├─⊷ *${prefix}ytmp4 <YouTube URL>*\n│  └⊷ Download from link\n├─⊷ *Reply to a text message*\n│  └⊷ Uses replied text as search\n╰───`
        }, { quoted: m });
        return;
      }
      console.log(`🎬 [YTMP4] Request: ${searchQuery}`);

      await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });

      const apiUrl = `${WOLF_API}?url=${encodeURIComponent(searchQuery)}`;
      let apiData = null;

      try {
        const response = await axios.get(apiUrl, { timeout: 30000 });
        if (response.data) apiData = response.data;
      } catch (err) {
        console.log(`🎬 [YTMP4] Wolf API failed: ${err.message}`);
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

      if (!videoTitle) videoTitle = "YouTube Video";

      console.log(`🎬 [YTMP4] Found: ${videoTitle}`);
      await sock.sendMessage(jid, { react: { text: '📥', key: m.key } });

      let videoBuffer = null;
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

      if (youtubeUrl) {
        downloadSources.push({ url: `${KEITH_API}/download/ytmp4?url=${encodeURIComponent(youtubeUrl)}`, label: 'Keith' });
      }

      for (const source of downloadSources) {
        try {
          console.log(`🎬 [YTMP4] Trying: ${source.label}`);
          if (source.label === 'Keith') {
            const keithRes = await axios.get(source.url, { timeout: 20000 });
            const dlUrl = keithRes.data?.result;
            if (dlUrl && typeof dlUrl === 'string' && dlUrl.startsWith('http')) {
              videoBuffer = await downloadAndValidate(dlUrl);
              sourceUsed = source.label;
              break;
            }
          } else {
            videoBuffer = await downloadAndValidate(source.url);
            sourceUsed = source.label;
            break;
          }
        } catch (err) {
          console.log(`🎬 [YTMP4] ${source.label} failed: ${err.message}`);
          continue;
        }
      }

      if (!videoBuffer) {
        await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
        await sock.sendMessage(jid, { 
          text: `❌ Video download failed. Try again later or use ${prefix}mp4 command.`
        }, { quoted: m });
        return;
      }

      const fileSizeMB = (videoBuffer.length / (1024 * 1024)).toFixed(1);

      if (parseFloat(fileSizeMB) > 99) {
        await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
        await sock.sendMessage(jid, { 
          text: `❌ Video too large: ${fileSizeMB}MB\nMax size: 99MB`
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
          if (thumbResponse.status === 200) {
            thumbnailBuffer = Buffer.from(thumbResponse.data);
          }
        } catch (e) {}
      }

      const cleanTitle = videoTitle.replace(/[^\w\s.-]/gi, '').substring(0, 50);

      await sock.sendMessage(jid, {
        video: videoBuffer,
        mimetype: 'video/mp4',
        caption: `🎬 ${videoTitle}\n${duration ? `⏱️ ${duration} • ` : ''}📦 ${fileSizeMB}MB`,
        fileName: `${cleanTitle}.mp4`,
        thumbnail: thumbnailBuffer,
        gifPlayback: false
      }, { quoted: m });

      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
      console.log(`✅ [YTMP4] Success: ${videoTitle} (${fileSizeMB}MB) [${sourceUsed}]`);

    } catch (error) {
      console.error("❌ [YTMP4] Fatal error:", error);
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      await sock.sendMessage(jid, { 
        text: `❌ Error: ${error.message}`
      }, { quoted: m });
    }
  },
};
