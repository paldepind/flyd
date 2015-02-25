var assert = require('assert');

var lib = require('../snapview.js');
var stream = lib.stream;
var pipe = lib.pipe;

describe('stream', function() {
  it('can be set with initial value', function() {
    var s = stream(12);
    assert.equal(s(), 12);
  });
  it('can be set', function() {
    var s = stream();
    s(23);
    assert.equal(s(), 23);
    s(3);
    assert.equal(s(), 3);
  });
  it('setting a stream returns the stream', function() {
    var s = stream();
    assert.equal(s, s(23));
  });
});
describe('pipe', function() {
  it('can set result by calling callback', function() {
    var x = stream(3);
    var y = stream(4);
    var sum = pipe(function(s) {
      s(x() + y());
    });
    assert.equal(sum(), x() + y());
  });
  it('can set result by returning value', function() {
    var x = stream(3);
    var y = stream(4);
    var sum = pipe(function() {
      return x() + y();
    });
    assert.equal(sum(), x() + y());
  });
  it('is updated when dependencies change', function() {
    var x = stream(3);
    var y = stream(4);
    var sum = pipe(function(s) {
      s(x() + y());
    });
    assert.equal(sum(), x() + y()); // 7
    x(12);
    assert.equal(sum(), x() + y()); // 16
    y(8);
    assert.equal(sum(), x() + y()); // 20
  });
  it('putting to stream does not add dependency', function() {
    var x = stream(3);
    var y = stream(4);
    var called = 0;
    var sum = pipe(function(s) {
      called++;
      y(x() + 5);
    });
    x(1)(2)(3);
    y(1)(2)(3);
    x(4)(5);
    assert.equal(called, 6);
    assert.equal(y(), 10);
  });
  it('can specify dependencies manually', function() {
    var x = stream(3);
    var y = stream(4);
    var called = 0;
    var sum = pipe([x], function(s) {
      called++;
      return x() + y();
    });
    x(1)(2)(3);
    y(1)(2)(3);
    x(4)(5);
    assert.equal(called, 6);
    assert.equal(sum(), 8);
  });
  it('pipes can lead into other pipes', function() {
    var x = stream(3);
    var y = stream(4);
    var sum = pipe(function() {
      return x() + y();
    });
    var twiceSum = pipe(function() {
      return sum() * 2;
    });
    var sumPlusDoubleSum = pipe(function() {
      return twiceSum() + sum();
    });
    x(12);
    assert.equal(sumPlusDoubleSum(), sum() * 3);
    y(3);
    assert.equal(sumPlusDoubleSum(), sum() * 3);
    x(2);
    assert.equal(sumPlusDoubleSum(), sum() * 3);
    assert.equal(sumPlusDoubleSum(), (2 + 3) * 3);
  });
  it('can destroy pipe', function() {
    var x = stream(3);
    var y = stream(2);
    var sum = pipe(function() {
      return y() * x();
    });
    assert.equal(y.listeners.length, 1);
    assert.equal(x.listeners.length, 1);
    sum.destroy();
    assert.equal(y.listeners.length, 0);
    assert.equal(x.listeners.length, 0);
  });
  it('can not destroy pipe with listeners', function() {
    var x = stream(3), thrown;
    var x2 = pipe(function() {
      return x() * 2;
    });
    var x4 = pipe(function() {
      return x2() * 2;
    });
    assert.equal(x4(), 12);
    try {
      x2.destroy();
    } catch(e) {
      thrown = true;
    }
    assert(thrown);
  });
  it('detects circular dependencies when get then set', function() {
    var x = stream(3), errMsg;
    try {
      var xTwice = pipe(function() {
        return x(x() * 2);
      });
    } catch(e) {
      errMsg = e.message;
      thrown = true;
    }
    assert.equal(errMsg, 'Circular dependency detected');
  });
  it('detects circular dependencies', function() {
    var x = stream(3), errMsg;
    try {
      var xTwice = pipe(function() {
        x(3);
        return x();
      });
      x(1);
    } catch(e) {
      errMsg = e.message;
      thrown = true;
    }
    assert.equal(errMsg, 'Circular dependency detected');
  });
  it('handles dependencies when pipes are triggered in pipes', function() {
    var x = stream(4);
    var y = stream(3);
    var z = stream(1);
    var doubleX = pipe(function() {
      return x() * 2;
    });
    var setAndSum = pipe(function() {
      x(3);
      return z() + y();
    });
    z(4);
    assert.equal(setAndSum(), 7);
  });
  it('executes to the end before handlers are triggered', function() {
    var order = [];
    var x = stream(4);
    var y = stream(3);
    var doubleX = pipe(function() {
      if (x() === 3) order.push(2);
      return x() * 2;
    });
    var setAndY = pipe(function() {
      x(3);
      order.push(1);
      return y();
    });
    assert.equal(order[0], 1);
    assert.equal(order[1], 2);
  });
  it('with static deps executes to the end', function() {
    var order = [];
    var x = stream(4);
    var y = stream(3);
    var doubleX = pipe(function() {
      if (x() === 3) order.push(2);
      return x() * 2;
    });
    var setAndY = pipe([y], function() {
      x(3);
      order.push(1);
      return y();
    });
    assert.equal(order[0], 1);
    assert.equal(order[1], 2);
  });
});
