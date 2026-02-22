# Filename: init-[shorthand].md

/* Shard context file. This is the entry point agents load when they need this shard's capabilities.
   Keep it focused on what agents need to know to USE the shard — deep details go in knowledge files.
   Use tables for quick reference of available skills/workflows/templates.
   Include state/lifecycle diagrams if the shard manages artifacts with status transitions. */

```markdown
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

## Skills

| Skill | File | Purpose |
|-------|------|---------|
| [Skill Name] | `sk-[shorthand]-[name].md` | [what it does] |
| (continue) |

## Workflows

| Workflow | File | Purpose |
|----------|------|---------|
| [Workflow Name] | `wkfl-[shorthand]-[name].md` | [what it does] |
| (continue) |

## Templates

| Template | File | Purpose |
|----------|------|---------|
| [Template Name] | `tmp-[shorthand]-[name].md` | [what artifact it creates] |
| (continue) |

## Knowledge

/* If the shard provides knowledge files */

| Knowledge | File | Topic |
|-----------|------|-------|
| [Topic] | `knw-[shorthand]-[name].md` | [what it covers] |
| (continue) |

## Scripts

/* If the shard provides scripts */

| Script | Command | Output |
|--------|---------|--------|
| [Name] | `flint shard [shorthand] [name]` | [what it outputs] |
| (continue) |
```

## Design Guidelines

- Lead with the shard's core concept — what domain does it cover?
- Tables are more useful than prose for listing capabilities
- Include state/lifecycle diagrams for shards that manage artifact status
- Link to knowledge files for deep reference: `[[knw-<sh>-<name>]]`
- Keep the init concise — it should fit in an agent's context without being overwhelming
