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
console.log(`Checking null safety for user properties across ${files.length} files...`);

files.forEach(filePath => {
  const code = fs.readFileSync(filePath, 'utf8');
  try {
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx']
    });

    traverse(ast, {
      MemberExpression(astPath) {
        // Look for expressions like user.name or user.email or user.uid or user.role (unsafe access without ?.)
        if (astPath.node.object && astPath.node.object.name === 'user' && !astPath.node.optional) {
          const propName = astPath.node.property.name || astPath.node.property.value;
          const line = astPath.node.loc?.start.line;
          console.log(`[UNSAFE PROPERTY ACCESS] ${filePath}:${line} -> user.${propName} (missing optional chaining user?.${propName})`);
        }
      }
    });
  } catch (err) {
    console.error(`Parse Error ${filePath}: ${err.message}`);
  }
});
