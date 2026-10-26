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
flowchart TD
    subgraph Windows["💻 Local Node (Windows 11) - Studio & UI"]
        AgentLocal["🤖 Local Agent (Claude / Codex / Gemini)"]
        AgentLogCLI["📜 CLI agent-log (audit.mjs)"]
        AgentLocal -->|Needs to verify state| AgentLogCLI
    end

    subgraph Tunnel["🛡️ Secure Private Network (Tailscale SSH)"]
        direction LR
        SSHOut["SSH Out-of-Band (Port 22)"]
    end

    subgraph VPS["🐧 Remote Node (Linux VPS) - 24/7 Engine"]
        AgentVPS["🤖 Remote Agent (Workers / Docker)"]
        TerminalOS["⚙️ Shell / Docker / Postgres"]
        SinkLog[("🚰 THE SINK:\ntranscript.jsonl\n(thinking + exit_codes + mutations)")]
        
        AgentVPS -->|Executes actions silently| TerminalOS
        TerminalOS -->|Appends raw physical log| SinkLog
    end

    AgentLogCLI ==>|Secure tunnel without opening chat| SSHOut
    SSHOut ==>|Dissects real execution ledger| SinkLog
    SinkLog -.->|Returns clean forensics report| AgentLogCLI
```

---

## ⚡ The Silent Failure Trap

Conversational agents are conditioned to be polite and cooperative, often rationalizing or obscuring command failures in their textual responses:

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

**`agent-log`** bypasses the polite conversational layer and reads the raw, unedited chronological `.jsonl` transcript directly from disk or over SSH.

---

## 🔬 Anatomia da Auditoria (What `agent-log` Inspects)

```mermaid
graph LR
    JSONL["📜 transcript.jsonl\n(Raw Execution Ledger)"]

    JSONL --> P1["🧠 1. Unedited Thinking\n(Real intent before conversational smoothing)"]
    JSONL --> P2["🔧 2. Tool Calls\n(Exact commands dispatched to the shell)"]
    JSONL --> P3["🚨 3. Real Exit Code\n(Detects exit != 0 concealed in chat)"]
    JSONL --> P4["📂 4. Mutation Ledger\n(Files created, edited, or destroyed)"]

    P1 & P2 & P3 & P4 --> Report["📊 Final Forensics Report:\nZero Hallucination of Success"]
```

---

## ⚖️ Blind Faith vs. Zero-Trust Verification

```mermaid
flowchart LR
    subgraph Bad["❌ Blind Faith (Chat-Only)"]
        A1["Agent A"] -->|Ask in chat: 'Did deploy pass?'| B1["Agent B"]
        B1 -->|Polite reply: 'Yes, everything works!'| A1
        A1 --> Boom["💥 Production Outage\n(Command failed silently)"]
    end

    subgraph Good["✅ Zero-Trust with agent-log"]
        A2["Agent A"] -->|Runs agent-log --host vps| Log["📜 transcript.jsonl"]
        Log -->|Physical proof: exit_code = 0| A2
        A2 --> Win["🚀 Deployment validated with evidence"]
    end
```

---

## 🛠️ Key Features

- **Zero-Dependency Core:** Pure Node.js ESM. Runs instantly on any machine with zero npm installs.
- **Cross-Host Inspection via SSH:** Connects to any remote VPS or machine in one command without installing software on the target.
- **Silent Failure Detection:** Automatically identifies non-zero command exits, unhandled errors, and masked failures.
- **Thinking Token Forensics:** Inspects unedited chain-of-thought (`thinking`) logs to verify true agent intent before tool execution.
- **File Mutation Ledger:** Tracks every file created, modified, or deleted across the session.

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
