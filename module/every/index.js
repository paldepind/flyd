var flyd = require('flyd');

module.exports = function(dur) {
  var s = flyd.stream();
  var target = Date.now();
  function timer() {
    if (s.end()) return;
    var now = Date.now();
    target += dur;
    s(now);
    setTimeout(timer, target - now);
  }
  timer();
  return s;
};
