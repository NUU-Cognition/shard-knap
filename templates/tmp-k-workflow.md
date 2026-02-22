# Filename: wkfl-[shorthand]-[name].md

/* Workflows are multi-stage tasks with human checkpoints between stages.
   Use a workflow (not a skill) when the task needs human review, approval, or iterative refinement.
   Each stage should have a clear completion condition.
   The canonical transition phrase is: "Once [condition], progress to the next stage." */

```markdown
This workflow belongs to the [Shard Name] shard. Ensure you have [[init-[shorthand]]] in context before continuing.

# Workflow: [Workflow Name]

[Brief description of what this workflow accomplishes — one sentence]

# Input

- [Required input 1]
- [Required input 2]
- (Optional) [Optional input]
- (continue)

# Actions

## Stage 1: [Stage Name]

- [Action or instruction]
- [Action or instruction]
- Once [completion condition], progress to the next stage

## Stage 2: [Stage Name]

- [Action or instruction]
- [Human checkpoint: describe what the user reviews or approves]
- Once you receive confirmation from the user, progress to the next stage

## Stage 3: [Final Stage Name]

- [Final actions]
- [Update any state/status]
- (continue)

/* Add more stages as needed. Each stage should have:
   1. Clear actions
   2. A completion condition
   3. At least one stage with a human checkpoint */

# Output

- [What the workflow produces]
- [Final state of artifacts]
```

## Design Guidelines

- Name stages descriptively: "Design", "Create", "Review", "Finalize"
- Every workflow needs at least one human checkpoint
- Use "Once [condition], progress to the next stage" consistently
- Reference skills for sub-tasks: `[[sk-[shorthand]-[name]]]`
- Reference templates for artifact creation: `[[tmp-[shorthand]-[name]]]`
- State transitions (status changes) happen at stage boundaries
- Stages can invoke skills for atomic sub-tasks
