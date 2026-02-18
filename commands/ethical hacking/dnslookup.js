import dns from 'dns';
import { promisify } from 'util';

const resolve4 = promisify(dns.resolve4);
const resolveMx = promisify(dns.resolveMx);
const resolveNs = promisify(dns.resolveNs);
const resolveTxt = promisify(dns.resolveTxt);
const resolveCname = promisify(dns.resolveCname);

export default {
  name: 'dnslookup',
  alias: ['dns', 'dnsrecords'],
  description: 'DNS records lookup for a domain',
  category: 'ethical hacking',
  usage: 'dnslookup <domain>',
  async execute(sock, m, args, PREFIX) {
    const jid = m.key.remoteJid;
    if (!args[0]) {
      return sock.sendMessage(jid, { text: `╭─⌈ 🌐 *DNS LOOKUP* ⌋\n│\n├─⊷ *${PREFIX}dnslookup <domain>*\n│  └⊷ Get DNS records (A, MX, NS, TXT, CNAME)\n│\n├─⊷ *Example:*\n│  └⊷ ${PREFIX}dnslookup google.com\n│\n╰───────────────\n> *WOLFBOT*` }, { quoted: m });
    }
    await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });
    try {
      const domain = args[0].replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();

      const [aRecords, mxRecords, nsRecords, txtRecords, cnameRecords] = await Promise.allSettled([
        resolve4(domain),
        resolveMx(domain),
        resolveNs(domain),
        resolveTxt(domain),
        resolveCname(domain)
      ]);

      let result = `╭─⌈ 🌐 *DNS LOOKUP* ⌋\n│\n`;
      result += `├─⊷ *Domain:* ${domain}\n│\n`;

      result += `├─⊷ *A Records (IPv4):*\n`;
      if (aRecords.status === 'fulfilled' && aRecords.value.length > 0) {
        aRecords.value.forEach(ip => { result += `│  └⊷ ${ip}\n`; });
      } else {
        result += `│  └⊷ None found\n`;
      }

      result += `│\n├─⊷ *MX Records (Mail):*\n`;
      if (mxRecords.status === 'fulfilled' && mxRecords.value.length > 0) {
        mxRecords.value.sort((a, b) => a.priority - b.priority).forEach(mx => {
          result += `│  └⊷ ${mx.exchange} (Priority: ${mx.priority})\n`;
        });
      } else {
        result += `│  └⊷ None found\n`;
      }

      result += `│\n├─⊷ *NS Records (Nameservers):*\n`;
      if (nsRecords.status === 'fulfilled' && nsRecords.value.length > 0) {
        nsRecords.value.forEach(ns => { result += `│  └⊷ ${ns}\n`; });
      } else {
        result += `│  └⊷ None found\n`;
      }

      result += `│\n├─⊷ *TXT Records:*\n`;
      if (txtRecords.status === 'fulfilled' && txtRecords.value.length > 0) {
        txtRecords.value.flat().slice(0, 10).forEach(txt => {
          result += `│  └⊷ ${txt.length > 100 ? txt.substring(0, 100) + '...' : txt}\n`;
        });
      } else {
        result += `│  └⊷ None found\n`;
      }

      result += `│\n├─⊷ *CNAME Records:*\n`;
      if (cnameRecords.status === 'fulfilled' && cnameRecords.value.length > 0) {
        cnameRecords.value.forEach(cname => { result += `│  └⊷ ${cname}\n`; });
      } else {
        result += `│  └⊷ None found\n`;
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
