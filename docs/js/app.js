import * as Tone from 'tone';
import { QwertyHancock } from 'qwerty-hancock';

const synth = new Tone.Synth().toDestination();

const playButton = document.createElement('button');
playButton.textContent = 'play';

playButton.addEventListener('click', () => {
  const now = Tone.now();
  synth.triggerAttackRelease('C4', '8n', now);
  synth.triggerAttackRelease('E4', '8n.', now + 0.5);
  synth.triggerAttackRelease('G4', '8t', now + 1);
  synth.triggerAttackRelease('B4', '8n', now + 1.5);
});

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded');
  document.body.appendChild(playButton);
});



/*
const synth = new Tone.PolySynth(Tone.Synth).toDestination();

    // Qwerty Hancock keyboard setup
    const keyboard = new QwertyHancock({
      id: 'keyboard',
      width: 600,
      height: 150,
      octaves: 3,
      startNote: 'C4',
      whiteNotesColour: '#fff',
      blackNotesColour: '#000',
      hoverColour: '#f3e5f5'
    });

    // Wire the keyboard to Tone.js
    keyboard.keyDown = (note, frequency) => {
      // Trigger attack when a key is pressed
      synth.triggerAttack(note);
    };

    keyboard.keyUp = (note, frequency) => {
      // Trigger release when a key is released
      synth.triggerRelease(note);
    };
*/
