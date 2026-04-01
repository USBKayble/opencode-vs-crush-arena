const fs = require('fs');
const path = require('path');
const aFile = path.join(process.cwd(),'arena-results','opencode-artifacts','results.json');
const bFile = path.join(process.cwd(),'arena-results','crush-artifacts','results.json');
const outSummary = path.join(process.cwd(),'arena-results','summary.json');
let a = [], b = [];
if (fs.existsSync(aFile)) a = JSON.parse(fs.readFileSync(aFile, 'utf8'));
if (fs.existsSync(bFile)) b = JSON.parse(fs.readFileSync(bFile, 'utf8'));
const amap = new Map(a.map(r => [r.task, r]));
const bmap = new Map(b.map(r => [r.task, r]));
const tasks = Array.from(new Set([...amap.keys(), ...bmap.keys()])).sort();
let a_total = 0, b_total = 0;
const details = [];
for (const t of tasks) {
  const ra = amap.get(t) || { score: 0, duration: Infinity };
  const rb = bmap.get(t) || { score: 0, duration: Infinity };
  const ta = ra.duration || Infinity;
  const tb = rb.duration || Infinity;
  const best = Math.min(ta, tb);
  const a_corr = ra.score || 0;
  const b_corr = rb.score || 0;
  let a_final = 0, b_final = 0;
  if (best === Infinity) {
    a_final = 0; b_final = 0;
  } else {
    const a_pen = ta === Infinity ? 1 : (ta / best - 1);
    const b_pen = tb === Infinity ? 1 : (tb / best - 1);
    // apply penalty as percent reducer: final = correctness * (1 - penalty)
    a_final = Math.max(0, a_corr * (1 - a_pen));
    b_final = Math.max(0, b_corr * (1 - b_pen));
  }
  a_total += a_final;
  b_total += b_final;
  details.push({ task: t, opencode: { score: a_corr, duration: ta, final: a_final }, crush: { score: b_corr, duration: tb, final: b_final } });
}
const summary = { total_tasks: tasks.length, opencode_total: a_total, crush_total: b_total, details };
fs.writeFileSync(outSummary, JSON.stringify(summary, null, 2));
console.log('Summary written to', outSummary);
console.log('OpenCode total:', a_total.toFixed(2));
console.log('Crush total:', b_total.toFixed(2));
