var flyd = require('flyd');

module.exports = function(s) {
  var inner;
  return flyd.stream([s], function(self) {
    inner = s();
    flyd.endsOn(flyd.merge(s, inner.end), flyd.stream([inner], function() {
      self(inner());
    }));
  });
};
