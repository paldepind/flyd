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
  it('has not value until value flows on trigger stream', function() {
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
});
