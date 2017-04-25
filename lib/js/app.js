'use strict';

/* VexTab */

var notationContainer = document.querySelector('.notation-container');
var Renderer = Vex.Flow.Renderer;
var renderer = new Renderer(notationContainer, Renderer.Backends.SVG);

// Initialize VexTab artist and parser.
var artist = new Artist(10, 10, 600, { scale: 0.8 });
var vextab = new VexTab(artist);

var clef = 'treble';
var keySig = 'C';
var timeSig = '4/4';
var vexString = 'tabstave notation=true clef=' + clef + ' key=' + keySig + ' time=' + timeSig + ' tablature=false\n notes :16(C/4.E/4.G/4):8C/4E/4sG/4|:qsC/4:8C#/4F/4##|:hdD/4:qG/4';

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
var synths = {};
var keys = Array.from(document.querySelectorAll('.key'));
keys.forEach(function (key) {
  var id = key.attributes['data-key'].value;
  synths[id] = {
    playing: false,
    synth: new Tone.Synth().toMaster(),
    tone: document.querySelector('.key[data-key="' + id + '"] .note').textContent.replace('/', '')
  };
});

window.addEventListener('keydown', function () {
  playTone(event, false);
});
window.addEventListener('keyup', function () {
  playTone(event, true);
});

function playTone(e, releasing) {
  var pianoKey = document.querySelector('.key[data-key="' + e.keyCode + '"]');
  if (!pianoKey) return;
  e.preventDefault();
  var synth = synths[e.keyCode].synth;
  var tone = synths[e.keyCode].tone;

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