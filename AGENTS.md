# Global & Project Agent Rules

## Global Rules

The global rule file is located at:

~/.gemini/GEMINI.md

These rules apply to all projects by default.

---

## Project Rules

Projects may define additional or overriding rules in:

.agents/GEMINI.md

Agents working inside a project must:

- load the global rules first
- then load the project-level rules
- follow both rule sets whenever possible

If a project rule conflicts with a global rule:

- the project-level rule takes precedence
- only the conflicting rule should be overridden
- all other global rules remain active

---

## Rule Priority

Priority order:

1. Project rules (`.agents/GEMINI.md`)
2. Global rules (`~/.gemini/GEMINI.md`)

---

## Agent Behavior

Agents should:

- follow the defined architecture and folder structure
- respect project naming conventions
- apply project-specific engineering standards
- avoid violating global safety or system-level constraints
- prefer consistency with the existing codebase
