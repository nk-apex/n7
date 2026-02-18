export default {
  name: "gitmenu",
  alias: ["githubmenu", "gitcmds", "githelp"],
  desc: "Shows GitHub commands",
  category: "GitHub",
  usage: ".gitmenu",

  async execute(sock, m) {
    const menu = `╭─⌈ 🐙 *GITHUB MENU* ⌋
│
├─⊷ *gitclone*
│  └⊷ Clone a repository
├─⊷ *gitinfo*
│  └⊷ GitHub user info
├─⊷ *repanalyze*
│  └⊷ Analyze a repository
├─⊷ *zip*
│  └⊷ Download repo as ZIP
├─⊷ *update*
│  └⊷ Update bot from GitHub
├─⊷ *repo*
│  └⊷ Bot repository link
│
╰───`;

    await sock.sendMessage(
      m.key.remoteJid,
      { text: menu },
      { quoted: m }
    );
  }
};
