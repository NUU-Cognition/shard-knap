---
description: "Validate shard structure and manifest integrity"
---

Run `flint shard start-dev knap` if you haven't already.

# Skill: Validate Shard

Validate that a shard follows Flint conventions and is structurally complete.

# Input

- Path to the shard directory (e.g., `Shards/(Dev Remote) My Shard/`, `Shards/(Dev Local) My Shard/`, or `Shards/Projects/`)

# Actions

1. **Check shard.yaml.** Verify the manifest exists and contains all required fields:
   - [ ] `shard-spec` — non-empty string (warning if not `"0.2.0"`)
   - [ ] `version` — valid semver string (`major.minor.patch`)
   - [ ] `name` — non-empty, Title Case (warning otherwise)
   - [ ] `shorthand` — 2-4 lowercase alphabetic characters
   - [ ] `description` — non-empty single-line string
   - [ ] `dependencies` — if present, each entry has `source` in `owner/repo` format
   - [ ] `setup` — if present, value is `full`, `flint`, or `local`
   - [ ] `types` — if present, each entry is `Type` or `Type.Subtype` Title Case (multi-word names allowed)
   - [ ] `folders` — if present, each entry is a relative path from flint root
   - [ ] `install` — each entry has `source` and `dest`; `mode` is `once` or `force` (or legacy boolean flags)
   - [ ] No deprecated fields: `state`, `scripts`, `requires.cli`, `requires.workspace`, `repos`, legacy `depends` (warn on each)

2. **Check init file.** Verify `init-<shorthand>.md` (or `dev-init-<shorthand>.md` for dev shards) exists and contains:
   - [ ] Shard name as heading
   - [ ] Description of the shard's purpose
   - [ ] `required-reading` YAML frontmatter listing knowledge files the agent must read (if the shard has knowledge files)
   - [ ] No hardcoded Skills/Workflows/Templates/Knowledge tables (discovered dynamically by `flint shard start`)

3. **Check headless init (optional).** If `hinit-<shorthand>.md` (or `dev-hinit-<shorthand>.md`) exists:
   - [ ] Has a heading
   - [ ] Has `required-reading` frontmatter if it references knowledge files
   - [ ] Focuses on headless session differences (Orbh session keys, no stage gates)

4. **Check setup file.** If `shard.yaml` declares `setup`:
   - [ ] `setup-<shorthand>.md` (or `dev-setup-<shorthand>.md`) exists at the shard root
   - [ ] File has `# Setup` heading, `# Actions`, and `# Verification` sections
   - [ ] If `setup` is declared but setup file is missing — **error**, not warning
   - [ ] If setup file exists but `setup` is not declared in manifest — warning

5. **Check file naming and dev-prefix rules.** Verify all files follow naming conventions. In dev shards, `dev-` prefix rules apply per location — see [[dev-knw-knap-architecture#Dev Prefix Rules]]. Files may live in arbitrary subfolder groupings (e.g. `templates/containers/dev-tmp-<sh>-<name>.md`); subfolders are cosmetic and the filename convention still applies:
   - [ ] Skills: `dev-sk-<sh>-<name>.md` / installed `sk-<sh>-<name>.md`
   - [ ] Workflows: `dev-wkfl-<sh>-<name>.md` (and `dev-hwkfl-` for headless)
   - [ ] Templates: `dev-tmp-<sh>-<name>-v<X.X>.md`
   - [ ] Knowledge: `dev-knw-<sh>-<name>.md`
   - [ ] Assets: `dev-ast-<sh>-<name>.<ext>`
   - [ ] Scripts: `dev-<name>.js`
   - [ ] Migrations: `dev-mig-<sh>-<from>-to-<to>.md` (dev-prefix applies — migrations ship with installed shards)
   - [ ] Obsidian templates (in `install/`): `otmp-<sh>-<name>.md` — **no dev prefix**
   - [ ] Type definitions (in `install/`): `type-<sh>-<type>[_<subtype>].md` — **no dev prefix**
   - [ ] Dashboards / system files (in `install/`): bare names like `(Dashboard) X.md` — **no dev prefix**
   - [ ] Shorthand matches `shard.yaml`
   - [ ] **Error** on any `install/dev-*` file — install payloads never have dev prefix

6. **Check description frontmatter.** For every skill, workflow, headless workflow, template, and knowledge file:
   - [ ] Has YAML frontmatter with a `description` field
   - [ ] Description is a non-empty single-line string

7. **Check skill structure.** For each skill file, verify:
   - [ ] Has `description` in YAML frontmatter
   - [ ] Starts with `Run \`flint shard start <shorthand>\` if you haven't already.` (or `start-dev` for dev shards)
   - [ ] Has `# Skill: [Name]` heading
   - [ ] Has `# Input`, `# Actions`, `# Output` sections

8. **Check workflow structure.** For each workflow (and headless workflow) file, verify:
   - [ ] Has `description` in YAML frontmatter
   - [ ] Starts with the correct shard context line — `wkfl-*` uses `flint shard start <sh>`; `hwkfl-*` uses `flint shard hstart <sh>` (or `start-dev` / `hstart-dev` in dev shards)
   - [ ] Has `# Workflow: [Name]` heading
   - [ ] Has staged actions (`## Stage N:`)
   - [ ] Interactive workflows have at least one human checkpoint; headless workflows report via Orbh keys
   - [ ] Has `# Output` section

9. **Check template structure.** For each template file, verify:
   - [ ] Has `description` in YAML frontmatter
   - [ ] Has `# Filename:` pattern
   - [ ] Has code-fenced template body
   - [ ] Template body frontmatter includes `id`, `tags`, `template` fields
   - [ ] Uses valid template syntax (`[instruction]`, `(continue)`, `/* */`)

10. **Check types and folders.**
    - [ ] Each `types[]` entry has a corresponding `install/type-<sh>-<snake_name>.md` source file
    - [ ] `types:` no longer implies artifact folder creation — folders must be declared explicitly in `folders:` if needed
    - [ ] `folders[]` entries are relative to flint root, not absolute
    - [ ] Destination for type files is `Mesh/Metadata/Types/(Type) <Name> [. <Subname>] (<Shard Display Name> Shard).md`
    - See [[dev-knw-f-types]] for the complete convention

11. **Check scripts.**
    - [ ] Every `.js` file in `scripts/` follows the naming convention (`dev-<name>.js` in dev shards, `<name>.js` in installed)
    - [ ] No `scripts:` field in `shard.yaml` (deprecated — scripts are auto-discovered from the folder)

12. **Check install files.** For each `shard.yaml` install entry:
    - [ ] `source` file exists in `install/` folder
    - [ ] `source` does NOT start with `dev-` (error)
    - [ ] `dest` path is relative to flint root
    - [ ] `mode` is `once` or `force` (or legacy `once: true` / `force: true`)

13. **Check migrations.** If `migrations/` exists:
    - [ ] All files start with `dev-` prefix in dev shards (error if not)
    - [ ] Files follow the `dev-mig-<sh>-<from>-to-<to>[-s<n>].md` ID format
    - [ ] An empty `migrations/` folder is valid

14. **Check cross-references.** Verify all internal `[[wikilinks]]` point to files that exist within the shard or are known knowledge files.

15. **Report.** Output a validation summary:
    - Pass/fail for each check
    - Warnings vs errors (warnings for spec version, Title Case, shorthand pattern, deprecated fields; errors for missing required fields, traversal, format, dev-prefix violations)
    - List of issues found
    - Suggestions for fixes

# Output

- Validation report with pass/fail status
- List of issues and suggested fixes
