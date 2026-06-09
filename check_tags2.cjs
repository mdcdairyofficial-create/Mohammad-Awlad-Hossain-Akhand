const fs = require('fs');
let content = fs.readFileSync('src/admin/AdminPanel.tsx', 'utf-8');

const startIndex = content.indexOf("{activeTab === 'testing' && (");
const endIndex = content.indexOf("{activeTab === 'clerk_trust' && (");
const testingBlock = content.substring(startIndex, endIndex);

let divCount = 0;
for(const match of testingBlock.matchAll(/<div/g)) divCount++;
for(const match of testingBlock.matchAll(/<\/div>/g)) divCount--;
console.log("DIVs:", divCount);

let spanCount = 0;
for(const match of testingBlock.matchAll(/<span/g)) spanCount++;
for(const match of testingBlock.matchAll(/<\/span>/g)) spanCount--;
console.log("SPANs:", spanCount);

let pCount = 0;
for(const match of testingBlock.matchAll(/<p/g)) pCount++;
for(const match of testingBlock.matchAll(/<\/p>/g)) pCount--;
console.log("Ps:", pCount);
