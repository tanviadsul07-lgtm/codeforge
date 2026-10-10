const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'build') return;
    const p = path.join(dir, file);
    const stat = fs.statSync(p);
    if (stat && stat.isDirectory()) results = results.concat(walk(p));
    else if (p.endsWith('.js') || p.endsWith('.jsx') || p.endsWith('.ts') || p.endsWith('.tsx') || p.endsWith('.html') || p.endsWith('.json')) results.push(p);
  });
  return results;
}

const files = walk('./');
console.log(`Scanning ${files.length} project files...`);

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    const l = line.trim();
    if (/\bUser\b/.test(l)) {
      if (!l.startsWith('//') && !l.startsWith('*') && !l.includes('import ') && !l.includes('icon={User}') && !l.includes('<User') && !l.includes("'User'") && !l.includes('"User"') && !l.includes('`User`')) {
        console.log(`${f}:${i+1}: ${l}`);
      }
    }
  });
});
