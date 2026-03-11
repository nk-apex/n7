import { exec } from 'child_process';
import { getBotName } from '../../lib/botname.js';
import { getOwnerName } from '../../lib/menuHelper.js';

const TIMEOUT_MS = 120000;
const MAX_OUTPUT = 3000;

export default {
    name: 'npm',
    alias: ['npmi', 'install', 'npminstall', 'dependency'],
    description: 'Install or manage npm packages',
    category: 'utility',
    ownerOnly: true,
    usage: 'npm install <package> | npm uninstall <package> | npm list | npm update',

    async execute(sock, msg, args, PREFIX, extra) {
        const chatId = msg.key.remoteJid;

        if (!extra?.jidManager?.isOwner(msg)) {
            return await sock.sendMessage(chatId, {
                text: '❌ *Owner Only Command*\nOnly the bot owner can manage dependencies.'
            }, { quoted: msg });
        }

        if (!args.length) {
            return await sock.sendMessage(chatId, {
                text: `╭─⌈ 📦 *NPM PACKAGE MANAGER* ⌋\n│\n├─⊷ *${PREFIX}npm install*\n│  └⊷ Install all dependencies\n├─⊷ *${PREFIX}npm install <pkg>*\n│  └⊷ Install a specific package\n├─⊷ *${PREFIX}npm install <p1> <p2>*\n│  └⊷ Install multiple packages\n├─⊷ *${PREFIX}npm uninstall <pkg>*\n│  └⊷ Remove a package\n├─⊷ *${PREFIX}npm update*\n│  └⊷ Update all packages\n├─⊷ *${PREFIX}npm update <pkg>*\n│  └⊷ Update a specific package\n├─⊷ *${PREFIX}npm list*\n│  └⊷ Show installed packages\n├─⊷ *${PREFIX}npm outdated*\n│  └⊷ Check for outdated packages\n│\n├─⊷ *Examples:*\n│  └⊷ ${PREFIX}npm install dotenv\n│  └⊷ ${PREFIX}npm install mumaker axios\n│  └⊷ ${PREFIX}npm uninstall chalk\n│  └⊷ ${PREFIX}npm list\n│\n╰───────────────\n> *${getOwnerName().toUpperCase()} TECH*`
            }, { quoted: msg });
        }

        const subcommand = args[0].toLowerCase();
        const packages = args.slice(1);

        const ALLOWED_COMMANDS = ['install', 'i', 'uninstall', 'remove', 'un', 'update', 'up', 'list', 'ls', 'outdated'];

        if (!ALLOWED_COMMANDS.includes(subcommand)) {
            return await sock.sendMessage(chatId, {
                text: `❌ *Unknown subcommand:* \`${subcommand}\`\n\nAllowed: install, uninstall, update, list, outdated\n\nUse \`${PREFIX}npm\` for help.`
            }, { quoted: msg });
        }

        const BLOCKED_PACKAGES = ['node-pty', 'electron', 'puppeteer-core'];

        if (['install', 'i'].includes(subcommand) && packages.length > 0) {
            for (const pkg of packages) {
                const cleanPkg = pkg.split('@')[0].toLowerCase();
                if (BLOCKED_PACKAGES.includes(cleanPkg)) {
                    return await sock.sendMessage(chatId, {
                        text: `❌ *Blocked Package:* \`${pkg}\`\nThis package is not allowed for security reasons.`
                    }, { quoted: msg });
                }
                if (pkg.includes('..') || pkg.includes('/') && !pkg.startsWith('@')) {
                    return await sock.sendMessage(chatId, {
                        text: `❌ *Invalid package name:* \`${pkg}\``
                    }, { quoted: msg });
                }
            }
        }

        let npmCmd;
        let actionMsg;

        switch (subcommand) {
            case 'install':
            case 'i': {
                if (packages.length === 0) {
                    npmCmd = 'npm install';
                    actionMsg = '📦 Installing all dependencies...';
                } else {
                    const pkgList = packages.join(' ');
                    npmCmd = `npm install ${pkgList}`;
                    actionMsg = `📦 Installing: *${pkgList}*`;
                }
                break;
            }

            case 'uninstall':
            case 'remove':
            case 'un': {
                if (packages.length === 0) {
                    return await sock.sendMessage(chatId, {
                        text: `❌ Specify package(s) to uninstall.\nExample: \`${PREFIX}npm uninstall chalk\``
                    }, { quoted: msg });
                }
                const pkgList = packages.join(' ');
                npmCmd = `npm uninstall ${pkgList}`;
                actionMsg = `🗑️ Uninstalling: *${pkgList}*`;
                break;
            }

            case 'update':
            case 'up': {
                if (packages.length === 0) {
                    npmCmd = 'npm update';
                    actionMsg = '🔄 Updating all packages...';
                } else {
                    const pkgList = packages.join(' ');
                    npmCmd = `npm update ${pkgList}`;
                    actionMsg = `🔄 Updating: *${pkgList}*`;
                }
                break;
            }

            case 'list':
            case 'ls': {
                npmCmd = 'npm list --depth=0 2>&1';
                actionMsg = '📋 Fetching installed packages...';
                break;
            }

            case 'outdated': {
                npmCmd = 'npm outdated 2>&1 || true';
                actionMsg = '🔍 Checking for outdated packages...';
                break;
            }
        }

        await sock.sendMessage(chatId, { react: { text: '⏳', key: msg.key } });
        await sock.sendMessage(chatId, { text: actionMsg }, { quoted: msg });

        const startTime = Date.now();

        try {
            const result = await new Promise((resolve, reject) => {
                exec(npmCmd, {
                    timeout: TIMEOUT_MS,
                    cwd: process.cwd(),
                    env: { ...process.env, NODE_ENV: 'development' },
                    maxBuffer: 1024 * 1024
                }, (error, stdout, stderr) => {
                    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

                    if (error && !['list', 'ls', 'outdated'].includes(subcommand)) {
                        const errOutput = (stderr || error.message || 'Unknown error').trim();
                        reject({ output: errOutput, elapsed });
                        return;
                    }

                    const output = (stdout || stderr || 'No output').trim();
                    resolve({ output, elapsed });
                });
            });

            let output = result.output;
            if (output.length > MAX_OUTPUT) {
                output = output.substring(0, MAX_OUTPUT) + '\n\n... (truncated)';
            }

            await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } });
            await sock.sendMessage(chatId, {
                text: `✅ *NPM Command Completed*\n⏱️ Time: ${result.elapsed}s\n\n\`\`\`\n${output}\n\`\`\``
            }, { quoted: msg });

        } catch (err) {
            let errOutput = err.output || err.message || 'Unknown error';
            if (errOutput.length > MAX_OUTPUT) {
                errOutput = errOutput.substring(0, MAX_OUTPUT) + '\n\n... (truncated)';
            }

            await sock.sendMessage(chatId, { react: { text: '❌', key: msg.key } });
            await sock.sendMessage(chatId, {
                text: `❌ *NPM Command Failed*\n⏱️ Time: ${err.elapsed || '?'}s\n\n\`\`\`\n${errOutput}\n\`\`\``
            }, { quoted: msg });
        }
    }
};
