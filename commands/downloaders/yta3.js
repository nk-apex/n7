import axios from 'axios';

const GIFTED_API = 'https://api.giftedtech.co.ke/api/download/yta';

async function downloadAndValidate(url) {
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'arraybuffer',
    timeout: 60000,
    maxRedirects: 5,
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    validateStatus: (s) => s >= 200 && s < 400
  });
  const buffer = Buffer.from(response.data);
  if (buffer.length < 1000) throw new Error('File too small, likely not audio');
  const header = buffer.slice(0, 50).toString('utf8').toLowerCase();
  if (header.includes('<!doctype') || header.includes('<html') || header.includes('bad gateway')) {
    throw new Error('Received HTML instead of audio');
  }
  return buffer;
}

export default {
  name: 'yta3',
  aliases: ['wolfyta3', 'yta2'],
  description: 'Download audio via GiftedTech YTA API',
  category: 'Downloader',
  usage: 'yta3 <url or song name>',

  async execute(sock, m, args, prefix) {
    const jid = m.key.remoteJid;
    const quotedText = m.quoted?.text?.trim() || m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation?.trim() || '';

    const searchQuery = args.length > 0 ? args.join(' ') : quotedText;

    if (!searchQuery) {
      return sock.sendMessage(jid, {
        text: `╭─⌈ 🎵 *YTA DOWNLOADER* ⌋\n│\n├─⊷ *${prefix}yta3 <song name>*\n│  └⊷ Download audio\n├─⊷ *${prefix}yta3 <YouTube URL>*\n│  └⊷ Download from link\n├─⊷ *Reply to a text message*\n│  └⊷ Uses replied text as search\n╰───`
      }, { quoted: m });
    }

    console.log(`🎵 [YTA3] Request: ${searchQuery}`);
    await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });

    try {
      const apiRes = await axios.get(GIFTED_API, {
        params: { apikey: 'gifted', url: searchQuery },
        timeout: 25000
      });

      if (!apiRes.data?.success || !apiRes.data?.result?.download_url) {
        throw new Error('No download link returned');
      }

      const { title, duration, quality, thumbnail, download_url } = apiRes.data.result;

      console.log(`🎵 [YTA3] Found: ${title}`);
      await sock.sendMessage(jid, { react: { text: '📥', key: m.key } });

      const audioBuffer = await downloadAndValidate(download_url);
      const fileSizeMB = (audioBuffer.length / (1024 * 1024)).toFixed(1);

      if (parseFloat(fileSizeMB) > 50) {
        await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
        return sock.sendMessage(jid, { text: `❌ File too large: ${fileSizeMB}MB (max 50MB)` }, { quoted: m });
      }

      let thumbnailBuffer = null;
      if (thumbnail) {
        try {
          const thumbRes = await axios.get(thumbnail, { responseType: 'arraybuffer', timeout: 10000 });
          if (thumbRes.data.length > 1000) thumbnailBuffer = Buffer.from(thumbRes.data);
        } catch {}
      }

      const cleanTitle = (title || 'audio').replace(/[^\w\s.-]/gi, '').substring(0, 50);

      await sock.sendMessage(jid, {
        audio: audioBuffer,
        mimetype: 'audio/mpeg',
        ptt: false,
        fileName: `${cleanTitle}.mp3`,
        contextInfo: {
          externalAdReply: {
            title: (title || 'Audio').substring(0, 60),
            body: `🎵 ${duration ? duration + ' • ' : ''}${quality || '320kbps'} | Downloaded by WOLFBOT`,
            mediaType: 2,
            thumbnail: thumbnailBuffer,
            renderLargerThumbnail: true
          }
        }
      }, { quoted: m });

      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
      console.log(`✅ [YTA3] Success: ${title} (${fileSizeMB}MB)`);

    } catch (error) {
      console.error('❌ [YTA3] Error:', error.message);
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      await sock.sendMessage(jid, {
        text: `❌ *YTA Error:* ${error.message}\n\nTry: \`${prefix}ytmp3 ${args.join(' ')}\``
      }, { quoted: m });
    }
  }
};
