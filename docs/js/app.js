console.log('hoge');
/*
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

*/
import { WebContainer } from '@webcontainer/api';



//const webcontainerInstance = await WebContainer.boot();
//console.log(webcontainerInstance)
console.log({
  crossOriginIsolated,
  SharedArrayBuffer: typeof SharedArrayBuffer
});

(async () => {
  try {
    const wc = await WebContainer.boot();
    console.log('boot success', wc);
  } catch (e) {
    console.error('boot failed', e);
  }
})();
