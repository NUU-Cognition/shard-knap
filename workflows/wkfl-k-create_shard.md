This workflow belongs to the Knap shard. Ensure you have [[init-k]] in context before continuing.

# Workflow: Create Shard

Scaffold a new dev shard in the workspace.

# Input

- Shard name and purpose
- Desired shorthand (2-4 characters)
- Dependencies (other shards this shard requires)
- What artifacts, skills, workflows, and templates it will provide

# Actions

## Stage 1: Design

Confirm the shard design with the user:

1. **Validate the shorthand** — must be 2-4 lowercase characters and not conflict with existing shards (check `flint shard list`)
2. **Define the domain** — what one thing does this shard do? A shard should have single responsibility.
3. **List capabilities:**
   - What artifacts does it manage? (What `(Type)` prefix, what template)
   - What skills does it provide? (Atomic tasks)
   - What workflows does it provide? (Multi-stage tasks)
   - What knowledge does it need? (Deep reference material)
   - Does it need dashboards? (DataviewJS views)
   - Does it need scripts? (Deterministic CLI operations)
   - Does it need folders created? (Types, Archive)
4. **Identify dependencies** — which other shards must be installed first

Present the design to the user for confirmation. Once confirmed, progress to the next stage.

## Stage 2: Scaffold

Create the shard structure. Default to a dev shard at `Shards/(Dev) [Name]/`.

1. Create the directory structure:
   ```
   Shards/(Dev) [Name]/
   ├── skills/
   ├── workflows/
   ├── templates/
   ├── knowledge/
   └── install/
   ```
   Only create subdirectories that will have files.

2. Create `shard.yaml` using [[tmp-k-shard_yaml-v0.1]]
3. Create `init-<sh>.md` using [[tmp-k-init-v0.1]]
4. Create skill files using [[tmp-k-skill-v0.1]] for each planned skill
5. Create workflow files using [[tmp-k-workflow-v0.1]] for each planned workflow
6. Create template files using [[tmp-k-template-v0.1]] for each planned template
7. Create knowledge files using [[tmp-k-knowledge-v0.1]] for each planned knowledge file
8. Create script files using [[tmp-k-script-v0.1]] for each planned script
9. Create install files (dashboards, etc.) as needed
10. Create `README.md` with shard overview and structure

Once scaffold is complete, progress to the next stage.

## Stage 3: Verify

1. Run [[sk-k-validate]] on the new shard
2. Fix any issues found
3. Confirm with the user that the shard is ready for use
4. Inform the user the shard is ready for immediate use

# Output

- Complete shard scaffold with all planned files
- Validation passing
- Shard ready for use
