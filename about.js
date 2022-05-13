
var ejs = require('ejs');
var Logo = require('logo-wavepot');
var modal = require('modal');
var utils = require('./utils');
var createElement = utils.createElement;

var tmpl = {
  about: require('./about.html')
};

var about = module.exports = {};

about.show = show;
about.active = null;

function show(){
  if (about.active) return;

  // var fund = require('./fund');
  // if (fund.active) {
  //   fund.modal.once('hide', about.show.bind(about));
  //   fund.modal.hide();
  //   return;
  // }

  about.active = true;

  var el = createElement('about', 'modal');

  el.innerHTML = tmpl.about;

  var logo = new Logo(0.5);
  logo.svg.setAttribute('width', '310px');
  logo.svg.setAttribute('height', '210px');
  logo.svg.setAttribute('viewBox', '0 0 60 50');
  logo.svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  logo.pot.setAttribute('stroke-width', 2.75);
  logo.pot.setAttribute('stroke-linecap', 'butt');
  logo.wave.setAttribute('stroke-width', 2.75);
  logo.wave.setAttribute('stroke-linecap', 'butt');
  query('.about-logo').appendChild(logo.el);

  // query('a.fundraiser').onclick = function(ev){
  //   ev.preventDefault();
  //   fund.show('milestone I');
  //   return false;
  // };

  about.modal = modal(el)
    .overlay()
    .closeable()
    .effect('fade-and-scale')
    .show()
    .on('hide', function(){
      about.active = null;
    });

  function query(sel){
    return el.querySelector(sel);
  }
}
