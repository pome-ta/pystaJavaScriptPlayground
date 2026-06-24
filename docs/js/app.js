import { createContainer } from 'almostnode';

const { vfs, runtime } = createContainer();

vfs.writeFileSync(
  '/server.js',
  `
  const http = require('http');

  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>Hello from the browser!</h1>');
  });

  server.listen(3000, () => {
    console.log('Server running on port 3000');
  });
`,
);

runtime.runFile('/server.js');


