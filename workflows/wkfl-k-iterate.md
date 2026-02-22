This workflow belongs to the Knap shard. Ensure you have [[init-k]] in context before continuing.

# Workflow: Iterate on Shard

Add new capabilities to an existing shard — new skills, workflows, templates, knowledge files, or scripts.

# Input

- Target shard (path or name)
- What capability to add (skill, workflow, template, knowledge, script)
- Description of the new capability

# Actions

## Stage 1: Context

1. Read the target shard's `shard.yaml` and init file to understand current state
2. List existing files to see what's already there
3. Determine where the new capability fits:
   - Does it complement existing skills/workflows?
   - Does it introduce a new concept that needs knowledge documentation?
   - Does it create a new artifact type that needs a template?
   - Does it need a dashboard or install file?

Present the plan to the user. Once confirmed, progress to the next stage.

## Stage 2: Create

1. Create the new file(s) using the appropriate Knap template:
   - Skill → [[tmp-k-skill]]
   - Workflow → [[tmp-k-workflow]]
   - Template → [[tmp-k-template]]
   - Knowledge → [[tmp-k-knowledge]]
   - Script → [[tmp-k-script]]

2. Follow naming conventions: `<type>-<sh>-<name>.md`

3. Ensure the new file(s) reference the init file and any related shard files using `[[wikilinks]]`

4. If a new template is added, ensure it includes proper frontmatter with `template` field pointing to itself

Once created, progress to the next stage.

## Stage 3: Update Init

1. Update the shard's `init-<sh>.md` to include the new capability in the appropriate table (Skills, Workflows, Templates, Knowledge)
2. If the capability introduces new concepts, add context to the init file
3. Update `README.md` if it exists
4. If `shard.yaml` needs changes (new install files, new folders, version bump), update it
5. Run [[sk-k-validate]] to verify everything is consistent

Confirm with the user that the iteration is complete.

# Output

- New capability file(s) created
- Init file updated with new entries
- Shard validates cleanly
