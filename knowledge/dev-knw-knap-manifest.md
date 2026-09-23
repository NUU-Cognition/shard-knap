---
description: "Complete shard.yaml schema reference — the two ids (id, source.id), org and the package name, formerNames, of, the dependency map, install modes, setup lifecycle, scripts, types"
---

# Knowledge: Shard Manifest (shard.yaml)

Complete reference for the `shard.yaml` manifest file — the configuration that defines a shard's identity, dependencies, runtime requirements, and installation behavior.

The manifest lives in the **source** (`Shards/(Source Local) <Name>/` or `Shards/(Source Remote) <Name>/`). The **build** (`Shards/<Name>/`) carries a copy of it. So the shard names itself, and the build carries its provenance.

## Full Schema

```yaml
# Required fields
shard-spec: "0.3.0"                  # Shard spec version (conformance level)
id: 00000000-0000-4000-8000-000000000000  # The shard id (uuid v4 or v7). `flint shard create` mints it. Optional for the parser.
org: nuu-cognition                   # The org slug. The package is @nuu-cognition/shard/<fold(name)>. Absent: no org (@/shard/<name>)
source:                              # The source block
  id: 00000000-0000-4000-8000-00000000000a  # The source id. `flint shard create` mints it.
version: "1.0.0"                     # Semantic versioning (major.minor.patch)
name: Shard Name                     # Title Case display name
shorthand: sh                        # lowercase-letters-only identifier (any length)
description: What the shard does     # Brief description (one sentence)

# Optional fields — written by the CLI, never by hand
formerNames:                         # One line per title rename (flint shard rename --title)
  - name: Old Name
    slug: old-name
    at: 2026-09-23T01:19:42.168Z
formerShorthands: [osh]              # One entry per shorthand rename (flint shard rename --shorthand)
of:                                  # The origin of a fork (flint shard fork); source.of names the origin source
  id: 00000000-0000-4000-8000-000000000001
  address: "@nuu-cognition/shard/notepad"

# Optional fields
dependencies:                        # A map from package name to range
  "@nuu-cognition/flint": "^0.2"     # caret range
  "@nuu-cognition/notepad": "~1.1.3" # tilde range; "1.1.3" is an exact version; "" is any version

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

Declares which version of the shard packaging specification this shard follows. Currently `"0.3.0"`.

All shards must include this field. It allows tooling to handle backwards compatibility when the spec evolves.

**Spec versions:**
- `"0.1.0"` — Original spec. Init files contained hardcoded Skills/Workflows/Templates/Knowledge tables. Skill/workflow files started with `Ensure you have [[init-<sh>]] in context before continuing.`
- `"0.2.0"` — Progressive disclosure. Init files strip discovery tables and declare `required-reading` in YAML frontmatter. Every skill/workflow/template/knowledge file has `description` YAML frontmatter. Skill/workflow context lines use `Run `flint shard start <shorthand>` if you haven't already.` — `flint shard start` assembles the manifest dynamically.
- `"0.3.0"` — The shard is a package. The manifest carries the shard `id`, the `org`, and the `source` block with the source id, and the CLI writes `formerNames`, `formerShorthands`, and `of`. `dependencies` is a map from package name to range.

A `"0.2.0"` or `"0.1.0"` manifest still parses. A `"0.3.0"` manifest without `org` or `source` is valid; `flint shard status <alias> --health` reports them as missing with the next command `flint shard id <alias>`. `flint sync` gives an `outdated-spec` notice for a source below the current spec (a notice: sync never changes a source). To go from `0.2.0` to `0.3.0`, set `shard-spec: "0.3.0"` and run `flint shard id <alias>`. To go from `0.1.0` to `0.2.0` first, use the [[dev-wkfl-knap-migrate_shard_spec_0.1.0_to_0.2.0]] workflow; it invokes the `prefix-shard` script for the `dev-` filename pass.

### `id` (expected from spec `0.3.0`)

The **shard id**: the stable identity of the shard (the built package). A uuid v4 (v7 is accepted), stored in lowercase. The parser accepts a manifest with no `id`, but a shard without one gets only a held id in each Flint (see below). The id never changes. A title rename and a shorthand rename keep it. The lock of every Flint (`flint.json#shards[<id>]`) keys the shard by it, and the registry keeps the record by it.

- `flint shard create` mints the shard id and the source id.
- `flint shard id <alias>` fills an absent shard id, source id, and `org` (the org of the Flint) into a source. It fills only absent values. On a remote source that is dirty or on a work branch it prints a notice and the next command `flint shard push <alias>`.
- A shard that is only a build never mints an id. `flint shard id` refuses it with `not-a-source`.
- A clone never mints: the ids come with the files.
- An installed package with no id gets a **held id**: the Flint mints one, keeps it in `flint.json#shards[<id>]` with `held: { binding: { request, hash } }`, and never writes it into the package. `flint shard list` marks it `(held)`. The held id retires into the real id when the registry answers `resolve?hash=` with a record, or when a later install of the same package carries an id: the held record gets `mergedInto: <package id>`.

### `org` (expected from spec `0.3.0`)

The slug of the org that owns the package, for example `nuu-cognition`. The package address is `@<org>/shard/<fold(name)>`. The short spelling `@<org>/<name>` is valid on input in a shard context (`[shards]`, `dependencies`, `flint shard` commands). An absent or empty `org` means no org: the package resolves in this machine only, as `@/shard/<name>`.

- `flint shard create` and `flint shard fork` write the org of the Flint (`flint.json#org`). A Flint with no org writes no `org`.
- `flint shard id <alias>` fills an absent `org` from the Flint.
- `flint shard release` refuses a source with no `org` in a Flint that has one, with the next command `flint shard id <alias>`.

The org is not a GitHub owner. GitHub is a location of the source, which the registry records.

### `source` (expected from spec `0.3.0`)

`{ id, of? }`: the block of the source. `id` is the **source id**: the id of the files that a person edits. A source always has an id, also a local source.

- `flint shard create` mints it with the shard id.
- `flint shard dev` promotes a local source to a repository and keeps the source id.
- `flint shard clone` never mints: the id comes with the files.
- `flint shard fork` mints a new source id and writes `source.of: { id: <origin source id> }`.

The build copies the block, so the lock and the registry can name the source of each version.

### `formerNames` (optional, CLI-written)

A list of `{ name, slug, at }`, oldest first. `flint shard rename <alias> --title "<New Name>"` appends one line with the old Title, its slug, and the ISO time. A consumer Flint reads it on `flint sync`: the same id with a new name gives one `moved` change. Do not write it by hand.

### `formerShorthands` (optional, CLI-written)

A list of shorthands, oldest first. `flint shard rename <alias> --shorthand <new>` appends the old shorthand. An empty list is absent.

### `of` (optional, CLI-written)

`{ id, address? }`: the shard that this shard was forked from. `flint shard fork` writes it. The `id` is the truth; `address` is a cache of the package address at the time of the fork. A fork always has a new shard id and a new source id of its own, and records `of` on each:

```yaml
id: 7948fa19-469b-4ce4-ba22-888554530bd2
org: nuu-cognition
name: Notepad Nathan
shorthand: ntpn
source:
  id: f406afc5-cd8f-4460-8859-68000f4ec616
  of:
    id: 5b1c9e02-7a41-4c11-9d7e-0f3a2b6c8d10
of:
  id: 76d64e3e-3c05-4391-a39e-22001fb2e20a
  address: "@nuu-cognition/shard/notepad"
```

### `version` (required)

Semantic version string. Format: `major.minor.patch`

- **major**: Breaking changes to the shard's interface (renamed files, removed skills, changed template structure)
- **minor**: New capabilities added (new skills, workflows, templates)
- **patch**: Bug fixes, documentation improvements

Start at `"1.0.0"` for first release. Use `"0.1.0"` for development/pre-release shards.

### `name` (required)

Human-readable display name. Title Case. The package name is the fold of it: `name: Notepad` in `org: nuu-cognition` is the package `@nuu-cognition/shard/notepad`. A title rename (`flint shard rename --title`) therefore moves the address; the id does not change. The build folder is `Shards/<Name>/` when the alias of the shard in the Flint is the slug of the name, else `Shards/<Alias As Title>/`. The type files keep the name in their qualifier `(<Name> Shard)` also when the alias differs.

Examples: `Projects`, `Living Documents`, `OrbCode`, `Knap`

### `shorthand` (required)

A lowercase-letters-only identifier used as the namespace prefix in every file name:

- `init-<sh>.md`
- `sk-<sh>-name.md`
- `wkfl-<sh>-name.md`
- `tmp-<sh>-name.md`
- `knw-<sh>-name.md`

**Rules:**
- Lowercase letters only (pattern: `/^[a-z]+$/`)
- Any length (one character is fine — Flint shard uses `f`)
- MUST be unique in one Flint. An install whose shorthand another shard uses is refused before any write: `the shorthand <sh> is used by <alias>`.

Pick the shortest unambiguous form: short shorthands compose well into long filenames. Examples in the wild: `f`, `proj`, `inc`, `ld`, `ntpd`, `orbc`, `knap`.

### `description` (required)

Brief, single-sentence description of what the shard provides. Used in CLI output and discovery.

### `dependencies` (optional)

A map from a package name to a range. A dependency names a shard, never a source.

```yaml
dependencies:
  "@nuu-cognition/flint": "^0.2"     # Core — almost always required
  "@nuu-cognition/notepad": "~1.1.3"
  "@nuu-cognition/plan": ""          # any version
```

| Part | Form |
|------|------|
| Key | A package name: the short form `@org/name` or the full form `@org/shard/name`. The key has no range and no place. |
| Value | A range: an exact version `1.1.3`, a caret range `^1.1`, or a tilde range `~1.1.3`. `""` is any version. Nothing else parses (not `*`, `1.x`, or `>=1`). |

**Rules:**
- A key that does not parse, a key with a range or a place, a value that is not a range, and one package named twice are manifest errors (`manifest-error`).
- A dependency is satisfied by a shard record of this Flint with that address and a version inside the range. When the lock of the dependent names the id of the dependency, the id is checked too.
- Install is transitive by default. The CLI plans every missing dependency before any write, prints one line per package with the spec that it resolves (`will install <Title> from <spec> (needed by <Title>)`), then installs them in order and the shard last. `--no-deps` installs the shard alone and prints the missing dependencies.
- A cycle is refused, and the reason names the chain.
- A missing dependency is a not-current line in `flint sync` with the next command `flint shard install '@org/name@<range>'`. A present dependency outside its range is a not-current line (`dependency-out-of-range`) with the same next command.
- `flint shard info <alias>` and `flint shard status <alias>` show the state of each dependency, for example `@nuu-cognition/shard/plan@^0.4 satisfied by plan (<id>)`.

> **Legacy input.** The list form of spec `0.3.0` before the package model (`- { source: NUU-Cognition/shard-flint, id?, version? }`, where `version` is a floor) and the older `depends:` list still parse. New manifests use the map. The step `s5` of the Flint migration `flint-0.6.0-to-0.7.0` rewrites a list into the map when every entry names a shard of the Flint whose source is there; an entry with no floor becomes `""`, and a floor `x.y.z` becomes `^x.y.z` only when that shard is inside it. Else the list stays, with a warning.

### `setup` (optional)

Declares that the shard requires one-time setup and on which layer the flag lives.

```yaml
setup: full     # The Flint layer and the local layer
setup: flint    # The Flint layer only
setup: local    # The local layer only
```

| Value | Flint layer (`flint.json#shards[<id>].setup`, committed) | Local layer (`.flint/shards.json` `shards[<id>].setup`, this machine) |
|-------|------|------|
| `full` | Yes | Yes |
| `flint` | Yes | No |
| `local` | No | Yes |
| *(omitted)* | No | No |

A layer holds one of `required`, `not-required`, `completed`, or `none` (the layer is not declared).

When `setup` is declared:
- A companion `dev-setup-<sh>.md` file must exist at the shard root (installed as `setup-<sh>.md`). The installer refuses to install a shard that declares `setup` but has no setup file.
- The install writes `required` into each declared layer of the record. There are no state files.
- `flint shard start` reads both layers from the records. When a layer is `required`, it prints `FORCE SETUP`, the setup file, and the banner `SETUP REQUIRED`, and exits 1. The init content is withheld until the layer is `completed`.

**Inspecting and transitioning state — `flint shard setup`:**

```bash
flint shard setup <alias>                          # show the state of both layers
flint shard setup <alias> --complete               # mark all manifest-declared layers as completed
flint shard setup <alias> --complete --scope flint # only the Flint layer
flint shard setup <alias> --complete --scope local # only the local layer
flint shard setup <alias> --complete --scope both  # both, regardless of manifest scope
flint shard setup <alias> --reset                  # back to required (force a re-setup pass)
```

The default `--scope` is derived from `manifest.setup`: `full` → both layers, `flint` → the Flint layer, `local` → the local layer. The command prints the state after the change. A layer with no record prints `(no record)`.

**Note:** The `setup` field in `shard.yaml` declares the scope. The `setup` field of a record tracks the state (`required`, `not-required`, `completed`, `none`). These are different fields with the same name.

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

**Source / destination resolution, the two-separator asymmetry, and install behaviour are documented authoritatively in [[dev-knw-knap-architecture]] § Type Installation.** In short: source filenames use `_` (`type-<sh>-<lower_snake>.md`), destination paths preserve Title Case with ` . ` for subtypes, and authors never write a separate `install:` entry for types.

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

Resolved SHAs are persisted in `flint.json#repos[<Name>] = { remote, ref, sha }`. The lockfile is the source of truth for which clones are present. Refcount-style cleanup: when no shard or source still declares a given `name`, the next install removes the lockfile entry (the on-disk folder is left in place — the user may delete it manually).

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
- `shard-spec: "0.3.0"` — same reason
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
shard-spec: "0.3.0"                             # quoted (version string)
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

| Field | On `shard-spec: "0.2.0"` and `"0.3.0"` | On `shard-spec: "0.1.0"` |
|-------|--------------------------|--------------------------|
| `state: true` | **Hard error** (parser refuses the manifest) | Warning. Health checks treat `state: true` as `setup: full`. |
| `requires.cli` / `requires.workspace` | **Hard error** | Warning. |
| `scripts:` (explicit list) | **Hard error** | Warning. Scripts are auto-discovered from `scripts/*.js` regardless. |
| `repos:` (when paired with the above legacy fields) | Allowed at the modern slot — see [`repos`](#repos-optional). The error is in pairing it with `state:` / `requires:` on the same manifest. | n/a |

Migration path: bump `shard-spec` to `"0.2.0"`, delete the legacy blocks, add a `setup:` value, and ship a `dev-setup-<sh>.md` describing the steps that used to live under `requires:`. The [[dev-wkfl-knap-migrate_shard_spec_0.1.0_to_0.2.0]] workflow runs the full transition (the `prefix-shard` script handles the `dev-` filename pass).

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
shard-spec: "0.3.0"
id: 00000000-0000-4000-8000-000000000000
org: nuu-cognition
source:
  id: 00000000-0000-4000-8000-00000000000a
version: "1.0.0"
name: My Dashboard
shorthand: md
description: Provides tracking dashboards
dependencies:
  "@nuu-cognition/flint": "^0.2"
install:
  - source: inst-md-overview_dashboard.md
    dest: Mesh/(Dashboard) Overview.md
    mode: once
```

### Full Artifact Shard

```yaml
shard-spec: "0.3.0"
id: 00000000-0000-4000-8000-000000000000
org: nuu-cognition
source:
  id: 00000000-0000-4000-8000-00000000000a
version: "1.0.0"
name: Projects
shorthand: proj
description: Task management with lifecycle tracking
dependencies:
  "@nuu-cognition/flint": "^0.2"
  "@nuu-cognition/notepad": "^1.0"
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
shard-spec: "0.3.0"
id: 00000000-0000-4000-8000-000000000000
org: nuu-cognition
source:
  id: 00000000-0000-4000-8000-00000000000a
version: "1.0.0"
name: Living Documents
shorthand: ld
description: Track document lifecycle (living vs dead)
dependencies:
  "@nuu-cognition/flint": "^0.2"
```

### Shard with Obsidian Templates

```yaml
shard-spec: "0.3.0"
id: 00000000-0000-4000-8000-000000000000
org: nuu-cognition
source:
  id: 00000000-0000-4000-8000-00000000000a
version: "1.0.0"
name: Projects
shorthand: proj
description: Task management with lifecycle tracking
dependencies:
  "@nuu-cognition/flint": "^0.2"
  "@nuu-cognition/notepad": "^1.0"
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
shard-spec: "0.3.0"
id: 00000000-0000-4000-8000-000000000000
org: nuu-cognition
source:
  id: 00000000-0000-4000-8000-00000000000a
version: "1.0.0"
name: My Integration
shorthand: mi
description: Integrates with an external service
dependencies:
  "@nuu-cognition/flint": "^0.2"
setup: full
```

Requires a companion `dev-setup-mi.md` (installed as `setup-mi.md`) describing credential configuration and other setup steps. If the shard needs scripts, drop them in `scripts/` — they're auto-discovered, no manifest declaration needed.

## Validation Rules

A valid `shard.yaml` must have:
- [ ] `shard-spec` — `"0.3.0"`, `"0.2.0"`, or `"0.1.0"` (an `outdated-spec` notice below `"0.3.0"`; any other value is refused)
- [ ] `id` and `source.id` — uuids v4 or v7 when present (expected from `"0.3.0"`; fill them with `flint shard id <alias>`)
- [ ] `org` — a kebab slug when present (expected from `"0.3.0"` in a Flint with an org)
- [ ] `version` — valid semver string (`major.minor.patch`)
- [ ] `name` — non-empty string (warning if not Title Case)
- [ ] `shorthand` — non-empty lowercase-letters-only string (any length; pattern `^[a-z]+$`)
- [ ] `description` — non-empty single-line string
- [ ] Every `dependencies` key is a package name (`@org/name` or `@org/shard/name`) with no range and no place
- [ ] Every `dependencies` value is an exact version, a caret range, a tilde range, or `""`
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

Validation is permissive for format issues (title case, shorthand pattern) — these produce warnings, not errors. Missing required fields, type mismatches, and path traversal attempts produce errors. Legacy fields (`state`, `requires`, `scripts`) produce warnings on `shard-spec: "0.1.0"` and **hard errors** on `shard-spec: "0.2.0"` and above — see [Deprecated Fields](#deprecated-fields).
