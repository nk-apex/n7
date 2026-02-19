import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { execFile } from 'child_process';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export default {
  name: 'tovideo',
  alias: ['tomp4', 'stickertovideo'],
  description: 'Convert animated sticker to video',
  category: 'converter',

  async execute(sock, m, args) {
    const jid = m.key.remoteJid;

    let stickerMessage = null;

    if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage) {
      stickerMessage = m.message.extendedTextMessage.contextInfo.quotedMessage.stickerMessage;
    } else if (m.message?.stickerMessage) {
      stickerMessage = m.message.stickerMessage;
    }

    if (!stickerMessage) {
      await sock.sendMessage(jid, {
        text: `╭⌈ 🎬 *STICKER TO VIDEO* ⌋\n├⊷ Reply to an *animated sticker*\n├⊷ to convert it to MP4 video\n╰⊷ _Only works with animated stickers_`
      }, { quoted: m });
      return;
    }

    const isAnimated = stickerMessage.isAnimated;
    if (!isAnimated) {
      await sock.sendMessage(jid, {
        text: `❌ *Not an animated sticker*\n\n💡 This command only works with animated stickers.\nFor static stickers, use *toimage* instead.`
      }, { quoted: m });
      return;
    }

    await sock.sendMessage(jid, {
      react: { text: '⏳', key: m.key }
    });

    const tempDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const timestamp = Date.now();
    const gifPath = path.join(tempDir, `sticker_${timestamp}.gif`);
    const outputPath = path.join(tempDir, `video_${timestamp}.mp4`);

    try {
      const stream = await downloadContentFromMessage(stickerMessage, 'sticker');
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      if (buffer.length < 100) {
        throw new Error('Downloaded sticker is too small or empty');
      }

      const gifBuffer = await sharp(buffer, { animated: true })
        .gif()
        .toBuffer();

      fs.writeFileSync(gifPath, gifBuffer);

      await execFileAsync('ffmpeg', [
        '-i', gifPath,
        '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-preset', 'fast',
        '-crf', '23',
        '-movflags', '+faststart',
        '-an',
        '-y',
        outputPath
      ], { timeout: 30000 });

      if (!fs.existsSync(outputPath)) {
        throw new Error('Video conversion produced no output');
      }

      const videoBuffer = fs.readFileSync(outputPath);
      const fileSizeKB = (videoBuffer.length / 1024).toFixed(1);

      await sock.sendMessage(jid, {
        video: videoBuffer,
        caption: `╭⌈ 🎬 *STICKER TO VIDEO* ⌋\n├⊷ 📦 *Size:* ${fileSizeKB}KB\n├⊷ 🎞️ *Format:* MP4\n╰⊷ _Converted by WOLFBOT_`,
        mimetype: 'video/mp4'
      }, { quoted: m });

      await sock.sendMessage(jid, {
        react: { text: '✅', key: m.key }
      });

    } catch (error) {
      console.error('❌ [TOVIDEO] Error:', error);

      let errorMsg = `❌ *Conversion failed*\n\n⚠️ ${error.message}`;
      if (error.message.includes('timeout') || error.killed) {
        errorMsg = `❌ *Conversion timed out*\n\n💡 The sticker may be too complex. Try a simpler one.`;
      }

      await sock.sendMessage(jid, { text: errorMsg }, { quoted: m });

      await sock.sendMessage(jid, {
        react: { text: '❌', key: m.key }
      });
    } finally {
      try { if (fs.existsSync(gifPath)) fs.unlinkSync(gifPath); } catch {}
      try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch {}
    }
  }
};
