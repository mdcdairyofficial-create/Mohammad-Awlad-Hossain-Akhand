const fs = require('fs');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const files = require('child_process').execSync('find src -name "*.tsx"').toString().split('\n').filter(Boolean);

for (const file of files) {
  const content = fs.readFileSync(file, 'utf-8');
  let ast;
  try {
    ast = parser.parse(content, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript']
    });
  } catch (e) {
    continue;
  }

  traverse(ast, {
    JSXElement(path) {
      if (path.node.openingElement.name.name === 'form') {
        console.log(`Found form in ${file}:${path.node.loc.start.line}`);
      }
    }
  });
}
