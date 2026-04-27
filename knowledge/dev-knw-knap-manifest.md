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
shorthand: sh                        # lowercase-letters-only identifier (any length)
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

install:                                      # Files to install into the workspace
  - source: inst-proj-backlog_dashboard.md    # inst-<sh>-<name>.md in install/
    dest: Mesh/(Dashboard) Backlog.md          # literal target filename in dest
    mode: once                                 # Install only if not present (default)
  - source: inst-proj-init.md
    dest: Mesh/(System) Init.md
    mode: force                                # Overwrite on every install/sync
```

## Field Reference

### `shard-spec` (required)

Declares which version of the shard packaging specification this shard follows. Currently `"0.2.0"`.

All shards must include this field. It allows tooling to handle backwards compatibility when the spec evolves.

**Spec versions:**
- `"0.1.0"` — Original spec. Init files contained hardcoded Skills/Workflows/Templates/Knowledge tables. Skill/workflow files started with `Ensure you have [[init-<sh>]] in context before continuing.`
- `"0.2.0"` — Progressive disclosure. Init files strip discovery tables and declare `required-reading` in YAML frontmatter. Every skill/workflow/template/knowledge file has `description` YAML frontmatter. Skill/workflow context lines use `Run `flint shard start <shorthand>` if you haven't already.` — `flint shard start` assembles the manifest dynamically.

A `shard-spec: "0.1.0"` manifest still parses, and `flint sync` flags it via the `outdated-spec` drift kind on `dev-remote-shards` and `dev-local-shards` features (report-only — never auto-applied). Use the [[wkfl-knap-migrate_shard_spec_0.1.0_to_0.2.0]] workflow to migrate; that workflow invokes the `prefix-shard` script to handle the `dev-` filename rename pass automatically. Installed shards are not flagged because the install pipeline will not accept a 0.1.0 manifest in the first place.

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

A lowercase-letters-only identifier used as the namespace prefix in every file name and as the key under `flint.json#shards[<shorthand>]`:

- `init-<sh>.md`
- `sk-<sh>-name.md`
- `wkfl-<sh>-name.md`
- `tmp-<sh>-name.md`
- `knw-<sh>-name.md`

**Rules:**
- Lowercase letters only (pattern: `/^[a-z]+$/`)
- Any length (one character is fine — Flint shard uses `f`)
- MUST be unique across all installed shards in a workspace

Pick the shortest unambiguous form: short shorthands compose well into long filenames. Examples in the wild: `f`, `proj`, `inc`, `ld`, `ntpd`, `orbc`, `knap`.

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
- A companion `dev-setup-<sh>.md` file must exist at the shard root (installed as `setup-<sh>.md`). The installer refuses to install a shard that declares `setup` but has no setup file.
- The installer creates state files under `Shards/(Shards) State/` and/or `Shards/(Shards) Local State/` based on scope; the local-state folder is auto-added to `.gitignore`.
- `flint shard start` reads both layers and emits a `SETUP REQUIRED` banner with the setup-file content when either layer is `setup: required`. Init content is withheld until the layer flips to `completed`.

**State file layout:**

| Scope | Path | Git tracked? |
|-------|------|-------------|
| Flint (committed) | `Shards/(Shards) State/(Shard) <Name>.md` | Yes |
| Local | `Shards/(Shards) Local State/(Shard) <Name> (Local).md` | No (gitignored) |

**Inspecting and transitioning state — `flint shard setup`:**

```bash
flint shard setup <name>                          # show current state for both layers
flint shard setup <name> --complete               # mark all manifest-declared layers as completed
flint shard setup <name> --complete --scope flint # only the committed layer
flint shard setup <name> --complete --scope local # only the local layer
flint shard setup <name> --complete --scope both  # both, regardless of manifest scope
flint shard setup <name> --reset                  # flip back to required (force a re-setup pass)
```

The default `--scope` is derived from `manifest.setup`: `'full'` → both layers, `'flint'` → committed, `'local'` → local. The command always prints the post-condition state so an agent can confirm the result.

**Note:** The `setup` field in `shard.yaml` declares scope. State files have their own `setup` frontmatter field that tracks completion status (`required`, `not-required`, `completed`). These are different fields with the same name in different contexts.

### `types` (optional)

Artifact types the shard manages. Each entry installs a type definition file from `install/` to `Mesh/Metadata/Types/` with a shard-qualified destination name.

```yaml
types:
  - Task                      # → (Type) Task (Projects Shard).md
  - Report                    # → (Type) Report (Reports Shard).md
  - Note.Concept              # → (Type) Note . Concept (Flint Shard).md
```

Naming rules (parser-enforced):

- Title Case, letters / numbers / spaces only on each segment.
- Format: `Type`, `Multi Word Type`, or `Type.Subtype` (one level of nesting).
- Pattern: `/^[A-Z][A-Za-z0-9]*(?: [A-Z][A-Za-z0-9]*)*(?:\.[A-Z][A-Za-z0-9]*(?: [A-Z][A-Za-z0-9]*)*)?$/`

**Source / destination resolution, the two-separator asymmetry, and install behaviour are documented authoritatively in [[knw-knap-architecture]] § Type Installation.** In short: source filenames use `_` (`type-<sh>-<lower_snake>.md`), destination paths preserve Title Case with ` . ` for subtypes, and authors never write a separate `install:` entry for types.

`types:` does **not** create artifact storage folders. Use `folders:` for that. See [[knw-f-types]] for the artifact-side conventions of types in the Mesh.

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
  - source: inst-proj-backlog_dashboard.md
    dest: Mesh/(Dashboard) Backlog.md
    mode: once
```

**Fields:**

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `source` | string | required | Filename in `install/` folder. Must be `inst-<sh>-<name>.md` or `otmp-<sh>-<name>.md`. No `dev-` prefix — install files are user-facing artifacts. |
| `dest` | string | required | Destination path from flint root — this is where the literal target filename (e.g. `(Dashboard) Backlog.md`) lives |
| `mode` | `once` \| `force` | `once` | Overwrite behavior |

**Source naming convention:** the `source` file inside `install/` is shard-namespaced (`inst-<sh>-<name>.md` for general payloads, `otmp-<sh>-<name>.md` for Obsidian templates). The user-facing filename — e.g. `(System) Flint Init.md` or `(Dashboard) Backlog.md` — appears only in `dest`. This keeps the `install/` folder self-describing (every file clearly belongs to this shard) and keeps target naming at the workspace layer.

Type definition files (`type-<sh>-<type>.md`) also live in `install/` but are **not** declared under `install:` — they are driven by the `types:` field and resolved automatically.

**Install modes:**
- `once` (default) — Install only if the destination doesn't exist. Users may customize it and the shard won't overwrite their changes.
- `force` — Overwrite on every install and sync. Use for files that must stay in sync with the shard.

> **Backward compat:** Legacy boolean fields `once: true` and `force: true` are still accepted and resolved to the equivalent `mode` value. New manifests should use `mode`.

### `repos` (optional)

External git repositories the shard expects to be cloned into the workspace at install time. Each entry pins a remote at an immutable ref (SHA or tag). Repos are cloned into a flat workspace-scoped folder — `Shards/(Shards) Repos/<Title Case Name>/` — so multiple shards can share the same clone without nesting.

```yaml
repos:
  - name: My Helper Tool                            # Title Case display name
    remote: NUU-Cognition/my-helper-tool            # owner/repo
    ref: v1.4.0                                     # tag, or 40-char SHA
  - name: Vendor Sdk
    remote: vendor-org/sdk
    ref: 9f3c1d4e7a8b2c6d5e4f3a2b1c0d9e8f7a6b5c4d   # SHA pin
```

**Fields (all required per entry):**

| Field | Type | Purpose |
|-------|------|---------|
| `name` | string | Title Case display name. Becomes the folder name under `Shards/(Shards) Repos/`. Must be unique workspace-wide. |
| `remote` | string | Git remote in `owner/repo` form. The installer clones `https://github.com/<owner>/<repo>.git`. |
| `ref` | string | Immutable ref — a tag or a 40-char SHA. Branch names (`main`, `master`, `develop`, `development`, `trunk`, `HEAD`) are rejected at parse time. |

**Convergence semantics (every install / `flint shard pull`):**

| State | Action |
|-------|--------|
| Folder missing | `git clone` then detached `git checkout <ref>` |
| Folder present, pin matches HEAD | No-op |
| Folder present, pin differs | `git fetch --tags --prune origin` then detached `git checkout <ref>` (no reset, no stash) |
| Working tree dirty | Refuse and report — never auto-stash, never auto-discard |

The installer never runs `git reset --hard`. Local edits inside a clone are preserved between installs; the installer only converges via fetch + checkout.

**Cross-shard sharing:**

Multiple shards may declare the same `name` so long as `remote` and `ref` agree. Two shards declaring the same `name` with conflicting `remote` or `ref` is a hard error (the installer reports the conflict, listing every shard that contributed a declaration).

**Pinning:**

Resolved SHAs are persisted in `flint.json#repos[<Name>] = { remote, ref, sha }`. The lockfile is the source of truth for which clones are present. Refcount-style cleanup: when no installed/dev shard still declares a given `name`, the next install removes the lockfile entry (the on-disk folder is left in place — the user may delete it manually).

**Failure modes (every category is reported, never silently skipped):**

| Category | Trigger |
|----------|---------|
| `permission` | `git clone` denied (private repo, missing credentials) |
| `network` | Clone or fetch failed due to DNS / connection / timeout |
| `bad-ref` | Pinned ref does not exist in the remote |
| `dirty-tree` | Working tree has uncommitted changes that would conflict with checkout |
| `conflict` | Two shards declare the same `name` with disagreeing `remote`/`ref` |

The installer collects all failures and reports them together — one bad repo does not abort the others.

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
  - source: inst-proj-backlog_dashboard.md      # inst-<sh>-<name> source
    dest: Mesh/(Dashboard) Backlog.md           # literal target name
    mode: once                                  # no quotes
```

## Deprecated Fields

The legacy `state: true` boolean, the `requires: { cli, workspace }` block, and `scripts:` declarations are predecessors of the `setup:` field and auto-discovery model. Their handling depends on the manifest's `shard-spec`:

| Field | On `shard-spec: "0.2.0"` | On `shard-spec: "0.1.0"` |
|-------|--------------------------|--------------------------|
| `state: true` | **Hard error** (parser refuses the manifest) | Warning. Health checks treat `state: true` as `setup: full` so existing state files keep validating. |
| `requires.cli` / `requires.workspace` | **Hard error** | Warning. `requires.workspace` still implies a local-state file at health-check time. |
| `scripts:` (explicit list) | **Hard error** | Warning. Scripts are auto-discovered from `scripts/*.js` regardless. |
| `repos:` (when paired with the above legacy fields) | Allowed at the modern slot — see [`repos`](#repos-optional). The error is in pairing it with `state:` / `requires:` on the same manifest. | n/a |

Migration path: bump `shard-spec` to `"0.2.0"`, delete the legacy blocks, add a `setup:` value, and ship a `dev-setup-<sh>.md` describing the steps that used to live under `requires:`. The [[wkfl-knap-migrate_shard_spec_0.1.0_to_0.2.0]] workflow runs the full transition (the `prefix-shard` script handles the `dev-` filename pass).

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
  - source: inst-md-overview_dashboard.md
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
  - source: inst-proj-backlog_dashboard.md
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
  - source: inst-proj-backlog_dashboard.md
    dest: Mesh/(Dashboard) Backlog.md
    mode: once
  - source: otmp-proj-task.md
    dest: Shards/(Shards) Obsidian Templates/otmp-proj-task.md
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
- [ ] `shorthand` — non-empty lowercase-letters-only string (any length; pattern `^[a-z]+$`)
- [ ] `description` — non-empty single-line string
- [ ] All `dependencies[].source` entries use `owner/repo` format
- [ ] All `dependencies[].version` entries are valid semver (if present)
- [ ] All `types[]` entries match `Type` or `Type.Subtype` Title Case
- [ ] All `install[].source` files exist in the `install/` folder
- [ ] All `install[].source` filenames start with `inst-<sh>-` or `otmp-<sh>-` (no literal target names)
- [ ] All `install[].dest` paths are relative to flint root
- [ ] `install[].mode` is `"once"` or `"force"` (legacy `once: true` / `force: true` still accepted)
- [ ] `setup` is `"full"`, `"flint"`, or `"local"` (if present)
- [ ] If `setup` is declared, `dev-setup-<sh>.md` must exist
- [ ] No circular dependencies
- [ ] All `repos[].name` are Title Case and unique within the manifest
- [ ] All `repos[].remote` are `owner/repo` form
- [ ] All `repos[].ref` are tags or 40-char SHAs (branch names rejected: `main`, `master`, `develop`, `development`, `trunk`, `HEAD`)

Validation is permissive for format issues (title case, shorthand pattern) — these produce warnings, not errors. Missing required fields, type mismatches, and path traversal attempts produce errors. Legacy fields (`state`, `requires`, `scripts`) produce warnings on `shard-spec: "0.1.0"` and **hard errors** on `shard-spec: "0.2.0"` — see [Deprecated Fields](#deprecated-fields).
