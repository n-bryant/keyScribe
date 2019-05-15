(function () {
  'use strict';

  const keyscribeModule = function keyscribeModule() {

    const renderScoreBtn = document.querySelector('.render-score-btn');
    function bindEvents() {
      window.addEventListener('keydown', playTone);
      window.addEventListener('keyup', releaseTone);
      renderScoreBtn.addEventListener('click', convertToVex);
    }

    /* VexTab */
    const notationWrapper = document.querySelector('.notation-wrapper');
    const notationContainer = document.querySelector('.notation-container');
    const Renderer = Vex.Flow.Renderer;
    const renderer = new Renderer(notationContainer, Renderer.Backends.SVG);

    // initialize VexTab artist and parser.
    const artist = new Artist(10, 10, 600, { scale: 0.8 });
    const vextab = new VexTab(artist);

    let bpm = 120;
    let minBeat;
    let clef = 'treble';
    let keySig = 'C';
    let timeSig = '4/4';
    let vexString = 'tabstave notation=true clef=' + clef + ' key=' + keySig + ' time=' + timeSig + ' tablature=false\n notes ';
    let notes = [];
    let noteIndex = 0;
    let vexNotes = '';
    // let vexNotes = ':16(C/4.E/4.G/4):8C/4E/4sG/4|:qsC/4:8C#/4F/4##|:hdD/4:qG/4';
    const keySignatures = {
      flatKeys: {
        name: [/*list of flatted notes*/]
      },
      sharpKeys: {
        name: [/*list of sharped notes*/]
      }
    };

    /* ToneJS */
    let synths = {};
    function buildKeys() {
      let keys = Array.from(document.querySelectorAll('.key'));
      keys.forEach(function (key) {
        let id = key.attributes['data-key'].value;
        synths[id] = {
          playing: false,
          synth: new Tone.Synth().toMaster(),
          tone: document.querySelector('.key[data-key="' + id + '"] .note').textContent.replace('/', ''),
          duration: {
            start: null,
            stop: null
          }
        };
      });
    }

    // adds a note's values to the notes array for later comparison
    function addToNotesArr(val, dur, beats) {
      const tempObj = {
        tone: val.tone,
        start: val.duration.start,
        stop: val.duration.stop,
        dur: dur,
        beats: beats.beats,
        notation: beats.notation
      }
      notes.push(tempObj);
    }

    // add values to current score
    function addNoteToScore(str) {
      vexNotes += str;
      /**
       * Need to sort notes alphabetically and by octave
       * Bad - ":hd(C/5.E/4.G/4"
       * Bad - ":hd(C/4.G/4.E/4"
       * Good - ":hd(C/4.E/4.G/4.C/5)"
       */
      console.log(vexNotes);
    }

    // iterates over notes array and converts element values into a vex appropriate string of notes
    function convertToVex() {
      notes.forEach((note, index) => {
        let tempStr;
        const prevNote = notes[index - 1];

        // parse note's tone value to match key signature
        convertToKeySig(index);

        // check if note is part of a chord
        const chordPos = isChordNote(index);
        // check if note is part of a slur
        const slur = isSlurNote(index);

        // create appropriate vex string
        if (!chordPos) {
          if (index === 0 || note.notation !== prevNote.notation) {
            tempStr = `${note.notation}${note.tone}`;
          } else {
            tempStr = `${note.tone}`;
          }
        } else {  // need to sort notes in chord alphabetically in order to avoid issue found here (https://github.com/0xfe/vexflow/issues/104)
          if (chordPos === 'start') {
            tempStr = `${note.notation}(${note.tone}.`;
          } else if (chordPos === 'end') {
            tempStr = `${note.tone})`;
          } else {
            tempStr = `${note.tone}.`;
          }
        }

        // add note's vex string value to vexNotes
        addNoteToScore(tempStr);
      });
      renderVex();
    }

    // parse given string of notes to match sharps and flats of current key signature
    function convertToKeySig(i) {
      const tone = notes[i].tone;
      // strip out accidentals based on key signature

      // add '/' before octave
      const octaveIndex = tone.length - 1;
      notes[i].tone = tone.substr(0, octaveIndex).concat('/').concat(tone.substr(octaveIndex));
    }

    // set beat value of note based on specified bpm and time signature
    function evaluateNote(note) {
      const toneVal = note.tone;
      let msNoteDur = note.duration.stop - note.duration.start;
      let msPerBeat;
      if (bpm > 140) {
        msPerBeat = 60000 / (bpm / 2);
        msNoteDur = msNoteDur / 2;
      } else if (bpm < 60) {
        msPerBeat = 60000 / (bpm * 2);
        msNoteDur = msNoteDur * 2;
      } else {
        msPerBeat = 60000 / bpm;
      }

      let beatVals = [
        {beats: '4', notation: ':w', msDur: msPerBeat * 4},
        {beats: '3', notation: ':hd', msDur: (msPerBeat * 2) + msPerBeat},
        {beats: '2', notation: ':h', msDur: msPerBeat * 2},
        {beats: '1.5', notation: ':hq', msDur: msPerBeat + (msPerBeat / 2)},
        {beats: '1', notation: ':q', msDur: msPerBeat},
        {beats: '.75', notation: ':8d', msDur: (msPerBeat / 2) + (msPerBeat / 4)},
        {beats: '.5', notation: ':8', msDur: msPerBeat / 2},
        {beats: '.25', notation: ':16', msDur: msPerBeat / 4}
      ];
      minBeat = beatVals[beatVals.length - 1].msDur;
      if (timeSig === '3/4') {
        beatVals.splice(0, 1);
      }

      // find the closest value in beatVals to msNoteDur
      const noteLength = getClosestBeatValue(beatVals, msNoteDur);
      // account for exceeding beats in a measure
      validateMeasureLength();

      addToNotesArr(note, msNoteDur, noteLength);

      noteIndex++;
    }

    function getClosestBeatValue(options, duration) {
      let curr = options[0];
      let diff = Math.abs(duration - curr.msDur);
      for (let i = 0; i < options.length; i++) {
        let newDiff = Math.abs(duration - options[i].msDur);
        if (newDiff < diff) {
          diff = newDiff;
          curr = options[i];
        }
      }
      return curr;
    }

    // checks if current note's starting value and previous note's starting values are closer together than the smallest beat value
    function isChordNote(i) {
      const firstNote = notes[0];
      const finalNote = notes[notes.length - 1];
      const currNote = notes[i];
      const prevNote = notes[i - 1];
      const nextNote = notes[i + 1];

      if (notes.length > 1) {
        if (i === 0) {
          if (nextNote.start - firstNote.start < minBeat) {
            return 'start';
          } else {
            return false;
          }
        } else if (i === notes.length - 1) {
          if (finalNote.start - prevNote.start < minBeat) {
            return 'end';
          } else {
            return false;
          }
        } else {
          if (nextNote.start - currNote.start < minBeat || currNote.start - prevNote.start < minBeat) {
            if (currNote.start - prevNote.start >= minBeat) {
              return 'start';
            } else if (nextNote.start - currNote.start >= minBeat) {
              return 'end';
            } else {
              return 'middle';
            }
          } else {
            return false;
          }
        }
      } else {
        return false;
      }
    }

    // determine if a note is a slurred note
    function isSlurNote(i) {

    }

    // play and release tones on keypress/keyup
    function playTone(e) {
      const keyElement = document.querySelector('.key[data-key="' + e.keyCode + '"]');
      if (!keyElement) return;
      e.preventDefault();

      let pianoKey = synths[e.keyCode];
      if (pianoKey.playing) return;
      pianoKey.playing = true;
      pianoKey.duration.start = Date.now();

      const synth = pianoKey.synth;
      const tone = pianoKey.tone;

      keyElement.classList.add('playing');
      Tone.context.resume().then(() => {
        synth.triggerAttack(tone);
      });
    }

    function releaseTone(e) {
      const keyElement = document.querySelector('.key[data-key="' + e.keyCode + '"]');
      if (!keyElement) return;

      let pianoKey = synths[e.keyCode];
      const synth = pianoKey.synth;
      pianoKey.duration.stop = Date.now();

      keyElement.classList.remove('playing');
      Tone.context.resume().then(() => {
        synth.triggerRelease();
      });
      pianoKey.playing = false;
      evaluateNote(pianoKey);
    }

    function renderVex() {
      if (vexNotes !== '') {
        try {
          // Parse VexTab music notation passed in as a string.
          vextab.parse(vexString.concat(vexNotes));

          // Render notation onto canvas.
          artist.render(renderer);
        } catch (e) {
          console.log(e);
        }
        notationWrapper.classList.remove('is-hidden');
      } else {
        // give feedback to user telling them to play something first
      }
    }

    function validateMeasureLength() {
      // if curr msNoteDur >= (measureDurMax + (msPerBeat/4))
        // split into two notes, put second note into new measure, and tie them together
    }

    function init() {
      bindEvents();
      buildKeys();
    }

    return {
      init: init
    };
  };

  const keyscribeApp = keyscribeModule();
  keyscribeApp.init();
})();



// // solution?
// const vStr = 'pre(G/4.D/3.B/4)after';

// // find start and end of chord
// const cStart = vStr.indexOf('(');
// const cEnd = vStr.indexOf(')');

// const chordStr = vStr.substring(cStart + 1, cEnd);
// const sortedChordStr = sortChordStr(chordStr);

// // split items in chord string and sort them
// function sortChordStr(str) {
//   let tempArr = [];
//   let index = 0;

//   // split chord string into separate notes
//   for (let i = 0; i < str.length; i++) {
//     if (str.charAt(i) === '.' || i === str.length - 1) {
//       let note;
//       if (i === str.length - 1) {
//         note = str.substring(index, i + 1);
//       } else {
//         note = str.substring(index, i);
//         index = i + 1;
//       }
//       tempArr.push(note);
//     }
//   }

//   // sort separated notes and add dots
//   tempArr = tempArr.sort();
//   for (let i = 0; i < tempArr.length; i++) {
//     if (i % 2 !== 0) {
//       tempArr.splice(i, 0, '.');
//     }
//   }

//   return tempArr.join('');
// }
