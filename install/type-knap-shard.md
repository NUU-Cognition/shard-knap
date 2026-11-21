---
id: d159c03e-a9e6-42c0-a120-e089d66a8524
tags:
  - "#f/metadata"
  - "#f/type"
---

# Shard

A cognitive program — a self-contained package that extends agent capabilities inside a Flint. A shard has a source (the files a person edits) and a build (the shard that agents load). Shards ship init files, skills, workflows, templates, knowledge, and install files. They define artifact types and their lifecycles.

## Properties

| Property | Value |
|----------|-------|
| Tag | N/A (meta-type) |
| Location | `Shards/(Source Remote) [Name]/` or `Shards/(Source Local) [Name]/` (the source), `Shards/[Name]/` (the shard) |
| Naming | Source folder: `(Source Remote) Name/` or `(Source Local) Name/`, source files: `dev-init-sh.md`, `dev-sk-sh-*.md`, `dev-wkfl-sh-*.md`, etc. The package: `@org/shard/<name>` |
| Numbering | None |

## Structure

- `shard.yaml` — Manifest (required)
- `init-<sh>.md` — Context (required), in both modes; a `# Headless` section when the shard runs in headless Orbh sessions
- `skills/`, `workflows/` (one file for both modes, with `> [!headless]` callouts), `templates/`, `knowledge/`, `assets/`, `scripts/`, `install/`, `migrations/`
- An `hinit-<sh>.md` or `hwkfl-*` file is removed: the CLI does not read it. Merge it with `wkfl-knap-migrate_headless_to_modes`

## Templates

- [[tmp-knap-shard_yaml-v0.1]] — Shard manifest
- [[tmp-knap-init-v0.1]] — Init file
- [[tmp-knap-skill-v0.1]] — Skill
- [[tmp-knap-workflow-v0.1]] — Workflow
- [[tmp-knap-template-v0.1]] — Template
- [[tmp-knap-knowledge-v0.1]] — Knowledge file
