import axios from 'axios';

const GIFTED_API = 'https://api.giftedtech.co.ke/api/download/dlmp4';

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
  name: 'dlmp4',
  aliases: ['dlvideo', 'dlvid'],
  description: 'Download MP4 video via GiftedTech API',
  category: 'Downloader',
  usage: 'dlmp4 <url or video name>',

  async execute(sock, m, args, prefix) {
    const jid = m.key.remoteJid;
    const quotedText = m.quoted?.text?.trim() || m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation?.trim() || '';

    const searchQuery = args.length > 0 ? args.join(' ') : quotedText;

    if (!searchQuery) {
      return sock.sendMessage(jid, {
        text: `╭─⌈ 🎬 *DLMP4 DOWNLOADER* ⌋\n│\n├─⊷ *${prefix}dlmp4 <video name>*\n│  └⊷ Download video\n├─⊷ *${prefix}dlmp4 <YouTube URL>*\n│  └⊷ Download from link\n├─⊷ *Reply to a text message*\n│  └⊷ Uses replied text as search\n╰───`
      }, { quoted: m });
    }

    console.log(`🎬 [DLMP4] Request: ${searchQuery}`);
    await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });

    try {
      const apiRes = await axios.get(GIFTED_API, {
        params: { apikey: 'gifted', url: searchQuery },
        timeout: 30000
      });

      if (!apiRes.data?.success || !apiRes.data?.result?.download_url) {
        throw new Error('No download link returned');
      }

      const { title, thumbnail, quality, download_url } = apiRes.data.result;

      console.log(`🎬 [DLMP4] Found: ${title}`);
      await sock.sendMessage(jid, { react: { text: '📥', key: m.key } });

      const videoBuffer = await downloadAndValidate(download_url);
      const fileSizeMB = (videoBuffer.length / (1024 * 1024)).toFixed(1);

      if (parseFloat(fileSizeMB) > 99) {
        await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
        return sock.sendMessage(jid, { text: `❌ Video too large: ${fileSizeMB}MB (max 99MB)` }, { quoted: m });
      }

      let thumbnailBuffer = null;
      if (thumbnail) {
        try {
          const thumbRes = await axios.get(thumbnail, { responseType: 'arraybuffer', timeout: 10000 });
          if (thumbRes.data.length > 1000) thumbnailBuffer = Buffer.from(thumbRes.data);
        } catch {}
      }

      const cleanTitle = (title || 'video').replace(/[^\w\s.-]/gi, '').substring(0, 50);

      await sock.sendMessage(jid, {
        video: videoBuffer,
        mimetype: 'video/mp4',
        caption: `🎬 *${title || 'Video'}*\n📹 *Quality:* ${quality || 'HD'}\n📦 *Size:* ${fileSizeMB}MB\n\n🐺 *Downloaded by WOLFBOT*`,
        fileName: `${cleanTitle}.mp4`,
        thumbnail: thumbnailBuffer,
        gifPlayback: false
      }, { quoted: m });

      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
      console.log(`✅ [DLMP4] Success: ${title} (${fileSizeMB}MB)`);

    } catch (error) {
      console.error('❌ [DLMP4] Error:', error.message);
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      await sock.sendMessage(jid, {
        text: `❌ *DLMP4 Error:* ${error.message}\n\nTry: \`${prefix}ytmp4 ${args.join(' ')}\``
      }, { quoted: m });
    }
  }
};
