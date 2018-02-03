var flyd = require('../../flyd');

module.exports = flyd.curry2(function(targ, fn) {
  var s = flyd.stream();
  flyd.map(function(v) { targ(fn(v)); }, s);
  return s;
});
