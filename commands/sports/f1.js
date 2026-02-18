import axios from 'axios';

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports';

export default {
  name: 'f1',
  description: 'Get Formula 1 racing results and standings',
  category: 'sports',
  aliases: ['formula1', 'racing'],
  usage: 'f1 [results|standings|schedule]',

  async execute(sock, m, args, PREFIX) {
    const jid = m.key.remoteJid;

    if (args.length === 0 || args[0].toLowerCase() === 'help') {
      return sock.sendMessage(jid, {
        text: `╭─⌈ 🏎️ *FORMULA 1* ⌋\n├─⊷ *${PREFIX}f1 results*\n│  └⊷ Latest race results\n├─⊷ *${PREFIX}f1 standings*\n│  └⊷ Driver standings\n├─⊷ *${PREFIX}f1 schedule*\n│  └⊷ Upcoming races\n├─⊷ *${PREFIX}formula1*\n│  └⊷ Alias for f1\n╰───`
      }, { quoted: m });
    }

    try {
      await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });
      const sub = args[0].toLowerCase();

      if (sub === 'standings') {
        const res = await axios.get(`${ESPN_BASE}/racing/f1/standings`, { timeout: 15000 });
        const entries = res.data?.children?.[0]?.standings?.entries || res.data?.standings?.entries || [];
        if (entries.length === 0) throw new Error('No F1 standings data available');

        let text = `╭─⌈ 🏎️ *F1 DRIVER STANDINGS* ⌋\n│\n`;
        entries.slice(0, 20).forEach((entry, i) => {
          const name = entry.athlete?.displayName || entry.team?.displayName || 'Unknown';
          const pts = entry.stats?.find(s => s.name === 'points')?.value || 0;
          const short = name.length > 20 ? name.substring(0, 18) + '..' : name;
          text += `├─⊷ *${i + 1}.* ${short} │ ${pts} pts\n`;
        });
        text += `╰───\n\n⚡ *Powered by WOLFBOT*`;
        await sock.sendMessage(jid, { text }, { quoted: m });
      } else {
        const res = await axios.get(`${ESPN_BASE}/racing/f1/scoreboard`, { timeout: 15000 });
        const events = res.data?.events || [];
        if (events.length === 0) throw new Error('No F1 events found');

        let text = `╭─⌈ 🏎️ *FORMULA 1 ${sub === 'schedule' ? 'SCHEDULE' : 'RESULTS'}* ⌋\n│\n`;
        events.slice(0, 10).forEach(ev => {
          const name = ev.name || 'Unknown Race';
          const date = ev.date ? new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
          const status = ev.status?.type?.shortDetail || '';
          const circuit = ev.circuit?.fullName || '';
          text += `├─⊷ *${name}*\n`;
          if (circuit) text += `│  └⊷ 📍 ${circuit}\n`;
          text += `│  └⊷ ${date} • ${status}\n`;
        });
        text += `╰───\n\n⚡ *Powered by WOLFBOT*`;
        await sock.sendMessage(jid, { text }, { quoted: m });
      }

      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
    } catch (error) {
      console.error('❌ [F1]', error.message);
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      await sock.sendMessage(jid, {
        text: `╭─⌈ ❌ *F1 ERROR* ⌋\n├─⊷ ${error.message}\n├─⊷ Try again later\n╰───`
      }, { quoted: m });
    }
  }
};
