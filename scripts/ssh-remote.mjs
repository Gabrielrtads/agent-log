/**
 * Remote (SSH) helpers for agent-log.
 *
 * Everything that reaches the `ssh` binary goes through here so that --host / --user
 * are validated once and are only ever passed as separate argv elements (never through a shell).
 */

import { spawnSync } from 'child_process';

const HOST_RE = /^[A-Za-z0-9.-]+$/;
const USER_RE = /^[A-Za-z0-9_-]+$/;

function assertSafeValue(label, value, pattern) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Invalid ${label}: a value is required.`);
  }
  // A leading "-" would be parsed by ssh as an option (e.g. -oProxyCommand=...).
  if (value.startsWith('-')) {
    throw new Error(`Invalid ${label} ${JSON.stringify(value)}: must not start with "-".`);
  }
  if (!pattern.test(value)) {
    throw new Error(`Invalid ${label} ${JSON.stringify(value)}: only ${pattern.source} is allowed.`);
  }
}

// Without --user we hand ssh the bare host, so ~/.ssh/config (or the local username) decides the user.
export function formatSshTarget(host, user = null) {
  assertSafeValue('--host', host, HOST_RE);
  if (user === null || user === undefined) return host;
  assertSafeValue('--user', user, USER_RE);
  return `${user}@${host}`;
}

export function buildRemoteCommand(lineLimit) {
  if (!Number.isSafeInteger(lineLimit) || lineLimit < 0) {
    throw new Error(`Invalid line limit ${String(lineLimit)}: expected a non-negative integer.`);
  }
  return `python3 -c "import glob, os; patterns=['/root/.gemini/antigravity*/**/transcript.jsonl', '/var/lib/antigravity*/**/transcript.jsonl']; files=[f for p in patterns for f in glob.glob(p, recursive=True)]; latest=max(files, key=os.path.getmtime) if files else None; lines=open(latest, 'r', errors='ignore').readlines()[-${lineLimit}:] if latest else []; print(''.join(lines), end='')"`;
}

export function buildSshArgs(host, user, remoteCommand) {
  return [
    '-n',
    '-o', 'BatchMode=yes',
    '-o', 'StrictHostKeyChecking=accept-new',
    '-o', 'ConnectTimeout=10',
    '--',
    formatSshTarget(host, user),
    remoteCommand
  ];
}

export function runSsh(host, user, remoteCommand, spawn = spawnSync) {
  return spawn('ssh', buildSshArgs(host, user, remoteCommand), {
    shell: false,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 50 * 1024 * 1024
  });
}
