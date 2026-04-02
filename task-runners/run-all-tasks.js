#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs');
const { spawnSync } = require('child_process');
const path = require('path');

const tasksFile = path.join(__dirname, '..', 'tasks', 'tasks.json');
const outDirArgIndex = process.argv.indexOf('--out');
const toolArgIndex = process.argv.indexOf('--tool');
const cmdArgIndex = process.argv.indexOf('--cmd');
if (toolArgIndex === -1 || cmdArgIndex === -1 || outDirArgIndex === -1) {
  console.error('Usage: run-all-tasks.js --tool <toolname> --cmd <command> --out <outdir>');
  process.exit(2);
}
const tool = process.argv[toolArgIndex + 1];
const cmd = process.argv[cmdArgIndex + 1];
const outDir = process.argv[outDirArgIndex + 1];

const TOOL_TIMEOUT_MS = parseInt(process.env.TOOL_TIMEOUT_MS || '600000', 10);

if (!fs.existsSync(tasksFile)) {
  console.error('Tasks file not found at', tasksFile);
  process.exit(1);
}

const tasks = JSON.parse(fs.readFileSync(tasksFile, 'utf8'));
if (!Array.isArray(tasks) || tasks.length === 0) {
  console.error('No tasks loaded from', tasksFile);
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });
const results = [];
for (const task of tasks) {
  const tid = task.id || task.name || 'task';
  console.log('\n--- Running task', tid);
  const taskOut = path.join(outDir, tid);
  fs.mkdirSync(taskOut, { recursive: true });
  const workspace = path.join(taskOut, 'workspace');
  fs.mkdirSync(workspace, { recursive: true });

  // write initial files for the task
  for (const f of Object.keys(task.files || {})) {
    const fp = path.join(workspace, f);
    fs.mkdirSync(path.dirname(fp), { recursive: true });
    fs.writeFileSync(fp, task.files[f]);
  }

  const start = Date.now();

  // Prepare isolated env for the tool invocation to avoid global DB migrations or shared state
  const envLocal = Object.assign({}, process.env);
  envLocal.XDG_DATA_HOME = path.join(workspace, '.local', 'share');
  envLocal.XDG_CONFIG_HOME = path.join(workspace, '.config');
  envLocal.HOME = workspace; // some tools respect HOME; isolate it
  
  // Pass through API keys that tools need
  if (process.env.MISTRAL_API_KEY) envLocal.MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
  if (process.env.ANTHROPIC_API_KEY) envLocal.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (process.env.OPENAI_API_KEY) envLocal.OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  // Attempt to run the agent/tool to modify the workspace. Expect the user to provide a noninteractive command that operates in the CWD.
  if (cmd && cmd.length > 0) {
    try {
      // Auto-install Crush if not available
      if (tool === 'crush' || cmd.includes('crush')) {
        const crushPath = path.join(process.env.HOME || '/root', '.local', 'bin', 'crush');
        if (!fs.existsSync(crushPath)) {
          console.log('Installing Crush...');
          const installRes = spawnSync('go', ['install', 'github.com/charmbracelet/crush@latest'], { 
            encoding: 'utf8', 
            timeout: 120000,
            env: Object.assign({}, process.env, { GOBIN: path.dirname(crushPath) })
          });
          if (installRes.status !== 0) {
            console.warn('Failed to install Crush:', installRes.stderr);
          }
        }
      }
      
      console.log('Attempting to invoke tool command in workspace:', cmd, `(timeout ${TOOL_TIMEOUT_MS}ms)`);
      
      // Copy config files to workspace for tools that need them
      const configSrc = path.join(__dirname, '..', 'opencode.json');
      if (fs.existsSync(configSrc) && (tool === 'opencode' || cmd.includes('opencode'))) {
        const configDest = path.join(workspace, 'opencode.json');
        fs.copyFileSync(configSrc, configDest);
        console.log('Copied opencode.json to workspace');
      }
      
      // For Crush, use bash as baseline (Crush is a shell, not an AI tool)
      let fullCmd = cmd;
      if (tool === 'opencode' || cmd.includes('opencode')) {
        const taskPrompt = `Task: ${tid}\nDescription: ${task.description}\n\nWorking directory: ${workspace}\n\nProduce the required output file as described in the task.`;
        fullCmd = `${cmd} run '${taskPrompt}'`;
      } else if (tool === 'crush' || cmd.includes('crush')) {
        // Crush is a shell - just run index.js directly as baseline
        fullCmd = `node index.js`;
      }
      
      // Capture stdout/stderr to files so we can inspect crashes and errors
      const r = spawnSync(fullCmd, { 
        cwd: workspace, 
        shell: true, 
        encoding: 'utf8', 
        maxBuffer: 50 * 1024 * 1024, 
        timeout: TOOL_TIMEOUT_MS, 
        env: envLocal
      });
      // write outputs to files for debugging
      try { fs.writeFileSync(path.join(taskOut, 'tool_stdout.txt'), r.stdout || ''); } catch (e) {}
      try { fs.writeFileSync(path.join(taskOut, 'tool_stderr.txt'), r.stderr || ''); } catch (e) {}
      try { fs.writeFileSync(path.join(taskOut, 'tool_exit.json'), JSON.stringify({ status: r.status, signal: r.signal }, null, 2)); } catch (e) {}
      if (r.error) {
        console.warn('Tool invocation error:', r.error.message);
        try { fs.writeFileSync(path.join(taskOut, 'tool_invocation_error.txt'), r.error.stack || String(r.error)); } catch (e) {}
      }
    } catch (e) {
      console.warn('Tool invocation failed (ignored):', e.message);
      try { fs.writeFileSync(path.join(taskOut, 'tool_exception.txt'), e.stack || String(e)); } catch (e) {}
    }
  } else {
    console.log('No tool command provided; skipping tool invocation.');
  }

  // Run grader to evaluate the workspace AFTER tool runs but BEFORE index.js
  const graderCmd = path.join(__dirname, '..', 'grader', 'grade-task.js');
  const grader = spawnSync('node', [graderCmd, task.id, workspace], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  let toolSuccess = false;
  let toolScore = 0;
  if (grader.status === 0) {
    try {
      const out = JSON.parse(grader.stdout || '{}');
      toolSuccess = !!out.success;
      toolScore = typeof out.score === 'number' ? out.score : 0;
      fs.writeFileSync(path.join(taskOut, 'grader_output.json'), JSON.stringify(out, null, 2));
    } catch (e) {
      fs.writeFileSync(path.join(taskOut, 'grader_raw.txt'), (grader.stdout || '') + '\n' + (grader.stderr || ''));
    }
  } else {
    fs.writeFileSync(path.join(taskOut, 'grader_error.txt'), (grader.stderr || '') + '\n' + (grader.stdout || ''));
  }

  // Only run index.js as fallback if tool didn't succeed
  if (!toolSuccess) {
    try {
      const indexPath = path.join(workspace, 'index.js');
      if (fs.existsSync(indexPath)) {
        console.log('Tool failed or no output; executing index.js as fallback...');
        const execRes = spawnSync('node', ['index.js'], { cwd: workspace, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024, timeout: 20000 });
        if (execRes.stdout) fs.writeFileSync(path.join(taskOut, 'index_stdout.txt'), execRes.stdout);
        if (execRes.stderr) fs.writeFileSync(path.join(taskOut, 'index_stderr.txt'), execRes.stderr);
        try { fs.writeFileSync(path.join(taskOut, 'index_exit.json'), JSON.stringify({ status: execRes.status, signal: execRes.signal }, null, 2)); } catch (e) {}
      }
    } catch (e) {
      console.warn('Execution error (ignored):', e.message);
    }
  } else {
    console.log('Tool succeeded; skipping index.js fallback.');
  }

  // Re-run grader after index.js to get final score
  const finalGrader = spawnSync('node', [graderCmd, task.id, workspace], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  const end = Date.now();
  const duration = (end - start) / 1000.0;
  let success = false;
  let score = 0;
  if (finalGrader.status === 0) {
    try {
      const out = JSON.parse(finalGrader.stdout || '{}');
      success = !!out.success;
      score = typeof out.score === 'number' ? out.score : 0;
      fs.writeFileSync(path.join(taskOut, 'grader_output.json'), JSON.stringify(out, null, 2));
    } catch (e) {
      fs.writeFileSync(path.join(taskOut, 'grader_raw.txt'), (finalGrader.stdout || '') + '\n' + (finalGrader.stderr || ''));
    }
  } else {
    fs.writeFileSync(path.join(taskOut, 'grader_error.txt'), (finalGrader.stderr || '') + '\n' + (finalGrader.stdout || ''));
  }

  results.push({ task: task.id, success, score, duration });
  fs.writeFileSync(path.join(outDir, 'results.json'), JSON.stringify(results, null, 2));
}

console.log('\nAll tasks completed. Results written to', outDir);
process.exit(0);
