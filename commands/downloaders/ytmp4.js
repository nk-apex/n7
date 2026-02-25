import axios from 'axios';
import yts from 'yt-search';
import { getBotName } from '../../lib/botname.js';

const GIFTED_BASE = 'https://api.giftedtech.co.ke/api/download';
const VIDEO_ENDPOINTS = ['ytv', 'dlmp4', 'ytmp4'];

async function queryAPI(url, endpoints) {
  for (const endpoint of endpoints) {
    try {
      const res = await axios.get(`${GIFTED_BASE}/${endpoint}`, {
        params: { apikey: 'gifted', url },
        timeout: 30000
      });
      if (res.data?.success && res.data?.result?.download_url) {
        return { success: true, data: res.data.result, endpoint };
      }
    } catch {}
  }
  return { success: false };
}

async function downloadAndValidate(url, timeout = 120000) {
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'arraybuffer',
    timeout,
    maxRedirects: 5,
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    validateStatus: (s) => s >= 200 && s < 400
  });
  const buffer = Buffer.from(response.data);
  if (buffer.length < 5000) throw new Error('File too small, likely not video');
  const header = buffer.slice(0, 50).toString('utf8').toLowerCase();
  if (header.includes('<!doctype') || header.includes('<html') || header.includes('bad gateway')) {
    throw new Error('Received HTML instead of video');
  }
  return buffer;
}

export default {
  name: 'ytmp4',
  description: 'Download YouTube videos as MP4',
  category: 'Downloader',

  async execute(sock, m, args, prefix) {
    const jid = m.key.remoteJid;
    const quotedText = m.quoted?.text?.trim() || m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation?.trim() || '';

    const searchQuery = args.length > 0 ? args.join(' ') : quotedText;

    if (!searchQuery) {
      return sock.sendMessage(jid, {
        text: `╭─⌈ 🎬 *YTMP4 DOWNLOADER* ⌋\n│\n├─⊷ *${prefix}ytmp4 <video name>*\n│  └⊷ Download video\n├─⊷ *${prefix}ytmp4 <YouTube URL>*\n│  └⊷ Download from link\n├─⊷ *Reply to a text message*\n│  └⊷ Uses replied text as search\n╰───`
      }, { quoted: m });
    }

    console.log(`🎬 [YTMP4] Request: ${searchQuery}`);
    await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });

    try {
      let videoUrl = searchQuery;
      let videoTitle = '';
      let thumbnail = '';

      if (!searchQuery.match(/(youtube\.com|youtu\.be)/i)) {
        try {
          const { videos } = await yts(searchQuery);
          if (videos?.length) {
            videoUrl = videos[0].url;
            videoTitle = videos[0].title;
            thumbnail = videos[0].thumbnail || '';
          }
        } catch {}
      }

      const result = await queryAPI(videoUrl, VIDEO_ENDPOINTS);
      if (!result.success) {
        await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
        return sock.sendMessage(jid, { text: `❌ Video download failed. All services unavailable. Try again later.` }, { quoted: m });
      }

      const { data, endpoint } = result;
      const trackTitle = data.title || videoTitle || 'Video';
      const quality = data.quality || 'HD';
      const thumbUrl = data.thumbnail || thumbnail;

      console.log(`🎬 [YTMP4] Found via ${endpoint}: ${trackTitle}`);
      await sock.sendMessage(jid, { react: { text: '📥', key: m.key } });

      const videoBuffer = await downloadAndValidate(data.download_url);
      const fileSizeMB = (videoBuffer.length / (1024 * 1024)).toFixed(1);

      if (parseFloat(fileSizeMB) > 99) {
        await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
        return sock.sendMessage(jid, { text: `❌ Video too large: ${fileSizeMB}MB\nMax size: 99MB` }, { quoted: m });
      }

      let thumbnailBuffer = null;
      if (thumbUrl) {
        try {
          const tr = await axios.get(thumbUrl, { responseType: 'arraybuffer', timeout: 10000 });
          if (tr.data.length > 1000) thumbnailBuffer = Buffer.from(tr.data);
        } catch {}
      }

      const cleanTitle = trackTitle.replace(/[^\w\s.-]/gi, '').substring(0, 50);

      await sock.sendMessage(jid, {
        video: videoBuffer,
        mimetype: 'video/mp4',
        caption: `🎬 *${trackTitle}*\n📹 *Quality:* ${quality}\n📦 *Size:* ${fileSizeMB}MB\n\n🐺 *Downloaded by ${getBotName()}*`,
        fileName: `${cleanTitle}.mp4`,
        thumbnail: thumbnailBuffer,
        gifPlayback: false
      }, { quoted: m });

      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
      console.log(`✅ [YTMP4] Success: ${trackTitle} (${fileSizeMB}MB) via ${endpoint}`);

    } catch (error) {
      console.error('❌ [YTMP4] Fatal error:', error.message);
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      await sock.sendMessage(jid, { text: `❌ Error: ${error.message}` }, { quoted: m });
    }
  }
};
