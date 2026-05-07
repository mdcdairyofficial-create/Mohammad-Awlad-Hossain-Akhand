const fs = require('fs');

const content = fs.readFileSync('src/translations.ts', 'utf-8');
const lines = content.split('\n');

let currentLang = '';
let keysSeen = new Set();
const newLines = [];

// A regex to match `key: 'value',` or `key: "value",`
// Also handles `  key: 'value',`
const keyRegex = /^\s*([a-zA-Z0-9_]+)\s*:/;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Track top level languages
  if (line.match(/^\s*(bn|en|hi|ur):\s*\{/)) {
    currentLang = line.match(/^\s*(bn|en|hi|ur):\s*\{/)[1];
    keysSeen = new Set();
    newLines.push(line);
    continue;
  }
  
  if (currentLang && line.match(/^\s*\},\s*$/)) {
    currentLang = '';
    newLines.push(line);
    continue;
  }
  
  // If we are inside a language block, check for keys
  if (currentLang) {
    const match = line.match(keyRegex);
    if (match) {
      const key = match[1];
      if (keysSeen.has(key)) {
        // Duplicate key! Comment it out or skip it.
        newLines.push(`// DUP: ${line}`);
        continue;
      } else {
        keysSeen.add(key);
      }
    }
  }
  
  newLines.push(line);
}

fs.writeFileSync('src/translations.ts', newLines.join('\n'));
console.log("Done fixing duplicates.");
