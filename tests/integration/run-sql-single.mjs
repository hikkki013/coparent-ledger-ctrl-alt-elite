// Runs real PostgreSQL without a listening socket. Only use a disposable cluster.
// PG_BIN=/path/to/bin PG_TEST_DATA=/path/to/disposable/data node ... [SQL files]
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
const bin = process.env.PG_BIN;
const data = process.env.PG_TEST_DATA;
const files = process.argv.slice(2);
if (!bin || !data || !files.length) {
  console.error('BLOCKED: PG_BIN, PG_TEST_DATA and SQL file paths are required. Initialize a fresh disposable cluster first; do not run against a production cluster.');
  process.exit(2);
}
console.warn('LIMITED SQL CHECK: single-user PostgreSQL bypasses native RLS/grants. Those checks and concurrent transactions remain BLOCKED; this runs schema/RPC/explicit authorization assertions only.');
for (const path of files) {
  // Some sandbox filesystems do not retain empty directories between commands.
  // Recreate only standard empty directories inside this explicitly chosen test cluster.
  readFileSync(join(data, 'PG_VERSION'), 'utf8');
  for (const directory of ['pg_commit_ts', 'pg_dynshmem', 'pg_notify', 'pg_replslot', 'pg_serial', 'pg_snapshots', 'pg_stat_tmp', 'pg_tblspc', 'pg_twophase', 'pg_logical/snapshots', 'pg_logical/mappings']) mkdirSync(join(data, directory), { recursive: true });
  // In single-user mode a newline terminates a command. The owned SQL fixtures use
  // full-line comments only; flatten those scripts so dollar-quoted bodies stay intact.
  const source = readFileSync(path, 'utf8');
  const sql = source.split(/\r?\n/).filter(line => !line.trimStart().startsWith('--')).join(' ') + '\n';
  const result = spawnSync(join(bin, process.platform === 'win32' ? 'postgres.exe' : 'postgres'), ['--single', '-D', data, '-c', 'max_connections=20', '-c', 'shared_buffers=16MB', 'postgres'], { input: sql, encoding: 'utf8', windowsHide: true, maxBuffer: 4 * 1024 * 1024 });
  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
  if (result.error || result.status !== 0 || /\b(?:ERROR|FATAL|PANIC):/.test(output)) {
    console.error(`FAILED: ${path}`);
    console.error(result.error?.message ?? output.slice(0, 16000));
    process.exit(1);
  }
  console.log(`PASSED: PostgreSQL execution of ${path}`);
  for (const line of output.split(/\r?\n/).filter(line => line.includes('NOTICE:'))) console.log(line);
}
