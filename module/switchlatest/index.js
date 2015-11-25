var flyd = require('../../lib');

module.exports = function(s) {
  var inner;
  return flyd.combine(function(s, self) {
    inner = s();
    flyd.endsOn(flyd.merge(s, inner.end), flyd.combine(function(inner) {
      self(inner());
    }, [inner]));
  }, [s]);
};
