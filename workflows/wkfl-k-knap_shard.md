This workflow belongs to the Knap shard. Ensure you have [[init-k]] in context before continuing.

# Workflow: Knap Shard

Edit and refine an existing shard by loading its full context and collaborating with the user.

# Input

- Target shard (name, shorthand, or path)
- (Optional) Specific goal or area to work on

# Actions

## Stage 1: Load

Load the entire target shard into context.

1. Read the shard's `shard.yaml` manifest
2. Read the shard's `init-<sh>.md` context file
3. List all files in the shard directory recursively
4. Read every file in the shard — skills, workflows, templates, knowledge, scripts, install files, README
5. If the shard has install files, read the installed copies in `Mesh/` as well to understand current state

Present a summary to the user:
- Shard name, version, shorthand
- File inventory (count by type)
- Dependencies
- Any issues noticed during loading (missing references, inconsistencies, etc.)

Once the user has reviewed the summary, progress to the next stage.

## Stage 2: Work

Collaborate with the user on whatever changes they need. This is an open-ended stage — follow the user's direction.

Common tasks:
- Edit existing skills, workflows, templates, or knowledge files
- Fix inconsistencies or bugs
- Refine wording, structure, or conventions
- Update the init file to reflect changes
- Add missing cross-references between files
- Align files with current Knap conventions

Rules during this stage:
- Follow all Knap naming conventions and file patterns
- When editing templates, preserve the template syntax (placeholders, comments, code fences)
- When editing skills/workflows, maintain the established structure
- Keep the init file's tables in sync with actual files
- Use [[wikilinks]] for all cross-references

Continue working with the user until they indicate they are done. Once the user confirms work is complete, progress to the next stage.

## Stage 3: Finalize

1. Update the shard's `init-<sh>.md` tables if any files were added, removed, or renamed
2. Update `shard.yaml` if version, dependencies, install entries, or folders changed
3. Update `README.md` if it exists and changes warrant it
4. Run [[sk-k-validate]] to verify shard integrity
5. Fix any validation issues
6. Confirm with the user that the shard is in good shape

# Output

- Shard files edited per user direction
- Init file and manifest in sync with actual contents
- Shard validates cleanly
