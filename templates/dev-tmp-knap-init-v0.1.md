---
description: "Shard init file structure"
---

# Filename: init-[shorthand].md

/* Shard context file. This is the entry point agents load when they need this shard's capabilities.
   Keep it focused on what agents need to know to USE the shard — deep details go in knowledge files.
   
   In shard-spec 0.2.0, discovery sections (Skills, Workflows, Templates, Knowledge tables) are 
   no longer in the init file. They are assembled dynamically by `flint shard start`.
   
   The init file provides:
   - Required reading list (YAML frontmatter)
   - Core domain concepts and models
   - Lifecycle/state diagrams (if applicable)
   - Dashboard references (if applicable)
   - Script references (if applicable)
   - Any domain-specific rules or conventions */

```markdown
---
required-reading:
  - knowledge/knw-[shorthand]-[name].md
  - (continue)
---

/* required-reading: list of paths (relative to shard root) the agent must read after loading this init.
   These typically point to knowledge files with conventions the agent needs before doing work. 
   Omit this field if the shard has no mandatory reading. */

# [Shard Name]

[1-2 sentence description of what this shard provides and its core purpose]

## [Core Concept or Model]

[Explain the fundamental concept this shard works with. Include diagrams, tables, or state machines as needed.]

/* If the shard manages artifacts with status/lifecycle: */

## Lifecycle

\`\`\`
[state] → [state] → [state]
\`\`\`

| Status | Meaning |
|--------|---------|
| `[status]` | [what this status means] |
| (continue) |

## Dashboards

/* If the shard provides dashboards */

| Dashboard | Purpose | Maintained By |
|-----------|---------|---------------|
| `(Dashboard) [Name].md` | [what it shows] | [DataviewJS|Manual|Agent] |
| (continue) |

## Scripts

/* If the shard provides scripts */

| Script | Command | Output |
|--------|---------|--------|
| [Name] | `flint shard [shorthand] [name]` | [what it outputs] |
| (continue) |
```

/* Note: Skills, Workflows, Templates, and Knowledge tables are NOT included in the init file.
   These are discovered dynamically by `flint shard start` from file description frontmatter.
   
   Each skill/workflow/knowledge/template file must have YAML frontmatter with a `description` field:
   ---
   description: "One-line description"
   ---
*/

## Design Guidelines

- Lead with the shard's core concept — what domain does it cover?
- Keep the init focused on domain knowledge that can't be derived from file scanning
- State/lifecycle diagrams are valuable — they help agents understand artifact transitions
- Link to knowledge files for deep reference: `[[knw-<sh>-<name>]]`
- Keep the init concise — discovery sections are handled by `flint shard start`
