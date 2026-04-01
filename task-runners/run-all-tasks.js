#!/usr/bin/env node
const fs = require('fs');
const { spawnSync } = require('child_process');
const path = require('path');
const tasksDir = path.join(__dirname, '..', 'tasks');
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

if (!fs.existsSync(tasksDir)) {
  console.error('Tasks directory not found at', tasksDir);
  process.exit(1);
}

const tasks = fs.readdirSync(tasksDir).filter(f => f.endsWith('.json')).sort();
const results = [];
for (const tfile of tasks) {
  const tid = tfile.replace('.json','');
  console.log('--- Running task', tid);
  const task = JSON.parse(fs.readFileSync(path.join(tasksDir, tfile)));
  const taskOut = path.join(outDir, tid);
  fs.mkdirSync(taskOut, { recursive: true });
  const start = Date.now();

  // Prepare workspace for task
  const workspace = path.join(taskOut, 'workspace');
  fs.mkdirSync(workspace, { recursive: true });
  // write task files
  for (const f of Object.keys(task.files || {})) {
    const fp = path.join(workspace, f);
    fs.mkdirSync(path.dirname(fp), { recursive: true });
    fs.writeFileSync(fp, task.files[f]);
  }

  // Run the tool (placeholder command): we expect an external script to accept noninteractive flags
  // For now, we'll emulate by running the grader script directly (simulate tool success)
  const graderCmd = path.join(__dirname, '..', 'grader', 'grade-task.js');
  const res = spawnSync('node', [graderCmd, tid, workspace], { encoding: 'utf8', maxBuffer: 10*1024*1024 });
  const end = Date.now();
  const duration = (end - start) / 1000.0;
  let success = false;
  let score = 0;
  if (res.status === 0) {
    const out = JSON.parse(res.stdout || '{}');
    success = out.success;
    score = out.score;
    fs.writeFileSync(path.join(taskOut, 'grader_output.json'), JSON.stringify(out, null, 2));
  } else {
    fs.writeFileSync(path.join(taskOut, 'grader_error.txt'), res.stderr || res.stdout || 'No output');
  }

  results.push({ task: tid, success, score, duration });
  fs.writeFileSync(path.join(outDir, 'results.json'), JSON.stringify(results, null, 2));
}

console.log('All tasks completed.');
