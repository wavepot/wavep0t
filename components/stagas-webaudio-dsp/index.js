
/**
 * webaudio-dsp
 */

var emitter = require('emitter');
var process = require('audio-process');

exports = module.exports = function(bufferSize, fn){
  var audio = typeof webkitAudioContext !== 'undefined'
    ? new webkitAudioContext
    : new AudioContext();

  var sampleRate = audio.sampleRate;

  var empty = new Float32Array(bufferSize);

  var node = process(audio, bufferSize, function(L, R, len){
    if (!context.playing) {
      L.set(empty, 0);
      R.set(empty, 0);
      return;
    }

    fn(L, R, len);
  });

  // ugly, but keeps the event loop running
  // otherwise audio freezes
  setTimeout(function(){
    alert('should not fire');
  }, 31536000000);

  var context = emitter({
    audio: audio,
    node: node,
    play: function(){
      node.connect(audio.destination);
      this.playing = true;
      this.emit('play');
    },
    pause: function(){
      this.playing = false;
      this.emit('pause');
    },
    stop: function(){
      this.playing = false;
      this.emit('stop');
    },
    playing: false
  });

  return context;
};
