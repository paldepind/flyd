var assert = require('assert');
var flyd = require('../../../lib');
var stream = flyd.stream;

var throttleWhen = require('../index.js');

describe('throttleWhen', function() {
  it('throttles the second stream with the first stream, initally false', function() {
    var result = [];
    var s = stream(1);
    var b = stream(false);
    var k = throttleWhen(b, s);
    flyd.map(function(v) {
      result.push(v);
    }, k);
    s(2);
    b(true);
    s(3);
    b(false);
    s(4);
    b(true);
    s(5);
    s(6);
    b(false);
    s(7);
    assert.deepEqual(result, [1, 2, 3, 4, 6, 7]);
  });
  
  it('throttles the second stream with the first stream, initially true', function() {
    var result = [];
    var s = stream(1);
    var b = stream(true);
    var k = throttleWhen(b, s);
    flyd.map(function(v) {
      result.push(v);
    }, k);
    s(2);
    b(true);
    s(3);
    b(false);
    s(4);
    b(true);
    s(5);
    s(6);
    b(false);
    s(7);
    assert.deepEqual(result, [3, 4, 6, 7]);
  })

  it('doesnt matter if the second stream doesnt emit while the first stream toggles', function() {
    var result = [];
    var s = stream(1);
    var b = stream(false);
    var k = throttleWhen(b, s);
    flyd.map(function(v) {
      result.push(v);
    }, k);
    s(2);
    b(true);
    b(false);
    b(true);
    b(false);
    b(true);
    b(true);
    b(false);
    b(false);
    s(3);
    assert.deepEqual(result, [1, 2, 3]);
  })
});