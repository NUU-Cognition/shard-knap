---
description: "Shard script file structure"
---

# Naming and Placement

| | |
|---|---|
| Dev source path | `scripts/dev-<name>.js` |
| Installed path | `scripts/<name>.js` (the installer strips `dev-`) |
| `<name>` | kebab-case verb or verb-phrase: `new-task-number`, `next-id`, `find-active` |
| Invocation | `flint shard <shorthand> <name> [args...]` |
| Env vars provided | `FLINT_ROOT` (workspace root), `FLINT_SHARD` (folder name of the calling shard) |

**Note: scripts do NOT carry the shorthand in their filename.** Other shard files include the shorthand (`sk-<sh>-<name>`, `wkfl-<sh>-<name>`, `knw-<sh>-<name>`); scripts do not. The shorthand appears in the *invocation* (`flint shard <sh> <name>`), not the filename. This is because scripts are namespaced by the shard folder they live in, so the filename only needs to disambiguate within that one shard.

**Auto-discovered.** Scripts are picked up from `scripts/*.js` automatically. Do NOT declare them in `shard.yaml` — there is no `scripts:` field in the modern manifest. The command name is derived from the filename stem with `dev-` stripped:

```
scripts/dev-new-task-number.js   → flint shard <sh> new-task-number
scripts/dev-next-id.js           → flint shard <sh> next-id
```

Names containing CLI-invalid characters are rejected with a warning and skipped. Stick to lowercase letters, digits, and hyphens.

```javascript
#!/usr/bin/env node
// [Brief description of what this script does]
// Invocation: flint shard <shorthand> <script-name> [args...]
// Outputs: [describe the output format — single value, JSON, etc.]

const fs = require('fs');
const path = require('path');

const flintRoot = process.env.FLINT_ROOT || process.cwd();
const targetDir = path.join(flintRoot, '[path to target directory, e.g. "Mesh/Types/Tasks (Task)"]');

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
