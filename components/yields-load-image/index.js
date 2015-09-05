
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
