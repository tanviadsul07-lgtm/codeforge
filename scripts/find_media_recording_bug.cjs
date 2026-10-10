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
console.log(`Searching ${files.length} files for MediaRecorder, video elements, canvas drawing, and evidence rendering...`);

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    const l = line.trim();
    if (
      l.includes('MediaRecorder') ||
      l.includes('srcObject') ||
      l.includes('videoRef') ||
      l.includes('offCanvas') ||
      l.includes('drawImage') ||
      l.includes('toDataURL') ||
      l.includes('evidenceVideo') ||
      l.includes('evidenceImage') ||
      l.includes('<video') ||
      l.includes('video/mp4') ||
      l.includes('video/webm')
    ) {
      console.log(`${f}:${i+1}: ${l}`);
    }
  });
});
