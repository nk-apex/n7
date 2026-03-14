import { listServers, deleteServer } from '../../lib/pterodactyl.js';

const DELAY_MS = 300;
const sleep = ms => new Promise(r => setTimeout(r, ms));

export default {
  name: 'deleteall',
  aliases: ['deleteservers', 'clearservers'],
  description: 'Delete all Pterodactyl servers',
  category: 'Owner',
  ownerOnly: true,

  async execute(sock, m, args, prefix) {
    const jid   = m.key.remoteJid;
    const reply = t => sock.sendMessage(jid, { text: t }, { quoted: m });
    const p     = prefix || '.';

    if (args[0]?.toLowerCase() !== 'confirm') {
      try {
        const servers = await listServers();
        return reply(
          `⚠️ *DELETE ALL SERVERS*\n\n` +
          `This will permanently delete *${servers.length} servers* on panel.xwolf.space.\n\n` +
          `*This cannot be undone.*\n\n` +
          `To confirm, send:\n*${p}deleteall confirm*`
        );
      } catch (err) {
        return reply(`❌ Could not fetch server count: ${err.message}`);
      }
    }

    await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });

    try {
      const servers = await listServers();

      if (!servers.length) {
        await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
        return reply(`✅ No servers found — nothing to delete.`);
      }

      const total = servers.length;
      await reply(`🗑️ Starting deletion of *${total} servers*...\n_This may take a moment._`);

      let deleted  = 0;
      let failed   = 0;
      const errors = [];

      for (let i = 0; i < servers.length; i++) {
        const s = servers[i];
        try {
          await deleteServer(s.id);
          deleted++;
        } catch (err) {
          failed++;
          errors.push(`${s.name} (${s.id}): ${err.response?.status || err.message}`);
        }

        if ((i + 1) % 20 === 0 || i + 1 === total) {
          await reply(`⏳ Progress: ${i + 1}/${total} processed — ${deleted} deleted, ${failed} failed`);
        }

        await sleep(DELAY_MS);
      }

      await sock.sendMessage(jid, { react: { text: failed === 0 ? '✅' : '⚠️', key: m.key } });

      let summary = `*Deletion Complete*\n\n`;
      summary += `✅ Deleted : ${deleted}\n`;
      summary += `❌ Failed  : ${failed}\n`;
      summary += `📦 Total   : ${total}\n`;
      if (errors.length) {
        summary += `\n*Failed servers:*\n` + errors.slice(0, 10).map(e => `• ${e}`).join('\n');
        if (errors.length > 10) summary += `\n...and ${errors.length - 10} more`;
      }
      summary += `\n\nRun *.ptservers* to confirm all servers are gone.`;

      await reply(summary);
      console.log(`\x1b[32m✅ [DELETEALL] ${deleted}/${total} servers deleted\x1b[0m`);

    } catch (err) {
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      await reply(`❌ Error during deletion: ${err.message}`);
    }
  }
};
