import * as Tone from 'tone';
import { Scale } from 'tonal';
import '@hsablonniere/musiq/mq-piano';

const piano = document.getElementById('piano');
const synth = new Tone.PolySynth(Tone.Synth).toDestination();

function highlightKey(note, duration) {
  const safeNote = note.replace('#', 's');
  const slotName = `note-${safeNote}`;

  const marker = document.createElement('div');
  marker.className = 'highlight-marker';
  marker.setAttribute('slot', slotName);

  marker.textContent = note.replace(/[0-9]/g, '');

  piano.appendChild(marker);

  setTimeout(() => {
    marker.remove();
  }, duration * 1000);
}

document.getElementById('playScaleBtn').addEventListener('click', async () => {
  await Tone.start();

  const scaleNotes = Scale.get('C major').notes;
  const notesToPlay = [...scaleNotes.map((n) => n + '4'), 'C5'];

  const now = Tone.now();
  const noteDuration = 0.5;

  notesToPlay.forEach((note, index) => {
    const time = now + index * noteDuration;

    synth.triggerAttackRelease(note, noteDuration, time);

    Tone.Draw.schedule(() => {
      highlightKey(note, noteDuration);
    }, time);
  });
});

/*
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded');
  document.body.appendChild(playButton);
});
*/
