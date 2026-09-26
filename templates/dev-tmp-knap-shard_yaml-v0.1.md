---
description: "Shard manifest (shard.yaml) file structure"
---

# Naming and Placement

| | |
|---|---|
| Path | `shard.yaml` (at the root of the source, NEVER prefixed, never under `install/`; the build carries a copy) |
| Required | Yes — every shard MUST have one |

The manifest defines the shard's identity (the shard id, the org, the source id), dependencies, setup scope, and installation behaviour. `flint shard create` writes it; edit it by hand only for the fields that no command writes. See [[dev-knw-knap-manifest]] for the complete field reference, validation rules, and per-field semantics.

```yaml
shard-spec: "0.3.0"
id: [the shard id: a uuid4 that `flint shard create` mints]
org: [the org slug of the Flint, e.g. nuucognition; omit the line when the Flint has no org]
source:
  id: [the source id: a uuid4 that `flint shard create` mints]
version: "[semver version, e.g. 1.0.0]"
name: [Shard name: the Display Name law; Proper Case is the convention]
shorthand: [lowercase-letters-only identifier, any length]
description: [Brief description of what the shard does, one sentence]

/* Optional: written by `flint shard rename <alias> --name`. One line per rename of the name, oldest first. Do not write it by hand. */
formerNames:
  - name: [Former Title]
    slug: [former-slug]
    at: [ISO 8601 time of the rename]

/* Optional: written by `flint shard rename <alias> --shorthand`. One entry per rename of the shorthand, oldest first. */
formerShorthands:
  - [former shorthand]

/* Optional: written by `flint shard fork`. The shard that this shard was forked from. `id` is the truth; `address` is a cache.
   The fork also writes `of: { id: <origin source id> }` inside the `source` block. */
of:
  id: [shard id of the origin]
  address: "[package address of the origin, e.g. @nuucognition/shard/notepad]"

/* Optional: a map from package name to range. The key is `@org/name` (or `@org/shard/name`), with no range and no place.
   The value is an exact version "1.1.3", a caret range "^1.1", a tilde range "~1.1.3", or "" (any version). */
dependencies:
  "@nuucognition/flint": "^0.2"
  "[@org/name of the dependency]": "[range]"
  (continue)

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

- `shard-spec`: `"0.3.0"` is current. `"0.2.0"` and `"0.1.0"` still parse; `flint sync` gives an `outdated-spec` notice for a source at a lower spec. Legacy fields (`state:`, `requires:`, explicit `scripts:`) are errors at `"0.2.0"` and above.
- `id`: the shard id, a uuid v4 (v7 is accepted), lowercase. `flint shard create` mints it. `flint shard id <alias>` fills it into a source that has none. Never change it: the lock of every Flint and the registry find the shard by it. A shard that is only a build never mints an id.
- `org`: the org slug. The address is `@<org>/shard/<slug>`. `create`, `fork`, and `flint shard id` write the org of the Flint. Absent means no org (`@/shard/<slug>`).
- `source.id`: the source id. `flint shard create` mints it, `flint shard dev` keeps it, a clone never mints it, and `flint shard fork` mints a new one with `source.of`.
- `formerNames`, `formerShorthands`, `of`: optional. The CLI writes them (`rename --name`, `rename --shorthand`, `fork`). Do not write them by hand. A former name resolves only in its address form (`@org/<former slug>`), and a former shorthand as a bare word, with a `moved` note.
- `version`: Semver `major.minor.patch`. Start at `"1.0.0"` for release, `"0.1.0"` for development.
- `name`: the Display Name law (letters, digits, spaces, `-`, and `' , . ! & + ; @`; no `/ # ( ) [ ] : ?`; no trailing dot). Proper Case is the convention; the health check warns, never refuses. The slug is `slugKey(name)`, so a rename of the name moves the address (the id stays). The build folder is the name when the alias is the slug, else the alias as a Title.
- `shorthand`: lowercase letters only, any length. The prefix of every file name. It must be unique in one Flint: an install whose shorthand is taken is refused.
- `dependencies`: a map from package name to range. Almost always include `"@nuucognition/flint"`. A shard record of this Flint with that address and a version inside the range satisfies it. The install refuses a present dependency outside the range.
- `setup`: `full`, `flint`, or `local`. **Requires** a companion `dev-setup-<sh>.md` file — install refuses without it. Mark setup complete with `flint shard setup <alias> --complete`.
- `types[]`: `Type` or `Type.Subtype`, each word with a capital letter. Auto-installs the type definition from `install/type-<sh>-<snake>.md` to `Mesh/Metadata/Types/(Type) <Name> (<Shard> Shard).md` — do NOT write a separate `install:` entry. See [[dev-knw-knap-architecture]] § Type Installation.
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
- `depends`, and the list form of `dependencies` (`- source: owner/repo`): legacy input that still parses. Write the map form.
- `once: true` / `force: true` boolean flags on install entries — use `mode: once` / `mode: force`.
