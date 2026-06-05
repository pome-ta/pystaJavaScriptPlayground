import * as Tone from 'tone';
import { Scale, Note } from 'tonal';
import '@hsablonniere/musiq/mq-piano';

const piano = document.getElementById('piano');
const synth = new Tone.PolySynth(Tone.Synth).toDestination();

const rootSelect = document.getElementById('rootSelect');
const scaleTypeSelect = document.getElementById('scaleTypeSelect');
const playBtn = document.getElementById('playBtn');

let currentNotes = [];
// ドットとハイライトの両方を保持できるようにする
let keyElements = {};

function getSlotName(note) {
  return `note-${note.replace('#', 's')}`;
}

function renderScale() {
  Tone.Transport.stop();
  Tone.Transport.cancel(0);
  synth.releaseAll();

  piano.innerHTML = '';
  keyElements = {};

  const rootNode = rootSelect.value;
  const scaleType = scaleTypeSelect.value;

  const scale = Scale.get(`${rootNode} ${scaleType}`);

  const endNote = Note.transpose(rootNode, '8P');
  currentNotes = [...scale.notes, endNote];

  const degrees = [...scale.intervals.map((i) => i.replace(/[^0-9]/g, '')), '1'];

  currentNotes.forEach((note, index) => {
    const degree = degrees[index];
    const slotName = getSlotName(note);

    // 鍵盤全体を覆うハイライト要素
    const highlight = document.createElement('div');
    highlight.className = 'key-highlight';
    highlight.setAttribute('slot', slotName);
    highlight.dataset.degree = degree;

    // ドット要素
    const dot = document.createElement('div');
    dot.className = 'dot';
    dot.setAttribute('slot', slotName);
    dot.textContent = degree;
    dot.dataset.degree = degree;

    // 両方をピアノのスロットに挿入
    piano.appendChild(highlight);
    piano.appendChild(dot);

    // 両方をセットにして保存
    keyElements[note] = { dot, highlight };
  });
}

async function playScale() {
  await Tone.start();

  Tone.Transport.stop();
  Tone.Transport.cancel(0);
  synth.releaseAll();

  // ドットとハイライトの両方をリセット
  Object.values(keyElements).forEach((els) => {
    els.dot.classList.remove('active');
    els.highlight.classList.remove('active');
  });

  const noteDuration = 0.5;

  currentNotes.forEach((note, index) => {
    const scheduleTime = index * noteDuration;

    Tone.Transport.schedule((time) => {
      synth.triggerAttackRelease(note, noteDuration, time);

      Tone.Draw.schedule(() => {
        const els = keyElements[note];
        if (els) {
          // ドットとハイライトの両方をアクティブに
          els.dot.classList.add('active');
          els.highlight.classList.add('active');

          setTimeout(() => {
            if (els.dot.classList.contains('active')) {
              els.dot.classList.remove('active');
              els.highlight.classList.remove('active');
            }
          }, noteDuration * 1000 * 0.8);
        }
      }, time);
    }, scheduleTime);
  });

  Tone.Transport.start();
}

rootSelect.addEventListener('change', renderScale);
scaleTypeSelect.addEventListener('change', renderScale);
playBtn.addEventListener('click', playScale);

// ==========================================
// 手動クリック(タップ)で弾く機能
// ==========================================
let activeManualNotes = {};

function playManualKey(e) {
  // 1. iOS対策: awaitを使わず、触った瞬間に「同期的に」叩き起こす!
  Tone.start();

  // pointerIdがない場合(古いブラウザ等)は 'mouse' にする
  const pointerId = e.pointerId !== undefined ? e.pointerId : 'mouse';

  // 2. スタック防止: 既にその指の記録が残っていたら、一度強制リセットする
  if (activeManualNotes[pointerId]) {
    synth.triggerRelease(activeManualNotes[pointerId].noteName);
    activeManualNotes[pointerId].element.remove();
    delete activeManualNotes[pointerId];
  }

  // 3. 要素の特定(iOS SafariのShadow DOMの仕様違いにも耐える堅牢な探し方)
  const path = e.composedPath ? e.composedPath() : [];
  let keyElement = path.find((el) => el && el.getAttribute && (el.getAttribute('part') || '').includes('key'));

  // 【最終奥義】もし見つからなければ、画面のタップ座標から直接Shadow DOMの中を貫通して探す
  if (!keyElement && piano.shadowRoot) {
    const target = piano.shadowRoot.elementFromPoint(e.clientX, e.clientY);
    if (target) {
      keyElement = target.closest('[part*="key"]');
    }
  }

  if (keyElement) {
    const slot = keyElement.querySelector('slot');
    if (!slot) return;

    const slotName = slot.getAttribute('name');
    const noteName = slotName.replace('note-', '').replace('s', '#');

    synth.triggerAttack(noteName);

    const manualHighlight = document.createElement('div');
    manualHighlight.className = 'key-highlight active';
    manualHighlight.setAttribute('slot', slotName);

    // 手動タップ用は分かりやすく黄色で光らせる
    manualHighlight.style.backgroundColor = 'rgba(255, 235, 59, 0.6)';

    piano.appendChild(manualHighlight);

    activeManualNotes[pointerId] = {
      noteName: noteName,
      element: manualHighlight,
    };
  }
}

function releaseManualKey(e) {
  const pointerId = e.pointerId !== undefined ? e.pointerId : 'mouse';
  const activeNote = activeManualNotes[pointerId];

  if (activeNote) {
    synth.triggerRelease(activeNote.noteName);
    activeNote.element.remove();
    delete activeManualNotes[pointerId];
  }
}

// iOSでの無駄なスクロールや拡大を止めるため preventDefault を必ず呼ぶ
piano.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  playManualKey(e);
});

piano.addEventListener('pointerup', releaseManualKey);
piano.addEventListener('pointercancel', releaseManualKey);
piano.addEventListener('pointerout', releaseManualKey);

renderScale();
