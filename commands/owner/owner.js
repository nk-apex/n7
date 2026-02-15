export default {
  name: 'owner',
  alias: ['creator', 'dev', 'developer'],
  description: 'Show bot owner contact information',
  category: 'owner',

  async execute(sock, m, args) {
    const jid = m.key.remoteJid;
    const ownerNumber = '254713046497';
    const ownerJid = `${ownerNumber}@s.whatsapp.net`;

    try {
      await sock.sendMessage(jid, { react: { text: '👑', key: m.key } });
    } catch (e) {}

    const vcard =
      'BEGIN:VCARD\n' +
      'VERSION:3.0\n' +
      'FN:Silent Wolf (Bot Owner)\n' +
      'ORG:Silent Wolf Bot;\n' +
      'TEL;type=CELL;type=VOICE;waid=' + ownerNumber + ':+' + ownerNumber + '\n' +
      'END:VCARD';

    try {
      const { createRequire } = await import('module');
      const require = createRequire(import.meta.url);
      const { sendInteractiveMessage } = require('gifted-btns');

      await sendInteractiveMessage(sock, jid, {
        text: `👑 *WOLFBOT OWNER*\n\n📱 *+${ownerNumber}*`,
        footer: '🐺WolfBot',
        interactiveButtons: [
          {
            name: 'cta_copy',
            buttonParamsJson: JSON.stringify({
              display_text: '📋 Copy Number',
              copy_code: '+' + ownerNumber
            })
          },
          {
            name: 'cta_url',
            buttonParamsJson: JSON.stringify({
              display_text: '💬 Message Owner',
              url: 'https://wa.me/' + ownerNumber
            })
          }
        ]
      });

      await sock.sendMessage(jid, {
        contacts: {
          displayName: 'Silent Wolf (Bot Owner)',
          contacts: [{ vcard }]
        }
      }, { quoted: m });

    } catch (btnErr) {
      console.log('[OWNER] Buttons failed, using fallback:', btnErr.message);
      await sock.sendMessage(jid, {
        text: `👑 *SILENT WOLF BOT OWNER*\n\n📱 *+${ownerNumber}*\n\n💬 https://wa.me/${ownerNumber}`
      }, { quoted: m });
      await sock.sendMessage(jid, {
        contacts: {
          displayName: 'Silent Wolf (Bot Owner)',
          contacts: [{ vcard }]
        }
      }, { quoted: m });
    }
  }
};
