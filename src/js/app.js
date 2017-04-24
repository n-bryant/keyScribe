'use strict'

/* VexTab */
const notationContainer = document.querySelector('.notation-container');
const Renderer = Vex.Flow.Renderer;

const renderer = new Renderer(notationContainer, Renderer.Backends.SVG);

// Initialize VexTab artist and parser.
const artist = new Artist(10, 10, 600, {scale: 0.8});
const vextab = new VexTab(artist);

try {
    // Parse VexTab music notation passed in as a string.
    vextab.parse("tabstave notation=true clef=treble key=F time=4/4 tablature=false\n notes :16(C/4.E/4.G/4):8C/4E/4sG/4|:qsC/4:8E/4F/4##|:hdD/4:qG/4");

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
