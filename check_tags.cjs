const fs = require('fs');
let content = fs.readFileSync('src/admin/AdminPanel.tsx', 'utf-8');

const startIndex = content.indexOf("{activeTab === 'testing' &&");
const endIndex = content.indexOf("{activeTab === 'clerk_trust'");
const testingBlock = content.substring(startIndex, endIndex);

let divCount = 0;
let spanCount = 0;
let pCount = 0;
let h3Count = 0;
let h4Count = 0;
let ulCount = 0;
let liCount = 0;

for(const match of testingBlock.matchAll(/<div/g)) divCount++;
for(const match of testingBlock.matchAll(/<\/div>/g)) divCount--;

for(const match of testingBlock.matchAll(/<span/g)) spanCount++;
for(const match of testingBlock.matchAll(/<\/span>/g)) spanCount--;

for(const match of testingBlock.matchAll(/<p/g)) pCount++;
for(const match of testingBlock.matchAll(/<\/p>/g)) pCount--;

for(const match of testingBlock.matchAll(/<ul/g)) ulCount++;
for(const match of testingBlock.matchAll(/<\/ul>/g)) ulCount--;

console.log("Unclosed DIVs:", divCount);
console.log("Unclosed SPANs:", spanCount);
console.log("Unclosed Ps:", pCount);
console.log("Unclosed ULs:", ulCount);

