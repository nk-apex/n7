export default {
  name: 'leave',
  aliases: ['exit', 'bye', 'out'],
  description: 'Make the bot leave a group',
  category: 'Group',
  ownerOnly: true, // Only bot owner can use

  async execute(sock, m, args, user, isOwner) {
    const { reply, isGroup, groupMetadata, sender, from, text } = m;
    
    if (!isGroup) {
      return reply("❌ This command only works in groups!");
    }

    if (!isOwner) {
      return reply("❌ Only the bot owner can use this command!");
    }

    try {
      // Get group info before leaving
      const groupName = groupMetadata.subject || "Unknown Group";
      const participants = groupMetadata.participants || [];
      const adminCount = participants.filter(p => p.admin).length;
      
      // Send farewell message
      await reply(`👋 *Goodbye everyone!*\n\n📛 *Group:* ${groupName}\n👥 *Members:* ${participants.length}\n👑 *Admins:* ${adminCount}\n\n🚶 *Bot is leaving...*`);
      
      // Small delay before leaving
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Leave the group
      await sock.groupLeave(from);
      
      // Optional: Send notification to owner
      // const ownerNumber = "your-number@s.whatsapp.net";
      // await sock.sendMessage(ownerNumber, {
      //   text: `✅ Bot left group:\n📛 Name: ${groupName}\n📞 ID: ${from}`
      // });
      
    } catch (error) {
      console.error("Leave command error:", error);
      reply("❌ Failed to leave the group: " + error.message);
    }
  }
};