var flyd = require('flyd');

function dropRepeatsWith(eq, s) {
  var prev;
  return flyd.stream([s], function(self) {
    if (!eq(s.val, prev)) {
      self(s.val);
      prev = s.val;
    }
  });
}

exports.dropRepeats = function(s) {
  return dropRepeatsWith(strictEq, s);
};

exports.dropRepeatsWith = flyd.curryN(2, dropRepeatsWith);

function strictEq(a, b) {
  return a === b;
}
