var flyd = require('../../lib');

module.exports = flyd.curryN(2, function(src, term) {
  return flyd.endsOn(flyd.merge(term, src.end), flyd.combine(function(src, self) {
    self(src());
  }, [src]));
});
