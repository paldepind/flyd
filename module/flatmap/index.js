var flyd = require('../../lib');

module.exports = function(f, s) {
  return flyd.combine(function(s, own) {
    flyd.map(own, f(s()));
  }, [s]);
};
