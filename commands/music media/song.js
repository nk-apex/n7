import axios from 'axios';
import yts from 'yt-search';

const GIFTED_API = 'https://api.giftedtech.co.ke/api/download/savetubemp3';

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
  name: 'song',
  aliases: ['music', 'audio', 'mp3', 'ytmusic'],
  category: 'Downloader',
  description: 'Download YouTube audio with embedded thumbnail',

  async execute(sock, m, args, prefix) {
    const jid = m.key.remoteJid;
    const quotedText = m.quoted?.text?.trim() || m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation?.trim() || '';

    let searchQuery = args.length > 0 ? args.join(' ') : quotedText;

    if (!searchQuery) {
      return sock.sendMessage(jid, {
        text: `╭─⌈ 🎵 *SONG DOWNLOADER* ⌋\n│\n├─⊷ *${prefix}song <song name>*\n│  └⊷ Download audio\n├─⊷ *${prefix}song <YouTube URL>*\n│  └⊷ Download from link\n├─⊷ *Reply to a text message*\n│  └⊷ Uses replied text as search\n╰───`
      }, { quoted: m });
    }

    console.log(`🎵 [SONG] Query: "${searchQuery}"`);
    await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });

    try {
      let videoUrl = searchQuery;
      let videoTitle = '';
      let author = '';
      let duration = '';
      let videoId = '';

      if (!searchQuery.match(/(youtube\.com|youtu\.be)/i)) {
        try {
          const { videos } = await yts(searchQuery);
          if (!videos || videos.length === 0) {
            await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
            return sock.sendMessage(jid, { text: `❌ No songs found for "${searchQuery}"` }, { quoted: m });
          }
          const video = videos[0];
          videoUrl = video.url;
          videoTitle = video.title;
          author = video.author?.name || '';
          duration = video.timestamp || '';
          videoId = video.videoId;
        } catch (err) {
          await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
          return sock.sendMessage(jid, { text: `❌ Search failed: ${err.message}` }, { quoted: m });
        }
      } else {
        videoId = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)?.[1] || '';
      }

      await sock.sendMessage(jid, { react: { text: '📥', key: m.key } });

      const apiRes = await axios.get(GIFTED_API, {
        params: { apikey: 'gifted', url: videoUrl },
        timeout: 30000
      });

      if (!apiRes.data?.success || !apiRes.data?.result?.download_url) {
        throw new Error('No download link returned');
      }

      const { title, thumbnail, quality, download_url } = apiRes.data.result;
      const trackTitle = title || videoTitle || 'Audio';

      console.log(`🎵 [SONG] Found: ${trackTitle}`);

      const audioBuffer = await downloadAndValidate(download_url);
      const fileSizeMB = (audioBuffer.length / (1024 * 1024)).toFixed(1);

      if (parseFloat(fileSizeMB) > 50) {
        await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
        return sock.sendMessage(jid, { text: `❌ File too large (${fileSizeMB}MB). Maximum size is 50MB.` }, { quoted: m });
      }

      let thumbnailBuffer = null;
      const thumbSrc = thumbnail || (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null);
      if (thumbSrc) {
        try {
          const thumbRes = await axios.get(thumbSrc, { responseType: 'arraybuffer', timeout: 10000 });
          if (thumbRes.data.length > 1000) thumbnailBuffer = Buffer.from(thumbRes.data);
        } catch {}
      }

      const cleanTitle = trackTitle.replace(/[^\w\s.-]/gi, '').substring(0, 50);

      await sock.sendMessage(jid, {
        audio: audioBuffer,
        mimetype: 'audio/mpeg',
        ptt: false,
        fileName: `${cleanTitle}.mp3`,
        contextInfo: {
          externalAdReply: {
            title: trackTitle.substring(0, 60),
            body: `🎵 ${author ? author + ' | ' : ''}${duration ? '⏱️ ' + duration + ' | ' : ''}${quality || '128kbps'} | Downloaded by WOLFBOT`,
            mediaType: 2,
            thumbnail: thumbnailBuffer,
            sourceUrl: videoUrl,
            mediaUrl: videoUrl,
            renderLargerThumbnail: true
          }
        }
      }, { quoted: m });

      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
      console.log(`✅ [SONG] Success: "${trackTitle}" (${fileSizeMB}MB)`);

    } catch (error) {
      console.error('❌ [SONG] ERROR:', error.message);
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      await sock.sendMessage(jid, { text: `❌ Error: ${error.message}` }, { quoted: m });
    }
  }
};
