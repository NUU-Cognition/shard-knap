---
name: Knap CLI Reference
description: Full flint shard CLI surface — what each command does, how a shard reference resolves, the --json shapes, and when to reach for each command
type: knowledge
---

# Knap CLI Reference

The `flint shard` command is the only supported way to change shard state. **Never** rename shard folders, edit `flint.json#shards`, edit `.flint/shards.json`, or scaffold a shard by hand. The CLI keeps the records, the folders, and the manifests in step. If a command in this file matches your need, run it.

## Shard References

A command that takes `<ref>` accepts any of these forms:

| Form | Example | Note |
|------|---------|------|
| Alias | `se-alpha` | The key of the record in `flint.toml`. The alias wins over every other form. |
| Shorthand | `sa` | The prefix of the file names. |
| Id | `42a66b03-32c9-45c7-aaf0-82a530e34534` or `@42a66b03-…` | The full id. A short id prefix is not accepted. |
| Address | `@/flint/se-docs/shard/se-alpha` | The entity address of the shard in this Flint. |

The CLI resolves a reference through the records of the Flint. When a reference names two shards, the command stops with the code `ambiguous`, names both shards with their ids, and gives one next command per shard in the id form (`flint shard status @<id>`). Nothing is written.

Dev-only commands (`id`, `rename`, `push`, `pull`, `dev`, `release`) resolve to the checkout (the Dev Local or the Dev Remote folder). `start` and `hstart` load the installed copy; `start-dev` and `hstart-dev` load the checkout.

## Source Grammar

`install`, `fork`, and `dependencies[].source` read one source grammar:

| Kind | Form | Note |
|------|------|------|
| GitHub | `owner/repo`, `owner/repo@1.2.0` | Cloned from GitHub. |
| Path | `./Shards/(Dev Local) X`, `/abs/path`, `../src` | A folder on this machine. |
| Address | `@/flint/<flint>/shard/<alias>[#place]`, `@<uuid>[#place]` | Resolved through the places router on this machine. |
| Legacy input | `flint://<Flint Name>/<shard>` | Parses forever as an input. The record stores the address instead, and the install prints one change line: `record <alias>: source spelling flint://… becomes @/flint/…`. |

A dev shard name (`se-alpha`, `'(Dev Local) Se Alpha'`) is also an input of `install`. A `#place` that is this machine or a Flint of this machine resolves. A place on another machine answers `unsupported` in this release, with the next command `flint resolve <address>`. `@org/shard/<name>` (the registry) answers `unsupported` in this release.

## Command Surface

### Inspect

| Command | Purpose |
|---------|---------|
| `flint shard list` (alias `ls`) `[--json] [--sources] [--wide]` | One row per shard: `ALIAS SHORTHAND ROLE VERSION SOURCE ID` (the id in 8 characters; a held id has the mark `(held)`). |
| `flint shard status <ref> [--json] [--health]` | The record, the folders, the dependency states, the checkout state, and the pending migrations. `--health` also runs the health check and exits 1 on an error finding. |
| `flint shard info <ref> [--json]` | The detail of one shard: identity, source, folder, contents, dependencies, dev sibling. |
| `flint shard <ref>` | The same as `info`. |
| `flint shard scripts <ref>` | The `scripts/*.js` of the shard. |
| `flint shard versions <ref>` | The remote tags. Needs a GitHub source. |
| `flint shard published` | Your shards in the NUU Shard Registry. Needs `flint login`. |

### Start (loaded by the agent runtime)

| Command | Purpose |
|---------|---------|
| `flint shard start <ref> [--json] [--dump]` | The dynamic manifest of the installed copy (or the source folder of a reference record): header, `init-<sh>.md`, required reading, skills, workflows, templates, knowledge. |
| `flint shard start-dev <ref> [--json]` | The same for the checkout (`dev-init-<sh>.md`). |
| `flint shard hstart <ref> [--json] [--dump]` | The headless manifest: `hinit-<sh>.md` and the `hwkfl-*` workflows. A shard with no `hinit-<sh>.md` is refused with the next command `flint shard start <ref>`. |
| `flint shard hstart-dev <ref> [--json]` | The headless manifest of the checkout. |

The header of every start names the entity:

```
# Shard: Se Alpha (sa) v0.1.0
Id: 42a66b03-32c9-45c7-aaf0-82a530e34534
Alias: se-alpha
Address: @/flint/se-docs/shard/se-alpha
Role: replica
Source: ./Shards/(Dev Local) Se Alpha
```

`Role` is the role of the loaded folder: `canon` (a Dev Local), `draft` (a Dev Remote on a work branch, ahead, or dirty), `replica` (an installed copy, or a level Dev Remote), or `reference`. `list`, `status`, and `info` use the same words. A held id prints as `Id: <id> (held)`.

The start refuses and exits 1 when a setup layer is `required` (`FORCE SETUP`, the setup file, then `SETUP REQUIRED`), when shard migrations are pending, when the reference source is gone (`reference-missing`, next `flint sync`), and when the reference is `not-found` or `ambiguous`. With `--json` every end is one JSON value (see [--json Shapes](#--json-shapes)).

Skill and workflow files begin with the context line `Run \`flint shard start <sh>\` if you haven't already.` (`hstart` for `hwkfl-*`, and `start-dev` / `hstart-dev` in dev shards).

### Install / Update

| Command | Purpose |
|---------|---------|
| `flint shard install <source>... [--json]` | Install a copy. Writes the `flint.toml` record `<alias> = { id, source }`, the record `flint.json#shards[<id>]`, and `.flint/shards.json`. Installs missing dependencies first (see below). |
| `flint shard install <source> --alias <alias>` | Install under another alias (kebab-case). Needed for a second shard with the same slug. The folder becomes `Shards/<Alias As Title>/`. |
| `flint shard install <source> --reference` | Install by reference: `use = "reference"`, no copy under `Shards/`; the loader reads the source folder on this machine. The type files and install payloads still go into the Mesh. Not for a GitHub source. |
| `flint shard install <source> --no-deps` | Install the shard alone. The missing dependencies are printed with their install commands. |
| `flint shard install --from-local "<Flint Name>/<shard>"` | Install a dev shard of another registered Flint on this machine. |
| `flint shard install --all-dev` | Install every dev shard of this Flint. |
| `flint shard reinstall [<ref>]` | Install the copy again from its declared source. No ref: every installed shard. **Use after you edit a dev shard.** |
| `flint shard update [<ref>] [--reinstall] [--json]` | Update installed copies to the newest remote version. No ref: every installed shard. Skips dev shards; refuses a reference record. |
| `flint shard uninstall <ref> [--json]` | Remove the copy, the record, the local entry, and the unchanged payloads. A changed or shared payload stays. |
| `flint shard pin <ref> <version>` / `unpin <ref>` | Pin or unpin a version in `flint.toml`. Needs a GitHub source. |

The install refuses before any write, with the reason and a next command, when:

- the alias is the key of another shard: `The key <alias> in flint.toml is used by another shard (id <id>, source <source>). A second shard with the slug <alias> needs an alias.` Next: `flint shard install <source> --alias <alias>`.
- the shorthand is taken: `the shorthand <sh> is used by <alias>`.
- the same id is already present: `shard <Name> is already present in this Flint as Shards/<folder>`.
- a dependency is below its floor (`dependency-below-floor`), a source does not parse (`manifest-error`), the dependencies form a cycle, or a dependency cannot be reached (`dependency-unreachable`, next `… --no-deps`).
- the Flint holds the legacy record shape: `shard records are in the legacy shape`, next `flint migrate run`.

The transitive plan prints one line per missing dependency before any write, then installs in that order:

```
→ will install Se Dep from /src/dep (needed by se-top)
✓ Installed Se Dep (/src/dep)
✓ Installed Se Top
```

### Develop

| Command | Purpose |
|---------|---------|
| `flint shard create "<Title>" [-s <sh>] [-d "<desc>"] [--setup [full\|flint\|local]] [--no-install] [--json]` | Make a Dev Local at `Shards/(Dev Local) <Title>/` with `shard.yaml` (`shard-spec: "0.3.0"` and a new `id`), `dev-init-<sh>.md`, `README.md`, and a setup file with `--setup`. Writes the record with its `id` and installs the copy (`--no-install` skips the install). **Always start here.** |
| `flint shard type add <Name> --shard <sh> [--description] [--folder] [--dashboard] [--obsidian]` | Add an artifact type to an editable shard and install it. |
| `flint shard id <ref> [--dry-run] [--json]` | Fill the `id` of a Dev Local or an edit checkout that has none. Refuses a replica. On a dirty checkout or a work branch it writes the id and prints the next command `flint shard push <ref>`. |
| `flint shard rename <ref> --title "<New Name>" [--json]` | Canon or edit checkout only. Writes the new `name` and one `formerNames` line, renames the checkout and the installed folder, moves the type files (they keep their ids), and changes the alias and the `flint.toml` key when the alias was the old slug. The id does not change. |
| `flint shard rename <ref> --shorthand <new> [--json]` | Canon or edit checkout only. Renames the prefixed files, rewrites the references and the `#<old>/` tags, adds `formerShorthands`, bumps the major version, scaffolds `migrations/dev-mig-<new>-<from>-to-<to>.md`, and reinstalls the copy (the migration is queued for it). |
| `flint shard fork <source> --name "<Name>" [--shorthand <sh>] [--no-install] [--json]` | Copy any source into a new Dev Local with a new id and `of: { id, address }`. The source does not change. |
| `flint shard clone <owner/repo>` | Clone a GitHub shard as a Dev Remote for editing. Does NOT install. |
| `flint shard dev <ref> <github-url>` | Promote a Dev Local to a Dev Remote: `git init`, set the remote, commit, push. Needs a GitHub HTTPS or SSH URL. |
| `flint shard push <ref> [-m "<msg>"] [-b [patch\|minor\|major]]` | Commit and push the checkout. |
| `flint shard pull <ref>` | `git pull` the checkout. |

A rename in a replica is refused: `Shards/<X> is a replica (an installed copy). … The canon is <source>.` The old forms `rename title` and `rename shorthand` still work and print the new form.

### Setup

When `shard.yaml` declares `setup: full|flint|local`, the shard ships a `dev-setup-<sh>.md` and the record keeps the setup state per layer:

| Command | Purpose |
|---------|---------|
| `flint shard setup <ref>` | Show the state of the Flint layer (`flint.json#shards[<id>].setup`) and the local layer (`.flint/shards.json`). |
| `flint shard setup <ref> --complete` | Mark setup complete (the default scope comes from `manifest.setup`). |
| `flint shard setup <ref> --complete --scope flint\|local\|both` | Override the scope. |
| `flint shard setup <ref> --reset` | Set the layers back to `required`. |

Run `--complete` yourself when you have finished the actions of the setup file. Until then `flint shard start` refuses the shard and exits 1.

### Migrations

| Command | Purpose |
|---------|---------|
| `flint shard migrate list <ref>` | The migration steps of the shard with type and status. |
| `flint shard migrate show [<ref>]` | The migration state of one shard, or of every shard. |
| `flint shard migrate run <ref>` | Run the queued steps. Script steps run in a chain; the run stops at an agent or manual step. |
| `flint shard migrate finish <ref>` | Mark the current agent or manual step done and delete its file. |
| `flint shard migrate rerun <ref> <step>` | Run one step again. |

The ledger of a shard is in its record: `flint.json#shards[<id>].migrations` (done steps with their times) and `.pending` (queued steps).

### Publish

| Command | Purpose |
|---------|---------|
| `flint shard publish <ref> [--remote <git-url>] [--org <slug>] [--no-register] [--version <x.y.z>] [-m "<msg>"] [--json]` | Commit, tag `v<version>`, push, and register. Works from a checkout, a Dev Local (it makes the repository), or an installed copy. A manifest below the current spec publishes with a warning that names `flint shard id <sh>`. |
| `flint shard release <ref> [<version>]` | Tag the checkout at its `shard.yaml` version and push the tag. Refuses a tag that exists. |
| `flint shard unpublish <slug>` | Remove the shard from the registry. Needs `flint login`. |

### Scripts

Scripts live at `scripts/*.js` and are auto-discovered. Two invocation forms work; prefer the short form:

```bash
flint shard <sh> <script> [args...]        # short form (preferred)
flint shard <sh> exec <script> [args...]   # explicit exec form
```

Inside the script, the runtime exposes `FLINT_ROOT` (workspace root) and `FLINT_SHARD` (shard folder) as env vars. The shorthand is **not** in the filename — the file at `scripts/dev-prefix-shard.js` is invoked as `flint shard knap prefix-shard`.

### Workspace-Level

| Command | Purpose |
|---------|---------|
| `flint sync [--dry-run]` | Make the shards match the records. It installs a missing copy, heals a rename of the source (`moved`: the folder, the key, and the type files follow the new Title), refreshes a reference path, and records the checkout state. It reports a missing dependency or a floor fault as not current, and gives a notice for a draft, behind, or dirty checkout. Sync never changes a checkout. |
| `flint resolve <address> [--json]` | Resolve a shard address (`@/flint/<flint>/shard/<alias>` or `@<uuid>`) to the entity and its presences on this machine. |
| `flint migrate run [--dry-run]` | Run the pending Flint migration steps. The steps `s5`, `s6`, and `l4` upgrade a Flint with the legacy shard records (see [[dev-knw-knap-architecture]] § Identity and Records). `flint migrate rollback` undoes a run. |

## --json Shapes

| Command | Output |
|---------|--------|
| `list --json` | `{ rows: ShardRow[] }` |
| `status --json`, `info --json` | `ShardRow` plus `details` (`dependencies`, `payloads`, `checkout`, `reference`, `pending`, `installedAt`); with `--health` also `health[]` |
| `start --json` (and `hstart`, `start-dev`, `hstart-dev`) | `{ ok, status, shard: ShardRow, role, manifest: { text, folder, initPath, hinitPath, requiredReading }, setup: { declared, flint, local }, pending }`; a refusal adds `code`, `reason`, `next` |
| `id --json` | `{ ok, id, minted, folder, notice? }` |
| `fork --json` | `{ ok, id, of, name, shorthand, folder, installed }` |
| `rename --json` | `{ ok: true, kind: "title" \| "shorthand", … }` |
| Every refusal | `{ ok: false, code, reason, next? }` (no `next` when no command fixes it, e.g. `manifest-error`) |

`ShardRow`:

| Field | Value |
|-------|-------|
| `id` | The id (`null` on a Flint with the legacy record shape). |
| `held` | `true` for a client-held id. |
| `alias`, `shorthand`, `name` | The key, the prefix, the Title. |
| `address` | The entity address in this Flint. |
| `role` | `canon` (a Dev Local), `draft` (an edit checkout whose recorded checkout state is a work branch, ahead, or dirty), `replica` (an installed copy, or a level edit checkout), or `reference`. The row reads the checkout state that `flint sync` recorded; `status` shows the live state. The folder kind is in `folders`. |
| `source` | The source of the `flint.toml` record. |
| `version` | The recorded version. |
| `edit` | `true` for an edit checkout (`edit = true`). |
| `use` | `copy`, `reference`, or `none`. |
| `folders` | `{ installed?, checkout? }` |
| `setup` | `required`, `not-required`, `completed`, or `none`. |
| `pending` | The queued shard migration steps. |


## When to Use What — Authoring Flow

1. `flint shard create "<Title>" -s <sh>` — scaffold, mint the id, install the copy.
2. Edit `dev-init-<sh>.md`, write skills, workflows, templates, and knowledge by hand.
3. `flint shard type add <Name> --shard <sh>` for each artifact type.
4. `flint shard scripts <sh>` to confirm script discovery; `flint shard <sh> <script>` to run one.
5. `flint shard rename <alias> --title "<New>"` or `--shorthand <new>` if you change the name — never rename by hand.
6. `flint shard reinstall <alias>` when you want the installed copy refreshed from the checkout.
7. `flint shard dev <alias> <github-url>` once the shard is ready for a remote, or `flint shard publish <alias>`.
8. `flint shard release <alias>` to tag a version.

For a shard at `shard-spec: "0.2.0"`: set `"0.3.0"` and run `flint shard id <alias>`. For `0.1.0`, see [[dev-wkfl-knap-migrate_shard_spec_0.1.0_to_0.2.0]] first.

## Anti-Patterns

- ❌ Editing `flint.json#shards` or `.flint/shards.json` by hand — the CLI owns them, and a record it does not understand stops every shard command.
- ❌ Writing `id`, `formerNames`, `formerShorthands`, or `of` by hand — use `create`, `id`, `rename`, and `fork`.
- ❌ Changing an `id` — every Flint that holds the shard finds it by the id.
- ❌ Renaming shard folders or `dev-*` files by hand — use `flint shard rename` so references and records stay in step.
- ❌ Running `git mv`/`mv` to add or remove `dev-` prefixes — use the `prefix-shard` script (`flint shard knap prefix-shard <path>`).
- ❌ Skipping `flint shard reinstall` after editing a dev shard, then wondering why the installed copy is stale.
- ❌ Calling `flint shard heal` — the command does not exist; `flint sync` covers it.
