var flyd = require('../../lib');

module.exports = function mergeAll(streams) {
  var s = flyd.immediate(flyd.combine(function() {
    var self = arguments[arguments.length - 2];
    if (arguments[arguments.length - 1][0]) {
      self(arguments[arguments.length - 1][0]());
      return;
    }
    [].slice.call(arguments, 0, arguments.length - 2)
    .some(function(s1) {
      if (s1.hasVal) {
        self(s1.val);
        return true;
      }
    });
  }, streams));
  flyd.endsOn(flyd.combine(function() {
    return true;
  }, streams.map(function(sm) { return sm.end; })), s);
  return s;
};

