import axios from 'axios';
import { getBotName } from '../../lib/botname.js';

const GIFTED_API = 'https://api.giftedtech.co.ke/api/stalk/npmstalk';

export default {
  name: 'npmstalk',
  aliases: ['npminfo', 'npmlookup', 'pkgstalk'],
  description: 'Look up an NPM package',
  category: 'Stalker Commands',

  async execute(sock, m, args, prefix) {
    const jid = m.key.remoteJid;

    if (!args || !args[0]) {
      return sock.sendMessage(jid, {
        text: `╭─⌈ 🔍 *NPM PACKAGE STALKER* ⌋\n│\n├─⊷ *${prefix}npmstalk <package name>*\n│  └⊷ Look up an NPM package\n│\n├─⊷ *Example:*\n│  └⊷ ${prefix}npmstalk express\n│  └⊷ ${prefix}npmstalk gifted-btns\n│\n╰───────────────\n> *${getBotName()} STALKER*`
      }, { quoted: m });
    }

    const packagename = args.join(' ').trim();
    await sock.sendMessage(jid, { react: { text: '🔍', key: m.key } });

    try {
      const res = await axios.get(GIFTED_API, {
        params: { apikey: 'gifted', packagename },
        timeout: 25000
      });

      if (!res.data?.success || !res.data?.result) {
        throw new Error('Package not found on NPM');
      }

      const d = res.data.result;

      const name = d.name || packagename;
      const version = d.version || d['dist-tags']?.latest || 'N/A';
      const description = d.description || 'No description';
      const author = d.author?.name || d.author || 'N/A';
      const license = d.license || 'N/A';
      const homepage = d.homepage || `https://npmjs.com/package/${name}`;
      const downloads = d.downloads || d.weeklyDownloads || 'N/A';
      const keywords = Array.isArray(d.keywords) ? d.keywords.slice(0, 5).join(', ') : (d.keywords || 'N/A');
      const created = d.created || d.time?.created ? new Date(d.created || d.time.created).toLocaleDateString() : 'N/A';
      const modified = d.modified || d.time?.modified ? new Date(d.modified || d.time?.modified).toLocaleDateString() : 'N/A';

      const caption = `╭─⌈ 📦 *NPM PACKAGE INFO* ⌋\n│\n├─⊷ *📦 Package:* ${name}\n├─⊷ *🔢 Version:* ${version}\n├─⊷ *📝 Description:* ${description}\n├─⊷ *👤 Author:* ${author}\n├─⊷ *📄 License:* ${license}\n├─⊷ *🏷️ Keywords:* ${keywords}${downloads !== 'N/A' ? `\n├─⊷ *📊 Downloads:* ${downloads}` : ''}\n├─⊷ *📅 Created:* ${created}\n├─⊷ *🔄 Updated:* ${modified}\n├─⊷ *🌐 Homepage:* ${homepage}\n│\n╰───────────────\n> 🐺 *${getBotName()} STALKER*`;

      await sock.sendMessage(jid, { text: caption }, { quoted: m });
      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });

    } catch (error) {
      console.error('❌ [NPMSTALK] Error:', error.message);
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      await sock.sendMessage(jid, {
        text: `❌ *NPM Stalk Failed*\n\n⚠️ ${error.message}\n\n💡 Check the package name and try again.`
      }, { quoted: m });
    }
  }
};
