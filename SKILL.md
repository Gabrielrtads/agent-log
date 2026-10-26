---
name: agent-log
description: Like git log, but for AI coding agents. Inspect raw trajectory transcripts, thinking tokens, and silent failures across heterogeneous machines (Windows ↔ Linux VPS).
category: multi-agent
tags: [agent-log, trajectory-forensics, multi-agent, cross-host, agent-governance]
---

# 📜 `agent-log`

> **Like `git log`, but for AI coding agents.**  
> Never rely on an agent's self-reported success. Audit raw chronological trajectory logs (`transcript.jsonl`) across machines to catch silent failures, hallucinated tool outputs, and unauthorized file mutations.

---

## 🧭 Why `agent-log`?

When orchestrating autonomous agents across multiple nodes (e.g. Local Workstation ↔ Cloud VPS ↔ Edge device), conversational validation fails:

- **The Silent Failure Trap:** An agent claims: *"Database migrated and service deployed successfully."* But underneath, the shell command exited with `code 1`, leaving production in an inconsistent state.
- **Hallucinated State:** An LLM may assume a file exists or an API call succeeded without checking real stderr/stdout.
- **Scope Drift:** Background agents modifying files outside their assigned worktree.

`agent-log` operates out-of-band: an auditing agent bypasses the target agent's conversational interface and inspects its raw execution ledger directly.

---

## 🚀 Quick Start & CLI Usage

### 1. Audit Local Agent Trajectory
```bash
# Automatically detects the most recent agent session (Antigravity, Claude Code, etc.)
node scripts/audit.mjs --latest

# Audit a specific session transcript
node scripts/audit.mjs --file /path/to/transcript.jsonl --tail 20 --verbose
```

### 2. Audit Remote Agent via SSH (Cross-Host)
```bash
# Audits the active agent on a remote VPS or machine
node scripts/audit.mjs --host 192.168.1.100 --user dev --tail 15
```

---

## 📄 License & Contributing

MIT License. Created by [Gabriel Toledo (@Gabrielrtads)](https://github.com/Gabrielrtads).
Contributions welcome!
