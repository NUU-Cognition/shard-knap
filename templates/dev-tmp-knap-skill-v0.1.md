---
description: "Shard skill file structure"
---

# Naming and Placement

| | |
|---|---|
| Dev source path | `skills/dev-sk-<sh>-<name>.md` |
| Installed path | `skills/sk-<sh>-<name>.md` (the installer strips `dev-`) |
| Wikilink form | `[[sk-<sh>-<name>]]` (canonical — no `dev-` prefix in the link) |
| `<name>` | snake_case verb or verb-phrase: `create_note`, `validate`, `sync`, `archive_tasks` |

Skills are atomic, single-purpose tasks that run to completion without human checkpoints. If the task needs human review or approval, author it as a workflow instead. Subfolder groupings under `skills/` are allowed; the filename convention does not change.

# Body Template

```markdown
---
description: "[One-line description of what this skill does]"
---

Run `flint shard start [shorthand]` if you haven't already.

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

/* Cross-references inside a shard MUST be Obsidian-style wikilinks. Use the
   canonical form (no `dev-` prefix in the link itself) — the runtime resolves
   to either the dev source or the installed copy.
     Templates:  [[tmp-<sh>-<name>-vX.Y]]   (templates carry a version suffix)
     Skills:     [[sk-<sh>-<name>]]
     Knowledge:  [[knw-<sh>-<name>]]
     Workflows:  [[wkfl-<sh>-<name>]]  /  [[hwkfl-<sh>-<name>]] (headless) */

# Output

- [What the skill produces]
- [Any side effects or state changes]
```

## Design Guidelines

- One clear purpose per skill — don't combine multiple tasks.
- Clear input/output contract — what goes in, what comes out.
- Steps should be concrete and sequential.
- The `description:` frontmatter line is **required** — `flint shard start` reads it for the dynamic manifest. One line; no trailing period.
- Always include the `flint shard start <sh>` reminder line as the first body line, before the `#` heading.
- Use `**Bold step name.**` followed by details for complex steps.
- Reference related shard files using `[[wikilinks]]` in canonical form.
