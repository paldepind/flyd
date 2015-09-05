var flyd = require('flyd');

// Stream bool -> Stream a -> Stream a
module.exports = flyd.curryN(2, function(sBool, sA) {
  return flyd.stream([sA], function(self) {
    if (sBool() !== false) self(sA());
  });
});
