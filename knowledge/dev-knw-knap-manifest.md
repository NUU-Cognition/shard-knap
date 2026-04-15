---
description: "Complete shard.yaml schema reference — fields, install modes, dependencies, setup lifecycle, scripts, types"
---

# Knowledge: Shard Manifest (shard.yaml)

Complete reference for the `shard.yaml` manifest file — the configuration that defines a shard's identity, dependencies, runtime requirements, and installation behavior.

## Full Schema

```yaml
# Required fields
shard-spec: "0.2.0"                  # Shard spec version (conformance level)
version: "1.0.0"                     # Semantic versioning (major.minor.patch)
name: Shard Name                     # Title Case display name
shorthand: sh                        # 2-4 char lowercase identifier
description: What the shard does     # Brief description (one sentence)

# Optional fields
dependencies:                        # Shard dependencies
  - source: NUU-Cognition/shard-flint
    version: "1.0.0"                 # Optional minimum version floor
  - source: NUU-Cognition/shard-notepad

setup: full                          # Setup scope: full | flint | local

types:                               # Artifact types managed by the shard
  - Task                             # Installs type definition to Mesh/Metadata/Types/
  - Note.Concept                     # Subtype with dot separator

folders:                             # Directories to create in flint root
  - "Mesh/Types/Tasks (Task)"       # Artifact storage folder
  - Mesh/Archive/Tasks/              # Archive folder

install:                             # Files to install into the workspace
  - source: (Dashboard) Backlog.md
    dest: Mesh/(Dashboard) Backlog.md
    mode: once                       # Install only if not present (default)
  - source: (System) Init.md
    dest: Mesh/(System) Init.md
    mode: force                      # Overwrite on every install/sync
```

## Field Reference

### `shard-spec` (required)

Declares which version of the shard packaging specification this shard follows. Currently `"0.2.0"`.

All shards must include this field. It allows tooling to handle backwards compatibility when the spec evolves.

**Spec versions:**
- `"0.1.0"` — Original spec. Init files contained hardcoded Skills/Workflows/Templates/Knowledge tables. Skill/workflow files started with `Ensure you have [[init-<sh>]] in context before continuing.`
- `"0.2.0"` — Progressive disclosure. Init files strip discovery tables and declare `required-reading` in YAML frontmatter. Every skill/workflow/template/knowledge file has `description` YAML frontmatter. Skill/workflow context lines use `Run `flint shard start <shorthand>` if you haven't already.` — `flint shard start` assembles the manifest dynamically.

A spec mismatch triggers a warning, not an error — the manifest still parses. Use `flint shard heal` or the [[dev-wkfl-knap-migrate_shard_spec_0.1.0_to_0.2.0]] workflow to migrate.

### `version` (required)

Semantic version string. Format: `major.minor.patch`

- **major**: Breaking changes to the shard's interface (renamed files, removed skills, changed template structure)
- **minor**: New capabilities added (new skills, workflows, templates)
- **patch**: Bug fixes, documentation improvements

Start at `"1.0.0"` for first release. Use `"0.1.0"` for development/pre-release shards.

### `name` (required)

Human-readable display name. Title Case. Used as the installed folder name under `Shards/`.

Examples: `Projects`, `Living Documents`, `OrbCode`, `Knap`

### `shorthand` (required)

A 2-4 character lowercase alphabetic identifier used in all file names:
- `init-<sh>.md`
- `sk-<sh>-name.md`
- `wkfl-<sh>-name.md`
- `tmp-<sh>-name.md`
- `knw-<sh>-name.md`

**Rules:**
- Lowercase letters only (`/^[a-z]{2,4}$/`)
- 2-4 characters
- Must be unique across all installed shards

Examples: `f`, `proj`, `inc`, `ld`, `ntpd`, `orbc`, `knap`

### `description` (required)

Brief, single-sentence description of what the shard provides. Used in CLI output and discovery.

### `dependencies` (optional)

Array of shard dependencies. Each entry is an object with `source` (required) and `version` (optional).

```yaml
dependencies:
  - source: NUU-Cognition/shard-flint     # Core — almost always required
  - source: NUU-Cognition/shard-notepad
    version: "1.0.0"                      # Minimum version floor
```

**Fields:**

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `source` | string | yes | `owner/repo` format |
| `version` | string | no | Minimum semver floor ("at least this version") |

**Rules:**
- `source` must match `/^[\w.-]+\/[\w.-]+$/` (owner/repo format)
- Dependencies are transitive (if A depends on B, and B depends on C, A gets C too)
- Circular dependencies are not allowed

> **Backward compat:** The legacy `depends:` field with plain-string entries (e.g., `- NUU-Cognition/shard-flint`) is still accepted and auto-normalized to `{source}` objects. New manifests should use `dependencies:`.

### `setup` (optional)

Declares that the shard requires one-time setup and what scope of state files to create.

```yaml
setup: full     # Both global (tracked) and local (gitignored) state files
setup: flint    # Global state only
setup: local    # Local state only (gitignored)
```

| Value | Global state file | Local state file | Use when |
|-------|-------------------|------------------|----------|
| `full` | Yes (tracked in git) | Yes (gitignored) | Shard needs both shared setup and per-machine setup |
| `flint` | Yes (tracked in git) | No | Setup is shared — all machines see the same state |
| `local` | No | Yes (gitignored) | Setup is per-machine only (credentials, local paths) |
| *(omitted)* | No | No | Shard needs no setup |

When `setup` is declared:
- A companion `dev-setup-<sh>.md` file must exist at the shard root (installed as `setup-<sh>.md`)
- The installer creates state files under `Shards/(Shards) State/` and/or `Shards/(Shards) Local State/` based on scope
- `flint shard start` checks state files and appends a `SETUP REQUIRED` banner when setup is incomplete
- The installer refuses to install a shard that declares `setup` but has no setup file

**State file layout:**

| Scope | Path | Git tracked? |
|-------|------|-------------|
| Global | `Shards/(Shards) State/(Shard) <Name>.md` | Yes |
| Local | `Shards/(Shards) Local State/(Shard) <Name> (Local).md` | No (gitignored) |

**Note:** The `setup` field in `shard.yaml` declares scope. State files have their own `setup` frontmatter field that tracks completion status (`required`, `not-required`, `completed`). These are different fields with the same name in different contexts.

### `types` (optional)

Artifact types the shard manages. Each entry installs a type definition file from `install/` to `Mesh/Metadata/Types/` with a shard-qualified filename.

```yaml
types:
  - Task                      # Installs (Type) Task (Projects Shard).md
  - Report                    # Installs (Type) Report (Reports Shard).md
  - Note.Concept              # Installs (Type) Note . Concept (Flint Shard).md
```

**Rules:**
- Title Case, letters, numbers, and spaces
- Format: `Type`, `Multi Word Type`, or `Type.Subtype` (one level of nesting)
- Pattern: `/^[A-Z][A-Za-z0-9]*(?: [A-Z][A-Za-z0-9]*)*(?:\.[A-Z][A-Za-z0-9]*(?: [A-Z][A-Za-z0-9]*)*)?$/`

**Source resolution:** The installer looks for `install/type-<sh>-<snake_name>.md` where `<snake_name>` is the type name in lower_snake_case.

**Destination resolution:** `Mesh/Metadata/Types/(Type) <Name> (<Shard Name> Shard).md`. Subtypes use `. <Subname>` separator.

`types:` does **not** create artifact storage folders. Use `folders:` for that. See [[dev-knw-f-types]] for the full convention.

### `folders` (optional)

Plain directory paths (from flint root) to create during installation. Created empty if they don't exist. Use for artifact storage folders, archive directories, and any other folders the shard needs.

```yaml
folders:
  - "Mesh/Types/Tasks (Task)"     # Artifact storage
  - Mesh/Archive/Tasks             # Archive
```

Since `types:` only installs type definition files, shards that need artifact storage folders must declare them explicitly here.

### `install` (optional)

Array of file mappings. Each entry copies a file from the shard's `install/` folder to a destination in the flint root.

```yaml
install:
  - source: (Dashboard) Backlog.md
    dest: Mesh/(Dashboard) Backlog.md
    mode: once
```

**Fields:**

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `source` | string | required | Filename in `install/` folder (no `dev-` prefix — install files are user-facing artifacts) |
| `dest` | string | required | Destination path from flint root |
| `mode` | `once` \| `force` | `once` | Overwrite behavior |

**Install modes:**
- `once` (default) — Install only if the destination doesn't exist. Users may customize it and the shard won't overwrite their changes.
- `force` — Overwrite on every install and sync. Use for files that must stay in sync with the shard.

> **Backward compat:** Legacy boolean fields `once: true` and `force: true` are still accepted and resolved to the equivalent `mode` value. New manifests should use `mode`.

## Auto-Discovered (No Declaration Needed)

Some things are not declared in `shard.yaml` — they are discovered at runtime from the filesystem:

| Concern | Where discovered | Command name / Resolution |
|---------|------------------|---------------------------|
| Scripts | `scripts/*.js` (auto-walks the folder) | Command stem = filename (dev prefix stripped). `dev-new-task-number.js` → `flint shard <sh> new-task-number` |
| Skills | `skills/**` (recursive) | Discovery + `description` frontmatter read by `flint shard start` |
| Workflows | `workflows/**` (recursive) | Discovery + `description` frontmatter |
| Templates | `templates/**` (recursive) | Discovery + `description` frontmatter |
| Knowledge | `knowledge/**` (recursive) | Discovery + `description` frontmatter |
| Headless init / workflows | `hinit-<sh>.md`, `hwkfl-*` files | Discovery by filename prefix |

Only things with no filesystem signature of their own need explicit declaration: `types` (what Title-Case name a file represents), `folders` (paths outside `Mesh/Metadata/Types/`), `install` (source→dest mapping), `dependencies`, and `setup` scope.

## YAML Quoting Guide

YAML is permissive about unquoted strings. Leaving strings unquoted keeps manifests clean. Quote only when needed:

**Do NOT need quotes:**
- Plain strings with spaces: `name: My Shard`, `description: Task management with lifecycle tracking`
- Paths with parentheses: `- Mesh/Types/Tasks (Task)`, `dest: Mesh/Metadata/Types/(Type) Task (Projects Shard).md`
- Enum-like values: `setup: full`, `mode: once`, `state: active`
- Plain identifiers: `shorthand: proj`

**DO need quotes:**
- Version numbers: `version: "1.0.0"` — otherwise YAML may interpret `1.0` as a float (`1.0.0` parses fine as a string, but `"1.0.0"` is defensive and consistent)
- `shard-spec: "0.2.0"` — same reason
- Strings that look like booleans or keywords: `"yes"`, `"no"`, `"true"`, `"false"`, `"null"`, `"on"`, `"off"`
- Strings starting with YAML metacharacters: `{`, `}`, `[`, `]`, `,`, `&`, `*`, `!`, `|`, `>`, `'`, `"`, `%`, `@`, `` ` ``, `#`
- Strings starting or ending with whitespace (rare)
- Anything containing a colon followed by a space (`: `)

**Convention:** use double quotes when quoting is needed. Single quotes are allowed but mix poorly with apostrophes in descriptions.

Examples:

```yaml
name: Projects                                  # no quotes
description: Task management with lifecycle     # no quotes
shorthand: proj                                 # no quotes
shard-spec: "0.2.0"                             # quoted (version string)
version: "1.0.0"                                # quoted (version string)
setup: full                                     # no quotes (enum)
folders:
  - Mesh/Types/Tasks (Task)                     # no quotes (parens are fine)
  - Mesh/Archive/Tasks                          # no quotes
install:
  - source: (Dashboard) Backlog.md              # no quotes
    dest: Mesh/(Dashboard) Backlog.md           # no quotes
    mode: once                                  # no quotes
```

## Deprecated Fields

### `state` (deprecated)

The boolean `state: true` field has been replaced by `setup: full|flint|local`. Old manifests with `state: true` are treated as `setup: full` for backwards compatibility, with a deprecation warning. Migrate to `setup:`.

### `requires` (deprecated)

The `requires` field (`requires.cli` and `requires.workspace`) has been replaced by the `setup` field and `dev-setup-<sh>.md` lifecycle file. Old manifests with `requires` produce a deprecation warning. Document CLI tool requirements and setup steps in `dev-setup-<sh>.md` instead.

### `repos` (deprecated)

The legacy `repos:` field for cloning external git repositories has been removed. Declarations are ignored with a warning. Use the `setup` field and `dev-setup-<sh>.md` instead.

## Install Placeholders

Files in the `install/` folder support these placeholders, resolved at install time:

| Placeholder | Resolved To | Example |
|-------------|-------------|---------|
| `{{uuid}}` | Random UUID v4 | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| `{{date}}` | Current date | `2026-04-14` |

Useful for Obsidian templates and system files that need unique IDs or timestamps at creation.

## Common Patterns

### Dashboard-Only Shard

```yaml
shard-spec: "0.2.0"
version: "1.0.0"
name: My Dashboard
shorthand: md
description: Provides tracking dashboards
dependencies:
  - source: NUU-Cognition/shard-flint
install:
  - source: (Dashboard) Overview.md
    dest: Mesh/(Dashboard) Overview.md
    mode: once
```

### Full Artifact Shard

```yaml
shard-spec: "0.2.0"
version: "1.0.0"
name: Projects
shorthand: proj
description: Task management with lifecycle tracking
dependencies:
  - source: NUU-Cognition/shard-flint
  - source: NUU-Cognition/shard-notepad
types:
  - Task
install:
  - source: (Dashboard) Backlog.md
    dest: Mesh/(Dashboard) Backlog.md
    mode: once
folders:
  - Mesh/Archive/Tasks/
```

### Minimal Shard

```yaml
shard-spec: "0.2.0"
version: "1.0.0"
name: Living Documents
shorthand: ld
description: Track document lifecycle (living vs dead)
dependencies:
  - source: NUU-Cognition/shard-flint
```

### Shard with Obsidian Templates

```yaml
shard-spec: "0.2.0"
version: "1.0.0"
name: Projects
shorthand: proj
description: Task management with lifecycle tracking
dependencies:
  - source: NUU-Cognition/shard-flint
  - source: NUU-Cognition/shard-notepad
types:
  - Task
install:
  - source: (Dashboard) Backlog.md
    dest: Mesh/(Dashboard) Backlog.md
    mode: once
  - source: otmp-proj-task.md
    dest: "Shards/(Shards) Obsidian Templates/otmp-proj-task.md"
    mode: once
```

### Shard with Setup

```yaml
shard-spec: "0.2.0"
version: "1.0.0"
name: My Integration
shorthand: mi
description: Integrates with an external service
dependencies:
  - source: NUU-Cognition/shard-flint
setup: full
```

Requires a companion `dev-setup-mi.md` (installed as `setup-mi.md`) describing credential configuration and other setup steps. If the shard needs scripts, drop them in `scripts/` — they're auto-discovered, no manifest declaration needed.

## Validation Rules

A valid `shard.yaml` must have:
- [ ] `shard-spec` — non-empty string (warning if not `"0.2.0"`)
- [ ] `version` — valid semver string (`major.minor.patch`)
- [ ] `name` — non-empty string (warning if not Title Case)
- [ ] `shorthand` — non-empty string (warning if not 2-4 lowercase letters)
- [ ] `description` — non-empty single-line string
- [ ] All `dependencies[].source` entries use `owner/repo` format
- [ ] All `dependencies[].version` entries are valid semver (if present)
- [ ] All `types[]` entries match `Type` or `Type.Subtype` Title Case
- [ ] All `install[].source` files exist in the `install/` folder
- [ ] All `install[].dest` paths are relative to flint root
- [ ] `install[].mode` is `"once"` or `"force"` (legacy `once: true` / `force: true` still accepted)
- [ ] `setup` is `"full"`, `"flint"`, or `"local"` (if present)
- [ ] If `setup` is declared, `dev-setup-<sh>.md` must exist
- [ ] No circular dependencies

Validation is permissive for format issues (spec version, title case, shorthand pattern) — these produce warnings, not errors. Missing required fields, type mismatches, and path traversal attempts produce errors. Deprecated fields (`state`, `requires`, `repos`) produce warnings, not errors.
