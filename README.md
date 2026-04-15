# Knap (Flintknapping)

Shard authoring toolkit for Flint. Everything you need to create, develop, validate, and publish shards that follow Flint conventions.

Named after flintknapping — the craft of shaping raw stone into tools.

## Structure

```
Shards/(Dev Remote) Knap/
  shard.yaml                              # Manifest
  init-knap.md                            # Init — installed copy source
  dev-init-knap.md                        # Init — dev version with required-reading
  skills/
    dev-sk-knap-validate.md               # Validate shard structure
  workflows/
    dev-wkfl-knap-create_shard.md         # Scaffold a new shard
    dev-wkfl-knap-iterate.md              # Add capabilities to existing shard
    dev-wkfl-knap-knap_shard.md           # Load and edit a shard collaboratively
    dev-wkfl-knap-upgrade_shard_spec.md   # Upgrade shard spec version
  templates/
    dev-tmp-knap-shard_yaml-v0.1.md       # shard.yaml manifest template
    dev-tmp-knap-init-v0.1.md             # Init file template
    dev-tmp-knap-skill-v0.1.md            # Skill file template
    dev-tmp-knap-workflow-v0.1.md         # Workflow file template
    dev-tmp-knap-template-v0.1.md         # Template file (meta-template)
    dev-tmp-knap-knowledge-v0.1.md        # Knowledge file template
    dev-tmp-knap-script-v0.1.md           # Script file template
  knowledge/
    dev-knw-knap-architecture.md          # Shard architecture reference
    dev-knw-knap-manifest.md              # shard.yaml schema reference
  install/
    type-knap-shard.md                    # Shard artifact type definition
```

## What This Shard Covers

- **Shard structure** — File types, naming conventions, directory layout
- **Manifest schema** — Complete shard.yaml reference
- **Shard distribution** — How to publish and install shards
- **Templates for everything** — Every shard file type has a template
- **Validation** — Check shard correctness
- **Scaffolding workflow** — Create new shards from scratch
- **Iteration workflow** — Add capabilities to existing shards
