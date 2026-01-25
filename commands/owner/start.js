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

/* -------------------- Configuration -------------------- */
const BOT_MAIN_FILE = "index.js"; // Your main bot file
const PM2_APP_NAME = "wolfbot"; // PM2 app name
const GIT_REPO_URL = "https://github.com/7-s-w/k.git";

/* -------------------- Helper Functions -------------------- */
async function run(cmd, timeout = 60000) {
  return new Promise((resolve, reject) => {
    exec(cmd, { timeout, windowsHide: true }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || stdout || err.message));
      resolve(stdout.toString().trim());
    });
  });
}

async function checkGitInstalled() {
  try {
    await run('git --version');
    return true;
  } catch {
    return false;
  }
}

async function checkNodeInstalled() {
  try {
    await run('node --version');
    return true;
  } catch {
    return false;
  }
}

async function checkPm2Installed() {
  try {
    await run('pm2 --version');
    return true;
  } catch {
    return false;
  }
}

async function installDependencies() {
  console.log('📦 Installing dependencies...');
  
  // Check for package.json
  if (!fs.existsSync('package.json')) {
    throw new Error('package.json not found!');
  }
  
  // Try npm ci first (faster and more reliable)
  try {
    await run('npm ci --no-audit --no-fund --silent', 180000);
    console.log('✅ Dependencies installed using npm ci');
    return true;
  } catch (error) {
    console.log('⚠️ npm ci failed, trying npm install...');
    
    try {
      await run('npm install --no-audit --no-fund --loglevel=error', 180000);
      console.log('✅ Dependencies installed using npm install');
      return true;
    } catch (installError) {
      console.error('❌ Dependency installation failed:', installError.message);
      return false;
    }
  }
}

async function cloneRepository() {
  console.log('🌐 Cloning repository...');
  
  try {
    await run(`git clone ${GIT_REPO_URL} .`, 300000);
    console.log('✅ Repository cloned successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to clone repository:', error.message);
    return false;
  }
}

async function updateFromGit() {
  console.log('🔄 Updating from Git...');
  
  try {
    // Check if we're in a git repository
    if (!fs.existsSync('.git')) {
      console.log('Not a git repository, skipping update');
      return false;
    }
    
    // Check current status
    const status = await run('git status --porcelain');
    if (status) {
      console.log('⚠️ Working directory not clean, stashing changes...');
      await run('git stash');
    }
    
    // Fetch updates
    await run('git fetch origin');
    
    // Reset to latest
    await run('git reset --hard origin/main');
    
    console.log('✅ Updated to latest version');
    return true;
  } catch (error) {
    console.error('❌ Git update failed:', error.message);
    return false;
  }
}

async function checkAndSetupBot() {
  console.log('🔍 Checking bot setup...');
  
  // Check if we're in an existing bot directory
  const hasPackageJson = fs.existsSync('package.json');
  const hasMainFile = fs.existsSync(BOT_MAIN_FILE);
  
  if (!hasPackageJson && !hasMainFile) {
    console.log('📁 No existing bot found. Starting fresh setup...');
    
    // Check if directory is empty
    const files = await fsPromises.readdir('.');
    if (files.length > 0) {
      console.log('⚠️ Current directory is not empty. Please use an empty directory for fresh setup.');
      return false;
    }
    
    // Clone repository
    const cloned = await cloneRepository();
    if (!cloned) return false;
    
  } else if (hasPackageJson) {
    console.log('📁 Existing bot found. Checking for updates...');
    await updateFromGit();
  }
  
  // Install dependencies
  const depsInstalled = await installDependencies();
  if (!depsInstalled) {
    console.log('⚠️ Dependency installation had issues, but continuing...');
  }
  
  // Check for essential files
  const requiredFiles = ['settings.js', 'config.json', '.env'];
  const missingFiles = [];
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      missingFiles.push(file);
    }
  }
  
  if (missingFiles.length > 0) {
    console.log(`⚠️ Missing required files: ${missingFiles.join(', ')}`);
    console.log('Please configure these files before starting the bot.');
    return false;
  }
  
  return true;
}

async function startWithPm2() {
  console.log('🚀 Starting bot with PM2...');
  
  try {
    // Check if PM2 is installed globally, if not install it
    const pm2Installed = await checkPm2Installed();
    if (!pm2Installed) {
      console.log('📦 Installing PM2 globally...');
      await run('npm install -g pm2', 120000);
    }
    
    // Check if bot is already running with PM2
    try {
      const pm2List = await run('pm2 jlist', 10000);
      const processes = JSON.parse(pm2List);
      const existingProcess = processes.find(p => p.name === PM2_APP_NAME);
      
      if (existingProcess) {
        console.log(`🔄 Restarting existing PM2 process: ${PM2_APP_NAME}`);
        await run(`pm2 restart ${PM2_APP_NAME}`, 30000);
      } else {
        console.log(`🚀 Starting new PM2 process: ${PM2_APP_NAME}`);
        await run(`pm2 start ${BOT_MAIN_FILE} --name ${PM2_APP_NAME}`, 30000);
      }
    } catch (pm2Error) {
      // PM2 not running, start fresh
      console.log(`🚀 Starting PM2 and bot: ${PM2_APP_NAME}`);
      await run(`pm2 start ${BOT_MAIN_FILE} --name ${PM2_APP_NAME}`, 30000);
    }
    
    // Save PM2 process list
    await run('pm2 save', 10000);
    
    // Set PM2 to start on system boot
    try {
      const startupOutput = await run('pm2 startup', 10000);
      if (startupOutput.includes('sudo')) {
        console.log('\n⚠️  Run the following command to enable startup on boot:');
        console.log(startupOutput.match(/sudo.*/)?.[0] || 'Check PM2 startup output');
      }
    } catch {
      console.log('ℹ️  Skipping startup configuration...');
    }
    
    // Show status
    console.log('\n📊 Bot Status:');
    await run('pm2 status', 10000);
    
    console.log('\n📋 Useful PM2 Commands:');
    console.log(`pm2 logs ${PM2_APP_NAME}          # View bot logs`);
    console.log(`pm2 stop ${PM2_APP_NAME}         # Stop bot`);
    console.log(`pm2 restart ${PM2_APP_NAME}      # Restart bot`);
    console.log('pm2 monit                       # Monitor all processes');
    console.log('pm2 save                        # Save current process list');
    
    return true;
    
  } catch (error) {
    console.error('❌ Failed to start with PM2:', error.message);
    return false;
  }
}

async function startDirectly() {
  console.log('🚀 Starting bot directly...');
  
  try {
    // Start the bot
    const botProcess = exec(`node ${BOT_MAIN_FILE}`, {
      stdio: 'inherit'
    });
    
    // Handle process events
    botProcess.on('error', (error) => {
      console.error('❌ Failed to start bot:', error);
    });
    
    botProcess.on('exit', (code, signal) => {
      if (code !== 0) {
        console.log(`⚠️ Bot exited with code ${code}`);
      }
      if (signal) {
        console.log(`⚠️ Bot terminated by signal ${signal}`);
      }
    });
    
    // Handle termination signals
    process.on('SIGINT', () => {
      console.log('\n🛑 Received SIGINT, stopping bot...');
      botProcess.kill('SIGINT');
    });
    
    process.on('SIGTERM', () => {
      console.log('\n🛑 Received SIGTERM, stopping bot...');
      botProcess.kill('SIGTERM');
    });
    
    return true;
    
  } catch (error) {
    console.error('❌ Failed to start bot directly:', error.message);
    return false;
  }
}

/* -------------------- Main Command -------------------- */
export default {
  name: "start",
  description: "Start the bot with latest updates",
  category: "owner",
  ownerOnly: true,

  async execute(sock, m, args) {
    const jid = m.key.remoteJid;
    const sender = m.key.participant || m.key.remoteJid;
    
    // Check if owner
    const isOwner = m.key.fromMe || sender.includes("947") || sender.includes("owner-number");
    if (!isOwner) {
      return sock.sendMessage(jid, {
        text: '❌ Only bot owner can use .start command'
      }, { quoted: m });
    }
    
    let statusMessage;
    
    try {
      // Parse arguments
      const usePm2 = !args.includes('direct');
      const skipUpdate = args.includes('no-update');
      const forceFresh = args.includes('fresh');
      
      // Send initial message
      statusMessage = await sock.sendMessage(jid, {
        text: '🚀 **WolfBot Start Command**\nStarting bot with latest updates...\nThis may take a few minutes.'
      }, { quoted: m });
      
      const editStatus = async (text) => {
        try {
          await sock.sendMessage(jid, {
            text,
            edit: statusMessage.key
          });
        } catch {
          // If editing fails, send new message
          const newMsg = await sock.sendMessage(jid, { text }, { quoted: m });
          statusMessage = newMsg;
        }
      };
      
      await editStatus('🚀 **Checking prerequisites...**');
      
      // Check Node.js
      const hasNode = await checkNodeInstalled();
      if (!hasNode) {
        await editStatus('❌ **Node.js is not installed!**\nPlease install Node.js 16+ first.\nhttps://nodejs.org');
        return;
      }
      
      // Check Git (for updates)
      if (!skipUpdate) {
        const hasGit = await checkGitInstalled();
        if (!hasGit) {
          await editStatus('⚠️ **Git is not installed**\nUpdates will be skipped.\nInstall Git for automatic updates.');
        }
      }
      
      // Setup and update bot
      if (!skipUpdate) {
        await editStatus('🔄 **Setting up/updating bot...**');
        
        try {
          const setupOk = await checkAndSetupBot();
          if (!setupOk && !forceFresh) {
            await editStatus('⚠️ **Setup encountered issues**\nContinuing anyway...');
          }
        } catch (setupError) {
          console.error('Setup error:', setupError);
          await editStatus(`⚠️ **Setup error:** ${setupError.message}\nContinuing with existing setup...`);
        }
      } else {
        await editStatus('⏭️ **Skipping updates as requested**');
      }
      
      // Start bot
      if (usePm2) {
        await editStatus('🚀 **Starting with PM2 (recommended)...**');
        const started = await startWithPm2();
        
        if (started) {
          await editStatus(`✅ **Bot Started Successfully with PM2!**\n\n**App Name:** ${PM2_APP_NAME}\n**Main File:** ${BOT_MAIN_FILE}\n\n**Useful Commands:**\n\`pm2 logs ${PM2_APP_NAME}\` - View logs\n\`pm2 status\` - Check status\n\`pm2 restart ${PM2_APP_NAME}\` - Restart\n\nBot should be online now! 🎉`);
        } else {
          await editStatus('❌ **PM2 start failed**\nFalling back to direct start...');
          
          // Fallback to direct start
          await editStatus('🚀 **Starting bot directly...**');
          const directStarted = await startDirectly();
          
          if (directStarted) {
            await editStatus('✅ **Bot Started Directly!**\nBot is now running in the current terminal.\n\n⚠️ **Note:** Bot will stop if terminal is closed.\nUse `.start` without "direct" for PM2 (recommended).');
          } else {
            await editStatus('❌ **Failed to start bot!**\nPlease check:\n1. Node.js is installed\n2. Dependencies are installed\n3. Configuration files exist\n\n**Manual Start:**\n\`node index.js\`');
          }
        }
      } else {
        await editStatus('🚀 **Starting bot directly...**');
        const started = await startDirectly();
        
        if (started) {
          await editStatus('✅ **Bot Started Directly!**\nBot is now running in the current terminal.\n\n⚠️ **Note:** Bot will stop if terminal is closed.\nUse `.start` without "direct" for PM2 (recommended).');
        } else {
          await editStatus('❌ **Failed to start bot directly!**');
        }
      }
      
    } catch (error) {
      console.error('Start command failed:', error);
      
      let errorText = `❌ **Start Command Failed**\nError: ${error.message || error}\n\n`;
      
      if (error.message.includes('timeout')) {
        errorText += '**Reason:** Operation timed out\n';
        errorText += '**Solution:** Try again or check internet connection\n';
      } else if (error.message.includes('git')) {
        errorText += '**Reason:** Git operation failed\n';
        errorText += '**Solution:** Try `.start no-update` to skip updates\n';
      } else if (error.message.includes('npm')) {
        errorText += '**Reason:** NPM installation failed\n';
        errorText += '**Solution:** Check internet or try manually:\n`npm install`\n';
      }
      
      errorText += '\n**Manual Start Steps:**\n';
      errorText += '1. `git pull` (update)\n';
      errorText += '2. `npm install` (deps)\n';
      errorText += '3. `node index.js` (start)\n';
      errorText += '\n**Or use PM2:**\n';
      errorText += '`pm2 start index.js --name wolfbot`\n';
      errorText += '`pm2 save`\n';
      errorText += '`pm2 startup`\n';
      
      try {
        if (statusMessage?.key) {
          await sock.sendMessage(jid, { text: errorText, edit: statusMessage.key });
        } else {
          await sock.sendMessage(jid, { text: errorText }, { quoted: m });
        }
      } catch {
        // Ignore if can't send error
      }
    }
  }
};

/* -------------------- Export Additional Commands -------------------- */
export const stopCommand = {
  name: "stop",
  description: "Stop the bot",
  category: "owner",
  ownerOnly: true,

  async execute(sock, m, args) {
    const jid = m.key.remoteJid;
    const sender = m.key.participant || m.key.remoteJid;
    
    // Check if owner
    const isOwner = m.key.fromMe || sender.includes("947") || sender.includes("owner-number");
    if (!isOwner) {
      return sock.sendMessage(jid, {
        text: '❌ Only bot owner can use .stop command'
      }, { quoted: m });
    }
    
    try {
      await sock.sendMessage(jid, {
        text: '🛑 **Stopping bot...**'
      }, { quoted: m });
      
      // Try PM2 stop first
      try {
        await run(`pm2 stop ${PM2_APP_NAME}`, 10000);
        await sock.sendMessage(jid, {
          text: `✅ **Bot stopped via PM2**\nApp: ${PM2_APP_NAME}\n\nTo restart: \`.start\``
        }, { quoted: m });
      } catch (pm2Error) {
        // If PM2 fails, send restart instructions
        await sock.sendMessage(jid, {
          text: '⚠️ **Could not stop via PM2**\n\n**Manual stop required:**\n1. Press Ctrl+C in terminal\n2. Or: `pm2 stop all`\n3. Or: `killall node`\n\nThen use `.start` to restart.'
        }, { quoted: m });
      }
      
    } catch (error) {
      console.error('Stop command failed:', error);
      await sock.sendMessage(jid, {
        text: `❌ **Stop failed:** ${error.message}`
      }, { quoted: m });
    }
  }
};

export const restartCommand = {
  name: "restart",
  description: "Restart the bot",
  category: "owner",
  ownerOnly: true,

  async execute(sock, m, args) {
    const jid = m.key.remoteJid;
    const sender = m.key.participant || m.key.remoteJid;
    
    // Check if owner
    const isOwner = m.key.fromMe || sender.includes("947") || sender.includes("owner-number");
    if (!isOwner) {
      return sock.sendMessage(jid, {
        text: '❌ Only bot owner can use .restart command'
      }, { quoted: m });
    }
    
    try {
      const statusMsg = await sock.sendMessage(jid, {
        text: '🔄 **Restarting bot...**'
      }, { quoted: m });
      
      // Try PM2 restart first
      try {
        await run(`pm2 restart ${PM2_APP_NAME}`, 15000);
        await sock.sendMessage(jid, {
          text: `✅ **Bot restarted successfully!**\nApp: ${PM2_APP_NAME}\n\nBot should be back online shortly. 🎉`,
          edit: statusMsg.key
        });
      } catch (pm2Error) {
        // If PM2 fails, try direct restart
        await sock.sendMessage(jid, {
          text: '⚠️ **PM2 restart failed, trying alternative...**',
          edit: statusMsg.key
        });
        
        // Use the start command's logic
        const started = await startWithPm2();
        
        if (started) {
          await sock.sendMessage(jid, {
            text: `✅ **Bot restarted!**\nApp: ${PM2_APP_NAME}\n\nBot is now running. 🎉`,
            edit: statusMsg.key
          });
        } else {
          await sock.sendMessage(jid, {
            text: '❌ **Restart failed!**\nPlease try `.start` command instead.',
            edit: statusMsg.key
          });
        }
      }
      
    } catch (error) {
      console.error('Restart command failed:', error);
      await sock.sendMessage(jid, {
        text: `❌ **Restart failed:** ${error.message}\nTry \`.start\` instead.`
      }, { quoted: m });
    }
  }
};

export const statusCommand = {
  name: "status",
  description: "Check bot status",
  category: "owner",
  ownerOnly: true,

  async execute(sock, m, args) {
    const jid = m.key.remoteJid;
    const sender = m.key.participant || m.key.remoteJid;
    
    // Check if owner
    const isOwner = m.key.fromMe || sender.includes("947") || sender.includes("owner-number");
    if (!isOwner) {
      return sock.sendMessage(jid, {
        text: '❌ Only bot owner can use .status command'
      }, { quoted: m });
    }
    
    try {
      let statusText = '📊 **Bot Status Report**\n\n';
      
      // System info
      statusText += `**System:** ${os.platform()} ${os.release()}\n`;
      statusText += `**Uptime:** ${formatUptime(process.uptime())}\n`;
      statusText += `**Memory:** ${formatBytes(os.freemem())} free / ${formatBytes(os.totalmem())} total\n`;
      statusText += `**Node:** ${process.version}\n\n`;
      
      // Check PM2 status
      try {
        const pm2List = await run('pm2 jlist', 5000);
        const processes = JSON.parse(pm2List);
        const botProcess = processes.find(p => p.name === PM2_APP_NAME);
        
        if (botProcess) {
          statusText += `**PM2 App:** ${PM2_APP_NAME}\n`;
          statusText += `**Status:** ${botProcess.pm2_env.status}\n`;
          statusText += `**Restarts:** ${botProcess.pm2_env.restart_time}\n`;
          statusText += `**Uptime:** ${formatUptime(botProcess.pm2_env.pm_uptime / 1000)}\n`;
          statusText += `**CPU:** ${botProcess.monit.cpu}%\n`;
          statusText += `**Memory:** ${formatBytes(botProcess.monit.memory)}\n`;
        } else {
          statusText += `**PM2:** App "${PM2_APP_NAME}" not found\n`;
        }
      } catch {
        statusText += `**PM2:** Not running or not installed\n`;
      }
      
      // Bot files status
      statusText += '\n**Files:**\n';
      const importantFiles = [
        { name: 'package.json', path: 'package.json' },
        { name: 'Main bot file', path: BOT_MAIN_FILE },
        { name: 'Settings', path: 'settings.js' },
        { name: 'Config', path: 'config.json' },
        { name: 'Environment', path: '.env' }
      ];
      
      for (const file of importantFiles) {
        try {
          if (fs.existsSync(file.path)) {
            const stats = await fsPromises.stat(file.path);
            statusText += `✅ ${file.name}: ${formatBytes(stats.size)}, ${new Date(stats.mtime).toLocaleDateString()}\n`;
          } else {
            statusText += `❌ ${file.name}: Missing\n`;
          }
        } catch {
          statusText += `⚠️ ${file.name}: Error checking\n`;
        }
      }
      
      // Update status if requested
      if (args.includes('update') || args.includes('check')) {
        statusText += '\n**Update Check:**\n';
        try {
          if (fs.existsSync('.git')) {
            const currentBranch = await run('git rev-parse --abbrev-ref HEAD').catch(() => 'unknown');
            const currentCommit = await run('git rev-parse --short HEAD').catch(() => 'unknown');
            
            await run('git fetch origin', 10000);
            const upstreamCommit = await run('git rev-parse --short origin/main').catch(() => 'unknown');
            
            statusText += `**Branch:** ${currentBranch}\n`;
            statusText += `**Current:** ${currentCommit}\n`;
            statusText += `**Latest:** ${upstreamCommit}\n`;
            
            if (currentCommit !== upstreamCommit && upstreamCommit !== 'unknown') {
              statusText += '🔄 **Update available!** Use `.update`\n';
            } else {
             
