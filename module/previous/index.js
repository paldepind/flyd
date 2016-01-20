var flyd = require('../../lib');

module.exports = function(s) {
  var previousValue;
  return flyd.combine(skipFirstCall(function(s, self) {
    self(previousValue);
    previousValue = s();
  }), [s]);
};

function skipFirstCall(func) {
  var functionToCall = function() {
    functionToCall = func;
  }
  return function() {
    return functionToCall.apply(this, arguments);
  }
}
