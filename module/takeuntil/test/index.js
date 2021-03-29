var flyd = require('../../../lib');
var stream = flyd.stream;
var assert = require('assert');

var takeUntil = require('../index');

describe('takeUntil', function() {
  it('emits values from source stream', function() {
    var result = [];
    var source = stream();
    var terminator = stream();
    source
      .pipe(takeUntil(terminator))
      .map(function(v) { result.push(v); });
    source(1)(2)(3);
    assert.deepEqual(result, [1, 2, 3]);
  });
  it('ends when value emitted from terminator stream', function() {
    var result = [];
    var source = stream();
    var terminator = stream();
    var s = source
      .pipe(takeUntil(terminator))
      .map(function(v) { result.push(v); });
    source(1);
    terminator(true);
    source(2);
    assert.deepEqual(result, [1]);
    assert(s.end());
  });
  it('ends if source stream ends', function() {
    var result = [];
    var source = stream();
    var terminator = stream();
    var s = source
      .pipe(takeUntil(terminator))
      .map(function(v) { result.push(v); });
    source(1);
    source.end(true);
    source(2);
    assert.deepEqual(result, [1]);
    assert(s.end());
  });
});
