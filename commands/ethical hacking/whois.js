import axios from 'axios';

export default {
  name: 'whois',
  alias: ['domaininfo', 'whoislookup'],
  description: 'WHOIS domain lookup - get registration details',
  category: 'ethical hacking',
  usage: 'whois <domain>',
  async execute(sock, m, args, PREFIX) {
    const jid = m.key.remoteJid;
    if (!args[0]) {
      return sock.sendMessage(jid, { text: `╭─⌈ 🔍 *WHOIS LOOKUP* ⌋\n│\n├─⊷ *${PREFIX}whois <domain>*\n│  └⊷ Get domain registration info\n│\n├─⊷ *Example:*\n│  └⊷ ${PREFIX}whois google.com\n│\n╰───────────────\n> *WOLFBOT*` }, { quoted: m });
    }
    await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });
    try {
      const domain = args[0].replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();
      const { data } = await axios.get(`https://api.whoisfreaks.com/v1.0/whois?apiKey=demo&whois=live&domainName=${encodeURIComponent(domain)}`, { timeout: 15000 });

      const registrar = data.registrar?.registrar_name || data.registrar || 'Unknown';
      const created = data.create_date || data.created_date || 'Unknown';
      const updated = data.update_date || data.updated_date || 'Unknown';
      const expires = data.expiry_date || data.expire_date || 'Unknown';
      const ns = data.name_servers || [];
      const status = Array.isArray(data.domain_status) ? data.domain_status : (data.domain_status ? [data.domain_status] : ['Unknown']);
      const registrant = data.registrant_contact || {};

      let result = `╭─⌈ 🔍 *WHOIS LOOKUP* ⌋\n│\n`;
      result += `├─⊷ *Domain:* ${data.domain_name || domain}\n`;
      result += `├─⊷ *Registrar:* ${registrar}\n`;
      result += `├─⊷ *Created:* ${created}\n`;
      result += `├─⊷ *Updated:* ${updated}\n`;
      result += `├─⊷ *Expires:* ${expires}\n`;
      if (registrant.company_name) result += `├─⊷ *Organization:* ${registrant.company_name}\n`;
      if (registrant.country_name || registrant.country_code) result += `├─⊷ *Country:* ${registrant.country_name || registrant.country_code}\n`;
      result += `│\n├─⊷ *Nameservers:*\n`;
      if (ns.length > 0) {
        ns.forEach(n => { result += `│  └⊷ ${typeof n === 'string' ? n : n}\n`; });
      } else {
        result += `│  └⊷ None found\n`;
      }
      result += `│\n├─⊷ *Status:*\n`;
      status.slice(0, 5).forEach(s => { result += `│  └⊷ ${s}\n`; });
      result += `│\n╰───────────────\n> *WOLFBOT*`;

      await sock.sendMessage(jid, { text: result }, { quoted: m });
      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
    } catch (err) {
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      await sock.sendMessage(jid, { text: `❌ Error: ${err.message}` }, { quoted: m });
    }
  }
};
