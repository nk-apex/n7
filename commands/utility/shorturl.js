import fetch from 'node-fetch';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { sendInteractiveMessage } = require('gifted-btns');

export default {
  name: 'shorturl',
  alias: ['tinyurl', 'shorten'],
  description: '🔗 Shorten a long URL',
  category: 'utility',
  usage: '.shorturl <long URL>',

  async execute(sock, m, args, from, isGroup, sender) {
    const jid = typeof from === 'string' ? from : m.key.remoteJid;

    if (!args.length) {
      return sock.sendMessage(
        jid,
        { text: '❌ Please provide a URL to shorten.\nExample: `.shorturl https://example.com`' },
        { quoted: m }
      );
    }

    const longUrl = args[0];

    try {
      const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
      const shortUrl = await response.text();

      try {
        await sendInteractiveMessage(sock, jid, {
          text: `┌─ 🔗 *URL Shortened* ─┐\n│\n│ ${shortUrl}\n│\n└─ _WOLF-BOT_ ─┘`,
          footer: '🐺 Silent Wolf Bot',
          interactiveButtons: [
            {
              name: 'cta_copy',
              buttonParamsJson: JSON.stringify({
                display_text: '📋 Copy URL',
                copy_code: shortUrl
              })
            },
            {
              name: 'cta_url',
              buttonParamsJson: JSON.stringify({
                display_text: '🌐 Open Link',
                url: shortUrl
              })
            }
          ]
        });
      } catch (btnErr) {
        console.log('[ShortURL] Interactive failed:', btnErr.message);
        await sock.sendMessage(jid, { text: `🔗 *Shortened URL:*\n${shortUrl}` }, { quoted: m });
      }

    } catch (err) {
      console.error('[ShortURL Error]', err);
      if (typeof jid === 'string') {
        sock.sendMessage(jid, { text: '❌ Failed to shorten URL. Please try again later.' }, { quoted: m });
      }
    }
  }
};
