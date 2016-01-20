var assert = require('assert');
var flyd = require('../../../lib');
var stream = flyd.stream;

var inLast = require('../index.js');

describe('inLast', function() {
  it('adds values', function(done) {
    var s = stream();
    var lastMs = inLast(50, s);
    s(1);
    setTimeout(function() {
      assert.deepEqual(lastMs(), [1]);
      s(2);
    }, 20);
    setTimeout(function() {
      assert.deepEqual(lastMs(), [1, 2]);
      done();
    }, 40);
  });
  it('adds and removes values', function(done) {
    var s = stream();
    var lastMs = inLast(50, s);
    s(1);
    setTimeout(function() {
      assert.deepEqual(lastMs(), [1]);
      s(2);
    }, 35);
    setTimeout(function() {
      assert.deepEqual(lastMs(), [1, 2]);
      s(3);
    }, 40);
    setTimeout(function() {
      assert.deepEqual(lastMs(), [2, 3]);
      s(4);
    }, 60);
    setTimeout(function() {
      assert.deepEqual(lastMs(), [2, 3, 4]);
      s(5);
    }, 80);
    setTimeout(function() {
      assert.deepEqual(lastMs(), [4, 5]);
      done();
    }, 100);
  });
  it('is updated when values come and go', function(done) {
    var result = [];
    var s = stream();
    var lastMs = inLast(50, s);
    flyd.map(function(a) { result.push(a); }, lastMs);
    s(1);
    setTimeout(function() { s(2); }, 35);
    setTimeout(function() { s(3); }, 40);
    // 1 leaves
    setTimeout(function() { s(4); }, 60);
    setTimeout(function() { s(5); }, 80);
    // 2 leaves
    // 3 leaves
    setTimeout(function() {
      assert.deepEqual(result, [
        [1],
        [1, 2],
        [1, 2, 3],
        [2, 3],
        [2, 3, 4],
        [2, 3, 4, 5],
        [3, 4, 5],
        [4, 5]
      ]);
      done();
    }, 100);
  });
});
