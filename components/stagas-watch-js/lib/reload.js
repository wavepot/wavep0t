;(function () {
  var WS = window.MozWebSocket || window.WebSocket;
  var ws;
  var timeout;
  var reloading;
  var reloadAfter;
  function connect () {
    if (reloading) return;
    clearTimeout(timeout);
    try {
      ws = new WS("ws://localhost:3003/reload");
      ws.onopen = function () {
        console.log('watch-js live reload connected');
        if (reloadAfter) {
          reloading = true;
          window.location.reload();
          return;
        }
      }
      ws.onmessage = function (msg) {
        console.log('watch-js : '+msg.data);
        if ("reload" == msg.data) {
          reloading = true;
          window.location.reload();
        }
      }
      ws.onclose =
      ws.onerror = function (e) {
        reloadAfter = true;
        if (reloading) return;
        console.error('watch-js error:', e);
        clearTimeout(timeout);
        timeout = setTimeout(connect, 3000);
      }
    }
    catch (e) {
      reloadAfter = true;
      if (reloading) return;
      console.error('watch-js error:', e);
      clearTimeout(timeout);
      timeout = setTimeout(connect, 3000);
    }
  };
  connect();
}());
