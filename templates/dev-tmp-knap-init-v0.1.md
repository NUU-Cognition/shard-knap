---
description: "Shard init file structure"
---

# Naming and Placement

| | |
|---|---|
| Dev source path | `dev-init-<sh>.md` (at the shard root) |
| Installed path | `init-<sh>.md` (the installer strips `dev-`) |
| Wikilink form | dev source: `[[dev-init-<sh>]]` → installer strips to `[[init-<sh>]]` (see [[dev-knw-knap-architecture]] § Cross-Reference Links) |
| Headless variant | `dev-hinit-<sh>.md` → `hinit-<sh>.md`, loaded by `flint shard hstart` when present |

**Every shard MUST have an init file.** This is the entry point agents load when they need the shard's capabilities. `flint shard start <name>` returns the init body plus a dynamically-assembled manifest of skills, workflows, templates, and knowledge files.

**Keep it focused** on what agents need to know to USE the shard. Deep details go in knowledge files referenced via `required-reading:`.

In shard-spec 0.2.0, the init file does **not** contain discovery sections (Skills, Workflows, Templates, Knowledge tables). Those are assembled by `flint shard start` from each file's `description:` frontmatter.

The init file provides:
- Required-reading list (YAML frontmatter, Obsidian wikilinks).
- Core domain concepts and models.
- Lifecycle / state diagrams (if applicable).
- Dashboard, script, and CLI references (if applicable).
- Any domain-specific rules or conventions.

```markdown
---
required-reading:
  - "[[dev-knw-[shorthand]-[name]]]"
  - (continue)
---

/* required-reading: list of Obsidian-style wikilinks pointing at files the agent
   must read after loading this init. In a DEV source write them with the dev-
   prefix — "[[dev-knw-<sh>-<name>]]" — so the link resolves to the real dev file
   in Obsidian; the installer strips it to "[[knw-<sh>-<name>]]" on install. Use
   wikilinks anywhere a shard file references another shard file — never raw paths.
   Omit this field if the shard has no mandatory reading. See knw-knap-architecture
   § Cross-Reference Links. Legacy relative-path form is still parsed but should
   not be used. */

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
