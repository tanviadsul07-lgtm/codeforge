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
  // Check if "User" (capital U) is used in line
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    const l = line.trim();
    // Look for User. User? User( User[ User, User; User} etc.
    const match = l.match(/\bUser\b/g);
    if (match) {
      console.log(`${f}:${idx + 1}: ${l}`);
    }
  });
});
