---
required-reading:
  - knowledge/knw-knap-architecture.md
  - knowledge/knw-knap-manifest.md
---

# Knap (Flintknapping)

Shard authoring toolkit. Everything you need to create, develop, validate, and publish Flint shards.

Knap treats shard authoring as a craft — "flintknapping" — shaping raw capability into polished, reusable tools. This shard provides the templates, workflows, and knowledge to author shards that follow Flint conventions.

## What Is a Shard

A shard is a self-contained unit of agent capabilities. Each shard focuses on one domain and provides:

- **Init file** — Interactive context loaded when the agent needs this shard
- **Headless init** — Alternate init used when running in a headless Orbh session (optional)
- **Skills** — Atomic, single-purpose tasks (no human checkpoints)
- **Workflows** — Multi-stage tasks with human review points
- **Headless workflows** — Alternate workflows for headless sessions (optional)
- **Templates** — Structural guides for creating artifacts
- **Knowledge files** — Deep reference material on a topic
- **Scripts** — Deterministic Node.js operations declared in the manifest
- **Types** — Artifact types that produce `Mesh/Types/<Name> (<Type>)/` folders
- **Assets** — Non-markdown files (images, data, configs)
- **Install files** — Dashboards and system files placed into the Mesh
- **Migrations** — Upgrade scripts for bumping installed shard versions

## Lifecycle Modes

Every shard is in one of three modes:

| Mode | Folder | Editable? |
|------|--------|-----------|
| `installed` | `Shards/<Name>/` | No — overwritten on update |
| `dev-remote` | `Shards/(Dev Remote) <Name>/` | Yes — changes pushed to origin |
| `dev-local` | `Shards/(Dev Local) <Name>/` | Yes — no remote |

Source files inside dev folders are prefixed `dev-` (e.g., `dev-init-<sh>.md`). The installer strips the prefix when copying to the installed folder.

## Shard Structure

```
Shards/[Shard Name]/
├── shard.yaml                # Manifest (required)
├── init-<sh>.md              # Interactive init (required)
├── hinit-<sh>.md             # Headless init (optional)
├── README.md                 # Documentation
├── skills/
│   └── sk-<sh>-<name>.md
├── workflows/
│   ├── wkfl-<sh>-<name>.md
│   └── hwkfl-<sh>-<name>.md
├── templates/
│   └── tmp-<sh>-<name>-v<X.X>.md
├── knowledge/
│   └── knw-<sh>-<name>.md
├── assets/
│   └── ast-<sh>-<name>.<ext>
├── scripts/
│   └── <name>.js
├── migrations/               # Optional
│   └── <id>.md
└── install/
    └── *.md
```

For complete architecture details, see [[knw-knap-architecture]].

## File Naming

All shard files use the shorthand (`<sh>`) as a namespace:

| File Type | Pattern | Example |
|-----------|---------|---------|
| Init | `init-<sh>.md` | `init-proj.md` |
| Headless Init | `hinit-<sh>.md` | `hinit-proj.md` |
| Skill | `sk-<sh>-<name>.md` | `sk-proj-create_task.md` |
| Workflow | `wkfl-<sh>-<name>.md` | `wkfl-proj-do_task.md` |
| Headless Workflow | `hwkfl-<sh>-<name>.md` | `hwkfl-proj-do_task.md` |
| Template | `tmp-<sh>-<name>-v<X.X>.md` | `tmp-proj-task-v0.1.md` |
| Knowledge | `knw-<sh>-<name>.md` | `knw-proj-lifecycle.md` |
| Asset | `ast-<sh>-<name>.<ext>` | `ast-proj-diagram.svg` |
| Obsidian Template | `otmp-<sh>-<name>.md` | `otmp-proj-task.md` |
| Script | `<name>.js` (under `scripts/`) | `newtasknum.js` |

Dev-mode files add a `dev-` prefix (e.g., `dev-sk-proj-create_task.md`).

## Shard Manifest (shard.yaml)

The manifest defines identity, dependencies, runtime requirements, and installation behavior.

For the complete schema reference, see [[knw-knap-manifest]].

```yaml
shard-spec: "0.2.0"
version: "1.0.0"
name: Shard Name
shorthand: sh
description: What this shard does
dependencies:
  - source: NUU-Cognition/shard-flint      # Always depend on Flint (core)
  - source: NUU-Cognition/shard-notepad
requires:
  cli:
    - node
  workspace:
    - name: setup-db
      description: Initialize the database
      source: scripts/setup-db.js
scripts:
  - name: new-number
    source: scripts/newnumber.js
types:
  - Task
install:
  - source: (Dashboard) X.md
    dest: Mesh/(Dashboard) X.md
    mode: once
folders:
  - Mesh/Archive/Tasks/
state: true
```

## Dev Shard Authoring

Dev shards live at `Shards/(Dev Remote) <Name>/` or `Shards/(Dev Local) <Name>/` for live development and testing. They are fully functional — agents can load and use them immediately, and installed copies are kept in sync with `flint shard install --all-dev`.

To create a dev shard, use [[wkfl-knap-create_shard]]. Run `flint shard start knap` to see all available workflows and skills.

## Shard CLI

Lifecycle and discovery:

```bash
flint shard list                           # List installed + dev shards
flint shard info <shorthand>               # Show detailed shard info
flint shard status <shorthand>             # Status + pending migrations
flint shard start <name>                   # Dynamic manifest (installed, interactive)
flint shard start-dev <name>               # Dynamic manifest (dev, interactive)
flint shard hstart <name>                  # Dynamic manifest (installed, headless — loads hinit, prefers hwkfl-*)
flint shard hstart-dev <name>              # Dynamic manifest (dev, headless)
flint shard heal                           # Auto-repair dev shard issues (dev-only)
```

Install / update:

```bash
flint shard install <source>               # Install from owner/repo or path
flint shard install --all-dev              # (Re)install all dev shards
flint shard update                         # Update installed shards
flint shard uninstall <shorthand>          # Remove shard and clean files
```

Dev authoring:

```bash
flint shard create                         # Scaffold a new Dev Local shard
flint shard clone <owner/repo>             # Clone as Dev Remote (no install)
flint shard dev <shorthand>                # Promote Dev Local → Dev Remote
flint shard rename <shorthand> <new>       # Rename title or shorthand (dev only)
flint shard <shorthand> pull               # Git pull on dev remote
flint shard push <shorthand>               # Commit + push dev shard
```

Versioning and publishing:

```bash
flint shard versions <shorthand>           # List remote versions
flint shard pin <shorthand> <version>      # Lock shard to version
flint shard unpin <shorthand>              # Remove version lock
flint shard release <shorthand>            # Tag + publish a new version
flint shard publish <shorthand>            # Register shard in NUU Registry
flint shard unpublish <shorthand>          # Remove from registry
flint shard published                      # List your published shards
```

Migrations and scripts:

```bash
flint shard migrate list <shorthand>       # Pending migrations
flint shard migrate run <shorthand>        # Run next migration
flint shard scripts <shorthand>            # List executable scripts
flint shard <shorthand> <script> [args]    # Run declared script
```

## Obsidian Templates

Shards can provide human-facing templates for Obsidian's template picker, distinct from agent templates:

| Type | Prefix | Location | Audience |
|------|--------|----------|----------|
| Agent templates | `tmp-` | `Shards/<Name>/templates/` | Agents (bracket syntax, generation instructions) |
| Obsidian templates | `otmp-` | `Shards/(Shards) Obsidian Templates/` | Humans (pre-filled frontmatter, direct insertion) |

Obsidian templates use `{{uuid}}` and `{{date}}` placeholders resolved at install time. Declare them in `shard.yaml` install entries:

```yaml
install:
  - source: otmp-proj-task.md
    dest: "Shards/(Shards) Obsidian Templates/otmp-proj-task.md"
    mode: once
```
