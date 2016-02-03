var flyd = require('../../lib');

module.exports = flyd.curryN(2, function(pairs, acc) {
  var streams = pairs.map(function(p) { return p[0]; });
  // use immediate because we want each stream to fire regardless of if the others have ever had a value
  return flyd.immediate(flyd.combine(function() {
    var changed = arguments[arguments.length - 1];
    // var self = arguments[arguments.length - 2];
    // because of atomic updates we can have more than one changed
    // meaning more than one function should be fired, lets do it in order so its predictable
    for (var p = 0; p < pairs.length; p++) {
      // because changed is an array of references it doesn't matter if we pull the first match in the case of multiple matches
      var idx = changed.indexOf(pairs[p][0]);
      if (idx !== -1) {
        acc = pairs[p][1](acc, changed[idx]());
      }
    }
    return acc;
  }, streams));
});
