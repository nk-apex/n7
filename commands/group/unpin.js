import * as baileys from '@whiskeysockets/baileys';
const { proto } = baileys;

export default {
  name: 'unpin',
  alias: ['unpinmessage', 'unpinmsg'],
  description: 'Unpin a replied pinned message in the group',
  category: 'group',

  async execute(sock, msg, args, from, isGroup, sender) {
    const jid = msg.key.remoteJid;

    if (!jid.endsWith('@g.us')) {
      return sock.sendMessage(jid, { text: '❌ This command only works in groups.' }, { quoted: msg });
    }

    const quotedKey = msg.message?.extendedTextMessage?.contextInfo;

    if (!quotedKey?.stanzaId) {
      return sock.sendMessage(jid, {
        text: '⚠️ *Reply to the pinned message* you want to unpin.\nExample: reply to the pinned message with *.unpin*'
      }, { quoted: msg });
    }

    try {
      await sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } });

      const pinnedMsgKey = {
        remoteJid: jid,
        fromMe: quotedKey.participant === sock.user?.id || quotedKey.participant === sock.user?.lid,
        id: quotedKey.stanzaId,
        participant: quotedKey.participant
      };

      await sock.sendMessage(jid, {
        pin: pinnedMsgKey,
        type: proto.PinInChat.Type.UNPIN_FOR_ALL
      });

      await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });
      await sock.sendMessage(jid, {
        text: '📌 *Message unpinned!*\nThe pinned message has been removed.'
      }, { quoted: msg });

    } catch (err) {
      console.error('[unpin]', err.message);
      await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
      await sock.sendMessage(jid, { text: `❌ Failed to unpin message: ${err.message}` }, { quoted: msg });
    }
  }
};
