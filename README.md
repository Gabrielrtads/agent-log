# 📜 agent-log

> **The Time Machine & Lie Detector for Vibe-Coders.**  
> *(Find that one magical command from 3 days ago, untangle messy chats, and catch your AI when it pretends everything worked).*

[![Vibe Coding Ready](https://img.shields.io/badge/Vibe_Coding-100%25_Friendly-ff007f?style=for-the-badge)](#)
[![skills.sh compatible](https://img.shields.io/badge/skills.sh-agent--log-6366f1?style=for-the-badge)](https://skills.sh)
[![Zero Config](https://img.shields.io/badge/Setup-Zero_Config-emerald?style=for-the-badge)](#)
[![Free](https://img.shields.io/badge/Token_Cost-$0_(Runs_Locally)-gold?style=for-the-badge)](#)
[![Supports Every Tool](https://img.shields.io/badge/Works_With-Cursor_|_Claude_|_Codex_|_Antigravity-purple?style=for-the-badge)](#)
[![GitHub stars](https://img.shields.io/github/stars/Gabrielrtads/agent-log?style=social)](https://github.com/Gabrielrtads/agent-log/stargazers)

```bash
# ⚡ 1-Click Install in your terminal:
npx skills add Gabrielrtads/agent-log

# Or run instantly:
npx agent-log --latest
```

---

## 😫 If You Vibe-Code With AI, You Know These 4 Nightmares:

When you're building apps with AI agents (Claude Code, Cursor, Codex, Antigravity, Windsurf), things feel like magic—until one of these happens:

```mermaid
flowchart TD
    subgraph Nightmares["😫 The 4 Big Vibe-Coding Headaches"]
        A["🧠 1. The AI Has Amnesia\nYou close the chat. That insane 10-flag video\nor database command it invented yesterday? Gone forever."]
        B["🌀 2. The Chat Gets Too Messy\nAfter 20 messages, the AI gets confused, hallucinates,\nand starts breaking files it wasn't supposed to touch."]
        C["🤥 3. The 'Everything Works!' Lie\nThe AI smiles and says 'Done! ✨'\n...but your screen is blank because a terminal command secretly crashed."]
        D["💸 4. The Token Panic\nThe chat gets so long it runs super slow and costs a fortune.\nYou clear the chat, and POOF—all your project context vanishes."]
    end

    Nightmares ==> Solution["🧲 agent-log: Your Instant History & Truth Search"]
```

1. **"The AI Has Amnesia":**  
   Yesterday, your AI spent 30 minutes tweaking an obscure terminal command to resize a video, set up Docker, or migrate your database. It finally worked! But today, you closed the chat window. Where did that magical command go?
2. **"The Chat Got Messy & Confused":**  
   You talked for an hour. Now the AI is mixing up folders, forgetting what you told it 5 minutes ago, and hallucinating answers.
3. **"The AI Lied (Silent Failures)":**  
   The AI cheerfully announces: *"Your app is deployed and running! 🚀"*. But when you open your browser, it's a 404 error. Why? Because deep in the background, a terminal command crashed with a red error, but the AI was too polite to admit it.
4. **"The Chat Got Too Expensive":**  
   Long chats burn tokens fast and make the AI dumber (the "lost in the middle" effect). So you click "New Chat" or run `/compact`—and immediately lose all the past context.

**`agent-log` is the fix.** It's like having a search bar for everything your AI *actually* did on your computer, with **zero token cost**.

---

## 💡 What Can You Do With It? (6 Simple Superpowers)

You don't need to know complicated devops words. Here is what `agent-log` actually does for you:

### 🔍 1. Find That "One Magical Command" from 3 Days Ago
Stop trying to make the AI guess the command again. Just search for a word you remember:
```bash
agent-log --search "ffmpeg" --all
```
Boom! In 1 second, it pulls up the exact command that worked yesterday.

### 🤥 2. The AI Lie Detector (Catch Hidden Errors)
Did the AI say *"Everything is done"* but your code still doesn't run?
```bash
agent-log --latest
```
It instantly shows you if any command secretly failed behind the scenes with a red exit error.

### 🧠 3. Read the AI's "Secret Thoughts" (Unfiltered Thinking)
Did the AI actually know what it was doing, or was it totally guessing?
```bash
agent-log --latest --verbose
```
This shows you the AI's raw `thinking` stream—what it thought to itself *before* typing its friendly answer to you.

### 📁 4. "What Files Did the AI Actually Touch?"
Before running your project, see the exact checklist of files created or modified in the last session:
```bash
agent-log --latest
```
No more guessing if the AI edited your `.env` or changed a config file without telling you.

### 💰 5. Search Past Chats for $0 (Zero Token Cost)
Instead of copying 200 lines of error logs into your chat (which costs money and clogs the AI's memory), `agent-log` searches everything directly on your hard drive. **Fast, offline, and 100% free.**

### 🌐 6. Peek Into What Your Remote Server Did
Have an AI agent running on a cloud VPS or another computer? Check what it did without opening SSH manually:
```bash
agent-log --host 100.98.233.126 --tail 10
```

---

## 🎮 Easy Cheat Sheet (Copy & Paste)

| What You Want to Do | Command to Run |
|---|---|
| **"What did the AI just do?"** | `agent-log --latest` |
| **"Find that command with keyword 'prisma'"** | `agent-log --search "prisma"` |
| **"Search across ALL past AI sessions"** | `agent-log --search "docker" --all` |
| **"Show me the last 15 actions with full details"** | `agent-log --latest --tail 15 --verbose` |
| **"Check what happened on my remote VPS"** | `agent-log --host <ip-address>` |

---

## 🚀 How It Works (In Plain English)

Every time an AI coding tool (like Claude Code, Cursor, Codex, or Antigravity) does something on your computer, it quietly writes a journal file in your system folder (`transcript.jsonl`).

Most people never look at these files because they are gigantic walls of scary-looking code.

**`agent-log` is just a friendly metal detector that reads those journals for you in half a second**, pulls out the juicy parts (what files changed, what commands ran, what broke), and shows them cleanly on your screen.

---

<div align="center">

### ⭐ Did this save you from a vibe-coding headache?
If `agent-log` helped you find a lost command or caught an AI bug, give it a star on GitHub! It helps more vibe-coders discover the tool.

[![Star on GitHub](https://img.shields.io/github/stars/Gabrielrtads/agent-log?style=social)](https://github.com/Gabrielrtads/agent-log/stargazers)

---

**Made with ❤️ for the Vibe-Coding Community by [Gabriel Toledo (@Gabrielrtads)](https://github.com/Gabrielrtads)**  
*Creator of [Barber.fi](https://painel.barberfi.com.br), `vibe-design-studio`, `kage-bunshin`, and `sta`.*

MIT Licensed — 100% Free & Open Source.

</div>
