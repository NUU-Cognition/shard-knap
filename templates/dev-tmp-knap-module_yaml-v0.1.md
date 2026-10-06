---
description: "Module manifest (module.yaml) file structure"
---

# File: Modules/(Source Local) <Name>/module.yaml

# Naming and Placement

| | |
|---|---|
| Path | `module.yaml` at the root of the module source (`Modules/(Source Local) <Name>/`). Never prefixed: a module source has no `dev-` files. The build `Modules/<Name>/` carries a copy |
| Required | Yes — every module MUST have one |

The manifest defines the identity of the module (the package name `module`, the id, the name), how Flint runs it (`runtime`, `entry`, `kind`), and what it gives a person (`commands`, `secrets`, `settings`). No command writes it: write it by hand once, then edit it. See [[dev-knw-knap-module]] § The Manifest for the rules.

```yaml
module-spec: "0.1.0"
module: "[the package name @<org>/<slug>: the org of the Flint (flint.json#org) and the slug of the name, e.g. @nuucognition/dms; @/<slug> when the Flint has no org]"
id: [a new uuid v4: python3 -c "import uuid; print(uuid.uuid4())". Make it once; never change it]
name: [Module name: the Display Name law; Proper Case is the convention. Its slug is the slug of `module`]
version: [semver version: 0.1.0 for a new module]
description: [What the module does for the machine, one sentence]
flint: "^0.7"
runtime: [python (entry main.py, no build) | node (entry dist/index.js, build node build.mjs) | command (an executable)]
entry: [main.py | dist/index.js | the path of the executable, relative to the folder]
kind: [sync (plan, apply, and commands only) | live (also a long-running process under the Flint server)]

/* Optional: the commands of `flint module <name> <command>`. Each name is a kebab word. Only a listed command runs. */
commands:
  - name: [kebab-command-name]
    description: [What the command does, one sentence]
  - (continue)

/* Optional: the env names that the module needs (A-Z, 0-9, _; never FLINT_*). Add each name to flint.env.example of the Flint.
   In the plan, secret(name) gives the issue module-secret-missing when no env file sets it. */
secrets:
  - [SECRET_NAME]
  - (continue)

/* Optional: the keys of Modules/<Name>.settings.toml. The type is a text for people and agents; Flint does not check values.
   Safe default: a key that starts an agent run (a cron schedule, its owner) has no value in a new settings file. */
settings:
  [key]: { type: [string|boolean|number|table], description: [What the key does, and what a change starts] }
  (continue)

/* Only for runtime node (or another runtime that needs a build): a command line that runs in the source folder before the copy.
   The build output (dist/) must be in the source; Git ignores node_modules/ inside Modules/. */
build: "node build.mjs"

dependencies: {}
```

## Rules

- `module-spec`: `"0.1.0"` is the only spec.
- `module`: always quoted (YAML reserves `@`). The slug MUST be the slug of `name` (`Hello TS` gives `hello-ts`); a mismatch is a manifest error. The address is `@<org>/module/<slug>`.
- `id`: a uuid v4 (v7 is accepted), lowercase. Every lock and the registry find the module by it.
- `entry`: a relative path inside the build, with no `..` segment.
- `kind`: `sync` is the default. A `live` module must call the live tools of its SDK (or the SDK registers it after the handler).
- `commands`: a record name of `[modules]` is never a reserved verb of `flint module`; a command name has no such limit.
- `secrets`: a name that starts with `FLINT_` is refused.
- `build`: omit it for a Python module and for a `command` module that needs no build.
- `dependencies`: Flint 0.7.0 reads it and installs nothing for it. Keep `{}`.

## Not Declared Here

- The record name (`[modules]` key): `flint module build <name>` writes it; `--name` sets another one.
- The settings values: they live in `Modules/<Name>.settings.toml`, which the Flint owns.
- The env values: they live in `flint.env` and `flint.env.local`.
