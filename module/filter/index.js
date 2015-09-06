var flyd = require('flyd');

module.exports = function(fn, s) {
  return flyd.stream([s], function(self) {
    if (fn(s())) self(s.val);
  });
};
