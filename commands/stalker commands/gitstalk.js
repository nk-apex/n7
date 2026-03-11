import axios from 'axios';
import { getBotName } from '../../lib/botname.js';
import { getOwnerName } from '../../lib/menuHelper.js';

const GIFTED_API = 'https://api.giftedtech.co.ke/api/stalk/gitstalk';

export default {
  name: 'gitstalk',
  aliases: ['githubstalk', 'ghstalk', 'gitinfo'],
  description: 'Stalk a GitHub user profile',
  category: 'Stalker Commands',

  async execute(sock, m, args, prefix) {
    const jid = m.key.remoteJid;

    if (!args || !args[0]) {
      return sock.sendMessage(jid, {
        text: `╭─⌈ 🔍 *GITHUB STALKER* ⌋\n│\n├─⊷ *${prefix}gitstalk <username>*\n│  └⊷ Stalk a GitHub profile\n│\n├─⊷ *Example:*\n│  └⊷ ${prefix}gitstalk mauricegift\n│\n╰⊷ *Powered by ${getOwnerName().toUpperCase()} TECH*`
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
        throw new Error('User not found on GitHub');
      }

      const d = res.data.result;

      let avatarBuffer = null;
      if (d.avatar_url) {
        try {
          const imgRes = await axios.get(d.avatar_url, { responseType: 'arraybuffer', timeout: 10000 });
          if (imgRes.data.length > 500) avatarBuffer = Buffer.from(imgRes.data);
        } catch {}
      }

      const joined = d.created_at ? new Date(d.created_at).toLocaleDateString() : 'N/A';

      const caption = `╭─⌈ 🐙 *GITHUB PROFILE* ⌋\n│\n├─⊷ *👤 Name:* ${d.name || 'N/A'}\n├─⊷ *🏷️ Username:* @${d.login || username}\n├─⊷ *📝 Bio:* ${d.bio || 'N/A'}\n├─⊷ *🏢 Company:* ${d.company || 'N/A'}\n├─⊷ *📍 Location:* ${d.location || 'N/A'}${d.email ? `\n├─⊷ *📧 Email:* ${d.email}` : ''}${d.blog ? `\n├─⊷ *🌐 Website:* ${d.blog}` : ''}\n├─⊷ *📦 Public Repos:* ${d.public_repos || 0}\n├─⊷ *👥 Followers:* ${(d.followers || 0).toLocaleString()}\n├─⊷ *👤 Following:* ${(d.following || 0).toLocaleString()}\n├─⊷ *📅 Joined:* ${joined}\n├─⊷ *🔗 Profile:* ${d.html_url || `https://github.com/${username}`}\n│\n╰───────────────\n> 🐺 *${getBotName()} STALKER*`;

      if (avatarBuffer) {
        await sock.sendMessage(jid, { image: avatarBuffer, caption }, { quoted: m });
      } else {
        await sock.sendMessage(jid, { text: caption }, { quoted: m });
      }

      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });

    } catch (error) {
      console.error('❌ [GITSTALK] Error:', error.message);
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      await sock.sendMessage(jid, {
        text: `❌ *GitHub Stalk Failed*\n\n⚠️ ${error.message}\n\n💡 Check the username and try again.`
      }, { quoted: m });
    }
  }
};
