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
console.log(`Scanning ${files.length} JS/JSX files in ./src...\n`);

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    const l = line.trim();
    // Search for capitalized User as a standalone identifier / variable (not string literal, not import statement, not JSX element, not comment)
    // Examples: User.name, User?.name, User.id, User.email, User.role, User, etc.
    if (/\bUser\b/.test(l)) {
      if (
        !l.startsWith('//') &&
        !l.startsWith('*') &&
        !l.includes('import ') &&
        !l.includes('icon={User}') &&
        !l.includes('icon: User') &&
        !l.includes('<User') &&
        !l.includes("'User'") &&
        !l.includes('"User"') &&
        !l.includes('`User`') &&
        !l.includes('User Avatar') &&
        !l.includes('User Management') &&
        !l.includes('User Account') &&
        !l.includes('User Record') &&
        !l.includes('User Profile') &&
        !l.includes('User Info') &&
        !l.includes('User Registration') &&
        !l.includes('User login') &&
        !l.includes('User & Staff') &&
        !l.includes('User ID')
      ) {
        console.log(`MATCH: ${f}:${i+1}: ${l}`);
      }
    }
  });
});
