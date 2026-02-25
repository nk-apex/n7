import { getBotName } from '../../lib/botname.js';
export default {
  name: 'stalkermenu',
  aliases: ['smenu', 'stalkermenu', 'stalkercmds'],
  description: 'Shows all Stalker commands',
  category: 'Stalker Commands',

  async execute(sock, m, args, prefix) {
    const jid = m.key.remoteJid;

    const menu = `╭─⌈ 🕵️ *STALKER COMMANDS* ⌋
│
├─⊷ *📢 WhatsApp Channel*
│  • ${prefix}wachannel <URL>
│  └⊷ Stalk a WhatsApp Channel
│
├─⊷ *🎵 TikTok*
│  • ${prefix}tiktokstalk <username>
│  └⊷ Stalk a TikTok profile
│
├─⊷ *🐦 Twitter/X*
│  • ${prefix}twitterstalk <username>
│  └⊷ Stalk a Twitter/X profile
│
├─⊷ *🌐 IP Address*
│  • ${prefix}ipstalk <IP>
│  └⊷ Look up IP address info
│
├─⊷ *📸 Instagram*
│  • ${prefix}igstalk <username>
│  └⊷ Stalk an Instagram profile
│
├─⊷ *📦 NPM Package*
│  • ${prefix}npmstalk <package>
│  └⊷ Look up NPM package info
│
├─⊷ *🐙 GitHub*
│  • ${prefix}gitstalk <username>
│  └⊷ Stalk a GitHub profile
│
╰───────────────
> 🐺 *${getBotName()} STALKER COMMANDS*`;

    await sock.sendMessage(jid, { text: menu }, { quoted: m });
  }
};
