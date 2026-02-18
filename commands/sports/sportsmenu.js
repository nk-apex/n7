export default {
  name: 'sportsmenu',
  description: 'View all available sports commands',
  category: 'sports',
  aliases: ['sports', 'sport', 'sportlist'],
  usage: 'sportsmenu',

  async execute(sock, m, args, PREFIX) {
    const jid = m.key.remoteJid;

    const text =
      `╭─⌈ 🏆 *WOLFBOT SPORTS MENU* ⌋\n` +
      `│\n` +
      `├─ ⚽ *FOOTBALL / SOCCER*\n` +
      `│  ⊷ *${PREFIX}football scores* - Live scores\n` +
      `│  ⊷ *${PREFIX}football standings* - League table\n` +
      `│  ⊷ *${PREFIX}football laliga* - La Liga\n` +
      `│  ⊷ *${PREFIX}football ucl* - Champions League\n` +
      `│\n` +
      `├─ 🏀 *NBA BASKETBALL*\n` +
      `│  ⊷ *${PREFIX}basketball scores* - Live NBA\n` +
      `│  ⊷ *${PREFIX}basketball standings* - NBA table\n` +
      `│\n` +
      `├─ 🏏 *CRICKET*\n` +
      `│  ⊷ *${PREFIX}cricket scores* - Live cricket\n` +
      `│\n` +
      `├─ 🏈 *NFL FOOTBALL*\n` +
      `│  ⊷ *${PREFIX}nfl scores* - NFL scores\n` +
      `│  ⊷ *${PREFIX}nfl standings* - NFL table\n` +
      `│\n` +
      `├─ 🏎️ *FORMULA 1*\n` +
      `│  ⊷ *${PREFIX}f1 results* - Race results\n` +
      `│  ⊷ *${PREFIX}f1 standings* - Driver standings\n` +
      `│\n` +
      `├─ 🥊 *UFC / MMA*\n` +
      `│  ⊷ *${PREFIX}mma results* - Fight results\n` +
      `│  ⊷ *${PREFIX}mma schedule* - Upcoming fights\n` +
      `│\n` +
      `├─ 🎾 *TENNIS*\n` +
      `│  ⊷ *${PREFIX}tennis scores* - Live tennis\n` +
      `│\n` +
      `├─ ⚾ *MLB BASEBALL*\n` +
      `│  ⊷ *${PREFIX}baseball scores* - MLB scores\n` +
      `│  ⊷ *${PREFIX}baseball standings* - MLB table\n` +
      `│\n` +
      `├─ 🏒 *NHL HOCKEY*\n` +
      `│  ⊷ *${PREFIX}hockey scores* - NHL scores\n` +
      `│  ⊷ *${PREFIX}hockey standings* - NHL table\n` +
      `│\n` +
      `├─ ⛳ *PGA GOLF*\n` +
      `│  ⊷ *${PREFIX}golf leaderboard* - Leaderboard\n` +
      `│  ⊷ *${PREFIX}golf schedule* - Tournaments\n` +
      `│\n` +
      `├─ 💡 *TIPS*\n` +
      `│  ⊷ All scores update in real-time\n` +
      `│  ⊷ Use command name for help\n` +
      `╰───\n\n` +
      `⚡ *Powered by WOLFBOT*`;

    await sock.sendMessage(jid, { text }, { quoted: m });
  }
};
