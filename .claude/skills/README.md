# skills/

Project-specific skills — packaged instructions for recurring HomePlate
workflows.

| Skill | Use for |
|---|---|
| `start-dev` | Launching the dev server and actually verifying it works (embedded DB boot + seed + API smoke test), not just that `next dev` printed "Ready." |

Each skill is a folder containing a `SKILL.md`:

```
skills/
└── my-skill/
    └── SKILL.md
```

```markdown
---
name: my-skill
description: One-line summary of what this skill does and when to use it.
---

Instructions the skill loads into the conversation when invoked.
```
