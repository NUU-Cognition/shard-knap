---
description: "Shard manifest (shard.yaml) file structure"
---

# Naming and Placement

| | |
|---|---|
| Path | `shard.yaml` (at the shard root, NEVER prefixed, never under `install/`) |
| Required | Yes — every shard MUST have one |

The manifest defines the shard's identity, dependencies, setup scope, and installation behaviour. See [[dev-knw-knap-manifest]] for the complete field reference, validation rules, and per-field semantics.

```yaml
shard-spec: "0.3.0"
id: [generate-uuid4]
version: "[semver version, e.g. 1.0.0]"
name: [Shard Name in Title Case]
shorthand: [lowercase-letters-only identifier, any length]
description: [Brief description of what the shard does, one sentence]

/* Optional: written by `flint shard rename <alias> --title`. One line per title rename, oldest first. Do not write it by hand. */
formerNames:
  - name: [Former Title]
    slug: [former-slug]
    at: [ISO 8601 time of the rename]

/* Optional: written by `flint shard rename <alias> --shorthand`. One entry per shorthand rename, oldest first. */
formerShorthands:
  - [former shorthand]

/* Optional: written by `flint shard fork`. The shard that this shard was forked from. `id` is the truth; `address` is a cache. */
of:
  id: [uuid of the source shard]
  address: "[entity address of the source, e.g. @/flint/<flint>/shard/<alias>]"

/* Optional: shard dependencies. `source` is required. `id` is optional and makes the match by id. `version` is a floor. */
dependencies:
  - source: NUU-Cognition/shard-flint
  - id: [uuid of the dependency, optional]
    source: [owner/repo, a path, or an address @/flint/<flint>/shard/<alias>]
    version: "[minimum semver, optional]"
  - (continue)

/* Optional: declare that the shard needs one-time setup and on which layer.
   Requires a companion `dev-setup-<sh>.md` file at the shard root (installed as `setup-<sh>.md`).

   Scopes:
     full  — the Flint layer (flint.json#shards[<id>].setup) and the local layer (.flint/shards.json)
     flint — the Flint layer only (shared by every clone of the Flint)
     local — the local layer only (this machine)

   Omit the field entirely if the shard needs no setup. */
setup: full

/* Scripts are NOT declared here — drop .js files in scripts/ and they are auto-discovered.
   Command name = filename stem (dev- prefix stripped): scripts/dev-new-task-number.js → flint shard <sh> new-task-number */

/* Optional: artifact types the shard manages.
   Each entry is a Title-Case string — "Type", "Multi Word Type", or "Type.Subtype".
   Installs a type definition file from install/type-<sh>-<snake_name>.md
   to Mesh/Metadata/Types/(Type) <Name> [. <Subname>] (<Shard> Shard).md.
   Does NOT create artifact storage folders — declare those explicitly in `folders:`. */
types:
  - [Task]
  - [Note.Concept]
  - (continue)

/* Optional: directory paths (from flint root) to create during installation.
   Used for artifact storage folders, archive folders, and any other directories the shard needs. */
folders:
  - ["Mesh/Types/Tasks (Task)"]
  - [Mesh/Archive/Tasks/]
  - (continue)

/* Optional: files to install outside the shard folder.
   Files in install/ have NO dev- prefix — they are literal payloads copied verbatim.
   Supports {{uuid}} and {{date}} placeholders resolved at install time. */
install:
  - source: [filename in install/ folder, no dev- prefix]
    dest: [destination path from flint root]
    mode: once /* install only if not already present (default) */
  - source: [system-file]
    dest: [destination]
    mode: force /* overwrite on every install/sync */
  - (continue)

/* Optional: Obsidian templates for humans (otmp- prefix, no dev- prefix in install/) */
  - source: otmp-[shorthand]-[name].md
    dest: "Shards/(Shards) Obsidian Templates/otmp-[shorthand]-[name].md"
    mode: once
```

## Rules

- `shard-spec`: `"0.3.0"` is current. `"0.2.0"` and `"0.1.0"` still parse; `flint sync` gives an `outdated-spec` notice for a checkout at a lower spec. Legacy fields (`state:`, `requires:`, explicit `scripts:`) are errors at `"0.2.0"` and above.
- `id`: a uuid v4 (v7 is accepted), lowercase. `flint shard create` mints it. `flint shard id <alias>` fills it into a Dev Local or an edit checkout that has none. Never change it: every record of every Flint finds the shard by it. A replica (an installed copy) never mints an id.
- `formerNames`, `formerShorthands`, `of`: optional. The CLI writes them (`rename --title`, `rename --shorthand`, `fork`). Do not write them by hand.
- `version`: Semver `major.minor.patch`. Start at `"1.0.0"` for release, `"0.1.0"` for development.
- `name`: Title Case. The installed folder is `Shards/<Name>/` when the alias is the slug of the name, else `Shards/<Alias As Title>/`.
- `shorthand`: lowercase letters only, any length. The prefix of every file name. It must be unique in one Flint: an install whose shorthand is taken is refused.
- `dependencies[].source`: one string of the source grammar: `owner/repo`, a path, or an entity address. Almost always include `NUU-Cognition/shard-flint`.
- `dependencies[].id`: optional. With an id, any presence of that id in the Flint satisfies the dependency, whatever its alias or source. Without an id, the canonical source string must match.
- `dependencies[].version`: optional minimum version. The install refuses a present dependency below it.
- `setup`: `full`, `flint`, or `local`. **Requires** a companion `dev-setup-<sh>.md` file — install refuses without it. Mark setup complete with `flint shard setup <alias> --complete`.
- `types[]`: Title Case, `Type` or `Type.Subtype`. Auto-installs the type definition from `install/type-<sh>-<snake>.md` to `Mesh/Metadata/Types/(Type) <Name> (<Shard> Shard).md` — do NOT write a separate `install:` entry. See [[dev-knw-knap-architecture]] § Type Installation.
- `folders[]`: Explicit folder paths. `types:` does NOT auto-create artifact folders.
- `install[]`: `source` must NOT start with `dev-` — `install/` files are literal payloads.
- `install[].mode`: `once` (default, skip if destination exists) or `force` (overwrite on every sync).

## Quoting

YAML is permissive. Do NOT quote plain strings, enum values, or paths with parentheses. DO quote version strings (`"0.3.0"`, `"1.0.0"`) and anything starting with a YAML metacharacter. See [[dev-knw-knap-manifest]] § YAML Quoting Guide.

## Not Declared Here

Scripts, skills, workflows, headless workflows, templates, knowledge files, headless init, setup file — all auto-discovered from the filesystem. Drop the file in the right folder with the right filename and it's picked up.

## Deprecated

- `state`: Replaced by `setup: full|flint|local`. Old `state: true` is treated as `setup: full` with a deprecation warning.
- `scripts`: Removed. Scripts are auto-discovered from `scripts/*.js`.
- `requires.cli`: Removed. Document required CLI tools in `dev-setup-<sh>.md` prose instead.
- `requires.workspace`: Removed. Replaced by the `dev-setup-<sh>.md` lifecycle file.
- `depends`: Legacy plain-string dependencies — migrate to `dependencies` with `{source}` objects.
- `once: true` / `force: true` boolean flags on install entries — use `mode: once` / `mode: force`.
