var flyd = require('../../lib');

var previous = require('../previous');

module.exports = flyd.curryN(2, function(diffFunc, s) {
  var prevS = previous(s);
  return flyd.combine(function() {
    return diffFunc(prevS(), s());
  }, [s, prevS]);
});
