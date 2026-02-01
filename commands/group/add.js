export default {
  name: 'add',
  description: 'Add members to group',
  category: 'group',

  async execute(sock, msg, args, metadata) {
    const groupId = msg.key.remoteJid;
    const isGroup = groupId.endsWith('@g.us');
    const senderId = msg.key.participant || msg.key.remoteJid;
    const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';

    if (!isGroup) {
      return await sock.sendMessage(groupId, { 
        text: '❌ This command can only be used in groups.' 
      }, { quoted: msg });
    }

    const participants = metadata?.participants || [];
    const isUserAdmin = participants.find(p => p.id === senderId)?.admin !== null;
    const isBotAdmin = participants.find(p => p.id === botNumber)?.admin !== null;

    if (!isUserAdmin) {
      return await sock.sendMessage(groupId, { 
        text: '🛑 Only admins can use this command.' 
      }, { quoted: msg });
    }

    // if (!isBotAdmin) {
    //   return await sock.sendMessage(groupId, { 
    //     text: '⚠️ I must be an admin to add members.' 
    //   }, { quoted: msg });
    // }

    if (!args[0]) {
      const prefix = '.'; // Change this to your bot's prefix
      return await sock.sendMessage(groupId, {
        text: `📋 *ADD COMMAND*\n` +
              `*Usage:*\n` +
              `• ${prefix}add 2547xxxxxxxx\n` +
              `• ${prefix}add 254xxx,254yyy,254zzz\n` +
              `*Examples:*\n` +
              `• ${prefix}add 254712345678\n` +
              `• ${prefix}add 254712345678,254798765432\n` +
             ``
      }, { quoted: msg });
    }

    // Check if adding multiple numbers
    let numbersToAdd = [];
    
    if (args[0].includes(',') || args.length > 1) {
      // Handle comma-separated or multiple arguments
      const allArgs = args.join(' ').split(',').map(arg => arg.trim());
      numbersToAdd = allArgs.map(num => {
        const cleanNum = num.replace(/[^0-9]/g, '');
        if (cleanNum.length >= 10) {
          return cleanNum + '@s.whatsapp.net';
        }
        return null;
      }).filter(num => num !== null);
    } else {
      // Single number
      const cleanNumber = args[0].replace(/[^0-9]/g, '');
      if (cleanNumber.length < 10) {
        return await sock.sendMessage(groupId, {
          text: '❌ Invalid phone number format.\nExample: .add 254712345678'
        }, { quoted: msg });
      }
      numbersToAdd = [cleanNumber + '@s.whatsapp.net'];
    }

    if (numbersToAdd.length === 0) {
      return await sock.sendMessage(groupId, {
        text: '❌ No valid phone numbers provided.\nExample: .add 254712345678'
      }, { quoted: msg });
    }

    // Check group size limits
    try {
      const groupMetadata = await sock.groupMetadata(groupId);
      const currentSize = groupMetadata.participants.length;
      const maxSize = 1024; // WhatsApp group limit
      const remainingSlots = maxSize - currentSize;
      
      if (numbersToAdd.length > remainingSlots) {
        return await sock.sendMessage(groupId, {
          text: `❌ Cannot add ${numbersToAdd.length} members.\n` +
                `Group has ${currentSize}/${maxSize} members.\n` +
                `Only ${remainingSlots} slots remaining.`
        }, { quoted: msg });
      }

      // Show processing message
      // await sock.sendMessage(groupId, {
      //   text: `⏳ Adding ${numbersToAdd.length} member(s)...`
      // }, { quoted: msg });

      // Add members in batches to avoid rate limiting
      const batchSize = 5;
      const addedSuccessfully = [];
      const failedToAdd = [];

      for (let i = 0; i < numbersToAdd.length; i += batchSize) {
        const batch = numbersToAdd.slice(i, i + batchSize);
        
        try {
          await sock.groupParticipantsUpdate(groupId, batch, 'add');
          addedSuccessfully.push(...batch);
          
          // Small delay between batches
          if (i + batchSize < numbersToAdd.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (batchError) {
          console.error('Batch add error:', batchError.message);
          batch.forEach(number => {
            failedToAdd.push({
              number: number.split('@')[0],
              error: 'Failed to add'
            });
          });
        }
      }

      // Prepare result message
      let resultMessage = '';
      
      if (addedSuccessfully.length > 0) {
        resultMessage += `✅ *Successfully Added:*\n`;
        addedSuccessfully.forEach(num => {
          resultMessage += `• @${num.split('@')[0]}\n`;
        });
        resultMessage += '\n';
      }
      
      if (failedToAdd.length > 0) {
        resultMessage += `❌ *Failed to Add:*\n`;
        failedToAdd.forEach(f => {
          resultMessage += `• @${f.number} (${f.error})\n`;
        });
      }

      // Mention users in the message
      const mentions = [
        ...addedSuccessfully,
        ...failedToAdd.map(f => `${f.number}@s.whatsapp.net`)
      ];

      await sock.sendMessage(groupId, {
        text: resultMessage || '❌ No members were added.',
        mentions: mentions.length > 0 ? mentions : undefined
      }, { quoted: msg });

    } catch (error) {
      console.error('Add Error:', error);
      
      let errorMessage = '❌ Failed to add member(s). ';
      
      if (error.message.includes('401')) {
        errorMessage += 'I\'m not an admin in this group.';
      } else if (error.message.includes('403')) {
        errorMessage += 'The user has privacy settings enabled.';
      } else if (error.message.includes('408')) {
        errorMessage += 'The user is not on WhatsApp.';
      } else if (error.message.includes('500')) {
        errorMessage += 'WhatsApp server error. Try again later.';
      } else if (error.message.includes('not authorized')) {
        errorMessage += 'I need admin permissions to add members.';
      } else {
        errorMessage += error.message.substring(0, 100);
      }
      
      await sock.sendMessage(groupId, { 
        text: errorMessage
      }, { quoted: msg });
    }
  }
};