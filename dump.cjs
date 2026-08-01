const fs = require('fs');
const content = `
app.use(express.text({type: "*/*"}));
app.post('/api/dump', (req, res) => {
  const fs = require('fs');
  fs.writeFileSync('dump.txt', req.body);
  res.send('ok');
});
`;
let server = fs.readFileSync('server/index.ts', 'utf8');
if (!server.includes('/api/dump')) {
  server = server.replace('app.get("/api/health"', content + '\n  app.get("/api/health"');
  fs.writeFileSync('server/index.ts', server);
}
