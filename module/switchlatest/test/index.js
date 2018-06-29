var flyd = require('../../../lib');
var stream = flyd.stream;
var assert = require('assert');

var switchLatest = require('../index.js');

describe('switchLatest', function() {
  it('emits values from first stream in stream', function() {
    var result = [];
    var source = stream();
    var is = stream();
    var s = switchLatest(source);
    flyd.map(function(v) { result.push(v); }, s);
    source(is);
    is(1)(2)(3);
    assert.deepEqual(result, [1, 2, 3]);
  });
  it('emits values from first and second stream in stream', function() {
    var result = [];
    var source = stream();
    var is1 = stream();
    var is2 = stream();
    var s = switchLatest(source);
    flyd.map(function(v) { result.push(v); }, s);
    source(is1);
    is1(1);
    source(is2);
    is1(-1);
    is2(2)(3);
    assert.deepEqual(result, [1, 2, 3]);
  });
  it('ends when source stream ends', function() {
    var result = [];
    var source = stream();
    var is = stream();
    var s = switchLatest(source);
    flyd.map(function(v) { result.push(v); }, s);
    source(is); is(1)(2);
    assert.deepEqual(result, [1, 2]);
    assert(!source.ended);
    source.end(true);
    assert.equal(true, source.end());
  });
});
