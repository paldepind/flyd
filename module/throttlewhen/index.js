var flyd = require('../../lib');
var dropRepeats = require('../droprepeats').dropRepeats;

// Stream bool -> Stream a -> Stream a
module.exports = flyd.curryN(2, function(sBool, sA) {
  var blocked = false
  var throttledA = flyd.combine(function(sA, self) {
    if (sBool()) {
      blocked = true
    } else {
      self(sA())
    }
  }, [sA])

  var sBoolChanged = dropRepeats(sBool)
  flyd.on(function(bool) {
    if (!bool && blocked) {
      throttledA(sA())
      blocked = false
    }
  }, sBoolChanged)

  return throttledA
});
