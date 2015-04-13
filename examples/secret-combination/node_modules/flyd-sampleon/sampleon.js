var flyd = require('flyd');

module.exports = flyd.curryN(2, function(s1, s2) {
  return flyd.stream([s1], function() {
    return s2();
  });
});
