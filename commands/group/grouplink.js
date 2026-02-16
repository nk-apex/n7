import axios from 'axios';

export default {
  name: 'grouplink',
  alias: ['glink', 'gclink', 'invitelink'],
  description: 'Get group invite link with copy button and group thumbnail',
  category: 'group',

  async execute(sock, m, args, PREFIX) {
    const jid = m.key.remoteJid;

    if (!jid.endsWith('@g.us')) {
      await sock.sendMessage(jid, {
        text: '❌ This command only works in groups.'
      }, { quoted: m });
      return;
    }

    try {
      try { await sock.sendMessage(jid, { react: { text: '🔗', key: m.key } }); } catch {}

      const groupInfo = await sock.groupMetadata(jid);
      const groupName = groupInfo.subject || 'Group';
      const members = groupInfo.participants?.length || 0;

      let inviteCode;
      try {
        inviteCode = await sock.groupInviteCode(jid);
      } catch {
        try {
          await sock.groupRevokeInvite(jid);
          await new Promise(resolve => setTimeout(resolve, 1000));
          inviteCode = await sock.groupInviteCode(jid);
        } catch (e2) {
          throw new Error('Bot needs admin permissions to get group link');
        }
      }

      const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;

      let profilePic = null;
      try {
        const profileUrl = await sock.profilePictureUrl(jid, 'image');
        if (profileUrl) {
          const response = await axios.get(profileUrl, {
            responseType: 'arraybuffer',
            timeout: 8000
          });
          profilePic = Buffer.from(response.data);
        }
      } catch {}

      const caption =
        `╭─⌈ 🔗 *GROUP LINK* ⌋\n` +
        `│\n` +
        `│ ✧ *Name:* ${groupName}\n` +
        `│ ✧ *Members:* ${members}\n` +
        `│ ✧ *Link:* ${inviteLink}\n` +
        `│\n` +
        `│ • \`${PREFIX}revoke\` - Reset link\n` +
        `│ • \`${PREFIX}groupinfo\` - Group details\n` +
        `│\n` +
        `╰───`;

      try {
        const { createRequire } = await import('module');
        const require = createRequire(import.meta.url);
        const { sendInteractiveMessage } = require('gifted-btns');

        const buttons = [
          {
            name: 'cta_copy',
            buttonParamsJson: JSON.stringify({
              display_text: '📋 Copy Link',
              copy_code: inviteLink
            })
          },
          {
            name: 'cta_url',
            buttonParamsJson: JSON.stringify({
              display_text: '🔗 Open Link',
              url: inviteLink
            })
          }
        ];

        if (profilePic) {
          const { prepareWAMessageMedia } = await import('@whiskeysockets/baileys');

          const media = await prepareWAMessageMedia(
            { image: profilePic },
            { upload: sock.waUploadToServer }
          );

          await sendInteractiveMessage(sock, jid, {
            interactiveMessage: {
              header: {
                imageMessage: media.imageMessage,
                hasMediaAttachment: true
              },
              body: { text: caption },
              footer: { text: '🐺 Silent Wolf Bot' },
              nativeFlowMessage: {
                buttons: buttons
              }
            }
          });
        } else {
          await sendInteractiveMessage(sock, jid, {
            text: caption,
            footer: '🐺 Silent Wolf Bot',
            interactiveButtons: buttons
          });
        }

      } catch (btnErr) {
        console.log('[GROUPLINK] Buttons failed, fallback:', btnErr.message);

        if (profilePic) {
          await sock.sendMessage(jid, {
            image: profilePic,
            caption: caption
          }, { quoted: m });
        } else {
          await sock.sendMessage(jid, {
            text: caption
          }, { quoted: m });
        }
      }

      try { await sock.sendMessage(jid, { react: { text: '✅', key: m.key } }); } catch {}

    } catch (error) {
      console.error('GroupLink error:', error);

      let errorMsg = `❌ *Failed to get group link*\n`;
      if (error.message?.includes('admin') || error.message?.includes('permission')) {
        errorMsg += `\nBot needs admin permissions.\nMake me admin and try again.`;
      } else {
        errorMsg += `\n${error.message}`;
      }

      await sock.sendMessage(jid, { text: errorMsg }, { quoted: m });
      try { await sock.sendMessage(jid, { react: { text: '❌', key: m.key } }); } catch {}
    }
  }
};
