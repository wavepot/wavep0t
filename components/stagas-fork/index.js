
var emitter = require('emitter');

module.exports = fork;

function fork(){
  var child = emitter({});

  var iframe = child.iframe = document.createElement('iframe');
  iframe.src = '#';
  iframe.style.position = 'fixed';
  iframe.style.width = 100;
  iframe.style.height = 100;
  iframe.style.border = 'none';
  iframe.style.opacity = 0;
  document.body.appendChild(iframe);

  iframe.contentWindow.addEventListener('message', function(e){
    if ('parent' === e.data.origin) return;
    child.emit('message', e.data.data);
  });

  child.send = function(data){
    iframe.contentWindow.postMessage({
      origin: 'parent',
      data: data
    }, '*');
  };

  return child;
}


fork.isMaster = window.top === window.self;

if (!fork.isMaster) {
  emitter(fork);

  fork.send = function(data){
    self.postMessage({
      origin: 'child',
      data: data
    }, '*');
  };

  self.addEventListener('message', function(e){
    if ('child' === e.data.origin) return;
    fork.emit('message', e.data.data);
  });
}
