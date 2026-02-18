import dns from 'dns';
import { promisify } from 'util';

const resolve4 = promisify(dns.resolve4);

const COMMON_SUBDOMAINS = [
  'www', 'mail', 'ftp', 'api', 'dev', 'test', 'staging', 'admin',
  'blog', 'shop', 'cdn', 'app', 'portal', 'secure', 'vpn', 'git',
  'ci', 'status', 'docs', 'support'
];

export default {
  name: 'subdomain',
  alias: ['subenum', 'subdomains'],
  description: 'Subdomain enumeration using DNS bruteforce',
  category: 'ethical hacking',
  usage: 'subdomain <domain>',
  async execute(sock, m, args, PREFIX) {
    const jid = m.key.remoteJid;
    if (!args[0]) {
      return sock.sendMessage(jid, { text: `╭─⌈ 🌍 *SUBDOMAIN FINDER* ⌋\n│\n├─⊷ *${PREFIX}subdomain <domain>*\n│  └⊷ Find subdomains of a domain\n│\n├─⊷ *Example:*\n│  └⊷ ${PREFIX}subdomain google.com\n│\n╰───────────────\n> *WOLFBOT*` }, { quoted: m });
    }
    await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });
    try {
      const domain = args[0].replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();
      const found = [];

      const checks = COMMON_SUBDOMAINS.map(async (sub) => {
        try {
          const host = `${sub}.${domain}`;
          const ips = await resolve4(host);
          if (ips && ips.length > 0) {
            found.push({ subdomain: host, ips });
          }
        } catch (e) {}
      });

      await Promise.all(checks);
      found.sort((a, b) => a.subdomain.localeCompare(b.subdomain));

      let result = `╭─⌈ 🌍 *SUBDOMAIN FINDER* ⌋\n│\n`;
      result += `├─⊷ *Target:* ${domain}\n`;
      result += `├─⊷ *Checked:* ${COMMON_SUBDOMAINS.length} subdomains\n`;
      result += `├─⊷ *Found:* ${found.length} active\n│\n`;

      if (found.length > 0) {
        found.forEach(({ subdomain, ips }) => {
          result += `├─⊷ *${subdomain}*\n`;
          ips.forEach(ip => { result += `│  └⊷ ${ip}\n`; });
        });
      } else {
        result += `├─⊷ No subdomains found\n`;
      }

      result += `│\n╰───────────────\n> *WOLFBOT*`;

      await sock.sendMessage(jid, { text: result }, { quoted: m });
      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
    } catch (err) {
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      await sock.sendMessage(jid, { text: `❌ Error: ${err.message}` }, { quoted: m });
    }
  }
};
