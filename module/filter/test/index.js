var assert = require('assert');
var flyd = require('../../../lib');

var filter = require('../index.js');

function over5(n) {
  return n > 5;
}

describe('filter', function() {
  it('only lets values passing the filter through', function() {
    var result = [];
    var numbers = flyd.stream();
    var largeNumbers = filter(over5, numbers);
    flyd.map(function(n) {
      result.push(n);
    }, largeNumbers);
    numbers(2)(6)(5)(3)(7)(10)(5);
    assert.deepEqual(result, [6, 7, 10]);
  });
  it('is curried', function() {
    var numbers = flyd.stream();
    assert(filter(over5)(numbers));
  });
});
