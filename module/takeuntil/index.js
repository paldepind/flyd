var flyd = require('../../lib');
var drop = require('ramda/src/drop');

var dropCurrentValue = flyd.transduce(drop(1));

module.exports = flyd.curryN(2, function(src, term) {
  var end$ = term.hasVal ? dropCurrentValue(term) : term;
  return flyd.endsOn(flyd.merge(end$, src.end), flyd.combine(function(src, self) {
    self(src());
  }, [src]));
});
