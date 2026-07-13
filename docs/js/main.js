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

document.addEventListener(touchEnded, () => {
  console.log(`--- ${Date.now()}: document`);
  const auCtx = window.frames[0]?.auCtx;
  if (auCtx) {
    if (auCtx.state === 'suspended') {
      auCtx.resume().then(() => {
        console.log('AudioContext is now running');
      });
    }
  }
});

const isInstance = false;

const instanceMode = `const sketch = (p) => {
  const v = 360;
  let osc, playing, freq, amp;
  let musicalScale = [261.6, 311.1, 349.2, 370, 392, 466.2];

  p.setup = () => {
    // put setup code here
    const cnv = p.createCanvas(v, v);
    p.colorMode(p.HSL, v, 1, 1);
    // cnv.mousePressed(playOscillator);
    // p.userStartAudio();
    // console.log(p5.prototype.getAudioContext().state)
    osc = new p5.Oscillator('sawtooth');

    let s = p.second();
    // console.log(s);
    // console.log(s % musicalScale.length);
    // osc.freq(440);
    osc.freq(musicalScale[s % musicalScale.length]);
    osc.amp(0.1);
    osc.start();
  };

  p.draw = () => {
    // put drawing code here
    p.background(p.frameCount % v, 1, 0.5);
    freq = musicalScale[p.floor(p.map(p.mouseX, 0, p.width, 0, 5))];

    amp = p.constrain(p.map(p.mouseY, p.height, 0, 0, 1), 0, 1);
    p.text('tap to play', 20, 20);
    p.text('freq: ' + freq, 20, 40);
    p.text('amp: ' + amp, 20, 60);

    if (playing == true) {
      osc.freq(freq);
      osc.amp(amp);
    }
  };

  function playOscillator() {
    // starting an oscillator on a user gesture will enable audio
    // in browsers that have a strict autoplay policy.
    osc.start();
    playing = true;
  }
};

new p5(sketch);
`;

const globalMode = `

// const v = 360;

// function setup() {
//   createCanvas(v, v);
//   colorMode(HSL, v, 1, 1);
// }

// function draw() {
//   background(frameCount % v, 1, 0.5);
// }
let osc, playing, freq, amp;
let musicalScale = [261.6, 311.1, 349.2, 370, 392, 466.2]

function setup() {
  let cnv = createCanvas(360, 360);
  // cnv.mousePressed(playOscillator);
  osc = new p5.Oscillator('sawtooth');
  let s = second();
  // console.log(s);
  // console.log(s % musicalScale.length);
  // osc.freq(440);
  osc.freq(musicalScale[s % musicalScale.length]);
  osc.amp(0.1);
  osc.start();

}

function draw() {
  background(220)
  freq = musicalScale[floor(map(mouseX, 0, width, 0, 5))];

  amp = constrain(map(mouseY, height, 0, 0, 1), 0, 1);
  text('tap to play', 20, 20);
  text('freq: ' + freq, 20, 40);
  text('amp: ' + amp, 20, 60);

  if (playing == true) {
    osc.freq(freq);
    osc.amp(amp);
  }
}

function playOscillator() {
  // starting an oscillator on a user gesture will enable audio
  // in browsers that have a strict autoplay policy.
  osc.start();
  playing = true;
}
`;

const editor = DomFactory.create('textarea', {
  setAttrs: { id: 'editor' },
  textContent: isInstance ? instanceMode : globalMode,
  setStyles: {
    width: '90%',
    height: '10rem',
  },
});

const srcPath = './js/sandboxes/sandbox.html';

// xxx: iframe 生成時と書き換え時と併用
const reloadSketchHandleEvent = function (e) {
  const toStringDoc = this.targetEditor.value;

  this.targetSandbox = this.targetSandbox ? this.targetSandbox : e.target;

  if (e.type !== 'load') {
    console.log(`--- ${Date.now()}: touchBegan`);
    this.targetSandbox.src = srcPath;
  }

  this.targetSandbox.contentWindow.postMessage(
    { code: toStringDoc, isInstanceMode: isInstance },
    '*',
  );
};

/* --- iframe */
const sandbox = DomFactory.create('iframe', {
  setAttrs: {
    id: 'sandbox',
    sandbox: 'allow-same-origin allow-scripts',
    allow:
      'accelerometer; ambient-light-sensor; autoplay; bluetooth; camera; encrypted-media; geolocation; gyroscope;  hid; microphone; magnetometer; midi; payment; usb; serial; vr; xr-spatial-tracking',
    loading: 'lazy',
    src: srcPath,
  },
  setStyles: {
    width: '100%',
    height: '64dvh',
    'border-width': '0',
    'background-color': 'darkgray',
  },
  addEventListeners: [
    {
      type: 'load',
      listener: {
        targetEditor: editor,
        targetSandbox: null,
        handleEvent: reloadSketchHandleEvent,
      },
    },
    /*
    {
      type: 'visibilitychange',
      listener: {
        handleEvent: function (e) {
          console.log('visibilitychange');
        },
      },
    },
    */
  ],
});

const wrapButton = DomFactory.create('div', {
  setStyles: {
    height: '2rem',
  },
});

const callButton = DomFactory.create('button', {
  textContent: '🔄',
  appendParent: wrapButton,
  addEventListeners: [
    {
      type: touchBegan,
      listener: {
        targetSandbox: sandbox,
        targetEditor: editor,
        handleEvent: reloadSketchHandleEvent,
      },
    },
  ],
});

const setLayout = () => {
  document.body.appendChild(wrapButton);
  document.body.appendChild(editor);
  document.body.appendChild(sandbox);
};

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded');
  setLayout();
});

