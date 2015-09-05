
module.exports = Logo;

function Logo(expandSine){
  this.el = document.createElement('div');
  this.el.id = 'logo';
  this.svg = createElement('svg');

  var color = '#61CCE0';
  var stroke = 2.6;

  attrs(this.svg, {
    width: '60px',
    height: '50px'
  });
  this.el.appendChild(this.svg);

  this.pot = createElement('polyline');
  attrs(this.pot, {
    fill: 'none',
    stroke: color,
    'stroke-width': stroke,
    'stroke-linecap': 'round'
  });
  this.svg.appendChild(this.pot);

  var points = [];
  var x, y;
  var offset = 30;
  var scale = 11.5;
  for (var t = -0.50; t < 3.65; t += 0.01) {
    x = offset + (scale * Math.cos(t));
    y = offset - 8 + (scale * Math.sin(t));
    points.push(x + ',' + y);
  }

  this.pot.setAttribute('points', points.join(' '));

  this.wave = createElement('polyline');
  attrs(this.wave, {
    fill: 'none',
    stroke: color,
    'stroke-width': stroke,
    'stroke-linecap': 'round'
  });
  this.svg.appendChild(this.wave);

  var points = [];
  var x, y;
  var offset = 21.5;
  var scale = 1.2;
  expandSine = expandSine || 0;
  for (var t = 3.3 - expandSine; t < 9.2 + expandSine; t += 0.1) {
    y = offset + (scale * Math.sin(t));
    points.push(18.7 + (t * 1.8) + ',' + y);
  }

  this.wave.setAttribute('points', points.join(' '));
}

/*
Oscilloscope.prototype.render = function(samples, step, zoom){
  if (!this.running) return;

  step = step || this.step || 1;
  zoom = zoom || this.zoom || 1;

  var slen = samples.length / zoom;
  if (slen != this.points.length) {
    this.points.length = slen | 0;
  }

  for (var i = 0; i < slen; i += step) {
    var s = samples[i];
    var x = this.width * (i / slen);
    var y = (1 + s) / 2 * this.height;
    this.points[i] = x + ',' + y;
  }

  var polyline = this.polyline;
  var points = this.points.join(' ');

  raf(function(){
    polyline.setAttribute('points', points);
  });
};
*/
function attrs(el, obj){
  for (var key in obj) {
    el.setAttribute(key, obj[key]);
  }
}

function createElement(name){
  return document.createElementNS('http://www.w3.org/2000/svg', name);
}

