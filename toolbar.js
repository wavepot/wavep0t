
var Oscilloscope = require('oscilloscope');
var Logo = require('logo-wavepot');
//var xgui = require('xgui');
var fund = require('./fund');
var about = require('./about');
var utils = require('./utils');
var createElement = utils.createElement;

var toolbar = module.exports = {};

toolbar.create = createToolbar;
toolbar.togglePause = togglePause;

function createToolbar(ctx){
  // toolbar
  toolbar.el = createElement('toolbar');

  toolbar.ctx = ctx;
/*
  toolbar.logo = createElement('logo');
  toolbar.logo.innerHTML = '\\<span class="underline">~</span>/';
*/
  toolbar.logo = new Logo;

  // play / pause
  toolbar.play = createElement('play', 'button icon-play');
  toolbar.pause = createElement('pause', 'button icon-pause hide');
  toolbar.stop = createElement('stop', 'button icon-stop');
  toolbar.record = createElement('record', 'button icon-record');
  toolbar.save = createElement('save', 'button icon-save right');
  toolbar.share = createElement('share', 'button icon-share right');
  toolbar.export = createElement('export', 'button icon-export right');
  toolbar.console = createElement('console', 'button icon-console right');
  toolbar.profile = createElement('profile', 'button icon-profile right');
  toolbar.info = createElement('info', 'button icon-info right');
  toolbar.menu = createElement('menu', 'button icon-menu right');

  toolbar.play.title =
  toolbar.pause.title = 'super + enter = toggle pause\nsuper + shift + enter = play from start';

  // oscilloscope
  toolbar.oscilloscope = new Oscilloscope({
    width: 165,
    height: 50
  });
  toolbar.oscilloscope.el.title = 'left click : toggle\nright click : resolution\nwheel : zoom';
  toolbar.oscilloscope.step = 8;
/*
  // master volume
  var gui = new xgui({
    width: 35,
    height: 50,
    backgroundColor: '#59584E',
    frontColor: '#A0D92E',
    dimColor: '#aaa', //#2F3129'
  });

  gui.el = gui.getDomElement();
  gui.el.title = 'master volume\nright click : (un)mute';
  gui.el.oncontextmenu = function(ev){
    ev.preventDefault();
    if (toolbar.volume.mute && toolbar.volume.value.v === 0) {
      toolbar.volume.value.v = toolbar.volume.previous;
      toolbar.volume.mute = false;
    } else {
      toolbar.volume.previous = toolbar.volume.value.v;
      toolbar.volume.value.v = 0;
      toolbar.volume.mute = true;
    }
    toolbar.volume.draw();
    toolbar.volume.value.updateBind();
    return false;
  };

  toolbar.volume = new gui.VSlider({
    x: 10,
    y: 10,
    max: 100,
    value: dsp.volume,
    width: 15,
    height: 30,
    hideValue: true
  });

  toolbar.volume.value.bind(dsp, 'volume');
*/

/*
  toolbar.volume = new gui.Knob({
    x: 10,
    y: 9,
    radius: 15,
    value: 65,
    min: 0,
    max: 100
  });
*/

  toolbar.oscilloscope.el.classList.add('right');

  toolbar.el.appendChild(toolbar.logo.el);
  //toolbar.el.appendChild(gui.el);
  toolbar.el.appendChild(toolbar.play);
  toolbar.el.appendChild(toolbar.pause);
  toolbar.el.appendChild(toolbar.stop);
  toolbar.el.appendChild(toolbar.record);
  toolbar.el.appendChild(toolbar.menu);
  toolbar.el.appendChild(toolbar.oscilloscope.el);
  /*
  toolbar.el.appendChild(toolbar.console);
  toolbar.el.appendChild(toolbar.share);
  toolbar.el.appendChild(toolbar.export);
  toolbar.el.appendChild(toolbar.save);
  */
  //toolbar.el.appendChild(toolbar.profile);
  //toolbar.el.appendChild(toolbar.info);

  toolbar.logo.el.onclick = about.show.bind(about);

  toolbar.play.onclick =
  toolbar.pause.onclick = togglePause;
  toolbar.stop.onclick = function(){
    ctx.stop();
    toolbar.play.classList.remove('hide');
    toolbar.pause.classList.add('hide');
  };

  toolbar.record.onclick = fund.show.bind(fund, 'milestone I');
  toolbar.menu.onclick = fund.show.bind(fund, 'milestone I');
  /*toolbar.smiley.onclick =
  toolbar.record.onclick =
  toolbar.save.onclick = fundlist.show;*/
}

function togglePause(){
  var ctx = toolbar.ctx;

  if (ctx.playing) {
    ctx.pause();
  } else {
    ctx.play();
  }

  if (ctx.playing) {
    toolbar.play.classList.add('hide');
    toolbar.pause.classList.remove('hide');
  } else {
    toolbar.play.classList.remove('hide');
    toolbar.pause.classList.add('hide');
  }
}
