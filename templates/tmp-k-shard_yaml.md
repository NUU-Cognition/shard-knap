# Filename: shard.yaml

/* Shard manifest file. Defines the shard's identity, dependencies, and installation behavior.
   See [[knw-k-manifest]] for the complete field reference. */

```yaml
version: "[semver version, e.g. 1.0.0]"
name: [Shard Name in Title Case]
shorthand: [2-4 character lowercase identifier]
description: [Brief description of what the shard does, one sentence]
depends:
  - f
  - [other dependency shorthands]
  - (continue)

/* Optional: files to install outside Shards/ folder.
   Supports {{uuid}} and {{date}} placeholders resolved at install time. */
install:
  - source: [filename in install/ folder]
    dest: [destination path from flint root]
    once: true /* install only if not already present (default) */
  - (continue)

/* Optional: Obsidian templates for humans (otmp- prefix) */
  - source: otmp-[shorthand]-[name].md
    dest: "Shards/(System) Obsidian Templates/otmp-[shorthand]-[name].md"
    once: true

/* Optional: folders to create in flint root */
folders:
  - [path from flint root]/
  - (continue)

/* Optional: Git repositories to clone into Shards/(System) Repos/ */
repos:
  - name: [repo-identifier]
    url: [git clone URL]
    branch: [branch name] /* optional, defaults to repo's default branch */
  - (continue)
```

## Rules

- `version`: Start at `"1.0.0"` for release, `"0.1.0"` for development
- `name`: Title Case, becomes the installed folder name
- `shorthand`: Lowercase, used in all file names (init-X.md, sk-X-name.md)
- `depends`: List shard shorthands, not names. Almost always include `f`
- `install.once`: Default behavior — skip if destination exists
- `install.force`: Use sparingly — overwrites user customizations on every sync
- `folders`: Created empty if they don't exist
- `repos`: Shallow-cloned to `Shards/(System) Repos/<name>/`, auto-gitignored
