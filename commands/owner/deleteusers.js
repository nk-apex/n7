import { listUsers, deleteUser } from '../../lib/pterodactyl.js';

const DELAY_MS = 300;
const sleep = ms => new Promise(r => setTimeout(r, ms));

export default {
  name: 'deleteusers',
  aliases: ['clearusers', 'purgusers'],
  description: 'Delete all Pterodactyl users except admins',
  category: 'Owner',
  ownerOnly: true,

  async execute(sock, m, args, prefix) {
    const jid   = m.key.remoteJid;
    const reply = t => sock.sendMessage(jid, { text: t }, { quoted: m });
    const p     = prefix || '.';

    if (args[0]?.toLowerCase() !== 'confirm') {
      try {
        const users    = await listUsers();
        const admins   = users.filter(u => u.root_admin);
        const toDelete = users.filter(u => !u.root_admin);

        let text = `⚠️ *DELETE ALL NON-ADMIN USERS*\n\n`;
        text += `👥 Total users      : ${users.length}\n`;
        text += `🛡️ Admins (kept)    : ${admins.length}\n`;
        text += `🗑️ Will be deleted  : ${toDelete.length}\n\n`;
        text += `*Admins that will be kept:*\n`;
        admins.forEach(a => { text += `• ${a.username} (id:${a.id})\n`; });
        text += `\n*This cannot be undone.*\n\n`;
        text += `To confirm, send:\n*${p}deleteusers confirm*`;

        return reply(text);
      } catch (err) {
        return reply(`❌ Could not fetch user list: ${err.message}`);
      }
    }

    await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });

    try {
      const users    = await listUsers();
      const toDelete = users.filter(u => !u.root_admin);
      const admins   = users.filter(u => u.root_admin);

      if (!toDelete.length) {
        await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
        return reply(`✅ No non-admin users found — nothing to delete.`);
      }

      const total = toDelete.length;
      await reply(
        `🗑️ Deleting *${total} users*...\n` +
        `🛡️ Keeping ${admins.length} admin(s): ${admins.map(a => a.username).join(', ')}\n` +
        `_This may take a moment._`
      );

      let deleted  = 0;
      let failed   = 0;
      const errors = [];

      for (let i = 0; i < toDelete.length; i++) {
        const u = toDelete[i];
        try {
          await deleteUser(u.id);
          deleted++;
        } catch (err) {
          failed++;
          errors.push(`${u.username} (${u.id}): ${err.response?.status || err.message}`);
        }

        if ((i + 1) % 20 === 0 || i + 1 === total) {
          await reply(`⏳ Progress: ${i + 1}/${total} processed — ${deleted} deleted, ${failed} failed`);
        }

        await sleep(DELAY_MS);
      }

      await sock.sendMessage(jid, { react: { text: failed === 0 ? '✅' : '⚠️', key: m.key } });

      let summary = `*User Deletion Complete*\n\n`;
      summary += `✅ Deleted : ${deleted}\n`;
      summary += `❌ Failed  : ${failed}\n`;
      summary += `📦 Total   : ${total}\n`;
      summary += `🛡️ Kept    : ${admins.length} admin(s)\n`;
      if (errors.length) {
        summary += `\n*Failed users:*\n` + errors.slice(0, 10).map(e => `• ${e}`).join('\n');
        if (errors.length > 10) summary += `\n...and ${errors.length - 10} more`;
      }

      await reply(summary);
      console.log(`\x1b[32m✅ [DELETEUSERS] ${deleted}/${total} users deleted\x1b[0m`);

    } catch (err) {
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      await reply(`❌ Error during deletion: ${err.message}`);
    }
  }
};
