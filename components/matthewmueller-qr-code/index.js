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


