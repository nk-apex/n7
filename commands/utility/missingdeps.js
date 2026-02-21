import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const NODE_BUILTINS = new Set([
    'assert', 'async_hooks', 'buffer', 'child_process', 'cluster', 'console',
    'constants', 'crypto', 'dgram', 'diagnostics_channel', 'dns', 'domain',
    'events', 'fs', 'fs/promises', 'http', 'http2', 'https', 'inspector',
    'module', 'net', 'os', 'path', 'perf_hooks', 'process', 'punycode',
    'querystring', 'readline', 'repl', 'stream', 'stream/promises',
    'string_decoder', 'sys', 'timers', 'timers/promises', 'tls', 'trace_events',
    'tty', 'url', 'util', 'v8', 'vm', 'wasi', 'worker_threads', 'zlib',
    'node:assert', 'node:buffer', 'node:child_process', 'node:cluster',
    'node:console', 'node:constants', 'node:crypto', 'node:dgram', 'node:dns',
    'node:domain', 'node:events', 'node:fs', 'node:fs/promises', 'node:http',
    'node:http2', 'node:https', 'node:inspector', 'node:module', 'node:net',
    'node:os', 'node:path', 'node:perf_hooks', 'node:process', 'node:punycode',
    'node:querystring', 'node:readline', 'node:repl', 'node:stream',
    'node:stream/promises', 'node:string_decoder', 'node:sys', 'node:timers',
    'node:tls', 'node:tty', 'node:url', 'node:util', 'node:v8', 'node:vm',
    'node:wasi', 'node:worker_threads', 'node:zlib'
]);

function getPackageName(importPath) {
    if (importPath.startsWith('@')) {
        const parts = importPath.split('/');
        return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : importPath;
    }
    return importPath.split('/')[0];
}

function scanFile(filePath) {
    const imports = new Set();
    try {
        const content = fs.readFileSync(filePath, 'utf8');

        const esmRegex = /(?:import\s+(?:[\w{}\s,*]+\s+from\s+)?|import\s*\()['"]([^'"]+)['"]/g;
        let match;
        while ((match = esmRegex.exec(content)) !== null) {
            imports.add(match[1]);
        }

        const cjsRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
        while ((match = cjsRegex.exec(content)) !== null) {
            imports.add(match[1]);
        }
    } catch {}
    return imports;
}

function getAllJsFiles(dir, files = []) {
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.cache') continue;
            if (entry.isDirectory()) {
                getAllJsFiles(fullPath, files);
            } else if (/\.(js|mjs|cjs)$/.test(entry.name)) {
                files.push(fullPath);
            }
        }
    } catch {}
    return files;
}

function isInstalled(pkgName) {
    try {
        const pkgPath = path.join(process.cwd(), 'node_modules', pkgName, 'package.json');
        return fs.existsSync(pkgPath);
    } catch {
        return false;
    }
}

function getInstalledVersion(pkgName) {
    try {
        const pkgPath = path.join(process.cwd(), 'node_modules', pkgName, 'package.json');
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        return pkg.version || 'unknown';
    } catch {
        return null;
    }
}

export default {
    name: 'missingdeps',
    alias: ['checkdeps', 'deps', 'dependencies', 'missingpackages'],
    description: 'Scan codebase for missing npm dependencies',
    category: 'utility',
    ownerOnly: true,
    usage: 'missingdeps',

    async execute(sock, msg, args, PREFIX, extra) {
        const chatId = msg.key.remoteJid;

        if (!extra?.jidManager?.isOwner(msg)) {
            return await sock.sendMessage(chatId, {
                text: '❌ *Owner Only Command*\nOnly the bot owner can check dependencies.'
            }, { quoted: msg });
        }

        const subcommand = args[0]?.toLowerCase();

        if (subcommand === 'help') {
            return await sock.sendMessage(chatId, {
                text: `╭─⌈ 🔍 *DEPENDENCY CHECKER* ⌋\n│\n├─⊷ *${PREFIX}missingdeps*\n│  └⊷ Scan for missing packages\n├─⊷ *${PREFIX}missingdeps fix*\n│  └⊷ Auto-install missing packages\n├─⊷ *${PREFIX}missingdeps full*\n│  └⊷ Full report with all details\n│\n├─⊷ *Aliases:* checkdeps, deps\n╰───────────────\n> *WOLFBOT*`
            }, { quoted: msg });
        }

        await sock.sendMessage(chatId, { react: { text: '🔍', key: msg.key } });
        await sock.sendMessage(chatId, { text: '🔍 Scanning codebase for dependencies...' }, { quoted: msg });

        try {
            const projectDir = process.cwd();
            const allFiles = getAllJsFiles(projectDir);

            let pkgJson = {};
            try {
                pkgJson = JSON.parse(fs.readFileSync(path.join(projectDir, 'package.json'), 'utf8'));
            } catch {}

            const declaredDeps = new Set([
                ...Object.keys(pkgJson.dependencies || {}),
                ...Object.keys(pkgJson.devDependencies || {})
            ]);

            const allImports = new Map();

            for (const file of allFiles) {
                const imports = scanFile(file);
                const relPath = path.relative(projectDir, file);

                for (const imp of imports) {
                    if (imp.startsWith('.') || imp.startsWith('/') || imp.startsWith('#')) continue;
                    if (NODE_BUILTINS.has(imp)) continue;
                    if (imp.startsWith('node:')) continue;

                    const pkgName = getPackageName(imp);
                    if (NODE_BUILTINS.has(pkgName)) continue;

                    if (!allImports.has(pkgName)) {
                        allImports.set(pkgName, []);
                    }
                    if (!allImports.get(pkgName).includes(relPath)) {
                        allImports.get(pkgName).push(relPath);
                    }
                }
            }

            const missing = [];
            const inPkgNotInstalled = [];
            const installed = [];
            const notInPkgJson = [];

            for (const [pkg, files] of allImports) {
                const inPkg = declaredDeps.has(pkg);
                const inNodeModules = isInstalled(pkg);

                if (!inNodeModules && !inPkg) {
                    missing.push({ pkg, files, status: 'missing' });
                } else if (!inNodeModules && inPkg) {
                    inPkgNotInstalled.push({ pkg, files, status: 'not_installed' });
                } else if (inNodeModules && !inPkg) {
                    const ver = getInstalledVersion(pkg);
                    notInPkgJson.push({ pkg, files, version: ver, status: 'unlisted' });
                } else {
                    const ver = getInstalledVersion(pkg);
                    installed.push({ pkg, files, version: ver });
                }
            }

            const unusedDeclared = [];
            for (const dep of declaredDeps) {
                if (!allImports.has(dep)) {
                    const inNodeModules = isInstalled(dep);
                    unusedDeclared.push({ pkg: dep, installed: inNodeModules });
                }
            }

            if (subcommand === 'fix' && missing.length > 0) {
                const toInstall = missing.map(m => m.pkg).join(' ');
                await sock.sendMessage(chatId, {
                    text: `📦 Installing ${missing.length} missing package(s):\n${missing.map(m => `• ${m.pkg}`).join('\n')}`
                }, { quoted: msg });

                try {
                    const result = execSync(`npm install ${toInstall} 2>&1`, {
                        timeout: 120000,
                        cwd: projectDir,
                        maxBuffer: 1024 * 1024
                    }).toString().trim();

                    let output = result;
                    if (output.length > 2000) output = output.substring(0, 2000) + '\n... (truncated)';

                    await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } });
                    await sock.sendMessage(chatId, {
                        text: `✅ *Installation Complete*\n\n\`\`\`\n${output}\n\`\`\``
                    }, { quoted: msg });
                    return;
                } catch (installErr) {
                    let errMsg = installErr.stdout?.toString() || installErr.stderr?.toString() || installErr.message;
                    if (errMsg.length > 2000) errMsg = errMsg.substring(0, 2000) + '\n... (truncated)';

                    await sock.sendMessage(chatId, { react: { text: '❌', key: msg.key } });
                    await sock.sendMessage(chatId, {
                        text: `❌ *Installation Failed*\n\n\`\`\`\n${errMsg}\n\`\`\``
                    }, { quoted: msg });
                    return;
                }
            }

            if (subcommand === 'fix' && inPkgNotInstalled.length > 0 && missing.length === 0) {
                await sock.sendMessage(chatId, {
                    text: `📦 Running npm install to restore ${inPkgNotInstalled.length} declared package(s)...`
                }, { quoted: msg });

                try {
                    const result = execSync('npm install 2>&1', {
                        timeout: 120000,
                        cwd: projectDir,
                        maxBuffer: 1024 * 1024
                    }).toString().trim();

                    let output = result;
                    if (output.length > 2000) output = output.substring(0, 2000) + '\n... (truncated)';

                    await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } });
                    await sock.sendMessage(chatId, {
                        text: `✅ *Restore Complete*\n\n\`\`\`\n${output}\n\`\`\``
                    }, { quoted: msg });
                    return;
                } catch (installErr) {
                    await sock.sendMessage(chatId, { react: { text: '❌', key: msg.key } });
                    return;
                }
            }

            let report = `╭─⌈ 📦 *DEPENDENCY REPORT* ⌋\n│\n`;
            report += `│ 📂 Files scanned: *${allFiles.length}*\n`;
            report += `│ 📦 Packages imported: *${allImports.size}*\n`;
            report += `│ 📋 In package.json: *${declaredDeps.size}*\n│\n`;

            if (missing.length > 0) {
                report += `├─⌈ ❌ *MISSING* (${missing.length}) ⌋\n`;
                report += `│  _Not in package.json & not installed_\n`;
                for (const m of missing) {
                    const fileList = m.files.length <= 3
                        ? m.files.map(f => f.replace(/^commands\//, '').replace(/^lib\//, '')).join(', ')
                        : m.files.slice(0, 2).map(f => f.replace(/^commands\//, '').replace(/^lib\//, '')).join(', ') + ` +${m.files.length - 2} more`;
                    report += `│  • \`${m.pkg}\`\n│    └ ${fileList}\n`;
                }
                report += `│\n`;
            }

            if (inPkgNotInstalled.length > 0) {
                report += `├─⌈ ⚠️ *NOT INSTALLED* (${inPkgNotInstalled.length}) ⌋\n`;
                report += `│  _In package.json but not in node_modules_\n`;
                for (const m of inPkgNotInstalled) {
                    report += `│  • \`${m.pkg}\`\n`;
                }
                report += `│  _Fix: run \`${PREFIX}npm install\`_\n`;
                report += `│\n`;
            }

            if (subcommand === 'full') {
                if (notInPkgJson.length > 0) {
                    report += `├─⌈ 🔶 *UNLISTED* (${notInPkgJson.length}) ⌋\n`;
                    report += `│  _Installed but not in package.json_\n`;
                    for (const m of notInPkgJson) {
                        report += `│  • \`${m.pkg}\` v${m.version || '?'}\n`;
                    }
                    report += `│\n`;
                }

                if (unusedDeclared.length > 0) {
                    report += `├─⌈ 🔹 *UNUSED* (${unusedDeclared.length}) ⌋\n`;
                    report += `│  _In package.json but not imported_\n`;
                    for (const m of unusedDeclared.slice(0, 15)) {
                        report += `│  • \`${m.pkg}\` ${m.installed ? '✅' : '❌'}\n`;
                    }
                    if (unusedDeclared.length > 15) {
                        report += `│  ... +${unusedDeclared.length - 15} more\n`;
                    }
                    report += `│\n`;
                }

                report += `├─⌈ ✅ *INSTALLED* (${installed.length}) ⌋\n`;
                report += `│  _Working correctly_\n`;
                for (const m of installed) {
                    report += `│  • \`${m.pkg}\` v${m.version || '?'}\n`;
                }
                report += `│\n`;
            }

            if (missing.length === 0 && inPkgNotInstalled.length === 0) {
                report += `├─ ✅ *All dependencies are installed!*\n│\n`;
            } else {
                const totalIssues = missing.length + inPkgNotInstalled.length;
                report += `├─ 🔧 *${totalIssues} issue(s) found*\n`;
                if (missing.length > 0) {
                    report += `│  Fix: \`${PREFIX}missingdeps fix\`\n`;
                }
                report += `│\n`;
            }

            report += `╰───────────────\n> *WOLFBOT*`;

            await sock.sendMessage(chatId, { react: { text: missing.length > 0 || inPkgNotInstalled.length > 0 ? '⚠️' : '✅', key: msg.key } });
            await sock.sendMessage(chatId, { text: report }, { quoted: msg });

        } catch (err) {
            console.error('[MISSINGDEPS] Error:', err);
            await sock.sendMessage(chatId, { react: { text: '❌', key: msg.key } });
            await sock.sendMessage(chatId, {
                text: `❌ *Scan Error:* ${err.message}`
            }, { quoted: msg });
        }
    }
};
