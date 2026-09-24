---
description: "Create a new shard from scratch"
---

> [!important] THIS FILE IS AN INSTRUCTION. WHEN REFERENCED IT IS MEANT TO BE TAKEN AS AN ACTION.

Run `flint shard start-dev knap` if you haven't already.

# Workflow: Create Shard

Scaffold a new shard: a local source and its build.

# Input

- Shard name and purpose
- Desired shorthand (lowercase letters only, any length — short is better)
- Dependencies (other shards this shard requires)
- What artifacts, skills, workflows, and templates it will provide
- Whether it needs setup (and at what scope)

# Actions

## Stage 1: Design

Confirm the shard design with the user:

1. **Validate the shorthand** — must be lowercase letters only (any length) and not conflict with existing shards (check `flint shard list`; `flint shard create` refuses a taken shorthand with `shorthand-taken`)
2. **Define the domain** — what one thing does this shard do? A shard should have single responsibility.
3. **List capabilities:**
   - What artifacts does it manage? (What `(Type)` name, what subtypes, what template)
   - What skills does it provide? (Atomic tasks)
   - What workflows does it provide? (Multi-stage tasks)
   - What knowledge does it need? (Deep reference material)
   - Does it need dashboards or other install files? (Dashboards, system files, Obsidian templates)
   - Does it need scripts? (Deterministic CLI operations)
   - Does it need folders created? (Artifact storage, archive — declared in `folders:`)
   - Does it need one-time setup? (Credentials, repo clones, builds — declared via `setup:` + `dev-setup-<sh>.md`)
4. **Identify dependencies** — which other shards must be installed first: a package name and a range for each (`"@nuu-cognition/notepad": "^1.0"`)

Present the design to the user for confirmation. Once confirmed, progress to the next stage.

## Stage 2: Scaffold

Use `flint shard create` to make a new local source at `Shards/(Source Local) [Name]/`. It is one command: it writes the folder, `shard.yaml`, `dev-init-<sh>.md`, `README.md`, and (if requested) the setup file; it **mints the shard id and the source id** into `shard.yaml` and writes the `org` of the Flint; it writes the record `<alias> = { source = "@org/name", from = "source" }` into `flint.toml`; and it builds the shard at `Shards/[Name]/` with its lock record in `flint.json#shards[<id>]`. **Never hand-craft the folder** and never write an id by hand. Promote the source later to a remote source with `flint shard dev <alias> <github-url>` once a Git remote is ready, then release a version with `flint shard release <alias>`.

1. **Run the scaffold command:**
   ```bash
   flint shard create "<Title>" -s <sh> -d "<description>" [--setup [full|flint|local]] [--no-install]
   ```
   - `--setup` adds `dev-setup-<sh>.md` and declares `setup:` in `shard.yaml` (default scope `full`)
   - `--no-install` writes the source only (the record gets `use = "none"`); build it later with `flint shard build <alias>`
   - Without `-s`, a free shorthand is derived from the name — pass it explicitly when you want control
   - The output reports the created path and the next command (`flint shard start-dev <sh>`); `cd` is not needed
   - `shard.yaml` starts with `shard-spec: "0.3.0"`, `id: <new uuid>`, `org: <org slug>`, and the `source` block with `id: <new uuid>`. Keep these lines.

   ```
   $ flint shard create Oracle --shorthand orc
   Created Oracle.
   Path: Shards/(Source Local) Oracle
   done: source: Shards/(Source Local) Oracle (shorthand orc, address @nuu-cognition/shard/oracle)
   done: build: Shards/Oracle
   Next: flint shard start-dev orc
   ```

2. **Fill in the manifest.** Open the generated `shard.yaml` and edit per [[dev-tmp-knap-shard_yaml-v0.1]]:
   - Add `dependencies:` as a map from package name to range (almost always `"@nuu-cognition/flint": "^0.2"`)
   - Add `types:` for any artifact types the shard manages, or run `flint shard type add <Name> --shard <sh>` (it writes the type file, the template, the folder, and the `types:` entry, and builds the shard)
   - Add `folders:` for artifact storage / archive paths
   - Add `install:` entries for dashboards or Obsidian templates (sources must be `inst-<sh>-…` or `otmp-<sh>-…`)
   - Add `repos:` if external git clones are required
   - Do **not** declare scripts/skills/workflows/templates/knowledge — they are auto-discovered

3. **Flesh out the init.** Edit the generated `dev-init-<sh>.md` per [[dev-tmp-knap-init-v0.1]] — populate `required-reading` frontmatter with `[[knw-<sh>-…]]` wikilinks for each knowledge file you plan to write.

4. **Add headless init** (optional): if the shard will run in headless Orbh sessions, create `dev-hinit-<sh>.md` at the shard root.

5. **Edit setup file** (if `--setup` was passed): the CLI created `dev-setup-<sh>.md`. Fill it in per [[dev-tmp-knap-setup-v0.1]] with the actual setup actions.

6. **Create capability files** in their respective subfolders. Each MUST declare `description:` frontmatter. The `flint shard create` scaffold leaves these empty — author them by hand using the listed template:
   - `skills/dev-sk-<sh>-<name>.md` — [[dev-tmp-knap-skill-v0.1]]
   - `workflows/dev-wkfl-<sh>-<name>.md` — [[dev-tmp-knap-workflow-v0.1]]. For headless variants add `dev-hwkfl-<sh>-<name>.md`; its top context line is `Run \`flint shard hstart <sh>\`...` (not `start`).
   - `templates/dev-tmp-<sh>-<name>-v<X.X>.md` — [[dev-tmp-knap-template-v0.1]]
   - `knowledge/dev-knw-<sh>-<name>.md` — [[dev-tmp-knap-knowledge-v0.1]]
   - `scripts/dev-<name>.js` — [[dev-tmp-knap-script-v0.1]]. Verify discovery with `flint shard scripts <sh>`.

7. **Create install payloads** (**no `dev-` prefix** inside `install/`):
   - General payloads: `install/inst-<sh>-<name>.md` (dashboards, system files) — declare under `install:` in `shard.yaml`
   - Obsidian templates: `install/otmp-<sh>-<name>.md` — declare under `install:` with dest `Shards/(Shards) Obsidian Templates/otmp-<sh>-<name>.md`
   - Type definitions: `install/type-<sh>-<type>[_<subtype>].md` per [[dev-tmp-knap-type-v0.1]] — auto-resolved via `types:`, do **not** add an `install:` entry

8. **Renames**: if you change your mind about the name or the shorthand, use `flint shard rename <alias> --name "<New Name>"` or `flint shard rename <alias> --shorthand <new-sh>` — never `mv` folders or files by hand. The id does not change. See [[dev-knw-knap-architecture]] § Renames.

9. Create or edit `README.md` with the shard overview and structure.

Once scaffold is complete, progress to the next stage.

## Stage 3: Verify

1. Run [[dev-sk-knap-validate]] on the new shard
2. Fix any issues found (particularly: missing `description` frontmatter, dev-prefix violations in `install/`, missing `dev-setup-<sh>.md` when `setup:` is declared)
3. Run `flint shard build <alias>` and `flint shard start <alias>`: the header shows the `Id`, the `Alias`, the `Address`, and the `State` (`edited` for a local source) of the new shard
4. Confirm with the user that the shard is ready for use
5. Inform the user the shard is ready for immediate use

# Output

- Complete shard scaffold with all planned files
- Validation passing
- Shard ready for use
