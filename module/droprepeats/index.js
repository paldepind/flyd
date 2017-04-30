var flyd = require('../../flyd');

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

exports.dropRepeatsWith = flyd.curry2(dropRepeatsWith);

function strictEq(a, b) {
  return a === b;
}
