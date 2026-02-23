import { isMuted, setMuted } from '../../lib/chat-state.js';

export default {
  name: 'notifications',
  alias: ['mute', 'mutegroup', 'togglenotif', 'togglemute'],
  description: 'Toggle mute/unmute notifications for this group',
  category: 'group',

  async execute(sock, msg, args, from, isGroup, sender) {
    const jid = msg.key.remoteJid;

    try {
      await sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } });

      const currently = isMuted(jid);
      const shouldMute = !currently;

      if (shouldMute) {
        const muteUntil = Date.now() + (100 * 365 * 24 * 60 * 60 * 1000);
        setMuted(jid, muteUntil);
        try {
          await sock.chatModify({ mute: muteUntil }, jid);
        } catch (e) {
          console.log(`[notifications] chatModify failed (state saved locally): ${e.message}`);
        }
      } else {
        setMuted(jid, null);
        try {
          await sock.chatModify({ mute: null }, jid);
        } catch (e) {
          console.log(`[notifications] chatModify failed (state saved locally): ${e.message}`);
        }
      }

      await sock.sendMessage(jid, { react: { text: shouldMute ? '🔕' : '🔔', key: msg.key } });
      await sock.sendMessage(jid, {
        text: shouldMute
          ? '🔕 *Notifications muted!*\nYou will no longer receive notifications from this group.'
          : '🔔 *Notifications unmuted!*\nNotifications for this group are now active.'
      }, { quoted: msg });

    } catch (err) {
      console.error('[notifications]', err.message);
      await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
      await sock.sendMessage(jid, { text: `❌ Failed to toggle notifications: ${err.message}` }, { quoted: msg });
    }
  }
};
