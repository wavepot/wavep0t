
var ajax = require('ajax');
//var modules = require('./dsp-modules');
var about = require('./about');
var emitter = require('emitter');
var utils = require('./utils');
var tree = require('treeview');
var createElement = utils.createElement;

var library = {};
/*
[
  'simple-sine',
  'on-the-verge',
  'on-the-verge-tech-mix',
  'polytropon',
  'polytropon-astral-mix',
  'unexpected-token',
  'early-morning',
  'morning',
  'late-morning',
  'icecream',
  'got-some-303',
  'need-more-303',
  'subwah'
]
.forEach(function(name){
  library['/projects/' + name.replace(/-/g, ' ')] = require('./library/projects/' + name)
    .toString()
    .split('\n')
    .slice(1, -1)
    .join('\n');
});
*/
var sidebar = module.exports = emitter({});

sidebar.create = createSidebar;

function createSidebar(context) {
  sidebar.el = createElement('sidebar');

  sidebar.on('select', function (node) {
    var path = node.path();

    var sublime = context.sublime;
    if (!sublime) return;

    if (context.hasEdited) {
      if (!confirm('You\'ve made some edits!\n\nAre you sure you want to load a new project and lose everything?')) return;
    }

<<<<<<< Updated upstream
    context.isNewProject = true;
=======
        ajax.get(path, function (code) {
          session.setValue(code);
        });
>>>>>>> Stashed changes

    var session = sublime.editor.getSession();

    ajax.get('.' + path, function (code) {
      session.setValue(code);
    });
  });

  var nodes = [
    // ['modules', true],
    ['projects', true]
  ];

  var contents = {
    '/projects': [
      ['afternoon walk'],
      ['dubstep dawn'],
      ['early morning'],
      ['go to sleep'],
      ['got some 303'],
      ['icecream'],
      ['late morning'],
      ['mind swift'],
      ['mind swift seutje mix'],
      ['morning'],
      ['need more 303'],
      ['on the verge'],
      ['on the verge tech mix'],
      ['polytropon'],
      ['polytropon astral mix'],
      ['rooftop unvisited'],
      ['simple sine'],
      ['subwah'],
      ['unexpected token'],
      ['yay'],
    ]
    // '/modules': [
    //   ['effects', true],
    //   ['oscillators', true],
    //   ['sequencers', true],
    //   ['synths', true],
    //   ['various', true]
    // ],
    // //'/projects': Object.keys(library).map(function(name){ return [name.split('/').pop()]; }),
    // '/modules/effects': [
    //   ['amp', true],
    //   ['chorus', true],
    //   ['delay', true],
    //   ['dynamics', true],
    //   ['eq', true],
    //   ['filter', true],
    //   ['flanger', true],
    //   ['modulation', true],
    //   ['phaser', true],
    //   ['reverb', true]
    // ],
    // '/modules/synths': [
    //   ['ambient', true],
    //   ['analog', true],
    //   ['bass', true],
    //   ['drums', true],
    //   ['flute', true],
    //   ['fm', true],
    //   ['fx', true],
    //   ['modular', true],
    //   ['organ', true],
    //   ['pads', true],
    //   ['percussion', true],
    //   ['piano', true],
    //   ['sample', true],
    //   ['strings', true]
    // ]
  };

  function fetch(node, fn) {
    var path = node.path();
    var parts = path.split('/');
    var dir = parts[1];
    var res = contents[path];
    if (!res) {
      switch (dir) {
        case 'projects':
          load(path, fn);
          break;
        default:
          about.show()
          // fund.show('milestone I');
          // fund.modal.once('hiding', fn.bind(this, new Error('no results')));
          break;
      }
    } else {
      fn(null, contents[path]);
    }
  }

  function load(path, fn) {
    ajax.getJSON(path, function (res) {
      res = res.map(function (name) {
        return [name];
      });
      fn(null, res);
    });
  }

  setTimeout(function () {
    tree(sidebar, nodes, fetch)[0].click(function (err, nodes) {
      if (document.location.search) {
        loadRawGit(document.location.search.slice(1))
      } else {
        var path = document.location.pathname;

        if ('/' == path) {
          nodes.forEach(function (node) {
            if (~node.path().indexOf('simple sine')) node.click();
          });
        }
      }
    });
  }, 0);

  function loadRawGit(path) {
    var sublime = context.sublime;
    if (!sublime) return false;

    context.isNewProject = true;

    var session = sublime.editor.getSession();

    if (path.includes('gist.githubusercontent.com')) {
      path = path.split('gist.githubusercontent.com/').pop()
      path = 'repo/' + path
    } else {
      if (path.includes('.com')) path = path.split('.com').pop()
      path = 'cdn/' + path
    }

    path = 'https://gitcdn.xyz/' + path;

    console.log('fetch ajax cdn', path)
    // if (!~path.indexOf('/raw/')) path += '/raw/';

    ajax({
      url: path,
      dataType: 'text/plain',
      success: success
    });

    function success(code) {
      session.setValue(code);
    }

    return true
  }
  /*
    sidebar.header = createElement('header');
    sidebar.header.innerHTML = '<ul><li>modules<li>projects<li>samples<li>visuals</ul>';

    sidebar.list = document.createElement('ul');
    sidebar.list.className = 'browser';

    var keys = Object.keys(modules);
    keys.unshift('+ create');
    keys.forEach(function(key){
      var item;
      item = document.createElement('li');
      item.innerHTML = key;
      sidebar.list.appendChild(item);
    });

    sidebar.el.appendChild(sidebar.header);
    sidebar.el.appendChild(sidebar.list);
  */
}
