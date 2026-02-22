# Filename: sk-[shorthand]-[name].md

/* Skills are atomic, single-purpose tasks. They run to completion without human checkpoints.
   If the task needs human review or approval, use a workflow instead.
   The name should be a verb or verb phrase: create_note, validate, sync, archive_tasks. */

```markdown
This skill belongs to the [Shard Name] shard. Ensure you have [[init-[shorthand]]] in context before continuing.

# Skill: [Skill Name]

[Brief description of what this skill does — one sentence]

# Input

- [Required input 1]
- [Required input 2]
- (Optional) [Optional input]
- (continue)

# Actions

1. [First action — be specific and concrete]
2. [Second action]
3. (continue)

/* Use sub-steps for complex actions:
   1. **Step name.**
      - Sub-action
      - Sub-action
*/

/* Reference templates: [[tmp-[shorthand]-[name]]]
   Reference other skills: [[sk-[shorthand]-[name]]]
   Reference knowledge: [[knw-[shorthand]-[name]]] */

# Output

- [What the skill produces]
- [Any side effects or state changes]
```

## Design Guidelines

- One clear purpose per skill — don't combine multiple tasks
- Clear input/output contract — what goes in, what comes out
- Steps should be concrete and sequential
- Always start with a reference to the shard's init file
- Use `**Bold step name.**` followed by details for complex steps
- Reference related shard files using `[[wikilinks]]`
