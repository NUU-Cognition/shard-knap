---
description: "Upgrade a shard from shard-spec 0.1.0 to 0.2.0"
---

Run `flint shard start knap` if you haven't already.

# Workflow: Upgrade Shard Spec (0.1.0 → 0.2.0)

You should already have [[knw-knap-architecture]] and [[knw-knap-manifest]] in context (Knap's required reading). Those two files contain everything that defines a 0.2.0 shard — the manifest schema, file conventions, the `dev-` prefix rule, the setup lifecycle, the install model. The migration is mechanical: bring the target shard into compliance with that knowledge.

# Input

- Target shard name or path
- (Optional) `--skip-review` — skip human review stage

# Actions

## Stage 1: Audit

1. Open the target shard. Read `shard.yaml`, the init file, and inventory the file tree.
2. Confirm `shard-spec: "0.1.0"`.
3. Walk the shard against [[knw-knap-manifest]] (manifest schema) and [[knw-knap-architecture]] (file conventions, prefix rules, setup lifecycle). Note every drift:
   - Manifest fields that need to move (`state:`, `requires:`, `repos:`, `scripts:`) or be added (`setup:`, `description`).
   - Files missing the `description` frontmatter or carrying the legacy `Ensure you have [[init-x]] in context` line.
   - Filename prefix violations (any source file outside `install/` not starting with `dev-`; any `install/` file starting with `dev-`).
   - Type-definition file naming, type install paths, and folder declarations.
4. Present the inventory to the user — count of file changes, manifest edits, filename renames.

## Stage 2: Apply

Make the shard match what Knap teaches. The order doesn't matter much; a reasonable pass:

1. **Filename prefixes** — run `flint shard knap prefix-shard <path>` (preview with `--dry-run` first). It handles the entire `dev-` prefix pass automatically. After it runs, manually verify asset names follow `ast-<sh>-<name>.<ext>` and migration filenames follow `mig-<sh>-<from>-to-<to>[-s<n>]` — the script only touches the `dev-` prefix, not the body.

2. **Per-file frontmatter** — every `sk-*`, `wkfl-*`, `hwkfl-*`, `tmp-*`, `knw-*` file gets a `description:` frontmatter line. Replace any legacy `Ensure you have [[init-<sh>]] in context before continuing.` line with `Run `flint shard start <sh>` if you haven't already.` (use `hstart` for `hwkfl-*`).

3. **Init file** — strip the discovery sections (`## Required Reading`, `## Skills`, `## Workflows`, `## Templates`, `## Knowledge`). Add YAML frontmatter `required-reading:` listing the old required-reading wikilinks (e.g. `"[[knw-<sh>-<name>]]"`). See [[knw-knap-architecture]] § Init File.

4. **Manifest** — bring `shard.yaml` into line with [[knw-knap-manifest]]:
   - Replace `state:` / `requires.cli` / `requires.workspace` / `repos:` (when used as a setup mechanism) with a single `setup:` field. Author a companion `dev-setup-<sh>.md` from [[tmp-knap-setup-v0.1]] that captures the old contents in prose.
   - Drop any explicit `scripts:` block. Scripts are auto-discovered from `scripts/*.js`.
   - Add `folders:` for any artifact storage directories the old `types:` field implicitly created.
   - Verify each `types:` entry has a matching `install/type-<sh>-<snake>.md`.

5. **`shard-spec`** — bump to `"0.2.0"`. The parser now treats the legacy fields above as hard errors, so this is the gate that proves the migration is complete.

## Stage 3: Verify

1. Run `flint shard start <name>` (or `start-dev` for dev shards). Confirm:
   - Required reading resolves cleanly.
   - Skills/workflows/templates/knowledge appear with descriptions.
   - If `setup:` is declared, the `SETUP REQUIRED` banner appears (state files start as `setup: required`).
   - No deprecation warnings from the manifest parser.
2. Run `flint sync`. Confirm the `outdated-spec` drift no longer fires for this shard.

## Stage 4: Review

*If `--skip-review` was passed, skip to Stage 5.*

Present the user with:
- Summary of file changes (renames, frontmatter edits, manifest edits).
- The `flint shard start` output for the upgraded shard.
- Any remaining warnings.

## Stage 5: Finalize

If the workspace also needs an installed copy of the shard separate from the dev folder, declare it under `[shards].installed[]` and run `flint shard reinstall <name>` (or `flint sync`). Dev and installed are separate folders — see [[knw-knap-architecture]] § Lifecycle Modes.

# Output

- Target shard fully conforms to the conventions in [[knw-knap-architecture]] and [[knw-knap-manifest]].
- `shard-spec: "0.2.0"` in `shard.yaml`.
- `flint sync` reports no `outdated-spec` drift.
