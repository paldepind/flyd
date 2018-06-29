var flyd = require('../../lib');
var takeUntil = require('../takeuntil');
var drop = require('ramda/src/drop');

var dropCurrentValue = flyd.transduce(drop(1));

module.exports = function(s) {
  return flyd.combine(function(stream$, self) {
    var value$ = stream$();
    flyd.on(self, takeUntil(value$, dropCurrentValue(stream$)));
  }, [s]);
};
