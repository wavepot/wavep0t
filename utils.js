
exports.createElement = function createElement(name, className){
  var el = document.createElement('div');
  el.id = name;
  if (className) el.className = className;
  return el;
};

exports.createElementNS = function createElementNS(name){
  return document.createElementNS('http://www.w3.org/2000/svg', name);
};

exports.attrs = function attrs(el, obj){
  for (var key in obj) {
    el.setAttribute(key, obj[key]);
  }
};

exports.wrapscroll = function(html){
  html =
      '<div class="scrollpane">'
    + '  <div class="scrollbar-area">'
    + '    <div class="scrollbar-wrapper">'
    + '      <div class="scrollbar-padding">'
    + html
    + '      </div>'
    + '    </div>'
    + '    <div class="scrollbar-track">'
    + '      <div class="scrollbar-handle"></div>'
    + '    </div>'
    + '  </div>'
    + '</div>'
    ;

  return html;
};
