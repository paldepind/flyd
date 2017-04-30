var flyd = require('../../flyd');

module.exports = flyd.curry2(function(s1, s2) {
  return flyd.combine(function() {
    return s2();
  }, [s1]);
});
