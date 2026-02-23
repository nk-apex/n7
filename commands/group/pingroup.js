import { isPinned, setPinned } from '../../lib/chat-state.js';

export default {
  name: 'pingroup',
  alias: ['pinnchat', 'pinchat'],
  description: 'Pin this group to the top of your chat list',
  category: 'group',

  async execute(sock, msg, args, from, isGroup, sender) {
    const jid = msg.key.remoteJid;

    if (isPinned(jid)) {
      return sock.sendMessage(jid, {
        text: '📌 This group is already pinned! Use *.unpingroup* to unpin it.'
      }, { quoted: msg });
    }

    try {
      await sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } });

      setPinned(jid, true);

      try {
        await sock.chatModify({ pin: true }, jid);
      } catch (e) {
        console.log(`[pingroup] chatModify failed (state saved locally): ${e.message}`);
      }

      await sock.sendMessage(jid, { react: { text: '📌', key: msg.key } });
      await sock.sendMessage(jid, {
        text: '📌 *Group pinned!*\nThis group has been pinned to the top of your chat list.'
      }, { quoted: msg });

    } catch (err) {
      console.error('[pingroup]', err.message);
      await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
      await sock.sendMessage(jid, { text: `❌ Failed to pin group: ${err.message}` }, { quoted: msg });
    }
  }
};
