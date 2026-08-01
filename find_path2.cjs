const fs = require('fs');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const files = require('child_process').execSync('find src -name "*.tsx"').toString().split('\n').filter(Boolean);

function getDivChildren(node) {
  if (!node.children) return [];
  return node.children.filter(c => 
    c.type === 'JSXElement' && 
    (c.openingElement.name.name === 'div' || c.openingElement.name.name === 'motion.div' || c.openingElement.name.object?.name === 'motion')
  );
}

for (const file of files) {
  const content = fs.readFileSync(file, 'utf-8');
  let ast;
  try { ast = parser.parse(content, { sourceType: 'module', plugins: ['jsx', 'typescript'] }); } catch (e) { continue; }

  traverse(ast, {
    JSXElement(path) {
      if (path.node.openingElement.name.name === 'form') {
        const divs1 = getDivChildren(path.node);
        // Sometimes wrapped in fragment or condition
        let firstLevelDivs = divs1;
        path.node.children.forEach(c => {
          if (c.type === 'JSXElement' && c.openingElement.name.name === 'AnimatePresence') {
            firstLevelDivs.push(...getDivChildren(c));
          }
          if (c.type === 'JSXExpressionContainer' && c.expression.type === 'LogicalExpression') {
             // {mode === 'x' && <div/>}
             if (c.expression.right.type === 'JSXElement' && c.expression.right.openingElement.name.name === 'motion.div') {
                 firstLevelDivs.push(c.expression.right);
             }
          }
        });

        for (const div1 of firstLevelDivs) {
          const divs2 = getDivChildren(div1);
          if (divs2.length >= 2) {
            const div2 = divs2[1]; // div:nth-of-type(2)
            const divs3 = getDivChildren(div2);
            if (divs3.length >= 2) {
              const div3 = divs3[1]; // div:nth-of-type(2)
              const divs4 = getDivChildren(div3);
              if (divs4.length >= 2) {
                const div4 = divs4[1]; // div:nth-of-type(2)
                const divs5 = getDivChildren(div4);
                if (divs5.length >= 2) {
                  console.log(`Deep match found in ${file}:${path.node.loc.start.line}`);
                }
              }
            }
          }
        }
      }
    }
  });
}
