var assert = require('assert');
var flyd = require('../../../lib');
var stream = flyd.stream;

var keepWhen = require('../index.js');

describe('keepWhen', function() {
  it('keeps values from second stream when first is true', function() {
    var result = [];
    var s = stream(1);
    var b = stream(false);
    var k = keepWhen(b, s);
    flyd.map(function(v) {
      result.push(v);
    }, k);
    s(2);
    b(true);
    s(3)(4);
    b(false);
    s(5);
    b(true);
    s(6);
    assert.deepEqual(result, [3, 4, 6]);
  });
  it('doesnt emit anything until second stream has a value', function() {
    var result = [];
    var s = stream();
    var b = stream(false);
    var k = keepWhen(b, s);
    flyd.map(function(v) {
      result.push(v);
    }, k);
    b(true)(false)(true);
    s(3)(4);
    assert.deepEqual(result, [3, 4]);
  });
});
