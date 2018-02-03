var flyd = require('../../flyd');

module.exports = flyd.curry2(function(fn, s) {
  return flyd.combine(function(s, self) {
    if (fn(s())) self(s.val);
  }, [s]);
});
