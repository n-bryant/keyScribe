'use strict'

/* VexTab */
const notationContainer = document.querySelector('.notation-container');
const Renderer = Vex.Flow.Renderer;
const renderer = new Renderer(notationContainer, Renderer.Backends.SVG);

// Initialize VexTab artist and parser.
const artist = new Artist(10, 10, 600, {scale: 0.8});
const vextab = new VexTab(artist);

let clef = 'treble';
let keySig = 'C';
let timeSig = '4/4';
let vexString = `tabstave notation=true clef=${clef} key=${keySig} time=${timeSig} tablature=false\n notes :16(C/4.E/4.G/4):8C/4E/4sG/4|:qsC/4:8C#/4F/4##|:hdD/4:qG/4`;

try {
  // Parse VexTab music notation passed in as a string.
  vextab.parse(vexString);

  // Render notation onto canvas.
  artist.render(renderer);
} catch (e) {
  console.log(e);
}

/* ToneJS */
// building of synths
let synths = {};
const keys = Array.from(document.querySelectorAll('.key'));
keys.forEach((key) => {
  let id = key.attributes['data-key'].value;
  synths[id] = {
    playing: false,
    synth: new Tone.Synth().toMaster(),
    tone: document.querySelector(`.key[data-key="${id}"] .note`).textContent.replace('/', '')
  }
});

window.addEventListener('keydown', () => {
  playTone(event, false);
});
window.addEventListener('keyup', () => {
  playTone(event, true);
});

function playTone(e, releasing) {
  const pianoKey = document.querySelector(`.key[data-key="${e.keyCode}"]`);
  if(!pianoKey) return;
  e.preventDefault();
  const synth = synths[e.keyCode].synth;
  const tone = synths[e.keyCode].tone;

  if (!releasing && !synths[e.keyCode].playing) {
    synths[e.keyCode].playing = true;
    pianoKey.classList.add('playing');
    synth.triggerAttack(tone);
  } else {
    synths[e.keyCode].playing = false;
    pianoKey.classList.remove('playing');
    synth.triggerRelease();
  }
}
