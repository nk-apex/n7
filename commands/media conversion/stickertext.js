import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import webp from 'node-webpmux';

export default {
  name: 'stickertext',
  alias: ['st', 'stext', 'editsticker', 'textsticker'],
  description: 'Add text to a sticker (static or animated)',
  category: 'converter',

  async execute(sock, m, args) {
    const jid = m.key.remoteJid;

    try {
      let stickerMessage = null;

      if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        const quoted = m.message.extendedTextMessage.contextInfo.quotedMessage;
        if (quoted.stickerMessage) {
          stickerMessage = quoted.stickerMessage;
        }
      }

      if (!stickerMessage) {
        await sock.sendMessage(jid, {
          text: `╭─⌈ ✏️ *STICKER TEXT* ⌋\n│\n├─ Reply to a sticker with your text\n│\n├─ *Usage:*\n│  ?st Hello World\n│\n├─ *Aliases:* st, stext, editsticker\n│\n├─ *Tips:*\n│  • Text is centered on the sticker\n│  • Works on static & animated stickers\n│\n╰───`
        }, { quoted: m });
        return;
      }

      const text = args.join(' ').trim();
      if (!text) {
        await sock.sendMessage(jid, {
          text: `❌ Please provide text to add!\n\nExample: ?st Your text here\nSplit: ?st Top text | Bottom text`
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

      const id = crypto.randomBytes(4).toString('hex');
      const inputPath = path.join(tmpDir, `st_in_${id}.webp`);
      const outputPath = path.join(tmpDir, `st_out_${id}.webp`);

      fs.writeFileSync(inputPath, stickerBuffer);

      const escapeFFmpeg = (str) => {
        return str
          .replace(/\\/g, '\\\\\\\\')
          .replace(/'/g, "'\\\\\\''")
          .replace(/:/g, '\\:')
          .replace(/;/g, '\\;')
          .replace(/%/g, '%%');
      };

      const fontFile = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
      let fontOpt = '';
      try {
        if (fs.existsSync(fontFile)) {
          fontOpt = `fontfile=${fontFile}:`;
        }
      } catch {}

      const fontSize = 32;
      const borderW = 3;
      const textColor = 'white';
      const borderColor = 'black';

      const escaped = escapeFFmpeg(text);
      const filterStr = `drawtext=${fontOpt}text='${escaped}':fontsize=${fontSize}:fontcolor=${textColor}:borderw=${borderW}:bordercolor=${borderColor}:x=(w-text_w)/2:y=(h-text_h)/2`;

      try {
        if (isAnimated) {
          const framesDir = path.join(tmpDir, `st_frames_${id}`);
          const outFramesDir = path.join(tmpDir, `st_oframes_${id}`);
          fs.mkdirSync(framesDir, { recursive: true });
          fs.mkdirSync(outFramesDir, { recursive: true });

          execSync(`ffmpeg -y -i "${inputPath}" -vsync 0 "${framesDir}/frame_%04d.png" 2>/dev/null`, { timeout: 15000 });

          let frameRate = '15';
          try {
            const probeOut = execSync(`ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 "${inputPath}" 2>/dev/null`, { timeout: 5000 }).toString().trim();
            if (probeOut && probeOut.includes('/')) {
              const [num, den] = probeOut.split('/').map(Number);
              if (num && den) frameRate = String(Math.round(num / den));
            } else if (probeOut && !isNaN(Number(probeOut))) {
              frameRate = probeOut;
            }
          } catch {}

          const frameFiles = fs.readdirSync(framesDir).filter(f => f.endsWith('.png')).sort();

          for (const frame of frameFiles) {
            const framePath = path.join(framesDir, frame);
            const outFramePath = path.join(outFramesDir, frame);
            try {
              execSync(`ffmpeg -y -i "${framePath}" -vf "${filterStr}" "${outFramePath}" 2>/dev/null`, { timeout: 5000 });
            } catch {
              fs.copyFileSync(framePath, outFramePath);
            }
          }

          execSync(`ffmpeg -y -framerate ${frameRate} -i "${outFramesDir}/frame_%04d.png" -vcodec libwebp -lossless 0 -compression_level 4 -q:v 40 -loop 0 -preset default -an -vsync 0 -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000" "${outputPath}" 2>/dev/null`, { timeout: 20000 });

          fs.rmSync(framesDir, { recursive: true, force: true });
          fs.rmSync(outFramesDir, { recursive: true, force: true });

        } else {
          execSync(`ffmpeg -y -i "${inputPath}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000,${filterStr}" -vcodec libwebp -lossless 0 -compression_level 4 -q:v 70 "${outputPath}" 2>/dev/null`, { timeout: 15000 });
        }
      } catch (ffErr) {
        console.error('❌ [STICKERTEXT] FFmpeg error:', ffErr.message);

        try {
          execSync(`ffmpeg -y -i "${inputPath}" -vf "${filterStr}" -vcodec libwebp -lossless 0 -q:v 70 "${outputPath}" 2>/dev/null`, { timeout: 15000 });
        } catch {
          cleanup(inputPath, outputPath);
          await sock.sendMessage(jid, { react: { text: "❌", key: m.key } });
          await sock.sendMessage(jid, { text: "❌ Failed to add text to sticker. The sticker format may not be supported." }, { quoted: m });
          return;
        }
      }

      if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size < 100) {
        cleanup(inputPath, outputPath);
        await sock.sendMessage(jid, { react: { text: "❌", key: m.key } });
        await sock.sendMessage(jid, { text: "❌ Failed to generate sticker output." }, { quoted: m });
        return;
      }

      let finalBuffer = fs.readFileSync(outputPath);

      try {
        finalBuffer = await addStickerMetadata(finalBuffer, {
          packName: 'WolfBot',
          authorName: m.pushName || 'User',
          emoji: '✏️'
        });
      } catch {}

      await sock.sendMessage(jid, { sticker: finalBuffer }, { quoted: m });
      await sock.sendMessage(jid, { react: { text: "✅", key: m.key } });

      cleanup(inputPath, outputPath);
      console.log(`✅ [STICKERTEXT] Text sticker sent (animated: ${isAnimated})`);

    } catch (error) {
      console.error('❌ [STICKERTEXT] Error:', error);
      await sock.sendMessage(jid, { react: { text: "❌", key: m.key } });
      await sock.sendMessage(jid, {
        text: `❌ *Failed to edit sticker*\n\n${error.message}\n\n💡 Try a different sticker or shorter text.`
      }, { quoted: m });
    }
  }
};

function cleanup(...paths) {
  for (const p of paths) {
    try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch {}
  }
}

async function addStickerMetadata(webpBuffer, metadata) {
  try {
    const { packName, authorName, emoji } = metadata;
    const img = new webp.Image();
    await img.load(webpBuffer);

    const json = {
      'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
      'sticker-pack-name': packName,
      'sticker-pack-publisher': authorName,
      'emojis': [emoji]
    };

    const exifAttr = Buffer.from([
      0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x16, 0x00, 0x00, 0x00
    ]);

    const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
    const exif = Buffer.concat([exifAttr, jsonBuffer]);
    exif.writeUIntLE(jsonBuffer.length, 14, 4);

    img.exif = exif;
    return await img.save(null);
  } catch {
    return webpBuffer;
  }
}
