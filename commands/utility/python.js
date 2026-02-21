import { exec } from 'child_process';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { randomBytes } from 'crypto';

const TIMEOUT_MS = 15000;
const MAX_OUTPUT = 3000;

function findPython() {
    const candidates = ['python3', 'python'];
    for (const cmd of candidates) {
        try {
            const { execSync } = require ? require('child_process') : { execSync: null };
            if (execSync) {
                execSync(`${cmd} --version`, { timeout: 3000, stdio: 'pipe' });
                return cmd;
            }
        } catch {}
    }
    return null;
}

let pythonCmd = null;

export default {
    name: 'python',
    alias: ['py', 'python3', 'runpy'],
    description: 'Execute Python code',
    category: 'utility',
    ownerOnly: true,
    usage: 'python <code>',

    async execute(sock, msg, args, PREFIX, extra) {
        const chatId = msg.key.remoteJid;
        const isOwner = extra?.isOwner?.() || false;

        if (!isOwner) {
            return await sock.sendMessage(chatId, {
                text: '❌ This command is owner-only.'
            }, { quoted: msg });
        }

        if (!args.length) {
            return await sock.sendMessage(chatId, {
                text: `╭─⌈ 🐍 *PYTHON EXECUTOR* ⌋\n│\n├─⊷ *${PREFIX}py <code>*\n│  └⊷ Run Python code\n│\n├─⊷ *Examples:*\n│  └⊷ ${PREFIX}py print("Hello World")\n│  └⊷ ${PREFIX}py import math; print(math.pi)\n│  └⊷ ${PREFIX}py [x**2 for x in range(10)]\n│\n├─⊷ *Features:*\n│  └⊷ 15s timeout\n│  └⊷ Owner-only (full access)\n│  └⊷ Auto-prints last expression\n│\n╰───────────────\n> *WOLFBOT*`
            }, { quoted: msg });
        }

        if (!pythonCmd) {
            pythonCmd = await new Promise((resolve) => {
                exec('python3 --version', { timeout: 3000 }, (err) => {
                    if (!err) return resolve('python3');
                    exec('python --version', { timeout: 3000 }, (err2) => {
                        resolve(err2 ? null : 'python');
                    });
                });
            });
        }

        if (!pythonCmd) {
            return await sock.sendMessage(chatId, {
                text: '❌ Python is not installed on this system.'
            }, { quoted: msg });
        }

        await sock.sendMessage(chatId, { react: { text: '⏳', key: msg.key } });

        const code = args.join(' ');
        const tmpFile = join('/tmp', `wolfbot_py_${randomBytes(4).toString('hex')}.py`);

        try {
            const wrappedCode = `import sys, time, json
_start = time.time()
_code = ${JSON.stringify(code)}
try:
    _compiled = compile(_code, '<wolfbot>', 'eval')
    _result = eval(_compiled)
    if _result is not None:
        if isinstance(_result, (dict, list, tuple, set)):
            print(json.dumps(_result, indent=2, default=str, ensure_ascii=False))
        else:
            print(_result)
except SyntaxError:
    try:
        exec(_code)
    except Exception as e:
        print(f"Error: {type(e).__name__}: {e}", file=sys.stderr)
except Exception as e:
    print(f"Error: {type(e).__name__}: {e}", file=sys.stderr)
_elapsed = round((time.time() - _start) * 1000)
print(f"\\n⏱️ {_elapsed}ms", file=sys.stdout)
`;
            writeFileSync(tmpFile, wrappedCode);

            const result = await new Promise((resolve) => {
                exec(`${pythonCmd} -u ${tmpFile}`, {
                    timeout: TIMEOUT_MS,
                    maxBuffer: 1024 * 1024,
                    env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1', PYTHONUNBUFFERED: '1' }
                }, (error, stdout, stderr) => {
                    if (error && error.killed) {
                        resolve({ output: '⏰ Execution timed out (15s limit)', error: true });
                    } else if (stderr && stderr.trim()) {
                        resolve({ output: (stdout || '') + stderr, error: true });
                    } else {
                        resolve({ output: stdout || '(no output)', error: false });
                    }
                });
            });

            let output = result.output.trim();
            if (output.length > MAX_OUTPUT) {
                output = output.slice(0, MAX_OUTPUT) + '\n... (truncated)';
            }

            const emoji = result.error ? '❌' : '✅';
            const header = result.error ? '❌ *ERROR*' : '✅ *OUTPUT*';

            await sock.sendMessage(chatId, {
                text: `╭─⌈ 🐍 *PYTHON* ⌋\n│\n├─ *Input:*\n│ \`\`\`${code.length > 200 ? code.slice(0, 200) + '...' : code}\`\`\`\n│\n├─ ${header}\n│ \`\`\`${output}\`\`\`\n│\n╰───────────────\n> *WOLFBOT*`
            }, { quoted: msg });

            await sock.sendMessage(chatId, { react: { text: emoji, key: msg.key } });

        } catch (err) {
            await sock.sendMessage(chatId, { react: { text: '❌', key: msg.key } });
            await sock.sendMessage(chatId, {
                text: `❌ Execution error: ${err.message}`
            }, { quoted: msg });
        } finally {
            try { if (existsSync(tmpFile)) unlinkSync(tmpFile); } catch {}
        }
    }
};
