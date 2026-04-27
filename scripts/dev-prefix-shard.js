#!/usr/bin/env node
// Knap helper: walk a 0.1.0 shard folder and rename source files so they
// conform to the 0.2.0 dev-prefix rule.
//
// Rules (from (Spec) Flint Shards . File Structure):
//   - Root entry-point files (`init-<sh>.md`, `hinit-<sh>.md`, `setup-<sh>.md`)
//     get a `dev-` prefix on their canonical name.
//   - Files under `skills/`, `workflows/`, `templates/`, `knowledge/`,
//     `migrations/`, `assets/`, `scripts/` get a `dev-` prefix when they don't
//     already have one.
//   - Files inside `install/` are literal payloads and MUST NOT carry a
//     `dev-` prefix; the script strips it if present.
//
// Usage:
//   flint shard knap prefix-shard <path-to-shard-folder> [--dry-run]
//
// The path can be relative to FLINT_ROOT (the workspace cwd) or absolute.

import { readdir, rename, stat } from 'node:fs/promises';
import { resolve, join, basename } from 'node:path';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const positional = args.filter((a) => !a.startsWith('--'));

if (positional.length !== 1) {
  console.error('Usage: flint shard knap prefix-shard <shard-folder> [--dry-run]');
  process.exit(2);
}

const shardRoot = resolve(process.cwd(), positional[0]);

try {
  const s = await stat(shardRoot);
  if (!s.isDirectory()) throw new Error('not a directory');
} catch (err) {
  console.error(`Cannot read shard folder "${shardRoot}": ${err.message}`);
  process.exit(1);
}

// Folders whose contents get a `dev-` prefix when missing.
const PREFIX_FOLDERS = ['skills', 'workflows', 'templates', 'knowledge', 'migrations', 'assets', 'scripts'];
// Folder whose contents must NOT have a `dev-` prefix.
const STRIP_FOLDER = 'install';
// Root-level files that get a `dev-` prefix.
const ROOT_FILE_PATTERNS = [/^init-[a-z0-9-]+\.md$/, /^hinit-[a-z0-9-]+\.md$/, /^setup-[a-z0-9-]+\.md$/];

const renames = []; // [{ from, to, reason }]

async function walkPrefixFolder(folder) {
  const dir = join(shardRoot, folder);
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return; // folder absent — fine
  }
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (entry.name.startsWith('.')) continue;
    if (entry.name.startsWith('dev-')) continue;
    renames.push({
      from: join(dir, entry.name),
      to: join(dir, `dev-${entry.name}`),
      reason: `add dev- prefix (${folder}/)`,
    });
  }
}

async function walkStripFolder() {
  const dir = join(shardRoot, STRIP_FOLDER);
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.startsWith('dev-')) continue;
    renames.push({
      from: join(dir, entry.name),
      to: join(dir, entry.name.slice(4)),
      reason: `strip dev- prefix (${STRIP_FOLDER}/)`,
    });
  }
}

async function walkRoot() {
  const entries = await readdir(shardRoot, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const name = entry.name;
    if (name.startsWith('dev-')) continue;
    if (!ROOT_FILE_PATTERNS.some((re) => re.test(name))) continue;
    renames.push({
      from: join(shardRoot, name),
      to: join(shardRoot, `dev-${name}`),
      reason: 'add dev- prefix (entry-point file)',
    });
  }
}

await walkRoot();
for (const folder of PREFIX_FOLDERS) {
  await walkPrefixFolder(folder);
}
await walkStripFolder();

if (renames.length === 0) {
  console.log('No renames needed — shard already conforms to the dev-prefix convention.');
  process.exit(0);
}

console.log(`${dryRun ? '[dry-run] ' : ''}Renames planned for ${shardRoot}:\n`);
for (const r of renames) {
  console.log(`  ${basename(r.from)}  →  ${basename(r.to)}    (${r.reason})`);
}
console.log();

if (dryRun) {
  console.log(`${renames.length} rename(s). Re-run without --dry-run to apply.`);
  process.exit(0);
}

let applied = 0;
const failed = [];
for (const r of renames) {
  try {
    await rename(r.from, r.to);
    applied++;
  } catch (err) {
    failed.push({ ...r, error: err.message });
  }
}

console.log(`Applied ${applied} rename${applied === 1 ? '' : 's'}.`);
if (failed.length > 0) {
  console.error(`Failed ${failed.length}:`);
  for (const f of failed) {
    console.error(`  ${basename(f.from)}: ${f.error}`);
  }
  process.exit(1);
}
