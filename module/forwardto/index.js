var flyd = require('../../lib');

module.exports = flyd.curryN(2, function(targ, fn) {
  var s = flyd.stream();
  flyd.map(function(v) { targ(fn(v)); }, s);
  return s;
});
