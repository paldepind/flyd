var flyd = require('flyd');

module.exports = function (s) {
  var previousValue;
  return flyd.stream([s], skipFirstCall(function (self) {
    self(previousValue);
    previousValue = s();
  }));
};

function skipFirstCall (func) {
  var functionToCall = function () {
    functionToCall = func;
  }
  return function () {
    return functionToCall.apply(this, arguments);
  }
}
