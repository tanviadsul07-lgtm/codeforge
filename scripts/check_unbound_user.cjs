const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) results = results.concat(walk(file));
    else if (file.endsWith('.js') || file.endsWith('.jsx')) results.push(file);
  });
  return results;
}

const files = walk('./src');

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  if (/\bUser\b/.test(content)) {
    const hasDecl = /import\s+.*?\bUser\b|const\s+.*?\bUser\b|let\s+.*?\bUser\b|var\s+.*?\bUser\b|class\s+\bUser\b|function\s+\bUser\b/s.test(content);
    if (!hasDecl) {
      console.log(`UNDEFINED CAPITAL USER IN FILE: ${f}`);
      content.split('\n').forEach((line, i) => {
        if (/\bUser\b/.test(line)) {
          console.log(`  Line ${i+1}: ${line.trim()}`);
        }
      });
    }
  }
});
