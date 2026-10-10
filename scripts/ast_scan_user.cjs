const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

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
console.log(`AST scanning ${files.length} JS/JSX files for global/unbound references to "User" or "user"...`);

let foundCount = 0;

files.forEach(filePath => {
  const code = fs.readFileSync(filePath, 'utf8');
  try {
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx']
    });

    traverse(ast, {
      Identifier(astPath) {
        const name = astPath.node.name;
        if (name === 'User' || name === 'user' || name === 'currentUser' || name === 'authUser' || name === 'loggedInUser') {
          // Check if this identifier is a reference (not a property key like obj.user or key: user, unless it's a shorthand property value)
          if (astPath.isReferencedIdentifier()) {
            const binding = astPath.scope.getBinding(name);
            if (!binding) {
              // Ignore standard global types if any
              console.log(`[AST UNBOUND REFERENCE] File: ${filePath}`);
              console.log(`  Line ${astPath.node.loc?.start.line}: Identifier "${name}" is referenced but NOT defined in scope!`);
              console.log(`  Code context: ${code.split('\n')[astPath.node.loc?.start.line - 1].trim()}`);
              foundCount++;
            }
          }
        }
      }
    });
  } catch (err) {
    // If syntax error in parsing, log it
    console.error(`Error parsing ${filePath}: ${err.message}`);
  }
});

console.log(`\nScan complete. Total unbound references found: ${foundCount}`);
