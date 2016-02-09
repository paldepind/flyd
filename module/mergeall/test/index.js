var assert = require('assert');
var flyd = require('../../../lib');
var stream = flyd.stream;

var mergeAll = require('../index.js');

describe('mergeAll', function() {
  it('merges multiple streams', function() {
    var s1 = stream();
    var s2 = stream();
    var s3 = stream();
    var merged = mergeAll([s1, s2, s3]);
    s1(1);
    assert.equal(merged(), 1);
    s2(2);
    assert.equal(merged(), 2);
    s3(3);
    assert.equal(merged(), 3);
    s2('hello');
    assert.equal(merged(), 'hello');
  });
  it('has initial value', function() {
    var s1 = stream(1);
    var s2 = stream(2);
    var s3 = stream();
    var merged = mergeAll([s1, s2, s3]);
    assert.equal(merged(), 1);
    s3(3);
    assert.equal(merged(), 3);
  });
  it('ends when all the merged streams end', function() {
    var s1 = stream();
    var s2 = stream();
    var s3 = stream();
    var merged = mergeAll([s1, s2, s3]);
    s1.end(true);
    assert.equal(s1.end(), true);
    assert.equal(merged.end(), undefined);
    s2.end(true);
    assert.equal(s2.end(), true);
    assert.equal(merged.end(), undefined);
    s3.end(true);
    assert.equal(s3.end(), true);
    assert.equal(merged.end(), true);
  });
});
