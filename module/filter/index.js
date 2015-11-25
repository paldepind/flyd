var flyd = require('../../lib');

module.exports = flyd.curryN(2, function(fn, s) {
  return flyd.combine(function(s, self) {
    if (fn(s())) self(s.val);
  }, [s]);
});
