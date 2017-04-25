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
//create a synth and connect it to the master output (i.e. speakers)
var synth = new Tone.Synth().toMaster();

//play a middle 'C' for the duration of an 8th note
// synth.triggerAttackRelease("C4", "8n");
var keys = document.querySelectorAll('.key');