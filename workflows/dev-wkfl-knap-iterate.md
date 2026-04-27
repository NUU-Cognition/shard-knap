---
description: "Iterate on an existing shard with improvements"
---

Run `flint shard start-dev knap` if you haven't already.

# Workflow: Iterate on Shard

Add new capabilities to an existing shard — new skills, workflows, templates, knowledge files, or scripts.

# Input

- Target shard (path or name)
- What capability to add (skill, workflow, headless workflow, template, knowledge, script, type, migration)
- Description of the new capability

# Actions

## Stage 1: Context

1. Read the target shard's `shard.yaml` and init file to understand current state
2. List existing files to see what's already there (and whether the shard uses subfolder groupings under `skills/`, `workflows/`, `templates/`, or `knowledge/` — if so, place the new file under the appropriate group)
3. Determine where the new capability fits:
   - Does it complement existing skills/workflows?
   - Does it introduce a new concept that needs knowledge documentation?
   - Does it create a new artifact type that needs a template?
   - Does it need a dashboard or install file?

Present the plan to the user. Once confirmed, progress to the next stage.

## Stage 2: Create

1. Create the new file(s) using the appropriate Knap template:
   - Skill → [[tmp-knap-skill-v0.1]]
   - Workflow → [[tmp-knap-workflow-v0.1]]
   - Headless workflow → [[tmp-knap-workflow-v0.1]] (file uses `hwkfl-` prefix; context line at the top is `flint shard hstart <sh>`, not `start`)
   - Template → [[tmp-knap-template-v0.1]]
   - Knowledge → [[tmp-knap-knowledge-v0.1]]
   - Script → [[tmp-knap-script-v0.1]] as `scripts/dev-<name>.js` (auto-discovered; no manifest declaration)
   - Type → add to `shard.yaml` under `types:` AND create the source file at `install/type-<sh>-<type>.md` (no `dev-` prefix) using [[tmp-knap-type-v0.1]]. Subtypes use underscore in the filename: `install/type-<sh>-<type>_<subtype>.md`
   - Migration → create `migrations/dev-mig-<sh>-<from>-to-<to>.md` (dev-prefix applies)

2. Follow naming conventions: `dev-<type>-<sh>-<name>.md` for shard-source files, bare names for `install/` files

3. Ensure the new file(s) reference the init file and any related shard files using `[[wikilinks]]`

4. If a new template is added, ensure it includes proper frontmatter with `template` field pointing to itself

Once created, progress to the next stage.

## Stage 3: Update Shard

1. Ensure the new file has `description` YAML frontmatter — `flint shard start` discovers capabilities dynamically from this field
2. If the capability introduces new concepts, add context to the init file
3. If the new file should be required reading, add its path to the init file's `required-reading` YAML frontmatter
4. Update `README.md` if it exists
5. If `shard.yaml` needs changes (new install entries, new folders, new types, new dependencies, new setup scope, version bump), update it. Scripts, skills, workflows, templates, and knowledge are NOT declared in the manifest — they are auto-discovered.
6. Run [[sk-knap-validate]] to verify everything is consistent

Confirm with the user that the iteration is complete.

# Output

- New capability file(s) created with `description` frontmatter
- Init file's `required-reading` updated if needed
- Shard validates cleanly
