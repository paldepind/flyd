var flyd = require('../../lib');

// Stream bool -> Stream a -> Stream a
module.exports = flyd.curryN(2, function(sBool, sA) {
  return flyd.combine(function(sA, self) {
    if (sBool() !== false) self(sA());
  }, [sA]);
});
