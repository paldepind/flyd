var assert = require('assert');
var flyd = require('../../../lib');
var stream = flyd.stream;

var sampleOn = require('../index.js');

describe('sample On', function() {
  it('samples from second stream', function() {
    var result = [];
    var s1 = stream();
    var s2 = stream();
    var sampled = sampleOn(s1, s2);
    flyd.map(function(v) {
      result.push(v);
    }, sampled);
    s2(1);
    s1(1)(2)(3);
    s2(3)(4)(6);
    s1(5)(3);
    assert.deepEqual(result, [1, 1, 1, 6, 6]);
  });
  it('has no value until value flows on trigger stream', function() {
    var result = [];
    var s1 = stream();
    var s2 = stream(1);
    var sampled = sampleOn(s1, s2);
    flyd.map(function(v) {
      result.push(v);
    }, sampled);
    s2(1);
    s1(1)(2)(3);
    s2(3)(4)(6);
    s1(5)(3);
    assert.deepEqual(result, [1, 1, 1, 6, 6]);
  });
  it('does not update until both trigger stream and source stream have been updated', function() {
    var result = [];
    var trigger = stream();
    var source = flyd.combine(function(s1) {return s1();}, [trigger]);
    var sampled = sampleOn(trigger, source);
    flyd.map(function(v) {
      result.push(v);
    }, sampled);
    trigger(0);
    assert.deepEqual(result, [0]);
  });
});
