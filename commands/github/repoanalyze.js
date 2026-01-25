 import axios from 'axios';

export default {
    name: "repanalyze",
    aliases: ["space", "size", "diskspace", "analyzesize", "repoanalyze"],
    description: "Analyze what's consuming space in your repository",
    category: "git",
    
    async execute(sock, m, args, prefix, extras) {
        const chatId = m.key.remoteJid;
        
        if (!args[0]) {
            return sock.sendMessage(chatId, {
                text: `
╭━━📊 *REPOSITORY SPACE ANALYZER* 📊━━╮
┃  
┃  ${prefix}repanalyze <username/repo>
┃  
┃  Examples:
┃  ${prefix}repanalyze Silent-Wolf7/Silentwolf
┃  ${prefix}repanalyze facebook/react
┃  ${prefix}repanalyze https://github.com/user/repo
┃  
╰━━━━━━━━━━━━━━━━━━╯
`
            }, { quoted: m });
        }
        
        let loadingMessage = null;
        let repoPath = args[0];
        
        try {
            // Clean and parse the repository path
            repoPath = this.cleanGitHubUrl(repoPath);
            
            if (!this.isValidRepoPath(repoPath)) {
                throw new Error('Invalid format. Use: username/repository');
            }
            
            const [username, repoName] = repoPath.split('/');
            
            // Initial loading message
            loadingMessage = await sock.sendMessage(chatId, {
                text: `
╭━━📊 *ANALYZING REPOSITORY* 📊━━╮
┃  🔍 ${repoPath}
┃  ⏳ █▒▒▒▒▒▒▒▒▒ 10%
┃  🌙 Starting analysis...
╰━━━━━━━━━━━━━━━━━━╯
`
            });
            
            // Step 1: Fetch basic repo info
            await this.updateMessage(sock, chatId, loadingMessage, `
╭━━📊 *ANALYZING REPOSITORY* 📊━━╮
┃  🔍 ${repoPath}
┃  ⏳ ███▒▒▒▒▒▒▒ 25%
┃  🌙 Fetching repository data...
╰━━━━━━━━━━━━━━━━━━╯
`, 800);
            
            const repoData = await axios.get(`https://api.github.com/repos/${repoPath}`, {
                headers: { 
                    'User-Agent': 'WolfBot',
                    'Accept': 'application/vnd.github.v3+json'
                },
                timeout: 15000
            }).catch(err => {
                const status = err.response?.status;
                if (status === 404) {
                    throw new Error(`Repository "${repoPath}" not found or is private`);
                } else if (status === 403) {
                    throw new Error('GitHub API rate limit exceeded. Try again later.');
                } else if (status === 401) {
                    throw new Error('Access denied. Repository might be private.');
                } else {
                    throw new Error(`GitHub API error: ${status || 'Network error'}`);
                }
            });
            
            const repo = repoData.data;
            
            // Step 2: Fetch languages and structure in parallel
            await this.updateMessage(sock, chatId, loadingMessage, `
╭━━📊 *ANALYZING REPOSITORY* 📊━━╮
┃  🔍 ${repoPath}
┃  ⏳ ██████▒▒▒▒▒ 50%
┃  🌙 Analyzing tech stack...
╰━━━━━━━━━━━━━━━━━━╯
`, 800);
            
            const requests = [
                axios.get(`https://api.github.com/repos/${repoPath}/languages`, {
                    headers: { 'User-Agent': 'WolfBot' }
                }).catch(() => ({ data: {} })),
                
                axios.get(`https://api.github.com/repos/${repoPath}/contents`, {
                    headers: { 'User-Agent': 'WolfBot' }
                }).catch(() => ({ data: [] })),
                
                axios.get(`https://api.github.com/repos/${repoPath}/commits`, {
                    headers: { 'User-Agent': 'WolfBot' },
                    params: { per_page: 5 }
                }).catch(() => ({ data: [] }))
            ];
            
            const [languagesRes, contentsRes, commitsRes] = await Promise.all(requests);
            const languages = languagesRes.data;
            const contents = contentsRes.data;
            const commits = commitsRes.data;
            
            // Step 3: Analyze structure
            await this.updateMessage(sock, chatId, loadingMessage, `
╭━━📊 *ANALYZING REPOSITORY* 📊━━╮
┃  🔍 ${repoPath}
┃  ⏳ █████████▒▒ 85%
┃  🌙 Calculating space usage...
╰━━━━━━━━━━━━━━━━━━╯
`, 800);
            
            // Analyze repository structure
            const analysis = this.analyzeStructure(contents, repo.size);
            
            // Step 4: Generate report
            await this.updateMessage(sock, chatId, loadingMessage, `
╭━━📊 *ANALYZING REPOSITORY* 📊━━╮
┃  🔍 ${repoPath}
┃  ⏳ ████████████ 100%
┃  🌙 Generating report...
╰━━━━━━━━━━━━━━━━━━╯
`, 800);
            
            // Generate the final analysis report
            const report = this.generateAnalysisReport(
                repo, 
                languages, 
                analysis,
                commits,
                repoPath,
                prefix
            );
            
            // Send final message
            await sock.sendMessage(chatId, {
                text: report
            }, { edit: loadingMessage.key });
            
        } catch (error) {
            console.error('RepoAnalyze error:', error);
            
            // Format the error message
            let errorDisplay = args[0];
            if (errorDisplay.includes('github.com')) {
                const parsed = this.cleanGitHubUrl(errorDisplay);
                errorDisplay = parsed || args[0];
            }
            
            const errorText = `
╭━━❌ *SPACE ANALYSIS ERROR* ❌━━╮
┃  
┃  🔍 ${errorDisplay}
┃  🚨 ${error.message}
┃  
┃  💡 *Possible issues:*
┃  • Repository doesn't exist
┃  • Repository is private
┃  • GitHub API rate limit
┃  • Network connection
┃  
╰━━━━━━━━━━━━━━━━━╯
`;
            
            if (loadingMessage) {
                await sock.sendMessage(chatId, {
                    text: errorText
                }, { edit: loadingMessage.key });
            } else {
                await sock.sendMessage(chatId, {
                    text: errorText
                }, { quoted: m });
            }
        }
    },
    
    // Helper method to clean GitHub URLs
    cleanGitHubUrl(input) {
        if (!input) return input;
        
        // Remove .git extension
        input = input.replace(/\.git$/, '');
        
        // Extract from full GitHub URL
        if (input.includes('github.com')) {
            const match = input.match(/github\.com\/([^\/]+\/[^\/]+)/);
            if (match && match[1]) {
                return match[1];
            }
        }
        
        return input;
    },
    
    // Validate repository path format
    isValidRepoPath(path) {
        if (!path) return false;
        const parts = path.split('/');
        return parts.length === 2 && parts[0] && parts[1];
    },
    
    // Analyze repository structure
    analyzeStructure(contents, repoSizeKB) {
        const analysis = {
            totalItems: contents.length,
            files: [],
            directories: [],
            fileTypes: {},
            suspiciousItems: [],
            summary: {
                totalSizeMB: (repoSizeKB / 1024).toFixed(2),
                estimatedFiles: 0,
                hasNodeModules: false,
                hasBuildDir: false,
                hasLargeAssets: false
            }
        };
        
        if (!Array.isArray(contents)) return analysis;
        
        contents.forEach(item => {
            if (item.type === 'file') {
                analysis.files.push(item);
                
                // Track file types
                const ext = this.getFileExtension(item.name).toLowerCase();
                if (ext) {
                    analysis.fileTypes[ext] = (analysis.fileTypes[ext] || 0) + 1;
                }
                
                // Check for suspicious files
                if (item.size > 1048576) { // > 1MB
                    analysis.suspiciousItems.push({
                        type: 'large_file',
                        name: item.name,
                        sizeMB: (item.size / 1048576).toFixed(2)
                    });
                    if (['.mp4', '.avi', '.mov', '.mp3', '.wav'].includes(ext)) {
                        analysis.summary.hasLargeAssets = true;
                    }
                }
                
                analysis.summary.estimatedFiles++;
                
            } else if (item.type === 'dir') {
                analysis.directories.push(item);
                
                // Check for suspicious directories
                const dirName = item.name.toLowerCase();
                if (dirName.includes('node_modules')) {
                    analysis.summary.hasNodeModules = true;
                    analysis.suspiciousItems.push({
                        type: 'node_modules',
                        name: item.name,
                        sizeMB: 'Unknown (typically large)'
                    });
                } else if (['dist', 'build', 'output', 'target'].includes(dirName)) {
                    analysis.summary.hasBuildDir = true;
                    analysis.suspiciousItems.push({
                        type: 'build_dir',
                        name: item.name,
                        sizeMB: 'Unknown (can be large)'
                    });
                }
            }
        });
        
        return analysis;
    },
    
    getFileExtension(filename) {
        const parts = filename.split('.');
        return parts.length > 1 ? `.${parts.pop()}` : '';
    },
    
    calculateLanguageStats(languages) {
        const totalBytes = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0);
        if (totalBytes === 0) return [];
        
        return Object.entries(languages)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([lang, bytes]) => ({
                language: lang,
                percentage: ((bytes / totalBytes) * 100).toFixed(1),
                sizeMB: (bytes / (1024 * 1024)).toFixed(2)
            }));
    },
    
    generateAnalysisReport(repo, languages, analysis, commits, repoPath, prefix) {
        const languageStats = this.calculateLanguageStats(languages);
        const sizeMB = (repo.size / 1024).toFixed(2);
        
        // Activity analysis
        const daysSinceUpdate = Math.floor((new Date() - new Date(repo.pushed_at)) / (1000 * 60 * 60 * 24));
        const activityStatus = daysSinceUpdate < 7 ? '🔥 Very Active' : 
                               daysSinceUpdate < 30 ? '⚡ Active' : 
                               daysSinceUpdate < 90 ? '🟡 Moderate' : '💤 Inactive';
        
        // Repository health indicators
        const healthIndicators = [];
        if (analysis.summary.hasNodeModules) healthIndicators.push('⚠️ node_modules in repo');
        if (analysis.summary.hasBuildDir) healthIndicators.push('⚠️ Build directories');
        if (analysis.summary.hasLargeAssets) healthIndicators.push('⚠️ Large media files');
        if (repo.size > 100000) healthIndicators.push('⚠️ Very large (>100MB)');
        if (repo.open_issues_count > 50) healthIndicators.push('⚠️ Many open issues');
        
        // Top file types
        const topFileTypes = Object.entries(analysis.fileTypes)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([ext, count]) => `${this.getFileIcon(ext)} ${ext}: ${count} files`);
        
        // Generate progress bars for size analysis
        const sizeBar = this.generateSizeBar(repo.size);
        const efficiencyBar = this.generateEfficiencyBar(repo.size, repo.stargazers_count);
        
        // Compressibility estimate
        const compressibility = this.estimateCompressibility(analysis, languageStats);
        
        return `
╭━━📊 *SPACE ANALYSIS REPORT* 📊━━╮
┃  📁 ${repo.full_name}
┃  📦 ${sizeMB} MB total size
┃  ${sizeBar}
┃
╭━━💾 *SIZE BREAKDOWN* 💾━━╮
┃
┃  📄 Estimated Files: ${analysis.summary.estimatedFiles}
┃  📂 Directories: ${analysis.directories.length}
┃  🏷️ File Types: ${Object.keys(analysis.fileTypes).length}
┃
┃  📊 *Top File Types:*
${topFileTypes.length > 0 ? topFileTypes.map(t => `┃  • ${t}\n`).join('') : '┃  • No file type data\n'}
┃
╭━━💻 *TECH STACK SIZE* 💻━━╮
┃
${languageStats.length > 0 ? languageStats.map(l => `┃  ${this.getLanguageIcon(l.language)} ${l.language}: ${l.percentage}% (${l.sizeMB} MB)\n`).join('') : '┃  No language data available\n'}
┃
╭━━⚠️ *SPACE WASTAGE CHECK* ⚠️━━╮
┃
${healthIndicators.length > 0 ? 
  healthIndicators.map(indicator => `┃  ${indicator}\n`).join('') : 
  '┃  ✅ No major space issues detected\n'}
┃
${analysis.suspiciousItems.length > 0 ? `
╭━━🚨 *SUSPICIOUS ITEMS* 🚨━━╮
┃
${analysis.suspiciousItems.slice(0, 3).map(item => 
  `┃  • ${item.name} (${item.type.replace('_', ' ')}) ${item.sizeMB ? `- ${item.sizeMB} MB` : ''}\n`
).join('')}
${analysis.suspiciousItems.length > 3 ? `┃  ... and ${analysis.suspiciousItems.length - 3} more\n` : ''}
` : ''}
╭━━📈 *EFFICIENCY METRICS* 📈━━╮
┃
┃  ${efficiencyBar}
┃  📊 Size/Star Ratio: ${(repo.size / Math.max(repo.stargazers_count, 1)).toFixed(2)} KB per star
┃  📦 Estimated Clone Size: ${(repo.size / 3).toFixed(2)} MB (compressed)
┃  🗜️ Compressibility: ${compressibility}%
┃  ${activityStatus} (${daysSinceUpdate} days ago)
┃
╭━━💡 *OPTIMIZATION TIPS* 💡━━╮
┃
${this.getOptimizationTips(analysis, repo.size)}
┃
╭━━🔗 *QUICK ACTIONS* 🔗━━╮
┃
┃  📥 ${prefix}gitclone ${repo.full_name}
┃  📝 ${prefix}gitinfo ${repo.full_name}
┃  🗑️ Clean clone: ${prefix}gitclone --depth 1 ${repo.full_name}
┃  🔗 Repository: ${repo.html_url}
┃
╰━━━━━━━━━━━━━━━━━━╯

🌙 *Space analysis completed successfully*
${healthIndicators.length > 0 ? '⚠️ *Issues detected - check recommendations*' : '✅ *Repository space optimized*'}
`;
    },
    
    generateSizeBar(sizeKB) {
        let sizeLevel;
        let bar;
        
        if (sizeKB < 1024) { // < 1MB
            sizeLevel = 'Tiny';
            bar = '[██████████░░░░]';
        } else if (sizeKB < 10240) { // < 10MB
            sizeLevel = 'Small';
            bar = '[████████████░░]';
        } else if (sizeKB < 51200) { // < 50MB
            sizeLevel = 'Medium';
            bar = '[██████████████]';
        } else if (sizeKB < 102400) { // < 100MB
            sizeLevel = 'Large';
            bar = '[██████████████] 🔴';
        } else { // > 100MB
            sizeLevel = 'Very Large';
            bar = '[██████████████] 🚨';
        }
        
        return `${bar} ${sizeLevel}`;
    },
    
    generateEfficiencyBar(sizeKB, stars) {
        const efficiency = stars > 0 ? (stars * 1000) / sizeKB : 0;
        
        if (efficiency > 10) return '📈 High Efficiency [██████████░░░░]';
        if (efficiency > 5) return '📊 Good Efficiency [████████░░░░░░]';
        if (efficiency > 2) return '📉 Moderate [██████░░░░░░░░]';
        return '📉 Low Efficiency [███░░░░░░░░░░░]';
    },
    
    estimateCompressibility(analysis, languageStats) {
        let score = 70; // Base score
        
        // Deduct for issues
        if (analysis.summary.hasNodeModules) score -= 20;
        if (analysis.summary.hasBuildDir) score -= 15;
        if (analysis.summary.hasLargeAssets) score -= 10;
        
        // Add for text-based languages
        if (languageStats.some(l => ['JavaScript', 'TypeScript', 'Python', 'Java'].includes(l.language))) {
            score += 15;
        }
        
        return Math.max(30, Math.min(95, score));
    },
    
    getOptimizationTips(analysis, sizeKB) {
        const tips = [];
        
        if (analysis.summary.hasNodeModules) {
            tips.push('┃  • 🗑️ Remove node_modules from git (add to .gitignore)');
        }
        
        if (analysis.summary.hasBuildDir) {
            tips.push('┃  • 🏗️ Add dist/, build/, output/ to .gitignore');
        }
        
        if (analysis.summary.hasLargeAssets) {
            tips.push('┃  • 🖼️ Move large media files to CDN or releases');
        }
        
        if (sizeKB > 51200) { // > 50MB
            tips.push('┃  • 📦 Use GitHub Releases for binaries');
            tips.push('┃  • 🔍 Run git filter-branch to remove large files');
        }
        
        if (analysis.suspiciousItems.length > 5) {
            tips.push('┃  • 🧹 Clean up unused files and directories');
        }
        
        if (tips.length === 0) {
            tips.push('┃  • ✅ Repository is well optimized');
            tips.push('┃  • 📘 Consider adding documentation');
        }
        
        tips.push('┃  • 🌐 Use --depth 1 for faster cloning');
        
        return tips.join('\n');
    },
    
    getLanguageIcon(lang) {
        const icons = {
            'JavaScript': '📜',
            'TypeScript': '📘',
            'Python': '🐍',
            'Java': '☕',
            'C++': '⚡',
            'C': '⚡',
            'C#': '🎯',
            'Go': '🐹',
            'Rust': '🦀',
            'Ruby': '💎',
            'PHP': '🐘',
            'Swift': '🐦',
            'Kotlin': '🟣',
            'HTML': '🌐',
            'CSS': '🎨',
            'Shell': '🐚',
            'Dart': '🎯'
        };
        return icons[lang] || '💻';
    },
    
    getFileIcon(ext) {
        const icons = {
            '.js': '📜',
            '.ts': '📘',
            '.json': '📋',
            '.md': '📝',
            '.html': '🌐',
            '.css': '🎨',
            '.py': '🐍',
            '.java': '☕',
            '.cpp': '⚡',
            '.go': '🐹',
            '.rs': '🦀',
            '.rb': '💎',
            '.php': '🐘',
            '.sh': '🐚',
            '.yml': '⚙️',
            '.yaml': '⚙️',
            '.xml': '🗂️',
            '.txt': '📄',
            '.pdf': '📕',
            '.zip': '🗜️',
            '.tar': '🗜️',
            '.gz': '🗜️',
            '.jpg': '🖼️',
            '.png': '🖼️',
            '.mp4': '🎬',
            '.mp3': '🎵'
        };
        return icons[ext] || '📄';
    },
    
    async updateMessage(sock, chatId, message, newText, delayMs = 0) {
        if (delayMs > 0) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
        
        try {
            await sock.sendMessage(chatId, {
                text: newText,
                edit: message.key
            });
        } catch (error) {
            console.error('Update message error:', error);
        }
    }
};