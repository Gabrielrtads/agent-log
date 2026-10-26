# 📜 `agent-log`

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![AI Agents](https://img.shields.io/badge/AI%20Agents-Antigravity%20%7C%20Claude%20%7C%20Codex-blue.svg)](https://github.com/Gabrielrtads)
[![Methodology](https://img.shields.io/badge/Methodology-100%25_Vibe_Coding-orange.svg)](https://github.com/Gabrielrtads)

> **Like `git log`, but for AI coding agents.**  
> *Inspect raw trajectory transcripts, unedited thinking tokens, silent command failures, and file mutations across heterogeneous machines (Windows ↔ Linux VPS).*

---

### ☕ The "Dirty Glass in the Sink" Problem

> *"If a guest enters your house, drinks a glass of water, and leaves it in the sink, you only know someone was there if you walk into the kitchen and inspect the sink."*

When orchestrating autonomous coding agents across different operating systems (e.g. a Windows workstation for UI/dev and a remote Linux VPS running background workers 24/7), **agents do not have telepathy**. 

An agent on Windows has no idea what the agent on Linux just changed, unless it actively inspects the physical execution trail:

```mermaid
sequenceDiagram
    participant User as Developer / Agent A (Windows)
    participant Agent as Autonomous Agent B (Linux VPS)
    participant OS as VPS Shell / Docker
    
    User->>Agent: "Apply database migration & restart container"
    Agent->>OS: run_command: "docker compose restart backend"
    OS-->>Agent: exit_code: 1 (Container failed to bind port)
    Agent-->>User: "Service restarted successfully!" ⚠️ (HALLUCINATED SUCCESS)
```

Conversational agents are polite by design. They often obscure or rationalize shell errors in their conversational replies. 

**`agent-log`** bypasses the polite conversational layer and reads the raw, unedited chronological `.jsonl` transcript directly from disk or over SSH.

---

## 🛠️ What `agent-log` Inspects

1. **Silent Failure Detection:** Automatically catches commands with non-zero exit codes (`exit_code != 0`), unhandled promise rejections, and stderr errors hidden by the LLM.
2. **Thinking Token Forensics:** Inspects raw `thinking` tokens before tools were called to understand the agent's real hypotheses.
3. **Physical File Mutation Ledger:** Lists every file created, modified, or deleted across the session.
4. **Cross-Host Inspection via SSH:** Connects to any remote machine or VPS in one command without installing software on the target.

---

## 🚀 Quick Start

### 1. Run via CLI
```bash
# Clone the repository
git clone https://github.com/Gabrielrtads/agent-log.git
cd agent-log

# Inspect the most recent local agent session
node scripts/audit.mjs --latest

# Or view the last 15 steps with full thinking output
node scripts/audit.mjs --latest --tail 15 --verbose
```

### 2. Inspect a Remote VPS via SSH
```bash
node scripts/audit.mjs --host 192.168.1.50 --user ubuntu --tail 10
```

---

## 📋 Sample Output

```text
============================================================
🕵️  TRAJECTORY AUDIT REPORT: Local (transcript.jsonl)
============================================================
📊 Steps Analyzed:    905
🛠️  Tool Calls:        388
📝 File Mutations:     84
⚠️  Detected Failures:  33

📂 Files Modified/Created:
   - /app/src/server.ts
   - /app/prisma/schema.prisma

🔍 RECENT EXECUTION LOG (Last 3 steps):
------------------------------------------------------------
[23:02:06] [PLANNER_RESPONSE] (MODEL)
  🧠 Thinking: Verifying database migration before signaling completion...
  🔧 Tool: run_command
  💬 Content: {"CommandLine": "npx prisma migrate status"}
============================================================
```

---

## 📄 License & Author

MIT License. Designed and built by **Gabriel Toledo ([@Gabrielrtads](https://github.com/Gabrielrtads))**, creator of [Barber.fi](https://painel.barberfi.com.br), `kage-bunshin`, and `sta`.

⭐ **If `agent-log` saved your production from a silent failure, star the repo on GitHub!**
