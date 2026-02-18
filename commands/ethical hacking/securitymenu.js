export default {
  name: "securitymenu",
  alias: ["hackmenu", "secmenu", "hackingmenu", "ethicalmenu"],
  desc: "Shows ethical hacking commands",
  category: "ethical hacking",
  usage: ".securitymenu",

  async execute(sock, m, args, PREFIX) {
    const menu = `╭──⌈ 🛡️ *ETHICAL HACKING* ⌋
│
├─⌈ \`RECON & OSINT\` ⌋
│ ${PREFIX}whois
│ ${PREFIX}dnslookup
│ ${PREFIX}subdomain
│ ${PREFIX}reverseip
│ ${PREFIX}geoip
│ ${PREFIX}portscan
│ ${PREFIX}headers
│ ${PREFIX}traceroute
│ ${PREFIX}asnlookup
│ ${PREFIX}shodan
│
├─⌈ \`NETWORK ANALYSIS\` ⌋
│ ${PREFIX}pinghost
│ ${PREFIX}latency
│ ${PREFIX}sslcheck
│ ${PREFIX}tlsinfo
│ ${PREFIX}openports
│ ${PREFIX}firewallcheck
│ ${PREFIX}maclookup
│ ${PREFIX}bandwidthtest
│
├─⌈ \`WEB SECURITY\` ⌋
│ ${PREFIX}securityheaders
│ ${PREFIX}wafdetect
│ ${PREFIX}robotscheck
│ ${PREFIX}sitemap
│ ${PREFIX}cmsdetect
│ ${PREFIX}techstack
│ ${PREFIX}cookiescan
│ ${PREFIX}redirectcheck
│
├─⌈ \`VULNERABILITY CHECKS\` ⌋
│ ${PREFIX}xsscheck
│ ${PREFIX}sqlicheck
│ ${PREFIX}csrfcheck
│ ${PREFIX}clickjackcheck
│ ${PREFIX}directoryscan
│ ${PREFIX}exposedfiles
│ ${PREFIX}misconfigcheck
│ ${PREFIX}cvecheck
│
├─⌈ \`PASSWORD & HASH TOOLS\` ⌋
│ ${PREFIX}hashidentify
│ ${PREFIX}hashcheck
│ ${PREFIX}bcryptcheck
│ ${PREFIX}passwordstrength
│ ${PREFIX}leakcheck
│
├─⌈ \`FORENSICS & ANALYSIS\` ⌋
│ ${PREFIX}metadata
│ ${PREFIX}filehash
│ ${PREFIX}malwarecheck
│ ${PREFIX}urlscan
│ ${PREFIX}phishcheck
│
╰───────────────
> *WOLFBOT*`;

    await sock.sendMessage(m.key.remoteJid, { text: menu }, { quoted: m });
  }
};
