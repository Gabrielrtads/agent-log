#!/usr/bin/env node

/**
 * Cross-Agent Trajectory Auditor & Forensics Engine (agent-log)
 * Multi-host, cross-harness trajectory inspection & forensics for AI coding agents.
 * 
 * Supports local and remote (.jsonl) session transcripts (Antigravity/Gemini, Claude Code, Codex).
 * 
 * Features:
 *   - "Needle in a Haystack" Metal Detector: search terms, tool arguments, or thinking tokens across sessions.
 *   - Silent Failure Detection: exposes hidden exit != 0 failures concealed behind polite conversational chat.
 *   - Unedited Thinking Forensics: reads raw reasoning before conversational smoothing.
 *   - Cross-Vendor & Multi-Host: Windows workstation ↔ Linux VPS via SSH.
 * 
 * Usage:
 *   node scripts/audit.mjs --latest
 *   node scripts/audit.mjs --search "ffmpeg"
 *   node scripts/audit.mjs --grep "prisma" --all
 *   node scripts/audit.mjs --file <path-to-transcript.jsonl>
 *   node scripts/audit.mjs --host <remote-ip> [--user <username>] [--search <term>]
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';

const args = process.argv.slice(2);

function getArg(flag, defaultValue = null) {
  const idx = args.indexOf(flag);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return defaultValue;
}

const hasFlag = (flag) => args.includes(flag);

function printHelp() {
  console.log(`
📜 agent-log: Cross-Agent Trajectory Auditor & Metal Detector

Usage:
  node scripts/audit.mjs [options]

Core Options:
  --latest               Inspect the most recent local trajectory transcript.
  --search, --grep <str> Search keyword across unedited thinking, tool arguments, and output (Metal Detector mode).
  --all                  In search mode, scan across all known local AI agent workspaces (Gemini, Claude, Codex).
  --file <path>          Path to a specific transcript.jsonl file.
  --host <ip/hostname>   Remote host to inspect via SSH.
  --user <user>          SSH username (default: root).
  --tail <num>           Number of steps to display (default: 10).
  --verbose              Display full thinking and output contents.
  --help                 Show this help message.

Examples:
  node scripts/audit.mjs --latest
  node scripts/audit.mjs --search "asaas"
  node scripts/audit.mjs --grep "exit code 1" --all
  node scripts/audit.mjs --host 100.98.233.126 --tail 15
`);
}

if (hasFlag('--help')) {
  printHelp();
  process.exit(0);
}

const tailCount = parseInt(getArg('--tail', '10'), 10);
const isVerbose = hasFlag('--verbose');
const searchQuery = getArg('--search') || getArg('--grep');
const searchAll = hasFlag('--all');

function parseTranscriptLines(lines) {
  const steps = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      steps.push(JSON.parse(line));
    } catch {
      // Ignore partial or corrupted lines
    }
  }
  return steps;
}

function analyzeTrajectory(steps) {
  let silentFailures = 0;
  let toolCallsCount = 0;
  let mutationsCount = 0;
  const mutations = [];

  for (const s of steps) {
    // Check tool calls
    if (s.tool_calls && Array.isArray(s.tool_calls)) {
      toolCallsCount += s.tool_calls.length;
      for (const tc of s.tool_calls) {
        if (['write_file', 'edit_file', 'create_or_update_file'].includes(tc.name)) {
          mutationsCount++;
          if (tc.arguments && tc.arguments.Path) {
            mutations.push(tc.arguments.Path);
          }
        }
      }
    }

    // Check status / silent errors
    if (s.status === 'ERROR' || (s.content && typeof s.content === 'string' && s.content.includes('Command exited with code') && !s.content.includes('code 0'))) {
      silentFailures++;
    }
  }

  return {
    totalSteps: steps.length,
    toolCallsCount,
    mutationsCount,
    mutations: Array.from(new Set(mutations)),
    silentFailures
  };
}

function renderReport(steps, sourceLabel) {
  const analysis = analyzeTrajectory(steps);

  console.log(`\n============================================================`);
  console.log(`🕵️  TRAJECTORY AUDIT REPORT: ${sourceLabel}`);
  console.log(`============================================================`);
  console.log(`📊 Steps Analyzed:    ${analysis.totalSteps}`);
  console.log(`🛠️  Tool Calls:        ${analysis.toolCallsCount}`);
  console.log(`📝 File Mutations:     ${analysis.mutationsCount}`);
  console.log(`⚠️  Detected Failures:  ${analysis.silentFailures}`);
  
  if (analysis.mutations.length > 0) {
    console.log(`\n📂 Files Modified/Created:`);
    for (const file of analysis.mutations) {
      console.log(`   - ${file}`);
    }
  }

  console.log(`\n🔍 RECENT EXECUTION LOG (Last ${Math.min(tailCount, steps.length)} steps):`);
  console.log(`------------------------------------------------------------`);

  const recent = steps.slice(-tailCount);
  for (const s of recent) {
    const time = s.created_at ? new Date(s.created_at).toLocaleTimeString() : 'N/A';
    const type = s.type || 'STEP';
    const source = s.source || 'AGENT';
    
    console.log(`\n[${time}] [${type}] (${source})`);
    
    if (s.thinking) {
      const thinkingPreview = isVerbose ? s.thinking : s.thinking.slice(0, 150).replace(/\n/g, ' ') + '...';
      console.log(`  🧠 Thinking: ${thinkingPreview}`);
    }

    if (s.tool_calls && s.tool_calls.length > 0) {
      for (const tc of s.tool_calls) {
        console.log(`  🔧 Tool: ${tc.name}`);
        if (isVerbose) console.log(`     Args:`, JSON.stringify(tc.arguments));
      }
    }

    if (s.content) {
      const contentStr = typeof s.content === 'string' ? s.content : JSON.stringify(s.content);
      const contentPreview = isVerbose ? contentStr : contentStr.slice(0, 140).replace(/\n/g, ' ') + '...';
      console.log(`  💬 Content: ${contentPreview}`);
    }

    if (s.status === 'ERROR') {
      console.log(`  ❌ STATUS: FAILED/ERROR`);
    }
  }
  console.log(`\n============================================================\n`);
}

function searchInSteps(steps, query, sourceLabel) {
  const needle = query.toLowerCase();
  const matches = [];

  for (let idx = 0; idx < steps.length; idx++) {
    const s = steps[idx];
    const matchDetails = [];

    if (s.thinking && s.thinking.toLowerCase().includes(needle)) {
      matchDetails.push({ field: 'thinking', text: s.thinking });
    }
    if (s.content && typeof s.content === 'string' && s.content.toLowerCase().includes(needle)) {
      matchDetails.push({ field: 'content', text: s.content });
    }
    if (s.tool_calls && Array.isArray(s.tool_calls)) {
      for (const tc of s.tool_calls) {
        const rawTc = JSON.stringify(tc);
        if (rawTc.toLowerCase().includes(needle)) {
          matchDetails.push({ field: `tool:${tc.name}`, text: rawTc });
        }
      }
    }

    if (matchDetails.length > 0) {
      matches.push({ stepIndex: idx, step: s, details: matchDetails });
    }
  }

  return matches;
}

function findLocalTranscripts(singleLatest = false) {
  const home = os.homedir();
  const searchDirs = [
    path.join(home, '.gemini', 'antigravity', 'brain'),
    path.join(home, '.gemini', 'antigravity-cli', 'brain'),
    path.join(home, '.gemini', 'antigravity-ide', 'brain'),
    path.join(home, '.claude', 'projects'),
    path.join(home, '.codex', 'sessions')
  ];

  const found = [];

  for (const dir of searchDirs) {
    if (!fs.existsSync(dir)) continue;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const candidate = path.join(dir, entry.name, '.system_generated', 'logs', 'transcript.jsonl');
        if (fs.existsSync(candidate)) {
          const stats = fs.statSync(candidate);
          found.push({ path: candidate, mtime: stats.mtimeMs, size: stats.size });
        }
      }
    } catch {}
  }

  found.sort((a, b) => b.mtime - a.mtime);
  if (singleLatest) return found.length > 0 ? found[0].path : null;
  return found.map(f => f.path);
}

// Execution Logic
const remoteHost = getArg('--host');
const filePath = getArg('--file');

if (searchQuery) {
  console.log(`\n============================================================`);
  console.log(`🧲 METAL DETECTOR: Searching for "${searchQuery}" in Trajectories`);
  console.log(`============================================================`);

  let targets = [];
  if (filePath) {
    targets = [filePath];
  } else if (searchAll) {
    targets = findLocalTranscripts(false);
  } else {
    const latest = findLocalTranscripts(true);
    if (latest) targets = [latest];
  }

  if (targets.length === 0) {
    console.log(`❌ No transcripts found to search.`);
    process.exit(1);
  }

  let totalMatches = 0;
  for (const target of targets) {
    if (!fs.existsSync(target)) continue;
    try {
      const raw = fs.readFileSync(target, 'utf8');
      const lines = raw.split('\n');
      const steps = parseTranscriptLines(lines);
      const matches = searchInSteps(steps, searchQuery, target);

      if (matches.length > 0) {
        console.log(`\n📍 Session: ${target}`);
        console.log(`   Matches Found: ${matches.length}`);

        for (const m of matches) {
          totalMatches++;
          const time = m.step.created_at ? new Date(m.step.created_at).toLocaleTimeString() : 'N/A';
          console.log(`   --------------------------------------------------------`);
          console.log(`   ⏱️  Step #${m.stepIndex + 1} [${time}] (${m.step.source || 'AGENT'})`);
          
          for (const d of m.details) {
            let snippet = d.text.replace(/\r?\n/g, ' ');
            const matchPos = snippet.toLowerCase().indexOf(searchQuery.toLowerCase());
            const start = Math.max(0, matchPos - 40);
            const end = Math.min(snippet.length, matchPos + searchQuery.length + 60);
            const excerpt = (start > 0 ? '...' : '') + snippet.slice(start, end) + (end < snippet.length ? '...' : '');

            console.log(`      * [${d.field}]: "${excerpt}"`);
          }
        }
      }
    } catch (err) {
      // Continue next target
    }
  }

  console.log(`\n============================================================`);
  console.log(`🎯 Summary: ${totalMatches} needle(s) found across ${targets.length} transcript(s).`);
  console.log(`============================================================\n`);
  process.exit(0);
}

if (remoteHost) {
  const remoteUser = getArg('--user', 'root');
  console.log(`Connecting to remote host ${remoteUser}@${remoteHost} via SSH...`);
  
  const remoteCmd = `python3 -c "
import glob, os
patterns = [
  os.path.expanduser('~/.gemini/**/transcript.jsonl'),
  '/var/lib/**/transcript.jsonl'
]
files = []
for p in patterns:
  files.extend(glob.glob(p, recursive=True))
if files:
  latest = max(files, key=os.path.getmtime)
  with open(latest, 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()
    for l in lines[-${tailCount + 10}:]:
      print(l.strip())
"`;

  try {
    const output = execSync(`ssh -o StrictHostKeyChecking=no ${remoteUser}@${remoteHost} "${remoteCmd}"`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
    const lines = output.split('\n');
    const steps = parseTranscriptLines(lines);
    renderReport(steps, `Remote (${remoteUser}@${remoteHost})`);
  } catch (err) {
    console.error(`❌ SSH Connection or Audit failed:`, err.message);
    process.exit(1);
  }
} else {
  let targetFile = filePath;
  if (!targetFile || hasFlag('--latest')) {
    targetFile = findLocalTranscripts(true);
  }

  if (!targetFile || !fs.existsSync(targetFile)) {
    console.error(`❌ No transcript file found. Specify one with --file <path>`);
    process.exit(1);
  }

  const raw = fs.readFileSync(targetFile, 'utf8');
  const lines = raw.split('\n');
  const steps = parseTranscriptLines(lines);
  renderReport(steps, `Local (${targetFile})`);
}
