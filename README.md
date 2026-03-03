# Knap (Flintknapping)

Shard authoring toolkit for Flint. Everything you need to create, develop, validate, and publish shards that follow Flint conventions.

Named after flintknapping — the craft of shaping raw stone into tools.

## Structure

```
Shards/(Dev) Knap/
  shard.yaml                       # Manifest
  init-k.md                        # Init — shard authoring context
  skills/
    sk-k-validate.md               # Validate shard structure
  workflows/
    wkfl-k-create_shard.md         # Scaffold a new shard
    wkfl-k-iterate.md              # Add capabilities to existing shard
  templates/
    tmp-k-shard_yaml-v0.1.md       # shard.yaml manifest template
    tmp-k-init-v0.1.md             # Init file template
    tmp-k-skill-v0.1.md            # Skill file template
    tmp-k-workflow-v0.1.md         # Workflow file template
    tmp-k-template-v0.1.md         # Template file (meta-template)
    tmp-k-knowledge-v0.1.md        # Knowledge file template
    tmp-k-script-v0.1.md           # Script file template
  knowledge/
    knw-k-architecture.md          # Shard architecture reference
    knw-k-manifest.md              # shard.yaml schema reference
```

## What This Shard Covers

- **Shard structure** — File types, naming conventions, directory layout
- **Manifest schema** — Complete shard.yaml reference
- **Shard distribution** — How to publish and install shards
- **Templates for everything** — Every shard file type has a template
- **Validation** — Check shard correctness
- **Scaffolding workflow** — Create new shards from scratch
- **Iteration workflow** — Add capabilities to existing shards
