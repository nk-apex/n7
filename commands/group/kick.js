import { createRequire } from 'module';
import { isButtonModeEnabled } from '../../lib/buttonMode.js';
import { setActionSession } from '../../lib/actionSession.js';

const _requireKick = createRequire(import.meta.url);
let giftedBtnsKick;
try { giftedBtnsKick = _requireKick('gifted-btns'); } catch (e) {}

export default {
  name: 'kick',
  description: 'Removes mentioned members or specified numbers from the group.',
  execute: async (sock, msg, args, PREFIX, extra) => {
    const chatId = msg.key.remoteJid;
    const isGroup = chatId.endsWith('@g.us');

    if (!isGroup) {
      return sock.sendMessage(chatId, { text: '❌ This command only works in groups.' }, { quoted: msg });
    }

    const contextInfo = msg.message?.extendedTextMessage?.contextInfo ||
                        msg.message?.imageMessage?.contextInfo ||
                        msg.message?.videoMessage?.contextInfo ||
                        msg.message?.documentMessage?.contextInfo ||
                        msg.message?.stickerMessage?.contextInfo || {};

    const mentionedUsers = contextInfo.mentionedJid || [];

    const numbersFromArgs = args.filter(arg => /^\d{7,15}$/.test(arg)).map(num => `${num}@s.whatsapp.net`);

    let participants = [];

    if (mentionedUsers.length > 0) {
      participants = mentionedUsers;
    } else if (numbersFromArgs.length > 0) {
      participants = numbersFromArgs;
    } else if (contextInfo.quotedMessage && contextInfo.participant) {
      participants = [contextInfo.participant];
    }

    if (!participants.length) {
      return sock.sendMessage(chatId, {
        text: `╭─⌈ 👢 *KICK* ⌋\n│\n├─⊷ *${PREFIX}kick @user*\n│  └⊷ Kick mentioned user\n├─⊷ *${PREFIX}kick* (reply to msg)\n│  └⊷ Kick replied user\n├─⊷ *${PREFIX}kick 1234567890*\n│  └⊷ Kick by phone number\n╰───`
      }, { quoted: msg });
    }

    const botJid = sock.user?.id;
    const botClean = botJid?.split(':')[0]?.split('@')[0];
    const senderJid = msg.key.participant || chatId;

    let groupMeta;
    try {
      groupMeta = await sock.groupMetadata(chatId);
    } catch {
      return sock.sendMessage(chatId, { text: '❌ Failed to fetch group info.' }, { quoted: msg });
    }

    const botParticipant = groupMeta.participants.find(p => {
      const pClean = p.id.split(':')[0].split('@')[0];
      return pClean === botClean;
    });
    const botIsAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin';

    if (!botIsAdmin) {
      return sock.sendMessage(chatId, { text: '❌ I need admin permissions to kick members.' }, { quoted: msg });
    }

    const senderClean = senderJid.split(':')[0].split('@')[0];
    const senderParticipant = groupMeta.participants.find(p => {
      const pClean = p.id.split(':')[0].split('@')[0];
      return pClean === senderClean;
    });
    const senderIsAdmin = senderParticipant?.admin === 'admin' || senderParticipant?.admin === 'superadmin';
    const isOwner = extra?.isOwner ? extra.isOwner() : false;
    const isSudo = extra?.isSudo ? extra.isSudo() : false;

    if (!senderIsAdmin && !isOwner && !isSudo) {
      return sock.sendMessage(chatId, { text: '❌ Only group admins can use this command.' }, { quoted: msg });
    }

    const skipped = [];
    const toKick = [];

    for (const jid of participants) {
      const jidClean = jid.split(':')[0].split('@')[0];

      if (jidClean === botClean) {
        skipped.push(jid);
        continue;
      }

      const targetP = groupMeta.participants.find(p => {
        const pClean = p.id.split(':')[0].split('@')[0];
        return pClean === jidClean;
      });

      if (targetP && (targetP.admin === 'admin' || targetP.admin === 'superadmin')) {
        if (!isOwner && !isSudo) {
          skipped.push(jid);
          continue;
        }
      }

      toKick.push(targetP ? targetP.id : jid);
    }

    if (toKick.length === 0) {
      let reason = skipped.length > 0 ? 'Cannot kick admins or the bot itself.' : 'No valid users to kick.';
      return sock.sendMessage(chatId, { text: `❌ ${reason}` }, { quoted: msg });
    }

    if (isButtonModeEnabled() && giftedBtnsKick?.sendInteractiveMessage) {
      try {
        const sessionKey = `kick:${senderClean}:${chatId.split('@')[0]}`;
        setActionSession(sessionKey, { action: 'remove', targets: toKick, chatId });
        const targetNames = toKick.map(j => `@${j.split('@')[0].split(':')[0]}`).join(', ');
        const confirmText = `╭─⌈ 👢 *KICK CONFIRM* ⌋\n├─⊷ About to kick ${toKick.length} user(s):\n├─⊷ ${targetNames}\n├─⊷ Press Confirm to proceed.\n╰───`;
        await giftedBtnsKick.sendInteractiveMessage(sock, chatId, {
          body: { text: confirmText },
          footer: { text: 'Action expires in 5 minutes' },
          interactiveButtons: [
            { type: 'quick_reply', display_text: '✅ Confirm Kick', id: `${PREFIX}kickconfirm` },
            { type: 'quick_reply', display_text: '❌ Cancel', id: `${PREFIX}kickcancel` }
          ]
        }, { quoted: msg });
        return;
      } catch (e) {}
    }

    try {
      await sock.groupParticipantsUpdate(chatId, toKick, 'remove');
      const kickedNames = toKick.map(j => `@${j.split('@')[0].split(':')[0]}`).join(', ');
      let text = `👢 Kicked ${toKick.length} user(s): ${kickedNames}`;
      if (skipped.length > 0) {
        text += `\n⚠️ Skipped ${skipped.length} (admins/bot)`;
      }
      await sock.sendMessage(chatId, {
        text,
        mentions: toKick
      }, { quoted: msg });
    } catch (err) {
      await sock.sendMessage(chatId, {
        text: '❌ Failed to kick user(s). Check my permissions.'
      }, { quoted: msg });
    }
  },
};
