---
name: cross-agent-trajectory
description: Multi-host, out-of-band forensics & trajectory inspection engine for autonomous AI coding agents (Antigravity, Claude Code, OpenAI Codex). Audits thinking, tool calls, silent failures, and file mutations across heterogeneous machines (Linux VPS, macOS, Windows).
category: multi-agent
tags: [trajectory-auditing, forensics, multi-agent, cross-host, agent-governance]
---

# 🕵️ Cross-Agent Trajectory Auditor (`cross-agent-trajectory`)

> **Multi-host, out-of-band forensics & trajectory inspection engine for autonomous AI coding agents.**  
> Never rely on an agent's self-reported success. Audit raw chronological trajectory logs (`transcript.jsonl`) across machines to catch silent failures, hallucinated tool outputs, and unauthorized file mutations.

---

## 🧭 Why Trajectory Forensics?

When orchestrating autonomous agents across multiple nodes (e.g. Local Workstation ↔ Cloud VPS ↔ Edge device), conversational validation fails:

- **The Silent Failure Trap:** An agent claims: *"Database migrated and service deployed successfully."* But underneath, the shell command exited with `code 1`, leaving production in an inconsistent state.
- **Hallucinated State:** An LLM may assume a file exists or an API call succeeded without checking real stderr/stdout.
- **Scope Drift:** Background agents modifying files outside their assigned worktree.

**Cross-Agent Trajectory Forensics** operates out-of-band: an auditing agent bypasses the target agent's conversational interface and inspects its raw execution ledger directly.

---

## 🛠️ The 4 Pillars of Agent Trajectory Audit

1. **Scope Integrity:** Verifies all `write_file`, `edit_file`, and shell commands operated within the authorized directory.
2. **Silent Failure Detection:** Scans all tool executions for non-zero exit codes, unhandled exceptions, and stderr warnings hidden by polite LLM responses.
3. **Reasoning Verification (`thinking`):** Inspects raw, unedited chain-of-thought tokens prior to tool execution to detect conflicting assumptions.
4. **Credential Isolation:** Ensures tokens, OAuth secrets, and private keys were not leaked into transcript logs.

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
