console.log('hoge');

import { createContainer } from 'almostnode';

const { vfs, runtime, npm } = createContainer();

// Write a file to the virtual filesystem
vfs.writeFileSync(
  '/hello.js',
  `
  console.log('Hello from almostnode!');
`,
);

// Execute it
runtime.runFile('/hello.js');
