var flyd = require('flyd');

module.exports = flyd.curryN(2, function(dur, s) {
  var values = [];
  return flyd.stream([s], function(self) {
    setTimeout(function() {
      self(values = values.slice(1));
    }, dur);
    return (values = values.concat([s()]));
  });
});
