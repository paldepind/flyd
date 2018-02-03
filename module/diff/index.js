var flyd = require('../../flyd');

var previous = require('../previous');

module.exports = flyd.curry2(function(diffFunc, s) {
  var prevS = previous(s);
  return flyd.combine(function() {
    return diffFunc(prevS(), s());
  }, [s, prevS]);
});
