---
name: agent-log
description: Precision Trajectory Forensics & Silent Failure Detector for AI coding agents. Inspects raw transcripts, unedited thinking tokens, silent command failures, and searches keywords across sessions and machines (Windows ↔ Linux VPS).
category: multi-agent
tags: [agent-log, trajectory-forensics, multi-agent, cross-host, agent-governance, search, metal-detector]
---

# 📜 `agent-log`

> **The Trajectory Forensics & Silent Failure Engine for AI Coding Agents.**  
> Never rely on an agent's self-reported success. Audit raw chronological trajectory logs (`transcript.jsonl`) across machines to catch silent failures, hallucinated tool outputs, unauthorized mutations, or find needles in gigabytes of raw execution records.

---

## ⚡ When to Activate This Skill
- Whenever the user mentions `/agent-log`, `agent-log`, `auditar agente`, `verificar logs`, `buscar no histórico`, `detector de metais`, `o que o agente fez?`, `qual foi o erro?`, or `procurar comando`.
- When diagnosing an unexpected command failure, silent exit code != 0, or unhandled exception.
- When an agent on one machine (e.g. Windows) needs out-of-band proof of what an agent on another machine (e.g. Linux VPS) executed.
- When you need to retrieve past parameters, flags, or decisions without loading megabytes of logs into the active context window.

---

## 🧭 Why `agent-log`?

When orchestrating autonomous agents across multiple nodes (e.g. Local Workstation ↔ Cloud VPS ↔ Edge device), conversational validation fails:

- **The Silent Failure Trap:** An agent claims: *"Database migrated and service deployed successfully."* But underneath, the shell command exited with `code 1`, leaving production broken.
- **The Needle in the Haystack:** Looking for that one FFmpeg flag or API response from 3 days ago among megabytes of raw `.jsonl` files.
- **Context Window Protection:** Ingesting raw logs into the prompt causes memory bloat, high token costs, and reasoning degradation. `agent-log` runs outside the LLM at 0 token cost and returns only the physical proof.

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
