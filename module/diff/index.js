var flyd = require('flyd');

var previous = require('flyd/module/previous');

module.exports = function (diffFunc, s) {
  var prevS = previous(s);
  return flyd.stream([s, prevS], function (self) {
    return diffFunc(prevS(), s());
  });
};
