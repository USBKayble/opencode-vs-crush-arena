OpenCode vs Crush — Automation Arena

This repository provides a GitHub Actions "battle arena" to compare OpenCode and Crush on 100 automated Node.js tasks with objective grading (correctness + time penalty).

Overview
- Language: Node.js
- Tasks: 100 machine-gradable tasks in tasks/
- Workflow: .github/workflows/arena.yml runs two parallel jobs (opencode, crush) that iterate tasks, time each run, and upload artifacts.
- Runner scripts: .github/arena/run-opencode.sh and run-crush.sh (placeholders for tool commands). Configure OPENCODE_CMD and CRUSH_CMD in secrets or workflow env.

Usage
1. Add secrets in GitHub repo (Settings → Secrets):
   - MODEL_API_KEY (if both tools need a model key)
   - OPENCODE_CMD (optional override command to run OpenCode noninteractive)
   - CRUSH_CMD (optional override command to run Crush noninteractive)
   - GITHUB_BOT_PAT (optional, minimal scopes, only if you want automated PR creation)

2. Trigger the workflow via the Actions UI or push a branch matching **/arena/**.

Notes
- The run scripts are intentionally conservative: they will not automatically enable elevated actions. Run the workflow in a fork or ephemeral test repo until you review behavior.
- The task generator and grader are implemented in Node.js. CI will install Node.js on runners.

If you want, I can now push this repo to GitHub and provide the URL.
