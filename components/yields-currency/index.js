
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
