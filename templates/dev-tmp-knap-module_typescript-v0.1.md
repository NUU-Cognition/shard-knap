---
description: "Starter src/index.ts, build.mjs, and package.json of a TypeScript module, with the TypeScript SDK bundled into one file"
---

# File: Modules/(Source Local) <Name>/src/index.ts, build.mjs, package.json

/* Replace each [placeholder] in a string or a comment, and remove each part that the design of the module does not use. Build with FLINT_REPO=<checkout of the Flint repo> flint module build <name>, then test with flint module status <name>. */

# Naming and Placement

| | |
|---|---|
| Paths | `Modules/(Source Local) <Name>/src/index.ts`, `build.mjs`, and `package.json`, beside `module.yaml` ([[dev-tmp-knap-module_yaml-v0.1]]) |
| Manifest | `runtime: node`, `entry: dist/index.js`, `build: "node build.mjs"` |
| Runs as | `node dist/index.js plan`, `apply`, `command <name> [args...]`, or `live`, in the Flint root |
| SDK | `@nuucognition/flint-module-sdk` (`packages/flint-module-sdk` of the Flint repo), bundled into `dist/index.js` |

The module process has no `node_modules`: `build.mjs` bundles the source and the SDK into one ESM file. In Flint 0.7.0 the SDK is private and not on npm, so the build takes it from a checkout of the Flint repo: set `FLINT_REPO` to the checkout before `flint module build <name>`. esbuild comes from this folder (`npm install --save-dev esbuild`) or from the checkout. Git ignores `node_modules/` inside `Modules/`; `dist/` is tracked, and a release needs it in the commit. The contract is in [[dev-knw-knap-module]].

## `src/index.ts`

```ts
// [One line: what this module does for the machine.]
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineModule, run, type ModuleTools } from '@nuucognition/flint-module-sdk';

const STATE_FILE = 'state.json'; // [The file of the module in its data folder, .flint/modules/<name>/]

function readJson<T>(path: string): T | null {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T;
  } catch {
    return null;
  }
}

/** [The state that the settings and the env files ask for.] */
function wanted(m: ModuleTools): { value: string } {
  return { value: String(m.settings['[setting-key]'] ?? '[default value]') };
}

const text = (value: unknown): string | undefined => (typeof value === 'string' && value ? value : undefined);

run(defineModule({
  plan(m) {
    // A plan changes nothing, and it gives the same answer when nothing changed.

    // [A secret named in secrets: of module.yaml. A missing secret is the issue module-secret-missing. Remove when unused.]
    // m.secret('[SECRET_NAME]');

    // [A desired cron schedule. Safe default: it exists only when the settings give a schedule, and it fires only on the
    //  owner machine of the settings (never the machine that runs the plan). Remove when unused.]
    const schedule = text(m.settings.schedule);
    if (schedule) {
      m.desired.cron({
        key: '[schedule-key]',
        expr: schedule,
        prompt: '[The prompt of the agent session at each fire.]',
        timezone: text(m.settings.timezone),
        machine: text(m.settings.owner),
      });
    }

    // [A desired station: an item posted to it starts an agent session on its target. Remove when unused.]
    // m.desired.station({ key: '[station-key]', description: '[What the station serves.]' });

    // An own action, only when the data folder does not hold the wanted state.
    const want = wanted(m);
    const have = readJson<{ value: string }>(join(m.dataDir, STATE_FILE));
    if (JSON.stringify(have) !== JSON.stringify(want)) {
      m.action({ id: 'write-state', kind: have ? 'update' : 'create', label: `write ${STATE_FILE}`, detail: JSON.stringify(want), payload: want });
    }

    // [An issue only when a person must act: an issue makes the row Modules of flint doctor fail.]
    // m.issue('[module-code]', '[What is wrong.]', '[The next step.]');
  },

  apply(action, m) {
    if (action.id !== 'write-state') return { ok: false, detail: `no action ${action.id}` };
    writeFileSync(join(m.dataDir, STATE_FILE), `${JSON.stringify(action.payload, null, 2)}\n`);
    return `wrote ${STATE_FILE}`;
  },

  commands: {
    // [What the command does.] The terminal of the person; the return value is the exit code.
    '[command-name]'(args, m) {
      process.stdout.write(`${JSON.stringify(readJson(join(m.dataDir, STATE_FILE)))}\n`);
      return 0;
    },
  },

  // [Only for kind: live in module.yaml. Remove this handler for a sync module.]
  async live(m) {
    // flint module control <name> ping --data '{"text":"hi"}'
    await m.controller({
      ping: (body) => ({ pong: String(body.text ?? ''), pid: process.pid }),
    });
    // stderr goes to .flint/run/modules/<name>.log.
    m.onStop(() => { process.stderr.write('[name]: stopped\n'); });
    await m.status('ready');
  },
}));
```

## `build.mjs`

```js
// The build of this module (the `build` line of module.yaml): bundle src/index.ts with the TypeScript SDK into one ESM
// file, dist/index.js, so that the module process needs no node_modules.
// The SDK @nuucognition/flint-module-sdk is not on npm in Flint 0.7.0: set FLINT_REPO to a checkout of the Flint repo.
// esbuild comes from this folder (npm install --save-dev esbuild), else from the checkout.
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const SDK = '@nuucognition/flint-module-sdk';
const local = createRequire(join(here, 'package.json'));
const repo = process.env.FLINT_REPO ? resolve(process.env.FLINT_REPO) : null;

function load(name) {
  try { return local(name); } catch { return null; }
}

let esbuild = load('esbuild');
if (!esbuild && repo) {
  // esbuild comes with tsup, the bundler of the Flint repo.
  esbuild = createRequire(createRequire(join(repo, 'apps/flint-cli/package.json')).resolve('tsup'))('esbuild');
}
let alias = {};
try {
  local.resolve(`${SDK}/package.json`);
} catch {
  const sdk = repo && join(repo, 'packages/flint-module-sdk/src/index.ts');
  if (sdk && existsSync(sdk)) alias = { [SDK]: sdk };
  else esbuild = null;
}
if (!esbuild) {
  console.error(`build.mjs: no esbuild or no ${SDK}. Set FLINT_REPO to a checkout of the Flint repo, then run flint module build again.`);
  process.exit(1);
}
await esbuild.build({
  entryPoints: [join(here, 'src/index.ts')],
  outfile: join(here, 'dist/index.js'),
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  legalComments: 'none',
  logLevel: 'warning',
  alias,
});
```

## `package.json`

```json
{
  "name": "[the slug of the module name]",
  "version": "[the version of module.yaml]",
  "private": true,
  "type": "module",
  "description": "[What the module does.] Flint runs the bundle dist/index.js; the build is node build.mjs",
  "scripts": { "build": "node build.mjs" },
  "devDependencies": { "esbuild": "^0.25.5" }
}
```

## Design Guidelines

- **Build, then check.** `FLINT_REPO=<checkout> flint module build <name>`, then `flint module status <name>` (it runs the plan and writes nothing).
- **One file at run time.** Bundle every dependency into `dist/index.js`. Do not rely on `node_modules` in the build folder: the build copies no `node_modules`.
- **Await the tools that return a promise:** `m.flint(...)`, and in `live` `m.register`, `m.status`, and `m.controller`.
- **Settings through Flint.** A command that changes a setting runs `await m.flint('module', 'settings', m.ctx.module.name, 'set', key, valueText)`, then tells the person to run `flint sync`. `valueText` is one TOML value: `JSON.stringify(text)` for a string, `'true'` or `'false'`, a number as text, or an inline table such as `'{ key = "value" }'`. The JSON of an object or of `null` is not TOML, and Flint refuses it.
- **Log lines.** `m.log(message, level?)` (`info` or `warn`) in `plan` and `apply` gives a line that `flint sync` shows under `Module logs`; in a command or the live process it writes to stderr. In `plan` and `apply` the SDK sends other writes to stdout to stderr, and Flint shows them only when the process fails; stdout holds only the JSON of Flint.
- **Commit `dist/`.** A release refuses a build output that is not in the commit.
