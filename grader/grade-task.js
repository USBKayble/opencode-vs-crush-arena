#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const tid = process.argv[2];
const workspace = process.argv[3];
if (!tid || !workspace) {
  console.error('Usage: grade-task.js <task-id> <workspace-path>');
  process.exit(2);
}
const taskFile = path.join(__dirname, '..', 'tasks', tid + '.json');
if (!fs.existsSync(taskFile)) {
  console.error('Task file not found:', taskFile);
  process.exit(3);
}
const task = JSON.parse(fs.readFileSync(taskFile));

// Very simple grader: if expected_output matches actual file output (from workspace/out.txt), full points
let success = false;
let score = 0;
try {
  if (task.expected && task.expected.file) {
    const outPath = path.join(workspace, task.expected.file);
    if (fs.existsSync(outPath)) {
      const got = fs.readFileSync(outPath,'utf8').trim();
      const want = (task.expected.content || '').trim();
      if (got === want) {
        success = true; score = 100;
      } else {
        score = 0;
      }
    } else {
      score = 0;
    }
  } else {
    // fallback: if any files present, partial credit
    const files = fs.readdirSync(workspace);
    if (files.length>0) { success=true; score=50; } else { success=false; score=0; }
  }
} catch(e) {
  console.error('Grader error', e);
  process.exit(4);
}
console.log(JSON.stringify({ task: tid, success, score }, null, 2));
process.exit(0);
