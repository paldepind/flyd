var flyd = require('../../lib');
var drop = require('ramda/src/drop');

var drop1 = flyd.transduce(drop(1));

module.exports = flyd.curryN(2, function(term, src) {
  var end$ = flyd.merge(term.hasVal ? drop1(term) : term, src.end);

  return flyd.endsOn(end$, flyd.combine(function(src, self) {
    self(src());
  }, [src]));
});
