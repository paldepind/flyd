var assert = require('assert');
var flyd = require('../../../lib');
var stream = flyd.stream;

var afterSilence = require('../index.js');

// KISS way of testing time dependent code :)

describe('afterSilence', function() {
  it('correctly buffers values', function(done) {
    var result = [];
    var i = 0;
    var s1 = stream();
    var push = function() {
      s1(i++);
    };
    var s2 = afterSilence(50, s1);
    flyd.map(function(vs) {
      result.push(vs);
    }, s2);
    setTimeout(push, 20);
    setTimeout(push, 30);
    setTimeout(push, 40);
    setTimeout(push, 95);
    setTimeout(push, 100);
    setTimeout(push, 110);
    setTimeout(push, 120);
    setTimeout(push, 175);
    setTimeout(function() {
      assert.deepEqual(result, [
          [0, 1, 2],
          [3, 4, 5, 6],
          [7]
      ]);
      done();
    }, 240);
  });
  it('only emits values after specified silence', function(done) {
    var result = [];
    var i = 0;
    var s1 = stream();
    var push = function() {
      s1(i++);
    };
    var s2 = afterSilence(20, s1);
    flyd.map(function(vs) {
      result.push(vs);
    }, s2);
    setTimeout(push, 10);
    setTimeout(push, 20);
    setTimeout(push, 30);
    setTimeout(push, 40);
    setTimeout(function() {
      assert.equal(result.length, 0);
    }, 50);
    setTimeout(function() {
      assert.deepEqual(result, [[0, 1, 2, 3]]);
      done();
    }, 65);
  });
});
