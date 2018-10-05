var flyd = require('../../../lib');
var stream = flyd.stream;
var assert = require('assert');

var takeUntil = require('../index');

describe('takeUntil', function() {
  it('emits values from first stream', function() {
    var result = [];
    var source = stream();
    var terminator = stream();
    var s = takeUntil(source, terminator);
    flyd.map(function(v) { result.push(v); }, s);
    source(1)(2)(3);
    assert.deepEqual(result, [1, 2, 3]);
  });
  it('ends when value emitted from second stream', function() {
    var result = [];
    var source = stream();
    var terminator = stream();
    var s = takeUntil(source, terminator);
    flyd.map(function(v) { result.push(v); }, s);
    s(1);
    terminator(true);
    s(2);
    assert.deepEqual(result, [1]);
    assert(s.end());
  });
  it('ends if source stream ends', function() {
    var result = [];
    var source = stream();
    var terminator = stream();
    var s = takeUntil(source, terminator);
    flyd.map(function(v) { result.push(v); }, s);
    s(1);
    source.end(true);
    s(2);
    assert.deepEqual(result, [1]);
    assert(s.end());
  });

  it('works in nested streams', function() {
    var source = stream(1);
    var terminator = stream(true);

    var value = stream(1).chain(function() {
      return takeUntil(source, terminator);
    })
      .map(function(val) {
        return val + 1;
      });

    source(2)(3)(4)(5);

    terminator(true);

    source(6)(7)(8)(9);

    assert.equal(value(), 6);
  })
});
