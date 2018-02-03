var flyd = require('../../flyd');

module.exports = flyd.curry2(function(dur, s) {
  var scheduled;
  var buffer = [];
  return flyd.combine(function(s, self) {
    buffer.push(s());
    clearTimeout(scheduled);
    scheduled = setTimeout(function() {
      self(buffer);
      buffer = [];
    }, dur);
  }, [s]);
});
