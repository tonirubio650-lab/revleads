---
name: web-design-guidelines
description: Review UI code for compliance with Web Interface Guidelines. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "check my site against best practices".
---

# Web Interface Guidelines

Audit files against the Web Interface Guidelines.

## How it works

1. Fetch the latest guidelines from:
   `https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md`
   (use WebFetch; a copy of the rules is in `rules.md` next to this file as fallback).
2. Read the files the user specifies. If none are specified, ask which files or patterns to review.
3. Check them against every rule in the guidelines.
4. Output findings in the terse `file:line` format the guidelines define.
