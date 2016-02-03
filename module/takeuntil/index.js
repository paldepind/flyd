var flyd = require('../../lib');

module.exports = function(src, term) {
  return flyd.endsOn(flyd.merge(term, src.end), flyd.combine(function(src, self) {
    self(src());
  }, [src]));
};
