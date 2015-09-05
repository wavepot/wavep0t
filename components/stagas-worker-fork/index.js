
var emitter = require('emitter');

module.exports = fork;

function fork(script, boot){
  var child = emitter({});
  var body;

  var req = new XMLHttpRequest();

  req.onload = function(){
    body = this.responseText;
    body += "\nrequire('" + boot + "');";
  };

  req.open('GET', script, false);
  req.send();

  var blob = new Blob([body], { 'type': 'application/javascript' });
  var url = window.URL.createObjectURL(blob);

  var worker = child.worker = new Worker(url);

  worker.onmessage = function(e){
    child.emit('message', e.data);
  };

  child.send = child.worker.postMessage.bind(child.worker);

  return child;
}

fork.isMaster = !!self.document;

if (!fork.isMaster) {
  emitter(fork);

  fork.send = self.postMessage.bind(self);

  self.onmessage = function(e){
    fork.emit('message', e.data);
  };
}
