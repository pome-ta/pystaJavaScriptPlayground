import DomFactory from '../utils/domFactory.js';

console.log(`[sandbox] top`);
const context = new AudioContext();

window.addEventListener('message', (e) => {
  console.log(e);
  console.log(context.state);
  context.resume();
});
