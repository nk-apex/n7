// import { exec } from "child_process";
// import { promisify } from "util";
// import fs from "fs";
// import fsPromises from "fs/promises";
// import path from "path";
// import { fileURLToPath } from "url";
// import https from "https";
// import http from "http";
// import { createRequire } from 'module';
// import { createWriteStream } from "fs";

// const execAsync = promisify(exec);
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const require = createRequire(import.meta.url);

// /* -------------------- Configuration -------------------- */
// const UPDATE_ZIP_URL = "https://github.com/nk-apex/n7/archive/refs/heads/main.zip";
// const GIT_REPO_URL = "https://github.com/nk-apex/n7.git";
// const OWNER_REPO_URL = "https://github.com/7silent-wolf/silentwolf.git";

// // Timeout configurations
// const DOWNLOAD_TIMEOUT = 120000; // 2 minutes
// const EXTRACTION_TIMEOUT = 180000; // 3 minutes
// const COPY_TIMEOUT = 300000; // 5 minutes
// const PRESERVE_TIMEOUT = 30000; // 30 seconds

// // Cache for hot-reloaded modules
// const moduleCache = new Map();
// const commandCache = new Map();

// /* -------------------- Enhanced Helpers -------------------- */
// async function run(cmd, timeout = 60000, env = {}) {
//   return new Promise((resolve, reject) => {
//     exec(cmd, { 
//       timeout, 
//       windowsHide: true,
//       env: { ...process.env, ...env }
//     }, (err, stdout, stderr) => {
//       if (err) return reject(new Error(stderr || stdout || err.message));
//       resolve(stdout.toString().trim());
//     });
//   });
// }

// async function hasGitRepo() {
//   const gitDir = path.join(process.cwd(), '.git');
//   if (!fs.existsSync(gitDir)) return false;
//   try {
//     await run('git --version');
//     return true;
//   } catch {
//     return false;
//   }
// }

// /* -------------------- Node Modules Management -------------------- */
// async function cleanNodeModules() {
//   console.log('🧹 Cleaning node_modules and caches...');
  
//   const pathsToClean = [
//     { path: path.join(process.cwd(), 'node_modules'), type: 'dir' },
//     { path: path.join(process.cwd(), 'package-lock.json'), type: 'file' },
//     { path: path.join(process.cwd(), 'yarn.lock'), type: 'file' },
//     { path: path.join(process.cwd(), '.npm'), type: 'dir' },
//     { path: path.join(process.cwd(), '.yarn'), type: 'dir' },
//     { path: path.join(process.cwd(), '.cache'), type: 'dir' },
//   ];
  
//   for (const item of pathsToClean) {
//     try {
//       if (fs.existsSync(item.path)) {
//         if (item.type === 'dir') {
//           await fsPromises.rm(item.path, { recursive: true, force: true });
//           console.log(`Removed directory: ${path.basename(item.path)}`);
//         } else {
//           await fsPromises.unlink(item.path);
//           console.log(`Removed file: ${path.basename(item.path)}`);
//         }
//       }
//     } catch (error) {
//       console.warn(`Could not remove ${item.path}:`, error.message);
//     }
//   }
  
//   // Clean npm cache
//   try {
//     await run('npm cache clean --force', 30000);
//     console.log('✅ NPM cache cleaned');
//   } catch {
//     console.warn('⚠️ Could not clean NPM cache');
//   }
// }

// async function installDependenciesWithMemoryLimit(memoryLimit = '512') {
//   console.log(`📦 Installing dependencies with ${memoryLimit}MB memory limit...`);
  
//   const env = {
//     NODE_OPTIONS: `--max-old-space-size=${memoryLimit}`,
//     npm_config_cache: path.join(process.cwd(), '.npm-cache')
//   };
  
//   try {
//     // First try npm ci (clean install)
//     console.log('Trying npm ci...');
//     await run('npm ci --no-audit --no-fund --progress=false', 300000, env);
//     console.log('✅ Dependencies installed with npm ci');
//     return true;
//   } catch (ciError) {
//     console.warn('npm ci failed, trying npm install...');
    
//     try {
//       // Fallback to npm install
//       await run('npm install --no-audit --no-fund --progress=false', 300000, env);
//       console.log('✅ Dependencies installed with npm install');
//       return true;
//     } catch (installError) {
//       console.error('Both npm ci and npm install failed:', installError.message);
      
//       // Try with reduced parallelism
//       try {
//         console.log('Trying with reduced parallelism...');
//         await run('npm install --no-audit --no-fund --progress=false --maxsockets=1', 300000, env);
//         console.log('✅ Dependencies installed with reduced parallelism');
//         return true;
//       } catch (fallbackError) {
//         console.error('All installation attempts failed');
//         return false;
//       }
//     }
//   }
// }

// async function verifyNodeModules() {
//   console.log('🔍 Verifying node_modules...');
  
//   const requiredPackages = ['dotenv', 'baileys', 'axios', 'qrcode-terminal'];
//   const packageJsonPath = path.join(process.cwd(), 'package.json');
  
//   try {
//     // Check if package.json exists
//     if (!fs.existsSync(packageJsonPath)) {
//       console.warn('⚠️ package.json not found');
//       return false;
//     }
    
//     // Check if node_modules exists
//     const nodeModulesPath = path.join(process.cwd(), 'node_modules');
//     if (!fs.existsSync(nodeModulesPath)) {
//       console.warn('⚠️ node_modules directory not found');
//       return false;
//     }
    
//     // Check a few critical packages
//     let missingPackages = [];
//     for (const pkg of requiredPackages) {
//       const pkgPath = path.join(nodeModulesPath, pkg);
//       if (!fs.existsSync(pkgPath)) {
//         missingPackages.push(pkg);
//       }
//     }
    
//     if (missingPackages.length > 0) {
//       console.warn(`⚠️ Missing packages: ${missingPackages.join(', ')}`);
//       return false;
//     }
    
//     console.log('✅ node_modules verification passed');
//     return true;
//   } catch (error) {
//     console.error('Verification error:', error);
//     return false;
//   }
// }

// /* -------------------- Async Download with Progress -------------------- */
// async function downloadWithProgress(url, dest, onProgress) {
//   return new Promise((resolve, reject) => {
//     const client = url.startsWith('https://') ? https : http;
    
//     const req = client.get(url, {
//       headers: {
//         'User-Agent': 'WolfBot-Updater/2.0',
//         'Accept': '*/*'
//       },
//       timeout: DOWNLOAD_TIMEOUT
//     }, (res) => {
//       if (res.statusCode === 302 || res.statusCode === 301) {
//         const redirectUrl = res.headers.location;
//         res.resume();
//         return downloadWithProgress(new URL(redirectUrl, url).toString(), dest, onProgress)
//           .then(resolve)
//           .catch(reject);
//       }
      
//       if (res.statusCode !== 200) {
//         res.resume();
//         return reject(new Error(`HTTP ${res.statusCode}`));
//       }
      
//       const totalSize = parseInt(res.headers['content-length']) || 0;
//       let downloaded = 0;
//       const fileStream = createWriteStream(dest);
      
//       res.on('data', (chunk) => {
//         downloaded += chunk.length;
//         if (onProgress && totalSize > 0) {
//           const percent = Math.round((downloaded / totalSize) * 100);
//           onProgress(percent, downloaded, totalSize);
//         }
//       });
      
//       res.pipe(fileStream);
      
//       fileStream.on('finish', () => {
//         fileStream.close();
//         resolve();
//       });
      
//       fileStream.on('error', (err) => {
//         fs.unlink(dest, () => reject(err));
//       });
//     });
    
//     req.on('error', (err) => {
//       fs.unlink(dest, () => reject(err));
//     });
    
//     req.on('timeout', () => {
//       req.destroy();
//       fs.unlink(dest, () => reject(new Error('Download timeout')));
//     });
//   });
// }

// /* -------------------- Hot Reload Functions -------------------- */
// async function clearModuleCache(modulePath) {
//   const normalizedPath = path.resolve(modulePath);
  
//   // Clear from Node.js require cache
//   for (const key in require.cache) {
//     if (key.includes(normalizedPath) || key.includes(modulePath)) {
//       delete require.cache[key];
//     }
//   }
  
//   // Clear from module cache
//   for (const [key, value] of moduleCache.entries()) {
//     if (key.includes(normalizedPath) || key.includes(modulePath)) {
//       moduleCache.delete(key);
//     }
//   }
// }

// async function hotReloadCommands(commandDir = 'commands') {
//   const commandsPath = path.join(process.cwd(), commandDir);
//   if (!fs.existsSync(commandsPath)) {
//     console.log('Commands directory not found');
//     return { reloaded: 0, errors: 0 };
//   }
  
//   let reloaded = 0;
//   let errors = 0;
  
//   try {
//     // Get all command files
//     const files = await fsPromises.readdir(commandsPath, { withFileTypes: true });
    
//     for (const file of files) {
//       if (file.isFile() && file.name.endsWith('.js')) {
//         const filePath = path.join(commandsPath, file.name);
//         try {
//           // Clear cache for this file
//           await clearModuleCache(filePath);
          
//           // Try to reload
//           const moduleUrl = `file://${filePath}`;
//           const module = await import(moduleUrl);
          
//           if (module.default) {
//             const commandName = module.default.name || file.name.replace('.js', '');
//             commandCache.set(commandName, module.default);
//             reloaded++;
//             console.log(`Hot-reloaded command: ${commandName}`);
//           }
//         } catch (error) {
//           console.error(`Failed to hot-reload ${file.name}:`, error.message);
//           errors++;
//         }
//       } else if (file.isDirectory()) {
//         // Handle subdirectories (categories)
//         const subDir = path.join(commandsPath, file.name);
//         const subFiles = await fsPromises.readdir(subDir, { withFileTypes: true });
        
//         for (const subFile of subFiles) {
//           if (subFile.isFile() && subFile.name.endsWith('.js')) {
//             const filePath = path.join(subDir, subFile.name);
//             try {
//               await clearModuleCache(filePath);
              
//               const moduleUrl = `file://${filePath}`;
//               const module = await import(moduleUrl);
              
//               if (module.default) {
//                 const commandName = module.default.name || subFile.name.replace('.js', '');
//                 commandCache.set(commandName, module.default);
//                 reloaded++;
//                 console.log(`Hot-reloaded command: ${file.name}/${commandName}`);
//               }
//             } catch (error) {
//               console.error(`Failed to hot-reload ${file.name}/${subFile.name}:`, error.message);
//               errors++;
//             }
//           }
//         }
//       }
//     }
    
//     console.log(`Hot reload complete: ${reloaded} commands reloaded, ${errors} errors`);
//     return { reloaded, errors };
    
//   } catch (error) {
//     console.error('Error during hot reload:', error);
//     return { reloaded: 0, errors: 1 };
//   }
// }

// /* -------------------- Fast Preserve Files -------------------- */
// async function preserveEssentialFiles() {
//   console.log('Preserving essential files...');
  
//   const essentialFiles = [
//     'settings.js',
//     'config.json',
//     '.env',
//     'baileys_store.json',
//     '.npmrc' // Preserve npm config
//   ];
  
//   const essentialDirs = [
//     'session',
//     'data',
//     'logs'
//   ];
  
//   const preserveDir = path.join(process.cwd(), 'tmp_preserve_fast');
//   if (fs.existsSync(preserveDir)) {
//     await fsPromises.rm(preserveDir, { recursive: true, force: true });
//   }
//   await fsPromises.mkdir(preserveDir, { recursive: true });
  
//   const preserved = [];
  
//   // Create .npmrc with memory limits if it doesn't exist
//   const npmrcPath = path.join(process.cwd(), '.npmrc');
//   if (!fs.existsSync(npmrcPath)) {
//     await fsPromises.writeFile(npmrcPath, 'node-options=--max-old-space-size=512\n');
//     console.log('Created .npmrc with memory limits');
//   }
  
//   // Preserve essential files
//   for (const file of essentialFiles) {
//     const filePath = path.join(process.cwd(), file);
//     try {
//       if (fs.existsSync(filePath)) {
//         const preservePath = path.join(preserveDir, file);
//         await fsPromises.copyFile(filePath, preservePath);
//         preserved.push(file);
//         console.log(`Preserved file: ${file}`);
//       }
//     } catch (error) {
//       console.warn(`Could not preserve ${file}:`, error.message);
//     }
//   }
  
//   // Preserve essential directories (with size limit)
//   for (const dir of essentialDirs) {
//     const dirPath = path.join(process.cwd(), dir);
//     try {
//       if (fs.existsSync(dirPath)) {
//         const stat = await fsPromises.stat(dirPath);
//         if (stat.isDirectory()) {
//           // Skip if directory is too large (> 50MB)
//           const dirSize = await getDirectorySize(dirPath);
//           if (dirSize > 50 * 1024 * 1024) { // 50MB
//             console.log(`Skipping large directory ${dir} (${formatBytes(dirSize)})`);
//             continue;
//           }
          
//           const preservePath = path.join(preserveDir, dir);
//           await copyDirectoryFast(dirPath, preservePath);
//           preserved.push(dir);
//           console.log(`Preserved directory: ${dir} (${formatBytes(dirSize)})`);
//         }
//       }
//     } catch (error) {
//       console.warn(`Could not preserve ${dir}:`, error.message);
//     }
//   }
  
//   return { preserveDir, preserved };
// }

// /* -------------------- Fast Directory Copy -------------------- */
// async function copyDirectoryFast(src, dest, timeout = PRESERVE_TIMEOUT) {
//   await fsPromises.mkdir(dest, { recursive: true });
  
//   const entries = await fsPromises.readdir(src, { withFileTypes: true });
//   const copyPromises = [];
  
//   for (const entry of entries) {
//     if (copyPromises.length > 10) {
//       // Process in batches to avoid too many simultaneous operations
//       await Promise.all(copyPromises);
//       copyPromises.length = 0;
//     }
    
//     const srcPath = path.join(src, entry.name);
//     const destPath = path.join(dest, entry.name);
    
//     if (entry.isDirectory()) {
//       copyPromises.push(copyDirectoryFast(srcPath, destPath, timeout));
//     } else {
//       copyPromises.push(
//         Promise.race([
//           fsPromises.copyFile(srcPath, destPath),
//           new Promise((_, reject) => 
//             setTimeout(() => reject(new Error('Copy timeout')), timeout)
//           )
//         ]).catch(error => {
//           console.warn(`Failed to copy ${srcPath}:`, error.message);
//         })
//       );
//     }
//   }
  
//   if (copyPromises.length > 0) {
//     await Promise.all(copyPromises);
//   }
// }

// async function getDirectorySize(dir) {
//   let totalSize = 0;
  
//   try {
//     const entries = await fsPromises.readdir(dir, { withFileTypes: true });
    
//     for (const entry of entries) {
//       const entryPath = path.join(dir, entry.name);
      
//       if (entry.isDirectory()) {
//         totalSize += await getDirectorySize(entryPath);
//       } else {
//         try {
//           const stat = await fsPromises.stat(entryPath);
//           totalSize += stat.size;
//         } catch {
//           // Skip if can't stat
//         }
//       }
//     }
//   } catch {
//     // Return 0 if can't read directory
//   }
  
//   return totalSize;
// }

// function formatBytes(bytes) {
//   if (bytes === 0) return '0 Bytes';
//   const k = 1024;
//   const sizes = ['Bytes', 'KB', 'MB', 'GB'];
//   const i = Math.floor(Math.log(bytes) / Math.log(k));
//   return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
// }

// /* -------------------- Fast ZIP Update -------------------- */
// async function updateViaZip(zipUrl = UPDATE_ZIP_URL) {
//   console.log(`Starting fast ZIP update from: ${zipUrl}`);
  
//   const tmpDir = path.join(process.cwd(), 'tmp_update_fast');
//   const zipPath = path.join(tmpDir, 'update.zip');
//   const extractTo = path.join(tmpDir, 'extracted');
  
//   try {
//     // Clean up old temp dir
//     if (fs.existsSync(tmpDir)) {
//       await fsPromises.rm(tmpDir, { recursive: true, force: true });
//     }
//     await fsPromises.mkdir(tmpDir, { recursive: true });
//     await fsPromises.mkdir(extractTo, { recursive: true });
    
//     // Preserve essential files
//     const { preserveDir, preserved } = await preserveEssentialFiles();
//     console.log(`Preserved ${preserved.length} items: ${preserved.join(', ')}`);
    
//     // Download with progress
//     console.log('Downloading update...');
//     let lastProgress = 0;
    
//     await downloadWithProgress(zipUrl, zipPath, (percent, downloaded, total) => {
//       if (percent >= lastProgress + 10 || percent === 100) {
//         console.log(`Download: ${percent}% (${formatBytes(downloaded)}/${formatBytes(total)})`);
//         lastProgress = percent;
//       }
//     });
    
//     // Verify download
//     const stat = await fsPromises.stat(zipPath);
//     if (stat.size === 0) {
//       throw new Error('Downloaded file is empty');
//     }
//     console.log(`Downloaded ${formatBytes(stat.size)}`);
    
//     // Extract ZIP with timeout
//     console.log('Extracting ZIP...');
//     await Promise.race([
//       extractZip(zipPath, extractTo),
//       new Promise((_, reject) => 
//         setTimeout(() => reject(new Error('Extraction timeout')), EXTRACTION_TIMEOUT)
//       )
//     ]);
    
//     // Find extracted root
//     const entries = await fsPromises.readdir(extractTo);
//     let root = extractTo;
    
//     if (entries.length === 1) {
//       const singleEntry = path.join(extractTo, entries[0]);
//       const stat = await fsPromises.stat(singleEntry);
//       if (stat.isDirectory()) {
//         root = singleEntry;
//         console.log(`Found root directory: ${entries[0]}`);
//       }
//     }
    
//     // Copy files selectively
//     console.log('Copying essential files...');
//     const copied = await copyEssentialFiles(root, process.cwd());
    
//     // Restore preserved files
//     console.log('Restoring preserved files...');
//     await restorePreservedFiles(preserveDir);
    
//     // Cleanup
//     console.log('Cleaning up...');
//     await fsPromises.rm(tmpDir, { recursive: true, force: true });
    
//     return {
//       success: true,
//       copiedFiles: copied,
//       url: zipUrl,
//       fileCount: copied.length
//     };
    
//   } catch (error) {
//     console.error('ZIP update failed:', error);
    
//     // Cleanup on error
//     try {
//       if (fs.existsSync(tmpDir)) {
//         await fsPromises.rm(tmpDir, { recursive: true, force: true });
//       }
//     } catch (cleanupError) {
//       console.warn('Failed to cleanup temp dir:', cleanupError);
//     }
    
//     throw error;
//   }
// }

// /* -------------------- Selective File Copy -------------------- */
// async function copyEssentialFiles(src, dest) {
//   const copied = [];
//   const ignorePatterns = [
//     /^node_modules$/,
//     /^\.git$/,
//     /^tmp/,
//     /^temp/,
//     /^logs$/,
//     /^session$/,
//     /^data$/,
//     /^tmp_.*$/,
//     /^\.env$/,
//     /^settings\.js$/,
//     /^config\.json$/,
//     /^baileys_store\.json$/,
//     /^\.npmrc$/,
//     /package-lock\.json$/,
//     /yarn\.lock$/,
//     /\.log$/,
//     /\.cache$/
//   ];
  
//   async function copyDir(srcPath, destPath, relative = '') {
//     try {
//       const entries = await fsPromises.readdir(srcPath, { withFileTypes: true });
      
//       for (const entry of entries) {
//         // Check if should be ignored
//         if (ignorePatterns.some(pattern => pattern.test(entry.name))) {
//           continue;
//         }
        
//         const entrySrc = path.join(srcPath, entry.name);
//         const entryDest = path.join(destPath, entry.name);
//         const entryRelative = relative ? path.join(relative, entry.name) : entry.name;
        
//         if (entry.isDirectory()) {
//           await fsPromises.mkdir(entryDest, { recursive: true });
//           await copyDir(entrySrc, entryDest, entryRelative);
//         } else {
//           // Skip if file already exists and is newer
//           let shouldCopy = true;
//           try {
//             const srcStat = await fsPromises.stat(entrySrc);
//             const destStat = await fsPromises.stat(entryDest);
            
//             // Only copy if source is newer
//             shouldCopy = srcStat.mtimeMs > destStat.mtimeMs;
//           } catch {
//             // Destination doesn't exist or can't stat
//             shouldCopy = true;
//           }
          
//           if (shouldCopy) {
//             await fsPromises.copyFile(entrySrc, entryDest);
//             copied.push(entryRelative);
            
//             // Log every 10 files
//             if (copied.length % 10 === 0) {
//               console.log(`Copied ${copied.length} files...`);
//             }
//           }
//         }
//       }
//     } catch (error) {
//       console.warn(`Error copying from ${srcPath}:`, error.message);
//     }
//   }
  
//   await copyDir(src, dest);
//   return copied;
// }

// /* -------------------- Restore Preserved Files -------------------- */
// async function restorePreservedFiles(preserveDir) {
//   if (!fs.existsSync(preserveDir)) return;
  
//   try {
//     const entries = await fsPromises.readdir(preserveDir, { withFileTypes: true });
    
//     for (const entry of entries) {
//       const srcPath = path.join(preserveDir, entry.name);
//       const destPath = path.join(process.cwd(), entry.name);
      
//       if (entry.isDirectory()) {
//         await copyDirectoryFast(srcPath, destPath);
//       } else {
//         await fsPromises.copyFile(srcPath, destPath);
//       }
//       console.log(`Restored: ${entry.name}`);
//     }
    
//     await fsPromises.rm(preserveDir, { recursive: true, force: true });
//   } catch (error) {
//     console.warn('Failed to restore preserved files:', error.message);
//   }
// }

// /* -------------------- Git Update (Fast) -------------------- */
// async function updateViaGit() {
//   try {
//     console.log('Starting Git update...');
    
//     // Check if we can use git
//     try {
//       await run('git --version');
//     } catch {
//       throw new Error('Git is not installed or not in PATH');
//     }
    
//     const oldRev = await run('git rev-parse HEAD').catch(() => 'unknown');
//     console.log(`Current revision: ${oldRev.slice(0, 7)}`);
    
//     // Check if we have b7-upstream (your remote)
//     try {
//       await run('git remote get-url b7-upstream');
//     } catch {
//       console.log('Adding b7-upstream remote...');
//       await run(`git remote add b7-upstream ${GIT_REPO_URL}`);
//     }
    
//     // Fetch updates
//     console.log('Fetching updates...');
//     await run('git fetch b7-upstream');
    
//     // Check current branch
//     const currentBranch = await run('git rev-parse --abbrev-ref HEAD').catch(() => 'main');
    
//     // Get latest from upstream
//     let newRev;
//     try {
//       newRev = await run(`git rev-parse b7-upstream/${currentBranch}`);
//     } catch {
//       newRev = await run('git rev-parse b7-upstream/main');
//     }
    
//     if (oldRev === newRev) {
//       console.log('Already up to date');
//       return {
//         oldRev,
//         newRev,
//         alreadyUpToDate: true,
//         branch: currentBranch,
//         files: []
//       };
//     }
    
//     console.log(`Updating to: ${newRev.slice(0, 7)}`);
    
//     // Create backup
//     const timestamp = Date.now();
//     const backupBranch = `backup-${timestamp}`;
//     await run(`git branch ${backupBranch}`);
    
//     // Fast-forward merge
//     await run(`git merge --ff-only ${newRev}`);
    
//     return {
//       oldRev,
//       newRev,
//       alreadyUpToDate: false,
//       branch: currentBranch,
//       backupBranch,
//       files: []
//     };
    
//   } catch (error) {
//     console.error('Git update failed:', error);
    
//     // Try to revert if something went wrong
//     try {
//       const branches = await run('git branch --list backup-*');
//       if (branches) {
//         const backupList = branches.split('\n').filter(b => b.trim());
//         if (backupList.length > 0) {
//           const latestBackup = backupList[backupList.length - 1].trim();
//           console.log(`Reverting to backup: ${latestBackup}`);
//           await run(`git reset --hard ${latestBackup}`);
//         }
//       }
//     } catch (revertError) {
//       console.error('Could not revert:', revertError);
//     }
    
//     throw error;
//   }
// }

// /* -------------------- Main Command -------------------- */
// export default {
//   name: "update",
//   description: "Update bot from b7 repository",
//   category: "owner",
//   ownerOnly: true,

//   async execute(sock, m, args) {
//     const jid = m.key.remoteJid;
//     const sender = m.key.participant || m.key.remoteJid;
    
//     // Check if owner
//     const isOwner = m.key.fromMe || sender.includes("947") || sender.includes("owner-number");
//     if (!isOwner) {
//       return sock.sendMessage(jid, {
//         text: '❌ Only bot owner can use .update command'
//       }, { quoted: m });
//     }
    
//     let statusMessage;
//     try {
//       // Send initial message
//       statusMessage = await sock.sendMessage(jid, {
//         text: '🔄 **WolfBot Fast Update**\nStarting update process...'
//       }, { quoted: m });
      
//       const editStatus = async (text) => {
//         try {
//           await sock.sendMessage(jid, {
//             text,
//             edit: statusMessage.key
//           });
//         } catch {
//           // If editing fails, send new message
//           const newMsg = await sock.sendMessage(jid, { text }, { quoted: m });
//           statusMessage = newMsg;
//         }
//       };
      
//       await editStatus('🔄 **Checking update method...**');
      
//       // Parse arguments
//       const forceMethod = args[0]?.toLowerCase();
//       const useZip = forceMethod === 'zip';
//       const useGit = forceMethod === 'git';
//       const softUpdate = args.includes('soft') || args.includes('no-restart');
//       const hotReload = args.includes('hot') || args.includes('reload');
//       const cleanInstall = args.includes('clean') || args.includes('fresh');
//       const skipInstall = args.includes('skip-install');
      
//       let result;
      
//       // Clean node_modules if requested or if having issues
//       if (cleanInstall || args.includes('fix')) {
//         await editStatus('🧹 **Cleaning node_modules...**\nPreparing for fresh install...');
//         await cleanNodeModules();
//       }
      
//       if (useGit || (!useZip && await hasGitRepo())) {
//         await editStatus('🌐 **Using Git update method**\nFetching latest changes...');
//         result = await updateViaGit();
        
//         if (result.alreadyUpToDate) {
//           await editStatus(`✅ **Already Up to Date**\nBranch: ${result.branch}\nCommit: ${result.newRev?.slice(0, 7) || 'N/A'}`);
          
//           // Even if up to date, hot reload if requested
//           if (hotReload) {
//             await editStatus('🔄 **Hot reloading commands...**');
//             const reloadResult = await hotReloadCommands();
//             await editStatus(`✅ **Hot reload complete**\nReloaded: ${reloadResult.reloaded} commands\nErrors: ${reloadResult.errors}`);
//           }
//           return;
//         }
        
//         await editStatus(`✅ **Git Update Complete**\nUpdated to: ${result.newRev?.slice(0, 7) || 'N/A'}\nPreparing dependencies...`);
        
//       } else {
//         await editStatus('📥 **Using ZIP update method**\nDownloading latest version...\nThis may take a few minutes...');
//         result = await updateViaZip();
        
//         await editStatus(`✅ **ZIP Update Complete**\nFiles updated: ${result.fileCount || 0}\nPreparing dependencies...`);
//       }
      
//       // Install dependencies (skip if requested)
//       if (!softUpdate && !skipInstall) {
//         // First verify if we need to install
//         const needsInstall = !(await verifyNodeModules());
        
//         if (needsInstall) {
//           await editStatus('📦 **Installing dependencies...**\nThis may take a minute...');
          
//           const installSuccess = await installDependenciesWithMemoryLimit('512');
          
//           if (installSuccess) {
//             await editStatus('✅ **Dependencies installed successfully**');
//           } else {
//             await editStatus('⚠️ **Dependency installation had issues**\nThe bot may need manual npm install');
//           }
//         } else {
//           await editStatus('✅ **Dependencies are already installed**');
//         }
//       } else if (skipInstall) {
//         await editStatus('⏭️ **Skipping dependency installation**\nAs requested via skip-install flag');
//       }
      
//       // Try hot reload first if requested
//       if (hotReload || softUpdate) {
//         try {
//           await editStatus('🔄 **Attempting hot reload...**');
//           const reloadResult = await hotReloadCommands();
          
//           if (reloadResult.reloaded > 0) {
//             await editStatus(`✅ **Hot reload successful!**\nReloaded: ${reloadResult.reloaded} commands\nErrors: ${reloadResult.errors}\n\nBot updated without restart! 🎉`);
//           } else if (reloadResult.errors > 0) {
//             await editStatus(`⚠️ **Hot reload had issues**\nReloaded: ${reloadResult.reloaded} commands\nErrors: ${reloadResult.errors}\n\nConsider restarting for full update.`);
//           } else {
//             await editStatus('✅ **Update Applied Successfully**\nRunning without restart.\nSome changes may need restart to take effect.');
//           }
          
//         } catch (reloadError) {
//           console.error('Hot reload failed:', reloadError);
//           await editStatus('⚠️ **Hot reload failed**\nFalling back to normal update...');
          
//           // Fall back to restart if hot reload fails
//           await editStatus('✅ **Update Complete!**\nRestarting bot in 3 seconds...');
          
//           await new Promise(resolve => setTimeout(resolve, 3000));
          
//           // Restart process
//           await sock.sendMessage(jid, {
//             text: '🔄 **Restarting Now...**\nBot will be back in a moment!'
//           }, { quoted: m });
          
//           try {
//             await run('pm2 restart all', 10000);
//           } catch {
//             console.log('PM2 restart failed, exiting process...');
//             process.exit(0);
//           }
//         }
//       } else {
//         // Normal restart
//         await editStatus('✅ **Update Complete!**\nRestarting bot in 3 seconds...');
        
//         await new Promise(resolve => setTimeout(resolve, 3000));
        
//         // Restart process
//         await sock.sendMessage(jid, {
//           text: '🔄 **Restarting Now...**\nBot will be back in a moment!'
//         }, { quoted: m });
        
//         try {
//           await run('pm2 restart all', 10000);
//         } catch {
//           console.log('PM2 restart failed, exiting process...');
//           process.exit(0);
//         }
//       }
      
//     } catch (err) {
//       console.error('Update failed:', err);
      
//       let errorText = `❌ **Update Failed**\nError: ${err.message || err}\n\n`;
      
//       if (err.message.includes('timeout')) {
//         errorText += '**Reason:** Operation timed out\n';
//         errorText += '**Solution:** Try again with better internet connection\n';
//       } else if (err.message.includes('HTTP')) {
//         errorText += '**Reason:** Download failed\n';
//         errorText += '**Solution:** Check internet or try .update git\n';
//       } else if (err.message.includes('Git')) {
//         errorText += '**Reason:** Git operation failed\n';
//         errorText += '**Solution:** Try .update zip instead\n';
//       } else if (err.message.includes('memory') || err.message.includes('137')) {
//         errorText += '**Reason:** Out of memory\n';
//         errorText += '**Solution:** Try .update clean (cleans node_modules)\n';
//         errorText += 'Or try: .update skip-install (skips npm install)\n';
//       }
      
//       errorText += '\n**Manual Update:**\n';
//       errorText += `1. Visit: ${GIT_REPO_URL}\n`;
//       errorText += '2. Download ZIP\n';
//       errorText += '3. Extract and replace files\n';
      
//       errorText += '\n**Try these options:**\n';
//       errorText += '`.update git hot` - Git update with hot reload\n';
//       errorText += '`.update zip soft` - ZIP update without restart\n';
//       errorText += '`.update clean` - Clean install (fixes node_modules)\n';
//       errorText += '`.update skip-install` - Skip npm install\n';
//       errorText += '`.update soft` - Update without restart\n';
      
//       try {
//         if (statusMessage?.key) {
//           await sock.sendMessage(jid, { text: errorText, edit: statusMessage.key });
//         } else {
//           await sock.sendMessage(jid, { text: errorText }, { quoted: m });
//         }
//       } catch {
//         // Ignore if can't send error
//       }
//     }
//   }
// };

// /* -------------------- Export Utilities -------------------- */
// export async function loadSettings() {
//   const paths = [
//     path.join(process.cwd(), 'settings.js'),
//     path.join(process.cwd(), 'config', 'settings.js'),
//   ];
  
//   for (const settingsPath of paths) {
//     try {
//       if (fs.existsSync(settingsPath)) {
//         const module = await import(`file://${settingsPath}`);
//         return module.default || module;
//       }
//     } catch {
//       // Continue to next path
//     }
//   }
  
//   return {};
// }

// /* -------------------- Extract Zip Utility -------------------- */
// async function extractZip(zipPath, outDir) {
//   if (process.platform === 'win32') {
//     await run(`powershell -NoProfile -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${outDir}' -Force"`);
//     return;
//   }
  
//   // Try different extraction tools
//   const tools = [
//     { cmd: 'unzip', args: `-o "${zipPath}" -d "${outDir}"` },
//     { cmd: '7z', args: `x "${zipPath}" -o"${outDir}" -y` },
//     { cmd: 'busybox', args: `unzip "${zipPath}" -d "${outDir}"` },
//   ];
  
//   for (const tool of tools) {
//     try {
//       await run(`which ${tool.cmd}`);
//       console.log(`Extracting with ${tool.cmd}...`);
//       await run(`${tool.cmd} ${tool.args}`);
//       return;
//     } catch {
//       continue;
//     }
//   }
  
//   throw new Error('No extraction tool found');
// }

// /* -------------------- Additional Hot Reload Command -------------------- */
// export const hotReloadCommand = {
//   name: "reload",
//   description: "Hot reload commands without restarting",
//   category: "owner",
//   ownerOnly: true,

//   async execute(sock, m, args) {
//     const jid = m.key.remoteJid;
//     const sender = m.key.participant || m.key.remoteJid;
    
//     // Check if owner
//     const isOwner = m.key.fromMe || sender.includes("947") || sender.includes("owner-number");
//     if (!isOwner) {
//       return sock.sendMessage(jid, {
//         text: '❌ Only bot owner can use .reload command'
//       }, { quoted: m });
//     }
    
//     try {
//       const statusMsg = await sock.sendMessage(jid, {
//         text: '🔄 **Hot Reloading Commands...**'
//       }, { quoted: m });
      
//       const result = await hotReloadCommands();
      
//       if (result.reloaded > 0 || result.errors === 0) {
//         await sock.sendMessage(jid, {
//           text: `✅ **Hot Reload Successful!**\nReloaded: ${result.reloaded} commands\nErrors: ${result.errors}\n\nBot commands have been updated without restart! 🎉`,
//           edit: statusMsg.key
//         });
//       } else {
//         await sock.sendMessage(jid, {
//           text: `⚠️ **Hot Reload Had Issues**\nReloaded: ${result.reloaded} commands\nErrors: ${result.errors}\n\nSome commands may not have been reloaded.`,
//           edit: statusMsg.key
//         });
//       }
      
//     } catch (error) {
//       console.error('Hot reload command failed:', error);
//       await sock.sendMessage(jid, {
//         text: `❌ **Hot Reload Failed**\nError: ${error.message}\n\nTry restarting the bot instead.`
//       }, { quoted: m });
//     }
//   }
// };

// /* -------------------- Fix Command for Node Modules Issues -------------------- */
// export const fixCommand = {
//   name: "fix",
//   description: "Fix node_modules and dependency issues",
//   category: "owner",
//   ownerOnly: true,

//   async execute(sock, m, args) {
//     const jid = m.key.remoteJid;
//     const sender = m.key.participant || m.key.remoteJid;
    
//     // Check if owner
//     const isOwner = m.key.fromMe || sender.includes("947") || sender.includes("owner-number");
//     if (!isOwner) {
//       return sock.sendMessage(jid, {
//         text: '❌ Only bot owner can use .fix command'
//       }, { quoted: m });
//     }
    
//     try {
//       const statusMsg = await sock.sendMessage(jid, {
//         text: '🔧 **Fixing Node Modules...**\nThis will clean and reinstall dependencies.'
//       }, { quoted: m });
      
//       // Clean node_modules
//       await sock.sendMessage(jid, {
//         text: '🧹 Cleaning node_modules and caches...',
//         edit: statusMsg.key
//       });
      
//       await cleanNodeModules();
      
//       // Install dependencies
//       await sock.sendMessage(jid, {
//         text: '📦 Reinstalling dependencies...\nThis may take a minute.',
//         edit: statusMsg.key
//       });
      
//       const installSuccess = await installDependenciesWithMemoryLimit('512');
      
//       if (installSuccess) {
//         await sock.sendMessage(jid, {
//           text: '✅ **Fix Complete!**\nDependencies reinstalled successfully.\nBot will restart in 3 seconds...',
//           edit: statusMsg.key
//         });
        
//         await new Promise(resolve => setTimeout(resolve, 3000));
        
//         // Restart
//         await sock.sendMessage(jid, {
//           text: '🔄 **Restarting Now...**'
//         }, { quoted: m });
        
//         try {
//           await run('pm2 restart all', 10000);
//         } catch {
//           console.log('PM2 restart failed, exiting process...');
//           process.exit(0);
//         }
//       } else {
//         await sock.sendMessage(jid, {
//           text: '❌ **Fix Failed**\nCould not install dependencies.\nTry manual npm install.',
//           edit: statusMsg.key
//         });
//       }
      
//     } catch (error) {
//       console.error('Fix command failed:', error);
//       await sock.sendMessage(jid, {
//         text: `❌ **Fix Failed**\nError: ${error.message}\n\nTry manual cleanup:\n\`rm -rf node_modules package-lock.json\`\n\`npm cache clean --force\`\n\`npm install\``
//       }, { quoted: m });
//     }
//   }
// };



























import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import https from "https";
import http from "http";
import { createRequire } from 'module';
import { createWriteStream } from "fs";

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

/* -------------------- Configuration -------------------- */
// Updated with correct repository
const UPDATE_ZIP_URL = "https://github.com/nk-apex/n7/archive/refs/heads/main.zip";
const GIT_REPO_URL = "https://github.com/nk-apex/n7.git";
const OWNER_REPO_URL = "https://github.com/7silent-wolf/silentwolf.git";

// Timeout configurations
const DOWNLOAD_TIMEOUT = 120000; // 2 minutes
const EXTRACTION_TIMEOUT = 180000; // 3 minutes
const COPY_TIMEOUT = 300000; // 5 minutes
const PRESERVE_TIMEOUT = 30000; // 30 seconds

// Cache for hot-reloaded modules
const moduleCache = new Map();
const commandCache = new Map();

/* -------------------- Enhanced Helpers -------------------- */
async function run(cmd, timeout = 60000) {
  return new Promise((resolve, reject) => {
    exec(cmd, { timeout, windowsHide: true }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || stdout || err.message));
      resolve(stdout.toString().trim());
    });
  });
}

async function hasGitRepo() {
  const gitDir = path.join(process.cwd(), '.git');
  if (!fs.existsSync(gitDir)) return false;
  try {
    await run('git --version');
    return true;
  } catch {
    return false;
  }
}

/* -------------------- Repository Size Monitor -------------------- */
async function checkRepoSize() {
  try {
    const countOutput = await run('git count-objects -v');
    const lines = countOutput.split('\n');
    const sizeData = {};
    
    lines.forEach(line => {
      const [key, value] = line.split(': ');
      sizeData[key] = parseInt(value) || value;
    });
    
    // Calculate size in MB
    const packSizeKB = sizeData['size-pack'] || 0;
    const sizeMB = (packSizeKB / 1024).toFixed(2);
    
    return {
      sizeKB: packSizeKB,
      sizeMB: sizeMB,
      objects: sizeData['in-pack'] || 0,
      packs: sizeData['packs'] || 0
    };
  } catch (error) {
    console.error('Could not check repo size:', error);
    return { sizeMB: 'unknown', objects: 0 };
  }
}

/* -------------------- Git Update (SIZE-CONTROLLED) -------------------- */
async function updateViaGit() {
  try {
    console.log('Starting Git update (size-controlled)...');
    
    // Check if we can use git
    try {
      await run('git --version');
    } catch {
      throw new Error('Git is not installed or not in PATH');
    }
    
    // Get size before update
    const sizeBefore = await checkRepoSize();
    console.log(`Current size: ${sizeBefore.sizeMB} MB`);
    
    const oldRev = await run('git rev-parse HEAD').catch(() => 'unknown');
    console.log(`Current revision: ${oldRev.slice(0, 7)}`);
    
    // CRITICAL: Clean BEFORE fetching
    console.log('Pre-fetch cleanup...');
    await run('git prune --expire=now').catch(() => {});
    await run('git gc --auto').catch(() => {});
    
    // Check if we have n7-upstream remote
    try {
      await run('git remote get-url n7-upstream');
      console.log('Using existing n7-upstream remote');
    } catch {
      console.log('Adding n7-upstream remote...');
      await run(`git remote add n7-upstream ${GIT_REPO_URL}`);
    }
    
    // CRITICAL: Fetch with LIMITED HISTORY to prevent size increase
    console.log('Fetching updates (limited history: depth=30)...');
    await run('git fetch n7-upstream --depth=30 --prune');
    
    // Check current branch
    const currentBranch = await run('git rev-parse --abbrev-ref HEAD').catch(() => 'main');
    
    // Get latest from upstream
    let newRev;
    try {
      newRev = await run(`git rev-parse n7-upstream/${currentBranch}`);
    } catch {
      newRev = await run('git rev-parse n7-upstream/main');
    }
    
    if (oldRev === newRev) {
      console.log('Already up to date');
      // Still clean up
      await run('git gc --auto').catch(() => {});
      return {
        oldRev,
        newRev,
        alreadyUpToDate: true,
        branch: currentBranch,
        files: []
      };
    }
    
    console.log(`Updating to: ${newRev.slice(0, 7)}`);
    
    // Create backup
    const timestamp = Date.now();
    const backupBranch = `backup-${timestamp}`;
    await run(`git branch ${backupBranch}`).catch(() => {
      console.log('Could not create backup branch');
    });
    
    // Fast-forward merge
    await run(`git merge --ff-only ${newRev}`);
    
    // CRITICAL: Clean AFTER merging
    console.log('Post-merge cleanup...');
    await run('git prune --expire=now').catch(() => {});
    await run('git gc --aggressive --prune=now').catch(() => {});
    
    // Get size after update
    const sizeAfter = await checkRepoSize();
    const sizeDiff = (parseFloat(sizeAfter.sizeMB) - parseFloat(sizeBefore.sizeMB)).toFixed(2);
    
    console.log(`Size after update: ${sizeAfter.sizeMB} MB (${sizeDiff >= 0 ? '+' : ''}${sizeDiff} MB)`);
    
    return {
      oldRev,
      newRev,
      alreadyUpToDate: false,
      branch: currentBranch,
      backupBranch,
      files: [],
      sizeBefore: sizeBefore.sizeMB,
      sizeAfter: sizeAfter.sizeMB,
      sizeDiff: sizeDiff
    };
    
  } catch (error) {
    console.error('Git update failed:', error);
    
    // Try to revert if something went wrong
    try {
      const branches = await run('git branch --list backup-*');
      if (branches) {
        const backupList = branches.split('\n').filter(b => b.trim());
        if (backupList.length > 0) {
          const latestBackup = backupList[backupList.length - 1].trim();
          console.log(`Reverting to backup: ${latestBackup}`);
          await run(`git reset --hard ${latestBackup}`);
        }
      }
    } catch (revertError) {
      console.error('Could not revert:', revertError);
    }
    
    throw error;
  }
}

/* -------------------- Async Download with Progress -------------------- */
async function downloadWithProgress(url, dest, onProgress) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https://') ? https : http;
    
    const req = client.get(url, {
      headers: {
        'User-Agent': 'WolfBot-Updater/2.0',
        'Accept': '*/*'
      },
      timeout: DOWNLOAD_TIMEOUT
    }, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        const redirectUrl = res.headers.location;
        res.resume();
        return downloadWithProgress(new URL(redirectUrl, url).toString(), dest, onProgress)
          .then(resolve)
          .catch(reject);
      }
      
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      
      const totalSize = parseInt(res.headers['content-length']) || 0;
      let downloaded = 0;
      const fileStream = createWriteStream(dest);
      
      res.on('data', (chunk) => {
        downloaded += chunk.length;
        if (onProgress && totalSize > 0) {
          const percent = Math.round((downloaded / totalSize) * 100);
          onProgress(percent, downloaded, totalSize);
        }
      });
      
      res.pipe(fileStream);
      
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
      
      fileStream.on('error', (err) => {
        fs.unlink(dest, () => reject(err));
      });
    });
    
    req.on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
    
    req.on('timeout', () => {
      req.destroy();
      fs.unlink(dest, () => reject(new Error('Download timeout')));
    });
  });
}

/* -------------------- Hot Reload Functions -------------------- */
async function clearModuleCache(modulePath) {
  const normalizedPath = path.resolve(modulePath);
  
  // Clear from Node.js require cache
  for (const key in require.cache) {
    if (key.includes(normalizedPath) || key.includes(modulePath)) {
      delete require.cache[key];
    }
  }
  
  // Clear from module cache
  for (const [key, value] of moduleCache.entries()) {
    if (key.includes(normalizedPath) || key.includes(modulePath)) {
      moduleCache.delete(key);
    }
  }
}

async function hotReloadCommands(commandDir = 'commands') {
  const commandsPath = path.join(process.cwd(), commandDir);
  if (!fs.existsSync(commandsPath)) {
    console.log('Commands directory not found');
    return { reloaded: 0, errors: 0 };
  }
  
  let reloaded = 0;
  let errors = 0;
  
  try {
    // Get all command files
    const files = await fsPromises.readdir(commandsPath, { withFileTypes: true });
    
    for (const file of files) {
      if (file.isFile() && file.name.endsWith('.js')) {
        const filePath = path.join(commandsPath, file.name);
        try {
          // Clear cache for this file
          await clearModuleCache(filePath);
          
          // Try to reload
          const moduleUrl = `file://${filePath}`;
          const module = await import(moduleUrl);
          
          if (module.default) {
            const commandName = module.default.name || file.name.replace('.js', '');
            commandCache.set(commandName, module.default);
            reloaded++;
            console.log(`Hot-reloaded command: ${commandName}`);
          }
        } catch (error) {
          console.error(`Failed to hot-reload ${file.name}:`, error.message);
          errors++;
        }
      } else if (file.isDirectory()) {
        // Handle subdirectories (categories)
        const subDir = path.join(commandsPath, file.name);
        const subFiles = await fsPromises.readdir(subDir, { withFileTypes: true });
        
        for (const subFile of subFiles) {
          if (subFile.isFile() && subFile.name.endsWith('.js')) {
            const filePath = path.join(subDir, subFile.name);
            try {
              await clearModuleCache(filePath);
              
              const moduleUrl = `file://${filePath}`;
              const module = await import(moduleUrl);
              
              if (module.default) {
                const commandName = module.default.name || subFile.name.replace('.js', '');
                commandCache.set(commandName, module.default);
                reloaded++;
                console.log(`Hot-reloaded command: ${file.name}/${commandName}`);
              }
            } catch (error) {
              console.error(`Failed to hot-reload ${file.name}/${subFile.name}:`, error.message);
              errors++;
            }
          }
        }
      }
    }
    
    console.log(`Hot reload complete: ${reloaded} commands reloaded, ${errors} errors`);
    return { reloaded, errors };
    
  } catch (error) {
    console.error('Error during hot reload:', error);
    return { reloaded: 0, errors: 1 };
  }
}

/* -------------------- Fast Preserve Files -------------------- */
async function preserveEssentialFiles() {
  console.log('Preserving essential files...');
  
  const essentialFiles = [
    'settings.js',
    'config.json',
    '.env',
    'baileys_store.json'
  ];
  
  const essentialDirs = [
    'session',
    'data',
    'logs'
  ];
  
  const preserveDir = path.join(process.cwd(), 'tmp_preserve_fast');
  if (fs.existsSync(preserveDir)) {
    await fsPromises.rm(preserveDir, { recursive: true, force: true });
  }
  await fsPromises.mkdir(preserveDir, { recursive: true });
  
  const preserved = [];
  
  // Preserve essential files
  for (const file of essentialFiles) {
    const filePath = path.join(process.cwd(), file);
    try {
      if (fs.existsSync(filePath)) {
        const preservePath = path.join(preserveDir, file);
        await fsPromises.copyFile(filePath, preservePath);
        preserved.push(file);
        console.log(`Preserved file: ${file}`);
      }
    } catch (error) {
      console.warn(`Could not preserve ${file}:`, error.message);
    }
  }
  
  // Preserve essential directories
  for (const dir of essentialDirs) {
    const dirPath = path.join(process.cwd(), dir);
    try {
      if (fs.existsSync(dirPath)) {
        const stat = await fsPromises.stat(dirPath);
        if (stat.isDirectory()) {
          const preservePath = path.join(preserveDir, dir);
          await copyDirectoryFast(dirPath, preservePath);
          preserved.push(dir);
          console.log(`Preserved directory: ${dir}`);
        }
      }
    } catch (error) {
      console.warn(`Could not preserve ${dir}:`, error.message);
    }
  }
  
  return { preserveDir, preserved };
}

/* -------------------- Fast Directory Copy -------------------- */
async function copyDirectoryFast(src, dest, timeout = PRESERVE_TIMEOUT) {
  await fsPromises.mkdir(dest, { recursive: true });
  
  const entries = await fsPromises.readdir(src, { withFileTypes: true });
  const copyPromises = [];
  
  for (const entry of entries) {
    if (copyPromises.length > 10) {
      await Promise.all(copyPromises);
      copyPromises.length = 0;
    }
    
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyPromises.push(copyDirectoryFast(srcPath, destPath, timeout));
    } else {
      copyPromises.push(
        Promise.race([
          fsPromises.copyFile(srcPath, destPath),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Copy timeout')), timeout)
          )
        ]).catch(error => {
          console.warn(`Failed to copy ${srcPath}:`, error.message);
        })
      );
    }
  }
  
  if (copyPromises.length > 0) {
    await Promise.all(copyPromises);
  }
}

/* -------------------- ZIP Update -------------------- */
async function updateViaZip(zipUrl = UPDATE_ZIP_URL) {
  console.log(`Starting fast ZIP update from: ${zipUrl}`);
  
  const tmpDir = path.join(process.cwd(), 'tmp_update_fast');
  const zipPath = path.join(tmpDir, 'update.zip');
  const extractTo = path.join(tmpDir, 'extracted');
  
  try {
    // Clean up old temp dir
    if (fs.existsSync(tmpDir)) {
      await fsPromises.rm(tmpDir, { recursive: true, force: true });
    }
    await fsPromises.mkdir(tmpDir, { recursive: true });
    await fsPromises.mkdir(extractTo, { recursive: true });
    
    // Preserve essential files
    const { preserveDir, preserved } = await preserveEssentialFiles();
    console.log(`Preserved ${preserved.length} items: ${preserved.join(', ')}`);
    
    // Download with progress
    console.log('Downloading update...');
    let lastProgress = 0;
    
    await downloadWithProgress(zipUrl, zipPath, (percent, downloaded, total) => {
      if (percent >= lastProgress + 10 || percent === 100) {
        console.log(`Download: ${percent}%`);
        lastProgress = percent;
      }
    });
    
    // Verify download
    const stat = await fsPromises.stat(zipPath);
    if (stat.size === 0) {
      throw new Error('Downloaded file is empty');
    }
    console.log(`Downloaded ${stat.size} bytes`);
    
    // Extract ZIP
    console.log('Extracting ZIP...');
    await Promise.race([
      extractZip(zipPath, extractTo),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Extraction timeout')), EXTRACTION_TIMEOUT)
      )
    ]);
    
    // Find extracted root
    const entries = await fsPromises.readdir(extractTo);
    let root = extractTo;
    
    if (entries.length === 1) {
      const singleEntry = path.join(extractTo, entries[0]);
      const stat = await fsPromises.stat(singleEntry);
      if (stat.isDirectory()) {
        root = singleEntry;
        console.log(`Found root directory: ${entries[0]}`);
      }
    }
    
    // Copy files
    console.log('Copying files...');
    const copied = await copyEssentialFiles(root, process.cwd());
    
    // Restore preserved files
    console.log('Restoring preserved files...');
    await restorePreservedFiles(preserveDir);
    
    // Cleanup
    console.log('Cleaning up...');
    await fsPromises.rm(tmpDir, { recursive: true, force: true });
    
    return {
      success: true,
      copiedFiles: copied,
      url: zipUrl,
      fileCount: copied.length
    };
    
  } catch (error) {
    console.error('ZIP update failed:', error);
    
    // Cleanup on error
    try {
      if (fs.existsSync(tmpDir)) {
        await fsPromises.rm(tmpDir, { recursive: true, force: true });
      }
    } catch (cleanupError) {
      console.warn('Failed to cleanup temp dir:', cleanupError);
    }
    
    throw error;
  }
}

/* -------------------- Selective File Copy -------------------- */
async function copyEssentialFiles(src, dest) {
  const copied = [];
  const ignorePatterns = [
    /^node_modules$/,
    /^\.git$/,
    /^tmp/,
    /^temp/,
    /^logs$/,
    /^session$/,
    /^data$/,
    /^tmp_.*$/,
    /^\.env$/,
    /^settings\.js$/,
    /^config\.json$/,
    /^baileys_store\.json$/,
    /package-lock\.json$/,
    /yarn\.lock$/,
    /\.log$/,
    /\.cache$/
  ];
  
  async function copyDir(srcPath, destPath, relative = '') {
    try {
      const entries = await fsPromises.readdir(srcPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (ignorePatterns.some(pattern => pattern.test(entry.name))) {
          continue;
        }
        
        const entrySrc = path.join(srcPath, entry.name);
        const entryDest = path.join(destPath, entry.name);
        const entryRelative = relative ? path.join(relative, entry.name) : entry.name;
        
        if (entry.isDirectory()) {
          await fsPromises.mkdir(entryDest, { recursive: true });
          await copyDir(entrySrc, entryDest, entryRelative);
        } else {
          let shouldCopy = true;
          try {
            const srcStat = await fsPromises.stat(entrySrc);
            const destStat = await fsPromises.stat(entryDest);
            shouldCopy = srcStat.mtimeMs > destStat.mtimeMs;
          } catch {
            shouldCopy = true;
          }
          
          if (shouldCopy) {
            await fsPromises.copyFile(entrySrc, entryDest);
            copied.push(entryRelative);
            
            if (copied.length % 10 === 0) {
              console.log(`Copied ${copied.length} files...`);
            }
          }
        }
      }
    } catch (error) {
      console.warn(`Error copying from ${srcPath}:`, error.message);
    }
  }
  
  await copyDir(src, dest);
  return copied;
}

/* -------------------- Restore Preserved Files -------------------- */
async function restorePreservedFiles(preserveDir) {
  if (!fs.existsSync(preserveDir)) return;
  
  try {
    const entries = await fsPromises.readdir(preserveDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(preserveDir, entry.name);
      const destPath = path.join(process.cwd(), entry.name);
      
      if (entry.isDirectory()) {
        await copyDirectoryFast(srcPath, destPath);
      } else {
        await fsPromises.copyFile(srcPath, destPath);
      }
      console.log(`Restored: ${entry.name}`);
    }
    
    await fsPromises.rm(preserveDir, { recursive: true, force: true });
  } catch (error) {
    console.warn('Failed to restore preserved files:', error.message);
  }
}

/* -------------------- Main Command -------------------- */
export default {
  name: "update",
  description: "Update bot from n7 repository (size-controlled)",
  category: "owner",
  ownerOnly: true,

  async execute(sock, m, args) {
    const jid = m.key.remoteJid;
    const sender = m.key.participant || m.key.remoteJid;
    
    // Check if owner
    const isOwner = m.key.fromMe || sender.includes("947") || sender.includes("owner-number");
    if (!isOwner) {
      return sock.sendMessage(jid, {
        text: '❌ Only bot owner can use .update command'
      }, { quoted: m });
    }
    
    let statusMessage;
    try {
      // Send initial message
      statusMessage = await sock.sendMessage(jid, {
        text: '🔄 **WolfBot Update (Size-Controlled)**\nStarting update process...'
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
      
      await editStatus('🔄 **Checking update method...**');
      
      // Parse arguments
      const forceMethod = args[0]?.toLowerCase();
      const useZip = forceMethod === 'zip';
      const useGit = forceMethod === 'git';
      const softUpdate = args.includes('soft') || args.includes('no-restart');
      const hotReload = args.includes('hot') || args.includes('reload');
      
      let result;
      
      if (useGit || (!useZip && await hasGitRepo())) {
        await editStatus('🌐 **Using Git update (size-controlled)**\nCleaning before update...');
        result = await updateViaGit();
        
        if (result.alreadyUpToDate) {
          await editStatus(`✅ **Already Up to Date**\nBranch: ${result.branch}\nCommit: ${result.newRev?.slice(0, 7) || 'N/A'}\nSize: ${result.sizeAfter || 'unknown'} MB`);
          
          if (hotReload) {
            await editStatus('🔄 **Hot reloading commands...**');
            const reloadResult = await hotReloadCommands();
            await editStatus(`✅ **Hot reload complete**\nReloaded: ${reloadResult.reloaded} commands\nErrors: ${reloadResult.errors}`);
          }
          return;
        }
        
        const sizeMsg = result.sizeDiff >= 0 ? `(+${result.sizeDiff} MB)` : `(${result.sizeDiff} MB)`;
        await editStatus(`✅ **Git Update Complete**\nUpdated to: ${result.newRev?.slice(0, 7) || 'N/A'}\nSize: ${result.sizeAfter} MB ${sizeMsg}\nInstalling dependencies...`);
        
      } else {
        await editStatus('📥 **Using ZIP update method**\nDownloading latest version...');
        result = await updateViaZip();
        
        await editStatus(`✅ **ZIP Update Complete**\nFiles updated: ${result.fileCount || 0}\nInstalling dependencies...`);
      }
      
      // Install dependencies (skip if soft update)
      if (!softUpdate) {
        await editStatus('📦 **Installing dependencies...**');
        
        try {
          await run('npm ci --no-audit --no-fund --silent', 180000);
          await editStatus('✅ **Dependencies installed**');
        } catch (npmError) {
          console.warn('npm install failed, trying fallback:', npmError.message);
          try {
            await run('npm install --no-audit --no-fund --loglevel=error', 180000);
            await editStatus('⚠️ **Dependencies installed with warnings**');
          } catch {
            await editStatus('⚠️ **Could not install all dependencies**\nContinuing anyway...');
          }
        }
      }
      
      // Try hot reload first if requested
      if (hotReload || softUpdate) {
        try {
          await editStatus('🔄 **Attempting hot reload...**');
          const reloadResult = await hotReloadCommands();
          
          if (reloadResult.reloaded > 0) {
            await editStatus(`✅ **Hot reload successful!**\nReloaded: ${reloadResult.reloaded} commands\nErrors: ${reloadResult.errors}\n\nBot updated without restart! 🎉`);
          } else if (reloadResult.errors > 0) {
            await editStatus(`⚠️ **Hot reload had issues**\nReloaded: ${reloadResult.reloaded} commands\nErrors: ${reloadResult.errors}\n\nConsider restarting for full update.`);
          } else {
            await editStatus('✅ **Update Applied Successfully**\nRunning without restart.\nSome changes may need restart to take effect.');
          }
          
        } catch (reloadError) {
          console.error('Hot reload failed:', reloadError);
          await editStatus('⚠️ **Hot reload failed**\nFalling back to normal update...');
          
          await editStatus('✅ **Update Complete!**\nRestarting bot in 3 seconds...');
          
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Restart process
          await sock.sendMessage(jid, {
            text: '🔄 **Restarting Now...**\nBot will be back in a moment!'
          }, { quoted: m });
          
          try {
            await run('pm2 restart all', 10000);
          } catch {
            console.log('PM2 restart failed, exiting process...');
            process.exit(0);
          }
        }
      } else {
        // Normal restart
        await editStatus('✅ **Update Complete!**\nRestarting bot in 3 seconds...');
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Restart process
        await sock.sendMessage(jid, {
          text: '🔄 **Restarting Now...**\nBot will be back in a moment!'
        }, { quoted: m });
        
        try {
          await run('pm2 restart all', 10000);
        } catch {
          console.log('PM2 restart failed, exiting process...');
          process.exit(0);
        }
      }
      
    } catch (err) {
      console.error('Update failed:', err);
      
      let errorText = `❌ **Update Failed**\nError: ${err.message || err}\n\n`;
      
      if (err.message.includes('timeout')) {
        errorText += '**Reason:** Operation timed out\n';
        errorText += '**Solution:** Try again with better internet connection\n';
      } else if (err.message.includes('HTTP')) {
        errorText += '**Reason:** Download failed\n';
        errorText += '**Solution:** Check internet or try .update git\n';
      } else if (err.message.includes('Git')) {
        errorText += '**Reason:** Git operation failed\n';
        errorText += '**Solution:** Try .update zip instead\n';
      }
      
      errorText += '\n**Manual Update:**\n';
      errorText += `1. Visit: ${GIT_REPO_URL}\n`;
      errorText += '2. Download ZIP\n';
      errorText += '3. Extract and replace files\n';
      
      errorText += '\n**Try these options:**\n';
      errorText += '`.update git hot` - Git update with hot reload\n';
      errorText += '`.update zip soft` - ZIP update without restart\n';
      errorText += '`.update soft` - Update without restart\n';
      
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

/* -------------------- Extract Zip Utility -------------------- */
async function extractZip(zipPath, outDir) {
  if (process.platform === 'win32') {
    await run(`powershell -NoProfile -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${outDir}' -Force"`);
    return;
  }
  
  const tools = [
    { cmd: 'unzip', args: `-o "${zipPath}" -d "${outDir}"` },
    { cmd: '7z', args: `x "${zipPath}" -o"${outDir}" -y` },
    { cmd: 'busybox', args: `unzip "${zipPath}" -d "${outDir}"` },
  ];
  
  for (const tool of tools) {
    try {
      await run(`which ${tool.cmd}`);
      console.log(`Extracting with ${tool.cmd}...`);
      await run(`${tool.cmd} ${tool.args}`);
      return;
    } catch {
      continue;
    }
  }
  
  throw new Error('No extraction tool found');
}