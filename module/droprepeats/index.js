var flyd = require('../../lib');

function dropRepeatsWith(eq, s) {
  var prev;
  return flyd.combine(function(s, self) {
    if (!self.hasVal || !eq(s.val, prev)) {
      self(s.val);
      prev = s.val;
    }
  }, [s]);
}

exports.dropRepeats = function(s) {
  return dropRepeatsWith(strictEq, s);
};

exports.dropRepeatsWith = flyd.curryN(2, dropRepeatsWith);

function strictEq(a, b) {
  return a === b;
}
