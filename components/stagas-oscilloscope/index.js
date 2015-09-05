
/**
 * oscilloscope
 */

var raf = require('raf');

module.exports = Oscilloscope;

function Oscilloscope(opts){
  opts = opts || {};

  this.points = [];
  this.running = true;

  this.width = opts.width || 200;
  this.height = opts.height || 100;
  this.step = 1;
  this.zoom = 1;
  this.zero = (this.height / 2 | 0);

  this.el = document.createElement('div');
  this.el.className = 'oscilloscope';
  this.el.style.width = this.width + 'px';
  this.el.style.height = this.height + 'px';
  this.el.style.background = '#333';

  this.el.onmousedown = function(ev){
    ev.preventDefault();
    if (1 === ev.which) {
      this.running = !this.running;
    } else if (3 === ev.which) {
      this.step *= 2;
      if (this.step > 16) this.step = 1;
      this.points = [];
    }
    return false;
  }.bind(this);

  this.el.oncontextmenu = function(ev){
    ev.preventDefault();
  }.bind(this);

  this.el.onmousewheel = function(ev){
    ev.preventDefault();

    if (ev.wheelDelta < 0) {
      this.zoom -= this.zoom * 0.1;
    } else {
      this.zoom += this.zoom * 0.1;
    }

    this.zoom = Math.max(1, this.zoom);

    return false;
  }.bind(this);

  this.svg = createElement('svg');
  attrs(this.svg, {
    width: '100%',
    height: '100%'
  });
  this.el.appendChild(this.svg);

  this.zeroline = createElement('line');
  attrs(this.zeroline, {
    x1: 0,
    x2: this.width,
    y1: this.zero,
    y2: this.zero,
    stroke: '#444',
    'stroke-width': 1
  });
  this.svg.appendChild(this.zeroline);

  this.polyline = createElement('polyline');
  attrs(this.polyline, {
    fill: 'none',
    stroke: '#1fc',
    'stroke-width': 2
  });
  this.svg.appendChild(this.polyline);
}

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

Oscilloscope.prototype.resize = function(){
  var style = window.getComputedStyle(this.svg);
  this.width = parseInt(style.width);
  this.height = parseInt(style.height);
};

function attrs(el, obj){
  for (var key in obj) {
    el.setAttribute(key, obj[key]);
  }
}

function createElement(name){
  return document.createElementNS('http://www.w3.org/2000/svg', name);
}
