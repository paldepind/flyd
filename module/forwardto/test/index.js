var assert = require('assert');
var flyd = require('flyd');
var forwardTo = require('../forwardto.js');

describe('forwardTo', function() {
  it('forwads values', function() {
    var result = [];
    var target = flyd.stream();
    function fn1(v) { result.push(v); }
    function fn2(v) { result.push(2*v); return v; }
    flyd.map(fn1, target);
    var fw = forwardTo(target, fn2);
    fw(1)(2)(3);
    assert.deepEqual(result, [2, 1, 4, 2, 6, 3]);
  });
});
