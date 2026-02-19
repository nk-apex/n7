import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import sharp from 'sharp';
import fs from 'fs';

function getRealWhatsAppNumber(jid) {
    if (!jid) return 'Unknown';
    try {
        const numberPart = jid.split('@')[0];
        let cleanNumber = numberPart.replace(/[^\d+]/g, '');
        if (cleanNumber.length >= 10 && !cleanNumber.startsWith('+')) {
            if (cleanNumber.length >= 10 && cleanNumber.length <= 15) {
                return `+${cleanNumber}`;
            }
        }
        if (cleanNumber.startsWith('+') && cleanNumber.length >= 12) {
            return cleanNumber;
        }
        if (cleanNumber && /^\d+$/.test(cleanNumber) && cleanNumber.length >= 10) {
            return `+${cleanNumber}`;
        }
        return numberPart || 'Unknown';
    } catch {
        return 'Unknown';
    }
}

function getGroupName(chatJid) {
    if (!chatJid || !chatJid.includes('@g.us')) {
        return 'Private Chat';
    }
    const gmdCache = globalThis.groupMetadataCache;
    if (gmdCache) {
        const cached = gmdCache.get(chatJid);
        if (cached && cached.data && cached.data.subject) {
            return cached.data.subject;
        }
    }
    return chatJid.split('@')[0];
}

export default {
  name: 'toimage',
  description: 'Convert sticker to image using sharp',
  category: 'converter',

  async execute(sock, m, args, PREFIX, extra) {
    console.log('🖼️ [TOIMAGE] Command triggered');
    
    const jid = m.key.remoteJid;
    const prefix = PREFIX || '#';
    
    if (!m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage) {
      await sock.sendMessage(jid, { 
        text: `╭─⌈ 🖼️ *STICKER TO IMAGE* ⌋\n│\n├─⊷ *${prefix}toimage*\n│  └⊷ Reply to a sticker to convert it to image\n│\n╰───` 
      }, { quoted: m });
      return;
    }

    const quoted = m.message.extendedTextMessage.contextInfo;
    
    await sock.sendMessage(jid, { 
      text: `⏳ *Converting sticker to image...*` 
    }, { quoted: m });

    try {
      console.log(`🖼️ [TOIMAGE] Downloading sticker...`);
      
      const stream = await downloadContentFromMessage(
        quoted.quotedMessage.stickerMessage, 
        'sticker'
      );
      
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      console.log(`🖼️ [TOIMAGE] Sticker size: ${buffer.length} bytes`);
      
      const isAnimated = buffer.toString('hex').includes('414e494d') ||
                         buffer.includes('ANMF');
      
      if (isAnimated) {
        throw new Error('Animated stickers cannot be converted to static images');
      }

      console.log(`🖼️ [TOIMAGE] Converting with sharp...`);
      
      const imageBuffer = await sharp(buffer)
        .png()
        .toBuffer();
      
      const fileSizeKB = (imageBuffer.length / 1024).toFixed(1);
      console.log(`✅ [TOIMAGE] Conversion complete: ${fileSizeKB}KB`);
      
      const senderJid = quoted.participant || m.message?.extendedTextMessage?.contextInfo?.participant || 'Unknown';
      const senderNumber = getRealWhatsAppNumber(senderJid);

      const isGroup = jid.includes('@g.us');
      let retrieverJid;
      if (isGroup) {
          retrieverJid = m.key.participant || m.key.remoteJid;
      } else {
          retrieverJid = m.key.fromMe ? (sock.user?.id || m.key.remoteJid) : m.key.remoteJid;
      }
      const retrieverNumber = getRealWhatsAppNumber(retrieverJid);

      const chatName = isGroup ? getGroupName(jid) : 'Private Chat';

      const now = new Date();
      const timeStr = now.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });

      let caption = `🖼️ *Sticker Converted*\n`;
      caption += `📦 *Size:* ${fileSizeKB}KB\n`;
      caption += `✨ *Format:* PNG\n`;
      caption += `─────────────────\n`;
      caption += `📤 *Sent by:* ${senderNumber}\n`;
      caption += `📥 *Retrieved by:* ${retrieverNumber}\n`;
      caption += `🕐 *Time:* ${timeStr}\n`;
      caption += `💬 *${isGroup ? 'Group' : 'Chat'}:* ${chatName}`;

      await sock.sendMessage(jid, {
        image: imageBuffer,
        caption: caption
      }, { quoted: m });
      
      console.log(`✅ [TOIMAGE] Image sent successfully`);

    } catch (error) {
      console.error('❌ [TOIMAGE] Error:', error);
      
      let errorMsg = `❌ *Conversion failed*\n\n⚠️ *Error:* ${error.message}`;
      
      if (error.message.includes('sharp') || error.message.includes('libvips')) {
        errorMsg += "\n• Sharp library issue";
        errorMsg += "\n• Install: `npm install sharp`";
      } else if (error.message.includes('Animated')) {
        errorMsg += "\n• Animated stickers cannot be converted";
        errorMsg += "\n• Use static stickers only";
      }
      
      errorMsg += "\n\n💡 *Tips:*\n• Use static stickers (not animated)\n• Make sure sticker is not corrupted";
      
      await sock.sendMessage(jid, { 
        text: errorMsg
      }, { quoted: m });
    }
  }
};
