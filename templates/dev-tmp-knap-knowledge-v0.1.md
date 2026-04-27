---
description: "Shard knowledge file structure"
---

# Naming and Placement

| | |
|---|---|
| Dev source path | `knowledge/dev-knw-<sh>-<name>.md` |
| Installed path | `knowledge/knw-<sh>-<name>.md` (the installer strips `dev-`) |
| Wikilink form | `[[knw-<sh>-<name>]]` (canonical — no `dev-` prefix in the link) |
| `<name>` | snake_case noun phrase: `architecture`, `manifest`, `templates`, `migrations` |

Knowledge files provide deep reference material on a single topic. They complement the init file — init gives overview, knowledge gives depth. Reference-oriented, not tutorial-oriented. Agents load these on demand when they need detailed understanding, or eagerly via the init's `required-reading:` list. Subfolder groupings under `knowledge/` are allowed for large shards (group by domain); the filename convention does not change.

```markdown
---
description: "[One-line description of what this knowledge file covers]"
---

# Knowledge: [Topic Name]

[1-2 sentence overview of what this knowledge file covers and why it matters]

## [First Major Section]

[Detailed reference content — tables, examples, code blocks, diagrams]

## [Second Major Section]

[More reference content]

(continue)

/* Structure tips:
   - Use tables for specifications, field references, or comparisons
   - Use code blocks for examples and patterns
   - Use diagrams (ASCII or text-based) for architecture and flows
   - Include "Common Patterns" or "Examples" sections for practical reference
   - Keep sections self-contained — agents may read individual sections
   - Link to related knowledge files and shard files with [[wikilinks]] in
     canonical form (no `dev-` prefix in the link)
*/
```

## Design Guidelines

- The `description:` frontmatter line is **required** and **single-line** — `flint shard start` reads it for the dynamic manifest.
- One topic per file — "Shard Architecture" not "Everything About Shards".
- Reference-oriented — optimize for looking things up, not reading cover-to-cover.
- Include practical examples alongside specifications.
- Tables are better than prose for structured data (schemas, field references).
- Link to related knowledge files for cross-referencing using canonical-form wikilinks: `[[knw-<sh>-<name>]]`.
- Think: "What would an agent need to look up about this topic?"
