import DomFactory from './utils/domFactory.js';

// todo: MouseEvent TouchEvent wrapper
const { touchBegan, touchMoved, touchEnded } = {
  touchBegan: typeof document.ontouchstart !== 'undefined' ? 'touchstart' : 'mousedown',
  touchMoved: typeof document.ontouchmove !== 'undefined' ? 'touchmove' : 'mousemove',
  touchEnded: typeof document.ontouchend !== 'undefined' ? 'touchend' : 'mouseup',
};

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

document.addEventListener(
  touchEnded,
  () => {
    console.log(ctx);
    if (!ctx || ctx.state !== 'suspended') {
      console.log('sus');
      return;
    }
    ctx.resume().then(() => {
      console.log('🔊: AudioContext is now running');
      mainOsc.start();
    });
  },
  //{ once: true },
);

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded');
  //loop();
});


