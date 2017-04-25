(function() {
  'use strict'
  
  const keyscribeModule = function() {

    function bindEvents() {
      window.addEventListener('keydown', playTone);
      window.addEventListener('keyup', releaseTone);
    }

    /* VexTab */
    const notationContainer = document.querySelector('.notation-container');
    const Renderer = Vex.Flow.Renderer;
    const renderer = new Renderer(notationContainer, Renderer.Backends.SVG);

    // initialize VexTab artist and parser.
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
    let synths = {};
    function buildKeys() {
      const keys = Array.from(document.querySelectorAll('.key'));
      keys.forEach((key) => {
        let id = key.attributes['data-key'].value;
        synths[id] = {
          playing: false,
          synth: new Tone.Synth().toMaster(),
          tone: document.querySelector(`.key[data-key="${id}"] .note`).textContent.replace('/', '')
        }
      });
    }

    function playTone(e) {
      const keyElement = document.querySelector(`.key[data-key="${e.keyCode}"]`);
      if(!keyElement) return;
      e.preventDefault();

      const pianoKey = synths[e.keyCode];
      if (pianoKey.playing) return;
      pianoKey.playing = true;

      const synth = pianoKey.synth;
      const tone = pianoKey.tone;

      keyElement.classList.add('playing');
      synth.triggerAttack(tone);
    }

    function releaseTone(e) {
      const keyElement = document.querySelector(`.key[data-key="${e.keyCode}"]`);
      if(!keyElement) return;

      const pianoKey = synths[e.keyCode];
      const synth = pianoKey.synth;

      keyElement.classList.remove('playing');
      synth.triggerRelease();
      pianoKey.playing = false;
    }

    function init() {
      bindEvents();
      buildKeys();
    }

    return {
      init: init
    };
  }

  const keyscribeApp = keyscribeModule();
  keyscribeApp.init();
})();
