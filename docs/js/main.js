import DomFactory from './utils/domFactory.js';

// xxx: iframe 生成時と書き換え時と併用
const reloadSketchHandleEvent = function (e) {
  this.targetSandbox = this.targetSandbox ? this.targetSandbox : e.target;
  this.targetSandbox.contentWindow.postMessage('hoge', '*');
};

/* --- iframe */
const sandbox = DomFactory.create('iframe', {
  setAttrs: {
    id: 'sandbox',
    sandbox: 'allow-same-origin allow-scripts',
    allow:
      'accelerometer; ambient-light-sensor; autoplay; bluetooth; camera; encrypted-media; geolocation; gyroscope;  hid; microphone; magnetometer; midi; payment; usb; serial; vr; xr-spatial-tracking',
    loading: 'lazy',
    src: './js/sandboxes/sandbox.html',
  },
  setStyles: {
    width: '50%',
    height: '50dvh',
    'background-color': 'darkgray',
  },
  addEventListeners: [
    {
      type: 'load',
      listener: {
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

/* --- accessory */
const callButton = DomFactory.create('button', {
  textContent: '🔄',
  addEventListeners: [
    {
      type: 'click',
      listener: {
        targetSandbox: sandbox,
        handleEvent: reloadSketchHandleEvent,
      },
    },
  ],
});


const setLayout = () => {
  document.body.appendChild(callButton);
  document.body.appendChild(sandbox);
};


document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded');
  setLayout();
});
