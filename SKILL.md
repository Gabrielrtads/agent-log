---
name: agent-log
description: Precision Trajectory Forensics & Silent Failure Detector for AI coding agents. Inspects raw transcripts, unedited thinking tokens, silent command failures, and searches keywords across sessions and machines (Windows ↔ Linux VPS).
category: multi-agent
tags: [agent-log, trajectory-forensics, multi-agent, cross-host, agent-governance, search, metal-detector]
---

# 📜 `agent-log`

> **The Trajectory Forensics & Silent Failure Engine for AI Coding Agents.**  
> *(Like `git log`, but for unedited LLM thinking tokens, terminal tool calls, and cross-host execution audits).*

---

## 🩸 The Core Developer Pain It Solves
- **Terminal Amnesia:** You closed the terminal tab and lost that 12-flag FFmpeg or Docker command the agent spent 40 minutes perfecting.
- **Scrambled Multi-Turn Chats:** As conversations drag past 30 turns, the LLM hallucinates past steps, mixes up files, and forgets architectural rules.
- **The `/compact` Context Trap:** Compacting sessions saves tokens but erases the exact API payloads, error traces, and CLI parameters needed to debug.
- **The Polite Silent Failure:** The agent claims *"Deployed successfully!"* while deep in the shell a script died with `exit code: 1`.

---

## ⚡ When to Activate This Skill
- Whenever the user mentions `/agent-log`, `agent-log`, `auditar agente`, `verificar logs`, `buscar no histórico`, `detector de metais`, `o que o agente fez?`, `qual foi o erro?`, or `procurar comando`.
- When diagnosing an unexpected command failure, silent exit code != 0, or unhandled exception.
- When an agent on one machine (e.g. Windows) needs out-of-band proof of what an agent on another machine (e.g. Linux VPS) executed.
- When you need to retrieve past parameters, flags, or architectural decisions without loading megabytes of logs into the active context window.

---

## 💡 6 Killer Use Cases

1. **Decision Archaeology:** Search `--search "keyword"` to read the agent's raw `thinking` tokens from days ago to understand *why* a hack or workaround was implemented.
2. **Ephemeral Parameter Recovery:** Resurrect complex one-liners (FFmpeg codecs, OpenSSL flags, Prisma edge cases) in seconds.
3. **Post-Mortem Root Cause Analysis:** Find out who modified a file, ran a dangerous `rm`, or triggered `exit code: 1` during a 3 AM crash.
4. **Zero-Token Selective Decompaction:** Recover critical API outputs or error logs from past sessions without re-stuffing 50,000 tokens into the prompt.
5. **Asynchronous Swarm Handoff:** Pass execution state from a day agent on Windows to a night agent on a Linux VPS via Tailscale SSH in 200 tokens.
6. **Thinking Token Forensics:** Inspect whether the agent was genuinely confident or caught in an uncertain hallucination loop.

---

## 🚀 Quick Start & Commands

### 1. The Metal Detector (Search Across Sessions)
```bash
# Search keyword in the latest session
node scripts/audit.mjs --search "prisma migrate"

# Search keyword across ALL local agent harnesses (Gemini, Claude, Codex)
node scripts/audit.mjs --search "ffmpeg" --all
```

### 2. Audit Trajectory & Silent Failures
```bash
# Automatically detects the most recent agent session
node scripts/audit.mjs --latest

# View the last 20 steps with full unedited thinking output
node scripts/audit.mjs --latest --tail 20 --verbose
```

### 3. Remote Audit via SSH (Cross-Host)
```bash
# Audits the active agent on a remote VPS or server
node scripts/audit.mjs --host 100.98.233.126 --user ubuntu --tail 15
```

---

## 📄 License & Contributing

MIT License. Created by [Gabriel Toledo (@Gabrielrtads)](https://github.com/Gabrielrtads).
Contributions welcome!
