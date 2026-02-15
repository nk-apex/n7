import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WOLF_API = 'https://apis.xwolf.space/download/mp4';
const KEITH_API = 'https://apiskeith.top';

const videoEndpoints = [
  `${KEITH_API}/download/ytmp4`,
  `${KEITH_API}/download/video`,
  `${KEITH_API}/download/mp4`
];

async function getDownloadUrl(videoUrl) {
  for (const endpoint of videoEndpoints) {
    try {
      const response = await axios.get(
        `${endpoint}?url=${encodeURIComponent(videoUrl)}`,
        { timeout: 20000 }
      );
      if (response.data?.status && response.data?.result) {
        console.log(`[MP4] Got download URL from: ${endpoint}`);
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
    timeout: 120000,
    maxRedirects: 5,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    validateStatus: (status) => status >= 200 && status < 400
  });

  const buffer = Buffer.from(response.data);

  if (buffer.length < 5000) {
    throw new Error('File too small, likely not video');
  }

  const headerStr = buffer.slice(0, 50).toString('utf8').toLowerCase();

  if (headerStr.includes('<!doctype') || headerStr.includes('<html') || headerStr.includes('error')) {
    throw new Error('Received HTML instead of video');
  }

  fs.writeFileSync(tempFile, buffer);
  return buffer;
}

export default {
  name: 'mp4',
  description: 'Download MP4 video via WOLF API',
  category: 'Downloader',
  aliases: ['wolfmp4', 'wvideo'],
  usage: 'mp4 <url or video name>',

  async execute(sock, m, args, prefix) {
    const jid = m.key.remoteJid;

    try {
      if (args.length === 0) {
        return sock.sendMessage(jid, {
          text: `🎬 *MP4 - WOLF API Video Downloader*\n\n` +
                `📌 *Usage:* \`${prefix}mp4 video name or url\`\n` +
                `📝 *Examples:*\n` +
                `• \`${prefix}mp4 funny cats compilation\`\n` +
                `• \`${prefix}mp4 https://youtube.com/...\`\n\n` +
                `✨ Downloads video via WOLF API`
        }, { quoted: m });
      }

      const searchQuery = args.join(' ');
      console.log(`🎬 [MP4] Request: ${searchQuery}`);

      await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });

      const apiUrl = `${WOLF_API}?url=${encodeURIComponent(searchQuery)}`;
      let title = 'Unknown Video';
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
        console.log(`[MP4] WOLF API failed: ${wolfErr.message}, using search query directly`);
      }

      console.log(`🎬 [MP4] Found: ${title}`);
      await sock.sendMessage(jid, { react: { text: '📥', key: m.key } });

      const downloadUrl = await getDownloadUrl(youtubeUrl);

      if (!downloadUrl) {
        await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
        return sock.sendMessage(jid, {
          text: `❌ *Download failed*\n\n🎬 ${title}\n\nCouldn't get download link. Try \`${prefix}ytmp4 ${searchQuery}\``
        }, { quoted: m });
      }

      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
      const tempFile = path.join(tempDir, `mp4_${Date.now()}.mp4`);

      let videoBuffer;
      try {
        videoBuffer = await downloadAndValidate(downloadUrl, tempFile);
      } catch (dlErr) {
        console.log(`[MP4] First download failed: ${dlErr.message}, trying next endpoint`);
        const altUrl = await getDownloadUrl(youtubeUrl);
        if (altUrl && altUrl !== downloadUrl) {
          videoBuffer = await downloadAndValidate(altUrl, tempFile);
        } else {
          throw new Error('All download sources failed');
        }
      }

      const fileSizeMB = (videoBuffer.length / (1024 * 1024)).toFixed(1);

      if (parseFloat(fileSizeMB) > 99) {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
        return sock.sendMessage(jid, {
          text: `❌ Video too large: ${fileSizeMB}MB (max 99MB)`
        }, { quoted: m });
      }

      let thumbnailBuffer = null;
      if (videoId) {
        try {
          const thumbRes = await axios.get(
            `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            { responseType: 'arraybuffer', timeout: 10000 }
          );
          if (thumbRes.status === 200) {
            thumbnailBuffer = Buffer.from(thumbRes.data);
          }
        } catch {}
      }

      const cleanTitle = title.replace(/[^\w\s.-]/gi, '').substring(0, 50);

      await sock.sendMessage(jid, {
        video: videoBuffer,
        mimetype: 'video/mp4',
        caption: `🎬 ${title}\n${duration ? `⏱️ ${duration} • ` : ''}📦 ${fileSizeMB}MB\n\n_Downloaded using WOLF API_ 🐺`,
        fileName: `${cleanTitle}.mp4`,
        thumbnail: thumbnailBuffer,
        gifPlayback: false
      }, { quoted: m });

      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);

      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
      console.log(`✅ [MP4] Success: ${title} (${fileSizeMB}MB)`);

    } catch (error) {
      console.error('❌ [MP4] Error:', error.message);
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      await sock.sendMessage(jid, {
        text: `❌ *MP4 Error:* ${error.message}\n\nTry: \`${prefix}ytmp4 ${args.join(' ')}\``
      }, { quoted: m });
    }
  }
};
