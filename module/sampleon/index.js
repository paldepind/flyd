var flyd = require('../../lib');

module.exports = flyd.curryN(2, function(s1, s2) {
  return flyd.combine(function(s1) {
    return s2();
  }, [s1]);
});
