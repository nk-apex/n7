import axios from 'axios';

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports';

export default {
  name: 'cricket',
  description: 'Get live cricket scores and matches',
  category: 'sports',
  aliases: ['ipl', 'cricketscores'],
  usage: 'cricket [scores|schedule]',

  async execute(sock, m, args, PREFIX) {
    const jid = m.key.remoteJid;

    if (args.length === 0 || args[0].toLowerCase() === 'help') {
      return sock.sendMessage(jid, {
        text: `╭─⌈ 🏏 *CRICKET* ⌋\n├─⊷ *${PREFIX}cricket scores*\n│  └⊷ Live cricket scores\n├─⊷ *${PREFIX}cricket schedule*\n│  └⊷ Upcoming matches\n├─⊷ *${PREFIX}ipl scores*\n│  └⊷ Alias for cricket\n╰───`
      }, { quoted: m });
    }

    try {
      await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });

      const res = await axios.get(`${ESPN_BASE}/cricket/8676/scoreboard`, { timeout: 15000 });
      const events = res.data?.events || [];

      if (events.length === 0) throw new Error('No cricket matches found today');

      let text = `╭─⌈ 🏏 *CRICKET SCORES* ⌋\n│\n`;
      events.slice(0, 12).forEach(ev => {
        const comp = ev.competitions?.[0];
        const teams = comp?.competitors || [];
        const status = ev.status?.type?.shortDetail || '';
        const name = ev.shortName || ev.name || '';
        text += `├─⊷ *${name}*\n`;
        teams.forEach(t => {
          const teamName = t.team?.abbreviation || t.team?.shortDisplayName || '???';
          const score = t.score || '-';
          text += `│  └⊷ ${teamName}: *${score}*\n`;
        });
        text += `│  └⊷ ${status}\n`;
      });
      text += `╰───\n\n⚡ *Powered by WOLFBOT*`;

      await sock.sendMessage(jid, { text }, { quoted: m });
      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
    } catch (error) {
      console.error('❌ [CRICKET]', error.message);
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      await sock.sendMessage(jid, {
        text: `╭─⌈ ❌ *CRICKET ERROR* ⌋\n├─⊷ ${error.message}\n├─⊷ Try again later\n╰───`
      }, { quoted: m });
    }
  }
};
