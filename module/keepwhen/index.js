var flyd = require('../../flyd');

// Stream bool -> Stream a -> Stream a
module.exports = flyd.curry2(function(sBool, sA) {
  return flyd.combine(function(sA, self) {
    if (sBool() !== false) self(sA());
  }, [sA]);
});
