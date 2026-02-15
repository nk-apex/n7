import axios from 'axios';

const WOLF_API = 'https://apis.xwolf.space/download/mp3';
const WOLF_STREAM = 'https://apis.xwolf.space/download/stream/mp3';
const KEITH_API = 'https://apiskeith.top';

const keithFallbackEndpoints = [
  `${KEITH_API}/download/ytmp3`,
  `${KEITH_API}/download/audio`,
  `${KEITH_API}/download/dlmp3`,
  `${KEITH_API}/download/mp3`,
  `${KEITH_API}/download/yta`,
  `${KEITH_API}/download/yta2`,
  `${KEITH_API}/download/yta3`
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
  if (headerStr.includes('<!doctype') || headerStr.includes('<html') || headerStr.includes('bad gateway')) {
    throw new Error('Received HTML instead of audio');
  }

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
      const streamUrl = data.streamUrl ? data.streamUrl.replace('http://', 'https://') : null;
      const downloadUrl = data.downloadUrl;

      console.log(`🎵 [MP3] Found: ${title}`);
      await sock.sendMessage(jid, { react: { text: '📥', key: m.key } });

      const downloadSources = [];

      if (streamUrl) {
        downloadSources.push({ url: streamUrl, label: 'WOLF Stream' });
      }

      if (downloadUrl && downloadUrl !== 'In Processing...' && downloadUrl.startsWith('http')) {
        downloadSources.push({ url: downloadUrl, label: 'WOLF Direct' });
      }

      downloadSources.push({ url: `${WOLF_STREAM}?url=${encodeURIComponent(youtubeUrl)}`, label: 'WOLF Stream URL' });

      let audioBuffer = null;
      let sourceUsed = '';

      for (const source of downloadSources) {
        try {
          console.log(`🎵 [MP3] Trying: ${source.label}`);
          audioBuffer = await downloadAndValidate(source.url);
          sourceUsed = source.label;
          break;
        } catch (err) {
          console.log(`🎵 [MP3] ${source.label} failed: ${err.message}`);
          continue;
        }
      }

      if (!audioBuffer) {
        console.log(`🎵 [MP3] All WOLF sources failed, trying Keith fallback`);
        const keithUrl = await getKeithDownloadUrl(youtubeUrl);
        if (keithUrl) {
          audioBuffer = await downloadAndValidate(keithUrl);
          sourceUsed = 'Keith Fallback';
        }
      }

      if (!audioBuffer) {
        await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
        return sock.sendMessage(jid, {
          text: `❌ *Download failed*\n\n🎵 ${title}\n\nAll download sources failed. Try \`${prefix}ytmp3 ${searchQuery}\``
        }, { quoted: m });
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
      console.log(`✅ [MP3] Success: ${title} (${fileSizeMB}MB) [${sourceUsed}]`);

    } catch (error) {
      console.error('❌ [MP3] Error:', error.message);
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      await sock.sendMessage(jid, {
        text: `❌ *MP3 Error:* ${error.message}\n\nTry: \`${prefix}ytmp3 ${args.join(' ')}\``
      }, { quoted: m });
    }
  }
};
