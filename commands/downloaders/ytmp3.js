import axios from 'axios';
import yts from 'yt-search';

const GIFTED_API = 'https://api.giftedtech.co.ke/api/download/ytmp3';

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
  name: 'ytmp3',
  description: 'Download YouTube audio as MP3',
  category: 'Downloader',

  async execute(sock, m, args, prefix) {
    const jid = m.key.remoteJid;
    const quotedText = m.quoted?.text?.trim() || m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation?.trim() || '';

    const searchQuery = args.length > 0 ? args.join(' ') : quotedText;

    if (!searchQuery) {
      return sock.sendMessage(jid, {
        text: `╭─⌈ 🎵 *YTMP3 DOWNLOADER* ⌋\n│\n├─⊷ *${prefix}ytmp3 <song name>*\n│  └⊷ Download audio\n├─⊷ *${prefix}ytmp3 <YouTube URL>*\n│  └⊷ Download from link\n├─⊷ *Reply to a text message*\n│  └⊷ Uses replied text as search\n╰───`
      }, { quoted: m });
    }

    console.log(`🎵 [YTMP3] Request: ${searchQuery}`);
    await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });

    try {
      let youtubeUrl = searchQuery;

      if (!searchQuery.match(/(youtube\.com|youtu\.be)/i)) {
        try {
          const { videos } = await yts(searchQuery);
          if (videos && videos.length > 0) {
            youtubeUrl = videos[0].url;
          }
        } catch {}
      }

      const apiRes = await axios.get(GIFTED_API, {
        params: { apikey: 'gifted', url: youtubeUrl, quality: '128kbps' },
        timeout: 25000
      });

      if (!apiRes.data?.success || !apiRes.data?.result?.download_url) {
        throw new Error('No download link returned');
      }

      const { title, youtube_id, quality, download_url } = apiRes.data.result;

      console.log(`🎵 [YTMP3] Found: ${title}`);
      await sock.sendMessage(jid, { react: { text: '📥', key: m.key } });

      const audioBuffer = await downloadAndValidate(download_url);
      const fileSizeMB = (audioBuffer.length / (1024 * 1024)).toFixed(1);

      if (parseFloat(fileSizeMB) > 50) {
        await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
        return sock.sendMessage(jid, { text: `❌ MP3 too large: ${fileSizeMB}MB\nMax size: 50MB` }, { quoted: m });
      }

      let thumbnailBuffer = null;
      const videoId = youtube_id || youtubeUrl.match(/(?:v=|youtu\.be\/)([^&?\/\s]{11})/)?.[1];
      if (videoId) {
        try {
          const thumbRes = await axios.get(
            `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            { responseType: 'arraybuffer', timeout: 10000 }
          );
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
            title: (title || 'YouTube Audio').substring(0, 60),
            body: `🎵 ${quality || '128kbps'} • ${fileSizeMB}MB | Downloaded by WOLFBOT`,
            mediaType: 2,
            thumbnail: thumbnailBuffer,
            sourceUrl: youtubeUrl,
            mediaUrl: youtubeUrl,
            renderLargerThumbnail: true
          }
        }
      }, { quoted: m });

      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
      console.log(`✅ [YTMP3] Success: ${title} (${fileSizeMB}MB)`);

    } catch (error) {
      console.error('❌ [YTMP3] Error:', error.message);
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      await sock.sendMessage(jid, { text: `❌ Error: ${error.message}` }, { quoted: m });
    }
  }
};
