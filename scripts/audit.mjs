#!/usr/bin/env node

/**
 * Cross-Agent Trajectory Auditor
 * Multi-host, out-of-band forensics & trajectory inspection engine for AI coding agents.
 * 
 * Supports local and remote (.jsonl) session transcripts (Antigravity, Claude Code, Codex).
 * 
 * Usage:
 *   node scripts/audit.mjs --latest
 *   node scripts/audit.mjs --file <path-to-transcript.jsonl>
 *   node scripts/audit.mjs --host <remote-ip> [--user <username>] [--runtime <antigravity|claude>]
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
Cross-Agent Trajectory Auditor (Forensics & Inspection)

Options:
  --latest               Inspect the most recent local trajectory transcript.
  --file <path>          Path to a specific transcript.jsonl file.
  --host <ip/hostname>   Remote host to inspect via SSH.
  --user <user>          SSH username (default: root).
  --tail <num>           Number of steps to display (default: 10).
  --verbose              Display full thinking and output contents.
  --help                 Show this help message.
`);
}

if (hasFlag('--help')) {
  printHelp();
  process.exit(0);
}

const tailCount = parseInt(getArg('--tail', '10'), 10);
const isVerbose = hasFlag('--verbose');

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

function findLocalTranscript() {
  const home = os.homedir();
  const searchDirs = [
    path.join(home, '.gemini', 'antigravity', 'brain'),
    path.join(home, '.gemini', 'antigravity-cli', 'brain'),
    path.join(home, '.gemini', 'antigravity-ide', 'brain'),
    path.join(home, '.claude', 'projects')
  ];

  let latestFile = null;
  let latestMtime = 0;

  for (const dir of searchDirs) {
    if (!fs.existsSync(dir)) continue;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const candidate = path.join(dir, entry.name, '.system_generated', 'logs', 'transcript.jsonl');
        if (fs.existsSync(candidate)) {
          const stats = fs.statSync(candidate);
          if (stats.mtimeMs > latestMtime) {
            latestMtime = stats.mtimeMs;
            latestFile = candidate;
          }
        }
      }
    } catch {
      // Continue
    }
  }

  return latestFile;
}

// Execution Logic
const remoteHost = getArg('--host');
const filePath = getArg('--file');

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
    targetFile = findLocalTranscript();
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
