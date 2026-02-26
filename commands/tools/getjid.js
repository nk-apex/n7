export default {
  name: 'getjid',
  description: 'Get JID, real number, group ID, or channel ID',
  category: 'utility',
  aliases: ['jid', 'id', 'whois'],

  async execute(sock, m, args) {
    const send = async (text) => {
      return sock.sendMessage(m.key.remoteJid, { text }, { quoted: m });
    };

    const jid = m.key.remoteJid;

    try {
      const quotedParticipant = m.message?.extendedTextMessage?.contextInfo?.participant;
      const mentionedJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

      if (quotedParticipant) {
        const info = await this.resolveJid(sock, quotedParticipant);
        return send(this.formatUserInfo('Reply', info));
      }

      if (mentionedJid) {
        const info = await this.resolveJid(sock, mentionedJid);
        return send(this.formatUserInfo('Mention', info));
      }

      if (args[0]) {
        const rawInput = args.join(' ').trim();

        const channelLinkMatch = rawInput.match(/(?:https?:\/\/)?(?:www\.)?(?:whatsapp\.com\/channel|chat\.whatsapp\.com\/channel)\/([A-Za-z0-9_-]+)/i);
        if (channelLinkMatch) {
          const inviteCode = channelLinkMatch[1];
          try {
            const metadata = await sock.newsletterMetadata('invite', inviteCode);
            if (metadata && metadata.id) {
              let response = `📢 *CHANNEL JID RESOLVED*\n\n`;
              response += `┌─── *CHANNEL INFO* ───\n`;
              response += `│ 📛 *Name:* ${metadata.name || 'Unknown'}\n`;
              response += `│ 🔗 *JID:* \`${metadata.id}\`\n`;
              response += `│ 🆔 *ID:* ${metadata.id.split('@')[0]}\n`;
              response += `│ 📝 *Type:* Newsletter/Channel\n`;
              if (metadata.description) {
                const desc = metadata.description.length > 100 ? metadata.description.slice(0, 100) + '...' : metadata.description;
                response += `│ 📄 *Desc:* ${desc}\n`;
              }
              if (metadata.subscribers) {
                response += `│ 👥 *Followers:* ${metadata.subscribers}\n`;
              }
              response += `│ 🔗 *Link:* https://whatsapp.com/channel/${inviteCode}\n`;
              response += `└──────────────\n\n`;
              response += `📋 *Copy-ready:*\n`;
              response += `• \`${metadata.id}\``;
              return send(response);
            } else {
              return send(`❌ Could not resolve channel link.\n\nThe channel may not exist or is private.`);
            }
          } catch (err) {
            return send(`❌ Failed to resolve channel link: ${err.message || 'Unknown error'}\n\nMake sure the link is valid.`);
          }
        }

        const groupLinkMatch = rawInput.match(/(?:https?:\/\/)?(?:chat\.whatsapp\.com)\/([A-Za-z0-9_-]+)/i);
        if (groupLinkMatch) {
          const inviteCode = groupLinkMatch[1];
          try {
            const meta = await sock.groupGetInviteInfo(inviteCode);
            if (meta && meta.id) {
              let response = `👥 *GROUP JID RESOLVED*\n\n`;
              response += `┌─── *GROUP INFO* ───\n`;
              response += `│ 📛 *Name:* ${meta.subject || 'Unknown'}\n`;
              response += `│ 🔗 *JID:* \`${meta.id}\`\n`;
              response += `│ 👥 *Members:* ${meta.size || meta.participants?.length || 'Unknown'}\n`;
              response += `│ 📝 *Type:* Group\n`;
              response += `└──────────────\n\n`;
              response += `📋 *Copy-ready:*\n`;
              response += `• \`${meta.id}\``;
              return send(response);
            }
          } catch (err) {
            return send(`❌ Failed to resolve group link: ${err.message || 'Unknown error'}`);
          }
        }

        const input = args[0].replace(/[^0-9@.a-z]/gi, '');

        if (input.includes('@g.us')) {
          return send(`📱 *Group JID*\n\n🔗 *JID:* \`${input}\`\n📝 *Type:* Group`);
        }
        if (input.includes('@newsletter')) {
          return send(`📢 *Channel ID*\n\n🔗 *ID:* \`${input}\`\n📝 *Type:* Channel/Newsletter`);
        }

        const cleanNumber = input.replace(/\D/g, '');
        if (cleanNumber.length >= 7) {
          const userJid = `${cleanNumber}@s.whatsapp.net`;
          let exists = false;
          try {
            const [result] = await sock.onWhatsApp(cleanNumber);
            exists = result?.exists || false;
          } catch {}

          return send(`🔍 *Number Lookup*\n\n` +
            `📞 *Number:* +${cleanNumber}\n` +
            `🔗 *JID:* \`${userJid}\`\n` +
            `✅ *On WhatsApp:* ${exists ? 'Yes' : 'Unknown'}\n` +
            `📝 *Type:* User`);
        }
      }

      let response = `📱 *JID Information*\n\n`;

      if (jid.endsWith('@g.us')) {
        response += `┌─── *GROUP INFO* ───\n`;
        response += `│ 🔗 *Group JID:* \`${jid}\`\n`;
        response += `│ 📝 *Type:* Group\n`;

        try {
          const meta = await sock.groupMetadata(jid);
          response += `│ 📛 *Name:* ${meta.subject}\n`;
          response += `│ 👥 *Members:* ${meta.participants.length}\n`;
          response += `│ 🆔 *ID:* ${jid.split('@')[0]}\n`;
        } catch {}

        response += `└──────────────\n\n`;

        const sender = m.key.participant || jid;
        const senderInfo = await this.resolveJid(sock, sender);
        response += `┌─── *YOUR INFO* ───\n`;
        response += `│ 📞 *Number:* +${senderInfo.number}\n`;
        response += `│ 🔗 *JID:* \`${senderInfo.jid}\`\n`;
        if (senderInfo.isLid) {
          response += `│ 🏷️ *LID:* \`${senderInfo.originalJid}\`\n`;
        }
        response += `└──────────────`;
      }
      else if (jid.endsWith('@newsletter')) {
        response += `┌─── *CHANNEL INFO* ───\n`;
        response += `│ 📢 *Channel ID:* \`${jid}\`\n`;
        response += `│ 📝 *Type:* Newsletter/Channel\n`;
        response += `│ 🆔 *ID:* ${jid.split('@')[0]}\n`;
        response += `└──────────────`;
      }
      else {
        const senderJid = m.key.participant || jid;
        const info = await this.resolveJid(sock, senderJid);
        response += `┌─── *DM INFO* ───\n`;
        response += `│ 📞 *Number:* +${info.number}\n`;
        response += `│ 🔗 *JID:* \`${info.jid}\`\n`;
        response += `│ 📝 *Type:* Direct Message\n`;
        if (info.isLid) {
          response += `│ 🏷️ *LID:* \`${info.originalJid}\`\n`;
        }
        response += `│ 🆔 *Chat JID:* \`${jid}\`\n`;
        response += `└──────────────`;
      }

      await send(response);

    } catch (error) {
      console.error('GetJID Error:', error);
      await send(`❌ Error: ${error.message}\n\n💡 Usage:\n• Reply to message: getjid\n• Mention: getjid @user\n• Number: getjid 254703397679\n• Channel link: getjid https://whatsapp.com/channel/...\n• Group link: getjid https://chat.whatsapp.com/...`);
    }
  },

  async resolveJid(sock, inputJid) {
    const isLid = inputJid.endsWith('@lid');
    let number = inputJid.split('@')[0].split(':')[0];
    let resolvedJid = inputJid;

    if (isLid) {
      try {
        if (sock.store?.contacts) {
          for (const [contactJid, contact] of Object.entries(sock.store.contacts)) {
            if (contact.lid === inputJid || contact.lidJid === inputJid) {
              resolvedJid = contactJid;
              number = contactJid.split('@')[0].split(':')[0];
              break;
            }
          }
        }
      } catch {}

      number = number.replace(/\D/g, '');
    } else {
      number = number.replace(/\D/g, '');
      resolvedJid = `${number}@s.whatsapp.net`;
    }

    return {
      number: number,
      jid: resolvedJid,
      originalJid: inputJid,
      isLid: isLid
    };
  },

  formatUserInfo(source, info) {
    let text = `📱 *JID from ${source}*\n\n`;
    text += `📞 *Number:* +${info.number}\n`;
    text += `🔗 *JID:* \`${info.jid}\`\n`;

    if (info.isLid) {
      text += `🏷️ *LID:* \`${info.originalJid}\`\n`;
      text += `📝 *Note:* This user uses Linked ID format\n`;
    }

    text += `\n📋 *Copy-ready:*\n`;
    text += `• \`${info.number}\`\n`;
    text += `• \`${info.jid}\``;

    return text;
  }
};
