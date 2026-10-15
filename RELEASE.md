# Knap Releases

## Release 1.3.0

- New knowledge `knw-knap-invocations`: the reference of the invocation file of a workflow (`shard-invocation/0.1` and `0.2`, NUU Orbh Tasks 743 and 744). It covers when to add one, the name and the place, each field with its rule, the places and the phases of behaviours, the tokens and the quoting rules, behaviour scripts (the environment, the exit codes, record before run, the time limit, and the output cap), nesting with `calls` and outputs, a complete example (`wkfl-proj-do_task` of Projects 1.6.0), and the common mistakes.
- `knw-knap-cli`: a new section "Invocations" with `flint shard invoke`, `flint shard step`, and `flint shard invocations`.
- `init-knap`, `knw-knap-architecture`, `knw-knap-manifest`, and the README list invocation files among the files of a shard. `wkfl-knap-create_shard` has a new step 7: when to add an invocation file.
- The commands need a Flint CLI with shard invocations 0.2 (NUU Orbh Task 744).

## Release 1.2.4

- `knw-knap-module` and the module templates: the `logs` of `plan` and `apply`, the SDK tool `log` (bounded by the SDK: at most 50 lines, cut after 500 characters, invalid entries dropped and counted), and how `flint sync` shows a module: each line `(module) <name>: …`, the apply detail after ` — `, and the section `Module logs` (NUU Flint Task 1130).

## Release 1.2.3

- `knw-knap-module`: a new section "Run Flint from a Module": a module runs any Flint command through `FLINT_CLI`; where to call it (a command or the live process, never `plan`); a `flint sync` from a module skips the module step; no API of the Flint server; `flint git sync` commits every change (`git add -A`); credentials; and a tested example of a live module that runs `flint git sync` on a timer. The anti-pattern about `flint sync` in a module is corrected.

## Release 1.2.2

- The dependency on the Flint shard accepts any version (`"@nuucognition/flint": ""`), so the shard works with Flint 0.3.x and with Flint 0.4.0 (NUU Flint Task 1129).

## Release 1.2.1

- `knw-knap-module`: a secret can also come from the environment of the caller; `module-secret-missing` means that the module process has no non-empty value of that name (found by the review of the Flint docs, NUU Flint Task 1129).

## Release 1.2.0

- Knap covers modules too: a module is the package kind `module` (`@<org>/module/<slug>`, `Modules/`, `module.yaml`) of the Flint 0.7.0 CLI. NUU Flint Task 1128.
- New knowledge `knw-knap-module`: the contract for a module author. It covers the files, `module.yaml`, the process contract (`plan`, `apply`, `command`, `live`) with its JSON, desired cron schedules and stations with the owner rule and the field rules, settings and their write through `flint module settings`, env files and secrets, live modules and the controller routes, both SDKs, build, install, and release, safe defaults, and anti-patterns.
- New templates: `tmp-knap-module_yaml-v0.1`, `tmp-knap-module_python-v0.1` (a starter `main.py`), and `tmp-knap-module_typescript-v0.1` (a starter `src/index.ts`, `build.mjs`, and `package.json`). Both starters run as they are.
- New workflow `wkfl-knap-knap_module`: create or change a module in five stages (Load, Design, Build, Verify, Finalize), with a review by the person. No schedule fires without the yes of the person, and the agent never runs `flint git sync`.
- Requires a Flint CLI with `flint module` (Flint 0.7.0).

## Release 0.1.0