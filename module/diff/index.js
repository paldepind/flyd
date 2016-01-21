var flyd = require('../../lib');

var previous = require('../previous');

module.exports = function(diffFunc, s) {
  var prevS = previous(s);
  return flyd.combine(function() {
    return diffFunc(prevS(), s());
  }, [s, prevS]);
};
