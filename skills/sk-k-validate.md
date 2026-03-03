This skill belongs to the Knap shard. Ensure you have [[init-k]] in context before continuing.

# Skill: Validate Shard

Validate that a shard follows Flint conventions and is structurally complete.

# Input

- Path to the shard directory (e.g., `Shards/(Dev) My Shard/` or `Shards/Projects/`)

# Actions

1. **Check shard.yaml.** Verify the manifest exists and contains all required fields:
   - [ ] `version` — valid semver string
   - [ ] `name` — non-empty, Title Case
   - [ ] `shorthand` — 2-4 lowercase characters
   - [ ] `description` — non-empty string
   - [ ] `depends` — if present, all entries are valid shorthands

2. **Check init file.** Verify `init-<shorthand>.md` exists and contains:
   - [ ] Shard name as heading
   - [ ] Description of the shard's purpose
   - [ ] Tables listing available skills, workflows, templates, knowledge
   - [ ] All listed files actually exist

3. **Check file naming.** Verify all files follow naming conventions:
   - [ ] Skills: `sk-<sh>-<name>.md`
   - [ ] Workflows: `wkfl-<sh>-<name>.md`
   - [ ] Templates: `tmp-<sh>-<name>-v<X.X>.md`
   - [ ] Knowledge: `knw-<sh>-<name>.md`
   - [ ] Assets: `ast-<sh>-<name>.<ext>`
   - [ ] Shorthand matches `shard.yaml`

4. **Check skill structure.** For each skill file, verify:
   - [ ] Starts with init reference: "Ensure you have [[init-<sh>]] in context"
   - [ ] Has `# Skill: [Name]` heading
   - [ ] Has `# Input` section
   - [ ] Has `# Actions` section
   - [ ] Has `# Output` section

5. **Check workflow structure.** For each workflow file, verify:
   - [ ] Starts with init reference
   - [ ] Has `# Workflow: [Name]` heading
   - [ ] Has staged actions (`## Stage N:`)
   - [ ] Has at least one human checkpoint
   - [ ] Has `# Output` section

6. **Check template structure.** For each template file, verify:
   - [ ] Has `# Filename:` pattern
   - [ ] Has code-fenced template body
   - [ ] Frontmatter includes `id`, `tags`, `template` fields
   - [ ] Uses valid template syntax (`[instruction]`, `(continue)`, `/* */`)

7. **Check install files.** If `shard.yaml` has `install` entries:
   - [ ] Each `source` file exists in `install/` folder
   - [ ] Each `dest` path is a valid relative path

8. **Check cross-references.** Verify all internal `[[references]]` point to files that exist within the shard.

9. **Report.** Output a validation summary:
   - Pass/fail for each check
   - List of issues found
   - Suggestions for fixes

# Output

- Validation report with pass/fail status
- List of issues and suggested fixes
