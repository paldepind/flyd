var flyd = require('flyd');

module.exports = function(f, s) {
  return flyd.stream([s], function(own) {
    flyd.map(own, f(s()));
  });
};
