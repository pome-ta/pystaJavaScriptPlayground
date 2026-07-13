import DomFactory from './utils/domFactory.js';

const isInstance = true;

const instanceMode = `const sketch = (p) => {
  const v = 360;

  p.setup = () => {
    // put setup code here
    p.createCanvas(v, v);
    p.colorMode(p.HSL, v, 1, 1);
    console.log(p);
  };

  p.draw = () => {
    // put drawing code here
    p.background(p.frameCount % v, 1, 0.5);
  };
};

new p5(sketch);`;

const globalMode = `const v = 360;

function setup() {
  createCanvas(v, v);
  colorMode(HSL, v, 1, 1);
}

function draw() {
  background(frameCount % v, 1, 0.5);
}`;

const editor = DomFactory.create('textarea', {
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
    this.targetSandbox.src = srcPath;
  }
  this.targetSandbox.contentWindow.postMessage({ code: toStringDoc }, '*');
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
      type: 'click',
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
