import DomFactory from './utils/domFactory.js';

const ctx = new AudioContext();

const mainOsc = ctx.createOscillator();
mainOsc.type = 'sine';
mainOsc.frequency.setValueAtTime(440, ctx.currentTime);

const FFT_SIZE = 1024;
const fft = ctx.createAnalyser();
fft.fftSize = FFT_SIZE;
fft.smoothingTimeConstant = 0.8;

//fft.connect(ctx.destination);
mainOsc.connect(ctx.destination);
mainOsc.start();
// audio 要素と紐付ける
/*
const nodeSource = context.createMediaElementSource(audioElement);

nodeSource.connect(nodeAnalyser);
*/
function loop() {
  window.requestAnimationFrame(loop);

  // ここに描画処理を書く
  console.log('l');
}

const eventName = typeof document.ontouchend !== 'undefined' ? 'touchend' : 'mouseup';
document.addEventListener(eventName, initAudioContext);
function initAudioContext() {
  document.removeEventListener(eventName, initAudioContext);
  // wake up AudioContext
  ctx.resume();
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded');
  //loop();
});
