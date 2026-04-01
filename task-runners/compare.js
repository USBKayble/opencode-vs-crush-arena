const fs = require('fs');
const path = require('path');
const ra = path.join(process.cwd(),'arena-results','opencode-artifacts','results.json');
const rb = path.join(process.cwd(),'arena-results','crush-artifacts','results.json');
let a=[],b=[];
if (fs.existsSync(ra)) a=JSON.parse(fs.readFileSync(ra,'utf8'));
if (fs.existsSync(rb)) b=JSON.parse(fs.readFileSync(rb,'utf8'));
console.log('OpenCode results tasks:', a.length);
console.log('Crush results tasks:', b.length);
