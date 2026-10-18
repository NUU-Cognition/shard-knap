---
description: "Complete reference for the two entities (source and shard), the three states, the lock, the registry, shard structure, file types, the modes (one workflow for each mode), migrations, and design principles"
orbh-sessions:
  - "[[1fe72314-c531-4439-81fd-b8f136b7e2cc]]"
  - "[[947c6566-a653-4887-8ff6-b3f35ac99628]]"
  - "[[ec13c5bf-9eab-4982-b35a-cffc13d48950]]"
---

# Knowledge: Shard Architecture

Complete reference for the package model (source and shard, the states, the lock, the registry), shard structure, file types, design principles, and how shards fit into the Flint ecosystem.

## Core Concepts

### Shards Are Self-Contained

A shard is a single coherent unit of capability. It owns everything it needs — context, skills, workflows, templates, knowledge, scripts, install files, types, and migrations. No shard should require reading another shard's internal files (though it can depend on another shard being installed).

### Shards Are On-Demand

Agents load shard context only when needed. The init file is the entry point — it provides enough context to use the shard without loading every file. Skills, workflows, templates, and knowledge are loaded individually as needed.

### Shards Are Namespaced

Every shard file uses the shorthand as a namespace prefix: `sk-proj-`, `tmp-inc-`, `knw-f-`. This prevents naming collisions between shards and makes it clear which shard owns a file.

## Two Entities: Source and Shard

A shard is a package. It has two entities, and each one has its own id. The words are the words of the glossary of the spec: [[(Spec) Flint Shards#Glossary]].

| | The source | The shard |
|---|---|---|
| What it is | The files that a person edits: `shard.yaml`, `dev-init-<sh>.md`, `dev-sk-<sh>-*.md`, … | The built package: `init-<sh>.md`, `sk-<sh>-*.md`, … with a copy of the manifest |
| Folder | `Shards/(Source Local) <Name>/` (no repository) or `Shards/(Source Remote) <Name>/` (a clone of a repository) | `Shards/<folder>/`: the name when the alias is the slug of the name, else the alias as a Title |
| Id | `shard.yaml#source.id` | `shard.yaml#id` |
| Location or address | the repository, when there is one | `@org/shard/<slug>` |
| States | `edited`, or a Git commit (sha, ahead, behind, dirty) | `published` (a tag, proven by the hash), `snapshot` (built from a commit, proven by the sha), `edited` (no proof) |
| Loaded by | `flint shard start-dev` (for editing) | `flint shard start` (for use) |

The manifest `shard.yaml` lives in the source and declares what the source builds: the package name (`shard`), the shard id, the name. The build copies it, so the shard carries its provenance. The `dev-` prefix marks a source file.

**The build** is a function: `build(source at a state) = shard at a state`. A clean Git source at a tag gives a shard with the hash of that published version. A clean Git source at another commit gives a `snapshot` with the sha. A local source, or a source with changes, gives `edited`. The registry stores, for each version, the sha of the source and the hash of the build; that is the link between the two entities.

| Verb | Entity | What it does |
|------|--------|--------------|
| `create` | source | Mints the source id and the shard id, makes the local source, builds the shard |
| `build` | shard | Makes the build from the source of the record and writes the lock state |
| `dev` | source | Promotes a local source to a repository; the source id stays |
| `clone` | source | Clones the source of a published shard; the registry says where the repository is |
| `release` | both | Builds from a clean export of `HEAD`, tags the source, registers the version with its hash, the name, and `formerNames` |
| `install` | shard | Puts the shard at a version into this Flint (`published`); with no argument, makes the lock match the specs and records the registry answers |
| `update` | shard | Resolves the spec again inside its range and moves the lock |
| `fork` | both | A new source with a new source id and a new shard id, and `of` on each |
| `rename` | source | One manifest edit plus one reconcile (see [Renames](#renames)) |

`flint sync` runs these kernel features:

| Feature (label) | Records | Drift kinds (strategy) |
|---------|---------|------------------------|
| `shards` ("Shards") | every record with a build or a reference | `moved`, `not-installed`, `version-mismatch`, `content-mismatch` (for a `from = "source"` record the heal is a build), `lock-mismatch`, `payload-missing`, `stale-record`, `reference-stale` (auto); `orphan`, `malformed-manifest`, `source-not-found`, `payload-source-missing`, `conversion-collision`, `migrations-pending`, `dependency-missing`, `dependency-out-of-range`, `dependency-id-changed`, `dependency-below-floor`, `not-locked` (report); `legacy-lock`, `dependency-by-name`, `dependency-former-address` (notice) |
| `shard-sources` ("Shard sources") | every record whose source is a `(Source Local)` or a `(Source Remote)` folder | `not-cloned`, `damaged`, `git-state` (auto: records the Git state of the source); `damaged-clone`, `orphan`, `malformed-manifest`, `source-not-found` (report); `outdated-spec`, `draft`, `behind`, `dirty`, `legacy-folder` (notice) |
| `shard-repos` ("Shard repositories") | `repos:` of every manifest | `converge` (auto); `deferred` (report) |

The feature ids and the drift kind names are machine keys. These are the two reconciles of sync: **the shard reconcile** (`shards`) makes each build match the lock and heals a rename that the source, the place, or the build shows; **the source reconcile** (`shard-sources`) reports the Git state of each source and never changes a source. A notice never changes anything. Sync never asks the registry: the registry answers (`registry-answer`, a notice, and `registry-record`, a lock write) and the rename that the registry reports belong to `flint shard install`.

## Identity and Records

The shard id and the source id are the truth. Names are for people; the CLI stores ids.

**The identity** is four stored facts of the manifest: `id`, `shard`, `name`, `shorthand` (plus `source.id`). `shard` is the package name `"@<org>/<slug>"`: it stores the org and the slug. The slug is `slugKey(name)`, the one fold of a shard name; the slug of `shard` MUST be equal to it. The org is the first segment of `shard` (a manifest below `0.4.0` stores it in `org`). The address is `@org/shard/<slug>`, for example `@nuucognition/shard/knap`; the package name `@nuucognition/knap` is its short form. The default alias is the slug. The name follows the Display Name law ([[dev-knw-knap-manifest]] § name).

**The alias.** The key of the record in `flint.toml` is its alias: the local name of the shard in this Flint. It defaults to the slug of the name. `flint shard install <input> --alias <alias>` sets another one; a second shard with the same slug needs it. The build folder is the name when the alias is the slug of the name, else the alias as a Title.

**The ref.** A command names one shard with a `<ref>`, read by one resolver in this order: the alias, the shorthand, the address (full or short), the id (or a prefix of eight or more characters), then a former address or a former shorthand with the note `moved: <old> is now <new>`. A bare word is an alias or a shorthand; a name is an address. The name, a former name, a bare former slug, and a folder name are not a ref. See [[dev-knw-knap-cli]] § The Ref.

**The three places of shard state:**

| Place | Committed | Holds |
|-------|-----------|-------|
| `flint.toml#[shards]` | Yes | The intent: one record per alias |
| `flint.json#shards[<shard id>]` | Yes | The lock: one record per shard id |
| `.flint/shards.json` | No | The facts of this machine per shard id |

**The intent.** A record maps an alias to a package spec. The string form is the spec alone. The table form adds options:

| Field | Meaning |
|-------|---------|
| `source` | A package spec `@org/name[@version][#place]`. A path (`./Shards/(Source Local) X`) also parses; `create` does not write it. |
| `git` | `owner/repo`: the Git location that a person chose (`--from-git`, `clone --from-git`, `dev`). |
| `from` | `"source"`: build the shard from its source in this Flint. |
| `use` | `reference` (no build; the loader reads the folder in its place) or `none` (a source with no build here). |

```toml
[shards]
notepad = "@nuucognition/notepad@^1.1"                                              # from the registry
oracle = { source = "@nuucognition/oracle", from = "source" }                       # built from a local source
seer = { source = "@nuucognition/seer", git = "NUU-Cognition/shard-oracle", from = "source" }  # built from a remote source
plan = { source = "@nuucognition/plan@0.4.0", git = "NUU-Cognition/shard-plan" }    # from Git
tasks = "@nuucognition/tasks#demo-maker"                                            # from a Flint on this machine
drafts = { source = "@nuucognition/drafts", from = "source", use = "none" }         # a source with no build
```

The toml holds no id. A person never types a uuid. An `id` that a person wrote still parses: it is checked against the lock, and a different id refuses the write with `id-mismatch`.

**The lock.** `flint.json#shards[<shard id>]` (the record shape `shard-record/0.2`):

| Field | Meaning |
|-------|---------|
| `alias`, `shorthand`, `name` | The key, the prefix, the name of this copy |
| `address` | The address `@org/shard/<slug>` |
| `request` | The spec of the record, in the full form (`@nuucognition/shard/notepad@^1.1`) |
| `formerNames`, `formerShorthands` | The rename history, as the manifest has it; filled at the next write of the record |
| `version` | The recorded version (the row shows the version of the build) |
| `state` | `{ kind: "published", tag, hash }`, `{ kind: "snapshot", sha, hash }`, or `{ kind: "edited", hash }` |
| `source` | `{ id, git?, presence? }`: the source id, its Git location, and the source folder in this Flint |
| `resolved` | `{ registry, repo?, ref?, sha?, hash?, from }`: the registry answer (`published`, `snapshot`, `unregistered`, `unchecked`) and where the build came from (`registry`, `git`, `path`, `source`, `place`) |
| `package` | `{ hash, files[] }`: the hash and the files of the build (empty `files` for a reference) |
| `payloads[]` | `{ path, id?, sha256, mode, kind }` per file installed outside the shard folder; `kind` is `type`, `install`, `note-template`, or `folder` (a 0.6.x record can hold `obsidian`, the old name of `note-template`; the read takes it as `note-template`) |
| `folders[]` | The folders that the install made |
| `dependencies` | The locked ids of the dependencies: `{ <address>: <id> }` |
| `setup` | The Flint layer: `required`, `not-required`, `completed`, or `none` |
| `migrations`, `pending` | The shard migration ledger: done steps with times, queued steps |
| `held`, `mergedInto` | A held id with its binding `{ request, hash }`; the id it was retired into |

```json
"76d64e3e-3c05-4391-a39e-22001fb2e20a": {
  "spec": "shard-record/0.2",
  "alias": "notepad",
  "address": "@nuucognition/shard/notepad",
  "request": "@nuucognition/shard/notepad@^1.1",
  "version": "1.1.3",
  "state": { "kind": "published", "tag": "1.1.3", "hash": "68b62feb…" },
  "source": { "id": "5b1c9e02-7a41-4c11-9d7e-0f3a2b6c8d10", "git": "NUU-Cognition/shard-notepad" },
  "resolved": { "registry": "published", "repo": "NUU-Cognition/shard-notepad", "ref": "v1.1.3", "sha": "f413ac97…", "hash": "68b62feb…", "from": "registry" }
}
```

`.flint/shards.json` (`shard-local/0.2`) holds per shard id: `setup` (the local layer), `source { branch, sha, ahead, behind, dirty, fetchedAt? }` for a source that is a Git repository, `reference { resolvedPath, resolvedAt }` for a reference record, `installedAt`, and `builtAt`.

A reader that meets a record of a newer shape stops with the reason and `Upgrade flint-cli`. A record of `shard-record/0.1` (a pre-release 0.7.0 build) stops every read with the next command `flint migrate run`. A Flint whose `flint.json#shards` still holds the 0.6.0 shape (`{ <sh>: "<version>" }`) is read by `list`, `status`, `start`, `start-dev`, and the deprecated `hstart` and `hstart-dev` with the notice `this Flint has the 0.6.0 shard records; run flint migrate run`; every other shard command refuses with `shard records are in the legacy shape` and the next command `flint migrate run`.

**The registry.** The NUU Shard Registry (`shards.nuucognition.com`) holds one record per shard id (`org`, `name`, the slug `<org slug>/<slug>`, `legacySlug`, `formerNames`, `shorthand`, `repo`, `sourceId`) and one row per version (`tag`, `hash`, `repo`, `ref`, `sha`). The CLI asks `GET /api/shards/<org>/<name>` (the record and its versions; an old slug answers with `moved`), `GET /api/resolve?id=` and `GET /api/resolve?hash=` (the record of a package that the CLI already holds), and `GET /api/resolve?repo=`. `flint shard release` sends `POST /api/register`. The registry refuses a second id under one slug (`slug-taken`) and a tag with another hash (`tag-taken`). `FLINT_SHARD_REGISTRY_URL` points the CLI at another registry.

### Renames

A rename of the name is one manifest edit plus one reconcile. The whole process is in [[(Spec) Flint Shards . Rename]]; in short:

- **The author.** `flint shard rename <alias> --name "<New>"` in the Flint that has the source edits two lines of the manifest, the new `name` and `shard` (the new slug, the same org; on a `0.3.0` manifest with no `shard:` line, `name` only), writes one `formerNames` line `{ name, slug, at }`, moves the source folder, and runs the reconcile of this Flint. `flint shard release <alias>` then sends the name and `formerNames` to the registry; the registry keeps the record by id and answers the old slug with `moved`.
- **Every consumer.** `flint sync` runs the same reconcile. It sees the new name through the rung the copy came from: the source here, the place, or the build after `flint shard update`. A registry copy sees it at `flint shard install`, which reads the registry answer.
- **The heal**, in one order, in one transaction: the folder (the name when the alias is the slug, else the alias as a Title), the key when the alias was the old slug, the request (the new slug; the range and the place stay), the lock `name`, `address`, and `formerNames`, the type files with their links, the payload paths, and the dependency keys of dependents (with the notice `dependency names a former address`). The report line is `moved: <Old> is now <New> (<address>); the folder, the key, and the type files followed`.
- **Old names.** A former address and a former shorthand resolve as a ref, with `moved: <old> is now <new>`. A bare former slug does not.
- **One transaction.** The author edit, the heal, and the build are one transaction under the store lock. A failure at any step puts every store back: the source, the files, the links, the intent, the lock, the local facts, and a retired held id. A restore that fails names each store that is not back and the backup paths.
- **What does not change:** the ids, the repository, the ledger ids, a custom alias and its folder, the manifest of a published build.
- **A shorthand rename** (`--shorthand <new>`) bumps the major version and scaffolds an agent step with the block `rewrite: { shorthand: { from, to } }`. In a consumer, `flint shard migrate run <alias>` rewrites the tags, the link stems, and the command texts of the Mesh as code, then stops at the agent step for the prose.

### References and Forks

`use = "reference"` installs no build; `flint shard start` reads the folder that `.flint/shards.json` names, and fails closed with `reference-missing` and `flint sync` when it is gone. `flint shard fork <spec> --name "<Name>" --shorthand <sh>` makes a new local source with a new shard id, a new source id, `of: { id, address }`, and `source.of: { id }`.

### Upgrade of an Older Flint

A 0.6.0 Flint has `flint.json#shards = { <sh>: "<version>" }`, a top-level `payloads`, shard entries in the top-level `migrations` and `pending`, the state folders, the old source folders, and `flint.toml` records with `edit = true` and `id`. `flint migrate run` upgrades it in one run with three steps of the migration `flint-0.6.0-to-0.7.0`:

| Step | What it does |
|------|--------------|
| `s5` "Give every shard source its identity" | For every source and its build: the shard id, the source id, and the `org` of the Flint, each from the source, else from the build, else new. A value that differs between the two blocks. The same edits go into the build; a build with no source here is not edited. The dependency list becomes the map when every entry names a shard of this Flint whose source is here (an entry with no floor becomes `""`; a floor becomes `^x.y.z` only when the shard is inside it); else the list stays, with a warning. Nothing goes into `flint.toml`. One line per Git source: commit and push it. |
| `s6` "Move the shard sources and key the shard records by package" | In this order: (1) the managed `.gitignore` block gets `Shards/(Source Remote) */`, only when a remote source moves; (2) each source folder moves to `(Source Local)` or `(Source Remote)` with its `.git` (a symbolic link or a destination that exists blocks); (3) each `flint.toml` record is rewritten: `edit = true` becomes `{ source = "@org/<slug>", git = "<owner/repo>", from = "source" }`, a path keeps its form with the new folder name, `flint://<Flint>/<shard>` becomes `{ source = "@org/<name>#<flint slug>" }`, a GitHub record becomes `{ source = "@org/<name>", git }` through the registry or the owner map, else `{ git }`, a pin goes into the spec, `id` goes, an unknown field blocks; (4) the lock at `shard-record/0.2` by id, no `payloads`, the shard ledger in the records, no lock record for `use = "none"`; (5) `Shards/(Shards) State/` goes. |
| `l4` "Move the local shard state into .flint/shards.json" | Moves the flags of `Shards/(Shards) Local State/` into `.flint/shards.json` at `shard-local/0.2` and removes the folder. An optional local step: `flint sync` does not refuse while only `l4` is pending. |

Every step plans first, runs inside the migration transaction (a journal and a backup), fills only absent values, and blocks with the reason on a value that it does not understand. `flint migrate run --dry-run` changes no byte, and a second run changes no byte. `flint migrate rollback <run>` restores the tree, each `.git` included, and refuses a file with a later edit (a commit in a moved source, or the `.git/index` that a plain `git status` rewrites; use `GIT_OPTIONAL_LOCKS=0`). `flint sync` refuses with `flint migrate run` while `s5` or `s6` is pending. A new Flint is born in the new shape and needs none of the steps.

After the run every remote source is `edited`, because `s5` changed its `shard.yaml`. Commit and push each source, then run `flint shard install --all-dev`: the builds become `snapshot` with the sha.

A Flint that ran the pre-release 0.7.0 steps (records of `shard-record/0.1`) is not migrated: `s6` blocks and writes nothing. Restore `flint.toml`, `flint.json`, and the state folders from the backup of that run (`flint migrate rollback <run>`, or by hand from `.flint/migrations/`), then run `flint migrate run` again.

The migration `flint-0.6.0-to-0.7.0` has one more shard step, `s8`. It gives a package name to each source at `shard-spec: "0.3.0"`. The Flint version stays `0.7.0`. A Flint at `0.7.0` whose ledger lacks `s8` is behind, and `flint migrate run` runs `s8` alone:

| Step | What it does |
|------|--------------|
| `s8` "Give every shard source its package name" | For every source at `0.3.0`: writes `shard: "@<org>/<slugKey(name)>"` (the org of the manifest, else the org of the Flint, else no org), removes the `org:` line, and sets `shard-spec: "0.4.0"`. Comments, key order, and every other line stay. The build of the source gets the same edit; a build with no source here is not edited. A source at `0.2.0` or `0.1.0` is skipped with one report line. A present `shard` that names another org than `org` blocks with the file name, and the step writes nothing. One line per Git source: commit and push it. |

After the run the package hash of every source differs from the published hash. Commit each source, then release it. A Flint that installs the shard from the registry keeps the `0.3.0` manifest until that release; `org:` at `0.3.0` still parses.

## Dev Prefix Rules

Files in a source (`(Source Remote)` and `(Source Local)` folders) are prefixed `dev-`, so a person and the build can tell a source file from a built file. The build strips the prefix. **This rule is not uniform** — the `install/` folder is an explicit exception.

| Location | Prefix rule | Why |
|----------|-------------|-----|
| Shard root (`init`, `setup`) | `dev-` | Lifecycle files, stripped by the build |
| `skills/`, `workflows/`, `templates/`, `knowledge/` | `dev-` | Source files, stripped by the build |
| `assets/` | `dev-` (as `dev-ast-<sh>-<name>.<ext>`) | Source assets, stripped by the build |
| `scripts/` | `dev-` (as `dev-<name>.js`) | Source scripts, stripped by the build |
| `migrations/` | `dev-` | Migrations ship in the shard and could be overwritten on update — the prefix keeps the source distinct |
| `install/` | **no prefix** | Files under `install/` are literal payloads copied verbatim to a destination (dashboards, system files, type definitions, note templates). They are not shard sources — they are user-facing artifacts that happen to ship with the shard. |

The build refuses `install/dev-*` files (error). The health check flags a file with no `dev-` prefix in every other location of a source. The root documents `README.md`, `RELEASE.md`, and `MIGRATIONS.md` stay in the source: the build has none of them, and no package hash covers them. `flint shard release` sends `README.md` to the registry.

## Shard Structure

A source (the same tree in `Shards/(Source Local) [Name]/`):

```
Shards/(Source Remote) [Name]/
├── shard.yaml                         # Manifest (required)
├── dev-init-<sh>.md                   # Init (required); a `# Headless` section when the shard runs headless
├── dev-setup-<sh>.md                  # Setup lifecycle file (required if `setup:` declared)
├── README.md                          # Documentation
├── skills/
│   └── dev-sk-<sh>-<name>.md
├── workflows/
│   ├── dev-wkfl-<sh>-<name>.md        # Workflow: both modes, `> [!headless]` callouts in the stages that differ
│   └── dev-wkfl-<sh>-<name>.invocation.json   # Invocation file of the workflow (optional)
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

The build has the same tree with the `dev-` prefix stripped from every file name (`install/` contents are copied verbatim since they never carried a prefix).

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

**YAML Frontmatter** (in the source — the build strips `dev-`):
```yaml
---
required-reading:
  - "[[dev-knw-<sh>-<name>]]"
  - "[[dev-knw-<sh>-<name>]]"
---
```

`required-reading` lists files the agent must read after loading the init. **Use Obsidian-style wikilinks; in a source write them with the `dev-` prefix** — e.g. `"[[dev-knw-<sh>-<name>]]"`. The build rewrites them to canonical (`"[[knw-<sh>-<name>]]"`) — see [Cross-Reference Links](#cross-reference-links-dev--prefix) below. `flint shard start` uses this list to tell the agent what to read.

See [Cross-Reference Links](#cross-reference-links-dev--prefix) for the full rule on how shard files link to each other.

### Cross-Reference Links (`dev-` prefix)

Anywhere one shard file references another shard file — required-reading entries, body prose, knowledge cross-references, workflow callouts — use an Obsidian wikilink, never a raw path. **In a source, write the link with the `dev-` prefix that matches the file on disk: `[[dev-<sh>-<name>]]`.** The build canonicalizes it for you.

When the build produces the shard, for every source file `dev-<name>.md` it strips the `dev-` prefix from **both** the filename (→ `<name>.md`) **and** every `[[dev-<name>]]` wikilink in shard content (→ `[[<name>]]`):

| In | You write | Resolves to |
|----|-----------|-------------|
| Source (authoring) | `[[dev-knw-<sh>-foo]]` | the real `dev-knw-<sh>-foo.md` — **clickable in Obsidian while you edit** |
| Shard (the build that ships) | `[[knw-<sh>-foo]]` | the built `knw-<sh>-foo.md` |

**Why prefer the `dev-` form over bare canonical in a source:** a canonical `[[knw-<sh>-foo]]` written inside a source file resolves in Obsidian to the *build* (or dangles when there is no build), pulling you out of the source you are editing. The `dev-` form keeps navigation inside the source and still ships canonical.

Two facts make this safe:

- **The strip is targeted, not blanket.** Only `[[dev-X]]` links whose `dev-X.md` actually exists in the shard are rewritten. Placeholder/example links such as `[[dev-<sh>-<name>]]` (no such file) are left untouched — so docs and templates can show the form literally. Literal `dev-` text in prose or code spans is never altered.
- **The runtime resolver accepts either form.** `flint shard start` resolves both `[[dev-X]]` and `[[X]]` against the shard tree, so a stray canonical link still works at runtime. The `dev-` form is about the Obsidian authoring experience and a clean published shard, not runtime resolution.

(Legacy relative-path form `knowledge/knw-<sh>-<name>.md` is still parsed for back-compat but should not be used in new files.)

**Design principles:**
- No discovery tables — skills, workflows, templates, and knowledge are discovered dynamically by `flint shard start` from file `description` frontmatter
- Include state diagrams for lifecycle management
- Keep it concise — deep details go in knowledge files
- Write for agents, not humans — focus on what's actionable
- Link to knowledge files via `[[knw-<sh>-<name>]]`

**The `# Headless` section.** When the shard runs in headless Orbh sessions, the init has a `# Headless` section: the interface keys, the phase values, and the result delivery. A headless session loads the same init with `flint shard start <sh>`. See [Modes: One Workflow for Each Mode](#modes-one-workflow-for-each-mode).

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
- After completing setup, run `flint shard setup <name> --complete` to flip the relevant state file(s) to `setup: completed` (defaults to the layers declared by `manifest.setup`; pass `--scope flint|local|both` to override). `--reset` flips back to `required` to force a re-setup pass. See [[dev-knw-knap-manifest]] § `setup` for the full command surface.

### Skills (`sk-<sh>-<name>.md`)

Atomic, single-purpose tasks that run to completion without human checkpoints.

**Structure:**
```markdown
---
description: "One-line description of what this skill does"
---

> [!important] THIS FILE IS AN INSTRUCTION. WHEN REFERENCED IT IS MEANT TO BE TAKEN AS AN ACTION.

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
- The action banner (`> [!important] THIS FILE IS AN INSTRUCTION...`) is required as the first body line — see [[#Action Banner]] below
- One clear purpose — if it needs human review, use a workflow
- Clear input/output contract
- Reference templates via `[[tmp-<sh>-<name>]]`
- The `flint shard start` reminder line follows the banner

### Workflows (`wkfl-<sh>-<name>.md`)

Multi-stage tasks with human checkpoints between stages.

**Structure:**
```markdown
---
description: "One-line description of what this workflow accomplishes"
---

> [!important] THIS FILE IS AN INSTRUCTION. WHEN REFERENCED IT IS MEANT TO BE TAKEN AS AN ACTION.

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
- The action banner is required as the first body line — see [[#Action Banner]] below
- Clear stages with explicit completion conditions
- Human checkpoints between stages (review, approval, feedback)
- "Once X, progress to the next stage" is the canonical transition phrase
- One file serves both modes. A stage that differs in a headless session has a `> [!headless]` callout inside that stage. See [Modes: One Workflow for Each Mode](#modes-one-workflow-for-each-mode)

### Invocation Files (`wkfl-<sh>-<name>.invocation.json`)

Optional. The machine contract of one workflow, beside its Markdown file with the same stem: the inputs, the steps (each with the heading of its stage), the outputs, and the behaviours. `flint shard invoke <sh> <name>` reads it and opens a durable record of the run. One file serves both modes: in format `shard-invocation/0.3`, a step can have `modes` and a `next` object for each mode. The file has the `dev-` prefix in a source, and `shard.yaml` declares nothing. The full reference, with when to add one: [[dev-knw-knap-invocations]].

## Modes: One Workflow for Each Mode

One workflow file serves both modes, and one init serves both modes. A shard has no separate headless files: no `hwkfl-<sh>-<name>.md` and no `hinit-<sh>.md` (NUU Orbh Task 748).

**The mode.** The mode of an invocation is `interactive` or `headless`. It comes from the Orbh session of `ORBH_SESSION_ID`:

| Mode of the Orbh session | Mode of the invocation |
|---|---|
| `interactive` | `interactive` |
| `headless`, `subagent`, `ping` | `headless` |
| No Orbh session | `interactive` |

`flint shard invoke <sh> <name> --mode interactive|headless` sets the mode (for tests). The record keeps the mode in `opened.mode`. A headless session loads the shard with `flint shard start <sh>` (`start-dev` for a source), as an interactive session does, and reads the same files.

**The callouts.** A stage that differs in the headless mode has a `> [!headless]` callout inside that stage, after the normal text of the stage. The callout tells a headless session what to do in place of the person gates:

- Report progress with the session keys: `flint orbh session set phase <phase>` and `flint orbh session set progress "<…>"`.
- Track each artifact: `flint orbh artifact "<path>"`.
- When blocked: a root session sends a deferred request (`flint orbh request "$ORBH_SESSION_ID" "<question>"`). A subagent puts the blocker and the question in its return.
- End the turn: `flint orbh session return --finish "<result>"`.

For example, the review stage of a task workflow:

```markdown
## Stage 3: Task Review

- Set status to `review`
- Give the person a summary, and refine the task until the person confirms
- Once the person confirms, proceed to Stage 4

> [!headless]
> Do not wait for a person, and do not do Stage 4.
> - Make sure that each checkbox is ticked.
> - Set the status to `review`, and add a last Task Log entry.
> - Write the summary into the result. Then return: `flint orbh session return --finish "<result>"`.
> - Never pass `--with task-confirm`.
```

**Why the callout is inside the stage.** After a compaction, the hint line `read:` names only one stage, and the agent reads only that stage again. The agent does not read a callout in a separate section at the end of the file. Thus each callout is complete for its stage. A rule that the agent needs at a stage goes into the callout of that stage, also when a callout under the title says it too.

**The rules.**

- A callout under the title (before `# Invocation`) MAY sum up the rules for all stages. It does not replace the callouts of the stages.
- A stage with no difference has no callout. A workflow with no difference has no callout.
- An interactive session ignores the callouts. A headless session reads the normal text and the callout of each stage. When they conflict, the callout wins.
- A command never passes `--headless` and never uses `hstart`. The mode comes from the session.
- Keep each stage heading outside a callout. The `stage` of the invocation file names a heading of the workflow.
- The context line at the top of each workflow is `Run \`flint shard start <sh>\` if you haven't already.` in both modes.

**The invocation file.** One invocation file serves both modes (format `shard-invocation/0.3`):

- A step only for a person gets `"modes": ["interactive"]`. In the headless mode, the invoke settles it as skipped at the open (`via: mode`).
- A step whose hint differs gets `next` as an object: `{ "interactive": "…", "headless": "…" }`.
- A condition can read the reserved key `session.mode`.

The details are in [[dev-knw-knap-invocations]].

**The `# Headless` section of the init.** When the shard runs in headless sessions, the init has a `# Headless` section. It holds what a headless init held, with no table of headless workflows:

| Subsection | Content | Required |
|---|---|---|
| `## Orbh Interface Keys` | The keys that the shard sets with `flint orbh session set <key> <value>`, with `### Phase Values` (and optionally `### Progress Format`) | Yes |
| `## Result Delivery` | How the turn ends: `flint orbh session return --finish "<result>"`, and what the result says | Yes |
| `## Interaction Model` | A table Interactive \| Headless: what replaces each person gate | Optional |
| `## Artifact Tracking` | `flint orbh artifact "<path>"` for each artifact that the shard makes | Optional |

The `# Headless` sections of `init-proj.md` (Projects) and `init-rpt.md` (Reports) are examples. The template is [[dev-tmp-knap-init-v0.1]].

**The transition.**

- The headless files and commands are removed (NUU Orbh Task 748). The CLI reads no `hwkfl-` or `hinit-` file. The health check gives a problem for each one: `removed: merge into <target> with wkfl-knap-migrate_headless_to_modes`.
- `flint shard hstart` and `hstart-dev` refuse with `hstart-removed` (next `flint shard start '<ref>'`). `--headless` on `flint shard invoke` refuses with `headless-flag-removed` before any write.
- An old record of an `hwkfl-` workflow with no recorded mode still reads as a headless frame. A step write on it refuses, because its file is gone: close it `abandoned`.
- To merge the headless files of a source into its normal files, use [[dev-wkfl-knap-migrate_headless_to_modes]]. `flint shard knap check-modes <source folder>` lists the headless files and the references that stay.

## Action Banner

Every skill (`sk-*`) and workflow (`wkfl-*`) file declares its own pragmatic force on its first body line via a verbatim Obsidian callout (an old `hwkfl-*` file that is not merged yet has it too):

```
> [!important] THIS FILE IS AN INSTRUCTION. WHEN REFERENCED IT IS MEANT TO BE TAKEN AS AN ACTION.
```

**Placement.** Immediately after the closing frontmatter `---`, separated by a blank line, before the `Run \`flint shard start <sh>\`` reminder line.

**Why.** When an agent encounters a `[[sk-foo-bar]]` or `[[wkfl-foo-bar]]` reference inside another file (a note body, a task description, a notepad turn), the resolution of "is this a citation or a directive?" is ambiguous. The banner removes the ambiguity at the read site: any agent that opens the file sees a self-announcing declaration that the contents are imperative, not descriptive.

**Scope — banner-carrying file types:**

| File type | Banner? | Why |
|-----------|---------|-----|
| `sk-<sh>-<name>.md` | Yes | Action file — load means execute |
| `wkfl-<sh>-<name>.md` | Yes | Action file — load means execute the stages (in both modes) |
| `init-<sh>.md` | No | Init files configure context, they don't produce actions |
| `setup-<sh>.md` | No | Setup is human-driven lifecycle, not agent action |
| `tmp-<sh>-<name>-v*.md` | No | Templates describe structure of artifacts; they are read for shape, not executed |
| `knw-<sh>-<name>.md` | No | Knowledge is reference material |
| `mig-<sh>-*-to-*.md` | No (today) | Migrations have their own driver; revisit if migrations grow imperative bodies |

**Wording is verbatim.** `sk-knap-validate` errors if the line is missing, altered, or not the first body line. Tooling that reads these files for analysis (the validator, search indexers, the migration script when one exists) is a non-execution context — reading-as-text never triggers the banner's pragmatic force, just as reading source code in an IDE doesn't execute it.

**Authoring helpers.** Both [[dev-tmp-knap-skill-v0.1]] and [[dev-tmp-knap-workflow-v0.1]] include the banner in their body template. New skills and workflows generated from these templates carry it automatically.

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

Files placed into the Flint workspace during installation, declared in `shard.yaml` under `install:`. The `source` filename uses a shard-namespaced convention; the literal target name (e.g. `(Dashboard) Backlog.md`, `(System) Flint Init.md`) only appears in `dest`.

| Source pattern | Purpose | Example dest |
|----------------|---------|--------------|
| `inst-<sh>-<name>.md` | General install payload (dashboards, system files, folder anchors, etc.) | `Mesh/(Dashboard) Backlog.md`, `Mesh/(System) Flint Init.md` |
| `type-<sh>-<type>[_<subtype>].md` | Type definition — auto-installed via `types:` declaration, not `install:` | `Mesh/Metadata/Types/(Type) Task (Projects Shard).md` |
| `otmp-<sh>-<name>.md` | Note template (human-facing, Templater syntax) | `Shards/(Shards) Obsidian Templates/otmp-<sh>-<name>.md` |

**Rule:** every `install:` entry's `source` must start with `inst-<sh>-` or `otmp-<sh>-`. The only exception is `type-<sh>-*` files, which are never listed in `install:` — they are driven by `types:` declarations instead.

Install files carry **no** `dev-` prefix in either the source or the shard — they are literal payloads, not source files. The installer refuses `install/dev-*` files with an error.

Install files support `{{uuid}}` and `{{date}}` placeholders resolved at install time.

A note template (`otmp-`) is the exception. The install copies it byte for byte: it resolves no placeholder and adds no `#readonly` tag. The record lists it with the payload kind `note-template` and no `id`. A note template uses Templater syntax: `<% crypto.randomUUID() %>` for the id and `<% tp.date.now("YYYY-MM-DD") %>` for the date. It always installs with `force` semantics and a conflict check: a changed copy stays, and the next command is `flint shard reinstall <alias> --replace-note-templates` (a backup comes first). A health rule gives a warning for each unresolved `{{uuid}}` or `{{date}}` in a note template. `flint shard type add <Name> --shard <ref> --note-template` scaffolds a note template in Templater syntax, with `mode: force` (`--obsidian` is a hidden alias of the flag). See [[dev-init-knap]] § Note Templates.

### Migrations (`migrations/`)

Migration files drive upgrades of previously-installed shards when the shard version bumps. Each migration has a stable ID of the form `<sh>-<from>-to-<to>-s<n>` (e.g., `proj-1.0.0-to-1.1.0-s1`).

- Migrations are auto-queued based on the installed-vs-latest version delta
- Types: `agent` (describes actions for an agent to perform), `script` (Node.js), `manual` (human-run)
- The ledger is in the record of the shard: `flint.json#shards[<id>].migrations` and `.pending`
- Run with `flint shard migrate run <shorthand>`
- List pending with `flint shard migrate list <shorthand>`

The `migrations/` folder may be empty — an empty folder is valid and is skipped by the installer.

## Types and Folders

The `types:` field declares the artifact types a shard manages. Each declared type installs a **type definition file** from `install/` to `Mesh/Metadata/Types/` with a shard-qualified destination name. Authors do not write a separate `install:` entry for types — the installer derives both the source filename and the destination path from the `types:` string alone.

`types:` does **not** create artifact storage folders. Artifact folders are declared explicitly via `folders:`:

```yaml
types:
  - Task                              # Installs type definition file
folders:
  - "Mesh/Types/Tasks (Task)"        # Creates artifact storage folder
  - Mesh/Archive/Tasks                # Creates archive folder
```

See [[knw-f-types]] for the artifact-side conventions of types in the Mesh.

### Type Installation

A `types:` entry is a single type name (each word with a capital letter). The installer resolves it to **two paths** at install time — a source filename and a destination path — using two different separators by design.

**Source filename** — the file in `install/` to copy from:

```
install/type-<shorthand>-<lower_snake>.md
```

The type name is lowercased; spaces become underscores; and for subtypes the `.` becomes `_`. So filenames carry one delimiter style (`_`) regardless of how the type is named.

**Destination path** — where the file is written into the workspace:

```
Mesh/Metadata/Types/(Type) <Name> [. <Subname>] (<Shard Name> Shard).md
```

The type name is kept as it is. Subtypes use ` . ` (space-dot-space) so the parent and child both stay readable. The `(<Shard Name> Shard)` suffix is the collision guard — two shards with different names may both declare a `Task` type and their definition files won't clobber each other. The qualifier uses the name also when the shard is installed under another alias, so two shards with one name share the destination (the second install keeps the first file).

**The two-separator asymmetry is deliberate.** Filenames use `_` because filesystems are awkward with dots and spaces; workspace paths use ` . ` because Obsidian and the Mesh browser render them as they are. The same type declaration takes three forms:

| Manifest | Source file | Destination |
|----------|-------------|-------------|
| `Task` (proj) | `install/type-proj-task.md` | `Mesh/Metadata/Types/(Type) Task (Projects Shard).md` |
| `Learning Report` (lrn) | `install/type-lrn-learning_report.md` | `Mesh/Metadata/Types/(Type) Learning Report (Learn Shard).md` |
| `Note.Concept` (f) | `install/type-f-note_concept.md` | `Mesh/Metadata/Types/(Type) Note . Concept (Flint Shard).md` |

The two derive functions (`resolveTypeSourceFilename`, `resolveTypeDestPath` in `packages/flint/src/domain/shards/installer.ts`) are the only place this mapping is encoded.

**Naming rules** (parser-enforced):

- Each word with a capital letter; letters, numbers, and spaces only on each segment.
- Format: `Type`, `Multi Word Type`, or `Type.Subtype` — exactly one level of nesting.
- Pattern: `/^[A-Z][A-Za-z0-9]*(?: [A-Z][A-Za-z0-9]*)*(?:\.[A-Z][A-Za-z0-9]*(?: [A-Z][A-Za-z0-9]*)*)?$/`

**Install behaviour** (per type, every install or sync):

1. Source file missing → **silently skipped**. The validate skill flags the gap separately; install never fails on this.
2. Destination already exists → **skipped** unless `force` mode is set on the install (type definitions install with `mode: once` semantics).
3. Source content is read; `{{uuid}}` and `{{date}}` placeholders are processed — the same template substitution that runs on regular `install/` entries.
4. If overwriting an existing destination (force path), the destination's existing `id:` is preserved so wikilinks pointing at the type definition don't break.
5. `#readonly` is injected into the destination's frontmatter. Every install and every build writes the shard (also from a local or a remote source), so every installed type file carries it.
6. Parent directories are created as needed; the file is written.
7. The record lists the file as a payload: `flint.json#shards[<id>].payloads[]` with `kind: type`, `sha256`, `mode`, and the Mesh `id`. Health and uninstall read the type files from the record, not from the installed `shard.yaml`. Uninstall removes an unchanged type file and keeps a changed one.
8. A rename of the shard moves the type file to the new qualifier (the lock `name`). The file keeps its `id`, and the `[[wikilinks]]` to it follow.

**Authoring workflow:**

```
shard.yaml                       install/                                Mesh/Metadata/Types/
─────────                        ────────                                ────────────────────
types:                           type-proj-task.md          ────────►   (Type) Task (Projects Shard).md
  - Task                                                                 (#readonly injected on installed)
  - Note.Concept                 type-proj-note_concept.md  ────────►   (Type) Note . Concept (Projects Shard).md
```

Add the entry to `types:`, drop the matching file in `install/`, run `flint sync` (or any install path). No `install:` wiring, no folder configuration. To add an artifact-storage folder for the type, declare it explicitly in `folders:`.

## Workspace System Folders

The shard installer ensures these workspace-scoped folders exist on every install. Shard authors don't create them — they're guaranteed by the runtime.

| Folder | Purpose | Tracked? |
|--------|---------|----------|
| `Shards/(Shards) Obsidian Templates/` | Destination for the note templates (`otmp-<sh>-<name>.md` install entries); Templater reads it | Yes |
| `Shards/(Shards) Repos/` | External git repositories cloned via the manifest `repos:` field. One folder per declared `name` (the repo name, each word with a capital letter). Pinned SHAs live in `flint.json#repos[]`. | Yes (the folder; clone contents may be partially gitignored depending on workspace policy) |

There are no state folders. The setup flags are in the records (see Setup and State).

## Setup and State

A shard that needs one-time setup declares `setup: full|flint|local` in `shard.yaml` and provides a `dev-setup-<sh>.md` lifecycle file (installed as `setup-<sh>.md`). The setup file contains human/agent-readable instructions — run builds, authenticate, configure, whatever the shard needs. (For declaring external git clones, prefer the `repos:` manifest field over manual setup steps — see [[dev-knw-knap-manifest]].)

**Setup scope:**

| Scope | Flint layer (`flint.json#shards[<id>].setup`, committed) | Local layer (`.flint/shards.json`, this machine) | Use case |
|-------|------|------|----------|
| `full` | Yes | Yes | Both shared and per-machine setup |
| `flint` | Yes | — | Shared setup only |
| `local` | — | Yes | Per-machine setup only |

The install writes `required` into each declared layer. A layer holds `required`, `not-required`, `completed`, or `none` (not declared). `flint shard setup <ref> --complete` and `--reset` change the layers.

**Runtime detection:** When an agent runs `flint shard start <ref>`, the command reads both layers from the records. When a layer is `required`, the output is `FORCE SETUP`, the setup file, and then the banner, and the command exits 1:

```
SETUP REQUIRED — READ setup-<sh>.md AND REQUEST SETUP FROM THE USER BEFORE CONTINUING
```

The gate opens when every declared layer is `completed` or `not-required`.

### Setup lifecycle file (`setup-<sh>.md`)

A first-class shard lifecycle file at the same tier as `init-<sh>.md`. In dev folders: `dev-setup-<sh>.md` (prefix stripped on install). Contains markdown instructions for the setup actions the shard needs. Not a type, not in `install/`, not in a subfolder.

The installer refuses to install a shard that declares `setup` but has no setup file.

## Design Principles

### Single Responsibility
Each shard handles one domain. Task management (`proj`), version tracking (`inc`), brainstorming (`ntpd`) — never multiple domains in one shard.

### Dependency Declaration
If a shard needs another shard's artifacts or conventions, declare it in `dependencies:`: a map from the package name to a range. A dependency names a shard, never a source. The range is enforced, and the install is transitive with a plan. See [[dev-knw-knap-manifest]] § `dependencies`.

```yaml
dependencies:
  "@nuucognition/flint": "^0.2"       # Core — almost always required
  "@nuucognition/notepad": "^1.0"     # If the shard creates long-lived artifacts
  "@nuucognition/projects": ""        # If the shard interacts with tasks (any version)
```

### Progressive Disclosure
Init files give the overview. Skills/workflows give the instructions. Knowledge files give the depth. Templates give the structure. Agents load what they need, when they need it.

`flint shard start <name>` assembles a dynamic manifest by scanning shard files and reading their `description` frontmatter. The manifest lists:
- Required reading files (from init YAML `required-reading`)
- Init file path (the same init in both modes)
- Skills with descriptions
- Workflows with descriptions, and each workflow with an invocation file under `## Invocations`
- Templates with descriptions
- Knowledge files with descriptions

This replaces hardcoded tables in init files — descriptions are maintained in each file's own frontmatter, and the manifest is always up to date.

### Convention Over Configuration
Follow naming conventions strictly. Conventions enable tooling, discovery, and interoperability:
- Shorthand in every filename
- Consistent prefix patterns (`sk-`, `wkfl-`, `tmp-`, `knw-`, `ast-`)
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

## Spec Versions

A shard declares the version of the **shard packaging spec** it conforms to via `shard-spec` in `shard.yaml`. This is independent from the shard's own `version` (semver lifecycle) — `shard-spec` describes the rules of the packaging itself, `version` describes the shard's content.

Current spec: `"0.4.0"`. Older specs that still parse: `"0.3.0"`, `"0.2.0"`, `"0.1.0"`.

### What Changed: 0.3.0 → 0.4.0

| Area | 0.3.0 | 0.4.0 |
|------|-------|-------|
| The package name | Not stored: derived from `org` and `slugKey(name)` | `shard: "@nuucognition/knap"`: the package name in the short form, always quoted. `"@/knap"` means no org. The slug MUST be `slugKey(name)`. |
| The org | `org: nuucognition` (a kebab slug; absent means no org) | The first segment of `shard`. `org:` is a parse error. |
| Rename of the name | Edits `name` | Edits `name` and `shard` |

To move a source to `0.4.0`: run `flint migrate run` (the step `flint-0.6.0-to-0.7.0-s8` rewrites every source and its build; the Flint version stays `0.7.0`), then commit, then release. `org:` at `0.3.0` parses forever, because every published version keeps it.

### What Changed: 0.2.0 → 0.3.0

| Area | 0.2.0 | 0.3.0 |
|------|-------|-------|
| Identity | No `id` | The shard `id` and the `source` block with the source id (uuids v4 or v7), minted by `flint shard create`, filled by `flint shard id` |
| Name | The name only | `org` plus the name: the address `@org/shard/<slug>` |
| Rename history | None | `formerNames` (renames of the name) and `formerShorthands` (renames of the shorthand), written by `flint shard rename` |
| Fork origin | None | `of: { id, address? }` and `source.of: { id }`, written by `flint shard fork` |
| Dependencies | `{ source: owner/repo, version? }`, floor not enforced | A map from package name to range (`"@org/name": "^1.0"`), enforced, transitive install with a plan; the list form parses as legacy input |

To move a shard to `0.3.0`: set `shard-spec: "0.3.0"` and run `flint shard id <alias>` (it fills the ids and `org`). No file renames are needed.

### What Changed: 0.1.0 → 0.2.0

| Area | 0.1.0 | 0.2.0 |
|------|-------|-------|
| Init file body | Hard-coded `## Skills` / `## Workflows` / `## Templates` / `## Knowledge` discovery tables | Tables removed — `flint shard start` discovers them dynamically by scanning the shard tree |
| Init file frontmatter | None | YAML `required-reading:` list of wikilinks (e.g. `"[[knw-<sh>-<name>]]"`) |
| Required reading entries | Wikilinks listed in a markdown body section | Wikilinks (or relative paths, legacy) in the frontmatter list |
| Skill / workflow context line | `Ensure you have [[init-<sh>]] in context before continuing.` | `Run \`flint shard start <sh>\` if you haven't already.` (at 0.2.0, an `hwkfl-*` file used `hstart`; `hwkfl-*` files and `hstart` are removed now: see [Modes](#modes-one-workflow-for-each-mode)) |
| Per-file frontmatter | None | Every `sk-*`, `wkfl-*`, `tmp-*`, `knw-*` MUST declare `description:` |
| Setup mechanism | `state: true` boolean + `requires.cli` + `requires.workspace` blocks (and sometimes `repos:` mis-used as setup) | Single `setup: full \| flint \| local` field + companion `dev-setup-<sh>.md` lifecycle file |
| Scripts | `scripts:` list declared in the manifest | Removed — auto-discovered from `scripts/*.js` (with `dev-` prefix on dev sources) |
| Types | `types:` could imply folder creation | Declares the type-definition file only; storage folders require an explicit `folders:` entry |
| Type install path | Varied per shard | Canonical: `Mesh/Metadata/Types/(Type) <Name> [. <Subname>] (<Shard> Shard).md` |
| `install/` folder | Mixed prefix conventions | Literal payloads, NEVER `dev-` prefixed |
| `scripts/`, `assets/`, `migrations/`, `skills/`, `workflows/`, `templates/`, `knowledge/` | Mixed prefix conventions | Source files MUST be `dev-` prefixed; the build strips the prefix |
| Source and shard | One folder for both | Separate folders: the source (today `Shards/(Source Remote\|Local) Name/`) and the shard `Shards/Name/` |
| Manifest parser strictness | Tolerant of legacy fields (warnings only) | Legacy `state:` / `requires:` / explicit `scripts:` are HARD ERRORS at `shard-spec: "0.2.0"`; warnings only on `"0.1.0"` |

### Migrating a 0.1.0 shard

The mechanical pass is owned by [[dev-wkfl-knap-migrate_shard_spec_0.1.0_to_0.2.0]]. The bulk filename rename is automated by the `prefix-shard` script (`flint shard knap prefix-shard <path>`), which adds `dev-` to source files and strips it from `install/` payloads. The remaining edits — frontmatter, manifest field migration, init-file restructuring — are direct applications of this knowledge file plus [[dev-knw-knap-manifest]].

`flint sync` gives the `outdated-spec` notice for a source below the current spec (`0.1.0`, `0.2.0`, and `0.3.0`) on the source feature `shard-sources`. A shard (a build) gets no notice.
