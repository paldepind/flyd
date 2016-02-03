var assert = require('assert');
var flyd = require('../../../lib');
var stream = flyd.stream;

var diff = require('../index.js');

describe('diff', function() {
  it('calls the diff function with the previous and new value', function() {
    var s = stream(1);
    var returnArguments = function() {
      return Array.prototype.slice.call(arguments);
    };
    var d = diff(returnArguments, s);
    s(1)(2)(3);
    assert.deepEqual(d(), [2, 3]);
  });

  it('starts streaming after the second value is pushed into the source stream', function() {
    var s = stream();
    var calls = 0;
    flyd.on();
    diff(function() { calls += 1; }, s);
    s(1);
    assert.equal(calls, 0);
    s(2);
    assert.equal(calls, 1);
  });
});
