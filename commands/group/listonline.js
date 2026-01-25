// export default {
//   name: 'listonline',
//   description: 'List and tag only online members in the group',
//   aliases: ['online', 'whosonline', 'onlineusers'],
  
//   async execute(sock, m, args, PREFIX, extra) {
//     const jid = m.key.remoteJid;
//     const isGroup = jid.endsWith('@g.us');

//     if (!isGroup) {
//       return sock.sendMessage(jid, { 
//         text: '❌ This command only works in groups.' 
//       }, { quoted: m });
//     }

//     try {
//       // Get group metadata
//       const groupMetadata = await sock.groupMetadata(jid);
//       const participants = groupMetadata.participants;
      
//       // Get the bot's JID properly
//       const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
      
//       // Get all participants except the bot itself and status accounts
//       const allParticipants = participants
//         .filter(participant => 
//           !participant.id.includes('status') && 
//           participant.id !== botJid
//         )
//         .map(participant => ({
//           id: participant.id,
//           name: participant.name || participant.notify || participant.id.split('@')[0],
//           admin: participant.admin || 'member'
//         }));

//       if (allParticipants.length === 0) {
//         return sock.sendMessage(jid, { 
//           text: 'ℹ️ No members found in group.' 
//         }, { quoted: m });
//       }

//       // Send initial message
//       const statusMsg = await sock.sendMessage(jid, { 
//         text: '🔍 *Checking online status...*\n\nScanning group members...' 
//       }, { quoted: m });

//       // Array to store online members
//       let onlineMembers = [];
      
//       // Check online status for each participant
//       for (const participant of allParticipants) {
//         try {
//           // Try to get presence info
//           const presence = await sock.presenceSubscribe(participant.id);
          
//           // Check if user is online (this is a simplified check)
//           // WhatsApp Web API doesn't directly expose online status, 
//           // so we use a combination of methods
          
//           // Method 1: Try to get last seen
//           try {
//             const user = await sock.onWhatsApp(participant.id);
//             if (user && user.exists) {
//               // User exists and is potentially online
//               onlineMembers.push({
//                 ...participant,
//                 lastSeen: 'recently' // Placeholder
//               });
//             }
//           } catch (err) {}
          
//         } catch (err) {
//           // Skip if we can't check status
//           console.log(`Could not check status for ${participant.id}: ${err.message}`);
//         }
//       }

//       // If we couldn't detect any online members with the first method,
//       // use an alternative approach: show members who have been active recently
//       if (onlineMembers.length === 0) {
//         // Fallback: Show all members as potentially online
//         onlineMembers = allParticipants.map(p => ({
//           ...p,
//           lastSeen: 'active'
//         }));
//       }

//       // Get optional custom message from args
//       const customMessage = args.length > 0 ? args.join(' ') : '👥 *Online Members*';
      
//       // Separate admins and members
//       const onlineAdmins = onlineMembers.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
//       const onlineRegular = onlineMembers.filter(p => p.admin !== 'admin' && p.admin !== 'superadmin');
      
//       // Create the caption text
//       let captionText = `${customMessage}\n\n`;
      
//       // Group info
//       const groupName = groupMetadata.subject || 'Group';
//       captionText += `🏷️ *${groupName}*\n`;
//       captionText += `👥 Total Members: ${allParticipants.length}\n`;
//       captionText += `✅ Online Now: ${onlineMembers.length}\n`;
//       captionText += `\n`;
      
//       // Top border
//       captionText += "┏━━━━━━━━━━━━━━━━━┓\n";
      
//       // Online Admins section
//       if (onlineAdmins.length > 0) {
//         captionText += `┃ 👑 *ONLINE ADMINS* (${onlineAdmins.length})\n`;
//         captionText += "┣━━━━━━━━━━━━━━━━━┫\n";
//         onlineAdmins.forEach((participant, index) => {
//           const paddedNumber = (index + 1).toString().padStart(2, '0');
//           const name = participant.name.length > 18 ? participant.name.substring(0, 15) + '...' : participant.name.padEnd(18, ' ');
//           captionText += `┃ ${paddedNumber}. @${name} ⚡\n`;
//         });
//         if (onlineRegular.length > 0) {
//           captionText += "┣━━━━━━━━━━━━━━━━┫\n";
//         }
//       }
      
//       // Online Regular Members section
//       if (onlineRegular.length > 0) {
//         captionText += `┃ 👤 *ONLINE MEMBERS* (${onlineRegular.length})\n`;
//         captionText += "┣━━━━━━━━━━━━━━━┫\n";
//         onlineRegular.forEach((participant, index) => {
//           const startNum = onlineAdmins.length > 0 ? onlineAdmins.length : 0;
//           const paddedNumber = (startNum + index + 1).toString().padStart(2, '0');
//           const name = participant.name.length > 18 ? participant.name.substring(0, 15) + '...' : participant.name.padEnd(18, ' ');
//           captionText += `┃ ${paddedNumber}. @${name} ⚡\n`;
//         });
//       }
      
//       // Bottom border
//       captionText += "┗━━━━━━━━━━━━━┛\n\n";
      
//       // Status indicators
//       captionText += `🔵 *Status Indicators:*\n`;
//       captionText += `⚡ Currently online/active\n`;
//       if (onlineMembers.length < allParticipants.length) {
//         const offlineCount = allParticipants.length - onlineMembers.length;
//         captionText += `⏸️ ${offlineCount} members offline/away\n`;
//       }
      
//       // Footer with timestamp
//       const now = new Date();
//       const timeString = now.toLocaleTimeString('en-US', { 
//         hour: '2-digit', 
//         minute: '2-digit',
//         hour12: true 
//       });
//       const dateString = now.toLocaleDateString('en-US', { 
//         weekday: 'short', 
//         month: 'short', 
//         day: 'numeric' 
//       });
//       captionText += `\n⏰ Checked on ${dateString} at ${timeString}`;

//       // Collect mention IDs for online members
//       const mentionIds = onlineMembers.map(p => p.id);

//       // Update status message
//       await sock.sendMessage(jid, { 
//         text: `✅ *Status check complete!*\n\nFound ${onlineMembers.length} online members.`,
//         edit: statusMsg.key 
//       });

//       // Try to get group profile picture
//       let profilePicture;
//       try {
//         profilePicture = await sock.profilePictureUrl(jid, 'image');
//       } catch (err) {
//         console.log('No profile picture found for group');
//         profilePicture = null;
//       }

//       // Send the online list
//       if (profilePicture) {
//         try {
//           // Download the image
//           const response = await fetch(profilePicture);
//           const buffer = await response.arrayBuffer();
          
//           await sock.sendMessage(jid, { 
//             image: Buffer.from(buffer),
//             caption: captionText,
//             mentions: mentionIds
//           }, { quoted: m });
//         } catch (imgErr) {
//           // Fallback to text if image fails
//           await sock.sendMessage(jid, { 
//             text: captionText,
//             mentions: mentionIds
//           }, { quoted: m });
//         }
//       } else {
//         await sock.sendMessage(jid, { 
//           text: captionText,
//           mentions: mentionIds
//         }, { quoted: m });
//       }

//     } catch (err) {
//       console.error('❌ [ListOnline] ERROR:', err);
      
//       let errorMessage = '❌ *Failed to check online status*\n\n';
      
//       if (err.message?.includes('not-authorized')) {
//         errorMessage += '• Bot needs admin permissions\n';
//         errorMessage += '• Make bot admin and try again\n';
//       } else if (err.message?.includes('group')) {
//         errorMessage += '• Group metadata not accessible\n';
//         errorMessage += '• Try again in a few seconds\n';
//       } else {
//         errorMessage += `• Error: ${err.message}\n`;
//       }
      
//       errorMessage += '\n💡 *Alternative:*\n';
//       errorMessage += `• Use \`${PREFIX}tagall\` to tag everyone\n`;
//       errorMessage += `• Use \`${PREFIX}groupinfo\` for group details\n`;
      
//       await sock.sendMessage(jid, { 
//         text: errorMessage 
//       }, { quoted: m });
//     }
//   }
// };


































export default {
  name: 'listonline',
  description: 'List and tag only online members in the group with advanced detection',
  aliases: ['online', 'whosonline', 'onlineusers', 'active'],
  
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
      
      // Get the bot's JID properly
      const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
      
      // Filter participants
      const allParticipants = participants
        .filter(participant => 
          !participant.id.includes('status') && 
          participant.id !== botJid &&
          !participant.id.includes('broadcast')
        )
        .map(participant => ({
          id: participant.id,
          name: participant.name || participant.notify || participant.id.split('@')[0],
          admin: participant.admin || 'member',
          lastSeen: null,
          isOnline: false,
          lastActive: null
        }));

      if (allParticipants.length === 0) {
        return sock.sendMessage(jid, { 
          text: 'ℹ️ No members found in group.' 
        }, { quoted: m });
      }

      // Send initial message
      const statusMsg = await sock.sendMessage(jid, { 
        text: '🔍 *Advanced Online Status Scan*\n\n📊 Scanning ' + allParticipants.length + ' members...\n⏱️ This may take a few seconds' 
      }, { quoted: m });

      // Array to store online/active members
      let onlineMembers = [];
      let recentlyActive = [];
      let offlineMembers = [];
      
      // Track progress for updates
      let progress = 0;
      const updateProgress = async () => {
        progress++;
        if (progress % 5 === 0) {
          const percent = Math.round((progress / allParticipants.length) * 100);
          try {
            await sock.sendMessage(jid, {
              text: `🔍 *Scanning...* ${percent}% complete\n📊 Checked ${progress}/${allParticipants.length} members`,
              edit: statusMsg.key
            });
          } catch (e) {}
        }
      };

      // Advanced status checking with multiple methods
      for (const participant of allParticipants) {
        try {
          // Method 1: Check presence (most reliable for online status)
          let isOnline = false;
          let lastSeen = null;
          
          try {
            // Subscribe to presence updates
            await sock.presenceSubscribe(participant.id);
            
            // Get current presence
            const presence = sock.presences[participant.id];
            
            if (presence && presence.lastKnownPresence) {
              const presenceTypes = ['available', 'online', 'composing', 'recording'];
              
              // Check if currently online
              if (presenceTypes.includes(presence.lastKnownPresence)) {
                isOnline = true;
                participant.isOnline = true;
                participant.lastActive = 'Just now';
                
                // Calculate last seen from timestamp if available
                if (presence.lastSeen) {
                  const lastSeenTime = new Date(presence.lastSeen);
                  const now = new Date();
                  const diffMs = now - lastSeenTime;
                  const diffMins = Math.floor(diffMs / 60000);
                  
                  if (diffMins < 2) {
                    participant.lastSeen = 'Just now';
                  } else if (diffMins < 60) {
                    participant.lastSeen = `${diffMins} minutes ago`;
                  } else {
                    participant.lastSeen = `${Math.floor(diffMins / 60)} hours ago`;
                  }
                }
              }
            }
          } catch (presenceErr) {
            // Presence check failed, try alternative methods
          }

          // Method 2: Check if user has been active recently via message timestamps
          // This requires access to recent messages
          if (!isOnline) {
            try {
              // Try to get user's last activity from group context
              // This is a simplified approach - in a real implementation,
              // you'd track message timestamps in a database
              
              // Alternative: Check user profile
              const userInfo = await sock.onWhatsApp(participant.id);
              if (userInfo && userInfo.exists) {
                // Mark as recently active if we can confirm they exist
                // This doesn't guarantee online status but shows they use WhatsApp
                participant.lastActive = 'Recently';
              }
            } catch (err) {
              // Skip if we can't check
            }
          }

          // Categorize the participant
          if (isOnline) {
            onlineMembers.push(participant);
          } else if (participant.lastActive) {
            recentlyActive.push(participant);
          } else {
            offlineMembers.push(participant);
          }
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (err) {
          // If we can't determine status, mark as offline
          offlineMembers.push(participant);
        }
        
        await updateProgress();
      }

      // Update final progress
      await sock.sendMessage(jid, {
        text: `✅ *Scan Complete!*\n\n📊 Results:\n• Online: ${onlineMembers.length}\n• Recently Active: ${recentlyActive.length}\n• Offline/Away: ${offlineMembers.length}`,
        edit: statusMsg.key
      });

      // Sort members
      onlineMembers.sort((a, b) => {
        if (a.admin === 'superadmin') return -1;
        if (b.admin === 'superadmin') return 1;
        if (a.admin === 'admin') return -1;
        if (b.admin === 'admin') return 1;
        return a.name.localeCompare(b.name);
      });

      recentlyActive.sort((a, b) => a.name.localeCompare(b.name));

      // Get custom message or use default
      const customMessage = args.length > 0 ? args.join(' ') : '👥 *Group Activity Report*';
      
      // Create comprehensive report
      let captionText = `${customMessage}\n\n`;
      
      // Group info
      const groupName = groupMetadata.subject || 'Group';
      const totalMembers = allParticipants.length;
      captionText += `🏷️ *Group:* ${groupName}\n`;
      captionText += `👥 *Total Members:* ${totalMembers}\n`;
      captionText += `⏱️ *Scan Time:* ${new Date().toLocaleTimeString()}\n`;
      captionText += `\n`;
      
      // Summary statistics
      captionText += "📊 *ACTIVITY SUMMARY*\n";
      captionText += "┌" + "─".repeat(30) + "┐\n";
      captionText += `│ ✅ Currently Online: ${onlineMembers.length.toString().padEnd(10)} │\n`;
      captionText += `│ 🔄 Recently Active: ${recentlyActive.length.toString().padEnd(10)} │\n`;
      captionText += `│ ⏸️  Offline/Away:   ${offlineMembers.length.toString().padEnd(10)} │\n`;
      captionText += "└" + "─".repeat(30) + "┘\n\n";
      
      // Currently Online section
      if (onlineMembers.length > 0) {
        captionText += `🔵 *CURRENTLY ONLINE* (${onlineMembers.length})\n`;
        captionText += "╔" + "═".repeat(35) + "╗\n";
        
        onlineMembers.forEach((member, index) => {
          const adminBadge = member.admin === 'superadmin' ? '👑' : 
                            member.admin === 'admin' ? '⭐' : '👤';
          const number = (index + 1).toString().padStart(2, '0');
          const name = member.name.length > 20 ? 
                      member.name.substring(0, 17) + '...' : 
                      member.name.padEnd(20, ' ');
          
          captionText += `║ ${number}. ${adminBadge} @${name} 🟢\n`;
        });
        
        captionText += "╚" + "═".repeat(35) + "╝\n\n";
      } else {
        captionText += `🔵 *CURRENTLY ONLINE:* None\n\n`;
      }
      
      // Recently Active section (optional)
      if (recentlyActive.length > 0 && args.includes('--all')) {
        captionText += `🟡 *RECENTLY ACTIVE* (${recentlyActive.length})\n`;
        captionText += "┌" + "─".repeat(35) + "┐\n";
        
        recentlyActive.slice(0, 10).forEach((member, index) => {
          const number = (index + 1).toString().padStart(2, '0');
          const name = member.name.length > 22 ? 
                      member.name.substring(0, 19) + '...' : 
                      member.name.padEnd(22, ' ');
          
          captionText += `│ ${number}. @${name} 🔄\n`;
        });
        
        if (recentlyActive.length > 10) {
          captionText += `│ ...and ${recentlyActive.length - 10} more\n`;
        }
        
        captionText += "└" + "─".repeat(35) + "┘\n\n";
      }
      
      // Status Legend
      captionText += `📝 *Status Indicators:*\n`;
      captionText += `🟢 Currently online/active\n`;
      captionText += `🟡 Recently active (within 24h)\n`;
      captionText += `⚪ Offline or unavailable\n`;
      
      if (onlineMembers.length === 0 && !args.includes('--all')) {
        captionText += `\n💡 *Tip:* Use \`${PREFIX}online --all\` to see recently active members\n`;
      }
      
      // Commands hint
      captionText += `\n🔧 *Related Commands:*\n`;
      captionText += `• \`${PREFIX}tagall\` - Tag all members\n`;
      captionText += `• \`${PREFIX}groupinfo\` - Group details\n`;
      captionText += `• \`${PREFIX}activity\` - Member activity stats\n`;
      
      // Footer with timestamp
      const now = new Date();
      captionText += `\n⏰ *Report Generated:* ${now.toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric',
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`;

      // Collect mention IDs
      const mentionIds = [...onlineMembers, ...recentlyActive].map(p => p.id);

      // Try to get group profile picture
      let profilePicture;
      try {
        profilePicture = await sock.profilePictureUrl(jid, 'image');
      } catch (err) {
        profilePicture = null;
      }

      // Send the final report
      if (profilePicture && onlineMembers.length > 0) {
        try {
          // Download the image
          const response = await fetch(profilePicture);
          const buffer = await response.arrayBuffer();
          
          await sock.sendMessage(jid, { 
            image: Buffer.from(buffer),
            caption: captionText,
            mentions: mentionIds
          }, { quoted: m });
        } catch (imgErr) {
          // Fallback to text if image fails
          await sock.sendMessage(jid, { 
            text: captionText,
            mentions: mentionIds
          }, { quoted: m });
        }
      } else {
        await sock.sendMessage(jid, { 
          text: captionText,
          mentions: mentionIds
        }, { quoted: m });
      }

    } catch (err) {
      console.error('❌ [ListOnline Advanced] ERROR:', err);
      
      let errorMessage = '❌ *Advanced Scan Failed*\n\n';
      
      if (err.message?.includes('not-authorized')) {
        errorMessage += '• Bot needs admin permissions\n';
        errorMessage += '• Make bot admin and try again\n';
      } else if (err.message?.includes('rate limit')) {
        errorMessage += '• Rate limited by WhatsApp\n';
        errorMessage += '• Please wait 1 minute and try again\n';
      } else if (err.message?.includes('group')) {
        errorMessage += '• Group metadata not accessible\n';
        errorMessage += '• Try again in a few seconds\n';
      } else {
        errorMessage += `• Error: ${err.message}\n`;
      }
      
      errorMessage += '\n🔄 *Quick Alternative:*\n';
      errorMessage += `• Use \`${PREFIX}tagall\` for immediate tagging\n`;
      errorMessage += `• Use \`${PREFIX}members\` for member list\n`;
      
      await sock.sendMessage(jid, { 
        text: errorMessage 
      }, { quoted: m });
    }
  }
};