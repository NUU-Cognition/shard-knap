---
required-reading:
  - "[[dev-knw-knap-architecture]]"
  - "[[dev-knw-knap-manifest]]"
  - "[[dev-knw-knap-cli]]"
---

# Knap (Flintknapping)

Shard authoring toolkit. Everything you need to create, build, validate, and release Flint shards.

Knap treats shard authoring as a craft — "flintknapping" — shaping raw capability into polished, reusable tools. This shard provides the templates, workflows, and knowledge to author shards that follow Flint conventions.

## What Is a Shard

A shard is a self-contained unit of agent capabilities. Each shard focuses on one domain and provides:

- **Init file** — Interactive context loaded when the agent needs this shard
- **Headless init** — Alternate init used when running in a headless Orbh session (optional)
- **Setup file** — One-time setup lifecycle instructions (required if `setup:` is declared)
- **Skills** — Atomic, single-purpose tasks (no human checkpoints)
- **Workflows** — Multi-stage tasks with human review points
- **Headless workflows** — Alternate workflows for headless sessions (optional)
- **Templates** — Structural guides for creating artifacts
- **Knowledge files** — Deep reference material on a topic
- **Scripts** — Deterministic Node.js operations auto-discovered from `scripts/*.js`
- **Types** — Artifact type definitions installed to `Mesh/Metadata/Types/`
- **Assets** — Non-markdown files (images, data, configs)
- **Install files** — Dashboards and system files placed into the Mesh
- **Migrations** — Upgrade scripts for bumping installed shard versions

## Source and Shard

A shard is a package with two entities:

| Entity | Folder | Id | Loaded by |
|--------|--------|----|-----------|
| The **source**: the files a person edits | `Shards/(Source Local) <Name>/` (no repository) or `Shards/(Source Remote) <Name>/` (a clone of a repository) | `shard.yaml#source.id` | `flint shard start-dev` |
| The **shard**: the built package | `Shards/<folder>/`: the name when the alias is the slug of the name, else the alias as a Title | `shard.yaml#id` | `flint shard start` |

The address is `@org/shard/<slug>` (the slug is `slugKey(name)`); `@org/<slug>` is its short form. The words are in the glossary of the spec ([[(Spec) Flint Shards#Glossary]]). **Build** makes the shard from the source: `flint shard build <alias>`. A build of a clean Git source is a `snapshot` with the sha; a build of a local source or of a source with changes is `edited`. **Install** puts the selected package into a Flint. The lock state says what the install got: `published` when the hash of the build is the hash of the registry tag, `snapshot` with the sha of a known Git commit, or `edited` (no proof). The lock (`flint.json#shards[<id>]`) records the state of each shard; the NUU Shard Registry records the versions.

Source files are prefixed `dev-` (e.g., `dev-init-<sh>.md`). The build strips the prefix. Files in `install/` are the exception: they are literal payloads and carry no prefix in either folder.

## Shard Structure

```
Shards/(Source Remote) [Name]/     # or Shards/(Source Local) [Name]/
├── shard.yaml                # Manifest (required)
├── dev-init-<sh>.md          # Interactive init (required)
├── dev-hinit-<sh>.md         # Headless init (optional)
├── dev-setup-<sh>.md         # Setup lifecycle file (if setup: declared)
├── README.md                 # Documentation
├── skills/
│   └── dev-sk-<sh>-<name>.md
├── workflows/
│   ├── dev-wkfl-<sh>-<name>.md
│   └── dev-hwkfl-<sh>-<name>.md
├── templates/
│   └── dev-tmp-<sh>-<name>-v<X.X>.md
├── knowledge/
│   └── dev-knw-<sh>-<name>.md
├── assets/
│   └── dev-ast-<sh>-<name>.<ext>
├── scripts/
│   └── dev-<name>.js
├── migrations/               # Optional
│   └── dev-mig-<sh>-<from>-to-<to>.md
└── install/                  # NOT prefixed
    └── *.md
```

For complete architecture details, see [[dev-knw-knap-architecture]].

## File Naming

All shard files use the shorthand (`<sh>`) as a namespace:

| File Type | Pattern | Example |
|-----------|---------|---------|
| Init | `init-<sh>.md` | `init-proj.md` |
| Headless Init | `hinit-<sh>.md` | `hinit-proj.md` |
| Setup | `setup-<sh>.md` | `setup-proj.md` |
| Skill | `sk-<sh>-<name>.md` | `sk-proj-create_task.md` |
| Workflow | `wkfl-<sh>-<name>.md` | `wkfl-proj-do_task.md` |
| Headless Workflow | `hwkfl-<sh>-<name>.md` | `hwkfl-proj-do_task.md` |
| Template | `tmp-<sh>-<name>-v<X.X>.md` | `tmp-proj-task-v0.1.md` |
| Knowledge | `knw-<sh>-<name>.md` | `knw-proj-lifecycle.md` |
| Asset | `ast-<sh>-<name>.<ext>` | `ast-proj-diagram.svg` |
| Migration | `mig-<sh>-<from>-to-<to>.md` | `mig-proj-1.0.0-to-1.1.0.md` |
| Install Payload | `inst-<sh>-<name>.md` (under `install/`, no `dev-` prefix) | `inst-proj-backlog_dashboard.md` |
| Obsidian Template | `otmp-<sh>-<name>.md` (under `install/`, no `dev-` prefix) | `otmp-proj-task.md` |
| Type Definition | `type-<sh>-<type>[_<subtype>].md` (under `install/`, no `dev-` prefix) | `type-proj-task.md` |
| Script | `<name>.js` (under `scripts/`; in the shard: `<name>.js`, in the source: `dev-<name>.js`) | `newtasknum.js` |

Source files add a `dev-` prefix (e.g., `dev-sk-proj-create_task.md`, `dev-ast-proj-diagram.svg`, `dev-mig-proj-1.0.0-to-1.1.0.md`). The only exception is `install/` — its contents are user-facing artifacts and carry no prefix.

## Shard Manifest (shard.yaml)

The manifest defines identity (the shard id, the org, the source id), dependencies, setup lifecycle, and installation behavior.

For the complete schema reference, see [[dev-knw-knap-manifest]].

```yaml
shard-spec: "0.3.0"
id: 00000000-0000-4000-8000-000000000000    # The shard id, minted by flint shard create — never edit
org: nuucognition                          # The package is @nuucognition/shard/shard-name
source:
  id: 00000000-0000-4000-8000-00000000000a  # The source id, minted by flint shard create — never edit
version: "1.0.0"
name: Shard Name
shorthand: sh
description: What this shard does
dependencies:
  "@nuucognition/flint": "^0.2"            # Always depend on Flint (core)
  "@nuucognition/notepad": "^1.0"          # A package name and a range
setup: full                                 # full | flint | local
types:
  - Task
install:
  - source: (Dashboard) X.md
    dest: Mesh/(Dashboard) X.md
    mode: once
folders:
  - Mesh/Archive/Tasks/
```

## Authoring a Source

`flint shard create "<Name>"` makes a local source at `Shards/(Source Local) <Name>/`, mints the two ids, and builds the shard. Edit the source, then run `flint shard build <alias>` to make the shard again. `flint shard start` loads the build and prints a notice with `flint shard build <alias>` when the source changed after the build. `flint shard dev <alias> <url>` promotes the local source to a remote source; `flint shard release <alias>` tags a version and registers it. To edit a published shard, `flint shard clone @org/name` clones its source.

To create a shard, use [[dev-wkfl-knap-create_shard]]. Run `flint shard start-dev knap` to see all available workflows and skills.

## Shard CLI

`flint shard` is the only supported way to change shard state. Every authoring action — create, build, dev, clone, release, install, update, fork, rename, id, uninstall, run scripts, migrate — has a CLI command. A command names a shard by a `<ref>`: its alias, shorthand, address, or id; a former address or a former shorthand resolves with the note `moved: <old> is now <new>` ([[dev-knw-knap-cli]] § The Ref). A rename is `flint shard rename <alias> --name "<Name>"` (one manifest edit; every Flint heals at `flint sync`). Always use the CLI; do not edit `flint.json#shards` or `.flint/shards.json`, do not write `id`, `source.id`, `formerNames`, or `of` by hand, and do not rename folders by hand.

For the full command surface, the package spec `@org/name[@version][#place]`, the resolution walk, the authoring flow, and anti-patterns, see [[dev-knw-knap-cli]].

## Obsidian Templates

Shards can provide human-facing templates for Obsidian's template picker, distinct from agent templates:

| Type | Prefix | Location | Audience |
|------|--------|----------|----------|
| Agent templates | `tmp-` | `templates/` of the build | Agents (bracket syntax, generation instructions) |
| Obsidian templates | `otmp-` | `Shards/(Shards) Obsidian Templates/` | Humans (pre-filled frontmatter, direct insertion) |

Obsidian templates use `{{uuid}}` and `{{date}}` placeholders resolved at install time. Declare them in `shard.yaml` install entries:

```yaml
install:
  - source: otmp-proj-task.md
    dest: "Shards/(Shards) Obsidian Templates/otmp-proj-task.md"
    mode: once
```
