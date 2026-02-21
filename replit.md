# Silent WolfBot - WhatsApp Bot

## Overview
Silent WolfBot is a WhatsApp bot designed to integrate AI capabilities, anime features, group management tools, and automation commands directly into WhatsApp. Built with Node.js and the Baileys library, its purpose is to serve as a versatile and intelligent assistant, enhancing user experience through advanced functionalities like AI-powered chat, media processing, and sophisticated group moderation.

## User Preferences
I prefer iterative development, with a focus on delivering functional, tested components.
When I ask for a feature, please propose a high-level design first.
Before making any significant changes to the codebase, please ask for my approval.
I prefer clear and concise explanations for complex technical concepts.
Do not make changes to files within the `node_modules` directory.
Always ensure that new features are accompanied by appropriate documentation.

## System Architecture
The bot runs on Node.js 20 (upgraded from 18 during import), using ESM modules. Its core logic in `index.js` manages WhatsApp connections and command routing. Commands are categorized in `commands/`, while configuration is handled by `settings.js` and `app.json`.

**Key Directories:**
*   `lib/`: Contains shared source modules.
*   `data/`: Stores runtime JSON data files.
*   `commands/`: Holds command handlers by category.

**Database Integration:**
*   **Supabase PostgreSQL (Primary)**: Bot data is stored in Supabase PostgreSQL for multi-user, cross-platform support. Connection auto-built from `SUPABASE_DB_PASSWORD` secret using Session Pooler (`aws-1-eu-west-1.pooler.supabase.com:5432`).
*   **Connection Priority**: `SUPABASE_DB_PASSWORD` env var (if set) > `DATABASE_URL` env var > hardcoded default password (built-in fallback). All three resolve to a Supabase connection.
*   **Cross-Platform & Zero-Config**: Works on Replit, Pterodactyl, and any platform with zero setup. The Supabase project ref, pooler host, user, port, and default password are all hardcoded in `lib/supabase.js`. Every bot instance automatically connects to the central Supabase database — no environment variables needed by end users.
*   **Fallback Mechanism**: The bot remains fully functional using local JSON even if PostgreSQL is unavailable.
*   **Module**: `lib/supabase.js` manages connections, health checks, and CRUD operations (name kept for backward compatibility).
*   **Tables**: 14 tables are defined, covering bot configurations, warnings, sudoers, chatbot data, antidelete, welcome/goodbye, group features, auto-configurations, and media storage.
*   **Per-Bot Isolation**: All tables use composite primary keys with `bot_id` to ensure complete data isolation between different bot instances. Tables scoped by bot_id: `bot_configs`, `sudoers`, `sudo_config`, `chatbot_config`, `chatbot_conversations`, `auto_configs`, `warnings`, `warning_limits`, `welcome_goodbye`, `group_features`, `antidelete_messages`, `antidelete_statuses`. Only `lid_map` and `media_store` remain global (shared across instances).
*   **Automatic Migration**: `initTables()` detects tables missing `bot_id` and migrates them independently (ADD COLUMN + DROP/ADD composite PK), ensuring safe upgrades from older schema versions.
*   **Periodic Cleanup**: Auto-cleans antidelete messages, statuses, and media older than 24 hours every 30 minutes to prevent storage bloat. Cleanup is scoped by bot_id.
*   **Disk Space Manager**: Monitors disk usage every 3 minutes, warns at 200MB free, critical cleanup at 80MB. Cleans session signal files (sender-keys, pre-keys), temp directories, viewonce/antidelete local media, log files, and backups. Proactive disk check runs before saveCreds to prevent ENOSPC errors. Emergency cleanup triggers on any ENOSPC write failure.

**Key Features & Implementations:**

*   **Antidelete System**: Caches messages to detect and resend deleted content, supporting both private and public modes. Media files stored in PostgreSQL `media_store` table instead of local disk. Message metadata stored in `antidelete_messages` and `antidelete_statuses` tables. All data auto-cleaned after 6 hours (messages) / 3 hours (statuses).
*   **W.O.L.F Chatbot**: Integrates multiple AI models (GPT-5, Copilot, Claude, Grok, Blackbox, Google Bard, Perplexity) with automatic fallback. It features conversational memory, context-aware prompting, and interactive media capabilities (image generation, music/video).
*   **Anti-ViewOnce System**: Detects and reveals ViewOnce messages, with options for private or public display. Sticker/emoji reply and reaction-based view-once capture is restricted to owner-only (non-owners silently ignored).
*   **Bot Mode System**: Allows operation in `public`, `groups`, `dms`, or `silent` (owner-only) modes.
*   **Welcome/Goodbye Systems**: Customizable messages for new/leaving group members.
*   **Anti-Demote/Promote Systems**: Real-time monitoring and control over group member demotions and promotions, with configurable actions like `warn`, `kick`, or `revert`.
*   **Auto-Join/Follow System**: Automatically adds users to configured groups or sends channel follow links.
*   **AI Video Effects**: Generates videos or images using ephoto360 effects via `mumaker`.
*   **JARVIS Voice AI**: Utilizes various AI models for responses with cascading TTS fallbacks and custom audio effects.
*   **Autotyping System**: Displays typing indicators in DMs and/or groups.
*   **Shazam Song Identification**: Identifies songs from audio or text using multiple APIs.
*   **NGL Attack**: An ethical hacking tool for sending anonymous messages.
*   **Sudo System**: Manages trusted users (sudos) with elevated command access, bypassing bot mode restrictions.
*   **Watermarks & Captions**: Adds "Silent Wolf" watermarks and "Created by WOLFBOT" captions to generated content.
*   **Persistent Warn System**: Stores per-group warnings and limits across bot restarts.
*   **Approve/Reject All**: Bulk approval or rejection of pending group join requests.
*   **Chatbot Whitelist System**: Allows whitelisting specific groups and DMs for the W.O.L.F chatbot.
*   **Code Execution**: Owner-only JavaScript (`js`) and Python (`py`) code executors with 15s timeout, auto-print last expression, and 3000-char output limit.
*   **Ethical Hacking Suite**: A comprehensive collection of 44+ commands across categories like RECON & OSINT, Network Analysis, Web Security, Vulnerability Checks, Password & Hash Tools, and Forensics & Analysis. WHOIS uses 3 cascading API fallbacks (RDAP, whoisjson, ip2whois). Subdomain finder uses DNS bruteforce (~90 names) + crt.sh Certificate Transparency.
*   **Disk Space Manager**: Monitors disk usage, performs periodic cleanups of temporary files and old media, and implements emergency cleanup on low disk space to prevent ENOSPC errors.

**Performance & Stability Optimizations:**
*   **Message Age Filtering**: All incoming messages are filtered at the top of the `messages.upsert` handler — messages older than 60 seconds (or older than the connection open time) are silently discarded to prevent processing historical synced messages on reconnection.
*   **ReactDev/ReactOwner Guards**: Both reaction handlers independently reject messages older than 30 seconds as double protection against reacting to past messages.
*   **Memory Leak Prevention**: Bounded caches (contactNames: 1000, lidPhoneCache: 400, groupMetadata: 20, viewOnce: 50, messageStore: 150). Memory trimming triggers at 250MB with aggressive mode at 350MB. Antidelete media stored as metadata-only in memory (base64 removed from RAM, fetched from PostgreSQL on demand). Antidelete cache cleanup every 2h (messages) / 1h (statuses). Proper interval cleanup on reconnect to prevent timer leaks.
*   **Authentication Backoff**: Exponential backoff for 401/403 authentication failures prevents reconnection loops. Delay doubles each attempt up to 5-minute maximum.
*   **Optimized Socket Config**: `generateHighQualityLinkPreview: false`, `keepAliveIntervalMs: 25000`, `MessageStore: 150` for balanced performance.

## External Dependencies
*   `@whiskeysockets/baileys`: WhatsApp Web API.
*   `axios`: HTTP requests.
*   `express`: Health check server.
*   `chalk`: Terminal output coloring.
*   `dotenv`: Environment variable loading.
*   `ffmpeg`: Media processing.
*   `mumaker`: Ephoto360 integration.
*   AudD, Keith Shazam, Ryzen Shazam APIs: Song identification.
*   GPT-5, Copilot, Claude, Grok, Blackbox, Google Bard, Perplexity APIs: AI chatbot.
*   Google TTS, StreamElements, VoiceRSS APIs: Text-to-speech.
*   NGL API: Anonymous messaging.
*   YouTube APIs (`apiskeith.top`): YouTube media handling.