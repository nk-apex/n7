import axios from 'axios';

export default {
  name: 'listinactive',
  description: 'Detect inactive members using WhatsApp last seen',
  aliases: ['inactive', 'lastseen', 'whosaway'],
  
  async execute(sock, m, args, PREFIX, extra) {
    const jid = m.key.remoteJid;
    const isGroup = jid.endsWith('@g.us');

    if (!isGroup) {
      return sock.sendMessage(jid, { 
        text: '❌ This command only works in groups.' 
      }, { quoted: m });
    }

    try {
      // Get group metadata
      const groupMetadata = await sock.groupMetadata(jid);
      const participants = groupMetadata.participants;
      
      const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
      
      // Send initial message
      const statusMsg = await sock.sendMessage(jid, { 
        text: '🔍 *Starting Inactivity Scan...*\n\nChecking last seen status of members...' 
      }, { quoted: m });

      // Array to store results
      const results = {
        highlyInactive: [],    // Last seen > 30 days
        moderatelyInactive: [], // Last seen 7-30 days
        slightlyInactive: [],  // Last seen 1-7 days
        active: [],           // Last seen today
        unknown: [],          // Couldn't check
        total: 0
      };

      let processed = 0;
      const totalMembers = participants.filter(p => 
        !p.id.includes('status') && p.id !== botJid
      ).length;

      // Check each member's last seen status
      for (const participant of participants) {
        if (participant.id.includes('status') || participant.id === botJid) {
          continue;
        }

        processed++;
        const progress = Math.floor((processed / totalMembers) * 100);
        
        // Update progress every 10 members
        if (processed % 10 === 0) {
          await sock.sendMessage(jid, { 
            text: `⏳ *Scanning...* ${progress}%\nProcessed: ${processed}/${totalMembers}`,
            edit: statusMsg.key 
          });
        }

        const name = participant.name || participant.notify || participant.id.split('@')[0];
        
        try {
          // Method 1: Try to get user info (includes last seen)
          const userInfo = await sock.fetchStatus(participant.id);
          
          if (userInfo && userInfo.status) {
            const lastSeen = userInfo.setAt ? new Date(userInfo.setAt * 1000) : null;
            
            const memberData = {
              id: participant.id,
              name: name,
              admin: participant.admin || 'member',
              lastSeen: lastSeen,
              daysAgo: lastSeen ? Math.floor((Date.now() - lastSeen) / (1000 * 60 * 60 * 24)) : null
            };

            // Categorize based on days ago
            if (!lastSeen) {
              results.unknown.push(memberData);
            } else if (memberData.daysAgo > 30) {
              results.highlyInactive.push(memberData);
            } else if (memberData.daysAgo > 7) {
              results.moderatelyInactive.push(memberData);
            } else if (memberData.daysAgo > 1) {
              results.slightlyInactive.push(memberData);
            } else {
              results.active.push(memberData);
            }
          } else {
            results.unknown.push({
              id: participant.id,
              name: name,
              admin: participant.admin || 'member',
              lastSeen: null,
              daysAgo: null,
              reason: 'No status available'
            });
          }
          
        } catch (error) {
          // User might have privacy settings preventing last seen
          results.unknown.push({
            id: participant.id,
            name: name,
            admin: participant.admin || 'member',
            lastSeen: null,
            daysAgo: null,
            reason: 'Privacy settings'
          });
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      results.total = totalMembers;

      // Update status
      await sock.sendMessage(jid, { 
        text: `✅ *Scan Complete!*\n\nAnalyzed ${totalMembers} members.`,
        edit: statusMsg.key 
      });

      // Create detailed report
      let report = `📊 *INACTIVITY ANALYSIS REPORT*\n\n`;
      report += `🏷️ *Group:* ${groupMetadata.subject || 'Unknown'}\n`;
      report += `👥 *Total Members:* ${totalMembers}\n\n`;
      
      report += `📈 *ACTIVITY BREAKDOWN:*\n`;
      report += `🔴 *Highly Inactive (>30 days):* ${results.highlyInactive.length}\n`;
      report += `🟠 *Moderately Inactive (7-30 days):* ${results.moderatelyInactive.length}\n`;
      report += `🟡 *Slightly Inactive (1-7 days):* ${results.slightlyInactive.length}\n`;
      report += `🟢 *Active (Today):* ${results.active.length}\n`;
      report += `⚫ *Unknown/Private:* ${results.unknown.length}\n\n`;
      
      // Show highly inactive members
      if (results.highlyInactive.length > 0) {
        report += `⚠️ *HIGHLY INACTIVE (>30 days)*\n`;
        report += `───────────────\n`;
        
        results.highlyInactive.forEach((member, index) => {
          const nameDisplay = member.name.length > 20 ? 
            member.name.substring(0, 17) + '...' : member.name;
          const daysText = member.daysAgo ? `${member.daysAgo} days ago` : 'Unknown';
          report += `${index + 1}. @${nameDisplay} - ${daysText}\n`;
        });
        report += `\n`;
      }
      
      // Show moderately inactive members
      if (results.moderatelyInactive.length > 0) {
        report += `🟠 *MODERATELY INACTIVE (7-30 days)*\n`;
        report += `───────────────\n`;
        
        results.moderatelyInactive.slice(0, 10).forEach((member, index) => {
          const nameDisplay = member.name.length > 20 ? 
            member.name.substring(0, 17) + '...' : member.name;
          report += `${index + 1}. @${nameDisplay} - ${member.daysAgo} days ago\n`;
        });
        
        if (results.moderatelyInactive.length > 10) {
          report += `... and ${results.moderatelyInactive.length - 10} more\n`;
        }
        report += `\n`;
      }
      
      // Action recommendations
    //   report += `💡 *RECOMMENDATIONS:*\n`;
      
    // //   if (results.highlyInactive.length > 0) {
    // //     const percentage = Math.round((results.highlyInactive.length / totalMembers) * 100);
    // //     report += `• ${results.highlyInactive.length} members (${percentage}%) haven't been seen in over 30 days\n`;
    // //     report += `• Consider sending a warning message first\n`;
    // //     report += `• Use \`${PREFIX}kickall inactive\` to remove all highly inactive members\n`;
    // //   }
      
    //   if (results.moderatelyInactive.length > 0) {
    //     report += `• ${results.moderatelyInactive.length} members inactive for 1-4 weeks\n`;
    //     report += `• Send a reminder message to engage them\n`;
    //   }
      
      // Footer
      const now = new Date();
      report += `\n📅 *Report generated:* ${now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}\n`;
      report += `⏰ *Time:* ${now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}\n\n`;
      
      report += `🔒 *Privacy Note:* Last seen data depends on user privacy settings`;

      // Get mention IDs for highly inactive members
      const mentionIds = results.highlyInactive.map(m => m.id);
      
      // Send report
      await sock.sendMessage(jid, {
        text: report,
        mentions: mentionIds
      }, { quoted: m });

    } catch (err) {
      console.error('❌ [ListInactive] ERROR:', err);
      
      let errorMessage = '❌ *Inactivity scan failed*\n\n';
      
      if (err.message?.includes('rate limit')) {
        errorMessage += '• Rate limited by WhatsApp\n';
        errorMessage += '• Try again in 1 hour\n';
      } else if (err.message?.includes('privacy')) {
        errorMessage += '• Many users have privacy settings enabled\n';
        errorMessage += '• Last seen data may be limited\n';
      } else {
        errorMessage += `• Error: ${err.message}\n`;
      }
      
      errorMessage += '\n💡 *Alternative methods:*\n';
      errorMessage += `• Use \`${PREFIX}tagall\` to engage all members\n`;
      errorMessage += `• Manual observation over time\n`;
      errorMessage += `• Create activity polls\n`;
      
      await sock.sendMessage(jid, { 
        text: errorMessage 
      }, { quoted: m });
    }
  }
};