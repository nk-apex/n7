import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WOLF_API = 'https://apis.xwolf.space/download/mp3';
const KEITH_API = 'https://apiskeith.top';

const keithFallbackEndpoints = [
  `${KEITH_API}/download/mp3`,
  `${KEITH_API}/download/ytmp3`,
  `${KEITH_API}/download/dlmp3`,
  `${KEITH_API}/download/audio`
];

async function downloadWithFallback(videoUrl) {
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
      const response = await axios.get(apiUrl, { timeout: 20000 });

      if (!response.data?.success) {
        throw new Error('WOLF API returned no results');
      }

      const data = response.data;
      const title = data.title || data.searchResult?.title || 'Unknown Track';
      const channelTitle = data.channelTitle || data.searchResult?.channelTitle || '';
      const duration = data.searchResult?.duration || '';
      const videoId = data.videoId || '';
      const youtubeUrl = data.youtubeUrl || searchQuery;

      console.log(`🎵 [MP3] Found: ${title}`);

      await sock.sendMessage(jid, { react: { text: '📥', key: m.key } });

      let downloadUrl = data.downloadUrl;

      if (!downloadUrl) {
        downloadUrl = await downloadWithFallback(youtubeUrl);
      }

      if (!downloadUrl) {
        await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
        return sock.sendMessage(jid, {
          text: `❌ *Download failed*\n\n🎵 ${title}\n\nCouldn't get download link. Try \`${prefix}ytmp3 ${searchQuery}\``
        }, { quoted: m });
      }

      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

      const tempFile = path.join(tempDir, `mp3_${Date.now()}.mp3`);

      const dlResponse = await axios({
        url: downloadUrl,
        method: 'GET',
        responseType: 'stream',
        timeout: 60000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });

      const writer = fs.createWriteStream(tempFile);
      dlResponse.data.pipe(writer);
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      const stats = fs.statSync(tempFile);
      if (stats.size === 0) throw new Error('Downloaded file is empty');

      const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(1);

      if (parseFloat(fileSizeMB) > 50) {
        fs.unlinkSync(tempFile);
        await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
        return sock.sendMessage(jid, {
          text: `❌ File too large: ${fileSizeMB}MB (max 50MB)`
        }, { quoted: m });
      }

      const audioBuffer = fs.readFileSync(tempFile);

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
