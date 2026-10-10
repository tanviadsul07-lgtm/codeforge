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
    // Look for identifier user or User used as variable/object reference
    const matches = line.match(/\b(User|user|currentUser|authUser)\b/g);
    if (matches) {
      matches.forEach(m => {
        // If m === 'User' or m === 'user', check if it's declared in this file
        if (m === 'User' && !line.includes('import') && !line.includes('icon={User}') && !line.includes('icon: User') && !line.includes('lucide') && !line.includes('//') && !line.includes('\'User\'') && !line.includes('"User"') && !line.includes('`User`')) {
          console.log(`FOUND CAPITAL USER: ${f}:${i+1}: ${line.trim()}`);
        }
      } );
    }
  });
});
