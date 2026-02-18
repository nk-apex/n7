import axios from 'axios';

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports';

export default {
  name: 'mma',
  description: 'Get UFC/MMA fight results and upcoming events',
  category: 'sports',
  aliases: ['ufc', 'fighting'],
  usage: 'mma [results|schedule]',

  async execute(sock, m, args, PREFIX) {
    const jid = m.key.remoteJid;

    if (args.length === 0 || args[0].toLowerCase() === 'help') {
      return sock.sendMessage(jid, {
        text: `╭─⌈ 🥊 *UFC / MMA* ⌋\n├─⊷ *${PREFIX}mma results*\n│  └⊷ Latest fight results\n├─⊷ *${PREFIX}mma schedule*\n│  └⊷ Upcoming fight cards\n├─⊷ *${PREFIX}ufc results*\n│  └⊷ Alias for mma\n╰───`
      }, { quoted: m });
    }

    try {
      await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });

      const res = await axios.get(`${ESPN_BASE}/mma/ufc/scoreboard`, { timeout: 15000 });
      const events = res.data?.events || [];
      if (events.length === 0) throw new Error('No UFC events found');

      const sub = args[0].toLowerCase();
      let text = `╭─⌈ 🥊 *UFC / MMA ${sub === 'schedule' ? 'SCHEDULE' : 'RESULTS'}* ⌋\n│\n`;

      events.slice(0, 10).forEach(ev => {
        const name = ev.name || 'UFC Event';
        const date = ev.date ? new Date(ev.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '';
        const status = ev.status?.type?.shortDetail || '';
        text += `├─⊷ *${name}*\n`;

        const comp = ev.competitions?.[0];
        if (comp?.competitors) {
          const fighters = comp.competitors;
          if (fighters.length >= 2) {
            text += `│  ⊷ ${fighters[0]?.athlete?.displayName || fighters[0]?.team?.displayName || '???'} vs ${fighters[1]?.athlete?.displayName || fighters[1]?.team?.displayName || '???'}\n`;
          }
        }
        text += `│  └⊷ ${date} • ${status}\n`;
      });
      text += `╰───\n\n⚡ *Powered by WOLFBOT*`;

      await sock.sendMessage(jid, { text }, { quoted: m });
      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
    } catch (error) {
      console.error('❌ [MMA]', error.message);
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      await sock.sendMessage(jid, {
        text: `╭─⌈ ❌ *MMA ERROR* ⌋\n├─⊷ ${error.message}\n├─⊷ Try again later\n╰───`
      }, { quoted: m });
    }
  }
};
