
/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module._resolving && !module.exports) {
    var mod = {};
    mod.exports = {};
    mod.client = mod.component = true;
    module._resolving = true;
    module.call(this, mod.exports, require.relative(resolved), mod);
    delete module._resolving;
    module.exports = mod.exports;
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("component-emitter/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Expose `Emitter`.\n\
 */\n\
\n\
module.exports = Emitter;\n\
\n\
/**\n\
 * Initialize a new `Emitter`.\n\
 *\n\
 * @api public\n\
 */\n\
\n\
function Emitter(obj) {\n\
  if (obj) return mixin(obj);\n\
};\n\
\n\
/**\n\
 * Mixin the emitter properties.\n\
 *\n\
 * @param {Object} obj\n\
 * @return {Object}\n\
 * @api private\n\
 */\n\
\n\
function mixin(obj) {\n\
  for (var key in Emitter.prototype) {\n\
    obj[key] = Emitter.prototype[key];\n\
  }\n\
  return obj;\n\
}\n\
\n\
/**\n\
 * Listen on the given `event` with `fn`.\n\
 *\n\
 * @param {String} event\n\
 * @param {Function} fn\n\
 * @return {Emitter}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.on =\n\
Emitter.prototype.addEventListener = function(event, fn){\n\
  this._callbacks = this._callbacks || {};\n\
  (this._callbacks[event] = this._callbacks[event] || [])\n\
    .push(fn);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Adds an `event` listener that will be invoked a single\n\
 * time then automatically removed.\n\
 *\n\
 * @param {String} event\n\
 * @param {Function} fn\n\
 * @return {Emitter}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.once = function(event, fn){\n\
  var self = this;\n\
  this._callbacks = this._callbacks || {};\n\
\n\
  function on() {\n\
    self.off(event, on);\n\
    fn.apply(this, arguments);\n\
  }\n\
\n\
  on.fn = fn;\n\
  this.on(event, on);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Remove the given callback for `event` or all\n\
 * registered callbacks.\n\
 *\n\
 * @param {String} event\n\
 * @param {Function} fn\n\
 * @return {Emitter}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.off =\n\
Emitter.prototype.removeListener =\n\
Emitter.prototype.removeAllListeners =\n\
Emitter.prototype.removeEventListener = function(event, fn){\n\
  this._callbacks = this._callbacks || {};\n\
\n\
  // all\n\
  if (0 == arguments.length) {\n\
    this._callbacks = {};\n\
    return this;\n\
  }\n\
\n\
  // specific event\n\
  var callbacks = this._callbacks[event];\n\
  if (!callbacks) return this;\n\
\n\
  // remove all handlers\n\
  if (1 == arguments.length) {\n\
    delete this._callbacks[event];\n\
    return this;\n\
  }\n\
\n\
  // remove specific handler\n\
  var cb;\n\
  for (var i = 0; i < callbacks.length; i++) {\n\
    cb = callbacks[i];\n\
    if (cb === fn || cb.fn === fn) {\n\
      callbacks.splice(i, 1);\n\
      break;\n\
    }\n\
  }\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Emit `event` with the given args.\n\
 *\n\
 * @param {String} event\n\
 * @param {Mixed} ...\n\
 * @return {Emitter}\n\
 */\n\
\n\
Emitter.prototype.emit = function(event){\n\
  this._callbacks = this._callbacks || {};\n\
  var args = [].slice.call(arguments, 1)\n\
    , callbacks = this._callbacks[event];\n\
\n\
  if (callbacks) {\n\
    callbacks = callbacks.slice(0);\n\
    for (var i = 0, len = callbacks.length; i < len; ++i) {\n\
      callbacks[i].apply(this, args);\n\
    }\n\
  }\n\
\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Return array of callbacks for `event`.\n\
 *\n\
 * @param {String} event\n\
 * @return {Array}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.listeners = function(event){\n\
  this._callbacks = this._callbacks || {};\n\
  return this._callbacks[event] || [];\n\
};\n\
\n\
/**\n\
 * Check if this emitter has `event` handlers.\n\
 *\n\
 * @param {String} event\n\
 * @return {Boolean}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.hasListeners = function(event){\n\
  return !! this.listeners(event).length;\n\
};\n\
//@ sourceURL=component-emitter/index.js"
));
require.register("component-debounce/index.js", Function("exports, require, module",
"/**\n\
 * Debounces a function by the given threshold.\n\
 *\n\
 * @see http://unscriptable.com/2009/03/20/debouncing-javascript-methods/\n\
 * @param {Function} function to wrap\n\
 * @param {Number} timeout in ms (`100`)\n\
 * @param {Boolean} whether to execute at the beginning (`false`)\n\
 * @api public\n\
 */\n\
\n\
module.exports = function debounce(func, threshold, execAsap){\n\
  var timeout;\n\
\n\
  return function debounced(){\n\
    var obj = this, args = arguments;\n\
\n\
    function delayed () {\n\
      if (!execAsap) {\n\
        func.apply(obj, args);\n\
      }\n\
      timeout = null;\n\
    }\n\
\n\
    if (timeout) {\n\
      clearTimeout(timeout);\n\
    } else if (execAsap) {\n\
      func.apply(obj, args);\n\
    }\n\
\n\
    timeout = setTimeout(delayed, threshold || 100);\n\
  };\n\
};\n\
//@ sourceURL=component-debounce/index.js"
));
require.register("component-type/index.js", Function("exports, require, module",
"\n\
/**\n\
 * toString ref.\n\
 */\n\
\n\
var toString = Object.prototype.toString;\n\
\n\
/**\n\
 * Return the type of `val`.\n\
 *\n\
 * @param {Mixed} val\n\
 * @return {String}\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(val){\n\
  switch (toString.call(val)) {\n\
    case '[object Function]': return 'function';\n\
    case '[object Date]': return 'date';\n\
    case '[object RegExp]': return 'regexp';\n\
    case '[object Arguments]': return 'arguments';\n\
    case '[object Array]': return 'array';\n\
    case '[object String]': return 'string';\n\
  }\n\
\n\
  if (val === null) return 'null';\n\
  if (val === undefined) return 'undefined';\n\
  if (val && val.nodeType === 1) return 'element';\n\
  if (val === Object(val)) return 'object';\n\
\n\
  return typeof val;\n\
};\n\
//@ sourceURL=component-type/index.js"
));
require.register("forbeslindesay-ajax/index.js", Function("exports, require, module",
"var type\n\
try {\n\
  type = require('type-of')\n\
} catch (ex) {\n\
  //hide from browserify\n\
  var r = require\n\
  type = r('type')\n\
}\n\
\n\
var jsonpID = 0,\n\
    document = window.document,\n\
    key,\n\
    name,\n\
    rscript = /<script\\b[^<]*(?:(?!<\\/script>)<[^<]*)*<\\/script>/gi,\n\
    scriptTypeRE = /^(?:text|application)\\/javascript/i,\n\
    xmlTypeRE = /^(?:text|application)\\/xml/i,\n\
    jsonType = 'application/json',\n\
    htmlType = 'text/html',\n\
    blankRE = /^\\s*$/\n\
\n\
var ajax = module.exports = function(options){\n\
  var settings = extend({}, options || {})\n\
  for (key in ajax.settings) if (settings[key] === undefined) settings[key] = ajax.settings[key]\n\
\n\
  ajaxStart(settings)\n\
\n\
  if (!settings.crossDomain) settings.crossDomain = /^([\\w-]+:)?\\/\\/([^\\/]+)/.test(settings.url) &&\n\
    RegExp.$2 != window.location.host\n\
\n\
  var dataType = settings.dataType, hasPlaceholder = /=\\?/.test(settings.url)\n\
  if (dataType == 'jsonp' || hasPlaceholder) {\n\
    if (!hasPlaceholder) settings.url = appendQuery(settings.url, 'callback=?')\n\
    return ajax.JSONP(settings)\n\
  }\n\
\n\
  if (!settings.url) settings.url = window.location.toString()\n\
  serializeData(settings)\n\
\n\
  var mime = settings.accepts[dataType],\n\
      baseHeaders = { },\n\
      protocol = /^([\\w-]+:)\\/\\//.test(settings.url) ? RegExp.$1 : window.location.protocol,\n\
      xhr = ajax.settings.xhr(), abortTimeout\n\
\n\
  if (!settings.crossDomain) baseHeaders['X-Requested-With'] = 'XMLHttpRequest'\n\
  if (mime) {\n\
    baseHeaders['Accept'] = mime\n\
    if (mime.indexOf(',') > -1) mime = mime.split(',', 2)[0]\n\
    xhr.overrideMimeType && xhr.overrideMimeType(mime)\n\
  }\n\
  if (settings.contentType || (settings.data && settings.type.toUpperCase() != 'GET'))\n\
    baseHeaders['Content-Type'] = (settings.contentType || 'application/x-www-form-urlencoded')\n\
  settings.headers = extend(baseHeaders, settings.headers || {})\n\
\n\
  xhr.onreadystatechange = function(){\n\
    if (xhr.readyState == 4) {\n\
      clearTimeout(abortTimeout)\n\
      var result, error = false\n\
      if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304 || (xhr.status == 0 && protocol == 'file:')) {\n\
        dataType = dataType || mimeToDataType(xhr.getResponseHeader('content-type'))\n\
        result = xhr.responseText\n\
\n\
        try {\n\
          if (dataType == 'script')    (1,eval)(result)\n\
          else if (dataType == 'xml')  result = xhr.responseXML\n\
          else if (dataType == 'json') result = blankRE.test(result) ? null : JSON.parse(result)\n\
        } catch (e) { error = e }\n\
\n\
        if (error) ajaxError(error, 'parsererror', xhr, settings)\n\
        else ajaxSuccess(result, xhr, settings)\n\
      } else {\n\
        ajaxError(null, 'error', xhr, settings)\n\
      }\n\
    }\n\
  }\n\
\n\
  var async = 'async' in settings ? settings.async : true\n\
  xhr.open(settings.type, settings.url, async)\n\
\n\
  for (name in settings.headers) xhr.setRequestHeader(name, settings.headers[name])\n\
\n\
  if (ajaxBeforeSend(xhr, settings) === false) {\n\
    xhr.abort()\n\
    return false\n\
  }\n\
\n\
  if (settings.timeout > 0) abortTimeout = setTimeout(function(){\n\
      xhr.onreadystatechange = empty\n\
      xhr.abort()\n\
      ajaxError(null, 'timeout', xhr, settings)\n\
    }, settings.timeout)\n\
\n\
  // avoid sending empty string (#319)\n\
  xhr.send(settings.data ? settings.data : null)\n\
  return xhr\n\
}\n\
\n\
\n\
// trigger a custom event and return false if it was cancelled\n\
function triggerAndReturn(context, eventName, data) {\n\
  //todo: Fire off some events\n\
  //var event = $.Event(eventName)\n\
  //$(context).trigger(event, data)\n\
  return true;//!event.defaultPrevented\n\
}\n\
\n\
// trigger an Ajax \"global\" event\n\
function triggerGlobal(settings, context, eventName, data) {\n\
  if (settings.global) return triggerAndReturn(context || document, eventName, data)\n\
}\n\
\n\
// Number of active Ajax requests\n\
ajax.active = 0\n\
\n\
function ajaxStart(settings) {\n\
  if (settings.global && ajax.active++ === 0) triggerGlobal(settings, null, 'ajaxStart')\n\
}\n\
function ajaxStop(settings) {\n\
  if (settings.global && !(--ajax.active)) triggerGlobal(settings, null, 'ajaxStop')\n\
}\n\
\n\
// triggers an extra global event \"ajaxBeforeSend\" that's like \"ajaxSend\" but cancelable\n\
function ajaxBeforeSend(xhr, settings) {\n\
  var context = settings.context\n\
  if (settings.beforeSend.call(context, xhr, settings) === false ||\n\
      triggerGlobal(settings, context, 'ajaxBeforeSend', [xhr, settings]) === false)\n\
    return false\n\
\n\
  triggerGlobal(settings, context, 'ajaxSend', [xhr, settings])\n\
}\n\
function ajaxSuccess(data, xhr, settings) {\n\
  var context = settings.context, status = 'success'\n\
  settings.success.call(context, data, status, xhr)\n\
  triggerGlobal(settings, context, 'ajaxSuccess', [xhr, settings, data])\n\
  ajaxComplete(status, xhr, settings)\n\
}\n\
// type: \"timeout\", \"error\", \"abort\", \"parsererror\"\n\
function ajaxError(error, type, xhr, settings) {\n\
  var context = settings.context\n\
  settings.error.call(context, xhr, type, error)\n\
  triggerGlobal(settings, context, 'ajaxError', [xhr, settings, error])\n\
  ajaxComplete(type, xhr, settings)\n\
}\n\
// status: \"success\", \"notmodified\", \"error\", \"timeout\", \"abort\", \"parsererror\"\n\
function ajaxComplete(status, xhr, settings) {\n\
  var context = settings.context\n\
  settings.complete.call(context, xhr, status)\n\
  triggerGlobal(settings, context, 'ajaxComplete', [xhr, settings])\n\
  ajaxStop(settings)\n\
}\n\
\n\
// Empty function, used as default callback\n\
function empty() {}\n\
\n\
ajax.JSONP = function(options){\n\
  if (!('type' in options)) return ajax(options)\n\
\n\
  var callbackName = 'jsonp' + (++jsonpID),\n\
    script = document.createElement('script'),\n\
    abort = function(){\n\
      //todo: remove script\n\
      //$(script).remove()\n\
      if (callbackName in window) window[callbackName] = empty\n\
      ajaxComplete('abort', xhr, options)\n\
    },\n\
    xhr = { abort: abort }, abortTimeout,\n\
    head = document.getElementsByTagName(\"head\")[0]\n\
      || document.documentElement\n\
\n\
  if (options.error) script.onerror = function() {\n\
    xhr.abort()\n\
    options.error()\n\
  }\n\
\n\
  window[callbackName] = function(data){\n\
    clearTimeout(abortTimeout)\n\
      //todo: remove script\n\
      //$(script).remove()\n\
    delete window[callbackName]\n\
    ajaxSuccess(data, xhr, options)\n\
  }\n\
\n\
  serializeData(options)\n\
  script.src = options.url.replace(/=\\?/, '=' + callbackName)\n\
\n\
  // Use insertBefore instead of appendChild to circumvent an IE6 bug.\n\
  // This arises when a base node is used (see jQuery bugs #2709 and #4378).\n\
  head.insertBefore(script, head.firstChild);\n\
\n\
  if (options.timeout > 0) abortTimeout = setTimeout(function(){\n\
      xhr.abort()\n\
      ajaxComplete('timeout', xhr, options)\n\
    }, options.timeout)\n\
\n\
  return xhr\n\
}\n\
\n\
ajax.settings = {\n\
  // Default type of request\n\
  type: 'GET',\n\
  // Callback that is executed before request\n\
  beforeSend: empty,\n\
  // Callback that is executed if the request succeeds\n\
  success: empty,\n\
  // Callback that is executed the the server drops error\n\
  error: empty,\n\
  // Callback that is executed on request complete (both: error and success)\n\
  complete: empty,\n\
  // The context for the callbacks\n\
  context: null,\n\
  // Whether to trigger \"global\" Ajax events\n\
  global: true,\n\
  // Transport\n\
  xhr: function () {\n\
    return new window.XMLHttpRequest()\n\
  },\n\
  // MIME types mapping\n\
  accepts: {\n\
    script: 'text/javascript, application/javascript',\n\
    json:   jsonType,\n\
    xml:    'application/xml, text/xml',\n\
    html:   htmlType,\n\
    text:   'text/plain'\n\
  },\n\
  // Whether the request is to another domain\n\
  crossDomain: false,\n\
  // Default timeout\n\
  timeout: 0\n\
}\n\
\n\
function mimeToDataType(mime) {\n\
  return mime && ( mime == htmlType ? 'html' :\n\
    mime == jsonType ? 'json' :\n\
    scriptTypeRE.test(mime) ? 'script' :\n\
    xmlTypeRE.test(mime) && 'xml' ) || 'text'\n\
}\n\
\n\
function appendQuery(url, query) {\n\
  return (url + '&' + query).replace(/[&?]{1,2}/, '?')\n\
}\n\
\n\
// serialize payload and append it to the URL for GET requests\n\
function serializeData(options) {\n\
  if (type(options.data) === 'object') options.data = param(options.data)\n\
  if (options.data && (!options.type || options.type.toUpperCase() == 'GET'))\n\
    options.url = appendQuery(options.url, options.data)\n\
}\n\
\n\
ajax.get = function(url, success){ return ajax({ url: url, success: success }) }\n\
\n\
ajax.post = function(url, data, success, dataType){\n\
  if (type(data) === 'function') dataType = dataType || success, success = data, data = null\n\
  return ajax({ type: 'POST', url: url, data: data, success: success, dataType: dataType })\n\
}\n\
\n\
ajax.getJSON = function(url, success){\n\
  return ajax({ url: url, success: success, dataType: 'json' })\n\
}\n\
\n\
var escape = encodeURIComponent\n\
\n\
function serialize(params, obj, traditional, scope){\n\
  var array = type(obj) === 'array';\n\
  for (var key in obj) {\n\
    var value = obj[key];\n\
\n\
    if (scope) key = traditional ? scope : scope + '[' + (array ? '' : key) + ']'\n\
    // handle data in serializeArray() format\n\
    if (!scope && array) params.add(value.name, value.value)\n\
    // recurse into nested objects\n\
    else if (traditional ? (type(value) === 'array') : (type(value) === 'object'))\n\
      serialize(params, value, traditional, key)\n\
    else params.add(key, value)\n\
  }\n\
}\n\
\n\
function param(obj, traditional){\n\
  var params = []\n\
  params.add = function(k, v){ this.push(escape(k) + '=' + escape(v)) }\n\
  serialize(params, obj, traditional)\n\
  return params.join('&').replace('%20', '+')\n\
}\n\
\n\
function extend(target) {\n\
  var slice = Array.prototype.slice;\n\
  slice.call(arguments, 1).forEach(function(source) {\n\
    for (key in source)\n\
      if (source[key] !== undefined)\n\
        target[key] = source[key]\n\
  })\n\
  return target\n\
}//@ sourceURL=forbeslindesay-ajax/index.js"
));
require.register("matthewmueller-qr-code/index.js", Function("exports, require, module",
"/**\n\
 * Module Dependencies\n\
 */\n\
\n\
var qrcode = require('./qr-code');\n\
\n\
/**\n\
 * Export `QR`\n\
 */\n\
\n\
module.exports = QR;\n\
\n\
/**\n\
 * Initialize `QR`\n\
 *\n\
 * @param {String} text\n\
 * @param {Object} opts\n\
 */\n\
\n\
function QR(text, opts) {\n\
  text = text || '';\n\
  opts = opts || {};\n\
  var type = opts.type || 4;\n\
  var level = opts.level || 'L';\n\
  var size = opts.size || 4;\n\
  var margin = opts.margin || 0;\n\
  var qr = qrcode(type, level);\n\
  qr.addData(text);\n\
  qr.make();\n\
\n\
  // Get the source\n\
  var img = qr.createImgTag(size, margin);\n\
  var o = document.createElement('div');\n\
  o.innerHTML = img;\n\
  return o.firstChild.src;\n\
}\n\
\n\
/**\n\
 * Specify the backup level. Default is 'M'\n\
 *\n\
 * Options include:\n\
 *\n\
 *   L: up to 7% damage\n\
 *   M: up to 15% damage\n\
 *   Q: up to 25% damage\n\
 *   H: up to 30% damage\n\
 *\n\
 * @param {String} level\n\
 * @return {QR}\n\
 * @api public\n\
 */\n\
\n\
QR.prototype.level = function(level) {\n\
  this._level = level;\n\
  return this;\n\
}\n\
\n\
\n\
//@ sourceURL=matthewmueller-qr-code/index.js"
));
require.register("matthewmueller-qr-code/qr-code.js", Function("exports, require, module",
"//---------------------------------------------------------------------\n\
//\n\
// QR Code Generator for JavaScript\n\
//\n\
// Copyright (c) 2009 Kazuhiko Arase\n\
//\n\
// URL: http://www.d-project.com/\n\
//\n\
// Licensed under the MIT license:\n\
//  http://www.opensource.org/licenses/mit-license.php\n\
//\n\
// The word 'QR Code' is registered trademark of\n\
// DENSO WAVE INCORPORATED\n\
//  http://www.denso-wave.com/qrcode/faqpatent-e.html\n\
//\n\
//---------------------------------------------------------------------\n\
\n\
module.exports = function() {\n\
\n\
  //---------------------------------------------------------------------\n\
  // qrcode\n\
  //---------------------------------------------------------------------\n\
\n\
  /**\n\
   * qrcode\n\
   * @param typeNumber 1 to 10\n\
   * @param errorCorrectLevel 'L','M','Q','H'\n\
   */\n\
  var qrcode = function(typeNumber, errorCorrectLevel) {\n\
\n\
    var PAD0 = 0xEC;\n\
    var PAD1 = 0x11;\n\
\n\
    var _typeNumber = typeNumber;\n\
    var _errorCorrectLevel = QRErrorCorrectLevel[errorCorrectLevel];\n\
    var _modules = null;\n\
    var _moduleCount = 0;\n\
    var _dataCache = null;\n\
    var _dataList = new Array();\n\
\n\
    var _this = {};\n\
\n\
    var makeImpl = function(test, maskPattern) {\n\
\n\
      _moduleCount = _typeNumber * 4 + 17;\n\
      _modules = function(moduleCount) {\n\
        var modules = new Array(moduleCount);\n\
        for (var row = 0; row < moduleCount; row += 1) {\n\
          modules[row] = new Array(moduleCount);\n\
          for (var col = 0; col < moduleCount; col += 1) {\n\
            modules[row][col] = null;\n\
          }\n\
        }\n\
        return modules;\n\
      }(_moduleCount);\n\
\n\
      setupPositionProbePattern(0, 0);\n\
      setupPositionProbePattern(_moduleCount - 7, 0);\n\
      setupPositionProbePattern(0, _moduleCount - 7);\n\
      setupPositionAdjustPattern();\n\
      setupTimingPattern();\n\
      setupTypeInfo(test, maskPattern);\n\
\n\
      if (_typeNumber >= 7) {\n\
        setupTypeNumber(test);\n\
      }\n\
\n\
      if (_dataCache == null) {\n\
        _dataCache = createData(_typeNumber, _errorCorrectLevel, _dataList);\n\
      }\n\
\n\
      mapData(_dataCache, maskPattern);\n\
    };\n\
\n\
    var setupPositionProbePattern = function(row, col) {\n\
\n\
      for (var r = -1; r <= 7; r += 1) {\n\
\n\
        if (row + r <= -1 || _moduleCount <= row + r) continue;\n\
\n\
        for (var c = -1; c <= 7; c += 1) {\n\
\n\
          if (col + c <= -1 || _moduleCount <= col + c) continue;\n\
\n\
          if ( (0 <= r && r <= 6 && (c == 0 || c == 6) )\n\
              || (0 <= c && c <= 6 && (r == 0 || r == 6) )\n\
              || (2 <= r && r <= 4 && 2 <= c && c <= 4) ) {\n\
            _modules[row + r][col + c] = true;\n\
          } else {\n\
            _modules[row + r][col + c] = false;\n\
          }\n\
        }\n\
      }\n\
    };\n\
\n\
    var getBestMaskPattern = function() {\n\
\n\
      var minLostPoint = 0;\n\
      var pattern = 0;\n\
\n\
      for (var i = 0; i < 8; i += 1) {\n\
\n\
        makeImpl(true, i);\n\
\n\
        var lostPoint = QRUtil.getLostPoint(_this);\n\
\n\
        if (i == 0 || minLostPoint > lostPoint) {\n\
          minLostPoint = lostPoint;\n\
          pattern = i;\n\
        }\n\
      }\n\
\n\
      return pattern;\n\
    };\n\
\n\
    var setupTimingPattern = function() {\n\
\n\
      for (var r = 8; r < _moduleCount - 8; r += 1) {\n\
        if (_modules[r][6] != null) {\n\
          continue;\n\
        }\n\
        _modules[r][6] = (r % 2 == 0);\n\
      }\n\
\n\
      for (var c = 8; c < _moduleCount - 8; c += 1) {\n\
        if (_modules[6][c] != null) {\n\
          continue;\n\
        }\n\
        _modules[6][c] = (c % 2 == 0);\n\
      }\n\
    };\n\
\n\
    var setupPositionAdjustPattern = function() {\n\
\n\
      var pos = QRUtil.getPatternPosition(_typeNumber);\n\
\n\
      for (var i = 0; i < pos.length; i += 1) {\n\
\n\
        for (var j = 0; j < pos.length; j += 1) {\n\
\n\
          var row = pos[i];\n\
          var col = pos[j];\n\
\n\
          if (_modules[row][col] != null) {\n\
            continue;\n\
          }\n\
\n\
          for (var r = -2; r <= 2; r += 1) {\n\
\n\
            for (var c = -2; c <= 2; c += 1) {\n\
\n\
              if (r == -2 || r == 2 || c == -2 || c == 2\n\
                  || (r == 0 && c == 0) ) {\n\
                _modules[row + r][col + c] = true;\n\
              } else {\n\
                _modules[row + r][col + c] = false;\n\
              }\n\
            }\n\
          }\n\
        }\n\
      }\n\
    };\n\
\n\
    var setupTypeNumber = function(test) {\n\
\n\
      var bits = QRUtil.getBCHTypeNumber(_typeNumber);\n\
\n\
      for (var i = 0; i < 18; i += 1) {\n\
        var mod = (!test && ( (bits >> i) & 1) == 1);\n\
        _modules[Math.floor(i / 3)][i % 3 + _moduleCount - 8 - 3] = mod;\n\
      }\n\
\n\
      for (var i = 0; i < 18; i += 1) {\n\
        var mod = (!test && ( (bits >> i) & 1) == 1);\n\
        _modules[i % 3 + _moduleCount - 8 - 3][Math.floor(i / 3)] = mod;\n\
      }\n\
    };\n\
\n\
    var setupTypeInfo = function(test, maskPattern) {\n\
\n\
      var data = (_errorCorrectLevel << 3) | maskPattern;\n\
      var bits = QRUtil.getBCHTypeInfo(data);\n\
\n\
      // vertical\n\
      for (var i = 0; i < 15; i += 1) {\n\
\n\
        var mod = (!test && ( (bits >> i) & 1) == 1);\n\
\n\
        if (i < 6) {\n\
          _modules[i][8] = mod;\n\
        } else if (i < 8) {\n\
          _modules[i + 1][8] = mod;\n\
        } else {\n\
          _modules[_moduleCount - 15 + i][8] = mod;\n\
        }\n\
      }\n\
\n\
      // horizontal\n\
      for (var i = 0; i < 15; i += 1) {\n\
\n\
        var mod = (!test && ( (bits >> i) & 1) == 1);\n\
\n\
        if (i < 8) {\n\
          _modules[8][_moduleCount - i - 1] = mod;\n\
        } else if (i < 9) {\n\
          _modules[8][15 - i - 1 + 1] = mod;\n\
        } else {\n\
          _modules[8][15 - i - 1] = mod;\n\
        }\n\
      }\n\
\n\
      // fixed module\n\
      _modules[_moduleCount - 8][8] = (!test);\n\
    };\n\
\n\
    var mapData = function(data, maskPattern) {\n\
\n\
      var inc = -1;\n\
      var row = _moduleCount - 1;\n\
      var bitIndex = 7;\n\
      var byteIndex = 0;\n\
      var maskFunc = QRUtil.getMaskFunction(maskPattern);\n\
\n\
      for (var col = _moduleCount - 1; col > 0; col -= 2) {\n\
\n\
        if (col == 6) col -= 1;\n\
\n\
        while (true) {\n\
\n\
          for (var c = 0; c < 2; c += 1) {\n\
\n\
            if (_modules[row][col - c] == null) {\n\
\n\
              var dark = false;\n\
\n\
              if (byteIndex < data.length) {\n\
                dark = ( ( (data[byteIndex] >>> bitIndex) & 1) == 1);\n\
              }\n\
\n\
              var mask = maskFunc(row, col - c);\n\
\n\
              if (mask) {\n\
                dark = !dark;\n\
              }\n\
\n\
              _modules[row][col - c] = dark;\n\
              bitIndex -= 1;\n\
\n\
              if (bitIndex == -1) {\n\
                byteIndex += 1;\n\
                bitIndex = 7;\n\
              }\n\
            }\n\
          }\n\
\n\
          row += inc;\n\
\n\
          if (row < 0 || _moduleCount <= row) {\n\
            row -= inc;\n\
            inc = -inc;\n\
            break;\n\
          }\n\
        }\n\
      }\n\
    };\n\
\n\
    var createBytes = function(buffer, rsBlocks) {\n\
\n\
      var offset = 0;\n\
\n\
      var maxDcCount = 0;\n\
      var maxEcCount = 0;\n\
\n\
      var dcdata = new Array(rsBlocks.length);\n\
      var ecdata = new Array(rsBlocks.length);\n\
\n\
      for (var r = 0; r < rsBlocks.length; r += 1) {\n\
\n\
        var dcCount = rsBlocks[r].dataCount;\n\
        var ecCount = rsBlocks[r].totalCount - dcCount;\n\
\n\
        maxDcCount = Math.max(maxDcCount, dcCount);\n\
        maxEcCount = Math.max(maxEcCount, ecCount);\n\
\n\
        dcdata[r] = new Array(dcCount);\n\
\n\
        for (var i = 0; i < dcdata[r].length; i += 1) {\n\
          dcdata[r][i] = 0xff & buffer.getBuffer()[i + offset];\n\
        }\n\
        offset += dcCount;\n\
\n\
        var rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);\n\
        var rawPoly = qrPolynomial(dcdata[r], rsPoly.getLength() - 1);\n\
\n\
        var modPoly = rawPoly.mod(rsPoly);\n\
        ecdata[r] = new Array(rsPoly.getLength() - 1);\n\
        for (var i = 0; i < ecdata[r].length; i += 1) {\n\
          var modIndex = i + modPoly.getLength() - ecdata[r].length;\n\
          ecdata[r][i] = (modIndex >= 0)? modPoly.getAt(modIndex) : 0;\n\
        }\n\
      }\n\
\n\
      var totalCodeCount = 0;\n\
      for (var i = 0; i < rsBlocks.length; i += 1) {\n\
        totalCodeCount += rsBlocks[i].totalCount;\n\
      }\n\
\n\
      var data = new Array(totalCodeCount);\n\
      var index = 0;\n\
\n\
      for (var i = 0; i < maxDcCount; i += 1) {\n\
        for (var r = 0; r < rsBlocks.length; r += 1) {\n\
          if (i < dcdata[r].length) {\n\
            data[index] = dcdata[r][i];\n\
            index += 1;\n\
          }\n\
        }\n\
      }\n\
\n\
      for (var i = 0; i < maxEcCount; i += 1) {\n\
        for (var r = 0; r < rsBlocks.length; r += 1) {\n\
          if (i < ecdata[r].length) {\n\
            data[index] = ecdata[r][i];\n\
            index += 1;\n\
          }\n\
        }\n\
      }\n\
\n\
      return data;\n\
    };\n\
\n\
    var createData = function(typeNumber, errorCorrectLevel, dataList) {\n\
\n\
      var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectLevel);\n\
\n\
      var buffer = qrBitBuffer();\n\
\n\
      for (var i = 0; i < dataList.length; i += 1) {\n\
        var data = dataList[i];\n\
        buffer.put(data.getMode(), 4);\n\
        buffer.put(data.getLength(), QRUtil.getLengthInBits(data.getMode(), typeNumber) );\n\
        data.write(buffer);\n\
      }\n\
\n\
      // calc num max data.\n\
      var totalDataCount = 0;\n\
      for (var i = 0; i < rsBlocks.length; i += 1) {\n\
        totalDataCount += rsBlocks[i].dataCount;\n\
      }\n\
\n\
      if (buffer.getLengthInBits() > totalDataCount * 8) {\n\
        throw new Error('code length overflow. ('\n\
          + buffer.getLengthInBits()\n\
          + '>'\n\
          + totalDataCount * 8\n\
          + ')');\n\
      }\n\
\n\
      // end code\n\
      if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {\n\
        buffer.put(0, 4);\n\
      }\n\
\n\
      // padding\n\
      while (buffer.getLengthInBits() % 8 != 0) {\n\
        buffer.putBit(false);\n\
      }\n\
\n\
      // padding\n\
      while (true) {\n\
\n\
        if (buffer.getLengthInBits() >= totalDataCount * 8) {\n\
          break;\n\
        }\n\
        buffer.put(PAD0, 8);\n\
\n\
        if (buffer.getLengthInBits() >= totalDataCount * 8) {\n\
          break;\n\
        }\n\
        buffer.put(PAD1, 8);\n\
      }\n\
\n\
      return createBytes(buffer, rsBlocks);\n\
    };\n\
\n\
    _this.addData = function(data) {\n\
      var newData = qr8BitByte(data);\n\
      _dataList.push(newData);\n\
      _dataCache = null;\n\
    };\n\
\n\
    _this.isDark = function(row, col) {\n\
      if (row < 0 || _moduleCount <= row || col < 0 || _moduleCount <= col) {\n\
        throw new Error(row + ',' + col);\n\
      }\n\
      return _modules[row][col];\n\
    };\n\
\n\
    _this.getModuleCount = function() {\n\
      return _moduleCount;\n\
    };\n\
\n\
    _this.make = function() {\n\
      makeImpl(false, getBestMaskPattern() );\n\
    };\n\
\n\
    _this.createTableTag = function(cellSize, margin) {\n\
\n\
      cellSize = cellSize || 2;\n\
      margin = (typeof margin == 'undefined')? cellSize * 4 : margin;\n\
\n\
      var qrHtml = '';\n\
\n\
      qrHtml += '<table style=\"';\n\
      qrHtml += ' border-width: 0px; border-style: none;';\n\
      qrHtml += ' border-collapse: collapse;';\n\
      qrHtml += ' padding: 0px; margin: ' + margin + 'px;';\n\
      qrHtml += '\">';\n\
      qrHtml += '<tbody>';\n\
\n\
      for (var r = 0; r < _this.getModuleCount(); r += 1) {\n\
\n\
        qrHtml += '<tr>';\n\
\n\
        for (var c = 0; c < _this.getModuleCount(); c += 1) {\n\
          qrHtml += '<td style=\"';\n\
          qrHtml += ' border-width: 0px; border-style: none;';\n\
          qrHtml += ' border-collapse: collapse;';\n\
          qrHtml += ' padding: 0px; margin: 0px;';\n\
          qrHtml += ' width: ' + cellSize + 'px;';\n\
          qrHtml += ' height: ' + cellSize + 'px;';\n\
          qrHtml += ' background-color: ';\n\
          qrHtml += _this.isDark(r, c)? '#000000' : '#ffffff';\n\
          qrHtml += ';';\n\
          qrHtml += '\"/>';\n\
        }\n\
\n\
        qrHtml += '</tr>';\n\
      }\n\
\n\
      qrHtml += '</tbody>';\n\
      qrHtml += '</table>';\n\
\n\
      return qrHtml;\n\
    };\n\
\n\
    _this.createImgTag = function(cellSize, margin) {\n\
\n\
      cellSize = cellSize || 2;\n\
      margin = (typeof margin == 'undefined')? cellSize * 4 : margin;\n\
\n\
      var size = _this.getModuleCount() * cellSize + margin * 2;\n\
      var min = margin;\n\
      var max = size - margin;\n\
\n\
      return createImgTag(size, size, function(x, y) {\n\
        if (min <= x && x < max && min <= y && y < max) {\n\
          var c = Math.floor( (x - min) / cellSize);\n\
          var r = Math.floor( (y - min) / cellSize);\n\
          return _this.isDark(r, c)? 0 : 1;\n\
        } else {\n\
          return 1;\n\
        }\n\
      } );\n\
    };\n\
\n\
    return _this;\n\
  };\n\
\n\
  //---------------------------------------------------------------------\n\
  // qrcode.stringToBytes\n\
  //---------------------------------------------------------------------\n\
\n\
  qrcode.stringToBytes = function(s) {\n\
    var bytes = new Array();\n\
    for (var i = 0; i < s.length; i += 1) {\n\
      var c = s.charCodeAt(i);\n\
      bytes.push(c & 0xff);\n\
    }\n\
    return bytes;\n\
  };\n\
\n\
  //---------------------------------------------------------------------\n\
  // qrcode.createStringToBytes\n\
  //---------------------------------------------------------------------\n\
\n\
  /**\n\
   * @param unicodeData base64 string of byte array.\n\
   * [16bit Unicode],[16bit Bytes], ...\n\
   * @param numChars\n\
   */\n\
  qrcode.createStringToBytes = function(unicodeData, numChars) {\n\
\n\
    // create conversion map.\n\
\n\
    var unicodeMap = function() {\n\
\n\
      var bin = base64DecodeInputStream(unicodeData);\n\
      var read = function() {\n\
        var b = bin.read();\n\
        if (b == -1) throw new Error();\n\
        return b;\n\
      };\n\
\n\
      var count = 0;\n\
      var unicodeMap = {};\n\
      while (true) {\n\
        var b0 = bin.read();\n\
        if (b0 == -1) break;\n\
        var b1 = read();\n\
        var b2 = read();\n\
        var b3 = read();\n\
        var k = String.fromCharCode( (b0 << 8) | b1);\n\
        var v = (b2 << 8) | b3;\n\
        unicodeMap[k] = v;\n\
        count += 1;\n\
      }\n\
      if (count != numChars) {\n\
        throw new Error(count + ' != ' + numChars);\n\
      }\n\
\n\
      return unicodeMap;\n\
    }();\n\
\n\
    var unknownChar = '?'.charCodeAt(0);\n\
\n\
    return function(s) {\n\
      var bytes = new Array();\n\
      for (var i = 0; i < s.length; i += 1) {\n\
        var c = s.charCodeAt(i);\n\
        if (c < 128) {\n\
          bytes.push(c);\n\
        } else {\n\
          var b = unicodeMap[s.charAt(i)];\n\
          if (typeof b == 'number') {\n\
            if ( (b & 0xff) == b) {\n\
              // 1byte\n\
              bytes.push(b);\n\
            } else {\n\
              // 2bytes\n\
              bytes.push(b >>> 8);\n\
              bytes.push(b & 0xff);\n\
            }\n\
          } else {\n\
            bytes.push(unknownChar);\n\
          }\n\
        }\n\
      }\n\
      return bytes;\n\
    };\n\
  };\n\
\n\
  //---------------------------------------------------------------------\n\
  // QRMode\n\
  //---------------------------------------------------------------------\n\
\n\
  var QRMode = {\n\
    MODE_NUMBER :   1 << 0,\n\
    MODE_ALPHA_NUM :  1 << 1,\n\
    MODE_8BIT_BYTE :  1 << 2,\n\
    MODE_KANJI :    1 << 3\n\
  };\n\
\n\
  //---------------------------------------------------------------------\n\
  // QRErrorCorrectLevel\n\
  //---------------------------------------------------------------------\n\
\n\
  var QRErrorCorrectLevel = {\n\
    L : 1,\n\
    M : 0,\n\
    Q : 3,\n\
    H : 2\n\
  };\n\
\n\
  //---------------------------------------------------------------------\n\
  // QRMaskPattern\n\
  //---------------------------------------------------------------------\n\
\n\
  var QRMaskPattern = {\n\
    PATTERN000 : 0,\n\
    PATTERN001 : 1,\n\
    PATTERN010 : 2,\n\
    PATTERN011 : 3,\n\
    PATTERN100 : 4,\n\
    PATTERN101 : 5,\n\
    PATTERN110 : 6,\n\
    PATTERN111 : 7\n\
  };\n\
\n\
  //---------------------------------------------------------------------\n\
  // QRUtil\n\
  //---------------------------------------------------------------------\n\
\n\
  var QRUtil = function() {\n\
\n\
    var PATTERN_POSITION_TABLE = [\n\
      [],\n\
      [6, 18],\n\
      [6, 22],\n\
      [6, 26],\n\
      [6, 30],\n\
      [6, 34],\n\
      [6, 22, 38],\n\
      [6, 24, 42],\n\
      [6, 26, 46],\n\
      [6, 28, 50],\n\
      [6, 30, 54],\n\
      [6, 32, 58],\n\
      [6, 34, 62],\n\
      [6, 26, 46, 66],\n\
      [6, 26, 48, 70],\n\
      [6, 26, 50, 74],\n\
      [6, 30, 54, 78],\n\
      [6, 30, 56, 82],\n\
      [6, 30, 58, 86],\n\
      [6, 34, 62, 90],\n\
      [6, 28, 50, 72, 94],\n\
      [6, 26, 50, 74, 98],\n\
      [6, 30, 54, 78, 102],\n\
      [6, 28, 54, 80, 106],\n\
      [6, 32, 58, 84, 110],\n\
      [6, 30, 58, 86, 114],\n\
      [6, 34, 62, 90, 118],\n\
      [6, 26, 50, 74, 98, 122],\n\
      [6, 30, 54, 78, 102, 126],\n\
      [6, 26, 52, 78, 104, 130],\n\
      [6, 30, 56, 82, 108, 134],\n\
      [6, 34, 60, 86, 112, 138],\n\
      [6, 30, 58, 86, 114, 142],\n\
      [6, 34, 62, 90, 118, 146],\n\
      [6, 30, 54, 78, 102, 126, 150],\n\
      [6, 24, 50, 76, 102, 128, 154],\n\
      [6, 28, 54, 80, 106, 132, 158],\n\
      [6, 32, 58, 84, 110, 136, 162],\n\
      [6, 26, 54, 82, 110, 138, 166],\n\
      [6, 30, 58, 86, 114, 142, 170]\n\
    ];\n\
    var G15 = (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0);\n\
    var G18 = (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0);\n\
    var G15_MASK = (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1);\n\
\n\
    var _this = {};\n\
\n\
    var getBCHDigit = function(data) {\n\
      var digit = 0;\n\
      while (data != 0) {\n\
        digit += 1;\n\
        data >>>= 1;\n\
      }\n\
      return digit;\n\
    };\n\
\n\
    _this.getBCHTypeInfo = function(data) {\n\
      var d = data << 10;\n\
      while (getBCHDigit(d) - getBCHDigit(G15) >= 0) {\n\
        d ^= (G15 << (getBCHDigit(d) - getBCHDigit(G15) ) );\n\
      }\n\
      return ( (data << 10) | d) ^ G15_MASK;\n\
    };\n\
\n\
    _this.getBCHTypeNumber = function(data) {\n\
      var d = data << 12;\n\
      while (getBCHDigit(d) - getBCHDigit(G18) >= 0) {\n\
        d ^= (G18 << (getBCHDigit(d) - getBCHDigit(G18) ) );\n\
      }\n\
      return (data << 12) | d;\n\
    };\n\
\n\
    _this.getPatternPosition = function(typeNumber) {\n\
      return PATTERN_POSITION_TABLE[typeNumber - 1];\n\
    };\n\
\n\
    _this.getMaskFunction = function(maskPattern) {\n\
\n\
      switch (maskPattern) {\n\
\n\
      case QRMaskPattern.PATTERN000 :\n\
        return function(i, j) { return (i + j) % 2 == 0; };\n\
      case QRMaskPattern.PATTERN001 :\n\
        return function(i, j) { return i % 2 == 0; };\n\
      case QRMaskPattern.PATTERN010 :\n\
        return function(i, j) { return j % 3 == 0; };\n\
      case QRMaskPattern.PATTERN011 :\n\
        return function(i, j) { return (i + j) % 3 == 0; };\n\
      case QRMaskPattern.PATTERN100 :\n\
        return function(i, j) { return (Math.floor(i / 2) + Math.floor(j / 3) ) % 2 == 0; };\n\
      case QRMaskPattern.PATTERN101 :\n\
        return function(i, j) { return (i * j) % 2 + (i * j) % 3 == 0; };\n\
      case QRMaskPattern.PATTERN110 :\n\
        return function(i, j) { return ( (i * j) % 2 + (i * j) % 3) % 2 == 0; };\n\
      case QRMaskPattern.PATTERN111 :\n\
        return function(i, j) { return ( (i * j) % 3 + (i + j) % 2) % 2 == 0; };\n\
\n\
      default :\n\
        throw new Error('bad maskPattern:' + maskPattern);\n\
      }\n\
    };\n\
\n\
    _this.getErrorCorrectPolynomial = function(errorCorrectLength) {\n\
      var a = qrPolynomial([1], 0);\n\
      for (var i = 0; i < errorCorrectLength; i += 1) {\n\
        a = a.multiply(qrPolynomial([1, QRMath.gexp(i)], 0) );\n\
      }\n\
      return a;\n\
    };\n\
\n\
    _this.getLengthInBits = function(mode, type) {\n\
\n\
      if (1 <= type && type < 10) {\n\
\n\
        // 1 - 9\n\
\n\
        switch(mode) {\n\
        case QRMode.MODE_NUMBER   : return 10;\n\
        case QRMode.MODE_ALPHA_NUM  : return 9;\n\
        case QRMode.MODE_8BIT_BYTE  : return 8;\n\
        case QRMode.MODE_KANJI    : return 8;\n\
        default :\n\
          throw new Error('mode:' + mode);\n\
        }\n\
\n\
      } else if (type < 27) {\n\
\n\
        // 10 - 26\n\
\n\
        switch(mode) {\n\
        case QRMode.MODE_NUMBER   : return 12;\n\
        case QRMode.MODE_ALPHA_NUM  : return 11;\n\
        case QRMode.MODE_8BIT_BYTE  : return 16;\n\
        case QRMode.MODE_KANJI    : return 10;\n\
        default :\n\
          throw new Error('mode:' + mode);\n\
        }\n\
\n\
      } else if (type < 41) {\n\
\n\
        // 27 - 40\n\
\n\
        switch(mode) {\n\
        case QRMode.MODE_NUMBER   : return 14;\n\
        case QRMode.MODE_ALPHA_NUM  : return 13;\n\
        case QRMode.MODE_8BIT_BYTE  : return 16;\n\
        case QRMode.MODE_KANJI    : return 12;\n\
        default :\n\
          throw new Error('mode:' + mode);\n\
        }\n\
\n\
      } else {\n\
        throw new Error('type:' + type);\n\
      }\n\
    };\n\
\n\
    _this.getLostPoint = function(qrcode) {\n\
\n\
      var moduleCount = qrcode.getModuleCount();\n\
\n\
      var lostPoint = 0;\n\
\n\
      // LEVEL1\n\
\n\
      for (var row = 0; row < moduleCount; row += 1) {\n\
        for (var col = 0; col < moduleCount; col += 1) {\n\
\n\
          var sameCount = 0;\n\
          var dark = qrcode.isDark(row, col);\n\
\n\
          for (var r = -1; r <= 1; r += 1) {\n\
\n\
            if (row + r < 0 || moduleCount <= row + r) {\n\
              continue;\n\
            }\n\
\n\
            for (var c = -1; c <= 1; c += 1) {\n\
\n\
              if (col + c < 0 || moduleCount <= col + c) {\n\
                continue;\n\
              }\n\
\n\
              if (r == 0 && c == 0) {\n\
                continue;\n\
              }\n\
\n\
              if (dark == qrcode.isDark(row + r, col + c) ) {\n\
                sameCount += 1;\n\
              }\n\
            }\n\
          }\n\
\n\
          if (sameCount > 5) {\n\
            lostPoint += (3 + sameCount - 5);\n\
          }\n\
        }\n\
      };\n\
\n\
      // LEVEL2\n\
\n\
      for (var row = 0; row < moduleCount - 1; row += 1) {\n\
        for (var col = 0; col < moduleCount - 1; col += 1) {\n\
          var count = 0;\n\
          if (qrcode.isDark(row, col) ) count += 1;\n\
          if (qrcode.isDark(row + 1, col) ) count += 1;\n\
          if (qrcode.isDark(row, col + 1) ) count += 1;\n\
          if (qrcode.isDark(row + 1, col + 1) ) count += 1;\n\
          if (count == 0 || count == 4) {\n\
            lostPoint += 3;\n\
          }\n\
        }\n\
      }\n\
\n\
      // LEVEL3\n\
\n\
      for (var row = 0; row < moduleCount; row += 1) {\n\
        for (var col = 0; col < moduleCount - 6; col += 1) {\n\
          if (qrcode.isDark(row, col)\n\
              && !qrcode.isDark(row, col + 1)\n\
              &&  qrcode.isDark(row, col + 2)\n\
              &&  qrcode.isDark(row, col + 3)\n\
              &&  qrcode.isDark(row, col + 4)\n\
              && !qrcode.isDark(row, col + 5)\n\
              &&  qrcode.isDark(row, col + 6) ) {\n\
            lostPoint += 40;\n\
          }\n\
        }\n\
      }\n\
\n\
      for (var col = 0; col < moduleCount; col += 1) {\n\
        for (var row = 0; row < moduleCount - 6; row += 1) {\n\
          if (qrcode.isDark(row, col)\n\
              && !qrcode.isDark(row + 1, col)\n\
              &&  qrcode.isDark(row + 2, col)\n\
              &&  qrcode.isDark(row + 3, col)\n\
              &&  qrcode.isDark(row + 4, col)\n\
              && !qrcode.isDark(row + 5, col)\n\
              &&  qrcode.isDark(row + 6, col) ) {\n\
            lostPoint += 40;\n\
          }\n\
        }\n\
      }\n\
\n\
      // LEVEL4\n\
\n\
      var darkCount = 0;\n\
\n\
      for (var col = 0; col < moduleCount; col += 1) {\n\
        for (var row = 0; row < moduleCount; row += 1) {\n\
          if (qrcode.isDark(row, col) ) {\n\
            darkCount += 1;\n\
          }\n\
        }\n\
      }\n\
\n\
      var ratio = Math.abs(100 * darkCount / moduleCount / moduleCount - 50) / 5;\n\
      lostPoint += ratio * 10;\n\
\n\
      return lostPoint;\n\
    };\n\
\n\
    return _this;\n\
  }();\n\
\n\
  //---------------------------------------------------------------------\n\
  // QRMath\n\
  //---------------------------------------------------------------------\n\
\n\
  var QRMath = function() {\n\
\n\
    var EXP_TABLE = new Array(256);\n\
    var LOG_TABLE = new Array(256);\n\
\n\
    // initialize tables\n\
    for (var i = 0; i < 8; i += 1) {\n\
      EXP_TABLE[i] = 1 << i;\n\
    }\n\
    for (var i = 8; i < 256; i += 1) {\n\
      EXP_TABLE[i] = EXP_TABLE[i - 4]\n\
        ^ EXP_TABLE[i - 5]\n\
        ^ EXP_TABLE[i - 6]\n\
        ^ EXP_TABLE[i - 8];\n\
    }\n\
    for (var i = 0; i < 255; i += 1) {\n\
      LOG_TABLE[EXP_TABLE[i] ] = i;\n\
    }\n\
\n\
    var _this = {};\n\
\n\
    _this.glog = function(n) {\n\
\n\
      if (n < 1) {\n\
        throw new Error('glog(' + n + ')');\n\
      }\n\
\n\
      return LOG_TABLE[n];\n\
    };\n\
\n\
    _this.gexp = function(n) {\n\
\n\
      while (n < 0) {\n\
        n += 255;\n\
      }\n\
\n\
      while (n >= 256) {\n\
        n -= 255;\n\
      }\n\
\n\
      return EXP_TABLE[n];\n\
    };\n\
\n\
    return _this;\n\
  }();\n\
\n\
  //---------------------------------------------------------------------\n\
  // qrPolynomial\n\
  //---------------------------------------------------------------------\n\
\n\
  function qrPolynomial(num, shift) {\n\
\n\
    if (typeof num.length == 'undefined') {\n\
      throw new Error(num.length + '/' + shift);\n\
    }\n\
\n\
    var _num = function() {\n\
      var offset = 0;\n\
      while (offset < num.length && num[offset] == 0) {\n\
        offset += 1;\n\
      }\n\
      var _num = new Array(num.length - offset + shift);\n\
      for (var i = 0; i < num.length - offset; i += 1) {\n\
        _num[i] = num[i + offset];\n\
      }\n\
      return _num;\n\
    }();\n\
\n\
    var _this = {};\n\
\n\
    _this.getAt = function(index) {\n\
      return _num[index];\n\
    };\n\
\n\
    _this.getLength = function() {\n\
      return _num.length;\n\
    };\n\
\n\
    _this.multiply = function(e) {\n\
\n\
      var num = new Array(_this.getLength() + e.getLength() - 1);\n\
\n\
      for (var i = 0; i < _this.getLength(); i += 1) {\n\
        for (var j = 0; j < e.getLength(); j += 1) {\n\
          num[i + j] ^= QRMath.gexp(QRMath.glog(_this.getAt(i) ) + QRMath.glog(e.getAt(j) ) );\n\
        }\n\
      }\n\
\n\
      return qrPolynomial(num, 0);\n\
    };\n\
\n\
    _this.mod = function(e) {\n\
\n\
      if (_this.getLength() - e.getLength() < 0) {\n\
        return _this;\n\
      }\n\
\n\
      var ratio = QRMath.glog(_this.getAt(0) ) - QRMath.glog(e.getAt(0) );\n\
\n\
      var num = new Array(_this.getLength() );\n\
      for (var i = 0; i < _this.getLength(); i += 1) {\n\
        num[i] = _this.getAt(i);\n\
      }\n\
\n\
      for (var i = 0; i < e.getLength(); i += 1) {\n\
        num[i] ^= QRMath.gexp(QRMath.glog(e.getAt(i) ) + ratio);\n\
      }\n\
\n\
      // recursive call\n\
      return qrPolynomial(num, 0).mod(e);\n\
    };\n\
\n\
    return _this;\n\
  };\n\
\n\
  //---------------------------------------------------------------------\n\
  // QRRSBlock\n\
  //---------------------------------------------------------------------\n\
\n\
  var QRRSBlock = function() {\n\
\n\
    var RS_BLOCK_TABLE = [\n\
\n\
      // L\n\
      // M\n\
      // Q\n\
      // H\n\
\n\
      // 1\n\
      [1, 26, 19],\n\
      [1, 26, 16],\n\
      [1, 26, 13],\n\
      [1, 26, 9],\n\
\n\
      // 2\n\
      [1, 44, 34],\n\
      [1, 44, 28],\n\
      [1, 44, 22],\n\
      [1, 44, 16],\n\
\n\
      // 3\n\
      [1, 70, 55],\n\
      [1, 70, 44],\n\
      [2, 35, 17],\n\
      [2, 35, 13],\n\
\n\
      // 4\n\
      [1, 100, 80],\n\
      [2, 50, 32],\n\
      [2, 50, 24],\n\
      [4, 25, 9],\n\
\n\
      // 5\n\
      [1, 134, 108],\n\
      [2, 67, 43],\n\
      [2, 33, 15, 2, 34, 16],\n\
      [2, 33, 11, 2, 34, 12],\n\
\n\
      // 6\n\
      [2, 86, 68],\n\
      [4, 43, 27],\n\
      [4, 43, 19],\n\
      [4, 43, 15],\n\
\n\
      // 7\n\
      [2, 98, 78],\n\
      [4, 49, 31],\n\
      [2, 32, 14, 4, 33, 15],\n\
      [4, 39, 13, 1, 40, 14],\n\
\n\
      // 8\n\
      [2, 121, 97],\n\
      [2, 60, 38, 2, 61, 39],\n\
      [4, 40, 18, 2, 41, 19],\n\
      [4, 40, 14, 2, 41, 15],\n\
\n\
      // 9\n\
      [2, 146, 116],\n\
      [3, 58, 36, 2, 59, 37],\n\
      [4, 36, 16, 4, 37, 17],\n\
      [4, 36, 12, 4, 37, 13],\n\
\n\
      // 10\n\
      [2, 86, 68, 2, 87, 69],\n\
      [4, 69, 43, 1, 70, 44],\n\
      [6, 43, 19, 2, 44, 20],\n\
      [6, 43, 15, 2, 44, 16]\n\
    ];\n\
\n\
    var qrRSBlock = function(totalCount, dataCount) {\n\
      var _this = {};\n\
      _this.totalCount = totalCount;\n\
      _this.dataCount = dataCount;\n\
      return _this;\n\
    };\n\
\n\
    var _this = {};\n\
\n\
    var getRsBlockTable = function(typeNumber, errorCorrectLevel) {\n\
\n\
      switch(errorCorrectLevel) {\n\
      case QRErrorCorrectLevel.L :\n\
        return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0];\n\
      case QRErrorCorrectLevel.M :\n\
        return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1];\n\
      case QRErrorCorrectLevel.Q :\n\
        return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2];\n\
      case QRErrorCorrectLevel.H :\n\
        return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3];\n\
      default :\n\
        return undefined;\n\
      }\n\
    };\n\
\n\
    _this.getRSBlocks = function(typeNumber, errorCorrectLevel) {\n\
\n\
      var rsBlock = getRsBlockTable(typeNumber, errorCorrectLevel);\n\
\n\
      if (typeof rsBlock == 'undefined') {\n\
        throw new Error('bad rs block @ typeNumber:' + typeNumber +\n\
            '/errorCorrectLevel:' + errorCorrectLevel);\n\
      }\n\
\n\
      var length = rsBlock.length / 3;\n\
\n\
      var list = new Array();\n\
\n\
      for (var i = 0; i < length; i += 1) {\n\
\n\
        var count = rsBlock[i * 3 + 0];\n\
        var totalCount = rsBlock[i * 3 + 1];\n\
        var dataCount = rsBlock[i * 3 + 2];\n\
\n\
        for (var j = 0; j < count; j += 1) {\n\
          list.push(qrRSBlock(totalCount, dataCount) );\n\
        }\n\
      }\n\
\n\
      return list;\n\
    };\n\
\n\
    return _this;\n\
  }();\n\
\n\
  //---------------------------------------------------------------------\n\
  // qrBitBuffer\n\
  //---------------------------------------------------------------------\n\
\n\
  var qrBitBuffer = function() {\n\
\n\
    var _buffer = new Array();\n\
    var _length = 0;\n\
\n\
    var _this = {};\n\
\n\
    _this.getBuffer = function() {\n\
      return _buffer;\n\
    };\n\
\n\
    _this.getAt = function(index) {\n\
      var bufIndex = Math.floor(index / 8);\n\
      return ( (_buffer[bufIndex] >>> (7 - index % 8) ) & 1) == 1;\n\
    };\n\
\n\
    _this.put = function(num, length) {\n\
      for (var i = 0; i < length; i += 1) {\n\
        _this.putBit( ( (num >>> (length - i - 1) ) & 1) == 1);\n\
      }\n\
    };\n\
\n\
    _this.getLengthInBits = function() {\n\
      return _length;\n\
    };\n\
\n\
    _this.putBit = function(bit) {\n\
\n\
      var bufIndex = Math.floor(_length / 8);\n\
      if (_buffer.length <= bufIndex) {\n\
        _buffer.push(0);\n\
      }\n\
\n\
      if (bit) {\n\
        _buffer[bufIndex] |= (0x80 >>> (_length % 8) );\n\
      }\n\
\n\
      _length += 1;\n\
    };\n\
\n\
    return _this;\n\
  };\n\
\n\
  //---------------------------------------------------------------------\n\
  // qr8BitByte\n\
  //---------------------------------------------------------------------\n\
\n\
  var qr8BitByte = function(data) {\n\
\n\
    var _mode = QRMode.MODE_8BIT_BYTE;\n\
    var _data = data;\n\
    var _bytes = qrcode.stringToBytes(data);\n\
\n\
    var _this = {};\n\
\n\
    _this.getMode = function() {\n\
      return _mode;\n\
    };\n\
\n\
    _this.getLength = function(buffer) {\n\
      return _bytes.length;\n\
    };\n\
\n\
    _this.write = function(buffer) {\n\
      for (var i = 0; i < _bytes.length; i += 1) {\n\
        buffer.put(_bytes[i], 8);\n\
      }\n\
    };\n\
\n\
    return _this;\n\
  };\n\
\n\
  //=====================================================================\n\
  // GIF Support etc.\n\
  //\n\
\n\
  //---------------------------------------------------------------------\n\
  // byteArrayOutputStream\n\
  //---------------------------------------------------------------------\n\
\n\
  var byteArrayOutputStream = function() {\n\
\n\
    var _bytes = new Array();\n\
\n\
    var _this = {};\n\
\n\
    _this.writeByte = function(b) {\n\
      _bytes.push(b & 0xff);\n\
    };\n\
\n\
    _this.writeShort = function(i) {\n\
      _this.writeByte(i);\n\
      _this.writeByte(i >>> 8);\n\
    };\n\
\n\
    _this.writeBytes = function(b, off, len) {\n\
      off = off || 0;\n\
      len = len || b.length;\n\
      for (var i = 0; i < len; i += 1) {\n\
        _this.writeByte(b[i + off]);\n\
      }\n\
    };\n\
\n\
    _this.writeString = function(s) {\n\
      for (var i = 0; i < s.length; i += 1) {\n\
        _this.writeByte(s.charCodeAt(i) );\n\
      }\n\
    };\n\
\n\
    _this.toByteArray = function() {\n\
      return _bytes;\n\
    };\n\
\n\
    _this.toString = function() {\n\
      var s = '';\n\
      s += '[';\n\
      for (var i = 0; i < _bytes.length; i += 1) {\n\
        if (i > 0) {\n\
          s += ',';\n\
        }\n\
        s += _bytes[i];\n\
      }\n\
      s += ']';\n\
      return s;\n\
    };\n\
\n\
    return _this;\n\
  };\n\
\n\
  //---------------------------------------------------------------------\n\
  // base64EncodeOutputStream\n\
  //---------------------------------------------------------------------\n\
\n\
  var base64EncodeOutputStream = function() {\n\
\n\
    var _buffer = 0;\n\
    var _buflen = 0;\n\
    var _length = 0;\n\
    var _base64 = '';\n\
\n\
    var _this = {};\n\
\n\
    var writeEncoded = function(b) {\n\
      _base64 += String.fromCharCode(encode(b & 0x3f) );\n\
    };\n\
\n\
    var encode = function(n) {\n\
      if (n < 0) {\n\
        // error.\n\
      } else if (n < 26) {\n\
        return 0x41 + n;\n\
      } else if (n < 52) {\n\
        return 0x61 + (n - 26);\n\
      } else if (n < 62) {\n\
        return 0x30 + (n - 52);\n\
      } else if (n == 62) {\n\
        return 0x2b;\n\
      } else if (n == 63) {\n\
        return 0x2f;\n\
      }\n\
      throw new Error('n:' + n);\n\
    };\n\
\n\
    _this.writeByte = function(n) {\n\
\n\
      _buffer = (_buffer << 8) | (n & 0xff);\n\
      _buflen += 8;\n\
      _length += 1;\n\
\n\
      while (_buflen >= 6) {\n\
        writeEncoded(_buffer >>> (_buflen - 6) );\n\
        _buflen -= 6;\n\
      }\n\
    };\n\
\n\
    _this.flush = function() {\n\
\n\
      if (_buflen > 0) {\n\
        writeEncoded(_buffer << (6 - _buflen) );\n\
        _buffer = 0;\n\
        _buflen = 0;\n\
      }\n\
\n\
      if (_length % 3 != 0) {\n\
        // padding\n\
        var padlen = 3 - _length % 3;\n\
        for (var i = 0; i < padlen; i += 1) {\n\
          _base64 += '=';\n\
        }\n\
      }\n\
    };\n\
\n\
    _this.toString = function() {\n\
      return _base64;\n\
    };\n\
\n\
    return _this;\n\
  };\n\
\n\
  //---------------------------------------------------------------------\n\
  // base64DecodeInputStream\n\
  //---------------------------------------------------------------------\n\
\n\
  var base64DecodeInputStream = function(str) {\n\
\n\
    var _str = str;\n\
    var _pos = 0;\n\
    var _buffer = 0;\n\
    var _buflen = 0;\n\
\n\
    var _this = {};\n\
\n\
    _this.read = function() {\n\
\n\
      while (_buflen < 8) {\n\
\n\
        if (_pos >= _str.length) {\n\
          if (_buflen == 0) {\n\
            return -1;\n\
          }\n\
          throw new Error('unexpected end of file./' + _buflen);\n\
        }\n\
\n\
        var c = _str.charAt(_pos);\n\
        _pos += 1;\n\
\n\
        if (c == '=') {\n\
          _buflen = 0;\n\
          return -1;\n\
        } else if (c.match(/^\\s$/) ) {\n\
          // ignore if whitespace.\n\
          continue;\n\
        }\n\
\n\
        _buffer = (_buffer << 6) | decode(c.charCodeAt(0) );\n\
        _buflen += 6;\n\
      }\n\
\n\
      var n = (_buffer >>> (_buflen - 8) ) & 0xff;\n\
      _buflen -= 8;\n\
      return n;\n\
    };\n\
\n\
    var decode = function(c) {\n\
      if (0x41 <= c && c <= 0x5a) {\n\
        return c - 0x41;\n\
      } else if (0x61 <= c && c <= 0x7a) {\n\
        return c - 0x61 + 26;\n\
      } else if (0x30 <= c && c <= 0x39) {\n\
        return c - 0x30 + 52;\n\
      } else if (c == 0x2b) {\n\
        return 62;\n\
      } else if (c == 0x2f) {\n\
        return 63;\n\
      } else {\n\
        throw new Error('c:' + c);\n\
      }\n\
    };\n\
\n\
    return _this;\n\
  };\n\
\n\
  //---------------------------------------------------------------------\n\
  // gifImage (B/W)\n\
  //---------------------------------------------------------------------\n\
\n\
  var gifImage = function(width, height) {\n\
\n\
    var _width = width;\n\
    var _height = height;\n\
    var _data = new Array(width * height);\n\
\n\
    var _this = {};\n\
\n\
    _this.setPixel = function(x, y, pixel) {\n\
      _data[y * _width + x] = pixel;\n\
    };\n\
\n\
    _this.write = function(out) {\n\
\n\
      //---------------------------------\n\
      // GIF Signature\n\
\n\
      out.writeString('GIF87a');\n\
\n\
      //---------------------------------\n\
      // Screen Descriptor\n\
\n\
      out.writeShort(_width);\n\
      out.writeShort(_height);\n\
\n\
      out.writeByte(0x80); // 2bit\n\
      out.writeByte(0);\n\
      out.writeByte(0);\n\
\n\
      //---------------------------------\n\
      // Global Color Map\n\
\n\
      // black\n\
      out.writeByte(0x00);\n\
      out.writeByte(0x00);\n\
      out.writeByte(0x00);\n\
\n\
      // white\n\
      out.writeByte(0xff);\n\
      out.writeByte(0xff);\n\
      out.writeByte(0xff);\n\
\n\
      //---------------------------------\n\
      // Image Descriptor\n\
\n\
      out.writeString(',');\n\
      out.writeShort(0);\n\
      out.writeShort(0);\n\
      out.writeShort(_width);\n\
      out.writeShort(_height);\n\
      out.writeByte(0);\n\
\n\
      //---------------------------------\n\
      // Local Color Map\n\
\n\
      //---------------------------------\n\
      // Raster Data\n\
\n\
      var lzwMinCodeSize = 2;\n\
      var raster = getLZWRaster(lzwMinCodeSize);\n\
\n\
      out.writeByte(lzwMinCodeSize);\n\
\n\
      var offset = 0;\n\
\n\
      while (raster.length - offset > 255) {\n\
        out.writeByte(255);\n\
        out.writeBytes(raster, offset, 255);\n\
        offset += 255;\n\
      }\n\
\n\
      out.writeByte(raster.length - offset);\n\
      out.writeBytes(raster, offset, raster.length - offset);\n\
      out.writeByte(0x00);\n\
\n\
      //---------------------------------\n\
      // GIF Terminator\n\
      out.writeString(';');\n\
    };\n\
\n\
    var bitOutputStream = function(out) {\n\
\n\
      var _out = out;\n\
      var _bitLength = 0;\n\
      var _bitBuffer = 0;\n\
\n\
      var _this = {};\n\
\n\
      _this.write = function(data, length) {\n\
\n\
        if ( (data >>> length) != 0) {\n\
          throw new Error('length over');\n\
        }\n\
\n\
        while (_bitLength + length >= 8) {\n\
          _out.writeByte(0xff & ( (data << _bitLength) | _bitBuffer) );\n\
          length -= (8 - _bitLength);\n\
          data >>>= (8 - _bitLength);\n\
          _bitBuffer = 0;\n\
          _bitLength = 0;\n\
        }\n\
\n\
        _bitBuffer = (data << _bitLength) | _bitBuffer;\n\
        _bitLength = _bitLength + length;\n\
      };\n\
\n\
      _this.flush = function() {\n\
        if (_bitLength > 0) {\n\
          _out.writeByte(_bitBuffer);\n\
        }\n\
      };\n\
\n\
      return _this;\n\
    };\n\
\n\
    var getLZWRaster = function(lzwMinCodeSize) {\n\
\n\
      var clearCode = 1 << lzwMinCodeSize;\n\
      var endCode = (1 << lzwMinCodeSize) + 1;\n\
      var bitLength = lzwMinCodeSize + 1;\n\
\n\
      // Setup LZWTable\n\
      var table = lzwTable();\n\
\n\
      for (var i = 0; i < clearCode; i += 1) {\n\
        table.add(String.fromCharCode(i) );\n\
      }\n\
      table.add(String.fromCharCode(clearCode) );\n\
      table.add(String.fromCharCode(endCode) );\n\
\n\
      var byteOut = byteArrayOutputStream();\n\
      var bitOut = bitOutputStream(byteOut);\n\
\n\
      // clear code\n\
      bitOut.write(clearCode, bitLength);\n\
\n\
      var dataIndex = 0;\n\
\n\
      var s = String.fromCharCode(_data[dataIndex]);\n\
      dataIndex += 1;\n\
\n\
      while (dataIndex < _data.length) {\n\
\n\
        var c = String.fromCharCode(_data[dataIndex]);\n\
        dataIndex += 1;\n\
\n\
        if (table.contains(s + c) ) {\n\
\n\
          s = s + c;\n\
\n\
        } else {\n\
\n\
          bitOut.write(table.indexOf(s), bitLength);\n\
\n\
          if (table.size() < 0xfff) {\n\
\n\
            if (table.size() == (1 << bitLength) ) {\n\
              bitLength += 1;\n\
            }\n\
\n\
            table.add(s + c);\n\
          }\n\
\n\
          s = c;\n\
        }\n\
      }\n\
\n\
      bitOut.write(table.indexOf(s), bitLength);\n\
\n\
      // end code\n\
      bitOut.write(endCode, bitLength);\n\
\n\
      bitOut.flush();\n\
\n\
      return byteOut.toByteArray();\n\
    };\n\
\n\
    var lzwTable = function() {\n\
\n\
      var _map = {};\n\
      var _size = 0;\n\
\n\
      var _this = {};\n\
\n\
      _this.add = function(key) {\n\
        if (_this.contains(key) ) {\n\
          throw new Error('dup key:' + key);\n\
        }\n\
        _map[key] = _size;\n\
        _size += 1;\n\
      };\n\
\n\
      _this.size = function() {\n\
        return _size;\n\
      };\n\
\n\
      _this.indexOf = function(key) {\n\
        return _map[key];\n\
      };\n\
\n\
      _this.contains = function(key) {\n\
        return typeof _map[key] != 'undefined';\n\
      };\n\
\n\
      return _this;\n\
    };\n\
\n\
    return _this;\n\
  };\n\
\n\
  var createImgTag = function(width, height, getPixel, alt) {\n\
\n\
    var gif = gifImage(width, height);\n\
    for (var y = 0; y < height; y += 1) {\n\
      for (var x = 0; x < width; x += 1) {\n\
        gif.setPixel(x, y, getPixel(x, y) );\n\
      }\n\
    }\n\
\n\
    var b = byteArrayOutputStream();\n\
    gif.write(b);\n\
\n\
    var base64 = base64EncodeOutputStream();\n\
    var bytes = b.toByteArray();\n\
    for (var i = 0; i < bytes.length; i += 1) {\n\
      base64.writeByte(bytes[i]);\n\
    }\n\
    base64.flush();\n\
\n\
    var img = '';\n\
    img += '<img';\n\
    img += '\\u0020src=\"';\n\
    img += 'data:image/gif;base64,';\n\
    img += base64;\n\
    img += '\"';\n\
    img += '\\u0020width=\"';\n\
    img += width;\n\
    img += '\"';\n\
    img += '\\u0020height=\"';\n\
    img += height;\n\
    img += '\"';\n\
    if (alt) {\n\
      img += '\\u0020alt=\"';\n\
      img += alt;\n\
      img += '\"';\n\
    }\n\
    img += '/>';\n\
\n\
    return img;\n\
  };\n\
\n\
  //---------------------------------------------------------------------\n\
  // returns qrcode function.\n\
\n\
  return qrcode;\n\
}();\n\
//@ sourceURL=matthewmueller-qr-code/qr-code.js"
));
require.register("component-domify/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Expose `parse`.\n\
 */\n\
\n\
module.exports = parse;\n\
\n\
/**\n\
 * Wrap map from jquery.\n\
 */\n\
\n\
var map = {\n\
  legend: [1, '<fieldset>', '</fieldset>'],\n\
  tr: [2, '<table><tbody>', '</tbody></table>'],\n\
  col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],\n\
  _default: [0, '', '']\n\
};\n\
\n\
map.td =\n\
map.th = [3, '<table><tbody><tr>', '</tr></tbody></table>'];\n\
\n\
map.option =\n\
map.optgroup = [1, '<select multiple=\"multiple\">', '</select>'];\n\
\n\
map.thead =\n\
map.tbody =\n\
map.colgroup =\n\
map.caption =\n\
map.tfoot = [1, '<table>', '</table>'];\n\
\n\
map.text =\n\
map.circle =\n\
map.ellipse =\n\
map.line =\n\
map.path =\n\
map.polygon =\n\
map.polyline =\n\
map.rect = [1, '<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\">','</svg>'];\n\
\n\
/**\n\
 * Parse `html` and return the children.\n\
 *\n\
 * @param {String} html\n\
 * @return {Array}\n\
 * @api private\n\
 */\n\
\n\
function parse(html) {\n\
  if ('string' != typeof html) throw new TypeError('String expected');\n\
  \n\
  // tag name\n\
  var m = /<([\\w:]+)/.exec(html);\n\
  if (!m) return document.createTextNode(html);\n\
\n\
  html = html.replace(/^\\s+|\\s+$/g, ''); // Remove leading/trailing whitespace\n\
\n\
  var tag = m[1];\n\
\n\
  // body support\n\
  if (tag == 'body') {\n\
    var el = document.createElement('html');\n\
    el.innerHTML = html;\n\
    return el.removeChild(el.lastChild);\n\
  }\n\
\n\
  // wrap map\n\
  var wrap = map[tag] || map._default;\n\
  var depth = wrap[0];\n\
  var prefix = wrap[1];\n\
  var suffix = wrap[2];\n\
  var el = document.createElement('div');\n\
  el.innerHTML = prefix + html + suffix;\n\
  while (depth--) el = el.lastChild;\n\
\n\
  // one element\n\
  if (el.firstChild == el.lastChild) {\n\
    return el.removeChild(el.firstChild);\n\
  }\n\
\n\
  // several elements\n\
  var fragment = document.createDocumentFragment();\n\
  while (el.firstChild) {\n\
    fragment.appendChild(el.removeChild(el.firstChild));\n\
  }\n\
\n\
  return fragment;\n\
}\n\
//@ sourceURL=component-domify/index.js"
));
require.register("segmentio-overlay/lib/index.js", Function("exports, require, module",
"var template = require('./index.html');\n\
var domify = require('domify');\n\
var emitter = require('emitter');\n\
var showable = require('showable');\n\
var classes = require('classes');\n\
\n\
/**\n\
 * Export `Overlay`\n\
 */\n\
module.exports = Overlay;\n\
\n\
\n\
/**\n\
 * Initialize a new `Overlay`.\n\
 *\n\
 * @param {Element} target The element to attach the overlay to\n\
 * @api public\n\
 */\n\
\n\
function Overlay(target) {\n\
  if(!(this instanceof Overlay)) return new Overlay(target);\n\
\n\
  this.target = target || document.body;\n\
  this.el = domify(template);\n\
  this.el.addEventListener('click', this.handleClick.bind(this));\n\
\n\
  var el = this.el;\n\
  var parent = this.target;\n\
\n\
  this.on('showing', function(){\n\
    parent.appendChild(el);\n\
  });\n\
\n\
  this.on('hide', function(){\n\
    parent.removeChild(el);\n\
  });\n\
}\n\
\n\
\n\
/**\n\
 * When the overlay is click, emit an event so that\n\
 * the view that is using this overlay can choose\n\
 * to close the overlay if they want\n\
 *\n\
 * @param {Event} e\n\
 */\n\
Overlay.prototype.handleClick = function(e){\n\
  this.emit('click', e);\n\
};\n\
\n\
\n\
/**\n\
 * Mixins\n\
 */\n\
emitter(Overlay.prototype);\n\
showable(Overlay.prototype);\n\
classes(Overlay.prototype);//@ sourceURL=segmentio-overlay/lib/index.js"
));
require.register("timoxley-next-tick/index.js", Function("exports, require, module",
"\"use strict\"\n\
\n\
if (typeof setImmediate == 'function') {\n\
  module.exports = function(f){ setImmediate(f) }\n\
}\n\
// legacy node.js\n\
else if (typeof process != 'undefined' && typeof process.nextTick == 'function') {\n\
  module.exports = process.nextTick\n\
}\n\
// fallback for other environments / postMessage behaves badly on IE8\n\
else if (typeof window == 'undefined' || window.ActiveXObject || !window.postMessage) {\n\
  module.exports = function(f){ setTimeout(f) };\n\
} else {\n\
  var q = [];\n\
\n\
  window.addEventListener('message', function(){\n\
    var i = 0;\n\
    while (i < q.length) {\n\
      try { q[i++](); }\n\
      catch (e) {\n\
        q = q.slice(i);\n\
        window.postMessage('tic!', '*');\n\
        throw e;\n\
      }\n\
    }\n\
    q.length = 0;\n\
  }, true);\n\
\n\
  module.exports = function(fn){\n\
    if (!q.length) window.postMessage('tic!', '*');\n\
    q.push(fn);\n\
  }\n\
}\n\
//@ sourceURL=timoxley-next-tick/index.js"
));
require.register("yields-has-transitions/index.js", Function("exports, require, module",
"/**\n\
 * Check if `el` or browser supports transitions.\n\
 *\n\
 * @param {Element} el\n\
 * @return {Boolean}\n\
 * @api public\n\
 */\n\
\n\
exports = module.exports = function(el){\n\
  switch (arguments.length) {\n\
    case 0: return bool;\n\
    case 1: return bool\n\
      ? transitions(el)\n\
      : bool;\n\
  }\n\
};\n\
\n\
/**\n\
 * Check if the given `el` has transitions.\n\
 *\n\
 * @param {Element} el\n\
 * @return {Boolean}\n\
 * @api private\n\
 */\n\
\n\
function transitions(el, styl){\n\
  if (el.transition) return true;\n\
  styl = window.getComputedStyle(el);\n\
  return !! parseFloat(styl.transitionDuration, 10);\n\
}\n\
\n\
/**\n\
 * Style.\n\
 */\n\
\n\
var styl = document.body.style;\n\
\n\
/**\n\
 * Export support.\n\
 */\n\
\n\
var bool = 'transition' in styl\n\
  || 'webkitTransition' in styl\n\
  || 'MozTransition' in styl\n\
  || 'msTransition' in styl;\n\
//@ sourceURL=yields-has-transitions/index.js"
));
require.register("component-event/index.js", Function("exports, require, module",
"var bind = window.addEventListener ? 'addEventListener' : 'attachEvent',\n\
    unbind = window.removeEventListener ? 'removeEventListener' : 'detachEvent',\n\
    prefix = bind !== 'addEventListener' ? 'on' : '';\n\
\n\
/**\n\
 * Bind `el` event `type` to `fn`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} type\n\
 * @param {Function} fn\n\
 * @param {Boolean} capture\n\
 * @return {Function}\n\
 * @api public\n\
 */\n\
\n\
exports.bind = function(el, type, fn, capture){\n\
  el[bind](prefix + type, fn, capture || false);\n\
  return fn;\n\
};\n\
\n\
/**\n\
 * Unbind `el` event `type`'s callback `fn`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} type\n\
 * @param {Function} fn\n\
 * @param {Boolean} capture\n\
 * @return {Function}\n\
 * @api public\n\
 */\n\
\n\
exports.unbind = function(el, type, fn, capture){\n\
  el[unbind](prefix + type, fn, capture || false);\n\
  return fn;\n\
};//@ sourceURL=component-event/index.js"
));
require.register("ecarter-css-emitter/index.js", Function("exports, require, module",
"/**\n\
 * Module Dependencies\n\
 */\n\
\n\
var events = require('event');\n\
\n\
// CSS events\n\
\n\
var watch = [\n\
  'transitionend'\n\
, 'webkitTransitionEnd'\n\
, 'oTransitionEnd'\n\
, 'MSTransitionEnd'\n\
, 'animationend'\n\
, 'webkitAnimationEnd'\n\
, 'oAnimationEnd'\n\
, 'MSAnimationEnd'\n\
];\n\
\n\
/**\n\
 * Expose `CSSnext`\n\
 */\n\
\n\
module.exports = CssEmitter;\n\
\n\
/**\n\
 * Initialize a new `CssEmitter`\n\
 *\n\
 */\n\
\n\
function CssEmitter(element){\n\
  if (!(this instanceof CssEmitter)) return new CssEmitter(element);\n\
  this.el = element;\n\
}\n\
\n\
/**\n\
 * Bind CSS events.\n\
 *\n\
 * @api public\n\
 */\n\
\n\
CssEmitter.prototype.bind = function(fn){\n\
  for (var i=0; i < watch.length; i++) {\n\
    events.bind(this.el, watch[i], fn);\n\
  }\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Unbind CSS events\n\
 * \n\
 * @api public\n\
 */\n\
\n\
CssEmitter.prototype.unbind = function(fn){\n\
  for (var i=0; i < watch.length; i++) {\n\
    events.unbind(this.el, watch[i], fn);\n\
  }\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Fire callback only once\n\
 * \n\
 * @api public\n\
 */\n\
\n\
CssEmitter.prototype.once = function(fn){\n\
  var self = this;\n\
  function on(){\n\
    self.unbind(on);\n\
    fn.apply(self.el, arguments);\n\
  }\n\
  self.bind(on);\n\
  return this;\n\
};\n\
\n\
//@ sourceURL=ecarter-css-emitter/index.js"
));
require.register("component-once/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Identifier.\n\
 */\n\
\n\
var n = 0;\n\
\n\
/**\n\
 * Global.\n\
 */\n\
\n\
var global = (function(){ return this })();\n\
\n\
/**\n\
 * Make `fn` callable only once.\n\
 *\n\
 * @param {Function} fn\n\
 * @return {Function}\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(fn) {\n\
  var id = n++;\n\
  var called;\n\
\n\
  function once(){\n\
    // no receiver\n\
    if (this == global) {\n\
      if (called) return;\n\
      called = true;\n\
      return fn.apply(this, arguments);\n\
    }\n\
\n\
    // receiver\n\
    var key = '__called_' + id + '__';\n\
    if (this[key]) return;\n\
    this[key] = true;\n\
    return fn.apply(this, arguments);\n\
  }\n\
\n\
  return once;\n\
};\n\
//@ sourceURL=component-once/index.js"
));
require.register("yields-after-transition/index.js", Function("exports, require, module",
"\n\
/**\n\
 * dependencies\n\
 */\n\
\n\
var has = require('has-transitions')\n\
  , emitter = require('css-emitter')\n\
  , once = require('once');\n\
\n\
/**\n\
 * Transition support.\n\
 */\n\
\n\
var supported = has();\n\
\n\
/**\n\
 * Export `after`\n\
 */\n\
\n\
module.exports = after;\n\
\n\
/**\n\
 * Invoke the given `fn` after transitions\n\
 *\n\
 * It will be invoked only if the browser\n\
 * supports transitions __and__\n\
 * the element has transitions\n\
 * set in `.style` or css.\n\
 *\n\
 * @param {Element} el\n\
 * @param {Function} fn\n\
 * @return {Function} fn\n\
 * @api public\n\
 */\n\
\n\
function after(el, fn){\n\
  if (!supported || !has(el)) return fn();\n\
  emitter(el).bind(fn);\n\
  return fn;\n\
};\n\
\n\
/**\n\
 * Same as `after()` only the function is invoked once.\n\
 *\n\
 * @param {Element} el\n\
 * @param {Function} fn\n\
 * @return {Function}\n\
 * @api public\n\
 */\n\
\n\
after.once = function(el, fn){\n\
  var callback = once(fn);\n\
  after(el, fn = function(){\n\
    emitter(el).unbind(fn);\n\
    callback();\n\
  });\n\
};\n\
//@ sourceURL=yields-after-transition/index.js"
));
require.register("segmentio-showable/index.js", Function("exports, require, module",
"var after = require('after-transition').once;\n\
var nextTick = require('next-tick');\n\
\n\
/**\n\
 * Hide the view\n\
 */\n\
function hide(fn){\n\
  var self = this;\n\
\n\
  if(this.hidden == null) {\n\
    this.hidden = this.el.classList.contains('hidden');\n\
  }\n\
\n\
  if(this.hidden || this.animating) return;\n\
\n\
  this.hidden = true;\n\
  this.animating = true;\n\
\n\
  after(self.el, function(){\n\
    self.animating = false;\n\
    self.emit('hide');\n\
    if(fn) fn();\n\
  });\n\
\n\
  self.el.classList.add('hidden');\n\
  this.emit('hiding');\n\
  return this;\n\
}\n\
\n\
/**\n\
 * Show the view. This waits until after any transitions\n\
 * are finished. It also removed the hide class on the next\n\
 * tick so that the transition actually paints.\n\
 */\n\
function show(fn){\n\
  var self = this;\n\
\n\
  if(this.hidden == null) {\n\
    this.hidden = this.el.classList.contains('hidden');\n\
  }\n\
\n\
  if(this.hidden === false || this.animating) return;\n\
\n\
  this.hidden = false;\n\
  this.animating = true;\n\
\n\
  this.emit('showing');\n\
\n\
  after(self.el, function(){\n\
    self.animating = false;\n\
    self.emit('show');\n\
    if(fn) fn();\n\
  });\n\
\n\
  this.el.offsetHeight;\n\
\n\
  nextTick(function(){\n\
    self.el.classList.remove('hidden');\n\
  });\n\
\n\
  return this;\n\
}\n\
\n\
/**\n\
 * Mixin methods into the view\n\
 *\n\
 * @param {Emitter} obj\n\
 */\n\
module.exports = function(obj) {\n\
  obj.hide = hide;\n\
  obj.show = show;\n\
  return obj;\n\
};//@ sourceURL=segmentio-showable/index.js"
));
require.register("component-indexof/index.js", Function("exports, require, module",
"module.exports = function(arr, obj){\n\
  if (arr.indexOf) return arr.indexOf(obj);\n\
  for (var i = 0; i < arr.length; ++i) {\n\
    if (arr[i] === obj) return i;\n\
  }\n\
  return -1;\n\
};//@ sourceURL=component-indexof/index.js"
));
require.register("segmentio-on-escape/index.js", Function("exports, require, module",
"\n\
var bind = require('event').bind\n\
  , indexOf = require('indexof');\n\
\n\
\n\
/**\n\
 * Expose `onEscape`.\n\
 */\n\
\n\
module.exports = exports = onEscape;\n\
\n\
\n\
/**\n\
 * Handlers.\n\
 */\n\
\n\
var fns = [];\n\
\n\
\n\
/**\n\
 * Escape binder.\n\
 *\n\
 * @param {Function} fn\n\
 */\n\
\n\
function onEscape (fn) {\n\
  fns.push(fn);\n\
}\n\
\n\
\n\
/**\n\
 * Bind a handler, for symmetry.\n\
 */\n\
\n\
exports.bind = onEscape;\n\
\n\
\n\
/**\n\
 * Unbind a handler.\n\
 *\n\
 * @param {Function} fn\n\
 */\n\
\n\
exports.unbind = function (fn) {\n\
  var index = indexOf(fns, fn);\n\
  if (index !== -1) fns.splice(index, 1);\n\
};\n\
\n\
\n\
/**\n\
 * Bind to `document` once.\n\
 */\n\
\n\
bind(document, 'keydown', function (e) {\n\
  if (27 !== e.keyCode) return;\n\
  for (var i = 0, fn; fn = fns[i]; i++) fn(e);\n\
});//@ sourceURL=segmentio-on-escape/index.js"
));
require.register("jkroso-classes/index.js", Function("exports, require, module",
"\n\
module.exports = document.createElement('div').classList\n\
  ? require('./modern')\n\
  : require('./fallback')//@ sourceURL=jkroso-classes/index.js"
));
require.register("jkroso-classes/fallback.js", Function("exports, require, module",
"\n\
var index = require('indexof')\n\
\n\
exports.add = function(name, el){\n\
\tvar arr = exports.array(el)\n\
\tif (index(arr, name) < 0) {\n\
\t\tarr.push(name)\n\
\t\tel.className = arr.join(' ')\n\
\t}\n\
}\n\
\n\
exports.remove = function(name, el){\n\
\tif (name instanceof RegExp) {\n\
\t\treturn exports.removeMatching(name, el)\n\
\t}\n\
\tvar arr = exports.array(el)\n\
\tvar i = index(arr, name)\n\
\tif (i >= 0) {\n\
\t\tarr.splice(i, 1)\n\
\t\tel.className = arr.join(' ')\n\
\t}\n\
}\n\
\n\
exports.removeMatching = function(re, el){\n\
\tvar arr = exports.array(el)\n\
\tfor (var i = 0; i < arr.length;) {\n\
\t\tif (re.test(arr[i])) arr.splice(i, 1)\n\
\t\telse i++\n\
\t}\n\
\tel.className = arr.join(' ')\n\
}\n\
\n\
exports.toggle = function(name, el){\n\
\tif (exports.has(name, el)) {\n\
\t\texports.remove(name, el)\n\
\t} else {\n\
\t\texports.add(name, el)\n\
\t}\n\
}\n\
\n\
exports.array = function(el){\n\
\treturn el.className.match(/([^\\s]+)/g) || []\n\
}\n\
\n\
exports.has =\n\
exports.contains = function(name, el){\n\
\treturn index(exports.array(el), name) >= 0\n\
}//@ sourceURL=jkroso-classes/fallback.js"
));
require.register("jkroso-classes/modern.js", Function("exports, require, module",
"\n\
/**\n\
 * Add class `name` if not already present.\n\
 *\n\
 * @param {String} name\n\
 * @param {Element} el\n\
 * @api public\n\
 */\n\
\n\
exports.add = function(name, el){\n\
\tel.classList.add(name)\n\
}\n\
\n\
/**\n\
 * Remove `name` if present\n\
 *\n\
 * @param {String|RegExp} name\n\
 * @param {Element} el\n\
 * @api public\n\
 */\n\
\n\
exports.remove = function(name, el){\n\
\tif (name instanceof RegExp) {\n\
\t\treturn exports.removeMatching(name, el)\n\
\t}\n\
\tel.classList.remove(name)\n\
}\n\
\n\
/**\n\
 * Remove all classes matching `re`.\n\
 *\n\
 * @param {RegExp} re\n\
 * @param {Element} el\n\
 * @api public\n\
 */\n\
\n\
exports.removeMatching = function(re, el){\n\
\tvar arr = exports.array(el)\n\
\tfor (var i = 0; i < arr.length; i++) {\n\
\t\tif (re.test(arr[i])) el.classList.remove(arr[i])\n\
\t}\n\
}\n\
\n\
/**\n\
 * Toggle class `name`.\n\
 *\n\
 * @param {String} name\n\
 * @param {Element} el\n\
 * @api public\n\
 */\n\
\n\
exports.toggle = function(name, el){\n\
\tel.classList.toggle(name)\n\
}\n\
\n\
/**\n\
 * Return an array of classes.\n\
 *\n\
 * @param {Element} el\n\
 * @return {Array}\n\
 * @api public\n\
 */\n\
\n\
exports.array = function(el){\n\
\treturn el.className.match(/([^\\s]+)/g) || []\n\
}\n\
\n\
/**\n\
 * Check if class `name` is present.\n\
 *\n\
 * @param {String} name\n\
 * @param {Element} el\n\
 * @api public\n\
 */\n\
\n\
exports.has =\n\
exports.contains = function(name, el){\n\
\treturn el.classList.contains(name)\n\
}//@ sourceURL=jkroso-classes/modern.js"
));
require.register("ianstormtaylor-classes/index.js", Function("exports, require, module",
"\n\
var classes = require('classes');\n\
\n\
\n\
/**\n\
 * Expose `mixin`.\n\
 */\n\
\n\
module.exports = exports = mixin;\n\
\n\
\n\
/**\n\
 * Mixin the classes methods.\n\
 *\n\
 * @param {Object} object\n\
 * @return {Object}\n\
 */\n\
\n\
function mixin (obj) {\n\
  for (var method in exports) obj[method] = exports[method];\n\
  return obj;\n\
}\n\
\n\
\n\
/**\n\
 * Add a class.\n\
 *\n\
 * @param {String} name\n\
 * @return {Object}\n\
 */\n\
\n\
exports.addClass = function (name) {\n\
  classes.add(name, this.el);\n\
  return this;\n\
};\n\
\n\
\n\
/**\n\
 * Remove a class.\n\
 *\n\
 * @param {String} name\n\
 * @return {Object}\n\
 */\n\
\n\
exports.removeClass = function (name) {\n\
  classes.remove(name, this.el);\n\
  return this;\n\
};\n\
\n\
\n\
/**\n\
 * Has a class?\n\
 *\n\
 * @param {String} name\n\
 * @return {Boolean}\n\
 */\n\
\n\
exports.hasClass = function (name) {\n\
  return classes.has(name, this.el);\n\
};\n\
\n\
\n\
/**\n\
 * Toggle a class.\n\
 *\n\
 * @param {String} name\n\
 * @return {Object}\n\
 */\n\
\n\
exports.toggleClass = function (name) {\n\
  classes.toggle(name, this.el);\n\
  return this;\n\
};\n\
//@ sourceURL=ianstormtaylor-classes/index.js"
));
require.register("segmentio-modal/lib/index.js", Function("exports, require, module",
"var domify = require('domify');\n\
var Emitter = require('emitter');\n\
var overlay = require('overlay');\n\
var onEscape = require('on-escape');\n\
var template = require('./index.html');\n\
var Showable = require('showable');\n\
var Classes = require('classes');\n\
\n\
/**\n\
 * Expose `Modal`.\n\
 */\n\
\n\
module.exports = Modal;\n\
\n\
\n\
/**\n\
 * Initialize a new `Modal`.\n\
 *\n\
 * @param {Element} el The element to put into a modal\n\
 */\n\
\n\
function Modal (el) {\n\
  if (!(this instanceof Modal)) return new Modal(el);\n\
  this.el = domify(template);\n\
  this.el.appendChild(el);\n\
  this._overlay = overlay();\n\
\n\
  var el = this.el;\n\
\n\
  this.on('showing', function(){\n\
    document.body.appendChild(el);\n\
  });\n\
\n\
  this.on('hide', function(){\n\
    document.body.removeChild(el);\n\
  });\n\
}\n\
\n\
\n\
/**\n\
 * Mixin emitter.\n\
 */\n\
\n\
Emitter(Modal.prototype);\n\
Showable(Modal.prototype);\n\
Classes(Modal.prototype);\n\
\n\
\n\
/**\n\
 * Set the transition in/out effect\n\
 *\n\
 * @param {String} type\n\
 *\n\
 * @return {Modal}\n\
 */\n\
\n\
Modal.prototype.effect = function(type) {\n\
  this.el.setAttribute('effect', type);\n\
  return this;\n\
};\n\
\n\
\n\
/**\n\
 * Add an overlay\n\
 *\n\
 * @param {Object} opts\n\
 *\n\
 * @return {Modal}\n\
 */\n\
\n\
Modal.prototype.overlay = function(){\n\
  var self = this;\n\
  this.on('showing', function(){\n\
    self._overlay.show();\n\
  });\n\
  this.on('hiding', function(){\n\
    self._overlay.hide();\n\
  });\n\
  return this;\n\
};\n\
\n\
\n\
/**\n\
 * Make the modal closeable.\n\
 *\n\
 * @return {Modal}\n\
 */\n\
\n\
Modal.prototype.closeable =\n\
Modal.prototype.closable = function () {\n\
  var self = this;\n\
\n\
  function hide(){\n\
    self.hide();\n\
  }\n\
\n\
  this._overlay.on('click', hide);\n\
  onEscape(hide);\n\
  return this;\n\
};//@ sourceURL=segmentio-modal/lib/index.js"
));
require.register("btknorr-ejs/ejs.js", Function("exports, require, module",
"module.exports = (function(){\n\
\n\
// CommonJS require()\n\
\n\
function require(p){\n\
    if ('fs' == p) return {};\n\
    var path = require.resolve(p)\n\
      , mod = require.modules[path];\n\
    if (!mod) throw new Error('failed to require \"' + p + '\"');\n\
    if (!mod.exports) {\n\
      mod.exports = {};\n\
      mod.call(mod.exports, mod, mod.exports, require.relative(path));\n\
    }\n\
    return mod.exports;\n\
  }\n\
\n\
require.modules = {};\n\
\n\
require.resolve = function (path){\n\
    var orig = path\n\
      , reg = path + '.js'\n\
      , index = path + '/index.js';\n\
    return require.modules[reg] && reg\n\
      || require.modules[index] && index\n\
      || orig;\n\
  };\n\
\n\
require.register = function (path, fn){\n\
    require.modules[path] = fn;\n\
  };\n\
\n\
require.relative = function (parent) {\n\
    return function(p){\n\
      if ('.' != p.substr(0, 1)) return require(p);\n\
      \n\
      var path = parent.split('/')\n\
        , segs = p.split('/');\n\
      path.pop();\n\
      \n\
      for (var i = 0; i < segs.length; i++) {\n\
        var seg = segs[i];\n\
        if ('..' == seg) path.pop();\n\
        else if ('.' != seg) path.push(seg);\n\
      }\n\
\n\
      return require(path.join('/'));\n\
    };\n\
  };\n\
\n\
\n\
require.register(\"ejs.js\", function(module, exports, require){\n\
\n\
/*!\n\
 * EJS\n\
 * Copyright(c) 2012 TJ Holowaychuk <tj@vision-media.ca>\n\
 * MIT Licensed\n\
 */\n\
\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var utils = require('./utils')\n\
  , fs = require('fs');\n\
\n\
/**\n\
 * Library version.\n\
 */\n\
\n\
exports.version = '0.7.2';\n\
\n\
/**\n\
 * Filters.\n\
 * \n\
 * @type Object\n\
 */\n\
\n\
var filters = exports.filters = require('./filters');\n\
\n\
/**\n\
 * Intermediate js cache.\n\
 * \n\
 * @type Object\n\
 */\n\
\n\
var cache = {};\n\
\n\
/**\n\
 * Clear intermediate js cache.\n\
 *\n\
 * @api public\n\
 */\n\
\n\
exports.clearCache = function(){\n\
  cache = {};\n\
};\n\
\n\
/**\n\
 * Translate filtered code into function calls.\n\
 *\n\
 * @param {String} js\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
function filtered(js) {\n\
  return js.substr(1).split('|').reduce(function(js, filter){\n\
    var parts = filter.split(':')\n\
      , name = parts.shift()\n\
      , args = parts.shift() || '';\n\
    if (args) args = ', ' + args;\n\
    return 'filters.' + name + '(' + js + args + ')';\n\
  });\n\
};\n\
\n\
/**\n\
 * Re-throw the given `err` in context to the\n\
 * `str` of ejs, `filename`, and `lineno`.\n\
 *\n\
 * @param {Error} err\n\
 * @param {String} str\n\
 * @param {String} filename\n\
 * @param {String} lineno\n\
 * @api private\n\
 */\n\
\n\
function rethrow(err, str, filename, lineno){\n\
  var lines = str.split('\\n\
')\n\
    , start = Math.max(lineno - 3, 0)\n\
    , end = Math.min(lines.length, lineno + 3);\n\
\n\
  // Error context\n\
  var context = lines.slice(start, end).map(function(line, i){\n\
    var curr = i + start + 1;\n\
    return (curr == lineno ? ' >> ' : '    ')\n\
      + curr\n\
      + '| '\n\
      + line;\n\
  }).join('\\n\
');\n\
\n\
  // Alter exception message\n\
  err.path = filename;\n\
  err.message = (filename || 'ejs') + ':' \n\
    + lineno + '\\n\
' \n\
    + context + '\\n\
\\n\
' \n\
    + err.message;\n\
  \n\
  throw err;\n\
}\n\
\n\
/**\n\
 * Parse the given `str` of ejs, returning the function body.\n\
 *\n\
 * @param {String} str\n\
 * @return {String}\n\
 * @api public\n\
 */\n\
\n\
var parse = exports.parse = function(str, options){\n\
  var options = options || {}\n\
    , open = options.open || exports.open || '<%'\n\
    , close = options.close || exports.close || '%>';\n\
\n\
  var buf = [\n\
      \"var buf = [];\"\n\
    , \"\\n\
with (locals) {\"\n\
    , \"\\n\
  buf.push('\"\n\
  ];\n\
  \n\
  var lineno = 1;\n\
\n\
  var consumeEOL = false;\n\
  for (var i = 0, len = str.length; i < len; ++i) {\n\
    if (str.slice(i, open.length + i) == open) {\n\
      i += open.length\n\
  \n\
      var prefix, postfix, line = '__stack.lineno=' + lineno;\n\
      switch (str.substr(i, 1)) {\n\
        case '=':\n\
          prefix = \"', escape((\" + line + ', ';\n\
          postfix = \")), '\";\n\
          ++i;\n\
          break;\n\
        case '-':\n\
          prefix = \"', (\" + line + ', ';\n\
          postfix = \"), '\";\n\
          ++i;\n\
          break;\n\
        default:\n\
          prefix = \"');\" + line + ';';\n\
          postfix = \"; buf.push('\";\n\
      }\n\
\n\
      var end = str.indexOf(close, i)\n\
        , js = str.substring(i, end)\n\
        , start = i\n\
        , n = 0;\n\
        \n\
      if ('-' == js[js.length-1]){\n\
        js = js.substring(0, js.length - 2);\n\
        consumeEOL = true;\n\
      }\n\
        \n\
      while (~(n = js.indexOf(\"\\n\
\", n))) n++, lineno++;\n\
      if (js.substr(0, 1) == ':') js = filtered(js);\n\
      buf.push(prefix, js, postfix);\n\
      i += end - start + close.length - 1;\n\
\n\
    } else if (str.substr(i, 1) == \"\\\\\") {\n\
      buf.push(\"\\\\\\\\\");\n\
    } else if (str.substr(i, 1) == \"'\") {\n\
      buf.push(\"\\\\'\");\n\
    } else if (str.substr(i, 1) == \"\\r\") {\n\
      buf.push(\" \");\n\
    } else if (str.substr(i, 1) == \"\\n\
\") {\n\
      if (consumeEOL) {\n\
        consumeEOL = false;\n\
      } else {\n\
        buf.push(\"\\\\n\
\");\n\
        lineno++;\n\
      }\n\
    } else {\n\
      buf.push(str.substr(i, 1));\n\
    }\n\
  }\n\
\n\
  buf.push(\"');\\n\
}\\n\
return buf.join('');\");\n\
  return buf.join('');\n\
};\n\
\n\
/**\n\
 * Compile the given `str` of ejs into a `Function`.\n\
 *\n\
 * @param {String} str\n\
 * @param {Object} options\n\
 * @return {Function}\n\
 * @api public\n\
 */\n\
\n\
var compile = exports.compile = function(str, options){\n\
  options = options || {};\n\
  \n\
  var input = JSON.stringify(str)\n\
    , filename = options.filename\n\
        ? JSON.stringify(options.filename)\n\
        : 'undefined';\n\
  \n\
  // Adds the fancy stack trace meta info\n\
  str = [\n\
    'var __stack = { lineno: 1, input: ' + input + ', filename: ' + filename + ' };',\n\
    rethrow.toString(),\n\
    'try {',\n\
    exports.parse(str, options),\n\
    '} catch (err) {',\n\
    '  rethrow(err, __stack.input, __stack.filename, __stack.lineno);',\n\
    '}'\n\
  ].join(\"\\n\
\");\n\
  \n\
  if (options.debug) console.log(str);\n\
  var fn = new Function('locals, filters, escape', str);\n\
  return function(locals){\n\
    return fn.call(this, locals, filters, utils.escape);\n\
  }\n\
};\n\
\n\
/**\n\
 * Render the given `str` of ejs.\n\
 *\n\
 * Options:\n\
 *\n\
 *   - `locals`          Local variables object\n\
 *   - `cache`           Compiled functions are cached, requires `filename`\n\
 *   - `filename`        Used by `cache` to key caches\n\
 *   - `scope`           Function execution context\n\
 *   - `debug`           Output generated function body\n\
 *   - `open`            Open tag, defaulting to \"<%\"\n\
 *   - `close`           Closing tag, defaulting to \"%>\"\n\
 *\n\
 * @param {String} str\n\
 * @param {Object} options\n\
 * @return {String}\n\
 * @api public\n\
 */\n\
\n\
exports.render = function(str, options){\n\
  var fn\n\
    , options = options || {};\n\
\n\
  if (options.cache) {\n\
    if (options.filename) {\n\
      fn = cache[options.filename] || (cache[options.filename] = compile(str, options));\n\
    } else {\n\
      throw new Error('\"cache\" option requires \"filename\".');\n\
    }\n\
  } else {\n\
    fn = compile(str, options);\n\
  }\n\
\n\
  options.__proto__ = options.locals;\n\
  return fn.call(options.scope, options);\n\
};\n\
\n\
/**\n\
 * Render an EJS file at the given `path` and callback `fn(err, str)`.\n\
 *\n\
 * @param {String} path\n\
 * @param {Object|Function} options or callback\n\
 * @param {Function} fn\n\
 * @api public\n\
 */\n\
\n\
exports.renderFile = function(path, options, fn){\n\
  var key = path + ':string';\n\
\n\
  if ('function' == typeof options) {\n\
    fn = options, options = {};\n\
  }\n\
\n\
  options.filename = path;\n\
\n\
  try {\n\
    var str = options.cache\n\
      ? cache[key] || (cache[key] = fs.readFileSync(path, 'utf8'))\n\
      : fs.readFileSync(path, 'utf8');\n\
\n\
    fn(null, exports.render(str, options));\n\
  } catch (err) {\n\
    fn(err);\n\
  }\n\
};\n\
\n\
// express support\n\
\n\
exports.__express = exports.renderFile;\n\
\n\
/**\n\
 * Expose to require().\n\
 */\n\
\n\
if (require.extensions) {\n\
  require.extensions['.ejs'] = function(module, filename) {\n\
    source = require('fs').readFileSync(filename, 'utf-8');\n\
    module._compile(compile(source, {}), filename);\n\
  };\n\
} else if (require.registerExtension) {\n\
  require.registerExtension('.ejs', function(src) {\n\
    return compile(src, {});\n\
  });\n\
}\n\
\n\
}); // module: ejs.js\n\
\n\
require.register(\"filters.js\", function(module, exports, require){\n\
\n\
/*!\n\
 * EJS - Filters\n\
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>\n\
 * MIT Licensed\n\
 */\n\
\n\
/**\n\
 * First element of the target `obj`.\n\
 */\n\
\n\
exports.first = function(obj) {\n\
  return obj[0];\n\
};\n\
\n\
/**\n\
 * Last element of the target `obj`.\n\
 */\n\
\n\
exports.last = function(obj) {\n\
  return obj[obj.length - 1];\n\
};\n\
\n\
/**\n\
 * Capitalize the first letter of the target `str`.\n\
 */\n\
\n\
exports.capitalize = function(str){\n\
  str = String(str);\n\
  return str[0].toUpperCase() + str.substr(1, str.length);\n\
};\n\
\n\
/**\n\
 * Downcase the target `str`.\n\
 */\n\
\n\
exports.downcase = function(str){\n\
  return String(str).toLowerCase();\n\
};\n\
\n\
/**\n\
 * Uppercase the target `str`.\n\
 */\n\
\n\
exports.upcase = function(str){\n\
  return String(str).toUpperCase();\n\
};\n\
\n\
/**\n\
 * Sort the target `obj`.\n\
 */\n\
\n\
exports.sort = function(obj){\n\
  return Object.create(obj).sort();\n\
};\n\
\n\
/**\n\
 * Sort the target `obj` by the given `prop` ascending.\n\
 */\n\
\n\
exports.sort_by = function(obj, prop){\n\
  return Object.create(obj).sort(function(a, b){\n\
    a = a[prop], b = b[prop];\n\
    if (a > b) return 1;\n\
    if (a < b) return -1;\n\
    return 0;\n\
  });\n\
};\n\
\n\
/**\n\
 * Size or length of the target `obj`.\n\
 */\n\
\n\
exports.size = exports.length = function(obj) {\n\
  return obj.length;\n\
};\n\
\n\
/**\n\
 * Add `a` and `b`.\n\
 */\n\
\n\
exports.plus = function(a, b){\n\
  return Number(a) + Number(b);\n\
};\n\
\n\
/**\n\
 * Subtract `b` from `a`.\n\
 */\n\
\n\
exports.minus = function(a, b){\n\
  return Number(a) - Number(b);\n\
};\n\
\n\
/**\n\
 * Multiply `a` by `b`.\n\
 */\n\
\n\
exports.times = function(a, b){\n\
  return Number(a) * Number(b);\n\
};\n\
\n\
/**\n\
 * Divide `a` by `b`.\n\
 */\n\
\n\
exports.divided_by = function(a, b){\n\
  return Number(a) / Number(b);\n\
};\n\
\n\
/**\n\
 * Join `obj` with the given `str`.\n\
 */\n\
\n\
exports.join = function(obj, str){\n\
  return obj.join(str || ', ');\n\
};\n\
\n\
/**\n\
 * Truncate `str` to `len`.\n\
 */\n\
\n\
exports.truncate = function(str, len){\n\
  str = String(str);\n\
  return str.substr(0, len);\n\
};\n\
\n\
/**\n\
 * Truncate `str` to `n` words.\n\
 */\n\
\n\
exports.truncate_words = function(str, n){\n\
  var str = String(str)\n\
    , words = str.split(/ +/);\n\
  return words.slice(0, n).join(' ');\n\
};\n\
\n\
/**\n\
 * Replace `pattern` with `substitution` in `str`.\n\
 */\n\
\n\
exports.replace = function(str, pattern, substitution){\n\
  return String(str).replace(pattern, substitution || '');\n\
};\n\
\n\
/**\n\
 * Prepend `val` to `obj`.\n\
 */\n\
\n\
exports.prepend = function(obj, val){\n\
  return Array.isArray(obj)\n\
    ? [val].concat(obj)\n\
    : val + obj;\n\
};\n\
\n\
/**\n\
 * Append `val` to `obj`.\n\
 */\n\
\n\
exports.append = function(obj, val){\n\
  return Array.isArray(obj)\n\
    ? obj.concat(val)\n\
    : obj + val;\n\
};\n\
\n\
/**\n\
 * Map the given `prop`.\n\
 */\n\
\n\
exports.map = function(arr, prop){\n\
  return arr.map(function(obj){\n\
    return obj[prop];\n\
  });\n\
};\n\
\n\
/**\n\
 * Reverse the given `obj`.\n\
 */\n\
\n\
exports.reverse = function(obj){\n\
  return Array.isArray(obj)\n\
    ? obj.reverse()\n\
    : String(obj).split('').reverse().join('');\n\
};\n\
\n\
/**\n\
 * Get `prop` of the given `obj`.\n\
 */\n\
\n\
exports.get = function(obj, prop){\n\
  return obj[prop];\n\
};\n\
\n\
/**\n\
 * Packs the given `obj` into json string\n\
 */\n\
exports.json = function(obj){\n\
  return JSON.stringify(obj);\n\
};\n\
}); // module: filters.js\n\
\n\
require.register(\"utils.js\", function(module, exports, require){\n\
\n\
/*!\n\
 * EJS\n\
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>\n\
 * MIT Licensed\n\
 */\n\
\n\
/**\n\
 * Escape the given string of `html`.\n\
 *\n\
 * @param {String} html\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
exports.escape = function(html){\n\
  return String(html)\n\
    .replace(/&(?!\\w+;)/g, '&amp;')\n\
    .replace(/</g, '&lt;')\n\
    .replace(/>/g, '&gt;')\n\
    .replace(/\"/g, '&quot;');\n\
};\n\
 \n\
}); // module: utils.js\n\
\n\
 return require(\"ejs\");\n\
})();//@ sourceURL=btknorr-ejs/ejs.js"
));
require.register("yields-k-sequence/index.js", Function("exports, require, module",
"\n\
/**\n\
 * dependencies\n\
 */\n\
\n\
var keycode = require('keycode');\n\
\n\
/**\n\
 * Export `sequence`\n\
 */\n\
\n\
module.exports = sequence;\n\
\n\
/**\n\
 * Create sequence fn with `keys`.\n\
 * optional `ms` which defaults\n\
 * to `500ms` and `fn`.\n\
 *\n\
 * Example:\n\
 *\n\
 *      seq = sequence('a b c', fn);\n\
 *      el.addEventListener('keydown', seq);\n\
 *\n\
 * @param {String} keys\n\
 * @param {Number} ms\n\
 * @param {Function} fn\n\
 * @return {Function}\n\
 * @api public\n\
 */\n\
\n\
function sequence(keys, ms, fn){\n\
  var codes = keys.split(/ +/).map(keycode)\n\
    , clen = codes.length\n\
    , seq = []\n\
    , i = 0\n\
    , prev;\n\
\n\
  if (2 == arguments.length) {\n\
    fn = ms;\n\
    ms = 500;\n\
  }\n\
\n\
  return function(e){\n\
    var code = codes[i++];\n\
    if (42 != code && code != e.which) return reset();\n\
    if (prev && new Date - prev > ms) return reset();\n\
    var len = seq.push(e.which);\n\
    prev = new Date;\n\
    if (len != clen) return;\n\
    reset();\n\
    fn(e);\n\
  };\n\
\n\
  function reset(){\n\
    prev = null;\n\
    seq = [];\n\
    i = 0;\n\
  }\n\
};\n\
//@ sourceURL=yields-k-sequence/index.js"
));
require.register("yields-keycode/index.js", Function("exports, require, module",
"\n\
/**\n\
 * map\n\
 */\n\
\n\
var map = {\n\
    backspace: 8\n\
  , command: 91\n\
  , tab: 9\n\
  , clear: 12\n\
  , enter: 13\n\
  , shift: 16\n\
  , ctrl: 17\n\
  , alt: 18\n\
  , capslock: 20\n\
  , escape: 27\n\
  , esc: 27\n\
  , space: 32\n\
  , pageup: 33\n\
  , pagedown: 34\n\
  , end: 35\n\
  , home: 36\n\
  , left: 37\n\
  , up: 38\n\
  , right: 39\n\
  , down: 40\n\
  , del: 46\n\
  , comma: 188\n\
  , f1: 112\n\
  , f2: 113\n\
  , f3: 114\n\
  , f4: 115\n\
  , f5: 116\n\
  , f6: 117\n\
  , f7: 118\n\
  , f8: 119\n\
  , f9: 120\n\
  , f10: 121\n\
  , f11: 122\n\
  , f12: 123\n\
  , ',': 188\n\
  , '.': 190\n\
  , '/': 191\n\
  , '`': 192\n\
  , '-': 189\n\
  , '=': 187\n\
  , ';': 186\n\
  , '[': 219\n\
  , '\\\\': 220\n\
  , ']': 221\n\
  , '\\'': 222\n\
};\n\
\n\
/**\n\
 * find a keycode.\n\
 *\n\
 * @param {String} name\n\
 * @return {Number}\n\
 */\n\
\n\
module.exports = function(name){\n\
  return map[name.toLowerCase()] || name.toUpperCase().charCodeAt(0);\n\
};\n\
//@ sourceURL=yields-keycode/index.js"
));
require.register("component-bind/index.js", Function("exports, require, module",
"/**\n\
 * Slice reference.\n\
 */\n\
\n\
var slice = [].slice;\n\
\n\
/**\n\
 * Bind `obj` to `fn`.\n\
 *\n\
 * @param {Object} obj\n\
 * @param {Function|String} fn or string\n\
 * @return {Function}\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(obj, fn){\n\
  if ('string' == typeof fn) fn = obj[fn];\n\
  if ('function' != typeof fn) throw new Error('bind() requires a function');\n\
  var args = slice.call(arguments, 2);\n\
  return function(){\n\
    return fn.apply(obj, args.concat(slice.call(arguments)));\n\
  }\n\
};\n\
//@ sourceURL=component-bind/index.js"
));
require.register("component-os/index.js", Function("exports, require, module",
"\n\
\n\
module.exports = os();\n\
\n\
function os() {\n\
  var ua = navigator.userAgent;\n\
  if (/mac/i.test(ua)) return 'mac';\n\
  if (/win/i.test(ua)) return 'windows';\n\
  if (/linux/i.test(ua)) return 'linux';\n\
}\n\
//@ sourceURL=component-os/index.js"
));
require.register("yields-k/lib/index.js", Function("exports, require, module",
"\n\
/**\n\
 * dependencies.\n\
 */\n\
\n\
var event = require('event')\n\
  , proto = require('./proto')\n\
  , bind = require('bind');\n\
\n\
/**\n\
 * Create a new dispatcher with `el`.\n\
 *\n\
 * example:\n\
 *\n\
 *      var k = require('k')(window);\n\
 *      k('shift + tab', function(){});\n\
 *\n\
 * @param {Element} el\n\
 * @return {Function}\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(el){\n\
  function k(e, fn){ k.handle(e, fn) };\n\
  k._handle = bind(k, proto.handle);\n\
  k._clear = bind(k, proto.clear);\n\
  event.bind(el, 'keydown', k._handle, false);\n\
  event.bind(el, 'keyup', k._handle, false);\n\
  event.bind(el, 'keyup', k._clear, false);\n\
  event.bind(el, 'focus', k._clear, false);\n\
  for (var p in proto) k[p] = proto[p];\n\
  k.listeners = [];\n\
  k.el = el;\n\
  return k;\n\
};\n\
//@ sourceURL=yields-k/lib/index.js"
));
require.register("yields-k/lib/proto.js", Function("exports, require, module",
"\n\
/**\n\
 * dependencies\n\
 */\n\
\n\
var sequence = require('k-sequence')\n\
  , keycode = require('keycode')\n\
  , event = require('event')\n\
  , os = require('os');\n\
\n\
/**\n\
 * modifiers.\n\
 */\n\
\n\
var modifiers = {\n\
  224: 'command',\n\
  91: 'command',\n\
  93: 'command',\n\
  16: 'shift',\n\
  17: 'ctrl',\n\
  18: 'alt'\n\
};\n\
\n\
/**\n\
 * Super key.\n\
 * (must use subscript vs. dot notation to avoid issues with older browsers)\n\
 */\n\
\n\
exports[ 'super' ] = 'mac' == os\n\
  ? 'command'\n\
  : 'ctrl';\n\
\n\
/**\n\
 * Handle the given `KeyboardEvent` or bind\n\
 * a new `keys` handler.\n\
 *\n\
 * @param {String|KeyboardEvent} e\n\
 * @param {Function} fn\n\
 * @api private\n\
 */\n\
\n\
exports.handle = function(e, fn){\n\
  var ignore = this.ignore;\n\
  var event = e.type;\n\
  var code = e.which;\n\
\n\
  // bind\n\
  if (fn) return this.bind(e, fn);\n\
\n\
  // modifiers\n\
  var mod = modifiers[code];\n\
  if ('keydown' == event && mod) {\n\
    this[ 'super' ] = exports[ 'super' ] == mod;\n\
    this[mod] = true;\n\
    this.modifiers = true;\n\
    return;\n\
  }\n\
\n\
  // ignore\n\
  if (ignore && ignore(e)) return;\n\
\n\
  // listeners\n\
  var all = this.listeners;\n\
\n\
  // match\n\
  for (var i = 0; i < all.length; ++i) {\n\
    var invoke = true;\n\
    var obj = all[i];\n\
    var seq = obj.seq;\n\
    var mods = obj.mods;\n\
    var fn = seq || obj.fn;\n\
\n\
    if (!seq && code != obj.code) continue;\n\
    if (event != obj.event) continue;\n\
\n\
    for (var j = 0; j < mods.length; ++j) {\n\
      if (!this[mods[j]]) {\n\
        invoke = null;\n\
        break;\n\
      }\n\
    }\n\
\n\
    invoke && fn(e);\n\
  }\n\
};\n\
\n\
/**\n\
 * Destroy this `k` dispatcher instance.\n\
 *\n\
 * @api public\n\
 */\n\
\n\
exports.destroy = function(){\n\
  event.unbind(this.el, 'keydown', this._handle);\n\
  event.unbind(this.el, 'keyup', this._handle);\n\
  event.unbind(this.el, 'keyup', this._clear);\n\
  event.unbind(this.el, 'focus', this._clear);\n\
  this.listeners = [];\n\
};\n\
\n\
/**\n\
 * Unbind the given `keys` with optional `fn`.\n\
 *\n\
 * example:\n\
 *\n\
 *      k.unbind('enter, tab', myListener); // unbind `myListener` from `enter, tab` keys\n\
 *      k.unbind('enter, tab'); // unbind all `enter, tab` listeners\n\
 *      k.unbind(); // unbind all listeners\n\
 *\n\
 * @param {String} keys\n\
 * @param {Function} fn\n\
 * @return {k}\n\
 * @api public\n\
 */\n\
\n\
exports.unbind = function(keys, fn){\n\
  var fns = this.listeners\n\
    , len = fns.length\n\
    , all;\n\
\n\
  // unbind all\n\
  if (0 == arguments.length) {\n\
    this.listeners = [];\n\
    return this;\n\
  }\n\
\n\
  // parse\n\
  all = parseKeys(keys);\n\
\n\
  // unbind\n\
  for (var i = 0; i < all.length; ++i) {\n\
    for (var j = 0, obj; j < len; ++j) {\n\
      obj = fns[j];\n\
      if (!obj) continue;\n\
      if (fn && obj.fn != fn) continue;\n\
      if (obj.key != all[i].key) continue;\n\
      if (!matches(obj, all[i])) continue;\n\
      fns.splice(j--, 1);\n\
    }\n\
  }\n\
\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Bind the given `keys` to `fn` with optional `event`\n\
 *\n\
 * example:\n\
 *\n\
 *      k.bind('shift + tab, ctrl + a', function(e){});\n\
 *\n\
 * @param {String} event\n\
 * @param {String} keys\n\
 * @param {Function} fn\n\
 * @return {k}\n\
 * @api public\n\
 */\n\
\n\
exports.bind = function(event, keys, fn){\n\
  var fns = this.listeners\n\
    , len\n\
    , all;\n\
\n\
  if (2 == arguments.length) {\n\
    fn = keys;\n\
    keys = event;\n\
    event = 'keydown';\n\
  }\n\
\n\
  all = parseKeys(keys);\n\
  len = all.length;\n\
\n\
  for (var i = 0; i < len; ++i) {\n\
    var obj = all[i];\n\
    obj.seq = obj.seq && sequence(obj.key, fn);\n\
    obj.event = event;\n\
    obj.fn = fn;\n\
    fns.push(obj);\n\
  }\n\
\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Bind keyup with `keys` and `fn`.\n\
 *\n\
 * @param {String} keys\n\
 * @param {Function} fn\n\
 * @return {k}\n\
 * @api public\n\
 */\n\
\n\
exports.up = function(keys, fn){\n\
  return this.bind('keyup', keys, fn);\n\
};\n\
\n\
/**\n\
 * Bind keydown with `keys` and `fn`.\n\
 *\n\
 * @param {String} keys\n\
 * @param {Function} fn\n\
 * @return {k}\n\
 * @api public\n\
 */\n\
\n\
exports.down = function(keys, fn){\n\
  return this.bind('keydown', keys, fn);\n\
};\n\
\n\
/**\n\
 * Clear all modifiers on `keyup`.\n\
 *\n\
 * @api private\n\
 */\n\
\n\
exports.clear = function(e){\n\
  var code = e.keyCode || e.which;\n\
  if (!(code in modifiers)) return;\n\
  this[modifiers[code]] = null;\n\
  this.modifiers = this.command\n\
    || this.shift\n\
    || this.ctrl\n\
    || this.alt;\n\
};\n\
\n\
/**\n\
 * Ignore all input elements by default.\n\
 *\n\
 * @param {Event} e\n\
 * @return {Boolean}\n\
 * @api private\n\
 */\n\
\n\
exports.ignore = function(e){\n\
  var el = e.target || e.srcElement;\n\
  var name = el.tagName.toLowerCase();\n\
  return 'textarea' == name\n\
    || 'select' == name\n\
    || 'input' == name;\n\
};\n\
\n\
/**\n\
 * Parse the given `keys`.\n\
 *\n\
 * @param {String} keys\n\
 * @return {Array}\n\
 * @api private\n\
 */\n\
\n\
function parseKeys(keys){\n\
  keys = keys.replace('super', exports[ 'super' ]);\n\
\n\
  var all = ',' != keys\n\
    ? keys.split(/ *, */)\n\
    : [','];\n\
\n\
  var ret = [];\n\
  for (var i = 0; i < all.length; ++i) {\n\
    if ('' == all[i]) continue;\n\
    var mods = all[i].split(/ *\\+ */);\n\
    var key = mods.pop() || ',';\n\
\n\
    ret.push({\n\
      seq: !!~ key.indexOf(' '),\n\
      code: keycode(key),\n\
      mods: mods,\n\
      key: key\n\
    });\n\
  }\n\
\n\
  return ret;\n\
}\n\
\n\
/**\n\
 * Check if the given `a` matches `b`.\n\
 *\n\
 * @param {Object} a\n\
 * @param {Object} b\n\
 * @return {Boolean}\n\
 * @api private\n\
 */\n\
\n\
function matches(a, b){\n\
  return 0 == b.mods.length || eql(a, b);\n\
}\n\
\n\
/**\n\
 * Shallow eql util.\n\
 *\n\
 * TODO: move to yields/eql\n\
 *\n\
 * @param {Array} a\n\
 * @param {Array} b\n\
 * @return {Boolean}\n\
 * @api private\n\
 */\n\
\n\
function eql(a, b){\n\
  a = a.mods.sort().toString();\n\
  b = b.mods.sort().toString();\n\
  return a == b;\n\
}\n\
//@ sourceURL=yields-k/lib/proto.js"
));
require.register("yields-currency/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Format / Unformat the given `n` to currency.\n\
 *\n\
 * @param {Number|String} n\n\
 * @return {String|Number}\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(n){\n\
  switch (typeof n) {\n\
    case 'string': return unformat(n);\n\
    case 'number': return format(n);\n\
  }\n\
};\n\
\n\
/**\n\
 * Format the given `n` to currency.\n\
 *\n\
 * Example:\n\
 *\n\
 *      format(1000);\n\
 *      // => 1,000.00\n\
 *\n\
 * @param {Number} n\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
function format(n){\n\
  n = n.toFixed(2).toString();\n\
  var parts = n.split('.');\n\
  return parts[0]\n\
    .replace(/(\\d)(?=(\\d{3})+(?!\\d))/g, '$1,')\n\
    + '.'\n\
    + parts[1]\n\
}\n\
\n\
/**\n\
 * Unformat the given `str`.\n\
 *\n\
 * @param {String} str\n\
 * @return {Number}\n\
 * @api private\n\
 */\n\
\n\
function unformat(str){\n\
  return Number(str.replace(',', ''));\n\
}\n\
//@ sourceURL=yields-currency/index.js"
));
require.register("yields-load-image/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Preload the given `src` with the given `fn`\n\
 *\n\
 * @param {String} src\n\
 * @param {Function} fn\n\
 * @return {Image}\n\
 */\n\
\n\
module.exports = function(src, fn){\n\
  var img = new Image();\n\
  img.onload = function(){ fn(null, img) };\n\
  img.onerror = fn;\n\
  img.src = src;\n\
  return img;\n\
};\n\
//@ sourceURL=yields-load-image/index.js"
));
require.register("stagas-audio-process/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Create a stereo script processor node `fn`\n\
 * for `context` with sample `length`.\n\
 *\n\
 * @param {AudioContext} context\n\
 * @param {Number} length\n\
 * @param {Function} fn\n\
 * @return {AudioNode}\n\
 */\n\
\n\
module.exports = function(context, length, fn){\n\
  var node = context.createScriptProcessor(length, 1, 2);\n\
  node.onaudioprocess = onaudioprocess;\n\
\n\
  return node;\n\
\n\
  function onaudioprocess(ev){\n\
    fn(\n\
      ev.outputBuffer.getChannelData(0)\n\
    , ev.outputBuffer.getChannelData(1)\n\
    , ev.outputBuffer.length\n\
    , ev\n\
    );\n\
  }\n\
};\n\
//@ sourceURL=stagas-audio-process/index.js"
));
require.register("stagas-webaudio-dsp/index.js", Function("exports, require, module",
"\n\
/**\n\
 * webaudio-dsp\n\
 */\n\
\n\
var emitter = require('emitter');\n\
var process = require('audio-process');\n\
\n\
exports = module.exports = function(bufferSize, fn){\n\
  var audio = new AudioContext({ sampleRate: 44100, latencyHint: 'playback' });\n\
\n\
  document.body.onmousedown = () => {\n\
    audio.resume()\n\
  }\n\
\n\
  var sampleRate = audio.sampleRate;\n\
\n\
  var empty = new Float32Array(bufferSize);\n\
\n\
  var node = process(audio, bufferSize, function(L, R, len){\n\
    if (!context.playing) {\n\
      L.set(empty, 0);\n\
      R.set(empty, 0);\n\
      return;\n\
    }\n\
\n\
    fn(L, R, len);\n\
  });\n\
\n\
  // ugly, but keeps the event loop running\n\
  // otherwise audio freezes\n\
  setTimeout(function(){\n\
    alert('should not fire');\n\
  }, 31536000000);\n\
\n\
  var context = emitter({\n\
    audio: audio,\n\
    node: node,\n\
    play: function(){\n\
      node.connect(audio.destination);\n\
      this.playing = true;\n\
      this.emit('play');\n\
    },\n\
    pause: function(){\n\
      this.playing = false;\n\
      this.emit('pause');\n\
    },\n\
    stop: function(){\n\
      this.playing = false;\n\
      this.emit('stop');\n\
    },\n\
    playing: false\n\
  });\n\
\n\
  return context;\n\
};\n\
//@ sourceURL=stagas-webaudio-dsp/index.js"
));
require.register("stagas-webaudio-dsp/test/stagas-unexpected_token.js", Function("exports, require, module",
"\n\
var transpose = 0;\n\
\n\
var sr = 44100;\n\
\n\
var bassline = [\n\
  [ 7, 7, 7, 12, 10, 10, 10, 15 ],\n\
  [ 7, 7, 7, 15, 15, 17, 10, 29 ],\n\
  [ 7, 7, 7, 24, 10, 10, 10, 19 ],\n\
  [ 7, 7, 7, 15, 29, 24, 15, 10 ]\n\
];\n\
\n\
var melody = [\n\
  7, 15, 7, 15,\n\
  7, 15, 10, 15,\n\
  10, 12, 24, 19,\n\
  7, 12, 10, 19\n\
];\n\
\n\
var chords = [ [ 7, 12, 17, 10 ], [ 10, 15, 19, 24 ] ];\n\
\n\
var lp_a = Moog();\n\
var lp_b = Moog();\n\
var lp_c = Moog();\n\
var fastlp_a = FastLP(240);\n\
var fastlp_b = FastLP(30);\n\
var fasthp_a = FastHP(1.7);\n\
var fasthp_b = FastHP(1.5);\n\
var fasthp_c = FastHP(0.5);\n\
\n\
module.exports = function(t){\n\
  var lfo_a = sin(2, t);\n\
  var lfo_b = sin(1/32, t);\n\
  var lfo_c = sin(1/128, t);\n\
  var cutoff =\n\
    300\n\
  + (lfo_a * 60)\n\
  + (lfo_b * 300)\n\
  + (lfo_c * 250)\n\
  ;\n\
\n\
  // bassline arpeggio\n\
  var bm = bassline[(t / 2 | 0) % bassline.length];\n\
  var bn = note(bm[(t * 4 | 0) % bm.length], 0);\n\
\n\
  // bass synth\n\
  var bass_osc =\n\
      saw(bn, t) * 1.9\n\
    + sqr(bn/2, t) * 1\n\
    + sin(bn/2, t) * 2.2\n\
    + sqr(bn*3, t) * 3\n\
  ;\n\
\n\
  var bass =\n\
    ( // vcf\n\
      lp_a(1050 + (lfo_b * 140), 0 + (sin(1/2, t + 3/4) * 0.2),\n\
perc(bass_osc/3, 48, t % (1/8), t) * 1)\n\
    )\n\
  ;\n\
\n\
  // melody arpeggio\n\
  var mn = note(\n\
    melody[(t * 3 | 0) % melody.length],\n\
    2 - (t * 3 | 0) % 4\n\
  );\n\
\n\
  var synth_osc =\n\
    saw(mn, t+1)\n\
  + sqr(mn*2.02, t) * 0.4\n\
  + sqr(mn*3, t+2)\n\
  ;\n\
\n\
  var synth_wave =\n\
    ( // vcf\n\
      lp_b(1800 + (lfo_a * 400), 0.1 + (sin(1/8, t + (1/3)) * 0.1),\n\
        perc(synth_osc, 1.6, t % (4), t) * 1.7\n\
      )\n\
    ) * 1.8\n\
  ;\n\
\n\
  var synth_degrade = synth_wave * sin(note(5, 2), t);\n\
\n\
  var synth = // effect dry / wet mix\n\
    0.4 * synth_wave\n\
  + 0.1 * synth_degrade\n\
  ;\n\
\n\
  var p = chords[(t / 4 | 0) % chords.length];\n\
\n\
  var pad_osc =\n\
    5.1 * saw(note(p[0], 1), t)\n\
  + 3.9 * saw(note(p[1], 2), t)\n\
  + 4.0 * saw(note(p[2], 1), t)\n\
  + 3.0 * sqr(note(p[3], 0), t)\n\
  + noise() * 0.7\n\
  ;\n\
\n\
  var pad =\n\
    ( 1.0 - ((sin(2, t) * 0.28) + 0.5) ) * // vca\n\
    fasthp_c(lp_c(1100 + (lfo_a * 150), 0.05, pad_osc * 0.03))\n\
  ;\n\
\n\
  var kick_osc =\n\
    clip(0.37, sin(note(7,-1), t)) * 2\n\
  + clip(0.07, saw(note(7.03,-1), t * 0.2)) * 4.00\n\
  ;\n\
\n\
  var kick =\n\
    saw(2, t) * 0.054 // click\n\
  + fastlp_a( // vcf\n\
      perc(clip(0.6, kick_osc), 54, t % (1/2), t)\n\
    ) * 2\n\
  ;\n\
\n\
  var snare_osc =\n\
    sqr(note(17, 0), t+3) * 0.156\n\
  + noise() * 0.73\n\
  ;\n\
\n\
  var snare = // vcf\n\
    fastlp_b(perc(snare_osc, 119 - (t % 2 > 1 ? 14 : 0), (t + 1/2) % (1), t) * 0.6)\n\
  ;\n\
\n\
  var hihat_osc =\n\
    saw(note(15,9), t) * 0.4\n\
  + noise()\n\
  ;\n\
\n\
  var hihat =\n\
    fasthp_a(perc(hihat_osc, 266 - ( (t + 2/4) % (1/2) > 1/4 ? 160 : 0), t % (1/4), t))\n\
  ;\n\
\n\
  var shaker_osc =\n\
    noise()\n\
  ;\n\
\n\
  var shaker =\n\
    fasthp_b(perc_b(shaker_osc, 230 - ( (t + 2/4) % (1/2) > 1/4 ? 80 : 0), t % 1/8, t))\n\
  ;\n\
\n\
  // mixer\n\
  return 0.4 * ( // gain\n\
    0.77 * clip(0.65, bass)\n\
  + 0.018 * synth\n\
  + 0.66 * pad\n\
  + 3.6 * kick\n\
  + 12.0 * clip(0.17, snare)\n\
  + 0.21 * hihat\n\
  + 0.72 * shaker\n\
  );\n\
};\n\
\n\
function clip(n, x){\n\
  return x > n\n\
    ? n\n\
    : x < -n\n\
    ? -n\n\
    : x\n\
  ;\n\
}\n\
\n\
function sin(x, t){\n\
  return Math.sin(2 * Math.PI * t * x);\n\
}\n\
\n\
function saw(x, t){\n\
  return 1-2 * (t % (1/x)) * x;\n\
}\n\
\n\
function sqr(x, t){\n\
  return sin(x, t) > 0 ? 1 : -1\n\
}\n\
\n\
function noise(){\n\
  return Math.random() * 2 - 1;\n\
}\n\
\n\
function perc(wave, decay, o, t){\n\
  var env = Math.max(0, 0.889 - (o * decay) / ((o * decay) + 1));\n\
  return wave * env;\n\
}\n\
\n\
function perc_b(wave, decay, o, t){\n\
  var env = Math.min(0, 0.950 - (o * decay) / ((o * decay) + 1));\n\
  return wave * env;\n\
}\n\
\n\
function FastLP(n){\n\
  var value = 0;\n\
  return function(x){\n\
    return value += (x - value) / n;\n\
  }\n\
}\n\
\n\
function FastHP(n){\n\
  var value = 0;\n\
  return function(x){\n\
    return value += x - value * n;\n\
  }\n\
}\n\
\n\
function Moog(){\n\
  var y1, y2, y3, y4, oldx, oldy1, oldy2, oldy3;\n\
\n\
  y1 = y2 = y3 = y4 = oldx = oldy1 = oldy2 = oldy3 = 0;\n\
\n\
  var p, k, t1, t2, r, x;\n\
\n\
  return function(cutoff, res, input){\n\
    cutoff = 2 * cutoff / 44100;\n\
    p = cutoff * (1.8 - (0.8 * cutoff));\n\
    k = 2 * Math.sin(cutoff * Math.PI * 0.5) - 1;\n\
    t1 = (1 - p) * 1.386249;\n\
    t2 = 12 + t1 * t1;\n\
    r = res * (t2 + 6 * t1) / (t2 - 6 * t1);\n\
\n\
    x = input - r * y4;\n\
\n\
    // four cascaded one-pole filters (bilinear transform)\n\
    y1 =  x * p + oldx  * p - k * y1;\n\
    y2 = y1 * p + oldy1 * p - k * y2;\n\
    y3 = y2 * p + oldy2 * p - k * y3;\n\
    y4 = y3 * p + oldy3 * p - k * y4;\n\
\n\
    // clipper band limited sigmoid\n\
    y4 -= (y4 * y4 * y4) / 6;\n\
\n\
    oldx = x; oldy1 = y1; oldy2 = y2; oldy3 = y3;\n\
\n\
    return y4;\n\
  };\n\
}\n\
\n\
// gets note `n` frequency of `octave`, base C-0\n\
function note(n, octave){\n\
  n += transpose;\n\
  return Math.pow(2, (n - 33 + (12 * (octave || 0))) / 12) * 440;\n\
}\n\
//@ sourceURL=stagas-webaudio-dsp/test/stagas-unexpected_token.js"
));
require.register("component-raf/index.js", Function("exports, require, module",
"\n\
module.exports = window.requestAnimationFrame\n\
  || window.webkitRequestAnimationFrame\n\
  || window.mozRequestAnimationFrame\n\
  || window.oRequestAnimationFrame\n\
  || window.msRequestAnimationFrame\n\
  || fallback;\n\
\n\
var prev = new Date().getTime();\n\
function fallback(fn) {\n\
  var curr = new Date().getTime();\n\
  var ms = Math.max(0, 16 - (curr - prev));\n\
  setTimeout(fn, ms);\n\
  prev = curr;\n\
}\n\
//@ sourceURL=component-raf/index.js"
));
require.register("stagas-oscilloscope/index.js", Function("exports, require, module",
"\n\
/**\n\
 * oscilloscope\n\
 */\n\
\n\
var raf = require('raf');\n\
\n\
module.exports = Oscilloscope;\n\
\n\
function Oscilloscope(opts){\n\
  opts = opts || {};\n\
\n\
  this.points = [];\n\
  this.running = true;\n\
\n\
  this.width = opts.width || 200;\n\
  this.height = opts.height || 100;\n\
  this.step = 1;\n\
  this.zoom = 1;\n\
  this.zero = (this.height / 2 | 0);\n\
\n\
  this.el = document.createElement('div');\n\
  this.el.className = 'oscilloscope';\n\
  this.el.style.width = this.width + 'px';\n\
  this.el.style.height = this.height + 'px';\n\
  this.el.style.background = '#333';\n\
\n\
  this.el.onmousedown = function(ev){\n\
    ev.preventDefault();\n\
    if (1 === ev.which) {\n\
      this.running = !this.running;\n\
    } else if (3 === ev.which) {\n\
      this.step *= 2;\n\
      if (this.step > 16) this.step = 1;\n\
      this.points = [];\n\
    }\n\
    return false;\n\
  }.bind(this);\n\
\n\
  this.el.oncontextmenu = function(ev){\n\
    ev.preventDefault();\n\
  }.bind(this);\n\
\n\
  this.el.onmousewheel = function(ev){\n\
    ev.preventDefault();\n\
\n\
    if (ev.wheelDelta < 0) {\n\
      this.zoom -= this.zoom * 0.1;\n\
    } else {\n\
      this.zoom += this.zoom * 0.1;\n\
    }\n\
\n\
    this.zoom = Math.max(1, this.zoom);\n\
\n\
    return false;\n\
  }.bind(this);\n\
\n\
  this.svg = createElement('svg');\n\
  attrs(this.svg, {\n\
    width: '100%',\n\
    height: '100%'\n\
  });\n\
  this.el.appendChild(this.svg);\n\
\n\
  this.zeroline = createElement('line');\n\
  attrs(this.zeroline, {\n\
    x1: 0,\n\
    x2: this.width,\n\
    y1: this.zero,\n\
    y2: this.zero,\n\
    stroke: '#444',\n\
    'stroke-width': 1\n\
  });\n\
  this.svg.appendChild(this.zeroline);\n\
\n\
  this.polyline = createElement('polyline');\n\
  attrs(this.polyline, {\n\
    fill: 'none',\n\
    stroke: '#1fc',\n\
    'stroke-width': 2\n\
  });\n\
  this.svg.appendChild(this.polyline);\n\
}\n\
\n\
Oscilloscope.prototype.render = function(samples, step, zoom){\n\
  if (!this.running) return;\n\
\n\
  step = step || this.step || 1;\n\
  zoom = zoom || this.zoom || 1;\n\
\n\
  var slen = samples.length / zoom;\n\
  if (slen != this.points.length) {\n\
    this.points.length = slen | 0;\n\
  }\n\
\n\
  for (var i = 0; i < slen; i += step) {\n\
    var s = samples[i];\n\
    var x = this.width * (i / slen);\n\
    var y = (1 + s) / 2 * this.height;\n\
    this.points[i] = x + ',' + y;\n\
  }\n\
\n\
  var polyline = this.polyline;\n\
  var points = this.points.join(' ');\n\
\n\
  raf(function(){\n\
    polyline.setAttribute('points', points);\n\
  });\n\
};\n\
\n\
Oscilloscope.prototype.resize = function(){\n\
  var style = window.getComputedStyle(this.svg);\n\
  this.width = parseInt(style.width);\n\
  this.height = parseInt(style.height);\n\
};\n\
\n\
function attrs(el, obj){\n\
  for (var key in obj) {\n\
    el.setAttribute(key, obj[key]);\n\
  }\n\
}\n\
\n\
function createElement(name){\n\
  return document.createElementNS('http://www.w3.org/2000/svg', name);\n\
}\n\
//@ sourceURL=stagas-oscilloscope/index.js"
));
require.register("stagas-logo-wavepot/index-v1.js", Function("exports, require, module",
"\n\
module.exports = Logo;\n\
\n\
function Logo(expandSine){\n\
  this.el = document.createElement('div');\n\
  this.el.id = 'logo';\n\
  this.svg = createElement('svg');\n\
\n\
  var color = '#61CCE0';\n\
  var stroke = 2.6;\n\
\n\
  attrs(this.svg, {\n\
    width: '60px',\n\
    height: '50px'\n\
  });\n\
  this.el.appendChild(this.svg);\n\
\n\
  this.pot = createElement('polyline');\n\
  attrs(this.pot, {\n\
    fill: 'none',\n\
    stroke: color,\n\
    'stroke-width': stroke,\n\
    'stroke-linecap': 'round'\n\
  });\n\
  this.svg.appendChild(this.pot);\n\
\n\
  var points = [];\n\
  var x, y;\n\
  var offset = 30;\n\
  var scale = 11.5;\n\
  for (var t = -0.50; t < 3.65; t += 0.01) {\n\
    x = offset + (scale * Math.cos(t));\n\
    y = offset - 8 + (scale * Math.sin(t));\n\
    points.push(x + ',' + y);\n\
  }\n\
\n\
  this.pot.setAttribute('points', points.join(' '));\n\
\n\
  this.wave = createElement('polyline');\n\
  attrs(this.wave, {\n\
    fill: 'none',\n\
    stroke: color,\n\
    'stroke-width': stroke,\n\
    'stroke-linecap': 'round'\n\
  });\n\
  this.svg.appendChild(this.wave);\n\
\n\
  var points = [];\n\
  var x, y;\n\
  var offset = 21.5;\n\
  var scale = 1.2;\n\
  expandSine = expandSine || 0;\n\
  for (var t = 3.3 - expandSine; t < 9.2 + expandSine; t += 0.1) {\n\
    y = offset + (scale * Math.sin(t));\n\
    points.push(18.7 + (t * 1.8) + ',' + y);\n\
  }\n\
\n\
  this.wave.setAttribute('points', points.join(' '));\n\
}\n\
\n\
/*\n\
Oscilloscope.prototype.render = function(samples, step, zoom){\n\
  if (!this.running) return;\n\
\n\
  step = step || this.step || 1;\n\
  zoom = zoom || this.zoom || 1;\n\
\n\
  var slen = samples.length / zoom;\n\
  if (slen != this.points.length) {\n\
    this.points.length = slen | 0;\n\
  }\n\
\n\
  for (var i = 0; i < slen; i += step) {\n\
    var s = samples[i];\n\
    var x = this.width * (i / slen);\n\
    var y = (1 + s) / 2 * this.height;\n\
    this.points[i] = x + ',' + y;\n\
  }\n\
\n\
  var polyline = this.polyline;\n\
  var points = this.points.join(' ');\n\
\n\
  raf(function(){\n\
    polyline.setAttribute('points', points);\n\
  });\n\
};\n\
*/\n\
function attrs(el, obj){\n\
  for (var key in obj) {\n\
    el.setAttribute(key, obj[key]);\n\
  }\n\
}\n\
\n\
function createElement(name){\n\
  return document.createElementNS('http://www.w3.org/2000/svg', name);\n\
}\n\
\n\
//@ sourceURL=stagas-logo-wavepot/index-v1.js"
));
require.register("stagas-logo-wavepot/index-v2.js", Function("exports, require, module",
"\n\
module.exports = Logo;\n\
\n\
function Logo(){\n\
  this.el = document.createElement('div');\n\
  this.svg = createElement('svg');\n\
\n\
  attrs(this.svg, {\n\
    width: '60px',\n\
    height: '50px',\n\
    style: 'border: 1px solid black'\n\
  });\n\
  this.el.appendChild(this.svg);\n\
\n\
  this.pot = createElement('polyline');\n\
  attrs(this.pot, {\n\
    fill: 'none',\n\
    stroke: '#000',\n\
    'stroke-width': 2.7\n\
  });\n\
  this.svg.appendChild(this.pot);\n\
\n\
  var points = [];\n\
  var x, y;\n\
  var offset = 30;\n\
  var scale = 17;\n\
  for (var t = -2; t < 2 * Math.PI; t += 0.05) {\n\
    if (t < -0.3 || t > 3.4) continue;\n\
    x = offset + (scale * Math.cos(t));\n\
    y = offset - 11 + (scale * Math.sin(t));\n\
    points.push(x + ',' + y);\n\
  }\n\
\n\
  this.pot.setAttribute('points', points.join(' '));\n\
\n\
  this.wave = createElement('polyline');\n\
  attrs(this.wave, {\n\
    fill: 'none',\n\
    stroke: '#000',\n\
    'stroke-width': 2.7\n\
  });\n\
  this.svg.appendChild(this.wave);\n\
\n\
  var points = [];\n\
  var x, y;\n\
  var offset = 19;\n\
  var scale = 1.8;\n\
  for (var t = -0.3; t < 9.8; t += 0.1) {\n\
    y = offset + (scale * Math.sin(t));\n\
    points.push(20 + (t * 2.1) + ',' + y);\n\
  }\n\
\n\
  this.wave.setAttribute('points', points.join(' '));\n\
}\n\
\n\
/*\n\
Oscilloscope.prototype.render = function(samples, step, zoom){\n\
  if (!this.running) return;\n\
\n\
  step = step || this.step || 1;\n\
  zoom = zoom || this.zoom || 1;\n\
\n\
  var slen = samples.length / zoom;\n\
  if (slen != this.points.length) {\n\
    this.points.length = slen | 0;\n\
  }\n\
\n\
  for (var i = 0; i < slen; i += step) {\n\
    var s = samples[i];\n\
    var x = this.width * (i / slen);\n\
    var y = (1 + s) / 2 * this.height;\n\
    this.points[i] = x + ',' + y;\n\
  }\n\
\n\
  var polyline = this.polyline;\n\
  var points = this.points.join(' ');\n\
\n\
  raf(function(){\n\
    polyline.setAttribute('points', points);\n\
  });\n\
};\n\
*/\n\
function attrs(el, obj){\n\
  for (var key in obj) {\n\
    el.setAttribute(key, obj[key]);\n\
  }\n\
}\n\
\n\
function createElement(name){\n\
  return document.createElementNS('http://www.w3.org/2000/svg', name);\n\
}\n\
\n\
//@ sourceURL=stagas-logo-wavepot/index-v2.js"
));
require.register("stagas-worker-fork/index.js", Function("exports, require, module",
"\n\
var emitter = require('emitter');\n\
\n\
module.exports = fork;\n\
\n\
function fork(script, boot){\n\
  var child = emitter({});\n\
  var body;\n\
\n\
  var req = new XMLHttpRequest();\n\
\n\
  req.onload = function(){\n\
    body = this.responseText;\n\
    body += \"\\n\
require('\" + boot + \"');\";\n\
  };\n\
\n\
  req.open('GET', script, false);\n\
  req.send();\n\
\n\
  var blob = new Blob([body], { 'type': 'application/javascript' });\n\
  var url = window.URL.createObjectURL(blob);\n\
\n\
  var worker = child.worker = new Worker(url);\n\
\n\
  worker.onmessage = function(e){\n\
    child.emit('message', e.data);\n\
  };\n\
\n\
  child.send = child.worker.postMessage.bind(child.worker);\n\
\n\
  return child;\n\
}\n\
\n\
fork.isMaster = !!self.document;\n\
\n\
if (!fork.isMaster) {\n\
  emitter(fork);\n\
\n\
  fork.send = self.postMessage.bind(self);\n\
\n\
  self.onmessage = function(e){\n\
    fork.emit('message', e.data);\n\
  };\n\
}\n\
//@ sourceURL=stagas-worker-fork/index.js"
));
require.register("stagas-treeview/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Expose `tree`.\n\
 */\n\
\n\
module.exports = tree;\n\
\n\
/**\n\
 * Creates a treeview of elements in `arr`\n\
 * inside `parent`.\n\
 *\n\
 * The elements array follows the format:\n\
 *\n\
 *     [\n\
 *       ['leaf'],\n\
 *       ['leaf'],\n\
 *       ['branch', true]\n\
 *     ]\n\
 *\n\
 * When a branch node is clicked, it invokes\n\
 * `fn(node, fn)` and it must callback\n\
 * a new array of elements `fn(err, arr)`.\n\
 *\n\
 * @param {Object} parent\n\
 * @param {Array} arr\n\
 * @param {Function} fn\n\
 * @return {Array} nodes\n\
 * @api public\n\
 */\n\
\n\
function tree(parent, arr, fn){\n\
  var nodes = new Array(arr.length);\n\
\n\
  var el = document.createElement('ul');\n\
\n\
  el.className = 'treeview';\n\
\n\
  for (var i = 0; i < arr.length; i++) {\n\
    var item = arr[i];\n\
    var node = nodes[i] = new Node(item, parent, fn);\n\
    el.appendChild(node.el);\n\
  }\n\
\n\
  if (!(parent instanceof Node)) el.classList.add('top');\n\
\n\
  parent.el.appendChild(el);\n\
\n\
  return nodes;\n\
}\n\
\n\
/**\n\
 * Creates a node `item` that\n\
 * belongs to `parent` with fetch\n\
 * handler `fn`.\n\
 *\n\
 * @param {Array} item\n\
 * @param {Node} parent\n\
 * @param {Function} fn\n\
 * @api private\n\
 */\n\
\n\
function Node(item, parent, fn){\n\
  this.el = document.createElement('li');\n\
  this.label = document.createElement('div');\n\
  this.label.className = 'label';\n\
  this.label.onclick = this.click.bind(this);\n\
  this.item = item[0];\n\
  this.parent = parent;\n\
  this.top = parent.top || parent;\n\
  this.fn = fn;\n\
  this.children = null;\n\
  this.isBranch = item[1];\n\
  this.isOpen = false;\n\
\n\
  if (this.isBranch) this.el.classList.add('branch');\n\
\n\
  this.label.textContent = this.item;\n\
  this.el.appendChild(this.label);\n\
}\n\
\n\
/**\n\
 * Emits an event to the topmost object.\n\
 *\n\
 * @api private\n\
 */\n\
\n\
Node.prototype.emit = function(event, param){\n\
  if (!this.top.emit) return;\n\
  this.top.emit(event, param, this);\n\
};\n\
\n\
/**\n\
 * Returns a slash delimited string path\n\
 * representation of the node.\n\
 *\n\
 * @return {String} path\n\
 * @api public\n\
 */\n\
\n\
Node.prototype.path = function(){\n\
  var path = [];\n\
  var node = this;\n\
  do {\n\
    path.unshift(node.item);\n\
  } while (node = node.parent);\n\
  return path.join('/');\n\
};\n\
\n\
Node.prototype.select = function(){\n\
  //if (this === this.top.selected) return;\n\
\n\
  if (this.top.selected) {\n\
    this.top.selected.el.classList.remove('selected');\n\
  }\n\
  this.el.classList.add('selected');\n\
\n\
  this.top.selected = this;\n\
\n\
  this.emit('select', this);\n\
};\n\
\n\
/**\n\
 * Toggles a branch node.\n\
 *\n\
 * @api private\n\
 */\n\
\n\
Node.prototype.toggle = function(){\n\
  if (this.isOpen) this.close();\n\
  else this.open();\n\
};\n\
\n\
/**\n\
 * Opens a branch node.\n\
 *\n\
 * @api private\n\
 */\n\
\n\
Node.prototype.open = function(){\n\
  this.el.classList.add('open');\n\
  this.isOpen = true;\n\
};\n\
\n\
/**\n\
 * Closes a branch node.\n\
 *\n\
 * @api private\n\
 */\n\
\n\
Node.prototype.close = function(){\n\
  this.el.classList.remove('open');\n\
  this.isOpen = false;\n\
};\n\
\n\
Node.prototype.click = function(fn){\n\
  var self = this;\n\
\n\
  fn = 'function' == typeof fn ? fn : noop;\n\
\n\
  if (this.isBranch) {\n\
    this.toggle();\n\
\n\
    if (this.children || !this.isOpen) return;\n\
\n\
    this.fn(this, function(err, children){\n\
      if (err) {\n\
        self.close();\n\
        self.emit('error', err);\n\
        return fn(err);\n\
      }\n\
\n\
      self.children = tree(self, children, self.fn);\n\
\n\
      fn(null, self.children);\n\
    });\n\
  } else {\n\
    this.select();\n\
  }\n\
};\n\
\n\
function noop(){/* noop */}\n\
//@ sourceURL=stagas-treeview/index.js"
));
require.register("stagas-watch-js/lib/reload.js", Function("exports, require, module",
";(function () {\n\
  var WS = window.MozWebSocket || window.WebSocket;\n\
  var ws;\n\
  var timeout;\n\
  var reloading;\n\
  var reloadAfter;\n\
  function connect () {\n\
    if (reloading) return;\n\
    clearTimeout(timeout);\n\
    try {\n\
      ws = new WS(\"ws://localhost:3003/reload\");\n\
      ws.onopen = function () {\n\
        console.log('watch-js live reload connected');\n\
        if (reloadAfter) {\n\
          reloading = true;\n\
          window.location.reload();\n\
          return;\n\
        }\n\
      }\n\
      ws.onmessage = function (msg) {\n\
        console.log('watch-js : '+msg.data);\n\
        if (\"reload\" == msg.data) {\n\
          reloading = true;\n\
          window.location.reload();\n\
        }\n\
      }\n\
      ws.onclose =\n\
      ws.onerror = function (e) {\n\
        reloadAfter = true;\n\
        if (reloading) return;\n\
        console.error('watch-js error:', e);\n\
        clearTimeout(timeout);\n\
        timeout = setTimeout(connect, 3000);\n\
      }\n\
    }\n\
    catch (e) {\n\
      reloadAfter = true;\n\
      if (reloading) return;\n\
      console.error('watch-js error:', e);\n\
      clearTimeout(timeout);\n\
      timeout = setTimeout(connect, 3000);\n\
    }\n\
  };\n\
  connect();\n\
}());\n\
//@ sourceURL=stagas-watch-js/lib/reload.js"
));
require.register("wavepot/index.js", Function("exports, require, module",
"\n\
/**\n\
 * webaudio-daw\n\
 */\n\
\n\
var fork = require('worker-fork');\n\
var preload = require('load-image');\n\
\n\
var bufferSize = 4096;\n\
\n\
if (fork.isMaster) master();\n\
else worker();\n\
\n\
function master(){\n\
  /**\n\
   * disable backspace leave page.\n\
   * TODO: make module\n\
   */\n\
  var rx = /INPUT|SELECT|TEXTAREA/i;\n\
\n\
  document.body.addEventListener('keydown', function(ev){\n\
    if (8 === ev.which) { // backspace\n\
      if (!rx.test(ev.target.tagName) || ev.target.disabled || ev.target.readOnly) {\n\
        ev.preventDefault();\n\
      }\n\
    }\n\
  });\n\
\n\
  var bufferMax = 6;\n\
  var bufferQueue = [];\n\
\n\
  var k = require('k')(window);\n\
  k.ignore = false;\n\
  k('super + enter', function(ev){\n\
    ev.preventDefault();\n\
    toolbar.togglePause();\n\
    return false;\n\
  });\n\
\n\
  k('super + shift + enter', function(ev){\n\
    ev.preventDefault();\n\
    ctx.stop();\n\
    toolbar.togglePause();\n\
    return false;\n\
  });\n\
\n\
  var debounce = require('debounce');\n\
  var Sublime = require('./sublime');\n\
  var toolbar = require('./toolbar');\n\
  var sidebar = require('./sidebar');\n\
  // var fund = require('./fund');\n\
\n\
  var dsp = require('webaudio-dsp');\n\
  var ctx = dsp(bufferSize, process);\n\
  var sampleRate = ctx.audio.sampleRate;\n\
\n\
  var child = fork('/build.js', 'wavepot');\n\
\n\
  toolbar.create(ctx);\n\
  document.body.appendChild(toolbar.el);\n\
\n\
  sidebar.create(ctx);\n\
\n\
  var sublime = ctx.sublime = Sublime();\n\
  setTimeout(function(){ // prevents flash of unstyled ace\n\
    document.body.appendChild(sublime.el);\n\
    document.body.appendChild(sidebar.el);\n\
  }, 500);\n\
  //oscilloscope.polyline.setAttribute('stroke', '#A6E22E');\n\
\n\
  ctx.isNewProject = true;\n\
\n\
  var session = sublime.editor.getSession();\n\
  session.setMode('ace/mode/javascript');\n\
  session.setTabSize(2);\n\
  session.setUseWorker(true);\n\
  session.on('change', debounce(onchange, 500));\n\
  session.on('change', debounce(function(){\n\
    if (ctx.isNewProject) {\n\
      ctx.isNewProject = false;\n\
      ctx.hasEdited = false;\n\
      window.onbeforeunload = function(){};\n\
      return;\n\
    }\n\
    ctx.hasEdited = true;\n\
    window.onbeforeunload = function(){\n\
      return 'You\\'ve made some edits!\\n\
\\n\
If you leave you will lose everything!';\n\
    };\n\
  }, 50));\n\
\n\
  child.on('message', function(b){\n\
    var buffer = new Float32Array(b);\n\
    bufferQueue.push(buffer);\n\
  });\n\
\n\
  ctx.on('stop', onstop);\n\
\n\
  send('bufferSize', bufferSize);\n\
  send('sampleRate', ctx.audio.sampleRate);\n\
\n\
  function onchange(){\n\
    var src = session.getValue();\n\
    send('compile', src);\n\
  }\n\
\n\
  function onstop(){\n\
    bufferQueue = [];\n\
    send('resetFrame');\n\
  }\n\
\n\
  function send(cmd, param){\n\
    child.send({ cmd: cmd, param: param });\n\
  }\n\
\n\
  function process(L, R, len){\n\
    play(L, R, len);\n\
  }\n\
\n\
  function next(){\n\
    if (bufferQueue.length < bufferMax) send('bufferAhead');\n\
    return bufferQueue.shift();\n\
  }\n\
\n\
  function play(L, R){\n\
    var samples = next();\n\
    if (!samples) return;\n\
\n\
    L.set(samples, 0);\n\
    R.set(samples, 0);\n\
\n\
    display(samples);\n\
  }\n\
\n\
  var timeouts = [];\n\
  var timeoutDelay = 1024 / (sampleRate / 1000);\n\
\n\
  function display(buffer){\n\
    for (var i = 0; i < bufferSize / 1024; i++) {\n\
      clearTimeout(timeouts[i]);\n\
      timeouts[i] = setTimeout(function(i){\n\
        var pos = i * 1024;\n\
        var buf = buffer.subarray(pos, pos + 1024);\n\
        toolbar.oscilloscope.render(buf);\n\
      }, timeoutDelay * i, i);\n\
    }\n\
  }\n\
\n\
  //session.setValue(demo.toString().split('\\n\
').slice(1, -1).join('\\n\
'));\n\
}\n\
\n\
function worker(){\n\
  var err = null;\n\
  var ok = true;\n\
  var fn = function(){ return 0 };\n\
  var lastFn = fn;\n\
  var sample;\n\
\n\
  var time = 0, frame = 0;\n\
  var volume = 100;\n\
  var sampleRate;\n\
  var bufferSize;\n\
\n\
  fork.on('message', function(msg){\n\
    switch (msg.cmd) {\n\
      case 'compile': return compile(msg.param);\n\
      case 'resetFrame': return (frame = 0);\n\
      case 'bufferSize': return (bufferSize = msg.param);\n\
      case 'sampleRate': return (sampleRate = msg.param);\n\
      case 'bufferAhead': return bufferAhead();\n\
    }\n\
  });\n\
\n\
  function bufferAhead(){\n\
    var floats = new Float32Array(bufferSize);\n\
\n\
    for (var i = 0, len = bufferSize; i < len; i++, frame++) {\n\
      time = frame / sampleRate;\n\
      floats[i] = fn(time, frame) * Math.pow(volume / 100, 3);\n\
    }\n\
\n\
    fork.send(floats.buffer, [floats.buffer]);\n\
  }\n\
\n\
  function compile(src){\n\
    try {\n\
      // wrap\n\
      src =\n\
          'var sampleRate = ' + sampleRate + ';\\n\
'\n\
        + src\n\
        + ';\\n\
return dsp;\\n\
';\n\
\n\
      // compile\n\
      fn = Function(src)();\n\
\n\
      // test a sample\n\
      sample = Number(fn(0,0));\n\
\n\
      if (isNaN(sample)) err = new Error('sample is NaN');\n\
      else if (Math.abs(sample) === Infinity) err = new Error('sample is Infinity');\n\
\n\
      if (!err) {\n\
        if (!ok) console.log('dsp function compiled');\n\
        ok = true;\n\
        lastFn = fn;\n\
        return;\n\
      }\n\
\n\
      if (ok) throw err;\n\
    } catch(e) {\n\
      if (ok) console.error(e.stack);\n\
    }\n\
\n\
    err = null;\n\
    ok = false;\n\
    fn = lastFn;\n\
  }\n\
}\n\
\n\
/*\n\
fundlist.create();\n\
document.body.appendChild(fundlist.el);\n\
\n\
fundlist.makeModal();\n\
*/\n\
//fund.show('project saving & sharing');\n\
\n\
/*fund.modal.on('hide', function(){\n\
  setTimeout(function(){\n\
    fund.modal.show();\n\
  }, 1000);\n\
})*/\n\
/*\n\
setTimeout(function(){\n\
  fund.modal.show();\n\
}, 500);*/\n\
//@ sourceURL=wavepot/index.js"
));
require.register("wavepot/utils.js", Function("exports, require, module",
"\n\
exports.createElement = function createElement(name, className){\n\
  var el = document.createElement('div');\n\
  el.id = name;\n\
  if (className) el.className = className;\n\
  return el;\n\
};\n\
\n\
exports.createElementNS = function createElementNS(name){\n\
  return document.createElementNS('http://www.w3.org/2000/svg', name);\n\
};\n\
\n\
exports.attrs = function attrs(el, obj){\n\
  for (var key in obj) {\n\
    el.setAttribute(key, obj[key]);\n\
  }\n\
};\n\
\n\
exports.wrapscroll = function(html){\n\
  html =\n\
      '<div class=\"scrollpane\">'\n\
    + '  <div class=\"scrollbar-area\">'\n\
    + '    <div class=\"scrollbar-wrapper\">'\n\
    + '      <div class=\"scrollbar-padding\">'\n\
    + html\n\
    + '      </div>'\n\
    + '    </div>'\n\
    + '    <div class=\"scrollbar-track\">'\n\
    + '      <div class=\"scrollbar-handle\"></div>'\n\
    + '    </div>'\n\
    + '  </div>'\n\
    + '</div>'\n\
    ;\n\
\n\
  return html;\n\
};\n\
//@ sourceURL=wavepot/utils.js"
));
require.register("wavepot/sublime.js", Function("exports, require, module",
"\n\
module.exports = function(){\n\
  ace.require('ace/ext/language_tools');\n\
\n\
  var el = document.createElement('div');\n\
  el.id = 'editor';\n\
\n\
  var editor = ace.edit(el);\n\
\n\
  editor.setTheme('ace/theme/monokai');\n\
  editor.setFadeFoldWidgets(true);\n\
  editor.setShowPrintMargin(false);\n\
  editor.setOptions({\n\
    enableBasicAutocompletion: true,\n\
    enableSnippets: true,\n\
    fontFamily: 'Cousine',\n\
    fontSize: '10pt'\n\
  });\n\
\n\
  editor.commands.addCommand({\n\
    name: \"removeline\",\n\
    bindKey: bindKey(\"Ctrl-D|Shift-Del\", \"Command-D\"),\n\
    exec: function(editor){ editor.removeLines(); },\n\
    scrollIntoView: \"cursor\",\n\
    multiSelectAction: \"forEachLine\"\n\
  });\n\
\n\
  editor.commands.addCommand({\n\
    name: \"copylinesup\",\n\
    bindKey: bindKey(\"Alt-Shift-Up\", \"Command-Option-Up\"),\n\
    exec: function(editor){ editor.copyLinesUp(); },\n\
    scrollIntoView: \"cursor\"\n\
  });\n\
\n\
  editor.commands.addCommand({\n\
    name: \"movelinesup\",\n\
    bindKey: bindKey(\"Alt-Up|Ctrl-Shift-Up\", \"Option-Up\"),\n\
    exec: function(editor){ editor.moveLinesUp(); },\n\
    scrollIntoView: \"cursor\"\n\
  });\n\
\n\
  editor.commands.addCommand({\n\
    name: \"copylinesdown\",\n\
    bindKey: bindKey(\"Alt-Shift-Down|Ctrl-Shift-D\", \"Command-Option-Down\"),\n\
    exec: function(editor){ editor.copyLinesDown(); },\n\
    scrollIntoView: \"cursor\"\n\
  });\n\
\n\
  editor.commands.addCommand({\n\
    name: \"movelinesdown\",\n\
    bindKey: bindKey(\"Alt-Down|Ctrl-Shift-Down\", \"Option-Down\"),\n\
    exec: function(editor){ editor.moveLinesDown(); },\n\
    scrollIntoView: \"cursor\"\n\
  });\n\
\n\
  return {\n\
    el: el,\n\
    editor: editor\n\
  };\n\
};\n\
\n\
function bindKey(win, mac){\n\
  return { win: win, mac: mac };\n\
}\n\
//@ sourceURL=wavepot/sublime.js"
));
require.register("wavepot/toolbar.js", Function("exports, require, module",
"\n\
var Oscilloscope = require('oscilloscope');\n\
var Logo = require('logo-wavepot');\n\
//var xgui = require('xgui');\n\
// var fund = require('./fund');\n\
var about = require('./about');\n\
var utils = require('./utils');\n\
var createElement = utils.createElement;\n\
\n\
var toolbar = module.exports = {};\n\
\n\
toolbar.create = createToolbar;\n\
toolbar.togglePause = togglePause;\n\
\n\
function createToolbar(ctx){\n\
  // toolbar\n\
  toolbar.el = createElement('toolbar');\n\
\n\
  toolbar.ctx = ctx;\n\
/*\n\
  toolbar.logo = createElement('logo');\n\
  toolbar.logo.innerHTML = '\\\\<span class=\"underline\">~</span>/';\n\
*/\n\
  toolbar.logo = new Logo;\n\
\n\
  // play / pause\n\
  toolbar.play = createElement('play', 'button icon-play');\n\
  toolbar.pause = createElement('pause', 'button icon-pause hide');\n\
  toolbar.stop = createElement('stop', 'button icon-stop');\n\
  // toolbar.record = createElement('record', 'button icon-record');\n\
  toolbar.save = createElement('save', 'button icon-save right');\n\
  toolbar.share = createElement('share', 'button icon-share right');\n\
  toolbar.export = createElement('export', 'button icon-export right');\n\
  toolbar.console = createElement('console', 'button icon-console right');\n\
  toolbar.profile = createElement('profile', 'button icon-profile right');\n\
  toolbar.info = createElement('info', 'button icon-info right');\n\
  toolbar.menu = createElement('menu', 'button icon-menu right');\n\
\n\
  toolbar.play.title =\n\
  toolbar.pause.title = 'super + enter = toggle pause\\n\
super + shift + enter = play from start';\n\
\n\
  // oscilloscope\n\
  toolbar.oscilloscope = new Oscilloscope({\n\
    width: 165,\n\
    height: 50\n\
  });\n\
  toolbar.oscilloscope.el.title = 'left click : toggle\\n\
right click : resolution\\n\
wheel : zoom';\n\
  toolbar.oscilloscope.step = 8;\n\
/*\n\
  // master volume\n\
  var gui = new xgui({\n\
    width: 35,\n\
    height: 50,\n\
    backgroundColor: '#59584E',\n\
    frontColor: '#A0D92E',\n\
    dimColor: '#aaa', //#2F3129'\n\
  });\n\
\n\
  gui.el = gui.getDomElement();\n\
  gui.el.title = 'master volume\\n\
right click : (un)mute';\n\
  gui.el.oncontextmenu = function(ev){\n\
    ev.preventDefault();\n\
    if (toolbar.volume.mute && toolbar.volume.value.v === 0) {\n\
      toolbar.volume.value.v = toolbar.volume.previous;\n\
      toolbar.volume.mute = false;\n\
    } else {\n\
      toolbar.volume.previous = toolbar.volume.value.v;\n\
      toolbar.volume.value.v = 0;\n\
      toolbar.volume.mute = true;\n\
    }\n\
    toolbar.volume.draw();\n\
    toolbar.volume.value.updateBind();\n\
    return false;\n\
  };\n\
\n\
  toolbar.volume = new gui.VSlider({\n\
    x: 10,\n\
    y: 10,\n\
    max: 100,\n\
    value: dsp.volume,\n\
    width: 15,\n\
    height: 30,\n\
    hideValue: true\n\
  });\n\
\n\
  toolbar.volume.value.bind(dsp, 'volume');\n\
*/\n\
\n\
/*\n\
  toolbar.volume = new gui.Knob({\n\
    x: 10,\n\
    y: 9,\n\
    radius: 15,\n\
    value: 65,\n\
    min: 0,\n\
    max: 100\n\
  });\n\
*/\n\
\n\
  toolbar.oscilloscope.el.classList.add('right');\n\
\n\
  toolbar.el.appendChild(toolbar.logo.el);\n\
  //toolbar.el.appendChild(gui.el);\n\
  toolbar.el.appendChild(toolbar.play);\n\
  toolbar.el.appendChild(toolbar.pause);\n\
  toolbar.el.appendChild(toolbar.stop);\n\
  // toolbar.el.appendChild(toolbar.record);\n\
  toolbar.el.appendChild(toolbar.menu);\n\
  toolbar.el.appendChild(toolbar.oscilloscope.el);\n\
  /*\n\
  toolbar.el.appendChild(toolbar.console);\n\
  toolbar.el.appendChild(toolbar.share);\n\
  toolbar.el.appendChild(toolbar.export);\n\
  toolbar.el.appendChild(toolbar.save);\n\
  */\n\
  //toolbar.el.appendChild(toolbar.profile);\n\
  //toolbar.el.appendChild(toolbar.info);\n\
\n\
  toolbar.logo.el.onclick = about.show.bind(about);\n\
\n\
  toolbar.play.onclick =\n\
  toolbar.pause.onclick = togglePause;\n\
  toolbar.stop.onclick = function(){\n\
    ctx.stop();\n\
    toolbar.play.classList.remove('hide');\n\
    toolbar.pause.classList.add('hide');\n\
  };\n\
\n\
  // toolbar.record.onclick = about.show.bind(about); //fund.show.bind(fund, 'milestone I');\n\
  toolbar.menu.onclick = about.show.bind(about); //fund.show.bind(fund, 'milestone I');\n\
  /*toolbar.smiley.onclick =\n\
  toolbar.record.onclick =\n\
  toolbar.save.onclick = fundlist.show;*/\n\
}\n\
\n\
function togglePause(){\n\
  var ctx = toolbar.ctx;\n\
\n\
  if (ctx.playing) {\n\
    ctx.pause();\n\
  } else {\n\
    ctx.play();\n\
  }\n\
\n\
  if (ctx.playing) {\n\
    toolbar.play.classList.add('hide');\n\
    toolbar.pause.classList.remove('hide');\n\
  } else {\n\
    toolbar.play.classList.remove('hide');\n\
    toolbar.pause.classList.add('hide');\n\
  }\n\
}\n\
//@ sourceURL=wavepot/toolbar.js"
));
require.register("wavepot/sidebar.js", Function("exports, require, module",
"\n\
var ajax = require('ajax');\n\
//var modules = require('./dsp-modules');\n\
var about = require('./about');\n\
var emitter = require('emitter');\n\
var utils = require('./utils');\n\
var tree = require('treeview');\n\
var createElement = utils.createElement;\n\
\n\
var library = {};\n\
/*\n\
[\n\
  'simple-sine',\n\
  'on-the-verge',\n\
  'on-the-verge-tech-mix',\n\
  'polytropon',\n\
  'polytropon-astral-mix',\n\
  'unexpected-token',\n\
  'early-morning',\n\
  'morning',\n\
  'late-morning',\n\
  'icecream',\n\
  'got-some-303',\n\
  'need-more-303',\n\
  'subwah'\n\
]\n\
.forEach(function(name){\n\
  library['/projects/' + name.replace(/-/g, ' ')] = require('./library/projects/' + name)\n\
    .toString()\n\
    .split('\\n\
')\n\
    .slice(1, -1)\n\
    .join('\\n\
');\n\
});\n\
*/\n\
var sidebar = module.exports = emitter({});\n\
\n\
sidebar.create = createSidebar;\n\
\n\
function createSidebar(context){\n\
  sidebar.el = createElement('sidebar');\n\
\n\
  sidebar.on('select', function(node){\n\
    var path = node.path();\n\
    var dir = path.split('/')[1];\n\
\n\
    switch (dir) {\n\
      case 'projects':\n\
        var sublime = context.sublime;\n\
        if (!sublime) return;\n\
\n\
        if (context.hasEdited) {\n\
          if (!confirm('You\\'ve made some edits!\\n\
\\n\
Are you sure you want to load a new project and lose everything?')) return;\n\
        }\n\
\n\
        context.isNewProject = true;\n\
\n\
        var session = sublime.editor.getSession();\n\
\n\
        ajax.get(path, function(code){\n\
          session.setValue(code);\n\
        });\n\
\n\
        break;\n\
\n\
      default:\n\
        about.show()\n\
        // fund.show('milestone I');\n\
        break;\n\
    }\n\
  });\n\
\n\
  var nodes = [\n\
    // ['modules', true],\n\
    ['projects', true]\n\
  ];\n\
\n\
  var contents = {\n\
    '/projects': [\n\
      ['afternoon walk'],\n\
      ['dubstep dawn'],\n\
      ['early morning'],\n\
      ['go to sleep'],\n\
      ['got some 303'],\n\
      ['icecream'],\n\
      ['late morning'],\n\
      ['mind swift'],\n\
      ['mind swift seutje mix'],\n\
      ['morning'],\n\
      ['need more 303'],\n\
      ['on the verge'],\n\
      ['on the verge tech mix'],\n\
      ['polytropon'],\n\
      ['polytropon astral mix'],\n\
      ['rooftop unvisited'],\n\
      ['simple sine'],\n\
      ['subwah'],\n\
      ['unexpected token'],\n\
      ['yay'],\n\
    ]\n\
    // '/modules': [\n\
    //   ['effects', true],\n\
    //   ['oscillators', true],\n\
    //   ['sequencers', true],\n\
    //   ['synths', true],\n\
    //   ['various', true]\n\
    // ],\n\
    // //'/projects': Object.keys(library).map(function(name){ return [name.split('/').pop()]; }),\n\
    // '/modules/effects': [\n\
    //   ['amp', true],\n\
    //   ['chorus', true],\n\
    //   ['delay', true],\n\
    //   ['dynamics', true],\n\
    //   ['eq', true],\n\
    //   ['filter', true],\n\
    //   ['flanger', true],\n\
    //   ['modulation', true],\n\
    //   ['phaser', true],\n\
    //   ['reverb', true]\n\
    // ],\n\
    // '/modules/synths': [\n\
    //   ['ambient', true],\n\
    //   ['analog', true],\n\
    //   ['bass', true],\n\
    //   ['drums', true],\n\
    //   ['flute', true],\n\
    //   ['fm', true],\n\
    //   ['fx', true],\n\
    //   ['modular', true],\n\
    //   ['organ', true],\n\
    //   ['pads', true],\n\
    //   ['percussion', true],\n\
    //   ['piano', true],\n\
    //   ['sample', true],\n\
    //   ['strings', true]\n\
    // ]\n\
  };\n\
\n\
  function fetch(node, fn){\n\
    var path = node.path();\n\
    var parts = path.split('/');\n\
    var dir = parts[1];\n\
    var res = contents[path];\n\
    if (!res) {\n\
      switch (dir) {\n\
        case 'projects':\n\
          load(path, fn);\n\
          break;\n\
        default:\n\
          about.show()\n\
          // fund.show('milestone I');\n\
          // fund.modal.once('hiding', fn.bind(this, new Error('no results')));\n\
          break;\n\
      }\n\
    } else {\n\
      fn(null, contents[path]);\n\
    }\n\
  }\n\
\n\
  function load(path, fn){\n\
    ajax.getJSON(path, function(res){\n\
      res = res.map(function(name){\n\
        return [name];\n\
      });\n\
      fn(null, res);\n\
    });\n\
  }\n\
\n\
  setTimeout(function(){\n\
    tree(sidebar, nodes, fetch)[0].click(function(err, nodes){\n\
      var path = document.location.pathname;\n\
\n\
      if ('/' == path) {\n\
        nodes.forEach(function(node){\n\
          if (~node.path().indexOf('simple sine')) node.click();\n\
        });\n\
      } else {\n\
        loadRawGit(path);\n\
      }\n\
    });\n\
  }, 0);\n\
\n\
  function loadRawGit(path){\n\
    var sublime = context.sublime;\n\
    if (!sublime) return;\n\
\n\
    context.isNewProject = true;\n\
\n\
    var session = sublime.editor.getSession();\n\
\n\
    path = 'https://gitcdn.xyz/cdn' + path;\n\
\n\
    if (!~path.indexOf('/raw/')) path += '/raw/';\n\
\n\
    ajax({\n\
      url: path,\n\
      dataType: 'text/plain',\n\
      success: success\n\
    });\n\
\n\
    function success(code){\n\
      session.setValue(code);\n\
    }\n\
  }\n\
/*\n\
  sidebar.header = createElement('header');\n\
  sidebar.header.innerHTML = '<ul><li>modules<li>projects<li>samples<li>visuals</ul>';\n\
\n\
  sidebar.list = document.createElement('ul');\n\
  sidebar.list.className = 'browser';\n\
\n\
  var keys = Object.keys(modules);\n\
  keys.unshift('+ create');\n\
  keys.forEach(function(key){\n\
    var item;\n\
    item = document.createElement('li');\n\
    item.innerHTML = key;\n\
    sidebar.list.appendChild(item);\n\
  });\n\
\n\
  sidebar.el.appendChild(sidebar.header);\n\
  sidebar.el.appendChild(sidebar.list);\n\
*/\n\
}\n\
//@ sourceURL=wavepot/sidebar.js"
));
require.register("wavepot/about.js", Function("exports, require, module",
"\n\
var ejs = require('ejs');\n\
var Logo = require('logo-wavepot');\n\
var modal = require('modal');\n\
var utils = require('./utils');\n\
var createElement = utils.createElement;\n\
\n\
var tmpl = {\n\
  about: require('./about.html')\n\
};\n\
\n\
var about = module.exports = {};\n\
\n\
about.show = show;\n\
about.active = null;\n\
\n\
function show(){\n\
  if (about.active) return;\n\
\n\
  // var fund = require('./fund');\n\
  // if (fund.active) {\n\
  //   fund.modal.once('hide', about.show.bind(about));\n\
  //   fund.modal.hide();\n\
  //   return;\n\
  // }\n\
\n\
  about.active = true;\n\
\n\
  var el = createElement('about', 'modal');\n\
\n\
  el.innerHTML = tmpl.about;\n\
\n\
  var logo = new Logo(0.5);\n\
  logo.svg.setAttribute('width', '310px');\n\
  logo.svg.setAttribute('height', '210px');\n\
  logo.svg.setAttribute('viewBox', '0 0 60 50');\n\
  logo.svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');\n\
  logo.pot.setAttribute('stroke-width', 2.75);\n\
  logo.pot.setAttribute('stroke-linecap', 'butt');\n\
  logo.wave.setAttribute('stroke-width', 2.75);\n\
  logo.wave.setAttribute('stroke-linecap', 'butt');\n\
  query('.about-logo').appendChild(logo.el);\n\
\n\
  // query('a.fundraiser').onclick = function(ev){\n\
  //   ev.preventDefault();\n\
  //   fund.show('milestone I');\n\
  //   return false;\n\
  // };\n\
\n\
  about.modal = modal(el)\n\
    .overlay()\n\
    .closeable()\n\
    .effect('fade-and-scale')\n\
    .show()\n\
    .on('hide', function(){\n\
      about.active = null;\n\
    });\n\
\n\
  function query(sel){\n\
    return el.querySelector(sel);\n\
  }\n\
}\n\
//@ sourceURL=wavepot/about.js"
));






























require.register("segmentio-overlay/lib/index.html", Function("exports, require, module",
"module.exports = '<div class=\"Overlay hidden\"></div>';//@ sourceURL=segmentio-overlay/lib/index.html"
));






require.register("segmentio-modal/lib/index.html", Function("exports, require, module",
"module.exports = '<div class=\"Modal hidden\" effect=\"toggle\"></div>';//@ sourceURL=segmentio-modal/lib/index.html"
));













require.register("wavepot/about.html", Function("exports, require, module",
"module.exports = '\\n\
<div class=\"about\">\\n\
  <center>\\n\
    <div class=\"about-logo\"></div>\\n\
\\n\
    <h1>wavep0t</h1>\\n\
\\n\
    <p class=\"details tagline\">\\n\
      dsp playground\\n\
    </p>\\n\
    <p class=\"details\">\\n\
      <a target=\"_blank\" href=\"https://news.ycombinator.com/item?id=7905910\">hn discussion</a>\\n\
    </p>\\n\
  </center>\\n\
</div>\\n\
';//@ sourceURL=wavepot/about.html"
));
require.alias("component-emitter/index.js", "wavepot/deps/emitter/index.js");
require.alias("component-emitter/index.js", "emitter/index.js");

require.alias("component-debounce/index.js", "wavepot/deps/debounce/index.js");
require.alias("component-debounce/index.js", "wavepot/deps/debounce/index.js");
require.alias("component-debounce/index.js", "debounce/index.js");
require.alias("component-debounce/index.js", "component-debounce/index.js");
require.alias("forbeslindesay-ajax/index.js", "wavepot/deps/ajax/index.js");
require.alias("forbeslindesay-ajax/index.js", "ajax/index.js");
require.alias("component-type/index.js", "forbeslindesay-ajax/deps/type/index.js");

require.alias("matthewmueller-qr-code/index.js", "wavepot/deps/qr-code/index.js");
require.alias("matthewmueller-qr-code/qr-code.js", "wavepot/deps/qr-code/qr-code.js");
require.alias("matthewmueller-qr-code/index.js", "wavepot/deps/qr-code/index.js");
require.alias("matthewmueller-qr-code/index.js", "qr-code/index.js");
require.alias("matthewmueller-qr-code/index.js", "matthewmueller-qr-code/index.js");
require.alias("segmentio-modal/lib/index.js", "wavepot/deps/modal/lib/index.js");
require.alias("segmentio-modal/lib/index.js", "wavepot/deps/modal/index.js");
require.alias("segmentio-modal/lib/index.js", "modal/index.js");
require.alias("component-domify/index.js", "segmentio-modal/deps/domify/index.js");

require.alias("component-emitter/index.js", "segmentio-modal/deps/emitter/index.js");

require.alias("segmentio-overlay/lib/index.js", "segmentio-modal/deps/overlay/lib/index.js");
require.alias("segmentio-overlay/lib/index.js", "segmentio-modal/deps/overlay/index.js");
require.alias("component-emitter/index.js", "segmentio-overlay/deps/emitter/index.js");

require.alias("component-domify/index.js", "segmentio-overlay/deps/domify/index.js");

require.alias("segmentio-showable/index.js", "segmentio-overlay/deps/showable/index.js");
require.alias("timoxley-next-tick/index.js", "segmentio-showable/deps/next-tick/index.js");

require.alias("yields-after-transition/index.js", "segmentio-showable/deps/after-transition/index.js");
require.alias("yields-after-transition/index.js", "segmentio-showable/deps/after-transition/index.js");
require.alias("yields-has-transitions/index.js", "yields-after-transition/deps/has-transitions/index.js");
require.alias("yields-has-transitions/index.js", "yields-after-transition/deps/has-transitions/index.js");
require.alias("yields-has-transitions/index.js", "yields-has-transitions/index.js");
require.alias("ecarter-css-emitter/index.js", "yields-after-transition/deps/css-emitter/index.js");
require.alias("component-event/index.js", "ecarter-css-emitter/deps/event/index.js");

require.alias("component-once/index.js", "yields-after-transition/deps/once/index.js");

require.alias("yields-after-transition/index.js", "yields-after-transition/index.js");
require.alias("segmentio-on-escape/index.js", "segmentio-showable/deps/on-escape/index.js");
require.alias("component-event/index.js", "segmentio-on-escape/deps/event/index.js");

require.alias("component-indexof/index.js", "segmentio-on-escape/deps/indexof/index.js");

require.alias("ianstormtaylor-classes/index.js", "segmentio-overlay/deps/classes/index.js");
require.alias("jkroso-classes/index.js", "ianstormtaylor-classes/deps/classes/index.js");
require.alias("jkroso-classes/fallback.js", "ianstormtaylor-classes/deps/classes/fallback.js");
require.alias("jkroso-classes/modern.js", "ianstormtaylor-classes/deps/classes/modern.js");
require.alias("component-indexof/index.js", "jkroso-classes/deps/indexof/index.js");

require.alias("segmentio-overlay/lib/index.js", "segmentio-overlay/index.js");
require.alias("segmentio-showable/index.js", "segmentio-modal/deps/showable/index.js");
require.alias("timoxley-next-tick/index.js", "segmentio-showable/deps/next-tick/index.js");

require.alias("yields-after-transition/index.js", "segmentio-showable/deps/after-transition/index.js");
require.alias("yields-after-transition/index.js", "segmentio-showable/deps/after-transition/index.js");
require.alias("yields-has-transitions/index.js", "yields-after-transition/deps/has-transitions/index.js");
require.alias("yields-has-transitions/index.js", "yields-after-transition/deps/has-transitions/index.js");
require.alias("yields-has-transitions/index.js", "yields-has-transitions/index.js");
require.alias("ecarter-css-emitter/index.js", "yields-after-transition/deps/css-emitter/index.js");
require.alias("component-event/index.js", "ecarter-css-emitter/deps/event/index.js");

require.alias("component-once/index.js", "yields-after-transition/deps/once/index.js");

require.alias("yields-after-transition/index.js", "yields-after-transition/index.js");
require.alias("segmentio-on-escape/index.js", "segmentio-showable/deps/on-escape/index.js");
require.alias("component-event/index.js", "segmentio-on-escape/deps/event/index.js");

require.alias("component-indexof/index.js", "segmentio-on-escape/deps/indexof/index.js");

require.alias("segmentio-on-escape/index.js", "segmentio-modal/deps/on-escape/index.js");
require.alias("component-event/index.js", "segmentio-on-escape/deps/event/index.js");

require.alias("component-indexof/index.js", "segmentio-on-escape/deps/indexof/index.js");

require.alias("ianstormtaylor-classes/index.js", "segmentio-modal/deps/classes/index.js");
require.alias("jkroso-classes/index.js", "ianstormtaylor-classes/deps/classes/index.js");
require.alias("jkroso-classes/fallback.js", "ianstormtaylor-classes/deps/classes/fallback.js");
require.alias("jkroso-classes/modern.js", "ianstormtaylor-classes/deps/classes/modern.js");
require.alias("component-indexof/index.js", "jkroso-classes/deps/indexof/index.js");

require.alias("segmentio-modal/lib/index.js", "segmentio-modal/index.js");
require.alias("btknorr-ejs/ejs.js", "wavepot/deps/ejs/ejs.js");
require.alias("btknorr-ejs/ejs.js", "wavepot/deps/ejs/index.js");
require.alias("btknorr-ejs/ejs.js", "ejs/index.js");
require.alias("btknorr-ejs/ejs.js", "btknorr-ejs/index.js");
require.alias("yields-k/lib/index.js", "wavepot/deps/k/lib/index.js");
require.alias("yields-k/lib/proto.js", "wavepot/deps/k/lib/proto.js");
require.alias("yields-k/lib/index.js", "wavepot/deps/k/index.js");
require.alias("yields-k/lib/index.js", "k/index.js");
require.alias("yields-k-sequence/index.js", "yields-k/deps/k-sequence/index.js");
require.alias("yields-k-sequence/index.js", "yields-k/deps/k-sequence/index.js");
require.alias("yields-keycode/index.js", "yields-k-sequence/deps/keycode/index.js");

require.alias("yields-k-sequence/index.js", "yields-k-sequence/index.js");
require.alias("yields-keycode/index.js", "yields-k/deps/keycode/index.js");

require.alias("component-event/index.js", "yields-k/deps/event/index.js");

require.alias("component-bind/index.js", "yields-k/deps/bind/index.js");

require.alias("component-os/index.js", "yields-k/deps/os/index.js");

require.alias("yields-k/lib/index.js", "yields-k/index.js");
require.alias("yields-currency/index.js", "wavepot/deps/currency/index.js");
require.alias("yields-currency/index.js", "wavepot/deps/currency/index.js");
require.alias("yields-currency/index.js", "currency/index.js");
require.alias("yields-currency/index.js", "yields-currency/index.js");
require.alias("yields-load-image/index.js", "wavepot/deps/load-image/index.js");
require.alias("yields-load-image/index.js", "load-image/index.js");

require.alias("stagas-webaudio-dsp/index.js", "wavepot/deps/webaudio-dsp/index.js");
require.alias("stagas-webaudio-dsp/test/stagas-unexpected_token.js", "wavepot/deps/webaudio-dsp/test/stagas-unexpected_token.js");
require.alias("stagas-webaudio-dsp/index.js", "webaudio-dsp/index.js");
require.alias("component-emitter/index.js", "stagas-webaudio-dsp/deps/emitter/index.js");

require.alias("stagas-audio-process/index.js", "stagas-webaudio-dsp/deps/audio-process/index.js");

require.alias("stagas-oscilloscope/index.js", "wavepot/deps/oscilloscope/index.js");
require.alias("stagas-oscilloscope/index.js", "oscilloscope/index.js");
require.alias("component-raf/index.js", "stagas-oscilloscope/deps/raf/index.js");

require.alias("stagas-logo-wavepot/index-v1.js", "wavepot/deps/logo-wavepot/index-v1.js");
require.alias("stagas-logo-wavepot/index-v2.js", "wavepot/deps/logo-wavepot/index-v2.js");
require.alias("stagas-logo-wavepot/index-v1.js", "wavepot/deps/logo-wavepot/index.js");
require.alias("stagas-logo-wavepot/index-v1.js", "logo-wavepot/index.js");
require.alias("stagas-logo-wavepot/index-v1.js", "stagas-logo-wavepot/index.js");
require.alias("stagas-worker-fork/index.js", "wavepot/deps/worker-fork/index.js");
require.alias("stagas-worker-fork/index.js", "wavepot/deps/worker-fork/index.js");
require.alias("stagas-worker-fork/index.js", "worker-fork/index.js");
require.alias("component-emitter/index.js", "stagas-worker-fork/deps/emitter/index.js");

require.alias("stagas-worker-fork/index.js", "stagas-worker-fork/index.js");
require.alias("stagas-treeview/index.js", "wavepot/deps/treeview/index.js");
require.alias("stagas-treeview/index.js", "wavepot/deps/treeview/index.js");
require.alias("stagas-treeview/index.js", "treeview/index.js");
require.alias("stagas-treeview/index.js", "stagas-treeview/index.js");
require.alias("stagas-watch-js/lib/reload.js", "wavepot/deps/live-reload/lib/reload.js");
require.alias("stagas-watch-js/lib/reload.js", "wavepot/deps/live-reload/index.js");
require.alias("stagas-watch-js/lib/reload.js", "live-reload/index.js");
require.alias("stagas-watch-js/lib/reload.js", "stagas-watch-js/index.js");