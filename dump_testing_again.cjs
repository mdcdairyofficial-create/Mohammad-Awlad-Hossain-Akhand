const fs = require('fs');
let content = fs.readFileSync('src/admin/AdminPanel.tsx', 'utf-8');

const startIndex = content.indexOf("{activeTab === 'testing' && (");
const endIndex = content.indexOf("{activeTab === 'clerk_trust' && (");
const testingBlock = content.substring(startIndex, endIndex);

console.log(testingBlock);
