var flyd = require('flyd');

module.exports = flyd.curryN(2, function(fn, s) {
  return flyd.stream([s], function(self) {
    if (fn(s())) self(s.val);
  });
});
