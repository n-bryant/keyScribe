'use strict';

(function () {
  'use strict';

  var keyscribeModule = function keyscribeModule() {

    function bindEvents() {
      window.addEventListener('keydown', playTone);
      window.addEventListener('keyup', releaseTone);
    }

    /* VexTab */
    var notationContainer = document.querySelector('.notation-container');
    var Renderer = Vex.Flow.Renderer;
    var renderer = new Renderer(notationContainer, Renderer.Backends.SVG);

    // initialize VexTab artist and parser.
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
    var synths = {};
    function buildKeys() {
      var keys = Array.from(document.querySelectorAll('.key'));
      keys.forEach(function (key) {
        var id = key.attributes['data-key'].value;
        synths[id] = {
          playing: false,
          synth: new Tone.Synth().toMaster(),
          tone: document.querySelector('.key[data-key="' + id + '"] .note').textContent.replace('/', '')
        };
      });
    }

    function playTone(e) {
      var keyElement = document.querySelector('.key[data-key="' + e.keyCode + '"]');
      if (!keyElement) return;
      e.preventDefault();

      var pianoKey = synths[e.keyCode];
      if (pianoKey.playing) return;
      pianoKey.playing = true;

      var synth = pianoKey.synth;
      var tone = pianoKey.tone;

      keyElement.classList.add('playing');
      synth.triggerAttack(tone);
    }

    function releaseTone(e) {
      var keyElement = document.querySelector('.key[data-key="' + e.keyCode + '"]');
      if (!keyElement) return;

      var pianoKey = synths[e.keyCode];
      var synth = pianoKey.synth;

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
  };

  var keyscribeApp = keyscribeModule();
  keyscribeApp.init();
})();