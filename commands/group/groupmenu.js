export default {
  name: "groupmenu",
  alias: ["gmenu", "grouphelp", "groupcmds"],
  desc: "Shows group management commands",
  category: "Group",
  usage: ".groupmenu",

  async execute(sock, m) {
    const menu = `╭─⌈ 🏠 *GROUP MENU* ⌋
│
│ 🛡️ *ADMIN & MODERATION*
│
├─⊷ *add*
│  └⊷ Add member to group
├─⊷ *promote*
│  └⊷ Promote to admin
├─⊷ *promoteall*
│  └⊷ Promote all members
├─⊷ *demote*
│  └⊷ Demote from admin
├─⊷ *demoteall*
│  └⊷ Demote all admins
├─⊷ *kick*
│  └⊷ Remove member
├─⊷ *kickall*
│  └⊷ Remove all members
├─⊷ *ban*
│  └⊷ Ban a member
├─⊷ *unban*
│  └⊷ Unban a member
├─⊷ *clearbanlist*
│  └⊷ Clear all bans
├─⊷ *warn*
│  └⊷ Warn a member
├─⊷ *resetwarn*
│  └⊷ Reset warnings
├─⊷ *setwarn*
│  └⊷ Set warning limit
├─⊷ *warnings*
│  └⊷ Check warnings
├─⊷ *mute*
│  └⊷ Mute the group
├─⊷ *unmute*
│  └⊷ Unmute the group
├─⊷ *welcome*
│  └⊷ Toggle welcome messages
├─⊷ *goodbye*
│  └⊷ Toggle goodbye messages
├─⊷ *leave*
│  └⊷ Leave the group (owner)
├─⊷ *join*
│  └⊷ Join group via link (owner)
├─⊷ *creategroup*
│  └⊷ Create a new group
│
│ 🚫 *AUTO-MODERATION*
│
├─⊷ *antilink*
│  └⊷ Block links in group
├─⊷ *antisticker*
│  └⊷ Block stickers
├─⊷ *antiimage*
│  └⊷ Block images
├─⊷ *antivideo*
│  └⊷ Block videos
├─⊷ *antiaudio*
│  └⊷ Block audio messages
├─⊷ *antimention*
│  └⊷ Block mass mentions
├─⊷ *antistatusmention*
│  └⊷ Block status mentions
├─⊷ *antigrouplink*
│  └⊷ Block group links
├─⊷ *antidemote*
│  └⊷ Anti-demotion system
├─⊷ *antipromote*
│  └⊷ Anti-promotion system
├─⊷ *antileave*
│  └⊷ Anti-leave system
│
│ 📊 *GROUP INFO & TOOLS*
│
├─⊷ *groupinfo*
│  └⊷ View group details
├─⊷ *grouplink*
│  └⊷ Get group invite link
├─⊷ *tagall*
│  └⊷ Tag all members
├─⊷ *tagadmin*
│  └⊷ Tag all admins
├─⊷ *hidetag*
│  └⊷ Hidden tag all
├─⊷ *link*
│  └⊷ Get group link
├─⊷ *revoke*
│  └⊷ Revoke group link
├─⊷ *setdesc*
│  └⊷ Set group description
├─⊷ *getparticipants*
│  └⊷ List all participants
├─⊷ *listonline*
│  └⊷ List online members
├─⊷ *listinactive*
│  └⊷ List inactive members
├─⊷ *approveall*
│  └⊷ Approve all requests
├─⊷ *rejectall*
│  └⊷ Reject all requests
│
╰───`;

    await sock.sendMessage(
      m.key.remoteJid,
      { text: menu },
      { quoted: m }
    );
  }
};
