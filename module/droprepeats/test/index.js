var flyd = require('../../../lib');
var stream = flyd.stream;
var dropRepeats = require('../').dropRepeats;
var dropRepeatsWith = require('../').dropRepeatsWith;
var R = require('ramda');
var assert = require('assert');

var collect = flyd.scan(R.flip(R.append), []);

describe('dropRepeats', function() {
  it('drops consecutive repeated values', function() {
    var s = stream();
    var all = collect(dropRepeats(s));
    s(1)(2)(2)(3);
    assert.deepEqual(all(), [1, 2, 3]);
  });

  it('doesn\'t determine equality by value', function() {
    var s = stream();
    var all = collect(dropRepeats(s));
    s({ foo: 'bar' });
    s({ foo: 'bar' });
    assert.deepEqual(all(), [
      { foo: 'bar' },
      { foo: 'bar' }
    ]);
  });
});

describe('dropRepeatsWith', function() {
  it('takes a function for using custom equality logic', function() {
    var s = stream();
    var all = collect(dropRepeatsWith(R.equals, s));
    s({ foo: 'bar' });
    s({ foo: 'bar' });
    assert.deepEqual(all(), [
      { foo: 'bar' }
    ]);
  });

  it('always includes first value so we can safely test for equality', function() {
    var s = stream();
    var all = collect(dropRepeatsWith(function(a, b) {
      return a[0] === b[0] || a[1] === b[1];
    }, s));
    s([1, 2]);
    s([1, 3]);
    s([2, 3]);
    assert.deepEqual(all(), [
      [1, 2],
      [2, 3]
    ]);
  });

  it('is curried', function() {
    var s = stream();
    var equalsDropper = dropRepeatsWith(R.equals);
    var all = collect(equalsDropper(s));
    s({ foo: 'bar' });
    s({ foo: 'bar' });
    assert.deepEqual(all(), [
      { foo: 'bar' }
    ]);
  });
});
