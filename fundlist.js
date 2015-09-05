
var scrollbar = require('scrollbar.js');
var after = require('after-transition');
var ejs = require('ejs');
var modal = require('modal');
var utils = require('./utils');
var createElement = utils.createElement;
var wrapscroll = utils.wrapscroll;

var tmpl = {
  fundlist: require('./fundlist.html')
};

var fundlist = module.exports = {};

fundlist.show = show;
fundlist.create = createFund;
fundlist.makeModal = makeModal;
fundlist.campaigns = require('./campaigns');

function createFund(){
  fundlist.el = createElement('fundlist');

  fundlist.el.innerHTML = wrapscroll(ejs.render(tmpl.fundlist, fundlist));

  // more expand
  var nodes = fundlist.el.querySelectorAll('.more a');

  [].forEach.call(nodes, function(node){
    var details = node.parentNode.parentNode.parentNode.querySelector('.details');

    node.onclick = function(ev){
      ev.preventDefault();

      if (details.classList.contains('hide')) {
        details.classList.remove('hide');
        node.textContent = 'hide info';
      } else {
        details.classList.add('hide');
        node.textContent = 'more info';
      }

      after(details, function(){
        fundlist.scrollbar.refresh();
      });

      return false;
    };
  });

  // pledger expand
  var nodes = fundlist.el.querySelectorAll('.pledge .coin');

  [].forEach.call(nodes, function(node){
    var pledgerClass = node.classList.contains('bitcoin')
      ? '.bitcoin-pledger'
      : '.dogecoin-pledger';

    var pledgerOtherClass = node.classList.contains('dogecoin')
      ? '.bitcoin-pledger'
      : '.dogecoin-pledger';

    var parent = node.parentNode.parentNode.parentNode
    var pledger = parent.querySelector(pledgerClass);
    var pledgerOther = parent.querySelector(pledgerOtherClass);

    node.onclick = function(ev){
      ev.preventDefault();

      pledgerOther.classList.add('hide');

      if (pledger.classList.contains('hide')) {
        pledger.classList.remove('hide');
      } else {
        pledger.classList.add('hide');
      }

      after(pledger, function(){
        fundlist.scrollbar.refresh();
      });

      return false;
    };
  });


}

function makeModal(){
  fundlist.modal = modal(fundlist.el)
    .overlay()
    .closeable()
    .effect('fade-and-scale');

  fundlist.modal.on('showing', function(){
    if (fundlist.scrollbar) {
      fundlist.scrollbar.refresh();
    } else {
      fundlist.scrollbar = scrollbar(fundlist.el);
    }
  });
}

function show(){
  fundlist.modal.show();
}
