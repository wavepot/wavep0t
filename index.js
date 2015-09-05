
/**
 * webaudio-daw
 */

var fork = require('worker-fork');
var preload = require('load-image');

var bufferSize = 4096;

if (fork.isMaster) master();
else worker();

function master(){
  /**
   * disable backspace leave page.
   * TODO: make module
   */
  var rx = /INPUT|SELECT|TEXTAREA/i;

  document.body.addEventListener('keydown', function(ev){
    if (8 === ev.which) { // backspace
      if (!rx.test(ev.target.tagName) || ev.target.disabled || ev.target.readOnly) {
        ev.preventDefault();
      }
    }
  });

  preload('/wavepot/img/bitcoin_32.png', function(){});
  preload('/wavepot/img/dogecoin_32.png', function(){});

  var bufferMax = 6;
  var bufferQueue = [];

  var k = require('k')(window);
  k.ignore = false;
  k('super + enter', function(ev){
    ev.preventDefault();
    toolbar.togglePause();
    return false;
  });

  k('super + shift + enter', function(ev){
    ev.preventDefault();
    ctx.stop();
    toolbar.togglePause();
    return false;
  });

  var debounce = require('debounce');
  var Sublime = require('./sublime');
  var toolbar = require('./toolbar');
  var sidebar = require('./sidebar');
  var fund = require('./fund');

  var dsp = require('webaudio-dsp');
  var ctx = dsp(bufferSize, process);
  var sampleRate = ctx.audio.sampleRate;

  var child = fork('/build.js', 'wavepot');

  toolbar.create(ctx);
  document.body.appendChild(toolbar.el);

  sidebar.create(ctx);

  var sublime = ctx.sublime = Sublime();
  setTimeout(function(){ // prevents flash of unstyled ace
    document.body.appendChild(sublime.el);
    document.body.appendChild(sidebar.el);
  }, 500);
  //oscilloscope.polyline.setAttribute('stroke', '#A6E22E');

  ctx.isNewProject = true;

  var session = sublime.editor.getSession();
  session.setMode('ace/mode/javascript');
  session.setTabSize(2);
  session.setUseWorker(true);
  session.on('change', debounce(onchange, 500));
  session.on('change', debounce(function(){
    if (ctx.isNewProject) {
      ctx.isNewProject = false;
      ctx.hasEdited = false;
      window.onbeforeunload = function(){};
      return;
    }
    ctx.hasEdited = true;
    window.onbeforeunload = function(){
      return 'You\'ve made some edits!\n\nIf you leave you will lose everything!';
    };
  }, 50));

  child.on('message', function(b){
    var buffer = new Float32Array(b);
    bufferQueue.push(buffer);
  });

  ctx.on('stop', onstop);

  send('bufferSize', bufferSize);
  send('sampleRate', ctx.audio.sampleRate);

  function onchange(){
    var src = session.getValue();
    send('compile', src);
  }

  function onstop(){
    bufferQueue = [];
    send('resetFrame');
  }

  function send(cmd, param){
    child.send({ cmd: cmd, param: param });
  }

  function process(L, R, len){
    play(L, R, len);
  }

  function next(){
    if (bufferQueue.length < bufferMax) send('bufferAhead');
    return bufferQueue.shift();
  }

  function play(L, R){
    var samples = next();
    if (!samples) return;

    L.set(samples, 0);
    R.set(samples, 0);

    display(samples);
  }

  var timeouts = [];
  var timeoutDelay = 1024 / (sampleRate / 1000);

  function display(buffer){
    for (var i = 0; i < bufferSize / 1024; i++) {
      clearTimeout(timeouts[i]);
      timeouts[i] = setTimeout(function(i){
        var pos = i * 1024;
        var buf = buffer.subarray(pos, pos + 1024);
        toolbar.oscilloscope.render(buf);
      }, timeoutDelay * i, i);
    }
  }

  //session.setValue(demo.toString().split('\n').slice(1, -1).join('\n'));
}

function worker(){
  var err = null;
  var ok = true;
  var fn = function(){ return 0 };
  var lastFn = fn;
  var sample;

  var time = 0, frame = 0;
  var volume = 100;
  var sampleRate;
  var bufferSize;

  fork.on('message', function(msg){
    switch (msg.cmd) {
      case 'compile': return compile(msg.param);
      case 'resetFrame': return (frame = 0);
      case 'bufferSize': return (bufferSize = msg.param);
      case 'sampleRate': return (sampleRate = msg.param);
      case 'bufferAhead': return bufferAhead();
    }
  });

  function bufferAhead(){
    var floats = new Float32Array(bufferSize);

    for (var i = 0, len = bufferSize; i < len; i++, frame++) {
      time = frame / sampleRate;
      floats[i] = fn(time, frame) * Math.pow(volume / 100, 3);
    }

    fork.send(floats.buffer, [floats.buffer]);
  }

  function compile(src){
    try {
      // wrap
      src =
          'var sampleRate = ' + sampleRate + ';\n'
        + src
        + ';\nreturn dsp;\n';

      // compile
      fn = Function(src)();

      // test a sample
      sample = Number(fn(0,0));

      if (isNaN(sample)) err = new Error('sample is NaN');
      else if (Math.abs(sample) === Infinity) err = new Error('sample is Infinity');

      if (!err) {
        if (!ok) console.log('dsp function compiled');
        ok = true;
        lastFn = fn;
        return;
      }

      if (ok) throw err;
    } catch(e) {
      if (ok) console.error(e.stack);
    }

    err = null;
    ok = false;
    fn = lastFn;
  }
}

/*
fundlist.create();
document.body.appendChild(fundlist.el);

fundlist.makeModal();
*/
//fund.show('project saving & sharing');

/*fund.modal.on('hide', function(){
  setTimeout(function(){
    fund.modal.show();
  }, 1000);
})*/
/*
setTimeout(function(){
  fund.modal.show();
}, 500);*/
