
var ejs = require('ejs');
var modal = require('modal');
var utils = require('./utils');
var createElement = utils.createElement;
var createElementNS = utils.createElementNS;
var attrs = utils.attrs;

var tmpl = {
  fund: require('./fund.html')
};

var fund = module.exports = {};

fund.campaigns = require('./campaigns');
fund.show = show;
fund.active = null;

function show(name){
  if (name == fund.active) return;

  if (fund.active) {
    fund.modal.once('hide', fund.show.bind(fund, name));
    fund.modal.hide();
    return;
  }

  var about = require('./about');
  if (about.active) {
    about.modal.once('hide', fund.show.bind(fund, name));
    about.modal.hide();
    return;
  }

  fund.active = name;

  var el = createElement('fund', 'modal');

  var campaign;
  fund.campaigns.forEach(function(c){
    if (name === c.name) {
      campaign = c;
    }
  });

  el.innerHTML = ejs.render(tmpl.fund, { c: campaign });

  var progress = el.querySelector('.pledge-progress');
  var svg = createWave(campaign.percentage);
  progress.appendChild(svg);

  /*var buttons = el.querySelector('.pledge-buttons');
  buttons.querySelector('.pledge-bitcoin').onclick = onpledge;
  buttons.querySelector('.pledge-dogecoin').onclick = onpledge;*/

  function each(nodes, fn){
    [].slice.call(nodes).forEach(fn);
  }

  each(queryAll('.pledge-alter-bitcoin'), function(node){
    node.onclick = alter('bitcoin');
  });
  each(queryAll('.pledge-alter-dogecoin'), function(node){
    node.onclick = alter('dogecoin');
  });
  each(queryAll('.pledge-alter-paypal'), function(node){
    node.onclick = alter('paypal');
  });

  var details = query('.pledge-details');

  query('.pledge-show-info').onclick = function(){
    query('.fund-info').classList.remove('hide');
    query('.fund-campaign').classList.add('hide');
    return false;
  };

  query('.pledge-hide-info').onclick = function(){
    query('.fund-info').classList.add('hide');
    query('.fund-campaign').classList.remove('hide');
    return false;
  };

  fund.modal = modal(el)
    .overlay()
    .closeable()
    .effect('fade-and-scale')
    .show()
    .on('hide', function(){
      fund.active = null;
    });

  function alter(target){
    var targets = ['bitcoin', 'dogecoin', 'paypal'];

    return function onclick(){
      targets.forEach(function(t){
        if (target === t) query('.pledge-details-' + t).classList.remove('hide');
        else query('.pledge-details-' + t).classList.add('hide');
      })
      return false;
    };
  }

  function query(sel){
    return el.querySelector(sel);
  }

  function queryAll(sel){
    return el.querySelectorAll(sel);
  }
}

function createWave(percentage){
  var svg = createElementNS('svg');
  var bar = createElementNS('polyline');
  var wave = createElementNS('polyline');

  attrs(svg, {
    width: '550px',
    height: '50px'
  });

  attrs(bar, {
    fill: 'none',
    stroke: '#444',
    'stroke-width': 6,
    //'stroke-linecap': 'round'
  });

  attrs(wave, {
    fill: 'none',
    stroke: '#A0D92E',
    'stroke-width': 6,
    //'stroke-linecap': 'round'
  });

  svg.appendChild(bar);
  svg.appendChild(wave);

  var scaleY = 5;
  var scaleX = 11;

  var points = [];
  var x, y;
  var offset = 15;
  for (var t = -5; t < 50; t += 0.1) {
    y = offset + (scaleY * Math.sin(t));
    points.push((t * scaleX) + ',' + y);
  }

  bar.setAttribute('points', points.join(' '));

  var points = [];
  var x, y;
  var offset = 15;
  for (var t = -5; t < 48 * (percentage / 100); t += 0.1) {
    y = offset + (scaleY * Math.sin(t));
    points.push((t * scaleX) + ',' + y);
  }

  wave.setAttribute('points', points.join(' '));

  return svg;
}
