var flyd = require('flyd');

module.exports = function(dur, s) {
  var scheduled;
  var buffer = [];
  return flyd.stream([s], function(self) {
    buffer.push(s());
    clearTimeout(scheduled);
    scheduled = setTimeout(function() {
      self(buffer);
      buffer = [];
    }, dur);
  });
};
