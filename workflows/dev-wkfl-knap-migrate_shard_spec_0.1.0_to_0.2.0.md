---
description: "Upgrade a shard from spec 0.1.0 to 0.2.0"
---

Run `flint shard start knap` if you haven't already.

# Workflow: Upgrade Shard Spec (0.1.0 → 0.2.0)

Upgrade a shard from shard-spec 0.1.0 to 0.2.0. The 0.2.0 spec introduces progressive disclosure — skills, workflows, templates, and knowledge are discovered dynamically by `flint shard start` instead of being hardcoded in init file tables.

# Input

- Target shard name or path
- (Optional) `--skip-review` — skip human review stage

# Changes in 0.2.0

| Area | 0.1.0 | 0.2.0 |
|------|-------|-------|
| Init file | Contains Skills/Workflows/Templates/Knowledge tables | Tables removed — `flint shard start` discovers them dynamically |
| Init file | No frontmatter | YAML frontmatter with `required-reading` list |
| Skill/workflow files | "Ensure you have @init-x.md in context before continuing" | "Run `flint shard start <shorthand>` if you haven't already" |
| All shard files | No frontmatter | YAML frontmatter with `description` field |
| Manifest: setup | `state: true`, `requires.cli`, `requires.workspace`, `repos:` | Single `setup: full \| flint \| local` field + companion `dev-setup-<sh>.md` lifecycle file |
| Manifest: scripts | `scripts:` list declared explicitly | Removed — scripts auto-discovered from `scripts/*.js` |
| Manifest: types | `types:` could imply folder creation | Declares type-definition file only; folders require explicit `folders:` |
| Type install path | Varied | Canonical: `Mesh/Metadata/Types/(Type) <Name> [. <Subname>] (<Shard> Shard).md` |
| `install/` folder | Mixed prefix conventions | Literal payloads, **never** `dev-` prefixed |
| `scripts/`, `assets/`, `migrations/` | Mixed prefix conventions | Dev sources `dev-` prefixed; installer strips on install |
| Dev vs installed shards | Conceptually separate folders | Coexist in same folder — installer writes stripped copy alongside `dev-*` source |
| shard.yaml | `shard-spec: "0.1.0"` | `shard-spec: "0.2.0"` |

# Actions

## Stage 1: Audit

1. Load the target shard — read `shard.yaml`, the init file, and list all files in the shard directory (recurse into subfolders under `skills/`, `workflows/`, `templates/`, `knowledge/`, `assets/` — subfolder groupings are supported)
2. Confirm the shard is currently on spec 0.1.0
3. Build an inventory of all files and all manifest fields that need changes:
   - **Init file**: frontmatter + section stripping
   - **Description frontmatter**: every `sk-*.md`, `wkfl-*.md`, `hwkfl-*.md`, `knw-*.md`, `tmp-*.md`
   - **Context line update**: every `sk-*.md`, `wkfl-*.md`, `hwkfl-*.md`
   - **Manifest `requires:` / `state:` / `repos:`**: capture existing content — will be migrated to `setup:` + `dev-setup-<sh>.md`
   - **Manifest `scripts:` block**: if present, will be removed (scripts auto-discovered in 0.2.0)
   - **Manifest `types:` block**: verify each entry — type definitions install to `Mesh/Metadata/Types/` and do NOT create artifact folders automatically
   - **`install/` folder**: any file starting with `dev-` must be renamed (payloads never carry dev prefix)
   - **`scripts/`, `assets/`, `migrations/`**: dev sources must be `dev-` prefixed (rename any that aren't)
4. Identify which knowledge files the init's Required Reading section references (these become the `required-reading` list)
5. Present the inventory to the user — how many files, what manifest changes, which filename renames

Once confirmed, progress to the next stage.

## Stage 2: Add Description Frontmatter

For every skill, workflow, knowledge, and template file in the shard:

1. Read the file
2. Determine a one-line description from the file's heading and first paragraph
3. Add YAML frontmatter:
   ```yaml
   ---
   description: "One-line description of what this file does"
   ---
   ```
4. If the file already has frontmatter, add the `description` field to it

Once all files have descriptions, progress to the next stage.

## Stage 3: Update Skill and Workflow Context Lines

For every skill (`sk-*.md`), workflow (`wkfl-*.md`), and headless workflow (`hwkfl-*.md`) file:

1. Find the line that says:
   ```
   This [skill|workflow] belongs to the [Name] shard. Ensure you have [[init-[shorthand]]] in context before continuing.
   ```
   Or the dev variant:
   ```
   This [skill|workflow] belongs to the [Name] shard. Ensure you have [[dev-init-[shorthand]]] in context before continuing.
   ```
2. Replace it according to file prefix:
   - `sk-*.md` and `wkfl-*.md` (interactive):
     ```
     Run `flint shard start [shorthand]` if you haven't already.
     ```
   - `hwkfl-*.md` (headless):
     ```
     Run `flint shard hstart [shorthand]` if you haven't already.
     ```
   For dev shards, use `start-dev` / `hstart-dev` instead of `start` / `hstart`.

## Stage 4: Rewrite Init File

1. Add YAML frontmatter with `required-reading` list:
   ```yaml
   ---
   required-reading:
     - knowledge/knw-[sh]-[name].md
     - knowledge/knw-[sh]-[name].md
   ---
   ```
   The paths are relative to the shard root. Populate from the old Required Reading section's wikilinks.

2. Remove these sections from the init file body:
   - `## Required Reading` (the entire section)
   - `## Skills` (the entire table section)
   - `## Workflows` (the entire table section)
   - `## Templates` (the entire table section)
   - `## Knowledge` (the entire table section)

3. Keep everything else: shard description, core concepts, lifecycle diagrams, dashboards, scripts, CLI references, and any domain-specific content.

4. If the init had a "Loading a Shard" or similar section referencing the old pattern, update it to mention `flint shard start`.

## Stage 5: Migrate Setup Lifecycle

If the manifest has any of `requires:`, `state:`, or `repos:`, replace them with a single `setup:` scope plus a `dev-setup-<sh>.md` file. If none are present, skip to Stage 6.

1. **Choose scope** based on what existed in 0.1.0:
   - `state: true` **or** workspace setup that needs to be shared across machines → `setup: flint` (tracked state file only)
   - Per-machine-only setup (credentials, machine-specific paths) → `setup: local` (gitignored state file only)
   - Both shared and per-machine → `setup: full` (both state files)

2. **Create `dev-setup-<sh>.md`** at the shard root using [[dev-tmp-knap-setup-v0.1]]. Copy the old content verbatim into prose:
   - Each `requires.cli` entry → a prerequisite bullet ("Install `<tool>`")
   - Each `requires.workspace` entry → a step under `# Actions` (inline the script contents or describe the check)
   - Each `repos:` entry → a step under `# Actions` ("Clone `<url>` to `<path>`"; add auth notes if relevant)

3. **Rewrite the manifest**:
   - Remove the entire `requires:`, `state:`, and `repos:` blocks
   - Add `setup: <scope>` at the top level
   - Leave `dependencies:` untouched (still supported)

4. **Verify the install refuses to proceed without the setup file** — this is the expected failure mode if the file is missing.

## Stage 6: Remove Scripts Declarations

If `shard.yaml` has a `scripts:` block, remove it entirely. In 0.2.0, scripts are auto-discovered from `scripts/*.js`.

1. Delete the `scripts:` block from the manifest
2. For each `.js` file under `scripts/`:
   - Dev shard source must be `scripts/dev-<name>.js` (add `dev-` prefix if missing)
   - Command name is derived from the filename stem with `dev-` stripped (e.g., `dev-new-number.js` → `flint shard <sh> new-number`)
3. Reject filenames containing characters invalid for CLI commands; rename them

## Stage 7: Normalize Dev-Prefix Conventions

The 0.2.0 installer rejects `install/dev-*` files and expects `dev-` prefix on every other source file.

1. **`install/`** — rename any file starting with `dev-` (e.g., `install/dev-foo.md` → `install/foo.md`). These are literal payloads, never dev-prefixed.
2. **`scripts/`, `assets/`, `migrations/`** — ensure every source file starts with `dev-` (e.g., `assets/foo.svg` → `assets/dev-ast-<sh>-foo.svg`, `migrations/mig-<sh>-1.0.0-to-1.1.0.md` → `migrations/dev-mig-<sh>-1.0.0-to-1.1.0.md`).
3. **Type definitions** — ensure `install/type-<sh>-<type>[_<subtype>].md` naming. No `dev-` prefix (they live under `install/`).

## Stage 8: Verify Type Paths

For each entry in `types:`:

1. Confirm a matching file exists at `install/type-<sh>-<type_snakecase>.md`
2. Subtypes use underscore in the filename: `install/type-<sh>-<type>_<subtype>.md` and install to `Mesh/Metadata/Types/(Type) <Name> . <Subname> (<Shard> Shard).md`
3. If the 0.1.0 shard used `types:` to also create artifact folders (e.g., `Mesh/Types/Task/`), add an explicit `folders:` entry — `types:` alone no longer creates folders in 0.2.0

## Stage 9: Bump Spec Version

1. In `shard.yaml`, change:
   ```yaml
   shard-spec: "0.2.0"
   ```

2. Run `flint shard start <name>` (or `start-dev` for dev shards) and verify:
   - Required reading paths resolve correctly
   - All skills/workflows/templates/knowledge show descriptions
   - Init file loads cleanly
   - If `setup:` is declared, the `SETUP REQUIRED` banner appears on first load (expected — state files start with `setup: required`)
   - No deprecation warnings from the manifest parser (any remaining `requires`/`state`/`repos`/`scripts` will be flagged)

## Stage 10: Review

*If `--skip-review` was passed, skip to Stage 11.*

Present the user with:
- Summary of files changed (renames, frontmatter adds, manifest edits)
- The `flint shard start` output for the upgraded shard
- Any deprecation warnings still emitted by `manifest.ts`
- If setup was migrated: show the new `dev-setup-<sh>.md` for review
- Any issues found during upgrade

Once confirmed, progress to the final stage.

## Stage 11: Finalize

- Confirm upgrade is complete
- Run `flint shard install --all-dev` (or per-shard `flint shard install <path>`) to write stripped installed copies alongside the dev sources in the same folder
- Verify state files now exist under `Shards/(Shards) State/` and/or `Shards/(Shards) Local State/` if `setup:` was declared
- Verify the `SETUP REQUIRED` banner drops off once state files are flipped to `setup: completed`

# Output

- All shard files updated to 0.2.0 spec
- Init file stripped of discovery sections, frontmatter added
- All files have `description` frontmatter
- Skill/workflow context lines updated
- `requires:`, `state:`, `repos:`, `scripts:` migrated to `setup:` + `dev-setup-<sh>.md` and auto-discovery
- `install/` files unprefixed; `scripts/`, `assets/`, `migrations/` all `dev-` prefixed
- Type paths verified against `Mesh/Metadata/Types/`
- `shard-spec` bumped in shard.yaml
- Installed copies regenerated in-place alongside dev sources
