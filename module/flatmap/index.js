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
module.exports = flyd.curryN(2, function(f, s) {
  // Internal state to end flat map stream
  var flatEnd = flyd.stream(1);
  var internalEnded = flyd.on(function() {
    var alive = flatEnd() - 1;
    flatEnd(alive);
    if (alive <= 0) {
      flatEnd.end(true);
    }
  });

  internalEnded(s.end);

  var flatStream = flyd.combine(function(s, own) {
    // Our fn stream makes streams
    var newS = f(s());
    flatEnd(flatEnd() + 1);
    internalEnded(newS.end);

    // Update self on call -- newS is never handed out so deps don't matter
    flyd.on(own, newS);
  }, [s]);

  flyd.endsOn(flatEnd.end, flatStream);

  return flatStream;
});
