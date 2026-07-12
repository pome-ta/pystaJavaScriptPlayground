import * as Tone from "tone";

import DomFactory from '../utils/domFactory.js';

console.log(`[sandbox] top`);
const context = new AudioContext();
Tone.setContext(context)

window.addEventListener('message', (e) => {
  console.log(e);
  console.log(context.state);
  context.resume();
  const ctx = Tone.getContext();
  console.log(ctx.state)
});




