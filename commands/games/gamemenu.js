export default {
  name: "gamemenu",
  alias: ["gamecmds", "gamehelp", "gameslist"],
  desc: "Shows game commands",
  category: "Games",
  usage: ".gamemenu",

  async execute(sock, m) {
    const menu = `╭─⌈ 🎮 *GAMES MENU* ⌋
│
├─⊷ *coinflip*
│  └⊷ Flip a coin
├─⊷ *dare*
│  └⊷ Dare challenge
├─⊷ *dice*
│  └⊷ Roll the dice
├─⊷ *emojimix*
│  └⊷ Mix two emojis
├─⊷ *joke*
│  └⊷ Random joke
├─⊷ *quiz*
│  └⊷ Trivia quiz
├─⊷ *rps*
│  └⊷ Rock Paper Scissors
├─⊷ *snake*
│  └⊷ Snake game
├─⊷ *tetris*
│  └⊷ Tetris game
├─⊷ *truth*
│  └⊷ Truth question
├─⊷ *tictactoe*
│  └⊷ Tic Tac Toe game
├─⊷ *quote*
│  └⊷ Random quote
│
╰───`;

    await sock.sendMessage(
      m.key.remoteJid,
      { text: menu },
      { quoted: m }
    );
  }
};
