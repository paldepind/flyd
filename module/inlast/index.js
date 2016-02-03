var flyd = require('../../lib');

module.exports = flyd.curryN(2, function(dur, s) {
  var values = [];
  return flyd.combine(function(s, self) {
    setTimeout(function() {
      self(values = values.slice(1));
    }, dur);
    return (values = values.concat([s()]));
  }, [s]);
});
