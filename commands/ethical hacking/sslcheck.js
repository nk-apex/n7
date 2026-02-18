import tls from 'tls';

export default {
  name: 'sslcheck',
  alias: ['ssl', 'certcheck'],
  description: 'Check SSL certificate details of a domain',
  category: 'ethical hacking',
  usage: 'sslcheck <domain>',
  async execute(sock, m, args, PREFIX) {
    const jid = m.key.remoteJid;
    if (!args[0]) {
      return sock.sendMessage(jid, { text: `╭─⌈ 🔒 *SSL CERTIFICATE CHECK* ⌋\n│\n├─⊷ *${PREFIX}sslcheck <domain>*\n│  └⊷ Check SSL certificate details\n│\n├─⊷ *Example:*\n│  └⊷ ${PREFIX}sslcheck google.com\n│  └⊷ ${PREFIX}sslcheck github.com\n│\n╰───────────────\n> *WOLFBOT*` }, { quoted: m });
    }
    await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });
    try {
      const host = args[0].replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/:.*$/, '');

      const certInfo = await new Promise((resolve, reject) => {
        const socket = tls.connect(443, host, { servername: host, rejectUnauthorized: false }, () => {
          const cert = socket.getPeerCertificate();
          const cipher = socket.getCipher();
          const protocol = socket.getProtocol();
          const authorized = socket.authorized;

          if (!cert || !cert.subject) {
            socket.destroy();
            return reject(new Error('No certificate found'));
          }

          const validFrom = new Date(cert.valid_from);
          const validTo = new Date(cert.valid_to);
          const now = new Date();
          const daysRemaining = Math.floor((validTo - now) / (1000 * 60 * 60 * 24));

          const issuerParts = [];
          if (cert.issuer.O) issuerParts.push(cert.issuer.O);
          if (cert.issuer.CN) issuerParts.push(cert.issuer.CN);

          const subjectParts = [];
          if (cert.subject.O) subjectParts.push(cert.subject.O);
          if (cert.subject.CN) subjectParts.push(cert.subject.CN);

          let altNames = '';
          if (cert.subjectaltname) {
            const names = cert.subjectaltname.split(',').map(n => n.trim().replace('DNS:', '')).slice(0, 5);
            altNames = names.join(', ');
            if (cert.subjectaltname.split(',').length > 5) altNames += ` (+${cert.subjectaltname.split(',').length - 5} more)`;
          }

          socket.destroy();
          resolve({
            subject: subjectParts.join(' - ') || 'Unknown',
            issuer: issuerParts.join(' - ') || 'Unknown',
            validFrom: validFrom.toUTCString(),
            validTo: validTo.toUTCString(),
            daysRemaining,
            serialNumber: cert.serialNumber || 'Unknown',
            fingerprint: cert.fingerprint256 || cert.fingerprint || 'Unknown',
            protocol: protocol || 'Unknown',
            cipher: cipher ? `${cipher.name} (${cipher.version})` : 'Unknown',
            authorized,
            altNames,
            bits: cert.bits || 'Unknown'
          });
        });

        socket.setTimeout(10000);
        socket.on('timeout', () => { socket.destroy(); reject(new Error('Connection timed out')); });
        socket.on('error', (err) => { socket.destroy(); reject(err); });
      });

      let statusIcon = '🟢';
      let statusText = 'Valid';
      if (!certInfo.authorized) { statusIcon = '🟡'; statusText = 'Self-signed/Untrusted'; }
      if (certInfo.daysRemaining < 0) { statusIcon = '🔴'; statusText = 'Expired'; }
      else if (certInfo.daysRemaining < 30) { statusIcon = '🟠'; statusText = 'Expiring Soon'; }

      const result = `╭─⌈ 🔒 *SSL CERTIFICATE CHECK* ⌋\n│\n├─⊷ *Host:* ${host}\n├─⊷ *Status:* ${statusIcon} ${statusText}\n│\n├─⊷ *── Certificate Details ──*\n├─⊷ *Subject:* ${certInfo.subject}\n├─⊷ *Issuer:* ${certInfo.issuer}\n├─⊷ *Valid From:* ${certInfo.validFrom}\n├─⊷ *Valid To:* ${certInfo.validTo}\n├─⊷ *Days Remaining:* ${certInfo.daysRemaining} days\n├─⊷ *Key Size:* ${certInfo.bits} bits\n│\n├─⊷ *── Connection Info ──*\n├─⊷ *Protocol:* ${certInfo.protocol}\n├─⊷ *Cipher:* ${certInfo.cipher}\n├─⊷ *Trusted:* ${certInfo.authorized ? '✅ Yes' : '❌ No'}\n│\n├─⊷ *── Alt Names ──*\n├─⊷ ${certInfo.altNames || 'None'}\n│\n├─⊷ *Serial:* ${certInfo.serialNumber}\n│\n╰───────────────\n> *WOLFBOT*`;

      await sock.sendMessage(jid, { text: result }, { quoted: m });
      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
    } catch (err) {
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      await sock.sendMessage(jid, { text: `❌ Error: ${err.message}` }, { quoted: m });
    }
  }
};
