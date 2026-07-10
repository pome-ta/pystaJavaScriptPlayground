import DomFactory from '../utils/domFactory.js';

console.log(`[sandbox] top`);

window.addEventListener('message', (e) => {
  console.log(e);
});
