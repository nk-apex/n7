import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WOLF_API = 'https://apis.xwolf.space/download/mp3';
const KEITH_API = 'https://apiskeith.top';

const audioEndpoints = [
  `${KEITH_API}/download/ytmp3`,
  `${KEITH_API}/download/audio`,
  `${KEITH_API}/download/dlmp3`,
  `${KEITH_API}/download/mp3`,
  `${KEITH_API}/download/yta`,
  `${KEITH_API}/download/yta2`,
  `${KEITH_API}/download/yta3`
];

async function getDownloadUrl(videoUrl) {
  for (const endpoint of audioEndpoints) {
    try {
      const response = await axios.get(
        `${endpoint}?url=${encodeURIComponent(videoUrl)}`,
        { timeout: 15000 }
      );
      if (response.data?.status && response.data?.result) {
        console.log(`[MP3] Got download URL from: ${endpoint}`);
        return response.data.result;
      }
    } catch {
      continue;
    }
  }
  return null;
}

async function downloadAndValidate(downloadUrl, tempFile) {
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

  const header = buffer.slice(0, 4).toString('hex').toUpperCase();
  const headerStr = buffer.slice(0, 50).toString('utf8').toLowerCase();

  if (headerStr.includes('<!doctype') || headerStr.includes('<html') || headerStr.includes('error')) {
    throw new Error('Received HTML instead of audio');
  }

  fs.writeFileSync(tempFile, buffer);
  return buffer;
}

export default {
  name: 'mp3',
  description: 'Download MP3 audio via WOLF API',
  category: 'Downloader',
  aliases: ['wolfaudio', 'waudio'],
  usage: 'mp3 <url or song name>',

  async execute(sock, m, args, prefix) {
    const jid = m.key.remoteJid;

    try {
      if (args.length === 0) {
        return sock.sendMessage(jid, {
          text: `🎵 *MP3 - WOLF API Audio Downloader*\n\n` +
                `📌 *Usage:* \`${prefix}mp3 song name or url\`\n` +
                `📝 *Examples:*\n` +
                `• \`${prefix}mp3 Ed Sheeran Shape of You\`\n` +
                `• \`${prefix}mp3 https://youtube.com/...\`\n\n` +
                `✨ Downloads audio via WOLF API`
        }, { quoted: m });
      }

      const searchQuery = args.join(' ');
      console.log(`🎵 [MP3] Request: ${searchQuery}`);

      await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });

      const apiUrl = `${WOLF_API}?url=${encodeURIComponent(searchQuery)}`;
      let title = 'Unknown Track';
      let videoId = '';
      let youtubeUrl = searchQuery;
      let duration = '';

      try {
        const response = await axios.get(apiUrl, { timeout: 20000 });
        if (response.data?.success) {
          const data = response.data;
          title = data.title || data.searchResult?.title || title;
          duration = data.searchResult?.duration || '';
          videoId = data.videoId || '';
          youtubeUrl = data.youtubeUrl || searchQuery;
        }
      } catch (wolfErr) {
        console.log(`[MP3] WOLF API failed: ${wolfErr.message}, using search query directly`);
      }

      console.log(`🎵 [MP3] Found: ${title}`);
      await sock.sendMessage(jid, { react: { text: '📥', key: m.key } });

      const downloadUrl = await getDownloadUrl(youtubeUrl);

      if (!downloadUrl) {
        await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
        return sock.sendMessage(jid, {
          text: `❌ *Download failed*\n\n🎵 ${title}\n\nCouldn't get download link. Try \`${prefix}ytmp3 ${searchQuery}\``
        }, { quoted: m });
      }

      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
      const tempFile = path.join(tempDir, `mp3_${Date.now()}.mp3`);

      let audioBuffer;
      try {
        audioBuffer = await downloadAndValidate(downloadUrl, tempFile);
      } catch (dlErr) {
        console.log(`[MP3] First download failed: ${dlErr.message}, trying next endpoint`);
        const altUrl = await getDownloadUrl(youtubeUrl);
        if (altUrl && altUrl !== downloadUrl) {
          audioBuffer = await downloadAndValidate(altUrl, tempFile);
        } else {
          throw new Error('All download sources failed');
        }
      }

      const fileSizeMB = (audioBuffer.length / (1024 * 1024)).toFixed(1);

      if (parseFloat(fileSizeMB) > 50) {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
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
            body: `🎵 ${duration ? duration + ' • ' : ''}${fileSizeMB}MB | Downloaded using WOLF API`,
            mediaType: 2,
            thumbnail: thumbnailBuffer,
            sourceUrl: youtubeUrl,
            mediaUrl: youtubeUrl,
            renderLargerThumbnail: true
          }
        }
      }, { quoted: m });

      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);

      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
      console.log(`✅ [MP3] Success: ${title} (${fileSizeMB}MB)`);

    } catch (error) {
      console.error('❌ [MP3] Error:', error.message);
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      await sock.sendMessage(jid, {
        text: `❌ *MP3 Error:* ${error.message}\n\nTry: \`${prefix}ytmp3 ${args.join(' ')}\``
      }, { quoted: m });
    }
  }
};
