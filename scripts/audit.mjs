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
 *   node scripts/audit.mjs --recepcao [--out CURRENT_TASK.md]
 *   node scripts/audit.mjs --search "ffmpeg"
 *   node scripts/audit.mjs --grep "prisma" --all
 *   node scripts/audit.mjs --file <path-to-transcript.jsonl>
 *   node scripts/audit.mjs --host <remote-ip> [--user <username>] [--search <term>]
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync, spawnSync } from 'child_process';

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
  --recepcao, --welcome  Generate a VIP Cockpit Handover briefing (CURRENT_TASK.md) for the next agent.
  --out <path>           Output path for the handover briefing (default: ./CURRENT_TASK.md).
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
  node scripts/audit.mjs --recepcao
  node scripts/audit.mjs --recepcao --out ./docs/HANDOFF.md
  node scripts/audit.mjs --host 100.98.233.126 --recepcao
  node scripts/audit.mjs --search "asaas"
  node scripts/audit.mjs --grep "exit code 1" --all
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

function generateRecepcaoDeLuxo(steps, outPath = './CURRENT_TASK.md', sourceLabel = 'Local') {
  // 1. Extrair Objetivo Ativo do Usuário (com fallback para prompt substantivo se o último for curto)
  const userPrompts = [];
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    if (s.source === 'USER_EXPLICIT' || (s.type === 'USER_INPUT' && s.source !== 'MODEL')) {
      let content = typeof s.content === 'string' ? s.content : JSON.stringify(s.content || '');
      const reqMatch = content.match(/<USER_REQUEST>([\s\S]*?)<\/USER_REQUEST>/);
      const text = reqMatch ? reqMatch[1].trim() : content.trim().replace(/^User:\s*/i, '');
      if (text && !text.startsWith('Created At:') && !text.includes('diff_block_start')) {
        userPrompts.push(text);
      }
    }
  }

  let userGoal = 'Dar continuidade à tarefa corrente.';
  if (userPrompts.length > 0) {
    const lastPrompt = userPrompts[userPrompts.length - 1];
    if (lastPrompt.length <= 20 && userPrompts.length > 1) {
      const priorPrompt = userPrompts[userPrompts.length - 2];
      userGoal = `${priorPrompt} (Confirmado: "${lastPrompt}")`;
    } else {
      userGoal = lastPrompt;
    }
  }

  // 2. Extrair Arquivos Mutados
  const mutationTools = [
    'write_file', 'write_to_file', 'edit_file', 'replace_file_content', 
    'multi_replace_file_content', 'create_or_update_file', 'push_files', 'str_replace_editor'
  ];
  const mutatedFiles = new Set();
  
  // 3. Extrair Comandos Executados e Validações
  const commandTools = ['run_command', 'execute_command', 'bash', 'exec', 'terminal'];
  let lastCommand = null;
  const silentFailures = [];

  for (let idx = 0; idx < steps.length; idx++) {
    const s = steps[idx];
    if (s.tool_calls && Array.isArray(s.tool_calls)) {
      for (const tc of s.tool_calls) {
        const name = tc.name || '';
        const tArgs = tc.args || tc.arguments || {};

        if (mutationTools.includes(name)) {
          let p = tArgs.TargetFile || tArgs.target_file || tArgs.file_path || tArgs.Path || tArgs.path || tArgs.filePath;
          if (p && typeof p === 'string') {
            p = p.replace(/^"|"$/g, '').replace(/\\"/g, '"');
            mutatedFiles.add(p);
          }
        }

        if (commandTools.includes(name)) {
          let cmd = tArgs.CommandLine || tArgs.command || tArgs.cmd || '';
          if (cmd && typeof cmd === 'string') {
            cmd = cmd.replace(/^"|"$/g, '').replace(/\\"/g, '"');
            // Ignorar comandos de auditoria interna para destacar o teste real
            if (!cmd.includes('transcript.jsonl') && !cmd.includes('TEST_CURRENT_TASK')) {
              lastCommand = { cmd, stepIndex: idx, status: s.status || 'DONE' };
            }
          }
        }
      }
    }

    // Verificar falhas silenciosas
    if (s.status === 'ERROR') {
      const errSnippet = typeof s.content === 'string' ? s.content.slice(0, 160) : 'Erro não especificado';
      silentFailures.push(`Passo #${idx + 1}: ${errSnippet}`);
    } else if (s.content && typeof s.content === 'string' && s.content.includes('Command exited with code') && !s.content.includes('code 0')) {
      silentFailures.push(`Passo #${idx + 1}: ${s.content.slice(0, 160)}`);
    }
  }

  // 4. Último Status do Agente / Próximo Passo
  let nextStep = 'Prosseguir com a execução e validação da tarefa.';
  for (let i = steps.length - 1; i >= 0; i--) {
    const s = steps[i];
    if (s.thinking && typeof s.thinking === 'string') {
      const thoughts = s.thinking.split('\n').map(l => l.trim()).filter(l => l.length > 15 && !l.startsWith('//') && !l.includes('diff_block'));
      if (thoughts.length > 0) {
        nextStep = thoughts[thoughts.length - 1].replace(/^[-*•\s]+/, '').slice(0, 220);
        break;
      }
    } else if (s.content && typeof s.content === 'string' && s.source !== 'USER_EXPLICIT' && s.type !== 'USER_INPUT') {
      const cleanContent = s.content.replace(/<[^>]+>/g, '').trim();
      if (cleanContent.length > 20 && !cleanContent.includes('diff_block_start')) {
        nextStep = cleanContent.slice(0, 220);
        break;
      }
    }
  }

  // 5. Formatar Artefato Cockpit (~150-200 tokens)
  const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
  const mutatedList = Array.from(mutatedFiles);
  
  let md = `# 🛬 RECEPÇÃO DE LUXO: HANDOFF COCKPIT\n`;
  md += `> Gerado automaticamente por \`agent-log --recepcao\` em ${now} UTC.\n`;
  md += `> Origem: **${sourceLabel}** | Total de passos analisados: **${steps.length}**\n\n`;

  md += `### 🎯 Objetivo Ativo\n`;
  md += `${userGoal}\n\n`;

  md += `### 📂 Arquivos Modificados na Sessão\n`;
  if (mutatedList.length === 0) {
    md += `- *(Nenhum arquivo mutado até o momento)*\n\n`;
  } else {
    for (const f of mutatedList) {
      md += `- \`${f}\`\n`;
    }
    md += `\n`;
  }

  md += `### 🧪 Última Validação Executada\n`;
  if (lastCommand) {
    const isOk = lastCommand.status !== 'ERROR';
    md += `- **Comando:** \`${lastCommand.cmd}\`\n`;
    md += `- **Status:** ${isOk ? '✅ Concluído' : '❌ Falha / Erro'}\n\n`;
  } else {
    md += `- *(Nenhum comando de validação executado recentemente)*\n\n`;
  }

  md += `### ⚠️ Pontos de Atenção / Falhas Ocultas\n`;
  if (silentFailures.length === 0) {
    md += `- ✅ Nenhuma falha silenciosa ou erro de comando detectado.\n\n`;
  } else {
    for (const sf of silentFailures.slice(-3)) {
      md += `- ⚠️ ${sf.replace(/\r?\n/g, ' ')}\n`;
    }
    md += `\n`;
  }

  md += `### 🚀 Próximo Passo Recomendado\n`;
  md += `${nextStep}\n`;

  const resolvedOut = path.resolve(outPath);
  fs.writeFileSync(resolvedOut, md, 'utf8');

  console.log(`\n============================================================`);
  console.log(`🛬 RECEPÇÃO DE LUXO: HANDOFF COCKPIT CRIADO COM SUCESSO!`);
  console.log(`============================================================`);
  console.log(`📁 Arquivo gerado: ${resolvedOut}`);
  console.log(`📄 Resumo do Cockpit:\n`);
  console.log(md);
  console.log(`============================================================\n`);

  return { path: resolvedOut, markdown: md };
}

function findLocalTranscripts(singleLatest = false) {
  const home = os.homedir();
  const searchDirs = [
    path.join(home, '.gemini', 'antigravity', 'brain'),
    path.join(home, '.gemini', 'antigravity-cli', 'brain'),
    path.join(home, '.gemini', 'antigravity-ide', 'brain'),
    path.join(home, '.claude', 'projects'),
    path.join(home, '.codex', 'sessions'),
    '/root/.gemini/antigravity-cli/brain',
    '/var/lib/antigravity-drtoledo/.gemini/antigravity-cli/brain',
    '/var/lib/antigravity-toledo/.gemini/antigravity-cli/brain',
    '/var/lib/antigravity-barberflow/.gemini/antigravity-cli/brain'
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
const isRecepcao = hasFlag('--recepcao') || hasFlag('--welcome') || hasFlag('--cockpit');
const recepcaoOut = getArg('--out', './CURRENT_TASK.md');

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
  
  const lineLimit = isRecepcao ? 300 : (tailCount + 10);
  const pyCode = `python3 -c "import glob, os; patterns=['/root/.gemini/antigravity*/**/transcript.jsonl', '/var/lib/antigravity*/**/transcript.jsonl']; files=[f for p in patterns for f in glob.glob(p, recursive=True)]; latest=max(files, key=os.path.getmtime) if files else None; lines=open(latest, 'r', errors='ignore').readlines()[-${lineLimit}:] if latest else []; print(''.join(lines), end='')"`;

  const proc = spawnSync('ssh', ['-n', '-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=no', `${remoteUser}@${remoteHost}`, pyCode], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 50 * 1024 * 1024
  });

  if (proc.status !== 0) {
    console.error(`❌ SSH Connection or Audit failed:`, proc.stderr || `Exit code ${proc.status}`);
    process.exit(1);
  }

  const lines = proc.stdout.split('\n');
  const steps = parseTranscriptLines(lines);

  if (isRecepcao) {
    generateRecepcaoDeLuxo(steps, recepcaoOut, `Remote (${remoteUser}@${remoteHost})`);
  } else {
    renderReport(steps, `Remote (${remoteUser}@${remoteHost})`);
  }
} else {
  let targetFile = filePath;
  if (!targetFile || hasFlag('--latest') || isRecepcao) {
    targetFile = findLocalTranscripts(true);
  }

  if (!targetFile || !fs.existsSync(targetFile)) {
    console.error(`❌ No transcript file found. Specify one with --file <path>`);
    process.exit(1);
  }

  const raw = fs.readFileSync(targetFile, 'utf8');
  const lines = raw.split('\n');
  const steps = parseTranscriptLines(lines);

  if (isRecepcao) {
    generateRecepcaoDeLuxo(steps, recepcaoOut, `Local (${targetFile})`);
  } else {
    renderReport(steps, `Local (${targetFile})`);
  }
}

