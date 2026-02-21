import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import os from "os";

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run(cmd, timeout = 60000) {
  return new Promise((resolve, reject) => {
    exec(cmd, { timeout, windowsHide: true }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || stdout || err.message));
      resolve(stdout.toString().trim());
    });
  });
}

export default {
  name: "restart",
  description: "Restart the bot with cleanup and dependency check",
  category: "owner",
  ownerOnly: true,

  async execute(sock, m, args) {
    const jid = m.key.remoteJid;
    const sender = m.key.participant || m.key.remoteJid;

    const isOwner = m.key.fromMe || sender.includes("947") || sender.includes("owner-number");
    if (!isOwner) {
      return sock.sendMessage(jid, {
        text: '❌ Only bot owner can use .restart command'
      }, { quoted: m });
    }

    let statusMessage;
    try {
      statusMessage = await sock.sendMessage(jid, {
        text: '🔄 **WolfBot Restart v1.1.5**\nStarting restart process...'
      }, { quoted: m });

      const editStatus = async (text) => {
        try {
          await sock.sendMessage(jid, {
            text,
            edit: statusMessage.key
          });
        } catch {
          const newMsg = await sock.sendMessage(jid, { text }, { quoted: m });
          statusMessage = newMsg;
        }
      };

      const softRestart = args.includes('soft') || args.includes('no-restart');
      const skipClean = args.includes('fast') || args.includes('quick');
      const installDeps = args.includes('deps') || args.includes('install');

      if (!skipClean) {
        await editStatus('🧹 **Cleaning all media & temp files...**\nSettings & configs will be preserved.');
        try {
          const dfOut = await run('df -BM --output=avail . 2>/dev/null || df -m . 2>/dev/null', 5000).catch(() => '');
          const freeMatch = dfOut.match(/(\d+)M?\s*$/m);
          const beforeMB = freeMatch ? parseInt(freeMatch[1]) : null;

          const cleanCmds = [
            'rm -rf tmp_update_fast tmp_preserve_fast /tmp/*.zip /tmp/*.tar.gz 2>/dev/null',
            'rm -rf ./data/viewonce_private/* 2>/dev/null',
            'rm -rf ./data/viewonce_messages/*.jpg ./data/viewonce_messages/*.jpeg ./data/viewonce_messages/*.png ./data/viewonce_messages/*.gif ./data/viewonce_messages/*.mp4 ./data/viewonce_messages/*.mp3 ./data/viewonce_messages/*.ogg ./data/viewonce_messages/*.webp ./data/viewonce_messages/*.opus ./data/viewonce_messages/*.pdf ./data/viewonce_messages/*.doc 2>/dev/null',
            'rm -rf ./data/antidelete/media/* 2>/dev/null',
            'rm -rf ./data/antidelete/status/media/* 2>/dev/null',
            'rm -rf ./data/antiviewonce/*.jpg ./data/antiviewonce/*.jpeg ./data/antiviewonce/*.png ./data/antiviewonce/*.gif ./data/antiviewonce/*.mp4 ./data/antiviewonce/*.mp3 ./data/antiviewonce/*.ogg ./data/antiviewonce/*.webp ./data/antiviewonce/*.opus 2>/dev/null',
            'find ./session -name "sender-key-*" -delete 2>/dev/null',
            'find ./session -name "pre-key-*" -delete 2>/dev/null',
            'find ./session -name "app-state-sync-version-*" -delete 2>/dev/null',
            'rm -rf session_backup 2>/dev/null',
            'find ./data -name "*.bak" -delete 2>/dev/null',
            'find . -maxdepth 2 -name "*.log" -not -path "./node_modules/*" -delete 2>/dev/null',
            'rm -rf ./temp/* 2>/dev/null',
            'rm -rf ./logs/* 2>/dev/null',
            'npm cache clean --force 2>/dev/null || true'
          ];
          for (const cmd of cleanCmds) {
            await run(cmd, 15000).catch(() => {});
          }
          const dfAfter = await run('df -BM --output=avail . 2>/dev/null || df -m . 2>/dev/null', 5000).catch(() => '');
          const afterMatch = dfAfter.match(/(\d+)M?\s*$/m);
          const afterMB = afterMatch ? parseInt(afterMatch[1]) : beforeMB;
          const recovered = (beforeMB !== null && afterMB !== null) ? (afterMB - beforeMB) : 0;
          await editStatus(`💾 **Media cleanup done!** ${afterMB !== null ? afterMB + 'MB free' : ''}${recovered > 0 ? ' (recovered ' + recovered + 'MB)' : ''}\n✅ Settings, prefix, configs preserved\nContinuing restart...`);
        } catch (diskErr) {
        }
      }

      if (installDeps) {
        await editStatus('📦 **Installing dependencies...**');
        try {
          await run('npm ci --no-audit --no-fund --silent', 180000);
          await editStatus('✅ **Dependencies installed**');
        } catch (npmError) {
          console.warn('npm ci failed, trying fallback:', npmError.message);
          try {
            await run('npm install --no-audit --no-fund --loglevel=error', 180000);
            await editStatus('⚠️ **Dependencies installed with warnings**');
          } catch {
            await editStatus('⚠️ **Could not install all dependencies**\nContinuing anyway...');
          }
        }
      }

      if (softRestart) {
        await editStatus('✅ **Cleanup Complete!**\nSoft restart - no process restart.\nBot continues running.');
        return;
      }

      await editStatus('✅ **Restart Complete!**\nRestarting bot in 3 seconds...');

      await new Promise(resolve => setTimeout(resolve, 3000));

      await sock.sendMessage(jid, {
        text: '🔄 **Restarting Now...**\nBot will be back in a moment!'
      }, { quoted: m });

      try {
        await run('pm2 restart all', 10000);
      } catch {
        console.log('PM2 restart failed, exiting process...');
        process.exit(0);
      }

    } catch (err) {
      console.error('Restart failed:', err);

      let errorText = `❌ **Restart Failed**\nError: ${err.message || err}\n\n`;

      if (err.message.includes('timeout')) {
        errorText += '**Reason:** Operation timed out\n';
        errorText += '**Solution:** Try again or use `.restart fast`\n';
      }

      errorText += '\n**Available Options:**\n';
      errorText += '`.restart` - Full cleanup + restart\n';
      errorText += '`.restart fast` - Skip cleanup, restart immediately\n';
      errorText += '`.restart soft` - Cleanup only, no restart\n';
      errorText += '`.restart deps` - Install dependencies + restart\n';

      try {
        if (statusMessage?.key) {
          await sock.sendMessage(jid, { text: errorText, edit: statusMessage.key });
        } else {
          await sock.sendMessage(jid, { text: errorText }, { quoted: m });
        }
      } catch {
      }
    }
  }
};
