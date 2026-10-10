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
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    const l = line.trim();
    if (l.includes('<video')) {
      console.log(`${f}:${i+1}: ${l}`);
      // Also print next 5 lines
      for (let j = 1; j <= 5; j++) {
        if (lines[i+j]) console.log(`   +${j}: ${lines[i+j].trim()}`);
      }
    }
  });
});
