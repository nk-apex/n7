import crypto from 'crypto';

export default {
  name: 'bcryptcheck',
  alias: ['bcrypt', 'bcryptinfo'],
  description: 'Analyze bcrypt hash structure or explain bcrypt format',
  category: 'ethical hacking',
  usage: 'bcryptcheck <bcrypt_hash or text>',
  async execute(sock, m, args, PREFIX) {
    const jid = m.key.remoteJid;
    if (!args[0]) {
      return sock.sendMessage(jid, { text: `╭─⌈ 🔐 *BCRYPT ANALYZER* ⌋\n│\n├─⊷ *${PREFIX}bcryptcheck <hash>*\n│  └⊷ Analyze a bcrypt hash string\n│\n├─⊷ *${PREFIX}bcryptcheck <text>*\n│  └⊷ Show bcrypt structure info\n╰───────────────\n> *WOLFBOT*` }, { quoted: m });
    }
    await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });
    try {
      const input = args.join(' ').trim();
      const bcryptRegex = /^\$2([aby])\$(\d{2})\$(.{53})$/;
      const match = input.match(bcryptRegex);

      let result;

      if (match) {
        const version = `$2${match[1]}$`;
        const costFactor = parseInt(match[2]);
        const rounds = Math.pow(2, costFactor);
        const saltAndHash = match[3];
        const salt = saltAndHash.substring(0, 22);
        const hashValue = saltAndHash.substring(22);

        const versionInfo = {
          '$2a$': 'Original bcrypt (may have minor bugs with non-ASCII)',
          '$2b$': 'Fixed bcrypt (OpenBSD 5.5+, recommended)',
          '$2y$': 'PHP crypt_blowfish compatible'
        };

        let crackTime;
        if (costFactor <= 8) crackTime = 'Minutes to Hours (weak)';
        else if (costFactor <= 10) crackTime = 'Hours to Days (moderate)';
        else if (costFactor <= 12) crackTime = 'Days to Weeks (strong)';
        else if (costFactor <= 14) crackTime = 'Weeks to Months (very strong)';
        else crackTime = 'Months to Years (extremely strong)';

        result = `╭─⌈ 🔐 *BCRYPT HASH ANALYSIS* ⌋\n│\n`;
        result += `├─⊷ *Hash:* \`${input.substring(0, 30)}...\`\n│\n`;
        result += `├─⊷ *Version:* ${version}\n`;
        result += `│  └⊷ ${versionInfo[version] || 'Unknown version'}\n│\n`;
        result += `├─⊷ *Cost Factor:* ${costFactor}\n`;
        result += `│  └⊷ ${rounds.toLocaleString()} iterations\n│\n`;
        result += `├─⊷ *Salt (Base64):*\n│  └⊷ \`${salt}\`\n│\n`;
        result += `├─⊷ *Hash (Base64):*\n│  └⊷ \`${hashValue}\`\n│\n`;
        result += `├─⊷ *Security Level:* ${costFactor >= 12 ? '🟢 Strong' : costFactor >= 10 ? '🟡 Moderate' : '🔴 Weak'}\n`;
        result += `├─⊷ *Crack Estimate:* ${crackTime}\n│\n`;
        result += `├─⊷ *Recommendations:*\n`;
        result += `│  └⊷ Min cost factor: 12 for 2024+\n`;
        result += `│  └⊷ Use $2b$ version\n`;
        result += `│  └⊷ Combine with pepper for extra security\n`;
        result += `│\n╰───────────────\n> *WOLFBOT*`;
      } else {
        const inputHash = crypto.createHash('sha256').update(input).digest('hex');

        result = `╭─⌈ 🔐 *BCRYPT STRUCTURE GUIDE* ⌋\n│\n`;
        result += `├─⊷ *Input:* \`${input.substring(0, 30)}${input.length > 30 ? '...' : ''}\`\n`;
        result += `├─⊷ Not a valid bcrypt hash\n│\n`;
        result += `├─⊷ *Bcrypt Format:*\n`;
        result += `│  └⊷ \`$2b$12$salttttttttttttttttttthashhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh\`\n│\n`;
        result += `├─⊷ *Structure Breakdown:*\n`;
        result += `│  ├⊷ \`$2b$\` - Algorithm version\n`;
        result += `│  ├⊷ \`12$\` - Cost factor (2^12 = 4096 rounds)\n`;
        result += `│  ├⊷ Next 22 chars - Base64 encoded salt\n`;
        result += `│  └⊷ Remaining 31 chars - Base64 encoded hash\n│\n`;
        result += `├─⊷ *Versions:*\n`;
        result += `│  ├⊷ $2a$ - Original specification\n`;
        result += `│  ├⊷ $2b$ - Fixed version (recommended)\n`;
        result += `│  └⊷ $2y$ - PHP compatible variant\n│\n`;
        result += `├─⊷ *Cost Factors:*\n`;
        result += `│  ├⊷ 10 = 1,024 rounds (fast, less secure)\n`;
        result += `│  ├⊷ 12 = 4,096 rounds (balanced)\n`;
        result += `│  ├⊷ 14 = 16,384 rounds (slow, more secure)\n`;
        result += `│  └⊷ Each +1 doubles the time\n│\n`;
        result += `├─⊷ *Your text SHA-256:*\n│  └⊷ \`${inputHash}\`\n`;
        result += `│\n╰───────────────\n> *WOLFBOT*`;
      }

      await sock.sendMessage(jid, { text: result }, { quoted: m });
      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
    } catch (err) {
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      await sock.sendMessage(jid, { text: `❌ Error: ${err.message}` }, { quoted: m });
    }
  }
};
