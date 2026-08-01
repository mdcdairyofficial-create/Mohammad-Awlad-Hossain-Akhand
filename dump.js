const fs = require('fs');
const content = `
app.post('/api/dump', express.text(), (req, res) => {
  fs.writeFileSync('dump.txt', req.body);
  res.send('ok');
});
`;
// Let's inject this into server.ts
let server = fs.readFileSync('server.ts', 'utf8');
server = server.replace('app.get("/api/health"', content + '\n  app.get("/api/health"');
fs.writeFileSync('server.ts', server);
