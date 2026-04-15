---
description: "Shard script file structure"
---

# Filename: scripts/dev-<name>.js  (installed: scripts/<name>.js)

/* Scripts provide deterministic operations that agents invoke via CLI.
   Use scripts to replace fragile agent logic (counting files, finding patterns) with reliable commands.

   Scripts are auto-discovered from the scripts/ folder — NO shard.yaml declaration needed.
   The command name is derived from the filename stem (dev- prefix stripped):
     scripts/dev-new-task-number.js → flint shard <shorthand> new-task-number

   Invocation: flint shard <shorthand> <name> [args...]
*/

```javascript
#!/usr/bin/env node
// [Brief description of what this script does]
// Invocation: flint shard <shorthand> <script-name> [args...]
// Outputs: [describe the output format — single value, JSON, etc.]

const fs = require('fs');
const path = require('path');

const flintRoot = process.env.FLINT_ROOT || process.cwd();
const targetDir = path.join(flintRoot, '[path to target directory]');

function main() {
  // [Implementation]

  // Output result (minimal, machine-readable)
  console.log(result);
}

main();
```

## Design Guidelines

- **Cross-platform** — Node.js only, no bash scripts
- **Minimal output** — Single values, JSON, or simple text (no decorative output)
- **Error handling** — Use `process.exit(1)` for failures, `process.stderr.write()` for error messages
- **Flint root** — Always use `process.env.FLINT_ROOT || process.cwd()`
- **No dependencies** — Use only Node.js built-in modules (fs, path, etc.)
- **Deterministic** — Same input should always produce same output
- **Machine-readable** — Agents consume the output; keep it parseable

## Common Patterns

### Next Number in Sequence

```javascript
const files = fs.readdirSync(dir);
let highest = 0;
for (const file of files) {
  const match = file.match(/^\(Type\)\s+(\d+)/);
  if (match) {
    const num = parseInt(match[1], 10);
    if (num > highest) highest = num;
  }
}
console.log(String(highest + 1).padStart(3, '0'));
```

### Find File by Status

```javascript
const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
for (const file of files) {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  if (content.includes('status: active')) {
    console.log(file);
    process.exit(0);
  }
}
process.exit(1);
```

### Read Frontmatter Field

```javascript
const content = fs.readFileSync(filePath, 'utf8');
const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
if (!fmMatch) { process.exit(1); }
const line = fmMatch[1].split('\n').find(l => l.startsWith('status:'));
console.log(line ? line.split(':')[1].trim() : '');
```
