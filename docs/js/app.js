import * as Tone from 'tone';
import { Scale, Note } from 'tonal';
import '@hsablonniere/musiq/mq-piano';

// ==========================================
// 1. DOM要素 & グローバル状態の定義
// ==========================================
const DOM = {
  piano: document.getElementById('piano'),
  rootSelect: document.getElementById('rootSelect'),
  scaleTypeSelect: document.getElementById('scaleTypeSelect'),
  playBtn: document.getElementById('playBtn'),
  bpmSlider: document.getElementById('bpmSlider'),
  bpmDisplay: document.getElementById('bpmDisplay'),
  loopToggle: document.getElementById('loopToggle'), //  追加
};

const synth = new Tone.PolySynth(Tone.Synth).toDestination();

const STATE = {
  currentNotes: [],
  keyElements: {},
  activeManualNotes: {},
};

// ==========================================
// 2. ユーティリティ関数(共通処理)
// ==========================================
function getSlotName(note) {
  return `note-${note.replace('#', 's')}`;
}

function stopScale() {
  Tone.Transport.stop();
  Tone.Transport.cancel(0);
  Tone.Transport.loop = false; // ループ状態も初期化
  synth.releaseAll();

  Object.values(STATE.keyElements).forEach((els) => {
    els.dot.classList.remove('active');
    els.highlight.classList.remove('active');
  });

  DOM.playBtn.textContent = '再生';
  DOM.playBtn.classList.remove('playing');
}

function findKeyElement(e) {
  const path = e.composedPath ? e.composedPath() : [];
  let keyEl = path.find((el) => el?.getAttribute && (el.getAttribute('part') || '').includes('key'));

  if (!keyEl && DOM.piano.shadowRoot) {
    const target = DOM.piano.shadowRoot.elementFromPoint(e.clientX, e.clientY);
    if (target) keyEl = target.closest('[part*="key"]');
  }
  return keyEl;
}

// ==========================================
// 3. 描画処理(下地の構築)
// ==========================================
function renderScale() {
  stopScale();
  DOM.piano.innerHTML = '';
  STATE.keyElements = {};

  const rootNode = DOM.rootSelect.value;
  const scaleType = DOM.scaleTypeSelect.value;
  const scale = Scale.get(`${rootNode} ${scaleType}`);

  const endNote = Note.transpose(rootNode, '8P');
  STATE.currentNotes = [...scale.notes, endNote];

  const degrees = [...scale.intervals.map((i) => i.replace(/[^0-9]/g, '')), '1'];

  STATE.currentNotes.forEach((note, index) => {
    const degree = degrees[index];
    const slotName = getSlotName(note);

    const highlight = document.createElement('div');
    highlight.className = 'key-highlight';
    highlight.setAttribute('slot', slotName);
    highlight.dataset.degree = degree;

    const dot = document.createElement('div');
    dot.className = 'dot';
    dot.setAttribute('slot', slotName);
    dot.textContent = degree;
    dot.dataset.degree = degree;

    DOM.piano.appendChild(highlight);
    DOM.piano.appendChild(dot);

    STATE.keyElements[note] = { dot, highlight };
  });
}

// ==========================================
// 4. 自動再生処理 (スケール)
// ==========================================
function scheduleUIAnimation(els, time, duration) {
  Tone.Draw.schedule(() => {
    els.dot.classList.add('active');
    els.highlight.classList.add('active');

    setTimeout(() => {
      if (els.dot.classList.contains('active')) {
        els.dot.classList.remove('active');
        els.highlight.classList.remove('active');
      }
    }, duration * 1000 * 0.8);
  }, time);
}

async function playScale() {
  await Tone.start();
  stopScale();

  Tone.Transport.bpm.value = DOM.bpmSlider.value;
  const noteDuration = '4n';

  STATE.currentNotes.forEach((note, index) => {
    const measure = Math.floor(index / 4);
    const beat = index % 4;
    const scheduleTime = `${measure}:${beat}:0`;

    Tone.Transport.schedule((time) => {
      const durationInSeconds = Tone.Time(noteDuration).toSeconds();
      synth.triggerAttackRelease(note, noteDuration, time);

      const els = STATE.keyElements[note];
      if (els) {
        scheduleUIAnimation(els, time, durationInSeconds);
      }
    }, scheduleTime);
  });

  // 終了タイミングの計算
  const totalMeasure = Math.floor(STATE.currentNotes.length / 4);
  const totalBeat = STATE.currentNotes.length % 4;
  const endTime = `${totalMeasure}:${totalBeat}:0`;

  //  追加:Tone.js のループ設定
  Tone.Transport.loop = DOM.loopToggle.checked;
  Tone.Transport.loopStart = '0:0:0';
  Tone.Transport.loopEnd = endTime;

  //  変更:ループしていない時「だけ」停止処理を呼び出す
  Tone.Transport.schedule((time) => {
    if (!Tone.Transport.loop) {
      Tone.Draw.schedule(() => {
        stopScale();
      }, time);
    }
  }, endTime);

  DOM.playBtn.textContent = '停止';
  DOM.playBtn.classList.add('playing');

  Tone.Transport.start();
}

async function togglePlay() {
  if (Tone.Transport.state === 'started') {
    stopScale();
  } else {
    await playScale();
  }
}

// ==========================================
// 5. 手動操作処理 (タップ・クリック)
// ==========================================
function playManualKey(e) {
  const keyElement = findKeyElement(e);
  if (!keyElement) {
    return;
  }

  const slot = keyElement.querySelector('slot');
  if (!slot) {
    return;
  }

  const pointerId = e.pointerId ?? 'mouse';
  const slotName = slot.getAttribute('name');
  const noteName = slotName.replace('note-', '').replace('s', '#');

  Tone.start().catch(() => {});

  if (STATE.activeManualNotes[pointerId]) {
    synth.triggerRelease(STATE.activeManualNotes[pointerId].noteName);
    STATE.activeManualNotes[pointerId].element.remove();
  }

  synth.triggerAttack(noteName);

  const manualHighlight = document.createElement('div');
  manualHighlight.className = 'key-highlight active';
  manualHighlight.setAttribute('slot', slotName);
  manualHighlight.style.backgroundColor = 'rgba(255, 235, 59, 0.6)';
  DOM.piano.appendChild(manualHighlight);

  STATE.activeManualNotes[pointerId] = {
    noteName: noteName,
    element: manualHighlight,
  };
}

function releaseManualKey(e) {
  const pointerId = e.pointerId ?? 'mouse';
  const activeNote = STATE.activeManualNotes[pointerId];

  if (activeNote) {
    synth.triggerRelease(activeNote.noteName);
    activeNote.element.remove();
    delete STATE.activeManualNotes[pointerId];
  }
}

// ==========================================
// 6. イベント登録と初期化
// ==========================================
DOM.rootSelect.addEventListener('change', renderScale);
DOM.scaleTypeSelect.addEventListener('change', renderScale);
DOM.playBtn.addEventListener('click', togglePlay);

DOM.bpmSlider.addEventListener('input', (e) => {
  const bpm = e.target.value;
  DOM.bpmDisplay.textContent = bpm;
  Tone.Transport.bpm.value = bpm;
});

//  追加:チェックボックスを操作した時に、再生中のシーケンサーに即座に教える
DOM.loopToggle.addEventListener('change', (e) => {
  Tone.Transport.loop = e.target.checked;
});

DOM.piano.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  playManualKey(e);
});
DOM.piano.addEventListener('pointerup', releaseManualKey);
DOM.piano.addEventListener('pointercancel', releaseManualKey);
DOM.piano.addEventListener('pointerout', releaseManualKey);

renderScale();
