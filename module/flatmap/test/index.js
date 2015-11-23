var assert = require('assert');
var flyd = require('../../../flyd');
var stream = flyd.stream;
var flatMap = require('../index.js');

describe('flatMap', function() {
  it('applies function to values in stream', function() {
    var result = [];
    function f(v) {
      result.push(v);
      return stream();
    }
    var s = stream();
    flatMap(f, s);
    s(1)(2)(3)(4)(5);
    assert.deepEqual(result, [1, 2, 3, 4, 5]);
  });
  it('returns stream with result from all streams created by function', function() {
    var result = [];
    function f(v) {
      var s = stream();
      setImmediate(function() {
        s(v+1)(v+2)(v+3);
      });
      return s;
    }
    var s = stream();
    flyd.map(function(v) {
      result.push(v);
    }, flatMap(f, s));
    s(1)(3)(5);
    setImmediate(function() {
      assert.deepEqual(result, [2, 3, 4,
                                4, 5, 6,
                                6, 7, 8]);
    });
  });
});
