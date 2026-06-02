import * as Tone from 'tone';

const synth = new Tone.Synth().toDestination();

const playButton = document.createElement('button');
playButton.textContent = 'play';

playButton.addEventListener('click', () => {
  //play a middle 'C' for the duration of an 8th note
  const now = Tone.now();
  // trigger the attack immediately
  synth.triggerAttack('C4', now);
  // wait one second before triggering the release
  synth.triggerRelease(now + 1);
});

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded');
  document.body.appendChild(playButton);
});
