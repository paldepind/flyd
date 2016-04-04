var flyd = require('../../lib');
var contains = require('ramda/src/contains');

module.exports = flyd.curryN(2, function(trigger, source) {
  return flyd.combine(function(trigger, source, self, changed) {
    if (contains(trigger, changed)) return source();
  }, [trigger, source]);
});
