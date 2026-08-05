import DomFactory from './utils/domFactory.js';

// todo: MouseEvent TouchEvent wrapper
const { touchBegan, touchMoved, touchEnded } = {
  touchBegan:
    typeof document.ontouchstart !== 'undefined' ? 'touchstart' : 'mousedown',
  touchMoved:
    typeof document.ontouchmove !== 'undefined' ? 'touchmove' : 'mousemove',
  touchEnded:
    typeof document.ontouchend !== 'undefined' ? 'touchend' : 'mouseup',
};

const FFT_SIZE = 256;
const ctx = new AudioContext();

// アナライザーを生成
const fft = ctx.createAnalyser();
// フーリエ変換を行う分割数。2の乗数でなくてはならない
fft.fftSize = FFT_SIZE;
// 0~1の範囲でデータの動きの速さ 0だともっとも速く、1に近づくほど遅くなる
fft.smoothingTimeConstant = 0.85;
// オーディオの出力先を設定
fft.connect(ctx.destination);

// audio 要素と紐付ける
const nodeSource = context.createMediaElementSource(audioElement);

nodeSource.connect(nodeAnalyser);



/** 描画します */
function loop() {
  window.requestAnimationFrame(loop);

  // ・・・
  // ここに描画処理を書く
  console.log('l');
  
}



document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded');
  loop();
  
});

