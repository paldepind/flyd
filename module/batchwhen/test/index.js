var assert = require('assert');
var flyd = require('../../../lib');
var stream = flyd.stream;

var batchWhen = require('../index.js');

describe('batchWhen', function() {
  it('batches the second stream with the first stream, initally false', function() {
    var result = [];
    var s = stream(1);
    var b = stream(false);
    var k = batchWhen(b, s);
    flyd.map(function(v) {
      result.push(v);
    }, k);
    s(2);
    b(true);
    s(3);
    s(4);
    b(false);
    b(true);
    b(false);
    s(5);
    assert.deepEqual(result, [[1], [2], [3, 4], [5]]);
  });

  it('batches the second stream with the first stream, initially true', function() {
    var result = [];
    var s = stream(1);
    var b = stream(true);
    var k = batchWhen(b, s);
    flyd.map(function(v) {
      result.push(v);
    }, k);
    s(2);
    b(false);
    s(3);
    s(4);
    b(true);
    b(false);
    b(true);
    b(false);
    s(5);
    assert.deepEqual(result, [[1, 2], [3], [4], [5]]);
  });

  it('batches the second stream with the first stream, initially true, with no value', function() {
    var result = [];
    var s = stream();
    var b = stream(true);
    var k = batchWhen(b, s);
    flyd.map(function(v) {
      result.push(v);
    }, k);
    s(2);
    s(3);
    b(false);
    s(4);
    b(true);
    b(false);
    b(true);
    b(false);
    s(5);
    assert.deepEqual(result, [[2, 3], [4], [5]]);
  });

  it('batches the second stream with the first stream, initially false, with no value', function() {
    var result = [];
    var s = stream();
    var b = stream(false);
    var k = batchWhen(b, s);
    flyd.map(function(v) {
      result.push(v);
    }, k);
    s(2);
    b(true);
    s(3);
    s(4);
    b(false);
    b(true);
    b(false);
    s(5);
    assert.deepEqual(result, [[2], [3, 4], [5]]);
  });

});
