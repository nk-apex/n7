import { listServers } from '../../lib/pterodactyl.js';
import { getBotName } from '../../lib/botname.js';

export default {
  name: 'ptservers',
  aliases: ['serverlist', 'ptlist'],
  description: 'List all Pterodactyl servers',
  category: 'Owner',
  ownerOnly: true,

  async execute(sock, m, args, prefix) {
    const jid = m.key.remoteJid;
    const reply = t => sock.sendMessage(jid, { text: t }, { quoted: m });

    await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });

    try {
      const servers = await listServers();

      if (!servers.length) {
        await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
        return reply(`✅ No servers found on the panel.`);
      }

      const chunkSize = 30;
      const chunks = [];
      for (let i = 0; i < servers.length; i += chunkSize) {
        chunks.push(servers.slice(i, i + chunkSize));
      }

      for (let c = 0; c < chunks.length; c++) {
        const chunk = chunks[c];
        let text = c === 0
          ? `🖥️ *Pterodactyl Servers (${servers.length} total)*\n\n`
          : `_(continued ${c * chunkSize + 1}–${Math.min((c + 1) * chunkSize, servers.length)})_\n\n`;

        chunk.forEach((s, i) => {
          const n = c * chunkSize + i + 1;
          text += `*${n}.* ${s.name}\n`;
          text += `   ID: ${s.id} • \`${s.identifier}\`\n`;
          text += `   User: ${s.user}${s.suspended ? ' • ⚠️ suspended' : ''}\n\n`;
        });

        if (c === chunks.length - 1) {
          text += `\n🔴 Use *.deleteall confirm* to delete all ${servers.length} servers`;
        }

        await reply(text);
      }

      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
      console.log(`\x1b[32m✅ [PTSERVERS] Listed ${servers.length} servers\x1b[0m`);

    } catch (err) {
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      await reply(`❌ Failed to fetch servers: ${err.message}`);
    }
  }
};
