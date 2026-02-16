// File: ./commands/owner/hostip.js
import { execSync, exec } from 'child_process';
import os from 'os';
import dns from 'dns';
import util from 'util';
import { existsSync, readFileSync } from 'fs';

const dnsLookup = util.promisify(dns.lookup);
const dnsResolve = util.promisify(dns.resolve);

export default {
    name: 'hostip',
    alias: ['ip', 'network', 'netinfo', 'whois', 'host'],
    category: 'owner',
    description: 'Get detailed IP, hosting, and network information',
    ownerOnly: true,
    
    async execute(sock, msg, args, PREFIX, extra) {
        const chatId = msg.key.remoteJid;
        const { jidManager, BOT_NAME, VERSION } = extra;
        
        console.log('\n🔍 ========= HOSTIP COMMAND DEBUG =========');
        console.log('Command:', args);
        console.log('Chat ID:', chatId);
        console.log('========================================\n');
        
        // ====== HELPER FUNCTIONS ======
        async function getPublicIP() {
            try {
                // Try multiple public IP services
                const services = [
                    'https://api.ipify.org?format=json',
                    'https://api64.ipify.org?format=json',
                    'https://ifconfig.me/all.json',
                    'https://ipinfo.io/json'
                ];
                
                for (const service of services) {
                    try {
                        const response = await fetch(service, { timeout: 5000 });
                        if (response.ok) {
                            const data = await response.json();
                            
                            if (service.includes('ipify')) {
                                return { ip: data.ip, source: 'ipify.org' };
                            } else if (service.includes('ifconfig.me')) {
                                return { 
                                    ip: data.ip_addr,
                                    country: data.country_code,
                                    city: data.city,
                                    source: 'ifconfig.me' 
                                };
                            } else if (service.includes('ipinfo.io')) {
                                return {
                                    ip: data.ip,
                                    hostname: data.hostname,
                                    city: data.city,
                                    region: data.region,
                                    country: data.country,
                                    loc: data.loc,
                                    org: data.org,
                                    postal: data.postal,
                                    timezone: data.timezone,
                                    source: 'ipinfo.io'
                                };
                            }
                        }
                    } catch (error) {
                        console.log(`Service ${service} failed:`, error.message);
                        continue;
                    }
                }
                
                // Fallback to command line
                try {
                    const output = execSync('curl -s ifconfig.me').toString().trim();
                    if (output && output.match(/\d+\.\d+\.\d+\.\d+/)) {
                        return { ip: output, source: 'curl ifconfig.me' };
                    }
                } catch (error) {
                    // Ignore
                }
                
                return null;
            } catch (error) {
                console.error('Error getting public IP:', error);
                return null;
            }
        }
        
        async function getIPInfo(ip) {
            try {
                const response = await fetch(`https://ipapi.co/${ip}/json/`);
                if (response.ok) {
                    return await response.json();
                }
            } catch (error) {
                console.error('Error getting IP info:', error);
            }
            
            // Fallback to ipinfo.io
            try {
                const response = await fetch(`https://ipinfo.io/${ip}/json`);
                if (response.ok) {
                    return await response.json();
                }
            } catch (error) {
                console.error('Fallback IP info error:', error);
            }
            
            return null;
        }
        
        async function getReverseDNS(ip) {
            try {
                const hostname = await dnsLookup(ip).then(result => result.hostname);
                return hostname;
            } catch (error) {
                try {
                    const hosts = await dnsResolve(ip);
                    return hosts[0] || 'No reverse DNS';
                } catch (e) {
                    return 'No reverse DNS';
                }
            }
        }
        
        async function getNetworkInterfaces() {
            const interfaces = os.networkInterfaces();
            const result = [];
            
            for (const [name, iface] of Object.entries(interfaces)) {
                for (const info of iface) {
                    if (info.family === 'IPv4' && !info.internal) {
                        result.push({
                            interface: name,
                            address: info.address,
                            netmask: info.netmask,
                            mac: info.mac,
                            internal: info.internal,
                            cidr: info.cidr
                        });
                    }
                }
            }
            
            return result;
        }
        
        async function getSystemNetworkInfo() {
            const platform = os.platform();
            let networkInfo = {};
            
            try {
                if (platform === 'linux') {
                    // Linux specific network info
                    try {
                        const routes = execSync('ip route show').toString();
                        networkInfo.routes = routes.split('\n').filter(line => line.trim());
                    } catch (error) {
                        networkInfo.routes = [];
                    }
                    
                    try {
                        const interfaces = execSync('ip -o -4 addr show').toString();
                        networkInfo.interfaceDetails = interfaces.split('\n').filter(line => line.trim());
                    } catch (error) {
                        networkInfo.interfaceDetails = [];
                    }
                    
                    try {
                        const dns = execSync('cat /etc/resolv.conf 2>/dev/null | grep nameserver').toString();
                        networkInfo.dnsServers = dns.split('\n')
                            .filter(line => line.includes('nameserver'))
                            .map(line => line.split(' ')[1]);
                    } catch (error) {
                        networkInfo.dnsServers = [];
                    }
                    
                } else if (platform === 'darwin') {
                    // macOS specific
                    try {
                        const routes = execSync('netstat -rn').toString();
                        networkInfo.routes = routes.split('\n').filter(line => line.trim());
                    } catch (error) {
                        networkInfo.routes = [];
                    }
                    
                } else if (platform === 'win32') {
                    // Windows specific
                    try {
                        const routes = execSync('route print').toString();
                        networkInfo.routes = routes.split('\n').filter(line => line.trim());
                    } catch (error) {
                        networkInfo.routes = [];
                    }
                    
                    try {
                        const dns = execSync('ipconfig /all | findstr "DNS"').toString();
                        networkInfo.dnsServers = dns.split('\n')
                            .filter(line => line.includes('DNS'))
                            .map(line => line.split(':')[1]?.trim());
                    } catch (error) {
                        networkInfo.dnsServers = [];
                    }
                }
            } catch (error) {
                console.error('Error getting system network info:', error);
            }
            
            return networkInfo;
        }
        
        async function getHostingProvider(ip) {
            try {
                const response = await fetch(`https://ipinfo.io/${ip}/org`);
                if (response.ok) {
                    const org = await response.text();
                    return org.trim();
                }
            } catch (error) {
                // Ignore
            }
            
            // Try whois
            try {
                const platform = os.platform();
                let whoisCmd = '';
                
                if (platform === 'linux' || platform === 'darwin') {
                    whoisCmd = `whois ${ip} | grep -i "org-name\\|netname\\|descr" | head -5`;
                } else if (platform === 'win32') {
                    whoisCmd = `whois ${ip}`;
                }
                
                if (whoisCmd) {
                    const output = execSync(whoisCmd, { encoding: 'utf8', maxBuffer: 1024 * 1024 });
                    const lines = output.split('\n').filter(line => 
                        line.toLowerCase().includes('org') || 
                        line.toLowerCase().includes('netname') ||
                        line.toLowerCase().includes('descr')
                    );
                    
                    if (lines.length > 0) {
                        return lines.slice(0, 3).join(', ');
                    }
                }
            } catch (error) {
                console.error('Whois error:', error);
            }
            
            return 'Unknown';
        }
        
        async function getConnectionTest() {
            const testUrls = [
                'https://google.com',
                'https://cloudflare.com',
                'https://github.com',
                'https://api.telegram.org'
            ];
            
            const results = [];
            
            for (const url of testUrls) {
                try {
                    const start = Date.now();
                    const response = await fetch(url, { method: 'HEAD', timeout: 10000 });
                    const latency = Date.now() - start;
                    
                    results.push({
                        url: url.replace('https://', ''),
                        status: response.status,
                        latency: latency,
                        online: response.ok
                    });
                } catch (error) {
                    results.push({
                        url: url.replace('https://', ''),
                        status: 'Error',
                        latency: null,
                        online: false,
                        error: error.message
                    });
                }
                
                // Small delay between tests
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            return results;
        }
        
        async function getPortScan(host = 'localhost') {
            const commonPorts = [
                { port: 22, service: 'SSH' },
                { port: 80, service: 'HTTP' },
                { port: 443, service: 'HTTPS' },
                { port: 3000, service: 'Node.js' },
                { port: 3306, service: 'MySQL' },
                { port: 5432, service: 'PostgreSQL' },
                { port: 6379, service: 'Redis' },
                { port: 27017, service: 'MongoDB' },
                { port: 8080, service: 'HTTP Alt' }
            ];
            
            const results = [];
            
            for (const { port, service } of commonPorts) {
                try {
                    const net = await import('net');
                    const socket = new net.Socket();
                    
                    const result = await new Promise((resolve) => {
                        socket.setTimeout(2000);
                        
                        socket.on('connect', () => {
                            socket.destroy();
                            resolve({ port, service, open: true });
                        });
                        
                        socket.on('timeout', () => {
                            socket.destroy();
                            resolve({ port, service, open: false, reason: 'Timeout' });
                        });
                        
                        socket.on('error', () => {
                            socket.destroy();
                            resolve({ port, service, open: false, reason: 'Refused' });
                        });
                        
                        socket.connect(port, host);
                    });
                    
                    results.push(result);
                    
                } catch (error) {
                    results.push({ port, service, open: false, reason: 'Error', error: error.message });
                }
                
                // Small delay
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            return results;
        }
        
        async function getDNSLookup(domain) {
            try {
                const records = {};
                
                // A records
                try {
                    const aRecords = await dnsResolve(domain);
                    records.A = aRecords;
                } catch (error) {
                    records.A = ['No A records'];
                }
                
                // MX records
                try {
                    const mxRecords = await dns.resolveMx(domain);
                    records.MX = mxRecords.map(mx => `${mx.exchange} (priority ${mx.priority})`);
                } catch (error) {
                    records.MX = ['No MX records'];
                }
                
                // TXT records
                try {
                    const txtRecords = await dns.resolveTxt(domain);
                    records.TXT = txtRecords.flat();
                } catch (error) {
                    records.TXT = ['No TXT records'];
                }
                
                // NS records
                try {
                    const nsRecords = await dns.resolveNs(domain);
                    records.NS = nsRecords;
                } catch (error) {
                    records.NS = ['No NS records'];
                }
                
                return records;
            } catch (error) {
                return { error: error.message };
            }
        }
        
        // ====== COMMAND HANDLING ======
        const subcommand = args[0]?.toLowerCase() || 'info';
        
        switch (subcommand) {
            case 'info':
            case 'all':
                try {
                    console.log('🔍 Getting public IP...');
                    const publicIP = await getPublicIP();
                    
                    console.log('🔍 Getting network interfaces...');
                    const interfaces = await getNetworkInterfaces();
                    
                    console.log('🔍 Getting system network info...');
                    const systemNetInfo = await getSystemNetworkInfo();
                    
                    console.log('🔍 Getting connection test...');
                    const connectionTest = await getConnectionTest();
                    
                    let response = `🌐 *NETWORK & IP INFORMATION*\n\n`;
                    
                    // Public IP Info
                    if (publicIP) {
                        response += `📡 *Public IP Address*\n`;
                        response += `├─ IP: \`${publicIP.ip}\`\n`;
                        
                        if (publicIP.hostname) {
                            response += `├─ Hostname: ${publicIP.hostname}\n`;
                        }
                        
                        if (publicIP.city && publicIP.country) {
                            response += `├─ Location: ${publicIP.city}, ${publicIP.region}, ${publicIP.country}\n`;
                        }
                        
                        if (publicIP.org) {
                            response += `├─ Organization: ${publicIP.org}\n`;
                        }
                        
                        response += `└─ Source: ${publicIP.source}\n\n`;
                        
                        // Get additional IP info
                        const ipInfo = await getIPInfo(publicIP.ip);
                        if (ipInfo) {
                            response += `📍 *IP Details*\n`;
                            if (ipInfo.country_name) {
                                response += `├─ Country: ${ipInfo.country_name} (${ipInfo.country})\n`;
                            }
                            if (ipInfo.region) {
                                response += `├─ Region: ${ipInfo.region}\n`;
                            }
                            if (ipInfo.city) {
                                response += `├─ City: ${ipInfo.city}\n`;
                            }
                            if (ipInfo.postal) {
                                response += `├─ Postal: ${ipInfo.postal}\n`;
                            }
                            if (ipInfo.timezone) {
                                response += `├─ Timezone: ${ipInfo.timezone}\n`;
                            }
                            if (ipInfo.currency) {
                                response += `├─ Currency: ${ipInfo.currency}\n`;
                            }
                            if (ipInfo.asn) {
                                response += `├─ ASN: ${ipInfo.asn}\n`;
                            }
                            if (ipInfo.org) {
                                response += `└─ ISP: ${ipInfo.org}\n\n`;
                            } else {
                                response += `\n`;
                            }
                        }
                    } else {
                        response += `❌ *Could not determine public IP*\n\n`;
                    }
                    
                    // Local Network Interfaces
                    if (interfaces.length > 0) {
                        response += `🏠 *Local Network Interfaces*\n`;
                        interfaces.forEach((iface, index) => {
                            response += `├─ *${iface.interface}*\n`;
                            response += `│  ├─ IP: ${iface.address}\n`;
                            response += `│  ├─ Netmask: ${iface.netmask}\n`;
                            response += `│  ├─ MAC: ${iface.mac}\n`;
                            response += `│  └─ CIDR: ${iface.cidr}\n`;
                            
                            if (index < interfaces.length - 1) {
                                response += `│\n`;
                            }
                        });
                        response += `\n`;
                    }
                    
                    // Connection Test
                    const onlineTests = connectionTest.filter(test => test.online).length;
                    const totalTests = connectionTest.length;
                    
                    response += `📶 *Internet Connection*\n`;
                    response += `├─ Status: ${onlineTests > 0 ? '✅ ONLINE' : '❌ OFFLINE'}\n`;
                    response += `├─ Success Rate: ${onlineTests}/${totalTests}\n`;
                    
                    if (onlineTests > 0) {
                        const avgLatency = connectionTest
                            .filter(test => test.latency)
                            .reduce((sum, test) => sum + test.latency, 0) / onlineTests;
                        response += `└─ Avg Latency: ${avgLatency.toFixed(0)}ms\n\n`;
                    } else {
                        response += `└─ All tests failed\n\n`;
                    }
                    
                    // DNS Servers
                    if (systemNetInfo.dnsServers && systemNetInfo.dnsServers.length > 0) {
                        response += `🔍 *DNS Servers*\n`;
                        systemNetInfo.dnsServers.forEach((dns, index) => {
                            response += `├─ ${dns}\n`;
                        });
                        response += `\n`;
                    }
                    
                    response += `├─⊷ *${PREFIX}hostip local*\n│  └⊷ Local network\n`;
                    response += `├─⊷ *${PREFIX}hostip public*\n│  └⊷ Public IP only\n`;
                    response += `├─⊷ *${PREFIX}hostip test*\n│  └⊷ Connection test\n`;
                    response += `├─⊷ *${PREFIX}hostip scan [host]*\n│  └⊷ Port scan\n`;
                    response += `├─⊷ *${PREFIX}hostip dns [domain]*\n│  └⊷ DNS lookup\n`;
                    response += `├─⊷ *${PREFIX}hostip whois [ip]*\n│  └⊷ WHOIS lookup\n╰───`;
                    
                    await sock.sendMessage(chatId, {
                        text: response
                    }, { quoted: msg });
                    
                } catch (error) {
                    console.error('Error in hostip info:', error);
                    await sock.sendMessage(chatId, {
                        text: `❌ *Error getting network information*\n\nError: ${error.message}\n\nCheck console for details.`
                    }, { quoted: msg });
                }
                break;
                
            case 'local':
            case 'internal':
                try {
                    const interfaces = await getNetworkInterfaces();
                    const systemNetInfo = await getSystemNetworkInfo();
                    
                    let response = `🏠 *LOCAL NETWORK INFORMATION*\n\n`;
                    
                    // Host information
                    response += `🖥️ *Host Information*\n`;
                    response += `├─ Hostname: ${os.hostname()}\n`;
                    response += `├─ Platform: ${os.platform()} ${os.arch()}\n`;
                    response += `└─ Release: ${os.release()}\n\n`;
                    
                    // Network Interfaces
                    if (interfaces.length > 0) {
                        response += `🔌 *Network Interfaces*\n`;
                        interfaces.forEach((iface, index) => {
                            response += `${index === 0 ? '├' : '│'}─ *${iface.interface}*\n`;
                            response += `${index === 0 ? '│' : '│'}  ├─ IP: ${iface.address}\n`;
                            response += `${index === 0 ? '│' : '│'}  ├─ Netmask: ${iface.netmask}\n`;
                            response += `${index === 0 ? '│' : '│'}  ├─ MAC: ${iface.mac}\n`;
                            response += `${index === 0 ? '│' : '│'}  └─ CIDR: ${iface.cidr}\n`;
                            
                            if (index < interfaces.length - 1) {
                                response += `│\n`;
                            }
                        });
                        response += `\n`;
                    } else {
                        response += `❌ No network interfaces found\n\n`;
                    }
                    
                    // Routing Table (abbreviated)
                    if (systemNetInfo.routes && systemNetInfo.routes.length > 0) {
                        response += `🛣️ *Routing Table (First 5 entries)*\n`;
                        systemNetInfo.routes.slice(0, 5).forEach((route, index) => {
                            const parts = route.split(/\s+/);
                            const dest = parts[0] || '';
                            const gateway = parts[1] || '';
                            const iface = parts[parts.length - 1] || '';
                            
                            response += `├─ ${dest.padEnd(20)} → ${gateway.padEnd(15)} via ${iface}\n`;
                        });
                        
                        if (systemNetInfo.routes.length > 5) {
                            response += `└─ ... and ${systemNetInfo.routes.length - 5} more routes\n\n`;
                        } else {
                            response += `\n`;
                        }
                    }
                    
                    // Interface Details (Linux)
                    if (systemNetInfo.interfaceDetails && systemNetInfo.interfaceDetails.length > 0) {
                        response += `📊 *Interface Statistics*\n`;
                        systemNetInfo.interfaceDetails.slice(0, 3).forEach((detail, index) => {
                            const parts = detail.split(/\s+/);
                            if (parts.length >= 6) {
                                const iface = parts[1];
                                const state = parts[8] || 'unknown';
                                const mtu = parts[4] || 'unknown';
                                
                                response += `├─ ${iface}: MTU ${mtu}, State: ${state}\n`;
                            }
                        });
                        response += `\n`;
                    }
                    
                    response += `💡 *Local IP Range Detection*\n`;
                    
                    // Detect common local IP ranges
                    interfaces.forEach(iface => {
                        if (iface.address.startsWith('192.168.')) {
                            response += `├─ ${iface.interface}: Private Class C (192.168.0.0/16)\n`;
                        } else if (iface.address.startsWith('10.')) {
                            response += `├─ ${iface.interface}: Private Class A (10.0.0.0/8)\n`;
                        } else if (iface.address.startsWith('172.16.')) {
                            response += `├─ ${iface.interface}: Private Class B (172.16.0.0/12)\n`;
                        } else if (iface.address === '127.0.0.1') {
                            response += `├─ ${iface.interface}: Loopback (localhost)\n`;
                        } else {
                            response += `├─ ${iface.interface}: Public/Other IP\n`;
                        }
                    });
                    
                    await sock.sendMessage(chatId, {
                        text: response
                    }, { quoted: msg });
                    
                } catch (error) {
                    await sock.sendMessage(chatId, {
                        text: `❌ *Error getting local network info*\n\nError: ${error.message}`
                    }, { quoted: msg });
                }
                break;
                
            case 'public':
            case 'external':
                try {
                    console.log('🔍 Getting public IP...');
                    const publicIP = await getPublicIP();
                    
                    if (!publicIP) {
                        return sock.sendMessage(chatId, {
                            text: `❌ *Could not determine public IP*\n\nMake sure you have internet connection and try again.`
                        }, { quoted: msg });
                    }
                    
                    console.log('🔍 Getting IP info...');
                    const ipInfo = await getIPInfo(publicIP.ip);
                    
                    console.log('🔍 Getting hosting provider...');
                    const provider = await getHostingProvider(publicIP.ip);
                    
                    console.log('🔍 Getting reverse DNS...');
                    const reverseDNS = await getReverseDNS(publicIP.ip);
                    
                    let response = `🌍 *PUBLIC IP INFORMATION*\n\n`;
                    
                    response += `📡 *IP Address*\n`;
                    response += `├─ IP: \`${publicIP.ip}\`\n`;
                    response += `├─ Reverse DNS: ${reverseDNS}\n`;
                    response += `└─ Source: ${publicIP.source}\n\n`;
                    
                    // Location Info
                    if (ipInfo) {
                        response += `📍 *Geolocation*\n`;
                        
                        if (ipInfo.country_name) {
                            response += `├─ Country: ${ipInfo.country_name} (${ipInfo.country_code || ipInfo.country})\n`;
                        }
                        
                        if (ipInfo.region) {
                            response += `├─ Region: ${ipInfo.region}\n`;
                        }
                        
                        if (ipInfo.city) {
                            response += `├─ City: ${ipInfo.city}\n`;
                        }
                        
                        if (ipInfo.postal) {
                            response += `├─ Postal: ${ipInfo.postal}\n`;
                        }
                        
                        if (ipInfo.latitude && ipInfo.longitude) {
                            response += `├─ Coordinates: ${ipInfo.latitude}, ${ipInfo.longitude}\n`;
                            response += `├─ Google Maps: https://maps.google.com/?q=${ipInfo.latitude},${ipInfo.longitude}\n`;
                        }
                        
                        if (ipInfo.timezone) {
                            response += `├─ Timezone: ${ipInfo.timezone}\n`;
                        }
                        
                        if (ipInfo.currency) {
                            response += `├─ Currency: ${ipInfo.currency}\n`;
                        }
                        
                        if (ipInfo.languages) {
                            response += `├─ Languages: ${ipInfo.languages}\n`;
                        }
                        
                        response += `\n`;
                    }
                    
                    // Network Info
                    response += `🔧 *Network Information*\n`;
                    
                    if (ipInfo) {
                        if (ipInfo.asn) {
                            response += `├─ ASN: ${ipInfo.asn}\n`;
                        }
                        
                        if (ipInfo.org) {
                            response += `├─ Organization: ${ipInfo.org}\n`;
                        }
                    }
                    
                    response += `├─ Hosting Provider: ${provider}\n`;
                    
                    // Check if IP is special
                    if (publicIP.ip === '127.0.0.1' || publicIP.ip === '::1') {
                        response += `└─ ⚠️ This is a localhost/loopback address\n`;
                    } else if (publicIP.ip.startsWith('192.168.') || 
                               publicIP.ip.startsWith('10.') || 
                               publicIP.ip.startsWith('172.16.')) {
                        response += `└─ ⚠️ This is a private IP address (NAT)\n`;
                    } else {
                        response += `└─ Type: Public IP Address\n`;
                    }
                    
                    response += `\n`;
                    
                    // Additional services
                    response += `🔍 *Lookup Services*\n`;
                    response += `├─ IPInfo: https://ipinfo.io/${publicIP.ip}\n`;
                    response += `├─ WhatIsMyIP: https://whatismyipaddress.com/ip/${publicIP.ip}\n`;
                    response += `└─ AbuseIPDB: https://www.abuseipdb.com/check/${publicIP.ip}\n\n`;
                    
                    // IP Type Detection
                    response += `🎯 *IP Address Type*\n`;
                    
                    // Check IPv4 vs IPv6
                    if (publicIP.ip.includes(':')) {
                        response += `├─ Version: IPv6\n`;
                        // Check IPv6 type
                        if (publicIP.ip.startsWith('fe80:')) {
                            response += `├─ Scope: Link-local\n`;
                        } else if (publicIP.ip.startsWith('fc00:') || publicIP.ip.startsWith('fd00:')) {
                            response += `├─ Scope: Unique Local Address (ULA)\n`;
                        } else {
                            response += `├─ Scope: Global Unicast\n`;
                        }
                    } else {
                        response += `├─ Version: IPv4\n`;
                        
                        // Check IPv4 class
                        const firstOctet = parseInt(publicIP.ip.split('.')[0]);
                        if (firstOctet >= 1 && firstOctet <= 126) {
                            response += `├─ Class: A\n`;
                        } else if (firstOctet >= 128 && firstOctet <= 191) {
                            response += `├─ Class: B\n`;
                        } else if (firstOctet >= 192 && firstOctet <= 223) {
                            response += `├─ Class: C\n`;
                        }
                    }
                    
                    // Check if IP is reserved
                    const reservedRanges = [
                        { range: '0.0.0.0/8', desc: 'Current network' },
                        { range: '10.0.0.0/8', desc: 'Private network' },
                        { range: '127.0.0.0/8', desc: 'Loopback' },
                        { range: '169.254.0.0/16', desc: 'Link-local' },
                        { range: '172.16.0.0/12', desc: 'Private network' },
                        { range: '192.0.0.0/24', desc: 'IETF Protocol Assignments' },
                        { range: '192.0.2.0/24', desc: 'TEST-NET-1' },
                        { range: '192.88.99.0/24', desc: '6to4 Relay Anycast' },
                        { range: '192.168.0.0/16', desc: 'Private network' },
                        { range: '198.18.0.0/15', desc: 'Network benchmark tests' },
                        { range: '198.51.100.0/24', desc: 'TEST-NET-2' },
                        { range: '203.0.113.0/24', desc: 'TEST-NET-3' },
                        { range: '224.0.0.0/4', desc: 'Multicast' },
                        { range: '240.0.0.0/4', desc: 'Reserved for future use' }
                    ];
                    
                    for (const { range, desc } of reservedRanges) {
                        // Simple check (for demo - real implementation would use ip-math library)
                        if (publicIP.ip.startsWith(range.split('.')[0] + '.')) {
                            response += `└─ Status: Reserved (${desc})\n`;
                            break;
                        }
                    }
                    
                    await sock.sendMessage(chatId, {
                        text: response
                    }, { quoted: msg });
                    
                } catch (error) {
                    console.error('Error in public IP:', error);
                    await sock.sendMessage(chatId, {
                        text: `❌ *Error getting public IP information*\n\nError: ${error.message}`
                    }, { quoted: msg });
                }
                break;
                
            case 'test':
            case 'ping':
            case 'connection':
                try {
                    console.log('🔍 Running connection tests...');
                    const connectionTest = await getConnectionTest();
                    
                    let response = `📶 *CONNECTION TEST RESULTS*\n\n`;
                    response += `🕒 Test time: ${new Date().toLocaleTimeString()}\n\n`;
                    
                    connectionTest.forEach((test, index) => {
                        const statusIcon = test.online ? '✅' : '❌';
                        const latencyText = test.latency ? `${test.latency}ms` : 'N/A';
                        
                        response += `${statusIcon} *${test.url}*\n`;
                        response += `├─ Status: ${test.online ? 'Online' : 'Offline'}\n`;
                        response += `├─ Latency: ${latencyText}\n`;
                        
                        if (test.error) {
                            response += `└─ Error: ${test.error}\n`;
                        } else {
                            response += `└─ HTTP: ${test.status}\n`;
                        }
                        
                        if (index < connectionTest.length - 1) {
                            response += `\n`;
                        }
                    });
                    
                    // Summary
                    const onlineCount = connectionTest.filter(test => test.online).length;
                    const totalCount = connectionTest.length;
                    const successRate = ((onlineCount / totalCount) * 100).toFixed(1);
                    
                    response += `\n📊 *Summary*\n`;
                    response += `├─ Success Rate: ${successRate}%\n`;
                    response += `├─ Online: ${onlineCount}/${totalCount}\n`;
                    
                    if (onlineCount > 0) {
                        const avgLatency = connectionTest
                            .filter(test => test.latency)
                            .reduce((sum, test) => sum + test.latency, 0) / onlineCount;
                        response += `├─ Avg Latency: ${avgLatency.toFixed(0)}ms\n`;
                    }
                    
                    // Connection quality assessment
                    if (onlineCount === totalCount) {
                        response += `└─ Quality: ✅ Excellent\n`;
                    } else if (onlineCount >= totalCount / 2) {
                        response += `└─ Quality: ⚠️ Fair\n`;
                    } else if (onlineCount > 0) {
                        response += `└─ Quality: ⚠️ Poor\n`;
                    } else {
                        response += `└─ Quality: ❌ No Connection\n`;
                    }
                    
                    response += `\n💡 *Troubleshooting:*\n`;
                    if (onlineCount === 0) {
                        response += `• Check your internet connection\n`;
                        response += `• Verify DNS settings\n`;
                        response += `• Check firewall/proxy settings\n`;
                    } else if (onlineCount < totalCount) {
                        response += `• Some services may be blocked\n`;
                        response += `• Check network restrictions\n`;
                    }
                    
                    await sock.sendMessage(chatId, {
                        text: response
                    }, { quoted: msg });
                    
                } catch (error) {
                    await sock.sendMessage(chatId, {
                        text: `❌ *Error running connection test*\n\nError: ${error.message}`
                    }, { quoted: msg });
                }
                break;
                
            case 'scan':
            case 'portscan':
                const host = args[1] || 'localhost';
                
                try {
                    console.log(`🔍 Scanning ports on ${host}...`);
                    const portScan = await getPortScan(host);
                    
                    let response = `🔍 *PORT SCAN RESULTS*\n\n`;
                    response += `🎯 Target: ${host}\n`;
                    response += `🕒 Scan time: ${new Date().toLocaleTimeString()}\n\n`;
                    
                    // Separate open and closed ports
                    const openPorts = portScan.filter(p => p.open);
                    const closedPorts = portScan.filter(p => !p.open);
                    
                    if (openPorts.length > 0) {
                        response += `✅ *OPEN PORTS*\n`;
                        openPorts.forEach(port => {
                            response += `├─ ${port.port} (${port.service})\n`;
                        });
                        response += `\n`;
                    }
                    
                    if (closedPorts.length > 0) {
                        response += `❌ *CLOSED PORTS*\n`;
                        closedPorts.slice(0, 5).forEach(port => {
                            response += `├─ ${port.port} (${port.service}) - ${port.reason}\n`;
                        });
                        
                        if (closedPorts.length > 5) {
                            response += `└─ ... and ${closedPorts.length - 5} more closed ports\n`;
                        }
                    }
                    
                    // Security assessment
                    response += `\n🛡️ *SECURITY ASSESSMENT*\n`;
                    
                    const highRiskPorts = openPorts.filter(p => 
                        [21, 22, 23, 25, 53, 80, 110, 143, 443, 3306, 3389, 5432, 5900, 8080]
                        .includes(p.port)
                    );
                    
                    if (highRiskPorts.length > 0) {
                        response += `⚠️ *Potential Security Notes:*\n`;
                        
                        highRiskPorts.forEach(port => {
                            let risk = '';
                            if ([22, 23].includes(port.port)) risk = 'Remote access';
                            else if ([21, 25, 110, 143].includes(port.port)) risk = 'Unencrypted service';
                            else if ([3306, 5432, 3389].includes(port.port)) risk = 'Database/remote desktop';
                            
                            if (risk) {
                                response += `├─ ${port.port} (${port.service}): ${risk}\n`;
                            }
                        });
                        
                        response += `\n💡 *Recommendations:*\n`;
                        response += `• Use firewalls to restrict access\n`;
                        response += `• Enable encryption where possible\n`;
                        response += `• Regular security updates\n`;
                    } else if (openPorts.length === 0) {
                        response += `✅ No common services detected\n`;
                    } else {
                        response += `✅ Only low-risk ports open\n`;
                    }
                    
                    response += `\n⚡ *Note:* This scans common ports only (not a full scan)`;
                    
                    await sock.sendMessage(chatId, {
                        text: response
                    }, { quoted: msg });
                    
                } catch (error) {
                    await sock.sendMessage(chatId, {
                        text: `❌ *Error scanning ports*\n\nError: ${error.message}\n\nMake sure host is reachable: \`${PREFIX}hostip test\``
                    }, { quoted: msg });
                }
                break;
                
            case 'dns':
            case 'lookup':
                const domain = args[1];
                
                if (!domain) {
                    return sock.sendMessage(chatId, {
                        text: `╭─⌈ ❌ *HOSTIP DNS* ⌋\n│\n├─⊷ *${PREFIX}hostip dns <domain>*\n│  └⊷ DNS lookup\n╰───`
                    }, { quoted: msg });
                }
                
                try {
                    console.log(`🔍 Performing DNS lookup for ${domain}...`);
                    const dnsRecords = await getDNSLookup(domain);
                    
                    if (dnsRecords.error) {
                        return sock.sendMessage(chatId, {
                            text: `❌ *DNS Lookup Failed*\n\nDomain: ${domain}\nError: ${dnsRecords.error}\n\nMake sure the domain exists and is reachable.`
                        }, { quoted: msg });
                    }
                    
                    let response = `🔍 *DNS LOOKUP RESULTS*\n\n`;
                    response += `🌐 Domain: ${domain}\n`;
                    response += `🕒 Lookup time: ${new Date().toLocaleTimeString()}\n\n`;
                    
                    // A Records
                    if (dnsRecords.A && dnsRecords.A.length > 0 && dnsRecords.A[0] !== 'No A records') {
                        response += `📡 *A Records (IPv4)*\n`;
                        dnsRecords.A.forEach((record, index) => {
                            response += `${index === 0 ? '├' : '│'}─ ${record}\n`;
                        });
                        response += `\n`;
                    }
                    
                    // MX Records
                    if (dnsRecords.MX && dnsRecords.MX.length > 0 && dnsRecords.MX[0] !== 'No MX records') {
                        response += `📧 *MX Records (Mail)*\n`;
                        dnsRecords.MX.forEach((record, index) => {
                            response += `${index === 0 ? '├' : '│'}─ ${record}\n`;
                        });
                        response += `\n`;
                    }
                    
                    // NS Records
                    if (dnsRecords.NS && dnsRecords.NS.length > 0 && dnsRecords.NS[0] !== 'No NS records') {
                        response += `🏢 *NS Records (Nameservers)*\n`;
                        dnsRecords.NS.forEach((record, index) => {
                            response += `${index === 0 ? '├' : '│'}─ ${record}\n`;
                        });
                        response += `\n`;
                    }
                    
                    // TXT Records
                    if (dnsRecords.TXT && dnsRecords.TXT.length > 0 && dnsRecords.TXT[0] !== 'No TXT records') {
                        response += `📝 *TXT Records*\n`;
                        dnsRecords.TXT.slice(0, 3).forEach((record, index) => {
                            // Truncate long TXT records
                            const displayText = record.length > 50 ? record.substring(0, 47) + '...' : record;
                            response += `${index === 0 ? '├' : '│'}─ ${displayText}\n`;
                        });
                        
                        if (dnsRecords.TXT.length > 3) {
                            response += `└─ ... and ${dnsRecords.TXT.length - 3} more TXT records\n`;
                        }
                        response += `\n`;
                    }
                    
                    // DNS Propagation Check
                    response += `⚡ *DNS Propagation*\n`;
                    response += `├─ A Records: ${dnsRecords.A?.length || 0} found\n`;
                    response += `├─ MX Records: ${dnsRecords.MX?.length || 0} found\n`;
                    response += `├─ NS Records: ${dnsRecords.NS?.length || 0} found\n`;
                    
                    // Check for common issues
                    if (!dnsRecords.A || dnsRecords.A[0] === 'No A records') {
                        response += `└─ ⚠️ No A records - domain may not be configured\n`;
                    } else if (!dnsRecords.NS || dnsRecords.NS[0] === 'No NS records') {
                        response += `└─ ⚠️ No NS records - unusual configuration\n`;
                    } else {
                        response += `└─ ✅ DNS appears properly configured\n`;
                    }
                    
                    // WHOIS suggestion
                    response += `\n🔍 *Additional Checks:*\n`;
                    response += `• WHOIS: \`${PREFIX}hostip whois ${domain}\`\n`;
                    response += `• IP Info: \`${PREFIX}hostip public\`\n`;
                    
                    await sock.sendMessage(chatId, {
                        text: response
                    }, { quoted: msg });
                    
                } catch (error) {
                    await sock.sendMessage(chatId, {
                        text: `❌ *DNS Lookup Error*\n\nDomain: ${domain}\nError: ${error.message}\n\nMake sure the domain is valid and you have internet connection.`
                    }, { quoted: msg });
                }
                break;
                
            case 'whois':
                const query = args[1];
                
                if (!query) {
                    return sock.sendMessage(chatId, {
                        text: `╭─⌈ ❌ *HOSTIP WHOIS* ⌋\n│\n├─⊷ *${PREFIX}hostip whois <ip_or_domain>*\n│  └⊷ WHOIS lookup\n╰───`
                    }, { quoted: msg });
                }
                
                try {
                    console.log(`🔍 Running WHOIS for ${query}...`);
                    
                    let whoisInfo = '';
                    const platform = os.platform();
                    
                    if (platform === 'linux' || platform === 'darwin') {
                        // Unix-like systems
                        const output = execSync(`whois ${query} | head -30`, { 
                            encoding: 'utf8',
                            maxBuffer: 1024 * 1024 
                        });
                        whoisInfo = output;
                    } else if (platform === 'win32') {
                        // Windows
                        const output = execSync(`whois ${query}`, { 
                            encoding: 'utf8',
                            maxBuffer: 1024 * 1024 
                        });
                        whoisInfo = output;
                    } else {
                        whoisInfo = 'WHOIS not supported on this platform';
                    }
                    
                    // Parse and format WHOIS info
                    const lines = whoisInfo.split('\n').filter(line => line.trim());
                    
                    let response = `🔍 *WHOIS LOOKUP RESULTS*\n\n`;
                    response += `🎯 Query: ${query}\n`;
                    response += `🕒 Lookup time: ${new Date().toLocaleTimeString()}\n\n`;
                    
                    // Extract key information
                    const keyInfo = {
                        'Registrar': [],
                        'Creation Date': [],
                        'Expiration Date': [],
                        'Updated Date': [],
                        'Name Servers': [],
                        'Status': [],
                        'Organization': [],
                        'Country': []
                    };
                    
                    lines.forEach(line => {
                        const lowerLine = line.toLowerCase();
                        
                        if (lowerLine.includes('registrar:')) {
                            keyInfo['Registrar'].push(line);
                        } else if (lowerLine.includes('creation date:') || lowerLine.includes('created:')) {
                            keyInfo['Creation Date'].push(line);
                        } else if (lowerLine.includes('expiration date:') || lowerLine.includes('expires:')) {
                            keyInfo['Expiration Date'].push(line);
                        } else if (lowerLine.includes('updated date:') || lowerLine.includes('updated:')) {
                            keyInfo['Updated Date'].push(line);
                        } else if (lowerLine.includes('name server:') || lowerLine.includes('nserver:')) {
                            keyInfo['Name Servers'].push(line);
                        } else if (lowerLine.includes('status:')) {
                            keyInfo['Status'].push(line);
                        } else if (lowerLine.includes('org:') || lowerLine.includes('organization:')) {
                            keyInfo['Organization'].push(line);
                        } else if (lowerLine.includes('country:')) {
                            keyInfo['Country'].push(line);
                        }
                    });
                    
                    // Display key information
                    Object.entries(keyInfo).forEach(([key, values]) => {
                        if (values.length > 0) {
                            response += `📋 *${key}*\n`;
                            values.slice(0, 3).forEach(value => {
                                response += `├─ ${value}\n`;
                            });
                            if (values.length > 3) {
                                response += `└─ ... and ${values.length - 3} more entries\n`;
                            }
                            response += `\n`;
                        }
                    });
                    
                    // If no key info found, show first few lines
                    if (Object.values(keyInfo).every(arr => arr.length === 0) && lines.length > 0) {
                        response += `📄 *WHOIS Output (First 10 lines)*\n`;
                        lines.slice(0, 10).forEach(line => {
                            response += `├─ ${line}\n`;
                        });
                        
                        if (lines.length > 10) {
                            response += `└─ ... and ${lines.length - 10} more lines\n`;
                        }
                        response += `\n`;
                    }
                    
                    // Domain/IP type detection
                    if (query.match(/^\d+\.\d+\.\d+\.\d+$/)) {
                        response += `🎯 *Type:* IP Address\n`;
                        
                        // Get hosting provider info
                        try {
                            const provider = await getHostingProvider(query);
                            response += `🏢 *Hosting Provider:* ${provider}\n\n`;
                        } catch (error) {
                            // Ignore
                        }
                        
                    } else if (query.includes('.')) {
                        response += `🎯 *Type:* Domain Name\n`;
                        
                        // Check if it's a common TLD
                        const tld = query.split('.').pop().toUpperCase();
                        const commonTLDs = ['COM', 'ORG', 'NET', 'EDU', 'GOV', 'IO', 'CO', 'AI'];
                        
                        if (commonTLDs.includes(tld)) {
                            response += `🌐 *TLD:* .${tld.toLowerCase()} (Common)\n`;
                        } else {
                            response += `🌐 *TLD:* .${tld.toLowerCase()}\n`;
                        }
                    }
                    
                    // Privacy/Proxy detection
                    const privacyIndicators = ['privacy', 'proxy', 'redacted', 'data protected'];
                    const hasPrivacy = lines.some(line => 
                        privacyIndicators.some(indicator => line.toLowerCase().includes(indicator))
                    );
                    
                    if (hasPrivacy) {
                        response += `🛡️ *Privacy:* Protected/Private registration detected\n`;
                    }
                    
                    response += `\n⚡ *Full WHOIS:*\n`;
                    response += `https://whois.domaintools.com/${query}\n`;
                    response += `https://whois.icann.org/en/lookup?name=${query}`;
                    
                    // Truncate if too long
                    if (response.length > 4000) {
                        response = response.substring(0, 3997) + '...';
                    }
                    
                    await sock.sendMessage(chatId, {
                        text: response
                    }, { quoted: msg });
                    
                } catch (error) {
                    await sock.sendMessage(chatId, {
                        text: `❌ *WHOIS Lookup Error*\n\nQuery: ${query}\nError: ${error.message}\n\nMake sure whois is installed on your system.\n\nInstall: sudo apt install whois (Linux)`
                    }, { quoted: msg });
                }
                break;
                
            case 'help':
                let helpText = `╭─⌈ 🌐 *HOSTIP HELP* ⌋\n│\n`;
                helpText += `├─⊷ *${PREFIX}hostip*\n│  └⊷ All network info\n`;
                helpText += `├─⊷ *${PREFIX}hostip local*\n│  └⊷ Local network\n`;
                helpText += `├─⊷ *${PREFIX}hostip public*\n│  └⊷ Public IP info\n`;
                helpText += `├─⊷ *${PREFIX}hostip test*\n│  └⊷ Connection test\n`;
                helpText += `├─⊷ *${PREFIX}hostip scan [host]*\n│  └⊷ Port scan\n`;
                helpText += `├─⊷ *${PREFIX}hostip dns [domain]*\n│  └⊷ DNS lookup\n`;
                helpText += `├─⊷ *${PREFIX}hostip whois [ip/domain]*\n│  └⊷ WHOIS lookup\n`;
                helpText += `├─⊷ *${PREFIX}hostip help*\n│  └⊷ Show help\n`;
                helpText += `╰───`;
                
                await sock.sendMessage(chatId, {
                    text: helpText
                }, { quoted: msg });
                break;
                
            default:
                await sock.sendMessage(chatId, {
                    text: `╭─⌈ ❌ *HOSTIP* ⌋\n│\n├─⊷ *${PREFIX}hostip help*\n│  └⊷ Show all commands\n╰───`
                }, { quoted: msg });
        }
    }
};