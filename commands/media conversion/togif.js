import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import sharp from 'sharp';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export default {
  name: 'togif',
  alias: ['stickertogif', 'gif'],
  description: 'Convert sticker to GIF',
  category: 'converter',

  async execute(sock, m, args) {
    const jid = m.key.remoteJid;

    try {
      let stickerMessage = null;

      if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage) {
        stickerMessage = m.message.extendedTextMessage.contextInfo.quotedMessage.stickerMessage;
      } else if (m.message?.stickerMessage) {
        stickerMessage = m.message.stickerMessage;
      }

      if (!stickerMessage) {
        await sock.sendMessage(jid, {
          text: `╭─⌈ 🎞️ *STICKER TO GIF* ⌋\n│\n├─ Reply to a sticker to convert it to GIF\n│\n├─ *Usage:*\n│  ?togif\n│\n├─ *Aliases:* togif, stickertogif, gif\n│\n├─ *Tips:*\n│  • Works on both static & animated stickers\n│  • Static stickers become a single-frame GIF\n│\n╰───`
        }, { quoted: m });
        return;
      }

      await sock.sendMessage(jid, { react: { text: "⏳", key: m.key } });

      const stream = await downloadContentFromMessage(stickerMessage, 'sticker');
      const chunks = [];
      for await (const chunk of stream) { chunks.push(chunk); }
      const stickerBuffer = Buffer.concat(chunks);

      if (stickerBuffer.length < 100) {
        await sock.sendMessage(jid, { react: { text: "❌", key: m.key } });
        await sock.sendMessage(jid, { text: "❌ Could not download sticker." }, { quoted: m });
        return;
      }

      const isAnimated = stickerMessage.isAnimated || false;
      const tmpDir = path.join(process.cwd(), 'tmp');
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

      const ts = Date.now();
      const gifPath = path.join(tmpDir, `togif_${ts}.gif`);
      const mp4Path = path.join(tmpDir, `togif_${ts}.mp4`);

      const gifBuffer = await sharp(stickerBuffer, { animated: isAnimated })
        .gif()
        .toBuffer();

      fs.writeFileSync(gifPath, gifBuffer);

      execSync(`ffmpeg -y -i "${gifPath}" -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -c:v libx264 -pix_fmt yuv420p -preset fast -crf 23 -movflags +faststart -an "${mp4Path}" 2>/dev/null`, { timeout: 20000 });

      const mp4Buffer = fs.readFileSync(mp4Path);
      const fileSizeKB = (mp4Buffer.length / 1024).toFixed(1);

      await sock.sendMessage(jid, {
        video: mp4Buffer,
        gifPlayback: true,
        caption: `🎞️ *Converted to GIF* (${fileSizeKB}KB)\n> _WOLFBOT_`,
        mimetype: 'video/mp4'
      }, { quoted: m });

      await sock.sendMessage(jid, { react: { text: "✅", key: m.key } });
      console.log(`✅ [TOGIF] Sticker converted to GIF/MP4 (animated: ${isAnimated}, ${fileSizeKB}KB)`);

      try { fs.unlinkSync(gifPath); } catch {}
      try { fs.unlinkSync(mp4Path); } catch {}

    } catch (error) {
      console.error('❌ [TOGIF] Error:', error);
      await sock.sendMessage(jid, { react: { text: "❌", key: m.key } });
      await sock.sendMessage(jid, {
        text: `❌ *Failed to convert sticker to GIF*\n\n${error.message}\n\n💡 Try a different sticker.`
      }, { quoted: m });
    }
  }
};
