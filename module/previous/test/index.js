var assert = require('assert');
var flyd = require('../../../lib');
var stream = flyd.stream;

var previous = require('../index.js');

describe('previous', function() {
  it('is always one value behind the source stream', function() {
    var s = stream(1);
    var p = previous(s);
    s(2)(3)(4);
    assert.equal(p(), 3);
  });

  it('starts streaming after the second value is pushed into the source stream', function() {
    var s = stream();
    var p = previous(s);
    var calls = 0;
    flyd.on(function() { calls += 1; }, p);
    s(1);
    assert.equal(calls, 0);
    s(2);
    assert.equal(calls, 1);
  });
});
