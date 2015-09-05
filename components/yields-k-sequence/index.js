
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
