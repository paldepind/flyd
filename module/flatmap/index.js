var flyd = require('../../lib');

/**
 * Given a stream of streams, returns a single stream of merged values
 * from the created streams.
 *
 * Ends when every created stream and the main stream ends.
 *
 * @name  flyd.flatMap
 * @param  {Function} f - Stream producing function `(x) -> stream.<v>`
 * @param  {stream.<x>} s - Stream to flat map values through f
 * @return {stream.<v>} - Resulting flat mapped stream
 *
 * @example
 * var s = flyd.stream();
 * var fn = (x) => flyd.stream(x);
 * var flat = flyd.flatMap(fn, s);
 * s(0)(1)(2);
 * // flat = 0, 1, 2
 */
module.exports = flyd.chain;
