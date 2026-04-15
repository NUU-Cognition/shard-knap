---
description: "Complete reference for shard structure, file types, lifecycle modes, headless mode, migrations, and design principles"
---

# Knowledge: Shard Architecture

Complete reference for shard structure, file types, lifecycle modes, design principles, and how shards fit into the Flint ecosystem.

## Core Concepts

### Shards Are Self-Contained

A shard is a single coherent unit of capability. It owns everything it needs — context, skills, workflows, templates, knowledge, scripts, install files, types, and migrations. No shard should require reading another shard's internal files (though it can depend on another shard being installed).

### Shards Are On-Demand

Agents load shard context only when needed. The init file is the entry point — it provides enough context to use the shard without loading every file. Skills, workflows, templates, and knowledge are loaded individually as needed.

### Shards Are Namespaced

Every shard file uses the shorthand as a namespace prefix: `sk-proj-`, `tmp-inc-`, `knw-f-`. This prevents naming collisions between shards and makes it clear which shard owns a file.

## Lifecycle Modes

Every shard is in one of three lifecycle modes. The folder-name prefix signals the mode:

| Mode | Folder | Purpose |
|------|--------|---------|
| `installed` | `Shards/<Name>/` | Installed from registry, pinned to a version. Do not edit directly — changes are overwritten on update. |
| `dev-remote` | `Shards/(Dev Remote) <Name>/` | Local dev copy with a git remote. Edits flow back to origin via `flint shard push`. |
| `dev-local` | `Shards/(Dev Local) <Name>/` | Local dev copy, no remote. Use `flint shard dev <shorthand>` to promote to remote. |

Dev shards coexist with installed copies. When both exist, `flint shard install --all-dev` (re)installs the dev sources into the `installed` folders. Dev-only commands (`rename`, `push`, `pull`, `dev`, `publish`, `release`) resolve to the dev shard first via `resolveShardFolder(..., { devOnly: true })`, so users don't need to disambiguate manually.

## Dev Prefix Rules

Source files in `(Dev Remote)` and `(Dev Local)` folders are prefixed `dev-` so the installer can distinguish dev sources from installed copies and strip the prefix when copying. **This rule is not uniform** — the `install/` folder is an explicit exception.

| Location | Prefix rule | Why |
|----------|-------------|-----|
| Shard root (`init`, `hinit`, `setup`) | `dev-` | Lifecycle files, stripped on install |
| `skills/`, `workflows/`, `templates/`, `knowledge/` | `dev-` | Shard source files, stripped on install |
| `assets/` | `dev-` (as `dev-ast-<sh>-<name>.<ext>`) | Source assets, stripped on install |
| `scripts/` | `dev-` (as `dev-<name>.js`) | Source scripts, stripped on install |
| `migrations/` | `dev-` | Migrations ship installed and could be overwritten on update — dev prefix keeps source distinct |
| `install/` | **no prefix** | Files under `install/` are literal payloads copied verbatim to a destination (dashboards, system files, type definitions, obsidian templates). They are not shard sources — they are user-facing artifacts that happen to ship with the shard. |

The installer refuses `install/dev-*` files (error). The healer flags non-dev-prefixed files in every other location.

## Shard Structure

```
Shards/(Dev Remote) [Name]/
├── shard.yaml                         # Manifest (required)
├── dev-init-<sh>.md                   # Interactive init (required)
├── dev-hinit-<sh>.md                  # Headless init (optional)
├── dev-setup-<sh>.md                  # Setup lifecycle file (required if `setup:` declared)
├── README.md                          # Documentation
├── skills/
│   └── dev-sk-<sh>-<name>.md
├── workflows/
│   ├── dev-wkfl-<sh>-<name>.md        # Interactive workflow
│   └── dev-hwkfl-<sh>-<name>.md       # Headless workflow (optional)
├── templates/
│   └── dev-tmp-<sh>-<name>-v<X.X>.md
├── knowledge/
│   └── dev-knw-<sh>-<name>.md
├── assets/
│   └── dev-ast-<sh>-<name>.<ext>
├── scripts/                           # Auto-discovered; no shard.yaml declaration needed
│   └── dev-<name>.js
├── migrations/
│   └── dev-mig-<sh>-<from>-to-<to>.md
└── install/                           # Files installed into Mesh or elsewhere — NO dev prefix
    └── *.md
```

Installed copies at `Shards/<Name>/` strip the `dev-` prefix from every source file (`install/` contents are copied verbatim since they never carried a prefix).

## Subfolder Groupings

`skills/`, `workflows/`, `templates/`, and `knowledge/` may contain arbitrary subfolder groupings for organization. The filename convention does not change — the subfolder is purely cosmetic. Discovery tooling (`flint shard start`) walks these directories recursively.

Example from the OrbCode shard, which ships a large number of templates organized by domain:

```
templates/
├── containers/
│   ├── dev-tmp-orbc-project-v0.2.md
│   └── dev-tmp-orbc-workspace-v0.2.md
├── context/
│   ├── dev-tmp-orbc-architecture-v0.2.md
│   └── dev-tmp-orbc-overview-v0.2.md
├── map/
│   ├── dev-tmp-orbc-feature-v0.2.md
│   └── dev-tmp-orbc-system-v0.2.md
└── verification/
    └── dev-tmp-orbc-<name>-v0.2.md
```

Guidance: introduce subfolders only when a category has 5+ files. Small shards should keep files flat under each top-level directory.

## File Types in Detail

### Init File (`init-<sh>.md`)

The shard's interactive context file — what agents load when they need this shard's capabilities.

**Purpose:**
- Explain the shard's domain and core concepts
- Declare required reading via YAML frontmatter
- Document lifecycle, state management, dashboards
- Provide enough context to use the shard without reading other files

**YAML Frontmatter:**
```yaml
---
required-reading:
  - knowledge/knw-<sh>-<name>.md
  - knowledge/knw-<sh>-<name>.md
---
```

`required-reading` lists knowledge files the agent must read after loading the init. Paths are relative to the shard root. `flint shard start` uses this to tell the agent what to read.

**Design principles:**
- No discovery tables — skills, workflows, templates, and knowledge are discovered dynamically by `flint shard start` from file `description` frontmatter
- Include state diagrams for lifecycle management
- Keep it concise — deep details go in knowledge files
- Write for agents, not humans — focus on what's actionable
- Link to knowledge files via `[[knw-<sh>-<name>]]`

### Headless Init File (`hinit-<sh>.md`)

Optional alternate init file loaded when the shard runs in a headless Orbh session. Loaded by `flint shard hstart <sh>` (the headless counterpart of `flint shard start`). Replaces the interactive init — the human-facing stages and checkpoints are gone; progress is reported via Orbh session keys.

- Auto-discovered if the file exists — no manifest declaration needed
- Same frontmatter format as the interactive init
- Typically refers to the interactive init for fundamentals and focuses on what's different in headless mode
- Running `flint shard hstart <sh>` when no `hinit-<sh>.md` exists is an error — interactive mode is the default

### Setup File (`setup-<sh>.md`)

The shard's one-time setup instructions — what agents and humans follow to prepare the shard for use. Required when the manifest declares `setup:`.

**Purpose:**
- Document all setup actions: clone repos, run builds, configure credentials, install tools
- Provide step-by-step instructions that agents can follow autonomously
- Replace the old `requires.workspace` Node.js scripts with human/agent-readable markdown

**Design principles:**
- Same tier as the init file — lives at the shard root, not in a subfolder
- Dev-prefixed in dev folders (`dev-setup-<sh>.md`), installed as `setup-<sh>.md`
- The setup file is the single source of truth for what needs to happen before the shard works
- After completing setup, mark the state file's `setup` field as `completed`

### Skills (`sk-<sh>-<name>.md`)

Atomic, single-purpose tasks that run to completion without human checkpoints.

**Structure:**
```markdown
---
description: "One-line description of what this skill does"
---

Run `flint shard start <shorthand>` if you haven't already.

# Skill: [Name]

[Brief description]

# Input
- [Required inputs]

# Actions
1. [Sequential steps]

# Output
- [What it produces]
```

**Design principles:**
- `description` in YAML frontmatter is required — `flint shard start` uses it for the manifest
- One clear purpose — if it needs human review, use a workflow
- Clear input/output contract
- Reference templates via `[[tmp-<sh>-<name>]]`
- Always start with the `flint shard start` reminder line

### Workflows (`wkfl-<sh>-<name>.md`)

Multi-stage tasks with human checkpoints between stages.

**Structure:**
```markdown
---
description: "One-line description of what this workflow accomplishes"
---

Run `flint shard start <shorthand>` if you haven't already.

# Workflow: [Name]

[Brief description]

# Input
- [Required inputs]

# Actions

## Stage 1: [Name]
- [Actions]
- Once [condition], progress to the next stage

## Stage 2: [Name]
- [Actions]
- [Human checkpoint]
- Once confirmed, progress to the next stage

# Output
- [What it produces]
```

**Design principles:**
- `description` frontmatter is required
- Clear stages with explicit completion conditions
- Human checkpoints between stages (review, approval, feedback)
- "Once X, progress to the next stage" is the canonical transition phrase

### Headless Workflows (`hwkfl-<sh>-<name>.md`)

Alternate workflow files used in headless Orbh sessions. Replace the interactive `wkfl-*` counterparts — stage gates are removed and progress is reported via Orbh session keys (`phase`, `task`, `progress`, etc.).

- Auto-discovered alongside regular workflows
- Same `description` frontmatter requirement
- The context line at the top of every `hwkfl-*` file is `flint shard hstart <sh>` (not `flint shard start`) — this is how agents know they're in headless mode
- Emitted by `flint shard hstart <sh>` in place of the interactive `wkfl-*` counterpart when both exist; hidden from `flint shard start` output

### Templates (`tmp-<sh>-<name>-v<X.X>.md`)

Structural guides for artifacts the shard creates.

See [[dev-tmp-knap-template-v0.1]] for full template syntax reference.

**Design principles:**
- `description` frontmatter is required
- The template filename stem becomes the `template` field in created artifacts
- Include `[agent]-sessions` for session tracking
- Use `/* comment */` to explain non-obvious conventions

### Knowledge Files (`knw-<sh>-<name>.md`)

Deep reference material agents load when they need detailed understanding of a topic.

**Design principles:**
- `description` frontmatter is required
- One topic per file — keep them focused
- Reference-oriented, not tutorial-oriented
- Loaded on demand from the init file's `required-reading` or via `[[wikilinks]]`

### Scripts (`scripts/<name>.js`)

Node.js scripts invoked via the CLI. **Auto-discovered** from the `scripts/` folder — no `shard.yaml` declaration needed. The command name is the file stem (after stripping the `dev-` prefix in dev folders).

- Dev: `scripts/dev-<name>.js` → installed: `scripts/<name>.js` → command: `flint shard <shorthand> <name>`
- Example: `dev-new-task-number.js` → `flint shard proj new-task-number`

**Design principles:**
- Node.js only (cross-platform)
- Minimal, machine-readable output
- Use `process.env.FLINT_ROOT || process.cwd()` for flint root
- No external dependencies (Node.js built-ins only)
- Non-zero exit codes for errors

**Invocation:** `flint shard <shorthand> <name> [args...]`
**List:** `flint shard <shorthand> scripts`

### Assets (`ast-<sh>-<name>.<ext>`)

Non-markdown files that support the shard — images, SVGs, data files, configs. Dev-prefixed in dev folders (`dev-ast-<sh>-<name>.<ext>`), stripped on install.

### Install Files (`install/`)

Files placed into the Flint workspace during installation, declared in `shard.yaml` under `install:`:

- Dashboards: `(Dashboard) Name.md` → `Mesh/(Dashboard) Name.md`
- System files: `(System) Name.md` → `Mesh/(System) Name.md`
- Obsidian templates: `otmp-<sh>-<name>.md` → `Shards/(Shards) Obsidian Templates/`

Install files support `{{uuid}}` and `{{date}}` placeholders resolved at install time.

### Migrations (`migrations/`)

Migration files drive upgrades of previously-installed shards when the shard version bumps. Each migration has a stable ID of the form `<sh>-<from>-to-<to>-s<n>` (e.g., `proj-1.0.0-to-1.1.0-s1`).

- Migrations are auto-queued based on the installed-vs-latest version delta
- Types: `agent` (describes actions for an agent to perform), `script` (Node.js), `manual` (human-run)
- Status per workspace is tracked in `.flint/flint.json`
- Run with `flint shard migrate run <shorthand>`
- List pending with `flint shard migrate list <shorthand>`

The `migrations/` folder may be empty — an empty folder is valid and is skipped by the installer.

## Types and Folders

The `types` field declares the artifact types a shard manages. Each declared type installs a **type definition file** from `install/` to `Mesh/Metadata/Types/` with a shard-qualified filename:

| Declaration | Shard | Destination |
|-------------|-------|-------------|
| `Task` | Projects | `(Type) Task (Projects Shard).md` |
| `Report` | Reports | `(Type) Report (Reports Shard).md` |
| `Note.Concept` | Flint | `(Type) Note . Concept (Flint Shard).md` |

`types:` does **not** create artifact storage folders. Artifact folders are declared explicitly via `folders:`:

```yaml
types:
  - Task                              # Installs type definition file
folders:
  - "Mesh/Types/Tasks (Task)"        # Creates artifact storage folder
  - Mesh/Archive/Tasks                # Creates archive folder
```

See [[dev-knw-f-types]] for the complete type install convention.

## Setup and State

A shard that needs one-time setup declares `setup: full|flint|local` in `shard.yaml` and provides a `dev-setup-<sh>.md` lifecycle file (installed as `setup-<sh>.md`). The setup file contains human/agent-readable instructions — clone repos, run builds, authenticate, configure, whatever the shard needs.

**Setup scope:**

| Scope | Global state file | Local state file | Use case |
|-------|-------------------|------------------|----------|
| `full` | `Shards/(Shards) State/(Shard) <Name>.md` | `Shards/(Shards) Local State/(Shard) <Name> (Local).md` | Both shared and per-machine setup |
| `flint` | `Shards/(Shards) State/(Shard) <Name>.md` | — | Shared setup only |
| `local` | — | `Shards/(Shards) Local State/(Shard) <Name> (Local).md` | Per-machine setup only |

State files are agent-readable and persist across installs. Each has a `setup` frontmatter field: `required`, `not-required`, or `completed`.

**Runtime detection:** When an agent runs `flint shard start <sh>`, the command checks if expected state files exist and if their `setup` field is `required`. If any check fails (or declared `folders:` are missing), the manifest output appends:

```
SETUP REQUIRED — READ setup-<sh>.md AND REQUEST SETUP FROM THE USER BEFORE CONTINUING
```

The banner disappears once state files show `setup: completed` and all declared folders exist.

### Setup lifecycle file (`setup-<sh>.md`)

A first-class shard lifecycle file at the same tier as `init-<sh>.md`. In dev folders: `dev-setup-<sh>.md` (prefix stripped on install). Contains markdown instructions for the setup actions the shard needs. Not a type, not in `install/`, not in a subfolder.

The installer refuses to install a shard that declares `setup` but has no setup file.

## Design Principles

### Single Responsibility
Each shard handles one domain. Task management (`proj`), version tracking (`inc`), brainstorming (`ntpd`) — never multiple domains in one shard.

### Dependency Declaration
If a shard needs another shard's artifacts or conventions, declare it in `dependencies:` using `owner/repo` format (and optionally a minimum `version` floor).

```yaml
dependencies:
  - source: NUU-Cognition/shard-flint      # Core — almost always required
  - source: NUU-Cognition/shard-notepad    # If the shard creates long-lived artifacts
    version: "1.0.0"
  - source: NUU-Cognition/shard-projects   # If the shard interacts with tasks
```

### Progressive Disclosure
Init files give the overview. Skills/workflows give the instructions. Knowledge files give the depth. Templates give the structure. Agents load what they need, when they need it.

`flint shard start <name>` assembles a dynamic manifest by scanning shard files and reading their `description` frontmatter. The manifest lists:
- Required reading files (from init YAML `required-reading`)
- Init file path (or hinit path when headless)
- Skills with descriptions
- Workflows with descriptions (interactive and headless sections)
- Templates with descriptions
- Knowledge files with descriptions

This replaces hardcoded tables in init files — descriptions are maintained in each file's own frontmatter, and the manifest is always up to date.

### Convention Over Configuration
Follow naming conventions strictly. Conventions enable tooling, discovery, and interoperability:
- Shorthand in every filename
- Consistent prefix patterns (`sk-`, `wkfl-`, `hwkfl-`, `tmp-`, `knw-`, `ast-`, `hinit-`)
- Standard frontmatter fields
- Canonical state transitions

## Shard Sizing Guide

| Size | Init | Skills | Workflows | Templates | Knowledge | Subfolders | Examples |
|------|------|--------|-----------|-----------|-----------|------------|----------|
| Minimal | Yes | 0-1 | 0 | 0-1 | 0 | No | Living Documents |
| Standard | Yes | 2-4 | 1-2 | 1-3 | 0-2 | No | Notepad, Projects |
| Comprehensive | Yes | 4-8 | 2-4 | 3-6 | 2-4 | Optional | Increments, Knap |
| Program | Yes | 5+ | 5+ | 10+ | 3+ | Yes (by domain) | OrbCode |

**Program-size shards** model entire domains (e.g. OrbCode covers codebase understanding end-to-end). They organize templates and knowledge into subfolders by concept cluster (see [[#Subfolder Groupings]]). Keep the init file concise — it must still load in a single read — and lean on required-reading and `flint shard start` to surface the breadth.

Start minimal. Add capabilities as genuine needs emerge. A shard with one excellent skill is better than a shard with five mediocre ones.
