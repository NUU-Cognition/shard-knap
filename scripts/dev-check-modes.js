#!/usr/bin/env node
// Knap helper: check one shard source (or one shard folder) for the merge of its headless files
// (NUU Orbh Task 748: one workflow for each mode). Use it with wkfl-knap-migrate_headless_to_modes.
//
// It reports four kinds of findings:
//   - file:      a headless file that stays (`dev-hinit-<sh>.md`, `workflows/dev-hwkfl-*.md`, and their
//                `.invocation.json` files), with the partner `wkfl-` file or "no partner".
//   - reference: a line that names `hwkfl-`, `hinit-`, `hstart`, `hstart-dev`, or `--headless`
//                (Markdown, JSON, YAML, and script files; not `.git/`). The release history (`RELEASE.md`,
//                `CHANGELOG.md`) is not checked: an entry of an earlier version stays as it is.
//   - problem:   an invocation file that is not JSON; a `workflow` that is not the stem of the file;
//                a step `stage` that is not a heading of the Markdown workflow beside it; a token of a
//                `next` text (a string, or each text of a `next` object) inside quotes, or in a text with
//                `$(`, `${`, or a backquote; a heading inside a callout (`> #`, also nested) of a workflow;
//                an invocation file whose JSON value is not an object.
//   The Markdown checks skip the fenced code blocks (``` and ~~~), accept up to 3 spaces of indentation, and
//   read nested block quotes (`> >`, `>>`). Only a heading outside a fence and outside a callout is a stage heading.
//   - warning:   a `# Headless` section in a workflow file (the callouts go inside the stages).
//
// The validator of the Flint CLI is the authority for the invocation file: also run
// `flint shard status <alias> --health`. This script checks only what that check does not see.
//
// Usage:
//   flint shard knap check-modes <source-folder> [--json]
//
// The path can be relative to FLINT_ROOT (the workspace cwd) or absolute.
// Exit code: 0 when it finds nothing, 1 when it finds a file, a reference, or a problem, 2 on a usage error.

import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, join, relative, basename } from 'node:path';

const args = process.argv.slice(2);
const json = args.includes('--json');
const positional = args.filter((a) => !a.startsWith('--'));

if (positional.length !== 1) {
  console.error('Usage: flint shard knap check-modes <source-folder> [--json]');
  process.exit(2);
}

const root = resolve(process.cwd(), positional[0]);

try {
  const s = await stat(root);
  if (!s.isDirectory()) throw new Error('not a directory');
} catch (err) {
  console.error(`Cannot read the folder "${root}": ${err.message}`);
  process.exit(2);
}

const findings = []; // [{ kind, file, line?, message }]
const add = (kind, file, message, line) => findings.push({ kind, file, ...(line ? { line } : {}), message });

// Each file under the folder, except .git and node_modules.
async function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(path)));
    else if (entry.isFile()) out.push(path);
  }
  return out;
}

const files = await walk(root);
const rel = (path) => relative(root, path);

// 1. The headless files that stay.
for (const path of files) {
  const name = basename(path);
  const inRoot = rel(path) === name;
  if (inRoot && /^(?:dev-)?hinit-[a-z0-9-]+\.md$/.test(name)) {
    add('file', rel(path), 'headless init: merge it into the section "# Headless" of the init');
    continue;
  }
  const match = /^(dev-)?hwkfl-(.+?)(\.invocation\.json|\.md)$/.exec(name);
  if (!match) continue;
  const partner = `${match[1] ?? ''}wkfl-${match[2]}${match[3]}`;
  const hasPartner = files.some((other) => basename(other) === partner);
  add('file', rel(path), hasPartner ? `merge it into ${partner}` : `no partner: rename it to ${partner}`);
}

// 2. The references that stay.
const REFERENCE = /\bh(?:wkfl|init)-|\bhstart(?:-dev)?\b|--headless\b/;
const HISTORY = /^(?:RELEASE|CHANGELOG)\.md$/i;
for (const path of files) {
  if (!/\.(?:md|json|ya?ml|js|mjs|cjs|ts)$/.test(path)) continue;
  if (HISTORY.test(basename(path))) continue;
  const text = await readFile(path, 'utf-8');
  text.split('\n').forEach((line, index) => {
    if (REFERENCE.test(line)) add('reference', rel(path), line.trim().slice(0, 160), index + 1);
  });
}

// The lines of a Markdown file, each with its block quote depth, whether it is inside a fenced code block, and its
// heading (level and text) when it is one.
// - A block quote line starts with up to 3 spaces and `>`; each further `>` (after up to 3 spaces) is one more depth.
// - A fence opens with 3 or more backquotes or tildes after up to 3 spaces. It closes with a fence of the same
//   character and at least the same length, at the same depth. The lines between are code, not headings.
// - A fence inside a block quote also ends when its block quote ends (a line with a smaller depth, for example a
//   blank line or a heading after the callout). That line is then read again, outside the fence.
// - A heading is 1 to 6 `#` after up to 3 spaces, then a space or the end of the line. A closing `#` run is not text.
function markdownLines(text) {
  const out = [];
  let fence = null; // { char, length, depth }
  text.split('\n').forEach((raw, index) => {
    let rest = raw;
    let depth = 0;
    for (let quote = /^ {0,3}> ?/.exec(rest); quote; quote = /^ {0,3}> ?/.exec(rest)) {
      depth += 1;
      rest = rest.slice(quote[0].length);
    }
    const fenceMark = /^ {0,3}(`{3,}|~{3,})/.exec(rest);
    if (fence && depth < fence.depth) fence = null; // the block quote of the fence ended, so the fence ended too
    if (fence) {
      const closes = fenceMark && fenceMark[1][0] === fence.char && fenceMark[1].length >= fence.length
        && depth === fence.depth && /^ {0,3}(`+|~+)[ \t]*$/.test(rest);
      if (closes) fence = null;
      out.push({ line: index + 1, depth, inFence: true, heading: null });
      return;
    }
    if (fenceMark) {
      fence = { char: fenceMark[1][0], length: fenceMark[1].length, depth };
      out.push({ line: index + 1, depth, inFence: true, heading: null });
      return;
    }
    const heading = /^ {0,3}(#{1,6})(?:[ \t]+(.*?))?(?:[ \t]+#+)?[ \t]*$/.exec(rest);
    out.push({
      line: index + 1,
      depth,
      inFence: false,
      heading: heading ? { level: heading[1].length, text: (heading[2] ?? '').trim() } : null,
    });
  });
  return out;
}

// The stage headings of a workflow: each heading outside a fence and outside a block quote.
const stageHeadings = (text) => markdownLines(text)
  .filter((entry) => !entry.inFence && entry.depth === 0 && entry.heading)
  .map((entry) => entry.heading.text);

// 3. The invocation files.
const TOKEN = /\{\{[^{}]+\}\}/g;

// The tokens of a text that stand inside quotes: a ' or a $' opens a single quote until the next ';
// a " opens a double quote until the next " that has no backslash before it.
function quotedTokens(text) {
  const out = [];
  let quote = null;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '{' && text[i + 1] === '{') {
      const end = text.indexOf('}}', i + 2);
      if (end !== -1) {
        if (quote) out.push(text.slice(i, end + 2));
        i = end + 1;
        continue;
      }
    }
    if (quote === "'") {
      if (char === "'") quote = null;
    } else if (quote === '"') {
      if (char === '"' && text[i - 1] !== '\\') quote = null;
    } else if (char === "'" || char === '"') {
      quote = char;
    }
  }
  return out;
}

function checkNextText(file, where, text) {
  if (typeof text !== 'string') return;
  for (const token of quotedTokens(text)) {
    add('problem', file, `${where}: the token ${token} stands inside quotes; write it outside quotes`);
  }
  if (/\$\(|\$\{|`/.test(text) && TOKEN.test(text)) {
    add('problem', file, `${where}: a text with a token has $(, \${, or a backquote`);
  }
  TOKEN.lastIndex = 0;
}

for (const path of files) {
  if (!path.endsWith('.invocation.json')) continue;
  const file = rel(path);
  let data;
  try {
    data = JSON.parse(await readFile(path, 'utf-8'));
  } catch (err) {
    add('problem', file, `not JSON: ${err.message}`);
    continue;
  }
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    add('problem', file, `the JSON value is ${data === null ? 'null' : Array.isArray(data) ? 'an array' : `a ${typeof data}`}; it must be an object`);
    continue;
  }
  const stem = basename(path).replace(/\.invocation\.json$/, '').replace(/^dev-/, '');
  if (data.workflow !== stem) add('problem', file, `"workflow" is "${data.workflow}"; it must be "${stem}"`);

  const markdownPath = path.replace(/\.invocation\.json$/, '.md');
  let headings = null;
  try {
    headings = stageHeadings(await readFile(markdownPath, 'utf-8'));
  } catch {
    headings = null; // no Markdown beside the file: the hint has no read: line
  }

  const steps = Array.isArray(data.steps) ? data.steps : [];
  steps.forEach((step, index) => {
    const where = `steps[${index}] (${step?.id ?? '?'})`;
    if (headings && typeof step?.stage === 'string' && !headings.includes(step.stage.trim())) {
      add('problem', file, `${where}: the stage "${step.stage}" is not a heading of ${basename(markdownPath)}`);
    }
    if (typeof step?.next === 'string') checkNextText(file, `${where}.next`, step.next);
    else if (step?.next && typeof step.next === 'object') {
      for (const [mode, text] of Object.entries(step.next)) checkNextText(file, `${where}.next.${mode}`, text);
    }
  });
}

// 4. The Markdown workflows: no heading inside a callout, no "# Headless" section.
for (const path of files) {
  const name = basename(path);
  if (!/^(?:dev-)?h?wkfl-.+\.md$/.test(name)) continue;
  for (const entry of markdownLines(await readFile(path, 'utf-8'))) {
    if (entry.inFence || !entry.heading) continue;
    if (entry.depth > 0) {
      add('problem', rel(path), 'a heading inside a callout is not a stage heading; put the heading outside the callout', entry.line);
    } else if (entry.heading.level === 1 && /^headless$/i.test(entry.heading.text)) {
      add('warning', rel(path), 'a "# Headless" section in a workflow: put a > [!headless] callout inside each stage that differs', entry.line);
    }
  }
}

const failing = findings.filter((finding) => finding.kind !== 'warning');

if (json) {
  console.log(JSON.stringify({ ok: failing.length === 0, folder: root, findings }, null, 2));
  process.exit(failing.length === 0 ? 0 : 1);
}

if (findings.length === 0) {
  console.log(`No headless file, no reference, and no problem in ${root}.`);
  process.exit(0);
}

const LABEL = { file: 'Headless files', reference: 'References', problem: 'Problems', warning: 'Warnings' };
for (const kind of ['file', 'reference', 'problem', 'warning']) {
  const group = findings.filter((finding) => finding.kind === kind);
  if (group.length === 0) continue;
  console.log(`${LABEL[kind]} (${group.length}):`);
  for (const finding of group) {
    console.log(`  ${finding.file}${finding.line ? `:${finding.line}` : ''}  ${finding.message}`);
  }
  console.log();
}
process.exit(failing.length === 0 ? 0 : 1);
