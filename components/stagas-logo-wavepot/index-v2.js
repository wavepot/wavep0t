
module.exports = Logo;

function Logo(){
  this.el = document.createElement('div');
  this.svg = createElement('svg');

  attrs(this.svg, {
    width: '60px',
    height: '50px',
    style: 'border: 1px solid black'
  });
  this.el.appendChild(this.svg);

  this.pot = createElement('polyline');
  attrs(this.pot, {
    fill: 'none',
    stroke: '#000',
    'stroke-width': 2.7
  });
  this.svg.appendChild(this.pot);

  var points = [];
  var x, y;
  var offset = 30;
  var scale = 17;
  for (var t = -2; t < 2 * Math.PI; t += 0.05) {
    if (t < -0.3 || t > 3.4) continue;
    x = offset + (scale * Math.cos(t));
    y = offset - 11 + (scale * Math.sin(t));
    points.push(x + ',' + y);
  }

  this.pot.setAttribute('points', points.join(' '));

  this.wave = createElement('polyline');
  attrs(this.wave, {
    fill: 'none',
    stroke: '#000',
    'stroke-width': 2.7
  });
  this.svg.appendChild(this.wave);

  var points = [];
  var x, y;
  var offset = 19;
  var scale = 1.8;
  for (var t = -0.3; t < 9.8; t += 0.1) {
    y = offset + (scale * Math.sin(t));
    points.push(20 + (t * 2.1) + ',' + y);
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

