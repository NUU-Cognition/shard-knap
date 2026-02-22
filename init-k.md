# Knap (Flintknapping)

Shard authoring toolkit. Everything you need to create, develop, validate, and publish Flint shards.

Knap treats shard authoring as a craft — "flintknapping" — shaping raw capability into polished, reusable tools. This shard provides the templates, workflows, and knowledge to author shards that follow Flint conventions.

## What Is a Shard

A shard is a self-contained unit of agent capabilities. Each shard focuses on one domain and provides:

- **Init file** — Context loaded when the agent needs this shard
- **Skills** — Atomic, single-purpose tasks (no human checkpoints)
- **Workflows** — Multi-stage tasks with human review points
- **Templates** — Structural guides for creating artifacts
- **Knowledge files** — Deep reference material on a topic
- **Scripts** — Deterministic CLI operations (Node.js)
- **Assets** — Non-markdown files (images, data, configs)
- **Install files** — Dashboards and system files placed into the Mesh

## Shard Structure

```
Shards/[Shard Name]/
├── shard.yaml              # Manifest (required)
├── init-<sh>.md            # Context file (required)
├── README.md               # Documentation
├── skills/                 # Atomic tasks
│   └── sk-<sh>-<name>.md
├── workflows/              # Multi-stage tasks
│   └── wkfl-<sh>-<name>.md
├── templates/              # Artifact structure guides
│   └── tmp-<sh>-<name>.md
├── knowledge/              # Deep reference material
│   └── knw-<sh>-<name>.md
├── assets/                 # Non-markdown files
│   └── ast-<sh>-<name>.<ext>
├── scripts/                # Node.js CLI scripts
│   └── <name>.js
└── install/                # Files installed into Mesh
    └── *.md
```

For complete architecture details, see [[knw-k-architecture]].

## File Naming

All shard files use the shorthand (`<sh>`) as a namespace:

| File Type | Pattern | Example |
|-----------|---------|---------|
| Init | `init-<sh>.md` | `init-proj.md` |
| Skill | `sk-<sh>-<name>.md` | `sk-proj-create_task.md` |
| Workflow | `wkfl-<sh>-<name>.md` | `wkfl-proj-do_task.md` |
| Template | `tmp-<sh>-<name>.md` | `tmp-proj-task.md` |
| Knowledge | `knw-<sh>-<name>.md` | `knw-proj-lifecycle.md` |
| Asset | `ast-<sh>-<name>.<ext>` | `ast-proj-diagram.svg` |
| Obsidian Template | `otmp-<sh>-<name>.md` | `otmp-proj-task.md` |
| Script | `<name>.js` | `newtasknum.js` |

## Shard Manifest (shard.yaml)

The manifest defines shard metadata, dependencies, and installation behavior.

For the complete schema reference, see [[knw-k-manifest]].

```yaml
version: "1.0.0"
name: Shard Name
shorthand: sh
description: What this shard does
depends:
  - f                       # Always depend on Flint (core)
  - ld                      # Other shard shorthands
install:
  - source: (Dashboard) X.md
    dest: Mesh/(Dashboard) X.md
    once: true
folders:
  - Mesh/Types/MyType/
```

## Dev Shard Authoring

Dev shards live inside the workspace at `Shards/(Dev) Name/` for live development and testing. They are fully functional — agents can load and use them immediately.

To create a dev shard, use [[wkfl-k-create_shard]].

## Shard CLI

```bash
flint shard list                       # List installed shards
flint shard <shorthand>                # Show shard info + actions
flint shard install <source>           # Install from source
flint shard pull <shorthand>           # Sync shard from source
flint shard <shorthand> <script>       # Run shard script
```

## Obsidian Templates

Shards can provide human-facing templates for Obsidian's template picker, distinct from agent templates:

| Type | Prefix | Location | Audience |
|------|--------|----------|----------|
| Agent templates | `tmp-` | `Shards/<Name>/templates/` | Agents (bracket syntax, generation instructions) |
| Obsidian templates | `otmp-` | `Shards/(System) Obsidian Templates/` | Humans (pre-filled frontmatter, direct insertion) |

Obsidian templates use `{{uuid}}` and `{{date}}` placeholders which are resolved at install time. Declare them in `shard.yaml` install entries:

```yaml
install:
  - source: otmp-proj-task.md
    dest: "Shards/(System) Obsidian Templates/otmp-proj-task.md"
    once: true
```

## Shard Repos

Shards can declare Git repositories to clone into the workspace. Repos are cloned to `Shards/(System) Repos/<name>/` (shallow clone, gitignored). Declare them in `shard.yaml`:

```yaml
repos:
  - name: my-codebase
    url: https://github.com/org/repo.git
    branch: main                       # Optional
```

`flint shard pull` syncs repos alongside install entries.

## Skills

| Skill | File | Purpose |
|-------|------|---------|
| Validate | `sk-k-validate.md` | Validate shard structure and conventions |

## Workflows

| Workflow | File | Purpose |
|----------|------|---------|
| Create Shard | `wkfl-k-create_shard.md` | Scaffold a new shard from scratch |
| Iterate | `wkfl-k-iterate.md` | Add capabilities to an existing shard |

## Templates

| Template | File | Purpose |
|----------|------|---------|
| Shard YAML | `tmp-k-shard_yaml.md` | shard.yaml manifest |
| Init File | `tmp-k-init.md` | Shard init/context file |
| Skill | `tmp-k-skill.md` | Skill file |
| Workflow | `tmp-k-workflow.md` | Workflow file |
| Template | `tmp-k-template.md` | Template file (meta-template) |
| Knowledge | `tmp-k-knowledge.md` | Knowledge/reference file |
| Script | `tmp-k-script.md` | Node.js CLI script |

## Knowledge

| Knowledge | File | Topic |
|-----------|------|-------|
| Shard Architecture | `knw-k-architecture.md` | Complete shard structure and design principles |
| Manifest Schema | `knw-k-manifest.md` | Full shard.yaml reference |
