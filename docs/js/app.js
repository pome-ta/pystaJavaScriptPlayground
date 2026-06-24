import { createContainer } from 'almostnode';

const { vfs, npm, runtime } = createContainer();

// Install Express from npm
await npm.install('express');

vfs.writeFileSync(
  '/app.js',
  `
  const express = require('express');
  const app = express();

  app.get('/', (req, res) => {
    res.json({ message: 'Express in the browser!' });
  });

  app.listen(3000);
`,
);

runtime.runFile('/app.js');
