import axios from 'axios';
import { fileURLToPath } from 'url';

const WOLF_API = 'https://apis.xwolf.space/download/yta3';
const KEITH_API = 'https://apiskeith.top';

const keithFallbackEndpoints = [
  `${KEITH_API}/download/yta3`,
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

  if (buffer.length < 1000) {
    throw new Error('File too small, likely not audio');
  }

  const headerStr = buffer.slice(0, 50).toString('utf8').toLowerCase();
  if (headerStr.includes('<!doctype') || headerStr.includes('<html') || headerStr.includes('error')) {
    throw new Error('Received HTML instead of audio');
  }

  return buffer;
}

export default {
  name: 'yta3',
  description: 'Download audio via WOLF YTA3 API',
  category: 'Downloader',
  aliases: ['wolfyta3'],
  usage: 'yta3 <url or song name>',

  async execute(sock, m, args, prefix) {
    const jid = m.key.remoteJid;

    try {
      if (args.length === 0) {
        return sock.sendMessage(jid, {
          text: `🎵 *YTA3 - WOLF API Audio Downloader*\n\n` +
                `📌 *Usage:* \`${prefix}yta3 song name or url\`\n` +
                `📝 *Examples:*\n` +
                `• \`${prefix}yta3 Alan Walker Faded\`\n` +
                `• \`${prefix}yta3 https://youtube.com/...\`\n\n` +
                `✨ Downloads audio via WOLF YTA3 API`
        }, { quoted: m });
      }

      const searchQuery = args.join(' ');
      console.log(`🎵 [YTA3] Request: ${searchQuery}`);

      await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });

      const apiUrl = `${WOLF_API}?url=${encodeURIComponent(searchQuery)}`;
      const response = await axios.get(apiUrl, { timeout: 20000 });

      if (!response.data?.success) {
        throw new Error('WOLF API returned no results');
      }

      const data = response.data;
      const title = data.title || data.searchResult?.title || 'Unknown Track';
      const duration = data.searchResult?.duration || '';
      const videoId = data.videoId || '';
      const youtubeUrl = data.youtubeUrl || searchQuery;
      const fileSize = data.fileSize || '';

      console.log(`🎵 [YTA3] Found: ${title}`);
      await sock.sendMessage(jid, { react: { text: '📥', key: m.key } });

      let downloadUrl = data.downloadUrl;
      let usedWolfDirect = false;

      if (downloadUrl && downloadUrl !== 'In Processing...' && downloadUrl.startsWith('http')) {
        usedWolfDirect = true;
        console.log(`🎵 [YTA3] Using WOLF API direct download`);
      } else {
        console.log(`🎵 [YTA3] WOLF downloadUrl unavailable, using Keith fallback`);
        downloadUrl = await getKeithDownloadUrl(youtubeUrl);
      }

      if (!downloadUrl) {
        await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
        return sock.sendMessage(jid, {
          text: `❌ *Download failed*\n\n🎵 ${title}\n\nCouldn't get download link. Try \`${prefix}ytmp3 ${searchQuery}\``
        }, { quoted: m });
      }

      let audioBuffer;
      try {
        audioBuffer = await downloadAndValidate(downloadUrl);
      } catch (dlErr) {
        console.log(`🎵 [YTA3] First download failed (${dlErr.message}), trying Keith fallback`);
        if (usedWolfDirect) {
          const fallbackUrl = await getKeithDownloadUrl(youtubeUrl);
          if (fallbackUrl) {
            audioBuffer = await downloadAndValidate(fallbackUrl);
          } else {
            throw new Error('All download sources failed');
          }
        } else {
          throw dlErr;
        }
      }

      const fileSizeMB = (audioBuffer.length / (1024 * 1024)).toFixed(1);

      if (parseFloat(fileSizeMB) > 50) {
        await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
        return sock.sendMessage(jid, {
          text: `❌ File too large: ${fileSizeMB}MB (max 50MB)`
        }, { quoted: m });
      }

      let thumbnailBuffer = null;
      if (videoId) {
        try {
          const thumbRes = await axios.get(
            `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            { responseType: 'arraybuffer', timeout: 10000 }
          );
          if (thumbRes.status === 200 && thumbRes.data.length > 1000) {
            thumbnailBuffer = Buffer.from(thumbRes.data);
          }
        } catch {}
      }

      const cleanTitle = title.replace(/[^\w\s.-]/gi, '').substring(0, 50);

      await sock.sendMessage(jid, {
        audio: audioBuffer,
        mimetype: 'audio/mpeg',
        ptt: false,
        fileName: `${cleanTitle}.mp3`,
        contextInfo: {
          externalAdReply: {
            title: title.substring(0, 60),
            body: `🎵 ${duration ? duration + ' • ' : ''}${fileSize || fileSizeMB + 'MB'} | Downloaded using WOLF API`,
            mediaType: 2,
            thumbnail: thumbnailBuffer,
            sourceUrl: youtubeUrl,
            mediaUrl: youtubeUrl,
            renderLargerThumbnail: true
          }
        }
      }, { quoted: m });

      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
      console.log(`✅ [YTA3] Success: ${title} (${fileSizeMB}MB)${usedWolfDirect ? ' [WOLF Direct]' : ' [Keith Fallback]'}`);

    } catch (error) {
      console.error('❌ [YTA3] Error:', error.message);
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      await sock.sendMessage(jid, {
        text: `❌ *YTA3 Error:* ${error.message}\n\nTry: \`${prefix}ytmp3 ${args.join(' ')}\``
      }, { quoted: m });
    }
  }
};
