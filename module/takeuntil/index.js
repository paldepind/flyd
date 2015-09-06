var flyd = require('flyd');

module.exports = function(src, term) {
  return flyd.endsOn(flyd.merge(term, src.end), flyd.stream([src], function(self) {
    self(src());
  }));
};
