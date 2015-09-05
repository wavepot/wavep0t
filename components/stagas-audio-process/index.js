
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
