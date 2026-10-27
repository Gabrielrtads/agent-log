---
name: agent-log
description: The Time Machine & Lie Detector for Vibe-Coders. Searches past commands (The Metal Detector), catches AI silent failures (The Glass in the Sink), inspects secret thinking tokens, and untangles messy chats across sessions and machines.
category: multi-agent
tags: [agent-log, vibe-coding, ai-agents, time-machine, lie-detector, search, zero-tokens, glass-in-the-sink, metal-detector]
---

# 📜 `agent-log`

> **The Time Machine & Lie Detector for Vibe-Coders.**  
> Never guess what your AI actually did. Search through past commands, catch silent errors when the AI claims everything works, and find lost context from 3 days ago at $0 token cost.

---

## 🧲 The Two Golden Rules

### 1. The Needle in the Haystack (The Metal Detector)
> *"Your past AI chats are a giant haystack of messy text. What you actually need is the needle: that one magical command that worked. `agent-log` is your metal detector."*

### 2. The Dirty Glass in the Sink (Physical Proof)
> *"If a guest enters your house, drinks a glass of water, and leaves it in the sink, you don't ask them if they were thirsty. You just look at the sink."*  
> Never ask the AI in the chat if it worked. Check the sink on your hard drive with `agent-log --latest`.

---

## ⚡ When to Use This Skill
- When you closed the terminal and lost that one magical command that worked yesterday.
- When the chat got too long, confusing, or gave a context limit error.
- When the AI said *"Everything is fixed! ✨"* but your app still crashes or shows a blank screen.
- When you want to see what files the AI created or edited before you test your app.
- When you want to see what an AI agent did on your remote server or VPS.

---

## 🎮 Cheat Sheet

### 1. Find a Lost Command Across Past Chats
```bash
agent-log --search "keyword" --all
```

### 2. Check the Most Recent Actions & Catch Hidden Errors
```bash
agent-log --latest
```

### 3. Read the AI's Secret Thoughts (Unfiltered Thinking)
```bash
agent-log --latest --verbose
```

### 4. Peek into a Remote Server via SSH
```bash
agent-log --host <ip-address> --tail 10
```

---

## 📄 License & Author

MIT License. Created by [Gabriel Toledo (@Gabrielrtads)](https://github.com/Gabrielrtads).
Free & open source for all vibe-coders!
