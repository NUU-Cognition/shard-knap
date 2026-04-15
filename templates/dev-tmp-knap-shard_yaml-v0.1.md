---
description: "Shard manifest (shard.yaml) file structure"
---

# Filename: shard.yaml

/* Shard manifest file. Defines the shard's identity, dependencies, setup scope, and installation behavior.
   See [[dev-knw-knap-manifest]] for the complete field reference. */

```yaml
shard-spec: "0.2.0"
version: "[semver version, e.g. 1.0.0]"
name: [Shard Name in Title Case]
shorthand: [2-4 character lowercase identifier]
description: [Brief description of what the shard does, one sentence]

/* Optional: shard dependencies. Each entry is an object with required `source` and optional `version` floor. */
dependencies:
  - source: NUU-Cognition/shard-flint
  - source: [other owner/repo]
    version: "[minimum semver, optional]"
  - (continue)

/* Optional: declare that the shard needs one-time setup and what scope of state files to create.
   Requires a companion `dev-setup-<sh>.md` file at the shard root (installed as `setup-<sh>.md`).
   
   Scopes:
     full  — both global (tracked) and local (gitignored) state files
     flint — global state only (shared across machines)
     local — local state only (per-machine, gitignored)
   
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

- `shard-spec`: Currently `"0.2.0"`. Mismatches produce a warning, not an error.
- `version`: Semver `major.minor.patch`. Start at `"1.0.0"` for release, `"0.1.0"` for development.
- `name`: Title Case, becomes the installed folder name.
- `shorthand`: 2-4 lowercase letters, used in all file names.
- `dependencies[].source`: `owner/repo` format. Almost always include `NUU-Cognition/shard-flint`.
- `dependencies[].version`: Optional minimum semver floor.
- `setup`: `full`, `flint`, or `local`. Requires a companion `dev-setup-<sh>.md` file.
- `types[]`: Title Case, `Type` or `Type.Subtype`. Installs type definition file only. See [[dev-knw-f-types]].
- `folders[]`: Explicit folder paths. `types:` does NOT auto-create artifact folders.
- `install[]`: `source` must NOT start with `dev-` — `install/` files are literal payloads.
- `install[].mode`: `once` (default, skip if destination exists) or `force` (overwrite on every sync).

## Quoting

YAML is permissive. Do NOT quote plain strings, enum values, or paths with parentheses. DO quote version strings (`"0.2.0"`, `"1.0.0"`) and anything starting with a YAML metacharacter. See [[dev-knw-knap-manifest]] § YAML Quoting Guide.

## Not Declared Here

Scripts, skills, workflows, headless workflows, templates, knowledge files, headless init, setup file — all auto-discovered from the filesystem. Drop the file in the right folder with the right filename and it's picked up.

## Deprecated

- `state`: Replaced by `setup: full|flint|local`. Old `state: true` is treated as `setup: full` with a deprecation warning.
- `scripts`: Removed. Scripts are auto-discovered from `scripts/*.js`.
- `requires.cli`: Removed. Document required CLI tools in `dev-setup-<sh>.md` prose instead.
- `requires.workspace`: Removed. Replaced by the `dev-setup-<sh>.md` lifecycle file.
- `repos`: Removed. Use `dev-setup-<sh>.md` for repo-cloning instructions.
- `depends`: Legacy plain-string dependencies — migrate to `dependencies` with `{source}` objects.
- `once: true` / `force: true` boolean flags on install entries — use `mode: once` / `mode: force`.
