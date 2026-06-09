const fs = require('fs');
const content = fs.readFileSync('src/admin/AdminPanel.tsx', 'utf-8');

try {
  require('@babel/core').transformSync(content, {
    filename: 'AdminPanel.tsx',
    presets: [
      '@babel/preset-typescript',
      ['@babel/preset-react', { runtime: 'automatic' }]
    ]
  });
  console.log("Babel parse successful");
} catch (error) {
  console.log(error.message);
}
