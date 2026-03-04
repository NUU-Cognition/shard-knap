# Knowledge: Shard Manifest (shard.yaml)

Complete reference for the `shard.yaml` manifest file — the configuration that defines a shard's identity, dependencies, and installation behavior.

## Full Schema

```yaml
# Required fields
shard-spec: "0.1.0"                  # Shard spec version (conformance level)
version: "1.0.0"                     # Semantic versioning (major.minor.patch)
name: Shard Name                     # Title Case display name
shorthand: sh                        # 2-4 char lowercase identifier
description: What the shard does     # Brief description (1 sentence)

# Optional fields
depends:                             # Dependencies in owner/repo format
  - NUU-Cognition/shard-flint        # Almost always include Flint (core)
  - NUU-Cognition/shard-notepad      # Other dependencies
  - NUU-Cognition/shard-projects

install:                             # Files to install outside Shards/ folder
  - source: (Dashboard) Backlog.md   # Filename in install/ folder
    dest: Mesh/(Dashboard) Backlog.md  # Destination from flint root
    mode: once                       # Install only if not present (default)
  - source: (System) Init.md
    dest: Mesh/(System) Init.md
    mode: force                      # Overwrite on every install/sync

folders:                             # Directories to create in flint root
  - Mesh/Types/Tasks/
  - Mesh/Archive/Tasks/

repos:                               # Git repositories to clone into (System) Repos/
  - name: my-repo
    url: https://github.com/org/repo.git
    branch: main                     # Optional, defaults to default branch
```

## Field Reference

### `shard-spec` (required)

The shard spec version this manifest conforms to. Declares which version of the shard packaging specification this shard follows. Currently `"0.1.0"`.

All shards should include this field. It allows tooling to handle backwards compatibility when the spec evolves.

### `version` (required)

Semantic version string. Format: `major.minor.patch`

- **major**: Breaking changes to the shard's interface (renamed files, removed skills, changed template structure)
- **minor**: New capabilities added (new skills, workflows, templates)
- **patch**: Bug fixes, documentation improvements

Start at `"1.0.0"` for first release. Use `"0.1.0"` for development/pre-release shards.

### `name` (required)

The human-readable display name. Title Case. Used as the installed folder name under `Shards/`.

Examples: `Projects`, `Living Documents`, `OrbCode`, `Knap`

### `shorthand` (required)

A 2-4 character lowercase identifier used in all file names:
- `sk-<sh>-name.md`
- `tmp-<sh>-name.md`
- `wkfl-<sh>-name.md`
- `knw-<sh>-name.md`

**Rules:**
- Lowercase only
- 2-4 characters
- Must be unique across all installed shards
- Should be memorable and intuitive

Examples: `f`, `proj`, `inc`, `ld`, `ntpd`, `orbc`, `k`

### `description` (required)

A brief, single-sentence description of what the shard provides. Used in CLI output and discovery.

### `depends` (optional)

Array of shard dependencies in `owner/repo` format. Dependencies are auto-installed when this shard is installed.

```yaml
depends:
  - NUU-Cognition/shard-flint       # Flint (core) — almost always needed
  - NUU-Cognition/shard-notepad     # Notepad
  - NUU-Cognition/shard-projects    # Projects
```

**Rules:**
- Use `owner/repo` format (e.g., `NUU-Cognition/shard-flint`), not shorthands or display names
- Dependencies are transitive (if A depends on B, and B depends on C, A gets C too)
- Circular dependencies are not allowed

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
| `source` | string | required | Filename in `install/` folder |
| `dest` | string | required | Destination path from flint root |
| `mode` | `once` \| `force` | `once` | Install mode — controls overwrite behavior |

**Install modes:**
- `once` (default) — Install the file only if the destination doesn't exist. Users may customize it and the shard won't overwrite their changes.
- `force` — Overwrite the destination on every install and sync. Use for files that must stay in sync with the shard (rare).

> **Backward compat:** The legacy `once: true` and `force: true` boolean fields are still accepted. If present, they are resolved to the equivalent `mode` value. New manifests should use `mode`.

### `folders` (optional)

Array of directory paths (from flint root) to create during installation. Created empty if they don't exist.

```yaml
folders:
  - Mesh/Types/Tasks/
  - Mesh/Archive/Tasks/
```

### `repos` (optional)

Array of Git repositories to clone into the workspace at `Shards/(System) Repos/<name>/`. Uses shallow clone (`--depth 1`) for efficiency. The repos directory is auto-gitignored.

```yaml
repos:
  - name: my-codebase
    url: https://github.com/org/repo.git
    branch: main
```

**Fields:**

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `name` | string | required | Folder name under `(System) Repos/` |
| `url` | string | required | Git clone URL (https or ssh) |
| `branch` | string | repo default | Branch to clone |

**Lifecycle:**
- `flint shard install` — clones repos
- `flint shard pull` — pulls updates (or clones if missing)
- `flint shard uninstall` — removes cloned repos

## Install Placeholders

Files in the `install/` folder support these placeholders, resolved at install time:

| Placeholder | Resolved To | Example |
|-------------|-------------|---------|
| `{{uuid}}` | Random UUID v4 | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| `{{date}}` | Current date | `2026-02-22` |

These are useful for Obsidian templates and system files that need unique IDs or timestamps at creation.

## Common Patterns

### Dashboard-Only Shard

A shard that primarily provides dashboards:

```yaml
shard-spec: "0.1.0"
version: "1.0.0"
name: My Dashboard
shorthand: md
description: Provides tracking dashboards
depends:
  - NUU-Cognition/shard-flint
install:
  - source: (Dashboard) Overview.md
    dest: Mesh/(Dashboard) Overview.md
    mode: once
```

### Full Artifact Shard

A shard that manages a new artifact type:

```yaml
shard-spec: "0.1.0"
version: "1.0.0"
name: Projects
shorthand: proj
description: Task management with lifecycle tracking
depends:
  - NUU-Cognition/shard-flint
  - NUU-Cognition/shard-notepad
install:
  - source: (Dashboard) Backlog.md
    dest: Mesh/(Dashboard) Backlog.md
    mode: once
folders:
  - Mesh/Types/Tasks/
  - Mesh/Archive/Tasks/
```

### Minimal Shard

A shard with no install files or folders:

```yaml
shard-spec: "0.1.0"
version: "1.0.0"
name: Living Documents
shorthand: ld
description: Track document lifecycle (living vs dead)
depends:
  - NUU-Cognition/shard-flint
```

### Shard with Obsidian Templates

A shard that ships human-facing templates for Obsidian:

```yaml
shard-spec: "0.1.0"
version: "1.0.0"
name: Projects
shorthand: proj
description: Task management with lifecycle tracking
depends:
  - NUU-Cognition/shard-flint
  - NUU-Cognition/shard-notepad
install:
  - source: (Dashboard) Backlog.md
    dest: Mesh/(Dashboard) Backlog.md
    mode: once
  - source: otmp-proj-task.md
    dest: "Shards/(System) Obsidian Templates/otmp-proj-task.md"
    mode: once
folders:
  - Mesh/Types/Tasks/
```

### Shard with Repos

A shard that needs an external codebase cloned:

```yaml
shard-spec: "0.1.0"
version: "1.0.0"
name: My Integration
shorthand: mi
description: Integrates with an external service
depends:
  - NUU-Cognition/shard-flint
repos:
  - name: service-sdk
    url: https://github.com/org/service-sdk.git
    branch: main
```

## Validation Rules

A valid `shard.yaml` must have:
- [ ] `shard-spec` — valid semver string (currently `"0.1.0"`)
- [ ] `version` — valid semver string
- [ ] `name` — non-empty, Title Case
- [ ] `shorthand` — 2-4 lowercase characters
- [ ] `description` — non-empty string
- [ ] All `depends` entries use valid `owner/repo` format
- [ ] All `install.source` files exist in the `install/` folder
- [ ] All `install.dest` paths are relative to flint root
- [ ] No circular dependencies
