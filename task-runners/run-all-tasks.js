#!/usr/bin/env node
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

  // Attempt to run the agent/tool to modify the workspace. Expect the user to provide a noninteractive command that operates in the CWD.
  if (cmd && cmd.length > 0) {
    try {
      console.log('Attempting to invoke tool command in workspace:', cmd);
      // run as a shell command so OPENCODE_CMD or CRUSH_CMD can be a full command string
      const r = spawnSync(cmd, { cwd: workspace, shell: true, stdio: 'inherit', env: Object.assign({}, process.env) });
      if (r.error) {
        console.warn('Tool invocation error (ignored):', r.error.message);
      }
    } catch (e) {
      console.warn('Tool invocation failed (ignored):', e.message);
    }
  } else {
    console.log('No tool command provided; skipping tool invocation.');
  }

  // After tool runs (or not), try to execute node index.js if present to produce out.txt
  try {
    const indexPath = path.join(workspace, 'index.js');
    if (fs.existsSync(indexPath)) {
      console.log('Executing index.js to generate outputs...');
      const execRes = spawnSync('node', ['index.js'], { cwd: workspace, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
      if (execRes.stdout) fs.writeFileSync(path.join(taskOut, 'index_stdout.txt'), execRes.stdout);
      if (execRes.stderr) fs.writeFileSync(path.join(taskOut, 'index_stderr.txt'), execRes.stderr);
    } else {
      console.log('No index.js present for task, skipping execution.');
    }
  } catch (e) {
    console.warn('Execution error (ignored):', e.message);
  }

  // Run grader to evaluate the workspace
  const graderCmd = path.join(__dirname, '..', 'grader', 'grade-task.js');
  const grader = spawnSync('node', [graderCmd, task.id, workspace], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  const end = Date.now();
  const duration = (end - start) / 1000.0;
  let success = false;
  let score = 0;
  if (grader.status === 0) {
    try {
      const out = JSON.parse(grader.stdout || '{}');
      success = !!out.success;
      score = typeof out.score === 'number' ? out.score : 0;
      fs.writeFileSync(path.join(taskOut, 'grader_output.json'), JSON.stringify(out, null, 2));
    } catch (e) {
      fs.writeFileSync(path.join(taskOut, 'grader_raw.txt'), (grader.stdout || '') + '\n' + (grader.stderr || ''));
    }
  } else {
    fs.writeFileSync(path.join(taskOut, 'grader_error.txt'), (grader.stderr || '') + '\n' + (grader.stdout || ''));
  }

  results.push({ task: task.id, success, score, duration });
  fs.writeFileSync(path.join(outDir, 'results.json'), JSON.stringify(results, null, 2));
}

console.log('\nAll tasks completed. Results written to', outDir);
process.exit(0);
