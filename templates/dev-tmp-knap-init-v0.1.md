---
description: "Shard init file structure"
---

# Naming and Placement

| | |
|---|---|
| Dev source path | `dev-init-<sh>.md` (at the shard root) |
| Installed path | `init-<sh>.md` (the installer strips `dev-`) |
| Wikilink form | dev source: `[[dev-init-<sh>]]` → installer strips to `[[init-<sh>]]` (see [[dev-knw-knap-architecture]] § Cross-Reference Links) |
| Modes | One init for both modes. A headless session loads it with `flint shard start <sh>` and reads its `# Headless` section. A separate `dev-hinit-<sh>.md` is removed: the CLI does not read it. Merge it into the `# Headless` section ([[dev-wkfl-knap-migrate_headless_to_modes]]) |

**Every shard MUST have an init file.** This is the entry point agents load when they need the shard's capabilities. `flint shard start <name>` returns the init body plus a dynamically-assembled manifest of skills, workflows, templates, and knowledge files.

**Keep it focused** on what agents need to know to USE the shard. Deep details go in knowledge files referenced via `required-reading:`.

In shard-spec 0.2.0, the init file does **not** contain discovery sections (Skills, Workflows, Templates, Knowledge tables). Those are assembled by `flint shard start` from each file's `description:` frontmatter.

The init file provides:
- Required-reading list (YAML frontmatter, Obsidian wikilinks).
- Core domain concepts and models.
- Lifecycle / state diagrams (if applicable).
- Script and CLI references (if applicable). A shard installs no dashboard, so the init names none.
- Any domain-specific rules or conventions.
- A `# Headless` section (only when the shard runs in headless Orbh sessions): the interface keys, the phase values, and the result delivery.

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

## Scripts

/* If the shard provides scripts */

| Script | Command | Output |
|--------|---------|--------|
| [Name] | `flint shard [shorthand] [name]` | [what it outputs] |
| (continue) |

/* Only when the shard runs in headless Orbh sessions. One init serves both modes:
   a headless session loads this init with `flint shard start [shorthand]` and reads
   this section. The workflows carry their differences in `> [!headless]` callouts
   inside their stages, so this section has no table of headless workflows. */

# Headless

[1-2 sentences: a headless or subagent Orbh session has no person at the terminal. It loads this init with `flint shard start [shorthand]`. Name what does not change (the lifecycle, the templates), and say: follow the `> [!headless]` callouts of each workflow.]

/* Optional: what replaces each person gate. */
## Interaction Model

| Interactive | Headless |
|-------------|----------|
| [What the workflow does with a person, for example "Present the findings to the person"] | [What a headless session does in its place, for example "Set the interface keys"] |
| (continue) |

## Orbh Interface Keys

Report progress with `flint orbh session set <key> <value>`. [Say who reads the keys.]

| Key | Type | Description | When to update |
|-----|------|-------------|----------------|
| `phase` | string | The current phase of the work | At each change of phase |
| `[key]` | [type] | [description] | [when] |
| (continue) |

### Phase Values

**[Workflow name]:**

| Phase | Meaning |
|-------|---------|
| `[phase]` | [what the session does in this phase] |
| (continue) |

/* Optional: the format of the `progress` key. */
### Progress Format

[Example values of `progress`, for example "3/5 requirements"]

/* Optional: when the shard makes Mesh artifacts. */
## Artifact Tracking

When you create or change a Mesh artifact, track it: `flint orbh artifact "[path of the artifact]"`.

## Result Delivery

Each headless workflow ends with `flint orbh session return --finish "<result>"`. [Say what the result contains, with one example.] A subagent puts a blocker and its question in the result.
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
- Add the `# Headless` section only when the shard runs in headless Orbh sessions. It needs `## Orbh Interface Keys` (with `### Phase Values`) and `## Result Delivery` (with `flint orbh session return --finish`). See [[dev-knw-knap-architecture]] § Modes: One Workflow for Each Mode
