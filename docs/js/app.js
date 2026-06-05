import * as Tone from 'tone';
import { Scale, Note } from 'tonal';
import '@hsablonniere/musiq/mq-piano';

const piano = document.getElementById('piano');
const synth = new Tone.PolySynth(Tone.Synth).toDestination();

const rootSelect = document.getElementById('rootSelect');
const scaleTypeSelect = document.getElementById('scaleTypeSelect');
const playBtn = document.getElementById('playBtn');

let currentNotes = [];
// ✨ 修正:ドットとハイライトの両方を保持できるようにする
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

    // ✨ 新規追加:鍵盤全体を覆うハイライト要素
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

  // ✨ 修正:ドットとハイライトの両方をリセット
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
          // ✨ 修正:ドットとハイライトの両方をアクティブに
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
// ✨ 手動クリック(タップ)で弾く機能 ✨
// ==========================================

// 指を離した時に音とハイライトを消すため、現在押している音を記録しておく変数
let activeManualNotes = {};

piano.addEventListener('pointerdown', async (e) => {
  // ブラウザのデフォルトの動作(スクロールなど)を少し防ぐ
  e.preventDefault();
  await Tone.start();

  // e.composedPath() で、クリックされた要素の「奥底」まで覗き見する
  const path = e.composedPath();

  // 触った要素の中から「part属性に "key" が含まれるもの(=鍵盤そのもの)」を探す
  const keyElement = path.find((el) => el.part && el.part.contains('key'));

  if (keyElement) {
    // 鍵盤の中には <slot name="note-C4"> のような要素が必ず入っているので、それを見つける
    const slot = keyElement.querySelector('slot');
    if (!slot) return;

    // "note-C4" などの名前を取得
    const slotName = slot.getAttribute('name');

    // Tone.jsが読める音名("C4"や"C#4")に変換する
    const noteName = slotName.replace('note-', '').replace('s', '#');

    // 1. 音を鳴らし始める(指を離すまで鳴り続ける)
    synth.triggerAttack(noteName);

    // 2. 光らせるためのハイライト要素をその場で作る
    const manualHighlight = document.createElement('div');
    manualHighlight.className = 'key-highlight active';
    manualHighlight.setAttribute('slot', slotName);

    // スケールの色指定を無視して、手動クリック用は分かりやすく「黄色(または白)」などで光らせる
    manualHighlight.style.backgroundColor = 'rgba(255, 235, 59, 0.5)';
    // manualHighlight.style.zIndex = '2'; // スケールのハイライトより上に表示

    piano.appendChild(manualHighlight);

    // 指を離した時に消せるように保存しておく
    activeManualNotes[e.pointerId] = {
      noteName: noteName,
      element: manualHighlight,
    };
  }
});

// 指を離した時(またはポインターが画面外に外れた時)の処理
function handlePointerUp(e) {
  const activeNote = activeManualNotes[e.pointerId];
  if (activeNote) {
    // 音を止める
    synth.triggerRelease(activeNote.noteName);

    // ハイライト要素を消す
    activeNote.element.remove();

    // 記録から削除
    delete activeManualNotes[e.pointerId];
  }
}

piano.addEventListener('pointerup', handlePointerUp);
piano.addEventListener('pointercancel', handlePointerUp);
// 鍵盤を押したまま外にスライドした時も止める
piano.addEventListener('pointerout', handlePointerUp);

renderScale();
