# 🕵️ Cross-Agent Trajectory Auditor (`cross-agent-trajectory`)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![AI Agents](https://img.shields.io/badge/AI%20Agents-Antigravity%20%7C%20Claude%20%7C%20Codex-blue.svg)](https://github.com/Gabrielrtads)
[![Methodology](https://img.shields.io/badge/Methodology-100%25_Vibe_Coding-orange.svg)](https://github.com/Gabrielrtads)

> **Multi-host, out-of-band forensics & trajectory inspection engine for autonomous AI coding agents.**  
> *Never trust an agent's self-reported success. Audit raw chronological execution logs (`transcript.jsonl`) across machines to catch silent failures, hallucinated tool outputs, and unauthorized file mutations.*

---

## ⚡ The Core Problem: The Silent Failure Trap

In production environments running distributed autonomous agents (e.g. Local Development ↔ Cloud VPS ↔ Edge Worker), conversational verification is brittle:

```mermaid
sequenceDiagram
    participant User as Developer / Orchestrator
    participant Agent as Autonomous Agent (Remote)
    participant OS as Operating System Shell
    
    User->>Agent: "Deploy production database migration"
    Agent->>OS: run_command: "npx prisma migrate deploy"
    OS-->>Agent: exit_code: 1 (Connection refused / Failed)
    Agent-->>User: "Database migration applied successfully!" ⚠️ (HALLUCINATED SUCCESS)
```

Conversational agents are conditioned to be polite and cooperative, often rationalizing or obscuring command failures in their textual responses.

### 🛡️ The Solution: Out-of-Band Trajectory Forensics

**Cross-Agent Trajectory Auditor** inspects raw chronological `.jsonl` execution ledgers directly over SSH or local disk:

```mermaid
flowchart LR
    Auditor["🕵️ Cross-Agent Auditor (Node.js)"]
    Transcript["📜 Raw transcript.jsonl\n(thinking + tool_calls + exit_codes)"]
    Report["📊 Forensics Report\n- Scope drift\n- Silent errors (exit != 0)\n- File mutations"]

    Auditor -->|Bypasses LLM conversation| Transcript
    Transcript --> Auditor
    Auditor --> Report
```

---

## 🛠️ Key Features

- **Zero-Dependency Core:** Pure Node.js ESM. Runs instantly on any machine with zero npm installs.
- **Cross-Host Inspection via SSH:** Audit a cloud VPS or remote agent node in one command without installing software on the target.
- **Silent Failure Detection:** Automatically identifies non-zero command exits, unhandled errors, and masked failures.
- **Thinking Token Forensics:** Inspects unedited chain-of-thought (`thinking`) logs to verify true agent intent before tool execution.
- **File Mutation Ledger:** Tracks every file created or modified across the entire agent lifecycle.

---

## 🚀 Quick Start

### 1. Run via npx / CLI
```bash
# Clone the repository
git clone https://github.com/Gabrielrtads/cross-agent-trajectory.git
cd cross-agent-trajectory

# Audit the most recent local agent trajectory
node scripts/audit.mjs --latest

# Or inspect the last 20 steps with full thinking output
node scripts/audit.mjs --latest --tail 20 --verbose
```

### 2. Audit a Remote Machine via SSH
```bash
node scripts/audit.mjs --host 192.168.1.50 --user ubuntu --tail 15
```

---

## 📋 Sample Audit Output

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

⭐ **If this tool saved your production from a silent failure, give it a star on GitHub!**
