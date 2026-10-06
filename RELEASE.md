# Knap Releases

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