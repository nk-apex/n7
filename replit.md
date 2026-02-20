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
*   **Connection Priority**: `DATABASE_URL` env var (if set) > auto-built Supabase URL (from `SUPABASE_DB_PASSWORD`) > no database (local JSON fallback).
*   **Cross-Platform**: Works on Replit, Pterodactyl, and any platform. Only requires `SUPABASE_DB_PASSWORD` to be set as an environment variable/secret.
*   **Fallback Mechanism**: The bot remains fully functional using local JSON even if PostgreSQL is unavailable.
*   **Module**: `lib/supabase.js` manages connections, health checks, and CRUD operations (name kept for backward compatibility).
*   **Tables**: 14 tables are defined, covering bot configurations, warnings, sudoers, chatbot data, antidelete, welcome/goodbye, group features, auto-configurations, and media storage.
*   **Periodic Cleanup**: Auto-cleans antidelete messages, statuses, and media older than 24 hours every 30 minutes to prevent storage bloat.

**Key Features & Implementations:**

*   **Antidelete System**: Caches messages to detect and resend deleted content, supporting both private and public modes. Media files stored in PostgreSQL `media_store` table instead of local disk. Message metadata stored in `antidelete_messages` and `antidelete_statuses` tables. All data auto-cleaned after 24 hours.
*   **W.O.L.F Chatbot**: Integrates multiple AI models (GPT-5, Copilot, Claude, Grok, Blackbox, Google Bard, Perplexity) with automatic fallback. It features conversational memory, context-aware prompting, and interactive media capabilities (image generation, music/video).
*   **Anti-ViewOnce System**: Detects and reveals ViewOnce messages, with options for private or public display.
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
*   **Ethical Hacking Suite**: A comprehensive collection of 44 commands across categories like RECON & OSINT, Network Analysis, Web Security, Vulnerability Checks, Password & Hash Tools, and Forensics & Analysis.
*   **Disk Space Manager**: Monitors disk usage, performs periodic cleanups of temporary files and old media, and implements emergency cleanup on low disk space to prevent ENOSPC errors.

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