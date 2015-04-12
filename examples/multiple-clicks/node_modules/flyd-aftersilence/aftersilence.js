var flyd = require('flyd');

module.exports = function(dur, s) {
  var scheduled;
  var buffer = [];
  var ns = flyd.stream();
  flyd.map(function(v) {
    buffer.push(v);
    clearTimeout(scheduled);
    scheduled = setTimeout(function() {
      ns(buffer);
      buffer = [];
    }, dur);
  }, s);
  return ns;
};
