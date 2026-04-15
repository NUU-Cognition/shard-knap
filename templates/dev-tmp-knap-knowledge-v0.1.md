---
description: "Shard knowledge file structure"
---

# Filename: knw-[shorthand]-[name].md

/* Knowledge files provide deep reference material on a specific topic.
   They complement the init file — init gives overview, knowledge gives depth.
   One topic per file. Reference-oriented, not tutorial-oriented.
   Agents load these on demand when they need detailed understanding. */

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
   - Link to related knowledge files and shard files with [[wikilinks]]
*/
```

## Design Guidelines

- Every knowledge file must have `description` in YAML frontmatter — `flint shard start` uses it for the manifest
- One topic per file — "Shard Architecture" not "Everything About Shards"
- Reference-oriented — optimize for looking things up, not reading cover-to-cover
- Include practical examples alongside specifications
- Tables are better than prose for structured data (schemas, field references)
- Link to related knowledge files for cross-referencing
- Think: "What would an agent need to look up about this topic?"
