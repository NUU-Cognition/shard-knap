# Knap (Flintknapping)

Package authoring toolkit for Flint: shards and modules. Everything you need to create, build, validate, and release shards and modules that follow Flint conventions.

Named after flintknapping — the craft of shaping raw stone into tools.

## Structure

```
Shards/(Source Remote) Knap/             # the source; the build is Shards/Knap/
  shard.yaml                              # Manifest
  dev-init-knap.md                        # Init with required-reading
  skills/
    dev-sk-knap-validate.md               # Validate shard structure
  workflows/
    dev-wkfl-knap-create_shard.md         # Scaffold a new shard
    dev-wkfl-knap-iterate.md              # Add capabilities to existing shard
    dev-wkfl-knap-knap_shard.md           # Load and edit a shard collaboratively
    dev-wkfl-knap-knap_module.md          # Create or change a module with review stages
    dev-wkfl-knap-migrate_headless_to_modes.md  # Merge the headless files of a source into its normal files (with an invocation file)
    dev-wkfl-knap-migrate_shard_spec_0.1.0_to_0.2.0.md  # Upgrade a 0.1.0 shard to 0.2.0
  templates/
    dev-tmp-knap-shard_yaml-v0.1.md       # shard.yaml manifest template
    dev-tmp-knap-init-v0.1.md             # Init file template
    dev-tmp-knap-skill-v0.1.md            # Skill file template
    dev-tmp-knap-workflow-v0.1.md         # Workflow file template
    dev-tmp-knap-template-v0.1.md         # Template file (meta-template)
    dev-tmp-knap-knowledge-v0.1.md        # Knowledge file template
    dev-tmp-knap-script-v0.1.md           # Script file template
    dev-tmp-knap-setup-v0.1.md            # Setup lifecycle file template
    dev-tmp-knap-type-v0.1.md             # Type definition file template
    dev-tmp-knap-module_yaml-v0.1.md      # module.yaml manifest template
    dev-tmp-knap-module_python-v0.1.md    # Starter main.py of a Python module
    dev-tmp-knap-module_typescript-v0.1.md  # Starter src/index.ts, build.mjs, package.json of a TypeScript module
  knowledge/
    dev-knw-knap-architecture.md          # Shard architecture reference
    dev-knw-knap-manifest.md              # shard.yaml schema reference (id, shard, source, dependencies)
    dev-knw-knap-cli.md                   # flint shard CLI reference
    dev-knw-knap-module.md                # Module authoring reference: the process contract and both SDKs
    dev-knw-knap-invocations.md           # Invocation file reference: inputs, steps, outputs, behaviours, nesting
  scripts/
    dev-check-modes.js                    # flint shard knap check-modes: the static checks of the modes
    dev-prefix-shard.js                   # flint shard knap prefix-shard: add or strip the dev- prefix
  install/
    type-knap-shard.md                    # Shard artifact type definition
```

## What This Shard Covers

- **Shard structure** — File types, naming conventions, directory layout
- **Manifest schema** — Complete shard.yaml reference: the shard id (`id`), the package name (`shard`), the source id (`source.id`), and the dependency map. Below spec `0.4.0`, the manifest has `org` in place of `shard`
- **Source and shard** — the two entities, the build, the states, the lock, the registry, the rename, references, forks (the words: [[(Spec) Flint Shards#Glossary]])
- **Shard distribution** — How to release, clone, and install shards
- **Templates for everything** — Every shard file type has a template
- **Validation** — Check shard correctness
- **Scaffolding workflow** — Create new shards from scratch
- **Iteration workflow** — Add capabilities to existing shards
- **Invocation files** — The machine contract of a workflow (`shard-invocation/0.1`, `0.2`, and `0.3`): inputs, steps with their stages and hints, outputs, `calls` to the workflow of another shard, behaviours and their scripts, and the common mistakes
- **Modules** — The module contract (`plan`, `apply`, `command`, `live`), the desired objects and the owner rule, settings, env files and secrets, both SDKs, and the workflow `knap_module` with templates for `module.yaml`, a Python module, and a TypeScript module
