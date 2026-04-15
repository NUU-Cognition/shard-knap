---
description: "Create a new shard from scratch"
---

Run `flint shard start-dev knap` if you haven't already.

# Workflow: Create Shard

Scaffold a new dev shard in the workspace.

# Input

- Shard name and purpose
- Desired shorthand (2-4 characters)
- Dependencies (other shards this shard requires)
- What artifacts, skills, workflows, and templates it will provide
- Whether it needs setup (and at what scope)

# Actions

## Stage 1: Design

Confirm the shard design with the user:

1. **Validate the shorthand** — must be 2-4 lowercase characters and not conflict with existing shards (check `flint shard list`)
2. **Define the domain** — what one thing does this shard do? A shard should have single responsibility.
3. **List capabilities:**
   - What artifacts does it manage? (What `(Type)` name, what subtypes, what template)
   - What skills does it provide? (Atomic tasks)
   - What workflows does it provide? (Multi-stage tasks)
   - What knowledge does it need? (Deep reference material)
   - Does it need dashboards or other install files? (Dashboards, system files, Obsidian templates)
   - Does it need scripts? (Deterministic CLI operations)
   - Does it need folders created? (Artifact storage, archive — declared in `folders:`)
   - Does it need one-time setup? (Credentials, repo clones, builds — declared via `setup:` + `dev-setup-<sh>.md`)
4. **Identify dependencies** — which other shards must be installed first

Present the design to the user for confirmation. Once confirmed, progress to the next stage.

## Stage 2: Scaffold

Create the shard structure. Prefer `flint shard create` to scaffold a new Dev Local shard at `Shards/(Dev Local) [Name]/`. Promote later to Dev Remote with `flint shard dev <shorthand>` once a git remote is ready.

1. Create the directory structure. Source files in dev folders are prefixed `dev-` **except inside `install/`** (literal payloads) — see [[dev-knw-knap-architecture#Dev Prefix Rules]]:
   ```
   Shards/(Dev Local) [Name]/
   ├── shard.yaml
   ├── dev-init-<sh>.md
   ├── dev-setup-<sh>.md          # only if `setup:` is declared
   ├── skills/                    # dev- prefix; subfolder groupings allowed
   ├── workflows/                 # dev- prefix; subfolder groupings allowed
   ├── templates/                 # dev- prefix; subfolder groupings allowed
   ├── knowledge/                 # dev- prefix; subfolder groupings allowed
   ├── assets/                    # dev- prefix
   ├── scripts/                   # dev- prefix
   ├── migrations/                # dev- prefix
   └── install/                   # NO dev- prefix
   ```
   Only create subdirectories that will have files. Add `dev-hinit-<sh>.md` if the shard will be used in headless Orbh sessions. For program-size shards, consider subfolder groupings under `skills/`, `workflows/`, `templates/`, or `knowledge/` — filename convention does not change.

2. Create `shard.yaml` using [[dev-tmp-knap-shard_yaml-v0.1]] — declare `dependencies`, and any `types`, `folders`, or `setup` as needed. Scripts, skills, workflows, templates, and knowledge are auto-discovered — do not declare them in the manifest.
3. Create `dev-init-<sh>.md` using [[dev-tmp-knap-init-v0.1]] — include `required-reading` YAML frontmatter
4. Optionally create `dev-hinit-<sh>.md` for headless sessions
5. If `setup:` is declared in `shard.yaml`, create `dev-setup-<sh>.md` using [[dev-tmp-knap-setup-v0.1]] — required lifecycle file at the shard root
6. Create skill files using [[dev-tmp-knap-skill-v0.1]] — each must have `description` frontmatter
7. Create workflow files using [[dev-tmp-knap-workflow-v0.1]] — each must have `description` frontmatter. For headless variants, create `dev-hwkfl-<sh>-<name>.md` alongside; the context line at the top of every `hwkfl-*` file is `flint shard hstart <sh>` (not `start`)
8. Create template files using [[dev-tmp-knap-template-v0.1]] — each must have `description` frontmatter
9. Create knowledge files using [[dev-tmp-knap-knowledge-v0.1]] — each must have `description` frontmatter
10. Create script files using [[dev-tmp-knap-script-v0.1]] as `scripts/dev-<name>.js` — auto-discovered, no manifest declaration needed
11. Create install files (**no `dev-` prefix** — dashboards as `(Dashboard) Name.md`, obsidian templates as `otmp-<sh>-<name>.md`) and declare any that install outside `Mesh/Metadata/Types/` under `install:`. Type-definition files declared via `types:` are auto-resolved — create them at `install/type-<sh>-<type>[_<subtype>].md` using [[dev-tmp-knap-type-v0.1]].
12. Create `README.md` with shard overview and structure

Once scaffold is complete, progress to the next stage.

## Stage 3: Verify

1. Run [[dev-sk-knap-validate]] on the new shard
2. Fix any issues found (particularly: missing `description` frontmatter, dev-prefix violations in `install/`, missing `dev-setup-<sh>.md` when `setup:` is declared)
3. Confirm with the user that the shard is ready for use
4. Inform the user the shard is ready for immediate use

# Output

- Complete shard scaffold with all planned files
- Validation passing
- Shard ready for use
