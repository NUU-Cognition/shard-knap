# Knowledge: Shard Architecture

Complete reference for shard structure, file types, design principles, and how shards fit into the Flint ecosystem.

## Core Concepts

### Shards Are Self-Contained

A shard is a single coherent unit of capability. It owns everything it needs — context, skills, workflows, templates, knowledge, scripts, and install files. No shard should require reading another shard's internal files (though it can depend on another shard being installed).

### Shards Are On-Demand

Agents load shard context only when needed. The init file is the entry point — it provides enough context to use the shard without loading every file. Skills, workflows, templates, and knowledge are loaded individually as needed.

### Shards Are Namespaced

Every shard file uses the shorthand as a namespace prefix: `sk-proj-`, `tmp-inc-`, `knw-f-`. This prevents naming collisions between shards and makes it clear which shard owns a file.

## File Types in Detail

### Init File (`init-<sh>.md`)

The init file is the shard's context — what agents load to understand and use the shard.

**Purpose:**
- Explain the shard's domain and core concepts
- List all available skills, workflows, templates, knowledge
- Document any lifecycle or state management
- Provide enough context to use the shard without reading other files

**Design principles:**
- Use tables for quick reference (skills, workflows, templates)
- Include state diagrams for lifecycle management
- Keep it concise — deep details go in knowledge files
- Write for agents, not humans — focus on what's actionable

### Skills (`sk-<sh>-<name>.md`)

Skills are atomic, single-purpose tasks that run to completion without human checkpoints.

**Structure:**
```markdown
This skill belongs to the [Shard Name] shard. Ensure you have [[init-<sh>]] in context before continuing.

# Skill: [Name]

[Brief description]

# Input

- [Required inputs]

# Actions

1. [Sequential steps]

# Output

- [What it produces]
```

**Design principles:**
- One clear purpose — if it needs human review, use a workflow
- Clear input/output contract
- Steps should be concrete and sequential
- Reference templates with `[[tmp-<sh>-<name>]]`
- Always start with a reference to the init file

### Workflows (`wkfl-<sh>-<name>.md`)

Workflows are multi-stage tasks with human checkpoints between stages.

**Structure:**
```markdown
This workflow belongs to the [Shard Name] shard. Ensure you have [[init-<sh>]] in context before continuing.

# Workflow: [Name]

[Brief description]

# Input

- [Required inputs]

# Actions

## Stage 1: [Name]

- [Actions]
- Once [condition], progress to the next stage

## Stage 2: [Name]

- [Actions]
- [Human checkpoint]
- Once confirmed, progress to the next stage

# Output

- [What it produces]
```

**Design principles:**
- Clear stages with explicit completion conditions
- Human checkpoints between stages (review, approval, feedback)
- State transitions happen at stage boundaries
- "Once X, progress to the next stage" is the canonical transition phrase

### Templates (`tmp-<sh>-<name>.md`)

Templates define the structure for artifacts the shard creates.

**Structure:**
```markdown
# Filename: [path pattern]

/* Agent comments explaining context */

\`\`\`markdown
---
[frontmatter with placeholders]
---

[Body with placeholders, hyperlinks, continue markers]
\`\`\`

/* Additional agent instructions */
```

**Template syntax:**

| Pattern | Meaning | Generated As |
|---------|---------|--------------|
| `[instruction]` | Generate text per instruction | Plain text (no brackets) |
| `[opt1\|opt2]` | Pick one option | Selected option |
| `[opt1 (desc)\|opt2 (desc)]` | Options with descriptions | Selected option only |
| `[[instruction]]` | Generate Obsidian wikilink | `[[Document Title]]` |
| `(continue)` | Repeat pattern if needed | More items or stop |
| `/* comment */` | Agent-only instruction | Not in output |

**Design principles:**
- The template filename stem becomes the `template` field in created artifacts
- Include `[agent]-sessions` for session tracking
- Use comments to explain non-obvious conventions
- Frontmatter should include all standard fields (id, tags, status, template)

### Knowledge Files (`knw-<sh>-<name>.md`)

Knowledge files provide deep reference material that agents load when they need detailed understanding of a topic.

**Structure:**
```markdown
# Knowledge: [Topic]

[Topic overview]

## [Section]

[Detailed reference content]

## [Section]

[More content with tables, examples, code blocks]
```

**Design principles:**
- One topic per file — keep them focused
- Reference-oriented, not tutorial-oriented
- Include tables, examples, and diagrams
- Loaded on demand from the init file
- Complements the init file — init gives overview, knowledge gives depth

### Scripts (`<name>.js`)

Scripts provide deterministic operations that agents invoke via CLI.

**Design principles:**
- Node.js only (cross-platform)
- Minimal, machine-readable output
- Use `process.env.FLINT_ROOT || process.cwd()` for flint root
- No external dependencies (Node.js built-ins only)
- Non-zero exit codes for errors

**Invocation:**
```bash
flint shard <shorthand> <script-name> [args...]
```

### Assets (`ast-<sh>-<name>.<ext>`)

Non-markdown files that support the shard — images, SVGs, data files, configs.

### Install Files (`install/`)

Files that get placed into the Flint workspace (outside `Shards/`) during installation:
- Dashboards: `(Dashboard) Name.md` → `Mesh/(Dashboard) Name.md`
- System files: `(System) Name.md` → `Mesh/(System) Name.md`
- Obsidian templates: `otmp-<sh>-<name>.md` → `Shards/(System) Obsidian Templates/`

Install files support `{{uuid}}` and `{{date}}` placeholders resolved at install time.

Declared in `shard.yaml` under `install:`.

## Design Principles

### Single Responsibility
Each shard handles one domain. Task management (proj), version tracking (inc), brainstorming (ntpd) — never multiple domains in one shard.

### Dependency Declaration
If a shard needs another shard's artifacts or conventions, declare it in `depends`. Common dependencies:
- `f` (Flint/Core) — almost always required
- `ld` (Living Documents) — if the shard creates long-lived artifacts
- `proj` (Projects) — if the shard interacts with tasks

### Progressive Disclosure
Init files give the overview. Skills/workflows give the instructions. Knowledge files give the depth. Templates give the structure. Agents load what they need, when they need it.

### Convention Over Configuration
Follow naming conventions strictly. The conventions enable tooling, discovery, and interoperability:
- Shorthand in every filename
- Consistent prefix patterns (sk-, wkfl-, tmp-, knw-, ast-)
- Standard frontmatter fields
- Canonical state transitions

## Shard Sizing Guide

| Size | Init | Skills | Workflows | Templates | Knowledge | Examples |
|------|------|--------|-----------|-----------|-----------|----------|
| Minimal | Yes | 0-1 | 0 | 0-1 | 0 | Living Documents |
| Standard | Yes | 2-4 | 1-2 | 1-3 | 0-2 | Notepad, Projects |
| Comprehensive | Yes | 4-8 | 2-4 | 3-6 | 2-4 | Increments, OrbCode |

Start minimal. Add capabilities as genuine needs emerge. A shard with one excellent skill is better than a shard with five mediocre ones.
