---
id: d159c03e-a9e6-42c0-a120-e089d66a8524
tags:
  - "#f/metadata"
  - "#f/type"
---

# Shard

A cognitive program — a self-contained package that extends agent capabilities inside a Flint. Shards ship init files, skills, workflows, templates, knowledge, and install files. They define artifact types and their lifecycles.

## Properties

| Property | Value |
|----------|-------|
| Tag | N/A (meta-type) |
| Location | `Shards/(Dev Remote) [Name]/` or `Shards/(Dev Local) [Name]/` (dev), `Shards/[Name]/` (installed) |
| Archive | N/A (published to repositories) |
| Naming | Folder: `(Dev Remote) Name/` or `(Dev Local) Name/`, Files: `dev-init-sh.md`, `dev-sk-sh-*.md`, `dev-wkfl-sh-*.md`, etc. |
| Numbering | None |

## Structure

- `shard.yaml` — Manifest (required)
- `init-<sh>.md` — Interactive context (required)
- `hinit-<sh>.md` — Headless context (optional)
- `skills/`, `workflows/` (includes `hwkfl-*`), `templates/`, `knowledge/`, `assets/`, `scripts/`, `install/`, `migrations/`

## Templates

- [[tmp-knap-shard_yaml-v0.1]] — Shard manifest
- [[tmp-knap-init-v0.1]] — Init file
- [[tmp-knap-skill-v0.1]] — Skill
- [[tmp-knap-workflow-v0.1]] — Workflow
- [[tmp-knap-template-v0.1]] — Template
- [[tmp-knap-knowledge-v0.1]] — Knowledge file
