# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific
- Installed Skills and MCP servers

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Installed Skills (as of April 2026)

### Official Anthropic Skills
- **docx** - Create, edit, and analyze Word documents
- **pdf** - Comprehensive PDF manipulation
- **pptx** - PowerPoint presentation creation/editing
- **xlsx** - Excel spreadsheet work
- **algorithmic-art** - Generative art with p5.js
- **canvas-design** - Visual art design in png/pdf
- **slack-gif-creator** - Animated GIFs for Slack
- **frontend-design** - Avoid AI slop, bold design decisions
- **web-artifacts-builder** - Complex HTML artifacts with React/Tailwind
- **mcp-builder** - Create MCP servers
- **webapp-testing** - Playwright testing
- **skill-creator** - Interactive skill creation tool
- **brand-guidelines** - Anthropic brand colors/typography

### Superpowers Skills (obra)
- **brainstorming** - Creative brainstorming sessions
- **dispatching-parallel-agents** - Multi-agent orchestration
- **executing-plans** - Execute planned work
- **finishing-a-development-branch** - Complete feature branches
- **receiving-code-review** - Handle code reviews
- **requesting-code-review** - Request reviews from team
- **subagent-driven-development** - Subagent orchestration
- **systematic-debugging** - Debugging workflows
- **test-driven-development** - TDD methodology
- **using-git-worktrees** - Git worktree management
- **using-superpowers** - Superpowers overview
- **verification-before-completion** - Pre-completion verification
- **writing-plans** - Plan writing
- **writing-skills** - Skill creation guidance

### Community Skills
- **theme-factory** - Theme creation
- **internal-comms** - Internal communications
- **doc-coauthoring** - Document collaboration
- **claude-api** - Claude API usage
- **expo** - Expo app development
- **frontend-slides** - HTML presentations
- **security-static-analysis** - Static analysis (Trail of Bits)

## MCP Servers (Installed)

Currently using built-in Playwright MCP from oh-my-openagent plugin.

### Available to Install
- filesystem - File system access
- github - GitHub API integration
- git - Local Git operations
- postgres - PostgreSQL database
- sqlite - SQLite database
- memory - Persistent knowledge graph
- sequential-thinking - Reasoning chains
- fetch - HTTP requests
- brave-search - Web search
- puppeteer - Chrome automation
- supabase - Supabase integration
- neo4j - Graph database
- clickhouse - Analytics database
- notion - Notion workspace
- linear - Issue tracking
- slack - Slack integration
- aws - AWS services
- docker - Container management
- kubernetes - K8s operations

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.
