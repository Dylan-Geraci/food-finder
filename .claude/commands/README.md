# commands/

Custom slash commands, invoked as `/<filename>`. Empty for now.

Each command is a Markdown file whose body is the prompt template:

```markdown
---
description: One-line summary shown in the command list
---

Prompt text sent to Claude when /command-name is run. Use $ARGUMENTS to
reference anything typed after the command name.
```

File name (minus `.md`) is the command name, e.g. `commands/seed-check.md`
becomes `/seed-check`.
