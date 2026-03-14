import axios from 'axios';
import { getBotName } from '../../lib/botname.js';
import { getOwnerName } from '../../lib/menuHelper.js';

const GIFTED_BASE = 'https://api.giftedtech.co.ke/api/download';

function isFacebookUrl(url) {
  return /facebook\.com|fb\.watch|fb\.com/i.test(url);
}

function formatViews(n) {
  if (!n && n !== 0) return 'N/A';
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)         return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

async function fetchFbInfo(url) {
  try {
    const res = await axios.get(`${GIFTED_BASE}/facebookv2`, {
      params: { apikey: 'gifted', url },
      timeout: 30000
    });
    const r = res.data?.result;
    if (res.data?.success && r && (r.links?.length || r.title)) {
      return {
        success: true,
        title:      r.title     || 'Facebook Video',
        uploader:   r.uploader  || null,
        duration:   r.duration  || null,
        views:      r.view_count ?? null,
        thumbnail:  r.thumbnail || null,
        url,
        links: (r.links || []).map(l => ({
          quality: l.quality || l.resolution || 'Unknown',
          ext:     l.ext     || 'mp4',
          url:     l.url     || l.link || ''
        })).filter(l => l.url),
        source: 'v2'
      };
    }
  } catch {}

  try {
    const res = await axios.get(`${GIFTED_BASE}/facebook`, {
      params: { apikey: 'gifted', url },
      timeout: 30000
    });
    const r = res.data?.result;
    if (res.data?.success && (r?.hd_video || r?.sd_video)) {
      const links = [];
      if (r.hd_video) links.push({ quality: 'HD', ext: 'mp4', url: r.hd_video });
      if (r.sd_video) links.push({ quality: 'SD', ext: 'mp4', url: r.sd_video });
      return {
        success: true,
        title:    r.title    || 'Facebook Video',
        duration: r.duration || null,
        thumbnail: r.thumbnail || null,
        url,
        links,
        source: 'v1'
      };
    }
  } catch {}

  return { success: false };
}

export default {
  name: 'fbsearch',
  aliases: ['fbs', 'fbinfo', 'fbvid'],
  description: 'Get Facebook video info and download links',
  category: 'Downloader',

  async execute(sock, m, args, prefix) {
    const jid  = m.key.remoteJid;
    const p    = prefix || '.';
    const input = args.join(' ').trim() || m.quoted?.text?.trim() || '';

    if (!input) {
      return sock.sendMessage(jid, {
        text: `╭─⌈ 📘 *FBSEARCH* ⌋\n│\n├─⊷ *${p}fbsearch <Facebook URL>*\n│  └⊷ Get video info + all quality links\n├─⊷ *Reply to a Facebook link*\n│  └⊷ Works with reels, posts & videos\n│\n├─⊷ *Example:*\n│  └⊷ ${p}fbsearch https://fb.watch/...\n│  └⊷ ${p}fbsearch https://www.facebook.com/reel/...\n│\n╰⊷ *Powered by ${getOwnerName().toUpperCase()} TECH*`
      }, { quoted: m });
    }

    if (!isFacebookUrl(input)) {
      return sock.sendMessage(jid, {
        text: `❌ *Not a Facebook URL*\n\nPlease send a valid Facebook video/reel link.\n\n*Example:*\n• ${p}fbsearch https://www.facebook.com/reel/123456\n• ${p}fbsearch https://fb.watch/abc123`
      }, { quoted: m });
    }

    await sock.sendMessage(jid, { react: { text: '🔍', key: m.key } });

    const info = await fetchFbInfo(input);

    if (!info.success) {
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      return sock.sendMessage(jid, {
        text: `❌ *Could not fetch video info.*\n\nMake sure the video is public and the URL is correct.\n\nTip: Copy the full URL from the Facebook app.`
      }, { quoted: m });
    }

    const qualityList = info.links.length
      ? info.links.map((l, i) => `│  ${i + 1}. 📹 *${l.quality}* — ${l.url.substring(0, 60)}...`).join('\n')
      : '│  No download links found';

    let text = `╭─⌈ 📘 *FACEBOOK VIDEO INFO* ⌋\n│\n`;
    text += `├─⊷ 🎬 *Title:* ${info.title}\n`;
    if (info.uploader) text += `├─⊷ 👤 *Uploader:* ${info.uploader}\n`;
    if (info.duration)  text += `├─⊷ ⏱️ *Duration:* ${info.duration}\n`;
    if (info.views !== null && info.views !== undefined) text += `├─⊷ 👁️ *Views:* ${formatViews(info.views)}\n`;
    text += `├─⊷ 🔗 *URL:* ${input}\n`;
    text += `│\n├─⌈ 📥 *Available Downloads (${info.links.length})* ⌋\n`;
    text += qualityList + '\n';
    text += `│\n├─⊷ 💡 *Tip:* Use *${p}video <url>* to download directly\n`;
    text += `╰⊷ *Powered by ${getBotName()}*`;

    await sock.sendMessage(jid, { text }, { quoted: m });
    await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
    console.log(`\x1b[32m✅ [FBSEARCH] ${info.title} — ${info.links.length} quality options\x1b[0m`);
  }
};
