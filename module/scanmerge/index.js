var flyd = require('flyd');

module.exports = flyd.curryN(2, function(pairs, acc) {
  var streams = pairs.map(function(p) { return p[0]; });
  var fns = pairs.map(function(p) { return p[1]; });
  return flyd.stream(streams, function(self, changed) {
    if (changed.length > 0) {
      var idx = streams.indexOf(changed[0]);
      acc = fns[idx](acc, changed[0]());
    }
    return acc;
  }, true);
});
