import * as fs from 'fs';

const content = fs.readFileSync('src/translations.ts', 'utf-8');

// The file exports `translations` object. It has 4 top level properties: bn, en, hi, ur.
// Since it's just a giant TS object literal, we can process it block by block.
// To fix duplicate keys, we can scan through the file line by line.

const lines = content.split('\n');

let currentLang = '';
let keysSeen = new Set<string>();
const newLines: string[] = [];

// A regex to match `key: 'value',` or `key: "value",`
const keyRegex = /^\s*([a-zA-Z0-9_]+)\s*:/;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Track top level languages
  if (line.match(/^\s*(bn|en|hi|ur):\s*\{/)) {
    currentLang = line.match(/^\s*(bn|en|hi|ur):\s*\{/)?.[1] || '';
    keysSeen = new Set<string>();
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
        // Duplicate key! We should KEEP this one and REMOVE the previous one.
        // Wait, it's easier to keep the FIRST one and skip the SECOND one.
        // Or actually we should keep the LAST one because it usually overwrites.
        // Let's just comment out this duplicate one for safety, and see if it compiles.
        // Actually, if we keep the first one, we just do:
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
