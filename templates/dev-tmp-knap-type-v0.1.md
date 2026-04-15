---
description: "Shard type definition file structure"
---

# Filename: install/type-<sh>-<type>.md  (subtypes: install/type-<sh>-<type>_<subtype>.md)

/* Type definition file. Declared in `shard.yaml` under `types:` and placed in `install/`
   with NO dev- prefix (install payloads are literal). The installer copies it to:
   
     Mesh/Metadata/Types/(Type) <Name> (<Shard> Shard).md
   
   For subtypes, use an underscore in the source filename and a ". " separator in the
   installed filename:
   
     install/type-proj-task_epic.md
     → Mesh/Metadata/Types/(Type) Task . Epic (Projects Shard).md
   
   Declaring a type does NOT create an artifact storage folder. If artifacts of this type
   need a home in the Mesh, also declare the folder under `folders:` in shard.yaml.
   
   The body of a type file is a SEMANTIC description — what the type IS, not how it is
   implemented. Operational details (tag, folder paths, naming pattern, lifecycle, which
   template produces it) belong in `shard.yaml`, template files, and knowledge files —
   not here. */

```markdown
---
id: [generate-uuid4]
tags:
  - "#f/metadata"
  - "#f/type"
---

# [Type Name]

[One paragraph defining what this type is, semantically. What concept does it capture?
 Why does it exist as its own type? What distinguishes it from adjacent types?
 An agent reading this should finish the paragraph knowing when to reach for this type
 and when to reach for something else. No tables, no structural sections — just the
 definition.]
```

## Design Guidelines

- **Semantic, not syntactic.** The type file answers "what is this thing?", not "how is it stored, named, or transitioned?" Those belong elsewhere.
- **One paragraph is the target.** If you feel the need for a second paragraph to sharpen the boundary with an adjacent type, that's fine. Beyond that, you're describing implementation — move it out.
- **Distinguish from neighbors.** The most valuable sentence is the one that separates this type from the type it could be confused with (Task vs. Increment, Notepad vs. Report, Skill vs. Workflow).
- **Subtypes are separate files.** For `(Type) Task . Epic`, write a second source file `install/type-proj-task_epic.md` with its own `id`, `# Epic` heading, and its own one-paragraph definition. Subtypes get the same treatment as parents — a semantic paragraph, nothing more.
- **Tags use `#f/metadata` and `#f/type`.** Every type file carries these two tags, regardless of which shard owns the type.
