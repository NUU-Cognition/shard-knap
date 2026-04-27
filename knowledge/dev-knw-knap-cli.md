---
name: Knap CLI Reference
description: Full flint shard CLI surface — what each command does, when to reach for it, and how dev/installed resolution works
type: knowledge
---

# Knap CLI Reference

The `flint shard` command is the only supported way to mutate shard state. **Never** rename folders, edit `flint.toml#[shards]` arrays, or hand-create scaffolding by hand — the CLI handles all of these correctly and is the contract the kernel reconciles against. Reach for this file before doing any shard authoring action; if a command in this file matches your need, run it instead of doing the equivalent work manually.

## Resolution Rules

When a command takes a `<shorthand>` and the shard exists in multiple modes (e.g. installed *and* dev-remote), most subcommands resolve to the **dev** copy by default — `pull`, `push`, `release`, `publish`, `rename`. The exceptions are inspect-only commands (`info`, `status`, `start`, `hstart`) which target the installed copy unless you use the `-dev` variant (`start-dev`, `hstart-dev`).

The shard name accepted at the CLI is always the **shorthand** (`knap`, `proj`), not the title (`Knap`, `Projects`).

## Command Surface

### Inspect

| Command | Purpose |
|---------|---------|
| `flint shard list` (alias `ls`) | List installed + dev shards with versions and modes |
| `flint shard info <sh>` | Show shard detail — version, source, folder, contents, deps, dev sibling status |
| `flint shard status <sh>` | Same as info plus pending migrations |
| `flint shard scripts <sh>` | List `scripts/*.js` discovered for the shard |
| `flint shard versions <sh>` | List remote tagged versions |
| `flint shard published` | List shards you've published to the registry |

### Lifecycle Manifests (used by agent runtime)

| Command | Purpose |
|---------|---------|
| `flint shard start <sh>` | Dynamic manifest for installed shard (interactive — loads `init-<sh>.md`, lists wkfl/sk/tmp/knw) |
| `flint shard start-dev <sh>` | Same for dev shard (loads `dev-init-<sh>.md`) |
| `flint shard hstart <sh>` | Headless manifest (loads `hinit-<sh>.md`, prefers `hwkfl-*` over `wkfl-*`) |
| `flint shard hstart-dev <sh>` | Headless manifest for dev shard |

Skills inside a shard always begin with the right context line: `Run \`flint shard start <sh>\`...` for skills/wkfl, `Run \`flint shard hstart <sh>\`...` for hwkfl, and `start-dev` / `hstart-dev` variants in dev shards.

### Install / Update

| Command | Purpose |
|---------|---------|
| `flint shard install <source>` | Install from `owner/repo`, `owner/repo@1.2.0`, dev shard name, or local path |
| `flint shard install <source> --with-deps` | Auto-install missing dependencies declared in the shard's manifest |
| `flint shard reinstall [<sh>]` | Re-deploy installed shard from declared source. No name → reinstalls all. **Use after editing a dev shard if you want the installed copy refreshed.** |
| `flint shard update` | Pull latest remote versions for installed shards (skips local + dev) |
| `flint shard uninstall <sh>` | Remove installed shard and clean associated files |
| `flint shard pin <sh> <version>` | Lock to a specific version in `flint.toml` |
| `flint shard unpin <sh>` | Remove the pin |
| `flint shard clone <owner/repo>` | Clone as `(Dev Remote)` for editing — does NOT install |

### Develop

| Command | Purpose |
|---------|---------|
| `flint shard create <Title> [-s <sh>] [-d <desc>] [--setup] [--state]` | Scaffold a new `(Dev Local)` shard with the right folder structure and `dev-` prefixes. Always start here — never hand-craft the folder. |
| `flint shard dev <sh>` | Promote `(Dev Local)` → `(Dev Remote)`: `git init`, set remote, initial commit, push |
| `flint shard rename title <sh> "<New Title>"` | Rename folder + manifest `name`. Updates `flint.toml` config. Dev/local shards only. |
| `flint shard rename shorthand <sh> <new-sh>` | Rename shorthand: renames every `dev-*-<sh>-*.md` file and updates references. Dev/local shards only. |
| `flint shard push <sh>` | `git add -A && git commit && git push` on the dev remote |
| `flint shard <sh> pull` | `git pull` on the dev remote |

### Setup Lifecycle

When `shard.yaml` declares `setup: full|flint|local`, the shard ships a `dev-setup-<sh>.md` and the kernel tracks completion:

| Command | Purpose |
|---------|---------|
| `flint shard setup <sh>` | Inspect setup state across both layers (committed `flint`, gitignored `local`) |
| `flint shard setup <sh> --complete` | Mark setup complete (default scope from manifest.setup) |
| `flint shard setup <sh> --complete --scope flint\|local\|both` | Override the scope |
| `flint shard setup <sh> --reset` | Flip back to required (e.g. when re-running setup) |

Agents are expected to run `--complete` themselves once they've finished the setup file's actions. Until they do, `flint shard start` will refuse to load the shard.

### Migrations

| Command | Purpose |
|---------|---------|
| `flint shard migrate list <sh>` | Show pending migrations |
| `flint shard migrate run <sh>` | Run the next pending migration |
| `flint shard migrate show <sh> <id>` | Show a specific migration |
| `flint shard migrate finish <sh> <id>` | Mark a migration finished after manual completion |
| `flint shard migrate rerun <sh> <id> <step>` | Re-execute a single step from a migration |

### Publish

| Command | Purpose |
|---------|---------|
| `flint shard release <sh>` | Tag the dev shard at its `shard.yaml` version and push the tag |
| `flint shard publish <sh>` | Register the shard in the NUU Shard Registry |
| `flint shard unpublish <sh>` | Remove from the registry |

### Scripts

Scripts live at `scripts/*.js` and are auto-discovered. Two invocation forms work; prefer the short form:

```bash
flint shard <sh> <script> [args...]        # short form (preferred)
flint shard <sh> exec <script> [args...]   # explicit exec form
```

Inside the script, the runtime exposes `FLINT_ROOT` (workspace root) and `FLINT_SHARD` (shard folder) as env vars. The shorthand is **not** in the filename — the file at `scripts/dev-prefix-shard.js` is invoked as `flint shard knap prefix-shard`.

### Workspace-Level

Two flint-level commands matter for shards:

| Command | Purpose |
|---------|---------|
| `flint sync` | Detect drift and apply auto-heals across all shard kernel features (`installed-shards`, `dev-remote-shards`, `dev-local-shards`). Run this whenever the workspace state diverges from intent. |
| `flint shard reinstall` | A targeted form of sync for the installed-shards feature only |

## When to Use What — Authoring Flow

A typical shard creation flow leans on these commands in order:

1. `flint shard create "<Title>" -s <sh>` — scaffold
2. Edit `dev-init-<sh>.md`, write skills/workflows/templates/knowledge by hand
3. `flint shard scripts <sh>` to confirm script discovery
4. `flint shard <sh> exec <script>` (or short form) to run any script during development
5. `flint shard rename title|shorthand` if you change your mind about naming — never do this manually
6. `flint shard dev <sh>` once the shard is ready for a remote
7. `flint shard release <sh>` and `flint shard publish <sh>` to ship
8. `flint shard reinstall <sh>` whenever you want the installed copy of a dev shard refreshed from source

Migration to `shard-spec: "0.2.0"` for an older shard is a separate flow — see [[wkfl-knap-migrate_shard_spec_0.1.0_to_0.2.0]].

## Anti-Patterns

- ❌ Editing `flint.toml#[shards]` arrays by hand — the kernel will rewrite them, and partial state can corrupt drift detection.
- ❌ Renaming shard folders or `dev-*` files by hand — use `flint shard rename` so references and config stay consistent.
- ❌ Running `git mv`/`mv` to add or remove `dev-` prefixes — use the `prefix-shard` script (`flint shard knap prefix-shard <path>`).
- ❌ Skipping `flint shard reinstall` after editing a dev shard, then wondering why the installed copy is stale.
- ❌ Calling `flint shard heal` — the command does not exist; `flint sync` covers it via the kernel drift loop.
