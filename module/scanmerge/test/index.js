var assert = require('assert');
var flyd = require('../../../lib');
var stream = flyd.stream;

var scanMerge = require('../index');

describe('scanMerge', function() {
  it('scans and merges multiple streams', function() {
    var add = stream();
    var sub = stream();
    var sum = scanMerge([
      [add, function(sum, n) { return sum + n; }],
      [sub, function(sum, n) { return sum - n; }]
    ], 0);
    add(5); sub(8); sub(4); add(12);
    assert.equal(sum(), 5);
  });
  it('initially has initial value', function() {
    var add = stream(2);
    var sub = stream(4);
    var sum = scanMerge([
      [add, function(sum, n) { return sum + n; }],
      [sub, function(sum, n) { return sum - n; }]
    ], 0);
    assert.equal(sum(), 0);
  });
  it('handles second example', function() {
    var addItem = flyd.stream();
    var rmItem = flyd.stream();
    var items = scanMerge([
      [addItem, function(list, item) { return list.concat([item]); }],
      [rmItem, function(list, item) {
        return list.filter(function(elm) { return elm !== item; });
      }]
    ], []);
    addItem(1)(2)(3)(4)(5);
    rmItem(3);
    assert.deepEqual(items(), [1, 2, 4, 5]);
  });
});
