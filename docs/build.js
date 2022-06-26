
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
require.register("component-emitter/index.js", function(exports, require, module){

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

});
require.register("component-debounce/index.js", function(exports, require, module){
/**
 * Debounces a function by the given threshold.
 *
 * @see http://unscriptable.com/2009/03/20/debouncing-javascript-methods/
 * @param {Function} function to wrap
 * @param {Number} timeout in ms (`100`)
 * @param {Boolean} whether to execute at the beginning (`false`)
 * @api public
 */

module.exports = function debounce(func, threshold, execAsap){
  var timeout;

  return function debounced(){
    var obj = this, args = arguments;

    function delayed () {
      if (!execAsap) {
        func.apply(obj, args);
      }
      timeout = null;
    }

    if (timeout) {
      clearTimeout(timeout);
    } else if (execAsap) {
      func.apply(obj, args);
    }

    timeout = setTimeout(delayed, threshold || 100);
  };
};

});
require.register("component-type/index.js", function(exports, require, module){

/**
 * toString ref.
 */

var toString = Object.prototype.toString;

/**
 * Return the type of `val`.
 *
 * @param {Mixed} val
 * @return {String}
 * @api public
 */

module.exports = function(val){
  switch (toString.call(val)) {
    case '[object Function]': return 'function';
    case '[object Date]': return 'date';
    case '[object RegExp]': return 'regexp';
    case '[object Arguments]': return 'arguments';
    case '[object Array]': return 'array';
    case '[object String]': return 'string';
  }

  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (val && val.nodeType === 1) return 'element';
  if (val === Object(val)) return 'object';

  return typeof val;
};

});
require.register("forbeslindesay-ajax/index.js", function(exports, require, module){
var type
try {
  type = require('type-of')
} catch (ex) {
  //hide from browserify
  var r = require
  type = r('type')
}

var jsonpID = 0,
    document = window.document,
    key,
    name,
    rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    scriptTypeRE = /^(?:text|application)\/javascript/i,
    xmlTypeRE = /^(?:text|application)\/xml/i,
    jsonType = 'application/json',
    htmlType = 'text/html',
    blankRE = /^\s*$/

var ajax = module.exports = function(options){
  var settings = extend({}, options || {})
  for (key in ajax.settings) if (settings[key] === undefined) settings[key] = ajax.settings[key]

  ajaxStart(settings)

  if (!settings.crossDomain) settings.crossDomain = /^([\w-]+:)?\/\/([^\/]+)/.test(settings.url) &&
    RegExp.$2 != window.location.host

  var dataType = settings.dataType, hasPlaceholder = /=\?/.test(settings.url)
  if (dataType == 'jsonp' || hasPlaceholder) {
    if (!hasPlaceholder) settings.url = appendQuery(settings.url, 'callback=?')
    return ajax.JSONP(settings)
  }

  if (!settings.url) settings.url = window.location.toString()
  serializeData(settings)

  var mime = settings.accepts[dataType],
      baseHeaders = { },
      protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : window.location.protocol,
      xhr = ajax.settings.xhr(), abortTimeout

  if (!settings.crossDomain) baseHeaders['X-Requested-With'] = 'XMLHttpRequest'
  if (mime) {
    baseHeaders['Accept'] = mime
    if (mime.indexOf(',') > -1) mime = mime.split(',', 2)[0]
    xhr.overrideMimeType && xhr.overrideMimeType(mime)
  }
  if (settings.contentType || (settings.data && settings.type.toUpperCase() != 'GET'))
    baseHeaders['Content-Type'] = (settings.contentType || 'application/x-www-form-urlencoded')
  settings.headers = extend(baseHeaders, settings.headers || {})

  xhr.onreadystatechange = function(){
    if (xhr.readyState == 4) {
      clearTimeout(abortTimeout)
      var result, error = false
      if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304 || (xhr.status == 0 && protocol == 'file:')) {
        dataType = dataType || mimeToDataType(xhr.getResponseHeader('content-type'))
        result = xhr.responseText

        try {
          if (dataType == 'script')    (1,eval)(result)
          else if (dataType == 'xml')  result = xhr.responseXML
          else if (dataType == 'json') result = blankRE.test(result) ? null : JSON.parse(result)
        } catch (e) { error = e }

        if (error) ajaxError(error, 'parsererror', xhr, settings)
        else ajaxSuccess(result, xhr, settings)
      } else {
        ajaxError(null, 'error', xhr, settings)
      }
    }
  }

  var async = 'async' in settings ? settings.async : true
  xhr.open(settings.type, settings.url, async)

  for (name in settings.headers) xhr.setRequestHeader(name, settings.headers[name])

  if (ajaxBeforeSend(xhr, settings) === false) {
    xhr.abort()
    return false
  }

  if (settings.timeout > 0) abortTimeout = setTimeout(function(){
      xhr.onreadystatechange = empty
      xhr.abort()
      ajaxError(null, 'timeout', xhr, settings)
    }, settings.timeout)

  // avoid sending empty string (#319)
  xhr.send(settings.data ? settings.data : null)
  return xhr
}


// trigger a custom event and return false if it was cancelled
function triggerAndReturn(context, eventName, data) {
  //todo: Fire off some events
  //var event = $.Event(eventName)
  //$(context).trigger(event, data)
  return true;//!event.defaultPrevented
}

// trigger an Ajax "global" event
function triggerGlobal(settings, context, eventName, data) {
  if (settings.global) return triggerAndReturn(context || document, eventName, data)
}

// Number of active Ajax requests
ajax.active = 0

function ajaxStart(settings) {
  if (settings.global && ajax.active++ === 0) triggerGlobal(settings, null, 'ajaxStart')
}
function ajaxStop(settings) {
  if (settings.global && !(--ajax.active)) triggerGlobal(settings, null, 'ajaxStop')
}

// triggers an extra global event "ajaxBeforeSend" that's like "ajaxSend" but cancelable
function ajaxBeforeSend(xhr, settings) {
  var context = settings.context
  if (settings.beforeSend.call(context, xhr, settings) === false ||
      triggerGlobal(settings, context, 'ajaxBeforeSend', [xhr, settings]) === false)
    return false

  triggerGlobal(settings, context, 'ajaxSend', [xhr, settings])
}
function ajaxSuccess(data, xhr, settings) {
  var context = settings.context, status = 'success'
  settings.success.call(context, data, status, xhr)
  triggerGlobal(settings, context, 'ajaxSuccess', [xhr, settings, data])
  ajaxComplete(status, xhr, settings)
}
// type: "timeout", "error", "abort", "parsererror"
function ajaxError(error, type, xhr, settings) {
  var context = settings.context
  settings.error.call(context, xhr, type, error)
  triggerGlobal(settings, context, 'ajaxError', [xhr, settings, error])
  ajaxComplete(type, xhr, settings)
}
// status: "success", "notmodified", "error", "timeout", "abort", "parsererror"
function ajaxComplete(status, xhr, settings) {
  var context = settings.context
  settings.complete.call(context, xhr, status)
  triggerGlobal(settings, context, 'ajaxComplete', [xhr, settings])
  ajaxStop(settings)
}

// Empty function, used as default callback
function empty() {}

ajax.JSONP = function(options){
  if (!('type' in options)) return ajax(options)

  var callbackName = 'jsonp' + (++jsonpID),
    script = document.createElement('script'),
    abort = function(){
      //todo: remove script
      //$(script).remove()
      if (callbackName in window) window[callbackName] = empty
      ajaxComplete('abort', xhr, options)
    },
    xhr = { abort: abort }, abortTimeout,
    head = document.getElementsByTagName("head")[0]
      || document.documentElement

  if (options.error) script.onerror = function() {
    xhr.abort()
    options.error()
  }

  window[callbackName] = function(data){
    clearTimeout(abortTimeout)
      //todo: remove script
      //$(script).remove()
    delete window[callbackName]
    ajaxSuccess(data, xhr, options)
  }

  serializeData(options)
  script.src = options.url.replace(/=\?/, '=' + callbackName)

  // Use insertBefore instead of appendChild to circumvent an IE6 bug.
  // This arises when a base node is used (see jQuery bugs #2709 and #4378).
  head.insertBefore(script, head.firstChild);

  if (options.timeout > 0) abortTimeout = setTimeout(function(){
      xhr.abort()
      ajaxComplete('timeout', xhr, options)
    }, options.timeout)

  return xhr
}

ajax.settings = {
  // Default type of request
  type: 'GET',
  // Callback that is executed before request
  beforeSend: empty,
  // Callback that is executed if the request succeeds
  success: empty,
  // Callback that is executed the the server drops error
  error: empty,
  // Callback that is executed on request complete (both: error and success)
  complete: empty,
  // The context for the callbacks
  context: null,
  // Whether to trigger "global" Ajax events
  global: true,
  // Transport
  xhr: function () {
    return new window.XMLHttpRequest()
  },
  // MIME types mapping
  accepts: {
    script: 'text/javascript, application/javascript',
    json:   jsonType,
    xml:    'application/xml, text/xml',
    html:   htmlType,
    text:   'text/plain'
  },
  // Whether the request is to another domain
  crossDomain: false,
  // Default timeout
  timeout: 0
}

function mimeToDataType(mime) {
  return mime && ( mime == htmlType ? 'html' :
    mime == jsonType ? 'json' :
    scriptTypeRE.test(mime) ? 'script' :
    xmlTypeRE.test(mime) && 'xml' ) || 'text'
}

function appendQuery(url, query) {
  return (url + '&' + query).replace(/[&?]{1,2}/, '?')
}

// serialize payload and append it to the URL for GET requests
function serializeData(options) {
  if (type(options.data) === 'object') options.data = param(options.data)
  if (options.data && (!options.type || options.type.toUpperCase() == 'GET'))
    options.url = appendQuery(options.url, options.data)
}

ajax.get = function(url, success){ return ajax({ url: url, success: success }) }

ajax.post = function(url, data, success, dataType){
  if (type(data) === 'function') dataType = dataType || success, success = data, data = null
  return ajax({ type: 'POST', url: url, data: data, success: success, dataType: dataType })
}

ajax.getJSON = function(url, success){
  return ajax({ url: url, success: success, dataType: 'json' })
}

var escape = encodeURIComponent

function serialize(params, obj, traditional, scope){
  var array = type(obj) === 'array';
  for (var key in obj) {
    var value = obj[key];

    if (scope) key = traditional ? scope : scope + '[' + (array ? '' : key) + ']'
    // handle data in serializeArray() format
    if (!scope && array) params.add(value.name, value.value)
    // recurse into nested objects
    else if (traditional ? (type(value) === 'array') : (type(value) === 'object'))
      serialize(params, value, traditional, key)
    else params.add(key, value)
  }
}

function param(obj, traditional){
  var params = []
  params.add = function(k, v){ this.push(escape(k) + '=' + escape(v)) }
  serialize(params, obj, traditional)
  return params.join('&').replace('%20', '+')
}

function extend(target) {
  var slice = Array.prototype.slice;
  slice.call(arguments, 1).forEach(function(source) {
    for (key in source)
      if (source[key] !== undefined)
        target[key] = source[key]
  })
  return target
}
});
require.register("matthewmueller-qr-code/index.js", function(exports, require, module){
/**
 * Module Dependencies
 */

var qrcode = require('./qr-code');

/**
 * Export `QR`
 */

module.exports = QR;

/**
 * Initialize `QR`
 *
 * @param {String} text
 * @param {Object} opts
 */

function QR(text, opts) {
  text = text || '';
  opts = opts || {};
  var type = opts.type || 4;
  var level = opts.level || 'L';
  var size = opts.size || 4;
  var margin = opts.margin || 0;
  var qr = qrcode(type, level);
  qr.addData(text);
  qr.make();

  // Get the source
  var img = qr.createImgTag(size, margin);
  var o = document.createElement('div');
  o.innerHTML = img;
  return o.firstChild.src;
}

/**
 * Specify the backup level. Default is 'M'
 *
 * Options include:
 *
 *   L: up to 7% damage
 *   M: up to 15% damage
 *   Q: up to 25% damage
 *   H: up to 30% damage
 *
 * @param {String} level
 * @return {QR}
 * @api public
 */

QR.prototype.level = function(level) {
  this._level = level;
  return this;
}



});
require.register("matthewmueller-qr-code/qr-code.js", function(exports, require, module){
//---------------------------------------------------------------------
//
// QR Code Generator for JavaScript
//
// Copyright (c) 2009 Kazuhiko Arase
//
// URL: http://www.d-project.com/
//
// Licensed under the MIT license:
//  http://www.opensource.org/licenses/mit-license.php
//
// The word 'QR Code' is registered trademark of
// DENSO WAVE INCORPORATED
//  http://www.denso-wave.com/qrcode/faqpatent-e.html
//
//---------------------------------------------------------------------

module.exports = function() {

  //---------------------------------------------------------------------
  // qrcode
  //---------------------------------------------------------------------

  /**
   * qrcode
   * @param typeNumber 1 to 10
   * @param errorCorrectLevel 'L','M','Q','H'
   */
  var qrcode = function(typeNumber, errorCorrectLevel) {

    var PAD0 = 0xEC;
    var PAD1 = 0x11;

    var _typeNumber = typeNumber;
    var _errorCorrectLevel = QRErrorCorrectLevel[errorCorrectLevel];
    var _modules = null;
    var _moduleCount = 0;
    var _dataCache = null;
    var _dataList = new Array();

    var _this = {};

    var makeImpl = function(test, maskPattern) {

      _moduleCount = _typeNumber * 4 + 17;
      _modules = function(moduleCount) {
        var modules = new Array(moduleCount);
        for (var row = 0; row < moduleCount; row += 1) {
          modules[row] = new Array(moduleCount);
          for (var col = 0; col < moduleCount; col += 1) {
            modules[row][col] = null;
          }
        }
        return modules;
      }(_moduleCount);

      setupPositionProbePattern(0, 0);
      setupPositionProbePattern(_moduleCount - 7, 0);
      setupPositionProbePattern(0, _moduleCount - 7);
      setupPositionAdjustPattern();
      setupTimingPattern();
      setupTypeInfo(test, maskPattern);

      if (_typeNumber >= 7) {
        setupTypeNumber(test);
      }

      if (_dataCache == null) {
        _dataCache = createData(_typeNumber, _errorCorrectLevel, _dataList);
      }

      mapData(_dataCache, maskPattern);
    };

    var setupPositionProbePattern = function(row, col) {

      for (var r = -1; r <= 7; r += 1) {

        if (row + r <= -1 || _moduleCount <= row + r) continue;

        for (var c = -1; c <= 7; c += 1) {

          if (col + c <= -1 || _moduleCount <= col + c) continue;

          if ( (0 <= r && r <= 6 && (c == 0 || c == 6) )
              || (0 <= c && c <= 6 && (r == 0 || r == 6) )
              || (2 <= r && r <= 4 && 2 <= c && c <= 4) ) {
            _modules[row + r][col + c] = true;
          } else {
            _modules[row + r][col + c] = false;
          }
        }
      }
    };

    var getBestMaskPattern = function() {

      var minLostPoint = 0;
      var pattern = 0;

      for (var i = 0; i < 8; i += 1) {

        makeImpl(true, i);

        var lostPoint = QRUtil.getLostPoint(_this);

        if (i == 0 || minLostPoint > lostPoint) {
          minLostPoint = lostPoint;
          pattern = i;
        }
      }

      return pattern;
    };

    var setupTimingPattern = function() {

      for (var r = 8; r < _moduleCount - 8; r += 1) {
        if (_modules[r][6] != null) {
          continue;
        }
        _modules[r][6] = (r % 2 == 0);
      }

      for (var c = 8; c < _moduleCount - 8; c += 1) {
        if (_modules[6][c] != null) {
          continue;
        }
        _modules[6][c] = (c % 2 == 0);
      }
    };

    var setupPositionAdjustPattern = function() {

      var pos = QRUtil.getPatternPosition(_typeNumber);

      for (var i = 0; i < pos.length; i += 1) {

        for (var j = 0; j < pos.length; j += 1) {

          var row = pos[i];
          var col = pos[j];

          if (_modules[row][col] != null) {
            continue;
          }

          for (var r = -2; r <= 2; r += 1) {

            for (var c = -2; c <= 2; c += 1) {

              if (r == -2 || r == 2 || c == -2 || c == 2
                  || (r == 0 && c == 0) ) {
                _modules[row + r][col + c] = true;
              } else {
                _modules[row + r][col + c] = false;
              }
            }
          }
        }
      }
    };

    var setupTypeNumber = function(test) {

      var bits = QRUtil.getBCHTypeNumber(_typeNumber);

      for (var i = 0; i < 18; i += 1) {
        var mod = (!test && ( (bits >> i) & 1) == 1);
        _modules[Math.floor(i / 3)][i % 3 + _moduleCount - 8 - 3] = mod;
      }

      for (var i = 0; i < 18; i += 1) {
        var mod = (!test && ( (bits >> i) & 1) == 1);
        _modules[i % 3 + _moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
      }
    };

    var setupTypeInfo = function(test, maskPattern) {

      var data = (_errorCorrectLevel << 3) | maskPattern;
      var bits = QRUtil.getBCHTypeInfo(data);

      // vertical
      for (var i = 0; i < 15; i += 1) {

        var mod = (!test && ( (bits >> i) & 1) == 1);

        if (i < 6) {
          _modules[i][8] = mod;
        } else if (i < 8) {
          _modules[i + 1][8] = mod;
        } else {
          _modules[_moduleCount - 15 + i][8] = mod;
        }
      }

      // horizontal
      for (var i = 0; i < 15; i += 1) {

        var mod = (!test && ( (bits >> i) & 1) == 1);

        if (i < 8) {
          _modules[8][_moduleCount - i - 1] = mod;
        } else if (i < 9) {
          _modules[8][15 - i - 1 + 1] = mod;
        } else {
          _modules[8][15 - i - 1] = mod;
        }
      }

      // fixed module
      _modules[_moduleCount - 8][8] = (!test);
    };

    var mapData = function(data, maskPattern) {

      var inc = -1;
      var row = _moduleCount - 1;
      var bitIndex = 7;
      var byteIndex = 0;
      var maskFunc = QRUtil.getMaskFunction(maskPattern);

      for (var col = _moduleCount - 1; col > 0; col -= 2) {

        if (col == 6) col -= 1;

        while (true) {

          for (var c = 0; c < 2; c += 1) {

            if (_modules[row][col - c] == null) {

              var dark = false;

              if (byteIndex < data.length) {
                dark = ( ( (data[byteIndex] >>> bitIndex) & 1) == 1);
              }

              var mask = maskFunc(row, col - c);

              if (mask) {
                dark = !dark;
              }

              _modules[row][col - c] = dark;
              bitIndex -= 1;

              if (bitIndex == -1) {
                byteIndex += 1;
                bitIndex = 7;
              }
            }
          }

          row += inc;

          if (row < 0 || _moduleCount <= row) {
            row -= inc;
            inc = -inc;
            break;
          }
        }
      }
    };

    var createBytes = function(buffer, rsBlocks) {

      var offset = 0;

      var maxDcCount = 0;
      var maxEcCount = 0;

      var dcdata = new Array(rsBlocks.length);
      var ecdata = new Array(rsBlocks.length);

      for (var r = 0; r < rsBlocks.length; r += 1) {

        var dcCount = rsBlocks[r].dataCount;
        var ecCount = rsBlocks[r].totalCount - dcCount;

        maxDcCount = Math.max(maxDcCount, dcCount);
        maxEcCount = Math.max(maxEcCount, ecCount);

        dcdata[r] = new Array(dcCount);

        for (var i = 0; i < dcdata[r].length; i += 1) {
          dcdata[r][i] = 0xff & buffer.getBuffer()[i + offset];
        }
        offset += dcCount;

        var rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
        var rawPoly = qrPolynomial(dcdata[r], rsPoly.getLength() - 1);

        var modPoly = rawPoly.mod(rsPoly);
        ecdata[r] = new Array(rsPoly.getLength() - 1);
        for (var i = 0; i < ecdata[r].length; i += 1) {
          var modIndex = i + modPoly.getLength() - ecdata[r].length;
          ecdata[r][i] = (modIndex >= 0)? modPoly.getAt(modIndex) : 0;
        }
      }

      var totalCodeCount = 0;
      for (var i = 0; i < rsBlocks.length; i += 1) {
        totalCodeCount += rsBlocks[i].totalCount;
      }

      var data = new Array(totalCodeCount);
      var index = 0;

      for (var i = 0; i < maxDcCount; i += 1) {
        for (var r = 0; r < rsBlocks.length; r += 1) {
          if (i < dcdata[r].length) {
            data[index] = dcdata[r][i];
            index += 1;
          }
        }
      }

      for (var i = 0; i < maxEcCount; i += 1) {
        for (var r = 0; r < rsBlocks.length; r += 1) {
          if (i < ecdata[r].length) {
            data[index] = ecdata[r][i];
            index += 1;
          }
        }
      }

      return data;
    };

    var createData = function(typeNumber, errorCorrectLevel, dataList) {

      var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectLevel);

      var buffer = qrBitBuffer();

      for (var i = 0; i < dataList.length; i += 1) {
        var data = dataList[i];
        buffer.put(data.getMode(), 4);
        buffer.put(data.getLength(), QRUtil.getLengthInBits(data.getMode(), typeNumber) );
        data.write(buffer);
      }

      // calc num max data.
      var totalDataCount = 0;
      for (var i = 0; i < rsBlocks.length; i += 1) {
        totalDataCount += rsBlocks[i].dataCount;
      }

      if (buffer.getLengthInBits() > totalDataCount * 8) {
        throw new Error('code length overflow. ('
          + buffer.getLengthInBits()
          + '>'
          + totalDataCount * 8
          + ')');
      }

      // end code
      if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
        buffer.put(0, 4);
      }

      // padding
      while (buffer.getLengthInBits() % 8 != 0) {
        buffer.putBit(false);
      }

      // padding
      while (true) {

        if (buffer.getLengthInBits() >= totalDataCount * 8) {
          break;
        }
        buffer.put(PAD0, 8);

        if (buffer.getLengthInBits() >= totalDataCount * 8) {
          break;
        }
        buffer.put(PAD1, 8);
      }

      return createBytes(buffer, rsBlocks);
    };

    _this.addData = function(data) {
      var newData = qr8BitByte(data);
      _dataList.push(newData);
      _dataCache = null;
    };

    _this.isDark = function(row, col) {
      if (row < 0 || _moduleCount <= row || col < 0 || _moduleCount <= col) {
        throw new Error(row + ',' + col);
      }
      return _modules[row][col];
    };

    _this.getModuleCount = function() {
      return _moduleCount;
    };

    _this.make = function() {
      makeImpl(false, getBestMaskPattern() );
    };

    _this.createTableTag = function(cellSize, margin) {

      cellSize = cellSize || 2;
      margin = (typeof margin == 'undefined')? cellSize * 4 : margin;

      var qrHtml = '';

      qrHtml += '<table style="';
      qrHtml += ' border-width: 0px; border-style: none;';
      qrHtml += ' border-collapse: collapse;';
      qrHtml += ' padding: 0px; margin: ' + margin + 'px;';
      qrHtml += '">';
      qrHtml += '<tbody>';

      for (var r = 0; r < _this.getModuleCount(); r += 1) {

        qrHtml += '<tr>';

        for (var c = 0; c < _this.getModuleCount(); c += 1) {
          qrHtml += '<td style="';
          qrHtml += ' border-width: 0px; border-style: none;';
          qrHtml += ' border-collapse: collapse;';
          qrHtml += ' padding: 0px; margin: 0px;';
          qrHtml += ' width: ' + cellSize + 'px;';
          qrHtml += ' height: ' + cellSize + 'px;';
          qrHtml += ' background-color: ';
          qrHtml += _this.isDark(r, c)? '#000000' : '#ffffff';
          qrHtml += ';';
          qrHtml += '"/>';
        }

        qrHtml += '</tr>';
      }

      qrHtml += '</tbody>';
      qrHtml += '</table>';

      return qrHtml;
    };

    _this.createImgTag = function(cellSize, margin) {

      cellSize = cellSize || 2;
      margin = (typeof margin == 'undefined')? cellSize * 4 : margin;

      var size = _this.getModuleCount() * cellSize + margin * 2;
      var min = margin;
      var max = size - margin;

      return createImgTag(size, size, function(x, y) {
        if (min <= x && x < max && min <= y && y < max) {
          var c = Math.floor( (x - min) / cellSize);
          var r = Math.floor( (y - min) / cellSize);
          return _this.isDark(r, c)? 0 : 1;
        } else {
          return 1;
        }
      } );
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // qrcode.stringToBytes
  //---------------------------------------------------------------------

  qrcode.stringToBytes = function(s) {
    var bytes = new Array();
    for (var i = 0; i < s.length; i += 1) {
      var c = s.charCodeAt(i);
      bytes.push(c & 0xff);
    }
    return bytes;
  };

  //---------------------------------------------------------------------
  // qrcode.createStringToBytes
  //---------------------------------------------------------------------

  /**
   * @param unicodeData base64 string of byte array.
   * [16bit Unicode],[16bit Bytes], ...
   * @param numChars
   */
  qrcode.createStringToBytes = function(unicodeData, numChars) {

    // create conversion map.

    var unicodeMap = function() {

      var bin = base64DecodeInputStream(unicodeData);
      var read = function() {
        var b = bin.read();
        if (b == -1) throw new Error();
        return b;
      };

      var count = 0;
      var unicodeMap = {};
      while (true) {
        var b0 = bin.read();
        if (b0 == -1) break;
        var b1 = read();
        var b2 = read();
        var b3 = read();
        var k = String.fromCharCode( (b0 << 8) | b1);
        var v = (b2 << 8) | b3;
        unicodeMap[k] = v;
        count += 1;
      }
      if (count != numChars) {
        throw new Error(count + ' != ' + numChars);
      }

      return unicodeMap;
    }();

    var unknownChar = '?'.charCodeAt(0);

    return function(s) {
      var bytes = new Array();
      for (var i = 0; i < s.length; i += 1) {
        var c = s.charCodeAt(i);
        if (c < 128) {
          bytes.push(c);
        } else {
          var b = unicodeMap[s.charAt(i)];
          if (typeof b == 'number') {
            if ( (b & 0xff) == b) {
              // 1byte
              bytes.push(b);
            } else {
              // 2bytes
              bytes.push(b >>> 8);
              bytes.push(b & 0xff);
            }
          } else {
            bytes.push(unknownChar);
          }
        }
      }
      return bytes;
    };
  };

  //---------------------------------------------------------------------
  // QRMode
  //---------------------------------------------------------------------

  var QRMode = {
    MODE_NUMBER :   1 << 0,
    MODE_ALPHA_NUM :  1 << 1,
    MODE_8BIT_BYTE :  1 << 2,
    MODE_KANJI :    1 << 3
  };

  //---------------------------------------------------------------------
  // QRErrorCorrectLevel
  //---------------------------------------------------------------------

  var QRErrorCorrectLevel = {
    L : 1,
    M : 0,
    Q : 3,
    H : 2
  };

  //---------------------------------------------------------------------
  // QRMaskPattern
  //---------------------------------------------------------------------

  var QRMaskPattern = {
    PATTERN000 : 0,
    PATTERN001 : 1,
    PATTERN010 : 2,
    PATTERN011 : 3,
    PATTERN100 : 4,
    PATTERN101 : 5,
    PATTERN110 : 6,
    PATTERN111 : 7
  };

  //---------------------------------------------------------------------
  // QRUtil
  //---------------------------------------------------------------------

  var QRUtil = function() {

    var PATTERN_POSITION_TABLE = [
      [],
      [6, 18],
      [6, 22],
      [6, 26],
      [6, 30],
      [6, 34],
      [6, 22, 38],
      [6, 24, 42],
      [6, 26, 46],
      [6, 28, 50],
      [6, 30, 54],
      [6, 32, 58],
      [6, 34, 62],
      [6, 26, 46, 66],
      [6, 26, 48, 70],
      [6, 26, 50, 74],
      [6, 30, 54, 78],
      [6, 30, 56, 82],
      [6, 30, 58, 86],
      [6, 34, 62, 90],
      [6, 28, 50, 72, 94],
      [6, 26, 50, 74, 98],
      [6, 30, 54, 78, 102],
      [6, 28, 54, 80, 106],
      [6, 32, 58, 84, 110],
      [6, 30, 58, 86, 114],
      [6, 34, 62, 90, 118],
      [6, 26, 50, 74, 98, 122],
      [6, 30, 54, 78, 102, 126],
      [6, 26, 52, 78, 104, 130],
      [6, 30, 56, 82, 108, 134],
      [6, 34, 60, 86, 112, 138],
      [6, 30, 58, 86, 114, 142],
      [6, 34, 62, 90, 118, 146],
      [6, 30, 54, 78, 102, 126, 150],
      [6, 24, 50, 76, 102, 128, 154],
      [6, 28, 54, 80, 106, 132, 158],
      [6, 32, 58, 84, 110, 136, 162],
      [6, 26, 54, 82, 110, 138, 166],
      [6, 30, 58, 86, 114, 142, 170]
    ];
    var G15 = (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0);
    var G18 = (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0);
    var G15_MASK = (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1);

    var _this = {};

    var getBCHDigit = function(data) {
      var digit = 0;
      while (data != 0) {
        digit += 1;
        data >>>= 1;
      }
      return digit;
    };

    _this.getBCHTypeInfo = function(data) {
      var d = data << 10;
      while (getBCHDigit(d) - getBCHDigit(G15) >= 0) {
        d ^= (G15 << (getBCHDigit(d) - getBCHDigit(G15) ) );
      }
      return ( (data << 10) | d) ^ G15_MASK;
    };

    _this.getBCHTypeNumber = function(data) {
      var d = data << 12;
      while (getBCHDigit(d) - getBCHDigit(G18) >= 0) {
        d ^= (G18 << (getBCHDigit(d) - getBCHDigit(G18) ) );
      }
      return (data << 12) | d;
    };

    _this.getPatternPosition = function(typeNumber) {
      return PATTERN_POSITION_TABLE[typeNumber - 1];
    };

    _this.getMaskFunction = function(maskPattern) {

      switch (maskPattern) {

      case QRMaskPattern.PATTERN000 :
        return function(i, j) { return (i + j) % 2 == 0; };
      case QRMaskPattern.PATTERN001 :
        return function(i, j) { return i % 2 == 0; };
      case QRMaskPattern.PATTERN010 :
        return function(i, j) { return j % 3 == 0; };
      case QRMaskPattern.PATTERN011 :
        return function(i, j) { return (i + j) % 3 == 0; };
      case QRMaskPattern.PATTERN100 :
        return function(i, j) { return (Math.floor(i / 2) + Math.floor(j / 3) ) % 2 == 0; };
      case QRMaskPattern.PATTERN101 :
        return function(i, j) { return (i * j) % 2 + (i * j) % 3 == 0; };
      case QRMaskPattern.PATTERN110 :
        return function(i, j) { return ( (i * j) % 2 + (i * j) % 3) % 2 == 0; };
      case QRMaskPattern.PATTERN111 :
        return function(i, j) { return ( (i * j) % 3 + (i + j) % 2) % 2 == 0; };

      default :
        throw new Error('bad maskPattern:' + maskPattern);
      }
    };

    _this.getErrorCorrectPolynomial = function(errorCorrectLength) {
      var a = qrPolynomial([1], 0);
      for (var i = 0; i < errorCorrectLength; i += 1) {
        a = a.multiply(qrPolynomial([1, QRMath.gexp(i)], 0) );
      }
      return a;
    };

    _this.getLengthInBits = function(mode, type) {

      if (1 <= type && type < 10) {

        // 1 - 9

        switch(mode) {
        case QRMode.MODE_NUMBER   : return 10;
        case QRMode.MODE_ALPHA_NUM  : return 9;
        case QRMode.MODE_8BIT_BYTE  : return 8;
        case QRMode.MODE_KANJI    : return 8;
        default :
          throw new Error('mode:' + mode);
        }

      } else if (type < 27) {

        // 10 - 26

        switch(mode) {
        case QRMode.MODE_NUMBER   : return 12;
        case QRMode.MODE_ALPHA_NUM  : return 11;
        case QRMode.MODE_8BIT_BYTE  : return 16;
        case QRMode.MODE_KANJI    : return 10;
        default :
          throw new Error('mode:' + mode);
        }

      } else if (type < 41) {

        // 27 - 40

        switch(mode) {
        case QRMode.MODE_NUMBER   : return 14;
        case QRMode.MODE_ALPHA_NUM  : return 13;
        case QRMode.MODE_8BIT_BYTE  : return 16;
        case QRMode.MODE_KANJI    : return 12;
        default :
          throw new Error('mode:' + mode);
        }

      } else {
        throw new Error('type:' + type);
      }
    };

    _this.getLostPoint = function(qrcode) {

      var moduleCount = qrcode.getModuleCount();

      var lostPoint = 0;

      // LEVEL1

      for (var row = 0; row < moduleCount; row += 1) {
        for (var col = 0; col < moduleCount; col += 1) {

          var sameCount = 0;
          var dark = qrcode.isDark(row, col);

          for (var r = -1; r <= 1; r += 1) {

            if (row + r < 0 || moduleCount <= row + r) {
              continue;
            }

            for (var c = -1; c <= 1; c += 1) {

              if (col + c < 0 || moduleCount <= col + c) {
                continue;
              }

              if (r == 0 && c == 0) {
                continue;
              }

              if (dark == qrcode.isDark(row + r, col + c) ) {
                sameCount += 1;
              }
            }
          }

          if (sameCount > 5) {
            lostPoint += (3 + sameCount - 5);
          }
        }
      };

      // LEVEL2

      for (var row = 0; row < moduleCount - 1; row += 1) {
        for (var col = 0; col < moduleCount - 1; col += 1) {
          var count = 0;
          if (qrcode.isDark(row, col) ) count += 1;
          if (qrcode.isDark(row + 1, col) ) count += 1;
          if (qrcode.isDark(row, col + 1) ) count += 1;
          if (qrcode.isDark(row + 1, col + 1) ) count += 1;
          if (count == 0 || count == 4) {
            lostPoint += 3;
          }
        }
      }

      // LEVEL3

      for (var row = 0; row < moduleCount; row += 1) {
        for (var col = 0; col < moduleCount - 6; col += 1) {
          if (qrcode.isDark(row, col)
              && !qrcode.isDark(row, col + 1)
              &&  qrcode.isDark(row, col + 2)
              &&  qrcode.isDark(row, col + 3)
              &&  qrcode.isDark(row, col + 4)
              && !qrcode.isDark(row, col + 5)
              &&  qrcode.isDark(row, col + 6) ) {
            lostPoint += 40;
          }
        }
      }

      for (var col = 0; col < moduleCount; col += 1) {
        for (var row = 0; row < moduleCount - 6; row += 1) {
          if (qrcode.isDark(row, col)
              && !qrcode.isDark(row + 1, col)
              &&  qrcode.isDark(row + 2, col)
              &&  qrcode.isDark(row + 3, col)
              &&  qrcode.isDark(row + 4, col)
              && !qrcode.isDark(row + 5, col)
              &&  qrcode.isDark(row + 6, col) ) {
            lostPoint += 40;
          }
        }
      }

      // LEVEL4

      var darkCount = 0;

      for (var col = 0; col < moduleCount; col += 1) {
        for (var row = 0; row < moduleCount; row += 1) {
          if (qrcode.isDark(row, col) ) {
            darkCount += 1;
          }
        }
      }

      var ratio = Math.abs(100 * darkCount / moduleCount / moduleCount - 50) / 5;
      lostPoint += ratio * 10;

      return lostPoint;
    };

    return _this;
  }();

  //---------------------------------------------------------------------
  // QRMath
  //---------------------------------------------------------------------

  var QRMath = function() {

    var EXP_TABLE = new Array(256);
    var LOG_TABLE = new Array(256);

    // initialize tables
    for (var i = 0; i < 8; i += 1) {
      EXP_TABLE[i] = 1 << i;
    }
    for (var i = 8; i < 256; i += 1) {
      EXP_TABLE[i] = EXP_TABLE[i - 4]
        ^ EXP_TABLE[i - 5]
        ^ EXP_TABLE[i - 6]
        ^ EXP_TABLE[i - 8];
    }
    for (var i = 0; i < 255; i += 1) {
      LOG_TABLE[EXP_TABLE[i] ] = i;
    }

    var _this = {};

    _this.glog = function(n) {

      if (n < 1) {
        throw new Error('glog(' + n + ')');
      }

      return LOG_TABLE[n];
    };

    _this.gexp = function(n) {

      while (n < 0) {
        n += 255;
      }

      while (n >= 256) {
        n -= 255;
      }

      return EXP_TABLE[n];
    };

    return _this;
  }();

  //---------------------------------------------------------------------
  // qrPolynomial
  //---------------------------------------------------------------------

  function qrPolynomial(num, shift) {

    if (typeof num.length == 'undefined') {
      throw new Error(num.length + '/' + shift);
    }

    var _num = function() {
      var offset = 0;
      while (offset < num.length && num[offset] == 0) {
        offset += 1;
      }
      var _num = new Array(num.length - offset + shift);
      for (var i = 0; i < num.length - offset; i += 1) {
        _num[i] = num[i + offset];
      }
      return _num;
    }();

    var _this = {};

    _this.getAt = function(index) {
      return _num[index];
    };

    _this.getLength = function() {
      return _num.length;
    };

    _this.multiply = function(e) {

      var num = new Array(_this.getLength() + e.getLength() - 1);

      for (var i = 0; i < _this.getLength(); i += 1) {
        for (var j = 0; j < e.getLength(); j += 1) {
          num[i + j] ^= QRMath.gexp(QRMath.glog(_this.getAt(i) ) + QRMath.glog(e.getAt(j) ) );
        }
      }

      return qrPolynomial(num, 0);
    };

    _this.mod = function(e) {

      if (_this.getLength() - e.getLength() < 0) {
        return _this;
      }

      var ratio = QRMath.glog(_this.getAt(0) ) - QRMath.glog(e.getAt(0) );

      var num = new Array(_this.getLength() );
      for (var i = 0; i < _this.getLength(); i += 1) {
        num[i] = _this.getAt(i);
      }

      for (var i = 0; i < e.getLength(); i += 1) {
        num[i] ^= QRMath.gexp(QRMath.glog(e.getAt(i) ) + ratio);
      }

      // recursive call
      return qrPolynomial(num, 0).mod(e);
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // QRRSBlock
  //---------------------------------------------------------------------

  var QRRSBlock = function() {

    var RS_BLOCK_TABLE = [

      // L
      // M
      // Q
      // H

      // 1
      [1, 26, 19],
      [1, 26, 16],
      [1, 26, 13],
      [1, 26, 9],

      // 2
      [1, 44, 34],
      [1, 44, 28],
      [1, 44, 22],
      [1, 44, 16],

      // 3
      [1, 70, 55],
      [1, 70, 44],
      [2, 35, 17],
      [2, 35, 13],

      // 4
      [1, 100, 80],
      [2, 50, 32],
      [2, 50, 24],
      [4, 25, 9],

      // 5
      [1, 134, 108],
      [2, 67, 43],
      [2, 33, 15, 2, 34, 16],
      [2, 33, 11, 2, 34, 12],

      // 6
      [2, 86, 68],
      [4, 43, 27],
      [4, 43, 19],
      [4, 43, 15],

      // 7
      [2, 98, 78],
      [4, 49, 31],
      [2, 32, 14, 4, 33, 15],
      [4, 39, 13, 1, 40, 14],

      // 8
      [2, 121, 97],
      [2, 60, 38, 2, 61, 39],
      [4, 40, 18, 2, 41, 19],
      [4, 40, 14, 2, 41, 15],

      // 9
      [2, 146, 116],
      [3, 58, 36, 2, 59, 37],
      [4, 36, 16, 4, 37, 17],
      [4, 36, 12, 4, 37, 13],

      // 10
      [2, 86, 68, 2, 87, 69],
      [4, 69, 43, 1, 70, 44],
      [6, 43, 19, 2, 44, 20],
      [6, 43, 15, 2, 44, 16]
    ];

    var qrRSBlock = function(totalCount, dataCount) {
      var _this = {};
      _this.totalCount = totalCount;
      _this.dataCount = dataCount;
      return _this;
    };

    var _this = {};

    var getRsBlockTable = function(typeNumber, errorCorrectLevel) {

      switch(errorCorrectLevel) {
      case QRErrorCorrectLevel.L :
        return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0];
      case QRErrorCorrectLevel.M :
        return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1];
      case QRErrorCorrectLevel.Q :
        return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2];
      case QRErrorCorrectLevel.H :
        return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3];
      default :
        return undefined;
      }
    };

    _this.getRSBlocks = function(typeNumber, errorCorrectLevel) {

      var rsBlock = getRsBlockTable(typeNumber, errorCorrectLevel);

      if (typeof rsBlock == 'undefined') {
        throw new Error('bad rs block @ typeNumber:' + typeNumber +
            '/errorCorrectLevel:' + errorCorrectLevel);
      }

      var length = rsBlock.length / 3;

      var list = new Array();

      for (var i = 0; i < length; i += 1) {

        var count = rsBlock[i * 3 + 0];
        var totalCount = rsBlock[i * 3 + 1];
        var dataCount = rsBlock[i * 3 + 2];

        for (var j = 0; j < count; j += 1) {
          list.push(qrRSBlock(totalCount, dataCount) );
        }
      }

      return list;
    };

    return _this;
  }();

  //---------------------------------------------------------------------
  // qrBitBuffer
  //---------------------------------------------------------------------

  var qrBitBuffer = function() {

    var _buffer = new Array();
    var _length = 0;

    var _this = {};

    _this.getBuffer = function() {
      return _buffer;
    };

    _this.getAt = function(index) {
      var bufIndex = Math.floor(index / 8);
      return ( (_buffer[bufIndex] >>> (7 - index % 8) ) & 1) == 1;
    };

    _this.put = function(num, length) {
      for (var i = 0; i < length; i += 1) {
        _this.putBit( ( (num >>> (length - i - 1) ) & 1) == 1);
      }
    };

    _this.getLengthInBits = function() {
      return _length;
    };

    _this.putBit = function(bit) {

      var bufIndex = Math.floor(_length / 8);
      if (_buffer.length <= bufIndex) {
        _buffer.push(0);
      }

      if (bit) {
        _buffer[bufIndex] |= (0x80 >>> (_length % 8) );
      }

      _length += 1;
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // qr8BitByte
  //---------------------------------------------------------------------

  var qr8BitByte = function(data) {

    var _mode = QRMode.MODE_8BIT_BYTE;
    var _data = data;
    var _bytes = qrcode.stringToBytes(data);

    var _this = {};

    _this.getMode = function() {
      return _mode;
    };

    _this.getLength = function(buffer) {
      return _bytes.length;
    };

    _this.write = function(buffer) {
      for (var i = 0; i < _bytes.length; i += 1) {
        buffer.put(_bytes[i], 8);
      }
    };

    return _this;
  };

  //=====================================================================
  // GIF Support etc.
  //

  //---------------------------------------------------------------------
  // byteArrayOutputStream
  //---------------------------------------------------------------------

  var byteArrayOutputStream = function() {

    var _bytes = new Array();

    var _this = {};

    _this.writeByte = function(b) {
      _bytes.push(b & 0xff);
    };

    _this.writeShort = function(i) {
      _this.writeByte(i);
      _this.writeByte(i >>> 8);
    };

    _this.writeBytes = function(b, off, len) {
      off = off || 0;
      len = len || b.length;
      for (var i = 0; i < len; i += 1) {
        _this.writeByte(b[i + off]);
      }
    };

    _this.writeString = function(s) {
      for (var i = 0; i < s.length; i += 1) {
        _this.writeByte(s.charCodeAt(i) );
      }
    };

    _this.toByteArray = function() {
      return _bytes;
    };

    _this.toString = function() {
      var s = '';
      s += '[';
      for (var i = 0; i < _bytes.length; i += 1) {
        if (i > 0) {
          s += ',';
        }
        s += _bytes[i];
      }
      s += ']';
      return s;
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // base64EncodeOutputStream
  //---------------------------------------------------------------------

  var base64EncodeOutputStream = function() {

    var _buffer = 0;
    var _buflen = 0;
    var _length = 0;
    var _base64 = '';

    var _this = {};

    var writeEncoded = function(b) {
      _base64 += String.fromCharCode(encode(b & 0x3f) );
    };

    var encode = function(n) {
      if (n < 0) {
        // error.
      } else if (n < 26) {
        return 0x41 + n;
      } else if (n < 52) {
        return 0x61 + (n - 26);
      } else if (n < 62) {
        return 0x30 + (n - 52);
      } else if (n == 62) {
        return 0x2b;
      } else if (n == 63) {
        return 0x2f;
      }
      throw new Error('n:' + n);
    };

    _this.writeByte = function(n) {

      _buffer = (_buffer << 8) | (n & 0xff);
      _buflen += 8;
      _length += 1;

      while (_buflen >= 6) {
        writeEncoded(_buffer >>> (_buflen - 6) );
        _buflen -= 6;
      }
    };

    _this.flush = function() {

      if (_buflen > 0) {
        writeEncoded(_buffer << (6 - _buflen) );
        _buffer = 0;
        _buflen = 0;
      }

      if (_length % 3 != 0) {
        // padding
        var padlen = 3 - _length % 3;
        for (var i = 0; i < padlen; i += 1) {
          _base64 += '=';
        }
      }
    };

    _this.toString = function() {
      return _base64;
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // base64DecodeInputStream
  //---------------------------------------------------------------------

  var base64DecodeInputStream = function(str) {

    var _str = str;
    var _pos = 0;
    var _buffer = 0;
    var _buflen = 0;

    var _this = {};

    _this.read = function() {

      while (_buflen < 8) {

        if (_pos >= _str.length) {
          if (_buflen == 0) {
            return -1;
          }
          throw new Error('unexpected end of file./' + _buflen);
        }

        var c = _str.charAt(_pos);
        _pos += 1;

        if (c == '=') {
          _buflen = 0;
          return -1;
        } else if (c.match(/^\s$/) ) {
          // ignore if whitespace.
          continue;
        }

        _buffer = (_buffer << 6) | decode(c.charCodeAt(0) );
        _buflen += 6;
      }

      var n = (_buffer >>> (_buflen - 8) ) & 0xff;
      _buflen -= 8;
      return n;
    };

    var decode = function(c) {
      if (0x41 <= c && c <= 0x5a) {
        return c - 0x41;
      } else if (0x61 <= c && c <= 0x7a) {
        return c - 0x61 + 26;
      } else if (0x30 <= c && c <= 0x39) {
        return c - 0x30 + 52;
      } else if (c == 0x2b) {
        return 62;
      } else if (c == 0x2f) {
        return 63;
      } else {
        throw new Error('c:' + c);
      }
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // gifImage (B/W)
  //---------------------------------------------------------------------

  var gifImage = function(width, height) {

    var _width = width;
    var _height = height;
    var _data = new Array(width * height);

    var _this = {};

    _this.setPixel = function(x, y, pixel) {
      _data[y * _width + x] = pixel;
    };

    _this.write = function(out) {

      //---------------------------------
      // GIF Signature

      out.writeString('GIF87a');

      //---------------------------------
      // Screen Descriptor

      out.writeShort(_width);
      out.writeShort(_height);

      out.writeByte(0x80); // 2bit
      out.writeByte(0);
      out.writeByte(0);

      //---------------------------------
      // Global Color Map

      // black
      out.writeByte(0x00);
      out.writeByte(0x00);
      out.writeByte(0x00);

      // white
      out.writeByte(0xff);
      out.writeByte(0xff);
      out.writeByte(0xff);

      //---------------------------------
      // Image Descriptor

      out.writeString(',');
      out.writeShort(0);
      out.writeShort(0);
      out.writeShort(_width);
      out.writeShort(_height);
      out.writeByte(0);

      //---------------------------------
      // Local Color Map

      //---------------------------------
      // Raster Data

      var lzwMinCodeSize = 2;
      var raster = getLZWRaster(lzwMinCodeSize);

      out.writeByte(lzwMinCodeSize);

      var offset = 0;

      while (raster.length - offset > 255) {
        out.writeByte(255);
        out.writeBytes(raster, offset, 255);
        offset += 255;
      }

      out.writeByte(raster.length - offset);
      out.writeBytes(raster, offset, raster.length - offset);
      out.writeByte(0x00);

      //---------------------------------
      // GIF Terminator
      out.writeString(';');
    };

    var bitOutputStream = function(out) {

      var _out = out;
      var _bitLength = 0;
      var _bitBuffer = 0;

      var _this = {};

      _this.write = function(data, length) {

        if ( (data >>> length) != 0) {
          throw new Error('length over');
        }

        while (_bitLength + length >= 8) {
          _out.writeByte(0xff & ( (data << _bitLength) | _bitBuffer) );
          length -= (8 - _bitLength);
          data >>>= (8 - _bitLength);
          _bitBuffer = 0;
          _bitLength = 0;
        }

        _bitBuffer = (data << _bitLength) | _bitBuffer;
        _bitLength = _bitLength + length;
      };

      _this.flush = function() {
        if (_bitLength > 0) {
          _out.writeByte(_bitBuffer);
        }
      };

      return _this;
    };

    var getLZWRaster = function(lzwMinCodeSize) {

      var clearCode = 1 << lzwMinCodeSize;
      var endCode = (1 << lzwMinCodeSize) + 1;
      var bitLength = lzwMinCodeSize + 1;

      // Setup LZWTable
      var table = lzwTable();

      for (var i = 0; i < clearCode; i += 1) {
        table.add(String.fromCharCode(i) );
      }
      table.add(String.fromCharCode(clearCode) );
      table.add(String.fromCharCode(endCode) );

      var byteOut = byteArrayOutputStream();
      var bitOut = bitOutputStream(byteOut);

      // clear code
      bitOut.write(clearCode, bitLength);

      var dataIndex = 0;

      var s = String.fromCharCode(_data[dataIndex]);
      dataIndex += 1;

      while (dataIndex < _data.length) {

        var c = String.fromCharCode(_data[dataIndex]);
        dataIndex += 1;

        if (table.contains(s + c) ) {

          s = s + c;

        } else {

          bitOut.write(table.indexOf(s), bitLength);

          if (table.size() < 0xfff) {

            if (table.size() == (1 << bitLength) ) {
              bitLength += 1;
            }

            table.add(s + c);
          }

          s = c;
        }
      }

      bitOut.write(table.indexOf(s), bitLength);

      // end code
      bitOut.write(endCode, bitLength);

      bitOut.flush();

      return byteOut.toByteArray();
    };

    var lzwTable = function() {

      var _map = {};
      var _size = 0;

      var _this = {};

      _this.add = function(key) {
        if (_this.contains(key) ) {
          throw new Error('dup key:' + key);
        }
        _map[key] = _size;
        _size += 1;
      };

      _this.size = function() {
        return _size;
      };

      _this.indexOf = function(key) {
        return _map[key];
      };

      _this.contains = function(key) {
        return typeof _map[key] != 'undefined';
      };

      return _this;
    };

    return _this;
  };

  var createImgTag = function(width, height, getPixel, alt) {

    var gif = gifImage(width, height);
    for (var y = 0; y < height; y += 1) {
      for (var x = 0; x < width; x += 1) {
        gif.setPixel(x, y, getPixel(x, y) );
      }
    }

    var b = byteArrayOutputStream();
    gif.write(b);

    var base64 = base64EncodeOutputStream();
    var bytes = b.toByteArray();
    for (var i = 0; i < bytes.length; i += 1) {
      base64.writeByte(bytes[i]);
    }
    base64.flush();

    var img = '';
    img += '<img';
    img += '\u0020src="';
    img += 'data:image/gif;base64,';
    img += base64;
    img += '"';
    img += '\u0020width="';
    img += width;
    img += '"';
    img += '\u0020height="';
    img += height;
    img += '"';
    if (alt) {
      img += '\u0020alt="';
      img += alt;
      img += '"';
    }
    img += '/>';

    return img;
  };

  //---------------------------------------------------------------------
  // returns qrcode function.

  return qrcode;
}();

});
require.register("component-domify/index.js", function(exports, require, module){

/**
 * Expose `parse`.
 */

module.exports = parse;

/**
 * Wrap map from jquery.
 */

var map = {
  legend: [1, '<fieldset>', '</fieldset>'],
  tr: [2, '<table><tbody>', '</tbody></table>'],
  col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],
  _default: [0, '', '']
};

map.td =
map.th = [3, '<table><tbody><tr>', '</tr></tbody></table>'];

map.option =
map.optgroup = [1, '<select multiple="multiple">', '</select>'];

map.thead =
map.tbody =
map.colgroup =
map.caption =
map.tfoot = [1, '<table>', '</table>'];

map.text =
map.circle =
map.ellipse =
map.line =
map.path =
map.polygon =
map.polyline =
map.rect = [1, '<svg xmlns="http://www.w3.org/2000/svg" version="1.1">','</svg>'];

/**
 * Parse `html` and return the children.
 *
 * @param {String} html
 * @return {Array}
 * @api private
 */

function parse(html) {
  if ('string' != typeof html) throw new TypeError('String expected');
  
  // tag name
  var m = /<([\w:]+)/.exec(html);
  if (!m) return document.createTextNode(html);

  html = html.replace(/^\s+|\s+$/g, ''); // Remove leading/trailing whitespace

  var tag = m[1];

  // body support
  if (tag == 'body') {
    var el = document.createElement('html');
    el.innerHTML = html;
    return el.removeChild(el.lastChild);
  }

  // wrap map
  var wrap = map[tag] || map._default;
  var depth = wrap[0];
  var prefix = wrap[1];
  var suffix = wrap[2];
  var el = document.createElement('div');
  el.innerHTML = prefix + html + suffix;
  while (depth--) el = el.lastChild;

  // one element
  if (el.firstChild == el.lastChild) {
    return el.removeChild(el.firstChild);
  }

  // several elements
  var fragment = document.createDocumentFragment();
  while (el.firstChild) {
    fragment.appendChild(el.removeChild(el.firstChild));
  }

  return fragment;
}

});
require.register("segmentio-overlay/lib/index.js", function(exports, require, module){
var template = require('./index.html');
var domify = require('domify');
var emitter = require('emitter');
var showable = require('showable');
var classes = require('classes');

/**
 * Export `Overlay`
 */
module.exports = Overlay;


/**
 * Initialize a new `Overlay`.
 *
 * @param {Element} target The element to attach the overlay to
 * @api public
 */

function Overlay(target) {
  if(!(this instanceof Overlay)) return new Overlay(target);

  this.target = target || document.body;
  this.el = domify(template);
  this.el.addEventListener('click', this.handleClick.bind(this));

  var el = this.el;
  var parent = this.target;

  this.on('showing', function(){
    parent.appendChild(el);
  });

  this.on('hide', function(){
    parent.removeChild(el);
  });
}


/**
 * When the overlay is click, emit an event so that
 * the view that is using this overlay can choose
 * to close the overlay if they want
 *
 * @param {Event} e
 */
Overlay.prototype.handleClick = function(e){
  this.emit('click', e);
};


/**
 * Mixins
 */
emitter(Overlay.prototype);
showable(Overlay.prototype);
classes(Overlay.prototype);
});
require.register("timoxley-next-tick/index.js", function(exports, require, module){
"use strict"

if (typeof setImmediate == 'function') {
  module.exports = function(f){ setImmediate(f) }
}
// legacy node.js
else if (typeof process != 'undefined' && typeof process.nextTick == 'function') {
  module.exports = process.nextTick
}
// fallback for other environments / postMessage behaves badly on IE8
else if (typeof window == 'undefined' || window.ActiveXObject || !window.postMessage) {
  module.exports = function(f){ setTimeout(f) };
} else {
  var q = [];

  window.addEventListener('message', function(){
    var i = 0;
    while (i < q.length) {
      try { q[i++](); }
      catch (e) {
        q = q.slice(i);
        window.postMessage('tic!', '*');
        throw e;
      }
    }
    q.length = 0;
  }, true);

  module.exports = function(fn){
    if (!q.length) window.postMessage('tic!', '*');
    q.push(fn);
  }
}

});
require.register("yields-has-transitions/index.js", function(exports, require, module){
/**
 * Check if `el` or browser supports transitions.
 *
 * @param {Element} el
 * @return {Boolean}
 * @api public
 */

exports = module.exports = function(el){
  switch (arguments.length) {
    case 0: return bool;
    case 1: return bool
      ? transitions(el)
      : bool;
  }
};

/**
 * Check if the given `el` has transitions.
 *
 * @param {Element} el
 * @return {Boolean}
 * @api private
 */

function transitions(el, styl){
  if (el.transition) return true;
  styl = window.getComputedStyle(el);
  return !! parseFloat(styl.transitionDuration, 10);
}

/**
 * Style.
 */

var styl = document.body.style;

/**
 * Export support.
 */

var bool = 'transition' in styl
  || 'webkitTransition' in styl
  || 'MozTransition' in styl
  || 'msTransition' in styl;

});
require.register("component-event/index.js", function(exports, require, module){
var bind = window.addEventListener ? 'addEventListener' : 'attachEvent',
    unbind = window.removeEventListener ? 'removeEventListener' : 'detachEvent',
    prefix = bind !== 'addEventListener' ? 'on' : '';

/**
 * Bind `el` event `type` to `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.bind = function(el, type, fn, capture){
  el[bind](prefix + type, fn, capture || false);
  return fn;
};

/**
 * Unbind `el` event `type`'s callback `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.unbind = function(el, type, fn, capture){
  el[unbind](prefix + type, fn, capture || false);
  return fn;
};
});
require.register("ecarter-css-emitter/index.js", function(exports, require, module){
/**
 * Module Dependencies
 */

var events = require('event');

// CSS events

var watch = [
  'transitionend'
, 'webkitTransitionEnd'
, 'oTransitionEnd'
, 'MSTransitionEnd'
, 'animationend'
, 'webkitAnimationEnd'
, 'oAnimationEnd'
, 'MSAnimationEnd'
];

/**
 * Expose `CSSnext`
 */

module.exports = CssEmitter;

/**
 * Initialize a new `CssEmitter`
 *
 */

function CssEmitter(element){
  if (!(this instanceof CssEmitter)) return new CssEmitter(element);
  this.el = element;
}

/**
 * Bind CSS events.
 *
 * @api public
 */

CssEmitter.prototype.bind = function(fn){
  for (var i=0; i < watch.length; i++) {
    events.bind(this.el, watch[i], fn);
  }
  return this;
};

/**
 * Unbind CSS events
 * 
 * @api public
 */

CssEmitter.prototype.unbind = function(fn){
  for (var i=0; i < watch.length; i++) {
    events.unbind(this.el, watch[i], fn);
  }
  return this;
};

/**
 * Fire callback only once
 * 
 * @api public
 */

CssEmitter.prototype.once = function(fn){
  var self = this;
  function on(){
    self.unbind(on);
    fn.apply(self.el, arguments);
  }
  self.bind(on);
  return this;
};


});
require.register("component-once/index.js", function(exports, require, module){

/**
 * Identifier.
 */

var n = 0;

/**
 * Global.
 */

var global = (function(){ return this })();

/**
 * Make `fn` callable only once.
 *
 * @param {Function} fn
 * @return {Function}
 * @api public
 */

module.exports = function(fn) {
  var id = n++;
  var called;

  function once(){
    // no receiver
    if (this == global) {
      if (called) return;
      called = true;
      return fn.apply(this, arguments);
    }

    // receiver
    var key = '__called_' + id + '__';
    if (this[key]) return;
    this[key] = true;
    return fn.apply(this, arguments);
  }

  return once;
};

});
require.register("yields-after-transition/index.js", function(exports, require, module){

/**
 * dependencies
 */

var has = require('has-transitions')
  , emitter = require('css-emitter')
  , once = require('once');

/**
 * Transition support.
 */

var supported = has();

/**
 * Export `after`
 */

module.exports = after;

/**
 * Invoke the given `fn` after transitions
 *
 * It will be invoked only if the browser
 * supports transitions __and__
 * the element has transitions
 * set in `.style` or css.
 *
 * @param {Element} el
 * @param {Function} fn
 * @return {Function} fn
 * @api public
 */

function after(el, fn){
  if (!supported || !has(el)) return fn();
  emitter(el).bind(fn);
  return fn;
};

/**
 * Same as `after()` only the function is invoked once.
 *
 * @param {Element} el
 * @param {Function} fn
 * @return {Function}
 * @api public
 */

after.once = function(el, fn){
  var callback = once(fn);
  after(el, fn = function(){
    emitter(el).unbind(fn);
    callback();
  });
};

});
require.register("segmentio-showable/index.js", function(exports, require, module){
var after = require('after-transition').once;
var nextTick = require('next-tick');

/**
 * Hide the view
 */
function hide(fn){
  var self = this;

  if(this.hidden == null) {
    this.hidden = this.el.classList.contains('hidden');
  }

  if(this.hidden || this.animating) return;

  this.hidden = true;
  this.animating = true;

  after(self.el, function(){
    self.animating = false;
    self.emit('hide');
    if(fn) fn();
  });

  self.el.classList.add('hidden');
  this.emit('hiding');
  return this;
}

/**
 * Show the view. This waits until after any transitions
 * are finished. It also removed the hide class on the next
 * tick so that the transition actually paints.
 */
function show(fn){
  var self = this;

  if(this.hidden == null) {
    this.hidden = this.el.classList.contains('hidden');
  }

  if(this.hidden === false || this.animating) return;

  this.hidden = false;
  this.animating = true;

  this.emit('showing');

  after(self.el, function(){
    self.animating = false;
    self.emit('show');
    if(fn) fn();
  });

  this.el.offsetHeight;

  nextTick(function(){
    self.el.classList.remove('hidden');
  });

  return this;
}

/**
 * Mixin methods into the view
 *
 * @param {Emitter} obj
 */
module.exports = function(obj) {
  obj.hide = hide;
  obj.show = show;
  return obj;
};
});
require.register("component-indexof/index.js", function(exports, require, module){
module.exports = function(arr, obj){
  if (arr.indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
});
require.register("segmentio-on-escape/index.js", function(exports, require, module){

var bind = require('event').bind
  , indexOf = require('indexof');


/**
 * Expose `onEscape`.
 */

module.exports = exports = onEscape;


/**
 * Handlers.
 */

var fns = [];


/**
 * Escape binder.
 *
 * @param {Function} fn
 */

function onEscape (fn) {
  fns.push(fn);
}


/**
 * Bind a handler, for symmetry.
 */

exports.bind = onEscape;


/**
 * Unbind a handler.
 *
 * @param {Function} fn
 */

exports.unbind = function (fn) {
  var index = indexOf(fns, fn);
  if (index !== -1) fns.splice(index, 1);
};


/**
 * Bind to `document` once.
 */

bind(document, 'keydown', function (e) {
  if (27 !== e.keyCode) return;
  for (var i = 0, fn; fn = fns[i]; i++) fn(e);
});
});
require.register("jkroso-classes/index.js", function(exports, require, module){

module.exports = document.createElement('div').classList
  ? require('./modern')
  : require('./fallback')
});
require.register("jkroso-classes/fallback.js", function(exports, require, module){

var index = require('indexof')

exports.add = function(name, el){
	var arr = exports.array(el)
	if (index(arr, name) < 0) {
		arr.push(name)
		el.className = arr.join(' ')
	}
}

exports.remove = function(name, el){
	if (name instanceof RegExp) {
		return exports.removeMatching(name, el)
	}
	var arr = exports.array(el)
	var i = index(arr, name)
	if (i >= 0) {
		arr.splice(i, 1)
		el.className = arr.join(' ')
	}
}

exports.removeMatching = function(re, el){
	var arr = exports.array(el)
	for (var i = 0; i < arr.length;) {
		if (re.test(arr[i])) arr.splice(i, 1)
		else i++
	}
	el.className = arr.join(' ')
}

exports.toggle = function(name, el){
	if (exports.has(name, el)) {
		exports.remove(name, el)
	} else {
		exports.add(name, el)
	}
}

exports.array = function(el){
	return el.className.match(/([^\s]+)/g) || []
}

exports.has =
exports.contains = function(name, el){
	return index(exports.array(el), name) >= 0
}
});
require.register("jkroso-classes/modern.js", function(exports, require, module){

/**
 * Add class `name` if not already present.
 *
 * @param {String} name
 * @param {Element} el
 * @api public
 */

exports.add = function(name, el){
	el.classList.add(name)
}

/**
 * Remove `name` if present
 *
 * @param {String|RegExp} name
 * @param {Element} el
 * @api public
 */

exports.remove = function(name, el){
	if (name instanceof RegExp) {
		return exports.removeMatching(name, el)
	}
	el.classList.remove(name)
}

/**
 * Remove all classes matching `re`.
 *
 * @param {RegExp} re
 * @param {Element} el
 * @api public
 */

exports.removeMatching = function(re, el){
	var arr = exports.array(el)
	for (var i = 0; i < arr.length; i++) {
		if (re.test(arr[i])) el.classList.remove(arr[i])
	}
}

/**
 * Toggle class `name`.
 *
 * @param {String} name
 * @param {Element} el
 * @api public
 */

exports.toggle = function(name, el){
	el.classList.toggle(name)
}

/**
 * Return an array of classes.
 *
 * @param {Element} el
 * @return {Array}
 * @api public
 */

exports.array = function(el){
	return el.className.match(/([^\s]+)/g) || []
}

/**
 * Check if class `name` is present.
 *
 * @param {String} name
 * @param {Element} el
 * @api public
 */

exports.has =
exports.contains = function(name, el){
	return el.classList.contains(name)
}
});
require.register("ianstormtaylor-classes/index.js", function(exports, require, module){

var classes = require('classes');


/**
 * Expose `mixin`.
 */

module.exports = exports = mixin;


/**
 * Mixin the classes methods.
 *
 * @param {Object} object
 * @return {Object}
 */

function mixin (obj) {
  for (var method in exports) obj[method] = exports[method];
  return obj;
}


/**
 * Add a class.
 *
 * @param {String} name
 * @return {Object}
 */

exports.addClass = function (name) {
  classes.add(name, this.el);
  return this;
};


/**
 * Remove a class.
 *
 * @param {String} name
 * @return {Object}
 */

exports.removeClass = function (name) {
  classes.remove(name, this.el);
  return this;
};


/**
 * Has a class?
 *
 * @param {String} name
 * @return {Boolean}
 */

exports.hasClass = function (name) {
  return classes.has(name, this.el);
};


/**
 * Toggle a class.
 *
 * @param {String} name
 * @return {Object}
 */

exports.toggleClass = function (name) {
  classes.toggle(name, this.el);
  return this;
};

});
require.register("segmentio-modal/lib/index.js", function(exports, require, module){
var domify = require('domify');
var Emitter = require('emitter');
var overlay = require('overlay');
var onEscape = require('on-escape');
var template = require('./index.html');
var Showable = require('showable');
var Classes = require('classes');

/**
 * Expose `Modal`.
 */

module.exports = Modal;


/**
 * Initialize a new `Modal`.
 *
 * @param {Element} el The element to put into a modal
 */

function Modal (el) {
  if (!(this instanceof Modal)) return new Modal(el);
  this.el = domify(template);
  this.el.appendChild(el);
  this._overlay = overlay();

  var el = this.el;

  this.on('showing', function(){
    document.body.appendChild(el);
  });

  this.on('hide', function(){
    document.body.removeChild(el);
  });
}


/**
 * Mixin emitter.
 */

Emitter(Modal.prototype);
Showable(Modal.prototype);
Classes(Modal.prototype);


/**
 * Set the transition in/out effect
 *
 * @param {String} type
 *
 * @return {Modal}
 */

Modal.prototype.effect = function(type) {
  this.el.setAttribute('effect', type);
  return this;
};


/**
 * Add an overlay
 *
 * @param {Object} opts
 *
 * @return {Modal}
 */

Modal.prototype.overlay = function(){
  var self = this;
  this.on('showing', function(){
    self._overlay.show();
  });
  this.on('hiding', function(){
    self._overlay.hide();
  });
  return this;
};


/**
 * Make the modal closeable.
 *
 * @return {Modal}
 */

Modal.prototype.closeable =
Modal.prototype.closable = function () {
  var self = this;

  function hide(){
    self.hide();
  }

  this._overlay.on('click', hide);
  onEscape(hide);
  return this;
};
});
require.register("btknorr-ejs/ejs.js", function(exports, require, module){
module.exports = (function(){

// CommonJS require()

function require(p){
    if ('fs' == p) return {};
    var path = require.resolve(p)
      , mod = require.modules[path];
    if (!mod) throw new Error('failed to require "' + p + '"');
    if (!mod.exports) {
      mod.exports = {};
      mod.call(mod.exports, mod, mod.exports, require.relative(path));
    }
    return mod.exports;
  }

require.modules = {};

require.resolve = function (path){
    var orig = path
      , reg = path + '.js'
      , index = path + '/index.js';
    return require.modules[reg] && reg
      || require.modules[index] && index
      || orig;
  };

require.register = function (path, fn){
    require.modules[path] = fn;
  };

require.relative = function (parent) {
    return function(p){
      if ('.' != p.substr(0, 1)) return require(p);
      
      var path = parent.split('/')
        , segs = p.split('/');
      path.pop();
      
      for (var i = 0; i < segs.length; i++) {
        var seg = segs[i];
        if ('..' == seg) path.pop();
        else if ('.' != seg) path.push(seg);
      }

      return require(path.join('/'));
    };
  };


require.register("ejs.js", function(module, exports, require){

/*!
 * EJS
 * Copyright(c) 2012 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var utils = require('./utils')
  , fs = require('fs');

/**
 * Library version.
 */

exports.version = '0.7.2';

/**
 * Filters.
 * 
 * @type Object
 */

var filters = exports.filters = require('./filters');

/**
 * Intermediate js cache.
 * 
 * @type Object
 */

var cache = {};

/**
 * Clear intermediate js cache.
 *
 * @api public
 */

exports.clearCache = function(){
  cache = {};
};

/**
 * Translate filtered code into function calls.
 *
 * @param {String} js
 * @return {String}
 * @api private
 */

function filtered(js) {
  return js.substr(1).split('|').reduce(function(js, filter){
    var parts = filter.split(':')
      , name = parts.shift()
      , args = parts.shift() || '';
    if (args) args = ', ' + args;
    return 'filters.' + name + '(' + js + args + ')';
  });
};

/**
 * Re-throw the given `err` in context to the
 * `str` of ejs, `filename`, and `lineno`.
 *
 * @param {Error} err
 * @param {String} str
 * @param {String} filename
 * @param {String} lineno
 * @api private
 */

function rethrow(err, str, filename, lineno){
  var lines = str.split('\n')
    , start = Math.max(lineno - 3, 0)
    , end = Math.min(lines.length, lineno + 3);

  // Error context
  var context = lines.slice(start, end).map(function(line, i){
    var curr = i + start + 1;
    return (curr == lineno ? ' >> ' : '    ')
      + curr
      + '| '
      + line;
  }).join('\n');

  // Alter exception message
  err.path = filename;
  err.message = (filename || 'ejs') + ':' 
    + lineno + '\n' 
    + context + '\n\n' 
    + err.message;
  
  throw err;
}

/**
 * Parse the given `str` of ejs, returning the function body.
 *
 * @param {String} str
 * @return {String}
 * @api public
 */

var parse = exports.parse = function(str, options){
  var options = options || {}
    , open = options.open || exports.open || '<%'
    , close = options.close || exports.close || '%>';

  var buf = [
      "var buf = [];"
    , "\nwith (locals) {"
    , "\n  buf.push('"
  ];
  
  var lineno = 1;

  var consumeEOL = false;
  for (var i = 0, len = str.length; i < len; ++i) {
    if (str.slice(i, open.length + i) == open) {
      i += open.length
  
      var prefix, postfix, line = '__stack.lineno=' + lineno;
      switch (str.substr(i, 1)) {
        case '=':
          prefix = "', escape((" + line + ', ';
          postfix = ")), '";
          ++i;
          break;
        case '-':
          prefix = "', (" + line + ', ';
          postfix = "), '";
          ++i;
          break;
        default:
          prefix = "');" + line + ';';
          postfix = "; buf.push('";
      }

      var end = str.indexOf(close, i)
        , js = str.substring(i, end)
        , start = i
        , n = 0;
        
      if ('-' == js[js.length-1]){
        js = js.substring(0, js.length - 2);
        consumeEOL = true;
      }
        
      while (~(n = js.indexOf("\n", n))) n++, lineno++;
      if (js.substr(0, 1) == ':') js = filtered(js);
      buf.push(prefix, js, postfix);
      i += end - start + close.length - 1;

    } else if (str.substr(i, 1) == "\\") {
      buf.push("\\\\");
    } else if (str.substr(i, 1) == "'") {
      buf.push("\\'");
    } else if (str.substr(i, 1) == "\r") {
      buf.push(" ");
    } else if (str.substr(i, 1) == "\n") {
      if (consumeEOL) {
        consumeEOL = false;
      } else {
        buf.push("\\n");
        lineno++;
      }
    } else {
      buf.push(str.substr(i, 1));
    }
  }

  buf.push("');\n}\nreturn buf.join('');");
  return buf.join('');
};

/**
 * Compile the given `str` of ejs into a `Function`.
 *
 * @param {String} str
 * @param {Object} options
 * @return {Function}
 * @api public
 */

var compile = exports.compile = function(str, options){
  options = options || {};
  
  var input = JSON.stringify(str)
    , filename = options.filename
        ? JSON.stringify(options.filename)
        : 'undefined';
  
  // Adds the fancy stack trace meta info
  str = [
    'var __stack = { lineno: 1, input: ' + input + ', filename: ' + filename + ' };',
    rethrow.toString(),
    'try {',
    exports.parse(str, options),
    '} catch (err) {',
    '  rethrow(err, __stack.input, __stack.filename, __stack.lineno);',
    '}'
  ].join("\n");
  
  if (options.debug) console.log(str);
  var fn = new Function('locals, filters, escape', str);
  return function(locals){
    return fn.call(this, locals, filters, utils.escape);
  }
};

/**
 * Render the given `str` of ejs.
 *
 * Options:
 *
 *   - `locals`          Local variables object
 *   - `cache`           Compiled functions are cached, requires `filename`
 *   - `filename`        Used by `cache` to key caches
 *   - `scope`           Function execution context
 *   - `debug`           Output generated function body
 *   - `open`            Open tag, defaulting to "<%"
 *   - `close`           Closing tag, defaulting to "%>"
 *
 * @param {String} str
 * @param {Object} options
 * @return {String}
 * @api public
 */

exports.render = function(str, options){
  var fn
    , options = options || {};

  if (options.cache) {
    if (options.filename) {
      fn = cache[options.filename] || (cache[options.filename] = compile(str, options));
    } else {
      throw new Error('"cache" option requires "filename".');
    }
  } else {
    fn = compile(str, options);
  }

  options.__proto__ = options.locals;
  return fn.call(options.scope, options);
};

/**
 * Render an EJS file at the given `path` and callback `fn(err, str)`.
 *
 * @param {String} path
 * @param {Object|Function} options or callback
 * @param {Function} fn
 * @api public
 */

exports.renderFile = function(path, options, fn){
  var key = path + ':string';

  if ('function' == typeof options) {
    fn = options, options = {};
  }

  options.filename = path;

  try {
    var str = options.cache
      ? cache[key] || (cache[key] = fs.readFileSync(path, 'utf8'))
      : fs.readFileSync(path, 'utf8');

    fn(null, exports.render(str, options));
  } catch (err) {
    fn(err);
  }
};

// express support

exports.__express = exports.renderFile;

/**
 * Expose to require().
 */

if (require.extensions) {
  require.extensions['.ejs'] = function(module, filename) {
    source = require('fs').readFileSync(filename, 'utf-8');
    module._compile(compile(source, {}), filename);
  };
} else if (require.registerExtension) {
  require.registerExtension('.ejs', function(src) {
    return compile(src, {});
  });
}

}); // module: ejs.js

require.register("filters.js", function(module, exports, require){

/*!
 * EJS - Filters
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * First element of the target `obj`.
 */

exports.first = function(obj) {
  return obj[0];
};

/**
 * Last element of the target `obj`.
 */

exports.last = function(obj) {
  return obj[obj.length - 1];
};

/**
 * Capitalize the first letter of the target `str`.
 */

exports.capitalize = function(str){
  str = String(str);
  return str[0].toUpperCase() + str.substr(1, str.length);
};

/**
 * Downcase the target `str`.
 */

exports.downcase = function(str){
  return String(str).toLowerCase();
};

/**
 * Uppercase the target `str`.
 */

exports.upcase = function(str){
  return String(str).toUpperCase();
};

/**
 * Sort the target `obj`.
 */

exports.sort = function(obj){
  return Object.create(obj).sort();
};

/**
 * Sort the target `obj` by the given `prop` ascending.
 */

exports.sort_by = function(obj, prop){
  return Object.create(obj).sort(function(a, b){
    a = a[prop], b = b[prop];
    if (a > b) return 1;
    if (a < b) return -1;
    return 0;
  });
};

/**
 * Size or length of the target `obj`.
 */

exports.size = exports.length = function(obj) {
  return obj.length;
};

/**
 * Add `a` and `b`.
 */

exports.plus = function(a, b){
  return Number(a) + Number(b);
};

/**
 * Subtract `b` from `a`.
 */

exports.minus = function(a, b){
  return Number(a) - Number(b);
};

/**
 * Multiply `a` by `b`.
 */

exports.times = function(a, b){
  return Number(a) * Number(b);
};

/**
 * Divide `a` by `b`.
 */

exports.divided_by = function(a, b){
  return Number(a) / Number(b);
};

/**
 * Join `obj` with the given `str`.
 */

exports.join = function(obj, str){
  return obj.join(str || ', ');
};

/**
 * Truncate `str` to `len`.
 */

exports.truncate = function(str, len){
  str = String(str);
  return str.substr(0, len);
};

/**
 * Truncate `str` to `n` words.
 */

exports.truncate_words = function(str, n){
  var str = String(str)
    , words = str.split(/ +/);
  return words.slice(0, n).join(' ');
};

/**
 * Replace `pattern` with `substitution` in `str`.
 */

exports.replace = function(str, pattern, substitution){
  return String(str).replace(pattern, substitution || '');
};

/**
 * Prepend `val` to `obj`.
 */

exports.prepend = function(obj, val){
  return Array.isArray(obj)
    ? [val].concat(obj)
    : val + obj;
};

/**
 * Append `val` to `obj`.
 */

exports.append = function(obj, val){
  return Array.isArray(obj)
    ? obj.concat(val)
    : obj + val;
};

/**
 * Map the given `prop`.
 */

exports.map = function(arr, prop){
  return arr.map(function(obj){
    return obj[prop];
  });
};

/**
 * Reverse the given `obj`.
 */

exports.reverse = function(obj){
  return Array.isArray(obj)
    ? obj.reverse()
    : String(obj).split('').reverse().join('');
};

/**
 * Get `prop` of the given `obj`.
 */

exports.get = function(obj, prop){
  return obj[prop];
};

/**
 * Packs the given `obj` into json string
 */
exports.json = function(obj){
  return JSON.stringify(obj);
};
}); // module: filters.js

require.register("utils.js", function(module, exports, require){

/*!
 * EJS
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Escape the given string of `html`.
 *
 * @param {String} html
 * @return {String}
 * @api private
 */

exports.escape = function(html){
  return String(html)
    .replace(/&(?!\w+;)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};
 
}); // module: utils.js

 return require("ejs");
})();
});
require.register("yields-k-sequence/index.js", function(exports, require, module){

/**
 * dependencies
 */

var keycode = require('keycode');

/**
 * Export `sequence`
 */

module.exports = sequence;

/**
 * Create sequence fn with `keys`.
 * optional `ms` which defaults
 * to `500ms` and `fn`.
 *
 * Example:
 *
 *      seq = sequence('a b c', fn);
 *      el.addEventListener('keydown', seq);
 *
 * @param {String} keys
 * @param {Number} ms
 * @param {Function} fn
 * @return {Function}
 * @api public
 */

function sequence(keys, ms, fn){
  var codes = keys.split(/ +/).map(keycode)
    , clen = codes.length
    , seq = []
    , i = 0
    , prev;

  if (2 == arguments.length) {
    fn = ms;
    ms = 500;
  }

  return function(e){
    var code = codes[i++];
    if (42 != code && code != e.which) return reset();
    if (prev && new Date - prev > ms) return reset();
    var len = seq.push(e.which);
    prev = new Date;
    if (len != clen) return;
    reset();
    fn(e);
  };

  function reset(){
    prev = null;
    seq = [];
    i = 0;
  }
};

});
require.register("yields-keycode/index.js", function(exports, require, module){

/**
 * map
 */

var map = {
    backspace: 8
  , command: 91
  , tab: 9
  , clear: 12
  , enter: 13
  , shift: 16
  , ctrl: 17
  , alt: 18
  , capslock: 20
  , escape: 27
  , esc: 27
  , space: 32
  , pageup: 33
  , pagedown: 34
  , end: 35
  , home: 36
  , left: 37
  , up: 38
  , right: 39
  , down: 40
  , del: 46
  , comma: 188
  , f1: 112
  , f2: 113
  , f3: 114
  , f4: 115
  , f5: 116
  , f6: 117
  , f7: 118
  , f8: 119
  , f9: 120
  , f10: 121
  , f11: 122
  , f12: 123
  , ',': 188
  , '.': 190
  , '/': 191
  , '`': 192
  , '-': 189
  , '=': 187
  , ';': 186
  , '[': 219
  , '\\': 220
  , ']': 221
  , '\'': 222
};

/**
 * find a keycode.
 *
 * @param {String} name
 * @return {Number}
 */

module.exports = function(name){
  return map[name.toLowerCase()] || name.toUpperCase().charCodeAt(0);
};

});
require.register("component-bind/index.js", function(exports, require, module){
/**
 * Slice reference.
 */

var slice = [].slice;

/**
 * Bind `obj` to `fn`.
 *
 * @param {Object} obj
 * @param {Function|String} fn or string
 * @return {Function}
 * @api public
 */

module.exports = function(obj, fn){
  if ('string' == typeof fn) fn = obj[fn];
  if ('function' != typeof fn) throw new Error('bind() requires a function');
  var args = slice.call(arguments, 2);
  return function(){
    return fn.apply(obj, args.concat(slice.call(arguments)));
  }
};

});
require.register("component-os/index.js", function(exports, require, module){


module.exports = os();

function os() {
  var ua = navigator.userAgent;
  if (/mac/i.test(ua)) return 'mac';
  if (/win/i.test(ua)) return 'windows';
  if (/linux/i.test(ua)) return 'linux';
}

});
require.register("yields-k/lib/index.js", function(exports, require, module){

/**
 * dependencies.
 */

var event = require('event')
  , proto = require('./proto')
  , bind = require('bind');

/**
 * Create a new dispatcher with `el`.
 *
 * example:
 *
 *      var k = require('k')(window);
 *      k('shift + tab', function(){});
 *
 * @param {Element} el
 * @return {Function}
 * @api public
 */

module.exports = function(el){
  function k(e, fn){ k.handle(e, fn) };
  k._handle = bind(k, proto.handle);
  k._clear = bind(k, proto.clear);
  event.bind(el, 'keydown', k._handle, false);
  event.bind(el, 'keyup', k._handle, false);
  event.bind(el, 'keyup', k._clear, false);
  event.bind(el, 'focus', k._clear, false);
  for (var p in proto) k[p] = proto[p];
  k.listeners = [];
  k.el = el;
  return k;
};

});
require.register("yields-k/lib/proto.js", function(exports, require, module){

/**
 * dependencies
 */

var sequence = require('k-sequence')
  , keycode = require('keycode')
  , event = require('event')
  , os = require('os');

/**
 * modifiers.
 */

var modifiers = {
  224: 'command',
  91: 'command',
  93: 'command',
  16: 'shift',
  17: 'ctrl',
  18: 'alt'
};

/**
 * Super key.
 * (must use subscript vs. dot notation to avoid issues with older browsers)
 */

exports[ 'super' ] = 'mac' == os
  ? 'command'
  : 'ctrl';

/**
 * Handle the given `KeyboardEvent` or bind
 * a new `keys` handler.
 *
 * @param {String|KeyboardEvent} e
 * @param {Function} fn
 * @api private
 */

exports.handle = function(e, fn){
  var ignore = this.ignore;
  var event = e.type;
  var code = e.which;

  // bind
  if (fn) return this.bind(e, fn);

  // modifiers
  var mod = modifiers[code];
  if ('keydown' == event && mod) {
    this[ 'super' ] = exports[ 'super' ] == mod;
    this[mod] = true;
    this.modifiers = true;
    return;
  }

  // ignore
  if (ignore && ignore(e)) return;

  // listeners
  var all = this.listeners;

  // match
  for (var i = 0; i < all.length; ++i) {
    var invoke = true;
    var obj = all[i];
    var seq = obj.seq;
    var mods = obj.mods;
    var fn = seq || obj.fn;

    if (!seq && code != obj.code) continue;
    if (event != obj.event) continue;

    for (var j = 0; j < mods.length; ++j) {
      if (!this[mods[j]]) {
        invoke = null;
        break;
      }
    }

    invoke && fn(e);
  }
};

/**
 * Destroy this `k` dispatcher instance.
 *
 * @api public
 */

exports.destroy = function(){
  event.unbind(this.el, 'keydown', this._handle);
  event.unbind(this.el, 'keyup', this._handle);
  event.unbind(this.el, 'keyup', this._clear);
  event.unbind(this.el, 'focus', this._clear);
  this.listeners = [];
};

/**
 * Unbind the given `keys` with optional `fn`.
 *
 * example:
 *
 *      k.unbind('enter, tab', myListener); // unbind `myListener` from `enter, tab` keys
 *      k.unbind('enter, tab'); // unbind all `enter, tab` listeners
 *      k.unbind(); // unbind all listeners
 *
 * @param {String} keys
 * @param {Function} fn
 * @return {k}
 * @api public
 */

exports.unbind = function(keys, fn){
  var fns = this.listeners
    , len = fns.length
    , all;

  // unbind all
  if (0 == arguments.length) {
    this.listeners = [];
    return this;
  }

  // parse
  all = parseKeys(keys);

  // unbind
  for (var i = 0; i < all.length; ++i) {
    for (var j = 0, obj; j < len; ++j) {
      obj = fns[j];
      if (!obj) continue;
      if (fn && obj.fn != fn) continue;
      if (obj.key != all[i].key) continue;
      if (!matches(obj, all[i])) continue;
      fns.splice(j--, 1);
    }
  }

  return this;
};

/**
 * Bind the given `keys` to `fn` with optional `event`
 *
 * example:
 *
 *      k.bind('shift + tab, ctrl + a', function(e){});
 *
 * @param {String} event
 * @param {String} keys
 * @param {Function} fn
 * @return {k}
 * @api public
 */

exports.bind = function(event, keys, fn){
  var fns = this.listeners
    , len
    , all;

  if (2 == arguments.length) {
    fn = keys;
    keys = event;
    event = 'keydown';
  }

  all = parseKeys(keys);
  len = all.length;

  for (var i = 0; i < len; ++i) {
    var obj = all[i];
    obj.seq = obj.seq && sequence(obj.key, fn);
    obj.event = event;
    obj.fn = fn;
    fns.push(obj);
  }

  return this;
};

/**
 * Bind keyup with `keys` and `fn`.
 *
 * @param {String} keys
 * @param {Function} fn
 * @return {k}
 * @api public
 */

exports.up = function(keys, fn){
  return this.bind('keyup', keys, fn);
};

/**
 * Bind keydown with `keys` and `fn`.
 *
 * @param {String} keys
 * @param {Function} fn
 * @return {k}
 * @api public
 */

exports.down = function(keys, fn){
  return this.bind('keydown', keys, fn);
};

/**
 * Clear all modifiers on `keyup`.
 *
 * @api private
 */

exports.clear = function(e){
  var code = e.keyCode || e.which;
  if (!(code in modifiers)) return;
  this[modifiers[code]] = null;
  this.modifiers = this.command
    || this.shift
    || this.ctrl
    || this.alt;
};

/**
 * Ignore all input elements by default.
 *
 * @param {Event} e
 * @return {Boolean}
 * @api private
 */

exports.ignore = function(e){
  var el = e.target || e.srcElement;
  var name = el.tagName.toLowerCase();
  return 'textarea' == name
    || 'select' == name
    || 'input' == name;
};

/**
 * Parse the given `keys`.
 *
 * @param {String} keys
 * @return {Array}
 * @api private
 */

function parseKeys(keys){
  keys = keys.replace('super', exports[ 'super' ]);

  var all = ',' != keys
    ? keys.split(/ *, */)
    : [','];

  var ret = [];
  for (var i = 0; i < all.length; ++i) {
    if ('' == all[i]) continue;
    var mods = all[i].split(/ *\+ */);
    var key = mods.pop() || ',';

    ret.push({
      seq: !!~ key.indexOf(' '),
      code: keycode(key),
      mods: mods,
      key: key
    });
  }

  return ret;
}

/**
 * Check if the given `a` matches `b`.
 *
 * @param {Object} a
 * @param {Object} b
 * @return {Boolean}
 * @api private
 */

function matches(a, b){
  return 0 == b.mods.length || eql(a, b);
}

/**
 * Shallow eql util.
 *
 * TODO: move to yields/eql
 *
 * @param {Array} a
 * @param {Array} b
 * @return {Boolean}
 * @api private
 */

function eql(a, b){
  a = a.mods.sort().toString();
  b = b.mods.sort().toString();
  return a == b;
}

});
require.register("yields-currency/index.js", function(exports, require, module){

/**
 * Format / Unformat the given `n` to currency.
 *
 * @param {Number|String} n
 * @return {String|Number}
 * @api public
 */

module.exports = function(n){
  switch (typeof n) {
    case 'string': return unformat(n);
    case 'number': return format(n);
  }
};

/**
 * Format the given `n` to currency.
 *
 * Example:
 *
 *      format(1000);
 *      // => 1,000.00
 *
 * @param {Number} n
 * @return {String}
 * @api private
 */

function format(n){
  n = n.toFixed(2).toString();
  var parts = n.split('.');
  return parts[0]
    .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
    + '.'
    + parts[1]
}

/**
 * Unformat the given `str`.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function unformat(str){
  return Number(str.replace(',', ''));
}

});
require.register("yields-load-image/index.js", function(exports, require, module){

/**
 * Preload the given `src` with the given `fn`
 *
 * @param {String} src
 * @param {Function} fn
 * @return {Image}
 */

module.exports = function(src, fn){
  var img = new Image();
  img.onload = function(){ fn(null, img) };
  img.onerror = fn;
  img.src = src;
  return img;
};

});
require.register("stagas-audio-process/index.js", function(exports, require, module){

/**
 * Create a stereo script processor node `fn`
 * for `context` with sample `length`.
 *
 * @param {AudioContext} context
 * @param {Number} length
 * @param {Function} fn
 * @return {AudioNode}
 */

module.exports = function(context, length, fn){
  var node = context.createScriptProcessor(length, 1, 2);
  node.onaudioprocess = onaudioprocess;

  return node;

  function onaudioprocess(ev){
    fn(
      ev.outputBuffer.getChannelData(0)
    , ev.outputBuffer.getChannelData(1)
    , ev.outputBuffer.length
    , ev
    );
  }
};

});
require.register("stagas-webaudio-dsp/index.js", function(exports, require, module){

/**
 * webaudio-dsp
 */

var emitter = require('emitter');
var process = require('audio-process');

exports = module.exports = function(bufferSize, fn){
  var audio = new AudioContext({ sampleRate: 44100, latencyHint: 'playback' });

  document.body.onmousedown = () => {
    audio.resume()
  }

  var sampleRate = audio.sampleRate;

  var empty = new Float32Array(bufferSize);

  var node = process(audio, bufferSize, function(L, R, len){
    if (!context.playing) {
      L.set(empty, 0);
      R.set(empty, 0);
      return;
    }

    fn(L, R, len);
  });

  // ugly, but keeps the event loop running
  // otherwise audio freezes
  setTimeout(function(){
    alert('should not fire');
  }, 31536000000);

  var context = emitter({
    audio: audio,
    node: node,
    play: function(){
      node.connect(audio.destination);
      this.playing = true;
      this.emit('play');
    },
    pause: function(){
      this.playing = false;
      this.emit('pause');
    },
    stop: function(){
      this.playing = false;
      this.emit('stop');
    },
    playing: false
  });

  return context;
};

});
require.register("stagas-webaudio-dsp/test/stagas-unexpected_token.js", function(exports, require, module){

var transpose = 0;

var sr = 44100;

var bassline = [
  [ 7, 7, 7, 12, 10, 10, 10, 15 ],
  [ 7, 7, 7, 15, 15, 17, 10, 29 ],
  [ 7, 7, 7, 24, 10, 10, 10, 19 ],
  [ 7, 7, 7, 15, 29, 24, 15, 10 ]
];

var melody = [
  7, 15, 7, 15,
  7, 15, 10, 15,
  10, 12, 24, 19,
  7, 12, 10, 19
];

var chords = [ [ 7, 12, 17, 10 ], [ 10, 15, 19, 24 ] ];

var lp_a = Moog();
var lp_b = Moog();
var lp_c = Moog();
var fastlp_a = FastLP(240);
var fastlp_b = FastLP(30);
var fasthp_a = FastHP(1.7);
var fasthp_b = FastHP(1.5);
var fasthp_c = FastHP(0.5);

module.exports = function(t){
  var lfo_a = sin(2, t);
  var lfo_b = sin(1/32, t);
  var lfo_c = sin(1/128, t);
  var cutoff =
    300
  + (lfo_a * 60)
  + (lfo_b * 300)
  + (lfo_c * 250)
  ;

  // bassline arpeggio
  var bm = bassline[(t / 2 | 0) % bassline.length];
  var bn = note(bm[(t * 4 | 0) % bm.length], 0);

  // bass synth
  var bass_osc =
      saw(bn, t) * 1.9
    + sqr(bn/2, t) * 1
    + sin(bn/2, t) * 2.2
    + sqr(bn*3, t) * 3
  ;

  var bass =
    ( // vcf
      lp_a(1050 + (lfo_b * 140), 0 + (sin(1/2, t + 3/4) * 0.2),
perc(bass_osc/3, 48, t % (1/8), t) * 1)
    )
  ;

  // melody arpeggio
  var mn = note(
    melody[(t * 3 | 0) % melody.length],
    2 - (t * 3 | 0) % 4
  );

  var synth_osc =
    saw(mn, t+1)
  + sqr(mn*2.02, t) * 0.4
  + sqr(mn*3, t+2)
  ;

  var synth_wave =
    ( // vcf
      lp_b(1800 + (lfo_a * 400), 0.1 + (sin(1/8, t + (1/3)) * 0.1),
        perc(synth_osc, 1.6, t % (4), t) * 1.7
      )
    ) * 1.8
  ;

  var synth_degrade = synth_wave * sin(note(5, 2), t);

  var synth = // effect dry / wet mix
    0.4 * synth_wave
  + 0.1 * synth_degrade
  ;

  var p = chords[(t / 4 | 0) % chords.length];

  var pad_osc =
    5.1 * saw(note(p[0], 1), t)
  + 3.9 * saw(note(p[1], 2), t)
  + 4.0 * saw(note(p[2], 1), t)
  + 3.0 * sqr(note(p[3], 0), t)
  + noise() * 0.7
  ;

  var pad =
    ( 1.0 - ((sin(2, t) * 0.28) + 0.5) ) * // vca
    fasthp_c(lp_c(1100 + (lfo_a * 150), 0.05, pad_osc * 0.03))
  ;

  var kick_osc =
    clip(0.37, sin(note(7,-1), t)) * 2
  + clip(0.07, saw(note(7.03,-1), t * 0.2)) * 4.00
  ;

  var kick =
    saw(2, t) * 0.054 // click
  + fastlp_a( // vcf
      perc(clip(0.6, kick_osc), 54, t % (1/2), t)
    ) * 2
  ;

  var snare_osc =
    sqr(note(17, 0), t+3) * 0.156
  + noise() * 0.73
  ;

  var snare = // vcf
    fastlp_b(perc(snare_osc, 119 - (t % 2 > 1 ? 14 : 0), (t + 1/2) % (1), t) * 0.6)
  ;

  var hihat_osc =
    saw(note(15,9), t) * 0.4
  + noise()
  ;

  var hihat =
    fasthp_a(perc(hihat_osc, 266 - ( (t + 2/4) % (1/2) > 1/4 ? 160 : 0), t % (1/4), t))
  ;

  var shaker_osc =
    noise()
  ;

  var shaker =
    fasthp_b(perc_b(shaker_osc, 230 - ( (t + 2/4) % (1/2) > 1/4 ? 80 : 0), t % 1/8, t))
  ;

  // mixer
  return 0.4 * ( // gain
    0.77 * clip(0.65, bass)
  + 0.018 * synth
  + 0.66 * pad
  + 3.6 * kick
  + 12.0 * clip(0.17, snare)
  + 0.21 * hihat
  + 0.72 * shaker
  );
};

function clip(n, x){
  return x > n
    ? n
    : x < -n
    ? -n
    : x
  ;
}

function sin(x, t){
  return Math.sin(2 * Math.PI * t * x);
}

function saw(x, t){
  return 1-2 * (t % (1/x)) * x;
}

function sqr(x, t){
  return sin(x, t) > 0 ? 1 : -1
}

function noise(){
  return Math.random() * 2 - 1;
}

function perc(wave, decay, o, t){
  var env = Math.max(0, 0.889 - (o * decay) / ((o * decay) + 1));
  return wave * env;
}

function perc_b(wave, decay, o, t){
  var env = Math.min(0, 0.950 - (o * decay) / ((o * decay) + 1));
  return wave * env;
}

function FastLP(n){
  var value = 0;
  return function(x){
    return value += (x - value) / n;
  }
}

function FastHP(n){
  var value = 0;
  return function(x){
    return value += x - value * n;
  }
}

function Moog(){
  var y1, y2, y3, y4, oldx, oldy1, oldy2, oldy3;

  y1 = y2 = y3 = y4 = oldx = oldy1 = oldy2 = oldy3 = 0;

  var p, k, t1, t2, r, x;

  return function(cutoff, res, input){
    cutoff = 2 * cutoff / 44100;
    p = cutoff * (1.8 - (0.8 * cutoff));
    k = 2 * Math.sin(cutoff * Math.PI * 0.5) - 1;
    t1 = (1 - p) * 1.386249;
    t2 = 12 + t1 * t1;
    r = res * (t2 + 6 * t1) / (t2 - 6 * t1);

    x = input - r * y4;

    // four cascaded one-pole filters (bilinear transform)
    y1 =  x * p + oldx  * p - k * y1;
    y2 = y1 * p + oldy1 * p - k * y2;
    y3 = y2 * p + oldy2 * p - k * y3;
    y4 = y3 * p + oldy3 * p - k * y4;

    // clipper band limited sigmoid
    y4 -= (y4 * y4 * y4) / 6;

    oldx = x; oldy1 = y1; oldy2 = y2; oldy3 = y3;

    return y4;
  };
}

// gets note `n` frequency of `octave`, base C-0
function note(n, octave){
  n += transpose;
  return Math.pow(2, (n - 33 + (12 * (octave || 0))) / 12) * 440;
}

});
require.register("component-raf/index.js", function(exports, require, module){

module.exports = window.requestAnimationFrame
  || window.webkitRequestAnimationFrame
  || window.mozRequestAnimationFrame
  || window.oRequestAnimationFrame
  || window.msRequestAnimationFrame
  || fallback;

var prev = new Date().getTime();
function fallback(fn) {
  var curr = new Date().getTime();
  var ms = Math.max(0, 16 - (curr - prev));
  setTimeout(fn, ms);
  prev = curr;
}

});
require.register("stagas-oscilloscope/index.js", function(exports, require, module){

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

});
require.register("stagas-logo-wavepot/index-v1.js", function(exports, require, module){

module.exports = Logo;

function Logo(expandSine){
  this.el = document.createElement('div');
  this.el.id = 'logo';
  this.svg = createElement('svg');

  var color = '#61CCE0';
  var stroke = 2.6;

  attrs(this.svg, {
    width: '60px',
    height: '50px'
  });
  this.el.appendChild(this.svg);

  this.pot = createElement('polyline');
  attrs(this.pot, {
    fill: 'none',
    stroke: color,
    'stroke-width': stroke,
    'stroke-linecap': 'round'
  });
  this.svg.appendChild(this.pot);

  var points = [];
  var x, y;
  var offset = 30;
  var scale = 11.5;
  for (var t = -0.50; t < 3.65; t += 0.01) {
    x = offset + (scale * Math.cos(t));
    y = offset - 8 + (scale * Math.sin(t));
    points.push(x + ',' + y);
  }

  this.pot.setAttribute('points', points.join(' '));

  this.wave = createElement('polyline');
  attrs(this.wave, {
    fill: 'none',
    stroke: color,
    'stroke-width': stroke,
    'stroke-linecap': 'round'
  });
  this.svg.appendChild(this.wave);

  var points = [];
  var x, y;
  var offset = 21.5;
  var scale = 1.2;
  expandSine = expandSine || 0;
  for (var t = 3.3 - expandSine; t < 9.2 + expandSine; t += 0.1) {
    y = offset + (scale * Math.sin(t));
    points.push(18.7 + (t * 1.8) + ',' + y);
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


});
require.register("stagas-logo-wavepot/index-v2.js", function(exports, require, module){

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


});
require.register("stagas-worker-fork/index.js", function(exports, require, module){

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

});
require.register("stagas-treeview/index.js", function(exports, require, module){

/**
 * Expose `tree`.
 */

module.exports = tree;

/**
 * Creates a treeview of elements in `arr`
 * inside `parent`.
 *
 * The elements array follows the format:
 *
 *     [
 *       ['leaf'],
 *       ['leaf'],
 *       ['branch', true]
 *     ]
 *
 * When a branch node is clicked, it invokes
 * `fn(node, fn)` and it must callback
 * a new array of elements `fn(err, arr)`.
 *
 * @param {Object} parent
 * @param {Array} arr
 * @param {Function} fn
 * @return {Array} nodes
 * @api public
 */

function tree(parent, arr, fn){
  var nodes = new Array(arr.length);

  var el = document.createElement('ul');

  el.className = 'treeview';

  for (var i = 0; i < arr.length; i++) {
    var item = arr[i];
    var node = nodes[i] = new Node(item, parent, fn);
    el.appendChild(node.el);
  }

  if (!(parent instanceof Node)) el.classList.add('top');

  parent.el.appendChild(el);

  return nodes;
}

/**
 * Creates a node `item` that
 * belongs to `parent` with fetch
 * handler `fn`.
 *
 * @param {Array} item
 * @param {Node} parent
 * @param {Function} fn
 * @api private
 */

function Node(item, parent, fn){
  this.el = document.createElement('li');
  this.label = document.createElement('div');
  this.label.className = 'label';
  this.label.onclick = this.click.bind(this);
  this.item = item[0];
  this.parent = parent;
  this.top = parent.top || parent;
  this.fn = fn;
  this.children = null;
  this.isBranch = item[1];
  this.isOpen = false;

  if (this.isBranch) this.el.classList.add('branch');

  this.label.textContent = this.item;
  this.el.appendChild(this.label);
}

/**
 * Emits an event to the topmost object.
 *
 * @api private
 */

Node.prototype.emit = function(event, param){
  if (!this.top.emit) return;
  this.top.emit(event, param, this);
};

/**
 * Returns a slash delimited string path
 * representation of the node.
 *
 * @return {String} path
 * @api public
 */

Node.prototype.path = function(){
  var path = [];
  var node = this;
  do {
    path.unshift(node.item);
  } while (node = node.parent);
  return path.join('/');
};

Node.prototype.select = function(){
  //if (this === this.top.selected) return;

  if (this.top.selected) {
    this.top.selected.el.classList.remove('selected');
  }
  this.el.classList.add('selected');

  this.top.selected = this;

  this.emit('select', this);
};

/**
 * Toggles a branch node.
 *
 * @api private
 */

Node.prototype.toggle = function(){
  if (this.isOpen) this.close();
  else this.open();
};

/**
 * Opens a branch node.
 *
 * @api private
 */

Node.prototype.open = function(){
  this.el.classList.add('open');
  this.isOpen = true;
};

/**
 * Closes a branch node.
 *
 * @api private
 */

Node.prototype.close = function(){
  this.el.classList.remove('open');
  this.isOpen = false;
};

Node.prototype.click = function(fn){
  var self = this;

  fn = 'function' == typeof fn ? fn : noop;

  if (this.isBranch) {
    this.toggle();

    if (this.children || !this.isOpen) return;

    this.fn(this, function(err, children){
      if (err) {
        self.close();
        self.emit('error', err);
        return fn(err);
      }

      self.children = tree(self, children, self.fn);

      fn(null, self.children);
    });
  } else {
    this.select();
  }
};

function noop(){/* noop */}

});
require.register("wavepot/index.js", function(exports, require, module){

/**
 * webaudio-daw
 */

var fork = require('worker-fork');
var preload = require('load-image');

var bufferSize = 4096;

if (fork.isMaster) master();
else worker();

function master(){
  /**
   * disable backspace leave page.
   * TODO: make module
   */
  var rx = /INPUT|SELECT|TEXTAREA/i;

  document.body.addEventListener('keydown', function(ev){
    if (8 === ev.which) { // backspace
      if (!rx.test(ev.target.tagName) || ev.target.disabled || ev.target.readOnly) {
        ev.preventDefault();
      }
    }
  });

  var bufferMax = 6;
  var bufferQueue = [];

  var k = require('k')(window);
  k.ignore = false;
  k('super + enter', function(ev){
    ev.preventDefault();
    toolbar.togglePause();
    return false;
  });

  k('super + shift + enter', function(ev){
    ev.preventDefault();
    ctx.stop();
    toolbar.togglePause();
    return false;
  });

  var debounce = require('debounce');
  var Sublime = require('./sublime');
  var toolbar = require('./toolbar');
  var sidebar = require('./sidebar');
  // var fund = require('./fund');

  var dsp = require('webaudio-dsp');
  var ctx = dsp(bufferSize, process);
  var sampleRate = ctx.audio.sampleRate;

  var child = fork('build.js', 'wavepot');

  toolbar.create(ctx);
  document.body.appendChild(toolbar.el);

  sidebar.create(ctx);

  var sublime = ctx.sublime = Sublime();
  setTimeout(function(){ // prevents flash of unstyled ace
    document.body.appendChild(sublime.el);
    document.body.appendChild(sidebar.el);
  }, 500);
  //oscilloscope.polyline.setAttribute('stroke', '#A6E22E');

  ctx.isNewProject = true;

  var session = sublime.editor.getSession();
  session.setMode('ace/mode/javascript');
  session.setTabSize(2);
  session.setUseWorker(true);
  session.on('change', debounce(onchange, 500));
  session.on('change', debounce(function(){
    if (ctx.isNewProject) {
      ctx.isNewProject = false;
      ctx.hasEdited = false;
      window.onbeforeunload = function(){};
      return;
    }
    ctx.hasEdited = true;
    window.onbeforeunload = function(){
      return 'You\'ve made some edits!\n\nIf you leave you will lose everything!';
    };
  }, 50));

  child.on('message', function(b){
    var buffer = new Float32Array(b);
    bufferQueue.push(buffer);
  });

  ctx.on('stop', onstop);

  send('bufferSize', bufferSize);
  send('sampleRate', ctx.audio.sampleRate);

  function onchange(){
    var src = session.getValue();
    send('compile', src);
  }

  function onstop(){
    bufferQueue = [];
    send('resetFrame');
  }

  function send(cmd, param){
    child.send({ cmd: cmd, param: param });
  }

  function process(L, R, len){
    play(L, R, len);
  }

  function next(){
    if (bufferQueue.length < bufferMax) send('bufferAhead');
    return bufferQueue.shift();
  }

  function play(L, R){
    var samples = next();
    if (!samples) return;

    L.set(samples, 0);
    R.set(samples, 0);

    display(samples);
  }

  var timeouts = [];
  var timeoutDelay = 1024 / (sampleRate / 1000);

  function display(buffer){
    for (var i = 0; i < bufferSize / 1024; i++) {
      clearTimeout(timeouts[i]);
      timeouts[i] = setTimeout(function(i){
        var pos = i * 1024;
        var buf = buffer.subarray(pos, pos + 1024);
        toolbar.oscilloscope.render(buf);
      }, timeoutDelay * i, i);
    }
  }

  //session.setValue(demo.toString().split('\n').slice(1, -1).join('\n'));
}

function worker(){
  var err = null;
  var ok = true;
  var fn = function(){ return 0 };
  var lastFn = fn;
  var sample;

  var time = 0, frame = 0;
  var volume = 100;
  var sampleRate;
  var bufferSize;

  fork.on('message', function(msg){
    switch (msg.cmd) {
      case 'compile': return compile(msg.param);
      case 'resetFrame': return (frame = 0);
      case 'bufferSize': return (bufferSize = msg.param);
      case 'sampleRate': return (sampleRate = msg.param);
      case 'bufferAhead': return bufferAhead();
    }
  });

  function bufferAhead(){
    var floats = new Float32Array(bufferSize);

    for (var i = 0, len = bufferSize; i < len; i++, frame++) {
      time = frame / sampleRate;
      floats[i] = fn(time, frame) * Math.pow(volume / 100, 3);
    }

    fork.send(floats.buffer, [floats.buffer]);
  }

  function compile(src){
    try {
      // wrap
      src =
          'var sampleRate = ' + sampleRate + ';\n'
        + src
        + ';\nreturn dsp;\n';

      // compile
      fn = Function(src)();

      // test a sample
      sample = Number(fn(0,0));

      if (isNaN(sample)) err = new Error('sample is NaN');
      else if (Math.abs(sample) === Infinity) err = new Error('sample is Infinity');

      if (!err) {
        if (!ok) console.log('dsp function compiled');
        ok = true;
        lastFn = fn;
        return;
      }

      if (ok) throw err;
    } catch(e) {
      if (ok) console.error(e.stack);
    }

    err = null;
    ok = false;
    fn = lastFn;
  }
}

/*
fundlist.create();
document.body.appendChild(fundlist.el);

fundlist.makeModal();
*/
//fund.show('project saving & sharing');

/*fund.modal.on('hide', function(){
  setTimeout(function(){
    fund.modal.show();
  }, 1000);
})*/
/*
setTimeout(function(){
  fund.modal.show();
}, 500);*/

});
require.register("wavepot/utils.js", function(exports, require, module){

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

});
require.register("wavepot/sublime.js", function(exports, require, module){

module.exports = function(){
  ace.require('ace/ext/language_tools');

  var el = document.createElement('div');
  el.id = 'editor';

  var editor = ace.edit(el);

  editor.setTheme('ace/theme/monokai');
  editor.setFadeFoldWidgets(true);
  editor.setShowPrintMargin(false);
  editor.setOptions({
    enableBasicAutocompletion: true,
    enableSnippets: true,
    fontFamily: 'Cousine',
    fontSize: '10pt'
  });

  editor.commands.addCommand({
    name: "removeline",
    bindKey: bindKey("Ctrl-D|Shift-Del", "Command-D"),
    exec: function(editor){ editor.removeLines(); },
    scrollIntoView: "cursor",
    multiSelectAction: "forEachLine"
  });

  editor.commands.addCommand({
    name: "copylinesup",
    bindKey: bindKey("Alt-Shift-Up", "Command-Option-Up"),
    exec: function(editor){ editor.copyLinesUp(); },
    scrollIntoView: "cursor"
  });

  editor.commands.addCommand({
    name: "movelinesup",
    bindKey: bindKey("Alt-Up|Ctrl-Shift-Up", "Option-Up"),
    exec: function(editor){ editor.moveLinesUp(); },
    scrollIntoView: "cursor"
  });

  editor.commands.addCommand({
    name: "copylinesdown",
    bindKey: bindKey("Alt-Shift-Down|Ctrl-Shift-D", "Command-Option-Down"),
    exec: function(editor){ editor.copyLinesDown(); },
    scrollIntoView: "cursor"
  });

  editor.commands.addCommand({
    name: "movelinesdown",
    bindKey: bindKey("Alt-Down|Ctrl-Shift-Down", "Option-Down"),
    exec: function(editor){ editor.moveLinesDown(); },
    scrollIntoView: "cursor"
  });

  return {
    el: el,
    editor: editor
  };
};

function bindKey(win, mac){
  return { win: win, mac: mac };
}

});
require.register("wavepot/toolbar.js", function(exports, require, module){

var Oscilloscope = require('oscilloscope');
var Logo = require('logo-wavepot');
//var xgui = require('xgui');
// var fund = require('./fund');
var about = require('./about');
var utils = require('./utils');
var createElement = utils.createElement;

var toolbar = module.exports = {};

toolbar.create = createToolbar;
toolbar.togglePause = togglePause;

function createToolbar(ctx){
  // toolbar
  toolbar.el = createElement('toolbar');

  toolbar.ctx = ctx;
/*
  toolbar.logo = createElement('logo');
  toolbar.logo.innerHTML = '\\<span class="underline">~</span>/';
*/
  toolbar.logo = new Logo;

  // play / pause
  toolbar.play = createElement('play', 'button icon-play');
  toolbar.pause = createElement('pause', 'button icon-pause hide');
  toolbar.stop = createElement('stop', 'button icon-stop');
  // toolbar.record = createElement('record', 'button icon-record');
  toolbar.save = createElement('save', 'button icon-save right');
  toolbar.share = createElement('share', 'button icon-share right');
  toolbar.export = createElement('export', 'button icon-export right');
  toolbar.console = createElement('console', 'button icon-console right');
  toolbar.profile = createElement('profile', 'button icon-profile right');
  toolbar.info = createElement('info', 'button icon-info right');
  toolbar.menu = createElement('menu', 'button icon-menu right');

  toolbar.play.title =
  toolbar.pause.title = 'super + enter = toggle pause\nsuper + shift + enter = play from start';

  // oscilloscope
  toolbar.oscilloscope = new Oscilloscope({
    width: 165,
    height: 50
  });
  toolbar.oscilloscope.el.title = 'left click : toggle\nright click : resolution\nwheel : zoom';
  toolbar.oscilloscope.step = 8;
/*
  // master volume
  var gui = new xgui({
    width: 35,
    height: 50,
    backgroundColor: '#59584E',
    frontColor: '#A0D92E',
    dimColor: '#aaa', //#2F3129'
  });

  gui.el = gui.getDomElement();
  gui.el.title = 'master volume\nright click : (un)mute';
  gui.el.oncontextmenu = function(ev){
    ev.preventDefault();
    if (toolbar.volume.mute && toolbar.volume.value.v === 0) {
      toolbar.volume.value.v = toolbar.volume.previous;
      toolbar.volume.mute = false;
    } else {
      toolbar.volume.previous = toolbar.volume.value.v;
      toolbar.volume.value.v = 0;
      toolbar.volume.mute = true;
    }
    toolbar.volume.draw();
    toolbar.volume.value.updateBind();
    return false;
  };

  toolbar.volume = new gui.VSlider({
    x: 10,
    y: 10,
    max: 100,
    value: dsp.volume,
    width: 15,
    height: 30,
    hideValue: true
  });

  toolbar.volume.value.bind(dsp, 'volume');
*/

/*
  toolbar.volume = new gui.Knob({
    x: 10,
    y: 9,
    radius: 15,
    value: 65,
    min: 0,
    max: 100
  });
*/

  toolbar.oscilloscope.el.classList.add('right');

  toolbar.el.appendChild(toolbar.logo.el);
  //toolbar.el.appendChild(gui.el);
  toolbar.el.appendChild(toolbar.play);
  toolbar.el.appendChild(toolbar.pause);
  toolbar.el.appendChild(toolbar.stop);
  // toolbar.el.appendChild(toolbar.record);
  toolbar.el.appendChild(toolbar.menu);
  toolbar.el.appendChild(toolbar.oscilloscope.el);
  /*
  toolbar.el.appendChild(toolbar.console);
  toolbar.el.appendChild(toolbar.share);
  toolbar.el.appendChild(toolbar.export);
  toolbar.el.appendChild(toolbar.save);
  */
  //toolbar.el.appendChild(toolbar.profile);
  //toolbar.el.appendChild(toolbar.info);

  toolbar.logo.el.onclick = about.show.bind(about);

  toolbar.play.onclick =
  toolbar.pause.onclick = togglePause;
  toolbar.stop.onclick = function(){
    ctx.stop();
    toolbar.play.classList.remove('hide');
    toolbar.pause.classList.add('hide');
  };

  // toolbar.record.onclick = about.show.bind(about); //fund.show.bind(fund, 'milestone I');
  toolbar.menu.onclick = about.show.bind(about); //fund.show.bind(fund, 'milestone I');
  /*toolbar.smiley.onclick =
  toolbar.record.onclick =
  toolbar.save.onclick = fundlist.show;*/
}

function togglePause(){
  var ctx = toolbar.ctx;

  if (ctx.playing) {
    ctx.pause();
  } else {
    ctx.play();
  }

  if (ctx.playing) {
    toolbar.play.classList.add('hide');
    toolbar.pause.classList.remove('hide');
  } else {
    toolbar.play.classList.remove('hide');
    toolbar.pause.classList.add('hide');
  }
}

});
require.register("wavepot/sidebar.js", function(exports, require, module){

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

    context.isNewProject = true;
    ajax.get(path, function (code) {
      session.setValue(code);
    });

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

});
require.register("wavepot/about.js", function(exports, require, module){

var ejs = require('ejs');
var Logo = require('logo-wavepot');
var modal = require('modal');
var utils = require('./utils');
var createElement = utils.createElement;

var tmpl = {
  about: require('./about.html')
};

var about = module.exports = {};

about.show = show;
about.active = null;

function show(){
  if (about.active) return;

  // var fund = require('./fund');
  // if (fund.active) {
  //   fund.modal.once('hide', about.show.bind(about));
  //   fund.modal.hide();
  //   return;
  // }

  about.active = true;

  var el = createElement('about', 'modal');

  el.innerHTML = tmpl.about;

  var logo = new Logo(0.5);
  logo.svg.setAttribute('width', '310px');
  logo.svg.setAttribute('height', '210px');
  logo.svg.setAttribute('viewBox', '0 0 60 50');
  logo.svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  logo.pot.setAttribute('stroke-width', 2.75);
  logo.pot.setAttribute('stroke-linecap', 'butt');
  logo.wave.setAttribute('stroke-width', 2.75);
  logo.wave.setAttribute('stroke-linecap', 'butt');
  query('.about-logo').appendChild(logo.el);

  // query('a.fundraiser').onclick = function(ev){
  //   ev.preventDefault();
  //   fund.show('milestone I');
  //   return false;
  // };

  about.modal = modal(el)
    .overlay()
    .closeable()
    .effect('fade-and-scale')
    .show()
    .on('hide', function(){
      about.active = null;
    });

  function query(sel){
    return el.querySelector(sel);
  }
}

});





























require.register("segmentio-overlay/lib/index.html", function(exports, require, module){
module.exports = '<div class="Overlay hidden"></div>';
});






require.register("segmentio-modal/lib/index.html", function(exports, require, module){
module.exports = '<div class="Modal hidden" effect="toggle"></div>';
});












require.register("wavepot/about.html", function(exports, require, module){
module.exports = '\n<div class="about">\n  <center>\n    <div class="about-logo"></div>\n\n    <h1>wavep0t</h1>\n\n    <p class="details tagline">\n      dsp playground\n    </p>\n    <p class="details">\n      <a target="_blank" href="https://news.ycombinator.com/item?id=7905910">hn discussion</a>\n    </p>\n  </center>\n</div>\n';
});
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