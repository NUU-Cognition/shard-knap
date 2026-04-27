---
description: "Shard template file structure"
---

# Naming and Placement

| | |
|---|---|
| Dev source path | `templates/dev-tmp-<sh>-<name>-vX.Y.md` |
| Installed path | `templates/tmp-<sh>-<name>-vX.Y.md` (the installer strips `dev-`) |
| Wikilink form | `[[tmp-<sh>-<name>-vX.Y]]` (canonical — include the version suffix) |
| `<name>` | snake_case noun phrase: `task`, `note_concept`, `init`, `shard_yaml` |
| `vX.Y` | template version, distinct from the shard's `version` |

**Versioning rules.** Every template carries a version suffix. Templates are versioned independently from the shard. Bump the version when:

- The frontmatter shape changes (fields added/removed/renamed).
- A required section is added or removed from the body.
- A field's allowed values change in a way that breaks existing artifacts.

Existing artifacts pin themselves to the template version they were authored against via `template: "[[tmp-<sh>-<name>-vX.Y]]"` in their frontmatter. So old templates may keep shipping alongside new ones; nothing forces a single live version.

This is the meta-template — a template for creating templates. Templates define the structure of artifacts that agents create. They use a special syntax with placeholders, options, and agent comments. See [[knw-f-templates]] for the complete syntax reference.

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

- The template filename stem (including `vX.Y`) becomes the `template` field value in created artifacts.
- Always include `id`, `tags`, and `template` in frontmatter.
- Include `status` if the artifact has a lifecycle.
- Include `orbh-sessions` for unified session tracking across agent runtimes.
- Include `authors` for person attribution (reads from `.flint/identity.json`).
- Use `/* comments */` to explain non-obvious conventions to the agent.
- Use `[instruction]` placeholders that describe both what and how to generate.
- The `# Filename:` line shows the output path pattern.
- Templates are versioned. Bump the version per the rules above.
