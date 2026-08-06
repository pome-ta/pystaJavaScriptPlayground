import DomFactory from './utils/domFactory.js';

const ctx = new AudioContext();

const mainOsc = ctx.createOscillator();
mainOsc.type = 'sine';
mainOsc.frequency.setValueAtTime(440, ctx.currentTime);

const FFT_SIZE = 4096;
const fft = ctx.createAnalyser();
fft.fftSize = FFT_SIZE;
//fft.smoothingTimeConstant = 0.8;
fft.smoothingTimeConstant = 0;

const bufferLength = fft.frequencyBinCount;
const dataArray = new Float32Array(bufferLength);

fft.connect(ctx.destination);
//mainOsc.connect(ctx.destination);
mainOsc.connect(fft);
mainOsc.start();

/**
 * Convert decibels into gain.
 */
function dbToGain(db) {
  return Math.pow(10, db / 20);
}

function loop() {
  window.requestAnimationFrame(loop);

  // ここに描画処理を書く
  //console.log('l');
  fft.getFloatFrequencyData(dataArray);
  let spectrum = dataArray.map((v) => dbToGain(v));
  //console.log(dataArray)
  //console.log(Math.max(...dataArray));
  //console.log(dataArray)
  console.log(Math.max(...spectrum));
  //console.log(spectrum);
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
  loop();
});
