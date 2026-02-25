import axios from 'axios';
import { getBotName } from '../../lib/botname.js';

const GIFTED_API = 'https://api.giftedtech.co.ke/api/stalk/tiktokstalk';

export default {
  name: 'tiktokstalk',
  aliases: ['ttstalk', 'tikstalk', 'tiktokinfo'],
  description: 'Stalk a TikTok user profile',
  category: 'Stalker Commands',

  async execute(sock, m, args, prefix) {
    const jid = m.key.remoteJid;

    if (!args || !args[0]) {
      return sock.sendMessage(jid, {
        text: `╭─⌈ 🔍 *TIKTOK STALKER* ⌋\n│\n├─⊷ *${prefix}tiktokstalk <username>*\n│  └⊷ Stalk a TikTok profile\n│\n├─⊷ *Example:*\n│  └⊷ ${prefix}tiktokstalk giftedtechke\n│\n╰───────────────\n> *${getBotName()} STALKER*`
      }, { quoted: m });
    }

    const username = args[0].replace('@', '').trim();
    await sock.sendMessage(jid, { react: { text: '🔍', key: m.key } });

    try {
      const res = await axios.get(GIFTED_API, {
        params: { apikey: 'gifted', username },
        timeout: 20000
      });

      if (!res.data?.success || !res.data?.result) {
        throw new Error('User not found');
      }

      const d = res.data.result;

      let avatarBuffer = null;
      if (d.avatar) {
        try {
          const imgRes = await axios.get(d.avatar, { responseType: 'arraybuffer', timeout: 10000 });
          if (imgRes.data.length > 500) avatarBuffer = Buffer.from(imgRes.data);
        } catch {}
      }

      const caption = `╭─⌈ 🎵 *TIKTOK PROFILE* ⌋\n│\n├─⊷ *👤 Name:* ${d.name || 'N/A'}\n├─⊷ *🏷️ Username:* @${d.username || username}\n├─⊷ *📝 Bio:* ${d.bio || 'N/A'}\n├─⊷ *👥 Followers:* ${(d.followers || 0).toLocaleString()}\n├─⊷ *👤 Following:* ${(d.following || 0).toLocaleString()}\n├─⊷ *❤️ Likes:* ${(d.likes || 0).toLocaleString()}\n├─⊷ *✅ Verified:* ${d.verified ? 'Yes' : 'No'}\n├─⊷ *🔒 Private:* ${d.private ? 'Yes' : 'No'}${d.website?.link ? `\n├─⊷ *🌐 Website:* ${d.website.link}` : ''}\n│\n╰───────────────\n> 🐺 *${getBotName()} STALKER*`;

      if (avatarBuffer) {
        await sock.sendMessage(jid, { image: avatarBuffer, caption }, { quoted: m });
      } else {
        await sock.sendMessage(jid, { text: caption }, { quoted: m });
      }

      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });

    } catch (error) {
      console.error('❌ [TIKTOKSTALK] Error:', error.message);
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      await sock.sendMessage(jid, {
        text: `❌ *TikTok Stalk Failed*\n\n⚠️ ${error.message}\n\n💡 Check the username and try again.`
      }, { quoted: m });
    }
  }
};
