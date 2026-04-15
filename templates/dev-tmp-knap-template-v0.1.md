---
description: "Shard template file structure"
---

# Filename: tmp-[shorthand]-[name]-vX.X.md

/* This is the meta-template — a template for creating templates.
   Templates define the structure of artifacts that agents create.
   They use a special syntax with placeholders, options, and agent comments.
   See [[knw-f-templates]] for the complete syntax reference. */

```markdown
# Filename: [path/to/(Type) NNN [Name].md or other filename pattern]

/* [Explain what this template creates and any context the agent needs] */
/* [Include: flint helper type newnumber [Type] for numbered artifacts] */

\`\`\`markdown
---
id: [generate-uuid4]
tags:
  - "#[type-tag]"
  - "#[shard-shorthand]/[artifact-type]"
status: [status-option-1|status-option-2|...]
orbh-sessions: 
template: "[[tmp-[shorthand]-[name]-vX.X]]"
authors: /* from .flint/identity.json; omit if no identity set */
  - "[[@Person Name]]"
---

# [Section Name]

[instruction for what goes in this section]

- [list item or instruction]
- (continue)

# [Another Section]

[instruction for what goes in this section]

(continue)

/* Use these patterns:
   [instruction] — placeholder for generated text (remove brackets)
   [opt1|opt2|...] — enum options, pick one
   [opt1 (desc)|opt2 (desc)] — options with descriptions (desc not in output)
   [[instruction]] — generates an Obsidian wikilink
   (continue) — repeat preceding pattern if needed
   /* comment */ — agent instructions, not included in output */

\`\`\`
```

## Design Guidelines

- The template filename stem becomes the `template` field value in created artifacts
- Always include `id`, `tags`, and `template` in frontmatter
- Include `status` if the artifact has a lifecycle
- Include `[agent]-sessions` for session tracking
- Include `authors` for person attribution (reads from `.flint/identity.json`)
- Use `/* comments */` to explain non-obvious conventions to the agent
- Use `[instruction]` placeholders that describe both what and how to generate
- The `# Filename:` line shows the output path pattern
- Templates are versioned. Each change increases version. Versions start at 0.1.
