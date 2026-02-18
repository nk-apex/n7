import axios from 'axios';

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports';

export default {
  name: 'football',
  description: 'Get live football (soccer) scores and standings',
  category: 'sports',
  aliases: ['soccer', 'epl', 'premierleague'],
  usage: 'football [scores|standings|fixtures]',

  async execute(sock, m, args, PREFIX) {
    const jid = m.key.remoteJid;

    if (args.length === 0 || args[0].toLowerCase() === 'help') {
      return sock.sendMessage(jid, {
        text: `╭─⌈ ⚽ *FOOTBALL / SOCCER* ⌋\n├─⊷ *${PREFIX}football scores*\n│  └⊷ Today's Premier League scores\n├─⊷ *${PREFIX}football standings*\n│  └⊷ EPL league table\n├─⊷ *${PREFIX}football laliga*\n│  └⊷ La Liga scores\n├─⊷ *${PREFIX}football ucl*\n│  └⊷ Champions League scores\n╰───`
      }, { quoted: m });
    }

    try {
      await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });

      const sub = args[0].toLowerCase();
      const leagueMap = {
        scores: 'eng.1', epl: 'eng.1', laliga: 'esp.1',
        seriea: 'ita.1', bundesliga: 'ger.1', ligue1: 'fra.1',
        ucl: 'uefa.champions', standings: 'eng.1'
      };
      const leagueNames = {
        'eng.1': 'Premier League', 'esp.1': 'La Liga',
        'ita.1': 'Serie A', 'ger.1': 'Bundesliga',
        'fra.1': 'Ligue 1', 'uefa.champions': 'Champions League'
      };
      const league = leagueMap[sub] || 'eng.1';
      const leagueName = leagueNames[league] || 'Premier League';

      if (sub === 'standings') {
        const res = await axios.get(`${ESPN_BASE}/soccer/${league}/standings`, { timeout: 15000 });
        const standings = res.data?.children?.[0]?.standings?.entries || [];
        if (standings.length === 0) throw new Error('No standings data available');

        let text = `╭─⌈ ⚽ *${leagueName.toUpperCase()} STANDINGS* ⌋\n│\n`;
        standings.slice(0, 20).forEach((team, i) => {
          const s = team.stats || [];
          const pts = s.find(x => x.name === 'points')?.value || 0;
          const gp = s.find(x => x.name === 'gamesPlayed')?.value || 0;
          const w = s.find(x => x.name === 'wins')?.value || 0;
          const d = s.find(x => x.name === 'ties')?.value || 0;
          const l = s.find(x => x.name === 'losses')?.value || 0;
          const name = team.team?.displayName || 'Unknown';
          const short = name.length > 16 ? name.substring(0, 14) + '..' : name;
          text += `├─⊷ *${i + 1}.* ${short} │ ${pts}pts │ ${gp}GP ${w}W ${d}D ${l}L\n`;
        });
        text += `╰───\n\n⚡ *Powered by WOLFBOT*`;
        await sock.sendMessage(jid, { text }, { quoted: m });
      } else {
        const res = await axios.get(`${ESPN_BASE}/soccer/${league}/scoreboard`, { timeout: 15000 });
        const events = res.data?.events || [];
        if (events.length === 0) throw new Error('No matches found today');

        let text = `╭─⌈ ⚽ *${leagueName.toUpperCase()} SCORES* ⌋\n│\n`;
        events.slice(0, 15).forEach(ev => {
          const comp = ev.competitions?.[0];
          const teams = comp?.competitors || [];
          const home = teams.find(t => t.homeAway === 'home');
          const away = teams.find(t => t.homeAway === 'away');
          const status = ev.status?.type?.shortDetail || '';
          text += `├─⊷ ${home?.team?.abbreviation || '???'} *${home?.score || '0'}* - *${away?.score || '0'}* ${away?.team?.abbreviation || '???'}\n`;
          text += `│  └⊷ ${status}\n`;
        });
        text += `╰───\n\n⚡ *Powered by WOLFBOT*`;
        await sock.sendMessage(jid, { text }, { quoted: m });
      }

      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
    } catch (error) {
      console.error('❌ [FOOTBALL]', error.message);
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      await sock.sendMessage(jid, {
        text: `╭─⌈ ❌ *FOOTBALL ERROR* ⌋\n├─⊷ ${error.message}\n├─⊷ Try again later\n╰───`
      }, { quoted: m });
    }
  }
};
