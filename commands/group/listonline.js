export default {
  name: 'listonline',
  aliases: ['whoonline', 'onlinelist', 'activeusers'],
  description: 'Detect online/active members in a group',
  category: 'group',
  async execute(sock, msg, args, PREFIX, extra) {
    const jid = msg.key.remoteJid;

    if (!jid.endsWith('@g.us')) {
      return sock.sendMessage(jid, { text: '❌ Group only.' }, { quoted: msg });
    }

    try { await sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } }); } catch {}

    try {
      const group = await sock.groupMetadata(jid);
      const groupName = group.subject || 'Group';
      const botJid = sock.user?.id?.split(':')[0] + '@s.whatsapp.net';

      const presenceResults = new Map();
      const scanDuration = 10000;

      const presenceHandler = (json) => {
        if (!json || !json.id) return;

        const chatJid = json.id;
        if (chatJid !== jid) return;

        if (json.presences) {
          for (const [participantJid, data] of Object.entries(json.presences)) {
            if (data?.lastKnownPresence && participantJid !== botJid) {
              presenceResults.set(participantJid, {
                presence: data.lastKnownPresence,
                timestamp: Date.now()
              });
            }
          }
        }
      };

      sock.ev.on('presence.update', presenceHandler);

      try { await sock.presenceSubscribe(jid); } catch {}

      const batchSize = 30;
      const members = group.participants.filter(p => p.id !== botJid);
      for (let i = 0; i < Math.min(members.length, 100); i += batchSize) {
        const batch = members.slice(i, i + batchSize);
        await Promise.allSettled(
          batch.map(p => sock.presenceSubscribe(p.id).catch(() => {}))
        );
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      await sock.sendPresenceUpdate('composing', jid);
      await new Promise(resolve => setTimeout(resolve, 1500));
      await sock.sendPresenceUpdate('paused', jid);

      await new Promise(resolve => setTimeout(resolve, scanDuration - 2000));

      sock.ev.off('presence.update', presenceHandler);

      const onlineMembers = [];
      const typingMembers = [];
      const recordingMembers = [];

      for (const [participantId, data] of presenceResults) {
        const normalized = participantId.split(':')[0].split('@')[0];
        const participant = group.participants.find(p =>
          p.id.split(':')[0].split('@')[0] === normalized
        );

        const phone = normalized;
        const memberInfo = {
          id: participant?.id || participantId,
          phone,
          isAdmin: !!participant?.admin,
          presence: data.presence
        };

        if (data.presence === 'available') {
          onlineMembers.push(memberInfo);
        } else if (data.presence === 'composing') {
          typingMembers.push(memberInfo);
        } else if (data.presence === 'recording') {
          recordingMembers.push(memberInfo);
        }
      }

      const allActive = [...onlineMembers, ...typingMembers, ...recordingMembers];

      if (allActive.length === 0) {
        await sock.sendMessage(jid, {
          text:
            `╭─⌈ \`${groupName}\` ⌋\n` +
            `│\n` +
            `│ 🔍 *Online Scan Complete*\n` +
            `│ No online members detected.\n` +
            `│\n` +
            `│ ✧ *Scanned:* ${members.length} members\n` +
            `│ ✧ *Duration:* ${scanDuration / 1000}s\n` +
            `│\n` +
            `│ 💡 Most members have privacy\n` +
            `│ settings hiding their status.\n` +
            `│\n` +
            `│ *Related:*\n` +
            `│ • \`${PREFIX}listinactive\` - Find inactive members\n` +
            `│ • \`${PREFIX}tagall\` - Tag everyone\n` +
            `│\n` +
            `╰───`
        }, { quoted: msg });
        try { await sock.sendMessage(jid, { react: { text: '😴', key: msg.key } }); } catch {}
        return;
      }

      let message =
        `╭─⌈ \`${groupName}\` ⌋\n` +
        `│\n` +
        `│ 🟢 *Online:* ${allActive.length}/${members.length}\n` +
        `│\n`;

      if (onlineMembers.length > 0) {
        message += `├─⊷ *📱 Online*\n`;
        onlineMembers.forEach((member) => {
          const icon = member.isAdmin ? '👑' : '👤';
          message += `│  • ${icon} @${member.phone}\n`;
        });
      }

      if (typingMembers.length > 0) {
        message += `├─⊷ *⌨️ Typing*\n`;
        typingMembers.forEach((member) => {
          const icon = member.isAdmin ? '👑' : '👤';
          message += `│  • ${icon} @${member.phone}\n`;
        });
      }

      if (recordingMembers.length > 0) {
        message += `├─⊷ *🎙️ Recording*\n`;
        recordingMembers.forEach((member) => {
          const icon = member.isAdmin ? '👑' : '👤';
          message += `│  • ${icon} @${member.phone}\n`;
        });
      }

      message +=
        `│\n` +
        `│ *Related:*\n` +
        `│ • \`${PREFIX}listinactive\` - Find inactive members\n` +
        `│ • \`${PREFIX}tagall\` - Tag everyone\n` +
        `│\n` +
        `╰───`;

      const mentions = allActive.map(m => m.id);

      await sock.sendMessage(jid, {
        text: message,
        mentions
      }, { quoted: msg });

      try { await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }); } catch {}

    } catch (error) {
      console.error('ListOnline error:', error);
      await sock.sendMessage(jid, {
        text: `❌ *Online scan failed*\n\n${error.message}`
      }, { quoted: msg });
      try { await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }); } catch {}
    }
  }
};
