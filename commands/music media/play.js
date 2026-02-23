import axios from 'axios';
import yts from 'yt-search';

const GIFTED_BASE = 'https://api.giftedtech.co.ke/api/download';

const AUDIO_ENDPOINTS = ['song', 'yta', 'dlmp3', 'ytmp3'];
const VIDEO_ENDPOINTS = ['ytv', 'dlmp4', 'ytmp4'];

async function queryAPI(url, endpoints) {
  for (const endpoint of endpoints) {
    try {
      const params = { apikey: 'gifted', url };
      if (endpoint === 'ytmp3') params.quality = '128kbps';
      const res = await axios.get(`${GIFTED_BASE}/${endpoint}`, { params, timeout: 25000 });
      if (res.data?.success && res.data?.result?.download_url) {
        return { success: true, data: res.data.result, endpoint };
      }
    } catch {}
  }
  return { success: false };
}

async function downloadAndValidate(url) {
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'arraybuffer',
    timeout: 90000,
    maxRedirects: 5,
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    validateStatus: (s) => s >= 200 && s < 400
  });
  const buffer = Buffer.from(response.data);
  if (buffer.length < 1000) throw new Error('File too small');
  const header = buffer.slice(0, 50).toString('utf8').toLowerCase();
  if (header.includes('<!doctype') || header.includes('<html')) throw new Error('Received HTML instead of audio');
  return buffer;
}

export default {
  name: 'play',
  aliases: ['ytmp3doc', 'audiodoc', 'ytplay'],
  category: 'Downloader',
  description: 'Download YouTube audio with fallback APIs',

  async execute(sock, m, args, prefix) {
    const jid = m.key.remoteJid;
    const quotedText = m.quoted?.text?.trim() || m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation?.trim() || '';

    const flags = { list: args.includes('list') || args.includes('search') };
    const queryArgs = args.filter(a => !['list', 'search'].includes(a));
    let searchQuery = queryArgs.length > 0 ? queryArgs.join(' ') : quotedText;

    if (!searchQuery && !flags.list) {
      return sock.sendMessage(jid, {
        text: `╭─⌈ 🎵 *PLAY COMMAND* ⌋\n│\n├─⊷ *${prefix}play <song name>*\n│  └⊷ Download audio\n├─⊷ *${prefix}play <YouTube URL>*\n│  └⊷ Download from link\n├─⊷ *${prefix}play list <query>*\n│  └⊷ Search and list results\n├─⊷ *Reply to a text message*\n│  └⊷ Uses replied text as search\n╰───`
      }, { quoted: m });
    }

    console.log(`🎵 [PLAY] Query: "${searchQuery}"`);
    await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });

    try {
      if (flags.list) {
        const listQuery = searchQuery || args.join(' ');
        const { videos } = await yts(listQuery);
        if (!videos?.length) {
          await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
          return sock.sendMessage(jid, { text: `❌ No results found for "${listQuery}"` }, { quoted: m });
        }
        let listText = `🔍 *Search Results:* "${listQuery}"\n\n`;
        videos.slice(0, 10).forEach((v, i) => {
          listText += `${i + 1}. ${v.title}\n   👤 ${v.author?.name || 'Unknown'}\n   ⏱️ ${v.timestamp || 'N/A'}\n   📺 ${prefix}play ${v.url}\n\n`;
        });
        await sock.sendMessage(jid, { text: listText }, { quoted: m });
        await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
        return;
      }

      let videoUrl = searchQuery;
      let videoTitle = '';
      let author = '';
      let duration = '';
      let videoId = '';
      let thumbnail = '';

      if (!searchQuery.match(/(youtube\.com|youtu\.be)/i)) {
        const { videos } = await yts(searchQuery);
        if (!videos?.length) {
          await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
          return sock.sendMessage(jid, { text: `❌ No results found for "${searchQuery}"` }, { quoted: m });
        }
        const v = videos[0];
        videoUrl = v.url;
        videoTitle = v.title;
        author = v.author?.name || '';
        duration = v.timestamp || '';
        videoId = v.videoId;
        thumbnail = v.thumbnail || '';
      } else {
        videoId = videoUrl.match(/(?:v=|youtu\.be\/)([^&?\/\s]{11})/i)?.[1] || '';
      }

      await sock.sendMessage(jid, { react: { text: '📥', key: m.key } });

      const result = await queryAPI(videoUrl, AUDIO_ENDPOINTS);
      if (!result.success) {
        await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
        return sock.sendMessage(jid, { text: `❌ All download services are currently unavailable. Please try again later.` }, { quoted: m });
      }

      const { data, endpoint } = result;
      const trackTitle = data.title || videoTitle || 'Audio';
      const quality = data.quality || '128kbps';
      const thumbUrl = data.thumbnail || thumbnail || (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null);

      console.log(`🎵 [PLAY] Found via ${endpoint}: ${trackTitle}`);

      const audioBuffer = await downloadAndValidate(data.download_url);
      const fileSizeMB = (audioBuffer.length / (1024 * 1024)).toFixed(1);

      if (parseFloat(fileSizeMB) > 50) {
        await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
        return sock.sendMessage(jid, { text: `❌ File too large (${fileSizeMB}MB). Maximum is 50MB.` }, { quoted: m });
      }

      let thumbnailBuffer = null;
      if (thumbUrl) {
        try {
          const tr = await axios.get(thumbUrl, { responseType: 'arraybuffer', timeout: 10000 });
          if (tr.data.length > 1000) thumbnailBuffer = Buffer.from(tr.data);
        } catch {}
      }

      const cleanTitle = trackTitle.replace(/[^\w\s.-]/gi, '').substring(0, 50);
      const fileName = `${cleanTitle}.mp3`;

      const contextInfo = {
        externalAdReply: {
          title: trackTitle.substring(0, 60),
          body: `🎵 ${author ? author + ' | ' : ''}${duration ? '⏱️ ' + duration + ' | ' : ''}${quality} | Downloaded by WOLFBOT`,
          mediaType: 2,
          thumbnail: thumbnailBuffer,
          sourceUrl: videoUrl,
          mediaUrl: videoUrl,
          renderLargerThumbnail: true
        }
      };

      await sock.sendMessage(jid, { audio: audioBuffer, mimetype: 'audio/mpeg', fileName, contextInfo }, { quoted: m });

      await sock.sendMessage(jid, {
        document: audioBuffer,
        mimetype: 'audio/mpeg',
        fileName,
        contextInfo: {
          ...contextInfo,
          externalAdReply: { ...contextInfo.externalAdReply, body: `📄 Document | ${quality} | Downloaded by WOLFBOT` }
        }
      }, { quoted: m });

      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
      console.log(`✅ [PLAY] Success: "${trackTitle}" (${fileSizeMB}MB) via ${endpoint}`);

    } catch (error) {
      console.error('❌ [PLAY] ERROR:', error.message);
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      await sock.sendMessage(jid, { text: `❌ Error: ${error.message}` }, { quoted: m });
    }
  }
};
