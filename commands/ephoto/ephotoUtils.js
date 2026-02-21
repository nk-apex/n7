import axios from 'axios';

const EPHOTO_EFFECTS = {
  neon: { id: 68, name: 'Neon Text', url: 'https://en.ephoto360.com/tao-hieu-ung-chu-neon-dep-68.html', emoji: '💡' },
  colorfulglow: { id: 69, name: 'Colorful Glowing Text', url: 'https://en.ephoto360.com/colorful-glowing-text-effect-online-69.html', emoji: '🌈' },
  advancedglow: { id: 74, name: 'Advanced Glow', url: 'https://en.ephoto360.com/advanced-glow-effects-74.html', emoji: '✨' },
  neononline: { id: 78, name: 'Neon Online', url: 'https://en.ephoto360.com/neon-text-effect-online-78.html', emoji: '🔮' },
  blueneon: { id: 117, name: 'Blue Neon', url: 'https://en.ephoto360.com/blue-neon-text-effect-117.html', emoji: '🔵' },
  neontext: { id: 171, name: 'Neon Text Effect', url: 'https://en.ephoto360.com/neon-text-effect-171.html', emoji: '💫' },
  neonlight: { id: 200, name: 'Neon Light', url: 'https://en.ephoto360.com/neon-text-effect-light-200.html', emoji: '🌟' },
  greenneon: { id: 395, name: 'Green Neon', url: 'https://en.ephoto360.com/green-neon-text-effect-395.html', emoji: '🟢' },
  greenlightneon: { id: 429, name: 'Green Light Neon', url: 'https://en.ephoto360.com/create-light-effects-green-neon-online-429.html', emoji: '💚' },
  blueneonlogo: { id: 507, name: 'Blue Neon Logo', url: 'https://en.ephoto360.com/create-blue-neon-logo-online-507.html', emoji: '🔷' },
  galaxyneon: { id: 521, name: 'Galaxy Neon', url: 'https://en.ephoto360.com/making-neon-light-text-effect-with-galaxy-style-521.html', emoji: '🌌' },
  retroneon: { id: 538, name: 'Retro Neon', url: 'https://en.ephoto360.com/free-retro-neon-text-effect-online-538.html', emoji: '🕹️' },
  multicolorneon: { id: 591, name: 'Multicolor Neon Signature', url: 'https://en.ephoto360.com/create-multicolored-neon-light-signatures-591.html', emoji: '🎆' },
  hackerneon: { id: 677, name: 'Hacker Cyan Neon', url: 'https://en.ephoto360.com/create-anonymous-hacker-avatars-cyan-neon-677.html', emoji: '👤' },
  devilwings: { id: 683, name: 'Devil Wings Neon', url: 'https://en.ephoto360.com/neon-devil-wings-text-effect-online-683.html', emoji: '😈' },
  glowtext: { id: 706, name: 'Glowing Text', url: 'https://en.ephoto360.com/create-glowing-text-effects-online-706.html', emoji: '🔆' },
  blackpinkneon: { id: 710, name: 'Blackpink Neon Logo', url: 'https://en.ephoto360.com/create-a-blackpink-neon-logo-text-effect-online-710.html', emoji: '🖤' },
  neonglitch: { id: 768, name: 'Neon Glitch', url: 'https://en.ephoto360.com/create-impressive-neon-glitch-text-effects-online-768.html', emoji: '⚡' },
  colorfulneonlight: { id: 797, name: 'Colorful Neon Light', url: 'https://en.ephoto360.com/create-colorful-neon-light-text-effects-online-797.html', emoji: '🌈' },
};

async function generateEphoto(effectKey, text) {
  const effect = EPHOTO_EFFECTS[effectKey];
  if (!effect) throw new Error('Unknown effect');

  try {
    const { ephoto } = await import('mumaker');
    const result = await ephoto(effect.url, [text]);
    if (result && result.status && result.image) {
      return result.image;
    }
  } catch (err) {
    console.log(`[EPHOTO] mumaker failed for ${effectKey}: ${err.message}`);
  }

  const fallbackApis = [
    `https://widipe.com/ephoto360?url=${encodeURIComponent(effect.url)}&text=${encodeURIComponent(text)}`,
  ];

  for (const apiUrl of fallbackApis) {
    try {
      const res = await axios.get(apiUrl, { timeout: 20000 });
      const imgUrl = res.data?.url || res.data?.image || res.data?.result?.url || res.data?.result?.image;
      if (imgUrl) return imgUrl;
    } catch {}
  }

  return null;
}

function createEphotoCommand(effectKey) {
  const effect = EPHOTO_EFFECTS[effectKey];
  return {
    name: effectKey,
    alias: [`ephoto${effect.id}`, `ep${effect.id}`],
    description: `${effect.emoji} ${effect.name} Effect`,
    category: 'ephoto',
    ownerOnly: false,
    usage: `${effectKey} <text>`,

    async execute(sock, msg, args, PREFIX) {
      const chatId = msg.key.remoteJid;
      const text = args.join(' ');

      if (!text) {
        return await sock.sendMessage(chatId, {
          text: `╭─⌈ ${effect.emoji} *${effect.name.toUpperCase()}* ⌋\n│\n├─⊷ *Usage:* ${PREFIX}${effectKey} <text>\n│\n├─⊷ *Example:*\n│  └⊷ ${PREFIX}${effectKey} WolfBot\n│\n├─⊷ *Aliases:* ephoto${effect.id}, ep${effect.id}\n│\n╰───────────────\n> *WOLFBOT EPHOTO*`
        }, { quoted: msg });
      }

      await sock.sendMessage(chatId, { react: { text: '⏳', key: msg.key } });

      try {
        const imageUrl = await generateEphoto(effectKey, text);

        if (!imageUrl) {
          await sock.sendMessage(chatId, { react: { text: '❌', key: msg.key } });
          return await sock.sendMessage(chatId, {
            text: `❌ Failed to generate ${effect.name} effect. Try again later.`
          }, { quoted: msg });
        }

        const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 30000 });
        const imageBuffer = Buffer.from(imageResponse.data);

        await sock.sendMessage(chatId, {
          image: imageBuffer,
          caption: `${effect.emoji} *${effect.name}*\n📝 Text: ${text}\n\n🐺 *Created by WOLFBOT*`
        }, { quoted: msg });

        await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } });
      } catch (error) {
        console.log(`[EPHOTO] ${effectKey} error:`, error.message);
        await sock.sendMessage(chatId, { react: { text: '❌', key: msg.key } });
        await sock.sendMessage(chatId, {
          text: `❌ Error generating ${effect.name}: ${error.message}`
        }, { quoted: msg });
      }
    }
  };
}

export { EPHOTO_EFFECTS, generateEphoto, createEphotoCommand };
