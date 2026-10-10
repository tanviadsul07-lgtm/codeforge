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
console.log(`AST scanning ${files.length} files for ANY unbound variable references...`);

const KNOWN_GLOBALS = new Set([
  'console', 'window', 'document', 'localStorage', 'sessionStorage', 'fetch', 'setTimeout',
  'clearTimeout', 'setInterval', 'clearInterval', 'navigator', 'URL', 'URLSearchParams',
  'Image', 'Audio', 'Blob', 'File', 'FileReader', 'FormData', 'HTMLCanvasElement',
  'CanvasRenderingContext2D', 'Event', 'CustomEvent', 'Error', 'TypeError', 'RangeError',
  'SyntaxError', 'ReferenceError', 'Math', 'Date', 'JSON', 'Object', 'Array', 'String',
  'Number', 'Boolean', 'RegExp', 'Map', 'Set', 'WeakMap', 'WeakSet', 'Promise', 'Symbol',
  'BigInt', 'ArrayBuffer', 'Uint8Array', 'Float32Array', 'parseInt', 'parseFloat',
  'isNaN', 'isFinite', 'encodeURIComponent', 'decodeURIComponent', 'encodeURI', 'decodeURI',
  'process', 'global', 'globalThis', 'requestAnimationFrame', 'cancelAnimationFrame',
  'confirm', 'alert', 'prompt', 'Intl', 'atob', 'btoa', 'crypto'
]);

let totalUnbound = 0;

files.forEach(filePath => {
  const code = fs.readFileSync(filePath, 'utf8');
  try {
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx']
    });

    traverse(ast, {
      Identifier(astPath) {
        if (astPath.isReferencedIdentifier()) {
          const name = astPath.node.name;
          if (!KNOWN_GLOBALS.has(name)) {
            const binding = astPath.scope.getBinding(name);
            if (!binding) {
              console.log(`[UNBOUND IDENTIFIER] ${filePath}:${astPath.node.loc?.start.line} -> "${name}"`);
              totalUnbound++;
            }
          }
        }
      }
    });
  } catch (err) {
    console.error(`Parse Error ${filePath}: ${err.message}`);
  }
});

console.log(`\nScan finished. Total unbound identifiers: ${totalUnbound}`);
