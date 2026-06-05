
//import p5 from 'p5';


//window.p5 = p5;
//console.log(window.p5)
//console.log(p5)


const v = 360;





function setup() {
  createCanvas(v, v);
  colorMode(HSL, v, 1, 1);
}

function draw() {
  background(frameCount % v, 1, 0.5);
  //background(220);
}

Object.assign(window, {setup,draw})



/*
import p5 from 'p5';
console.log(window)

const sketch = (p) => {
  p.setup = () => {
    p.createCanvas(400, 400);
  };

  p.draw = () => {
    p.background(220);
    p.ellipse(50, 50, 80, 80);
  };
};

new p5(sketch);
*/

/*
import * as Tone from 'tone';
import { Scale, Note } from 'tonal';
import '@hsablonniere/musiq/mq-piano';

const piano = document.getElementById('piano');
const synth = new Tone.PolySynth(Tone.Synth).toDestination();

const rootSelect = document.getElementById('rootSelect');
const scaleTypeSelect = document.getElementById('scaleTypeSelect');
const playBtn = document.getElementById('playBtn');

let currentNotes = [];
let dotElements = {};

function getSlotName(note) {
  return `note-${note.replace('#', 's')}`;
}

// 画面にスケールの下地を描画する
function renderScale() {
  // ✨ 追加:セレクトボックスを変えた瞬間に、もし再生中なら音を止める
  Tone.Transport.stop();
  Tone.Transport.cancel(0);
  synth.releaseAll();

  piano.innerHTML = '';
  dotElements = {};

  const rootNode = rootSelect.value;
  const scaleType = scaleTypeSelect.value;

  const scale = Scale.get(`${rootNode} ${scaleType}`);

  // 終止音(1オクターブ上)を追加
  const endNote = Note.transpose(rootNode, '8P');
  currentNotes = [...scale.notes, endNote];

  // 度数の数字だけを抽出 ("1P" -> "1", "3M" -> "3")
  const degrees = [...scale.intervals.map((i) => i.replace(/[^0-9]/g, '')), '1'];

  currentNotes.forEach((note, index) => {
    const degree = degrees[index];

    const dot = document.createElement('div');
    dot.className = 'dot guide';
    dot.setAttribute('slot', getSlotName(note));
    dot.textContent = degree;

    // ✨ ここがポイント:CSSで色分けできるように data-degree を付与
    dot.dataset.degree = degree;

    piano.appendChild(dot);
    dotElements[note] = dot;
  });
}

async function playScale() {
  await Tone.start();

  // ✨ --- 追加:これまでの再生を完全にリセットする --- ✨
  Tone.Transport.stop(); // シーケンサー(全体タイマー)を停止
  Tone.Transport.cancel(0); // 予約されていた未来のスケジュールを全て破棄
  synth.releaseAll(); // 現在発音中の音を強制的に止める

  // UI(ドット)もすべて初期状態(グレーの下地)に戻す
  Object.values(dotElements).forEach((dot) => {
    dot.classList.remove('active');
    dot.classList.add('guide');
  });
  // ----------------------------------------------------

  const noteDuration = 0.5;

  // 予約を Tone.Transport に登録していく
  currentNotes.forEach((note, index) => {
    // Tone.now() ではなく、「再生開始から何秒後か(0, 0.5, 1.0...)」という相対時間を使います
    const scheduleTime = index * noteDuration;

    Tone.Transport.schedule((time) => {
      // 音を鳴らす
      synth.triggerAttackRelease(note, noteDuration, time);

      // UI(ドット)の更新
      Tone.Draw.schedule(() => {
        const dot = dotElements[note];
        if (dot) {
          // アクティブ状態にする
          dot.classList.remove('guide');
          dot.classList.add('active');

          // 音が鳴り終わる頃に戻す
          setTimeout(() => {
            // ※連打された時に古いタイマーが誤作動しないよう、現在アクティブな時だけ戻す
            if (dot.classList.contains('active')) {
              dot.classList.remove('active');
              dot.classList.add('guide');
            }
          }, noteDuration * 1000 * 0.8);
        }
      }, time);
    }, scheduleTime); // <- 指定した相対時間に実行されるよう予約
  });

  // ✨ 最後にシーケンサーをスタートして、予約した処理を一斉に開始! ✨
  Tone.Transport.start();
}
// イベントリスナー
rootSelect.addEventListener('change', renderScale);
scaleTypeSelect.addEventListener('change', renderScale);
playBtn.addEventListener('click', playScale);

// 初回描画
renderScale();
*/
