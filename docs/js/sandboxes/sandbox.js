import DomFactory from '../utils/domFactory.js';

console.log(`[sandbox] top`);

function runSketch(code) {
  if (window._p5Instance) {
    window._p5Instance.remove();
    window._p5Instance = null;
  }

  const script = DomFactory.create('script', {
    setAttrs: {
      type: 'text/javascript',
    },
    // xxx: スコープを切る
    textContent: `{
      ${code}
    }`,
    appendParent: document.body,
  });

  if (window._p5Instance === null) {
    try {
      window._p5Instance = new p5();
    } catch (e) {
      console.log('Error: ' + e.message);
    }
  }

  document.body.removeChild(script);
}

// window.addEventListener('message', (e) => {
//   console.log(e);
//   const nowDate = new Date();
//   console.log(nowDate.getSeconds() % 4);
// });

window.addEventListener('message', (e) => {
  console.log('hogw');
  const sourceCode = e.data.code;
  runSketch(sourceCode);
});

window._p5Instance = null;

window.__p5 = window.p5;
// delete window.p5;

class p5 extends window.__p5 {
  constructor(sketch, node) {
    super(sketch, node);
    window._p5Instance = this;
  }
}

window.p5 = p5;
delete window.__p5;
