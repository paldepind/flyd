var flyd = require('../../flyd');

module.exports = flyd.curry2(function(src, term) {
  return flyd.endsOn(flyd.merge(term, src.end), flyd.combine(function(src, self) {
    self(src());
  }, [src]));
});
