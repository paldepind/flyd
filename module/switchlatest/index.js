var flyd = require('../../lib');
var takeUntil = require('../takeuntil');


module.exports = function(s) {
  return flyd.combine(function(stream$, self) {
    var value$ = stream$();
    flyd.on(self, takeUntil(value$, stream$));
  }, [s]);
};
