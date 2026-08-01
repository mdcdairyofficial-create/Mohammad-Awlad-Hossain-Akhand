const fs = require('fs');
let app = fs.readFileSync('src/main.tsx', 'utf8');
const hook = `
setTimeout(() => {
  const el = document.querySelector('div#root:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > form:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(2)');
  if (el) {
    fetch('/api/dump', { method: 'POST', body: el.outerHTML });
  } else {
    fetch('/api/dump', { method: 'POST', body: 'NOT FOUND' });
  }
}, 5000);
`;
if (!app.includes('/api/dump')) {
  app = app.replace('createRoot(document.getElementById(\'root\')!).render(', hook + '\ncreateRoot(document.getElementById(\'root\')!).render(');
  fs.writeFileSync('src/main.tsx', app);
}
