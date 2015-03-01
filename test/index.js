var assert = require('assert');

var lib = require('../flyd.js');
var stream = lib.stream;

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
  describe('map', function() {
    it('maps a function', function() {
      var x = stream(3);
      var doubleX = x.map(function(x) { return 2*x; });
      assert.equal(doubleX(), 6);
      x(1);
      assert.equal(doubleX(), 2);
    });
    it('returns equivalent stream when mapping identity', function() {
      var x = stream(3);
      var x2 = x.map(function(a) { return a; });
      assert.equal(x2(), x());
      x('foo');
      assert.equal(x2(), x());
    });
    it('is compositive', function() {
      function f(x) { return x * 2; }
      function g(x) { return x + 4; }
      var x = stream(3);
      var s1 = x.map(g).map(f);
      var s2 = x.map(function(x) { return f(g(x)); });
      assert.equal(s1(), s2());
      x(12);
      assert.equal(s1(), s2());
    });
  });
  describe('ap', function() {
    it('applies functions in stream', function() {
      var a = stream(function() {
        return function(x) { return 2*x; };
      });
      var v = stream(3);
      var s = a.ap(v);
      assert.equal(s(), 6);
      a(function(x) { return x/3; });
      assert.equal(s(), 1);
      v(9);
      assert.equal(s(), 3);
    });
    it('is compositive', function() {
      var a = stream(function() {
        return function(x) { return x * 2; };
      });
      var u = stream(function() {
        return function(x) { return x + 5; };
      });
      var v = stream(8);
      var s1 = a.map(function(f) {
        return function(g) {
          return function(x) {
            return f(g(x));
          };
        };
      }).ap(u).ap(v);
      var s2 = a.ap(u.ap(v));
      assert.equal(s1(), 26);
      assert.equal(s2(), 26);
      a(function(x) { return x * 4; });
      assert.equal(s1(), 52);
      assert.equal(s2(), 52);
      u(function(x) { return x / 8; });
      assert.equal(s1(), 4);
      assert.equal(s2(), 4);
      v(24);
      assert.equal(s1(), 12);
      assert.equal(s2(), 12);
    });
  });
  it('can set result by calling callback', function() {
    var x = stream(3);
    var y = stream(4);
    var sum = stream(function(s) {
      s(x() + y());
    });
    assert.equal(sum(), x() + y());
  });
  it('can set result by returning value', function() {
    var x = stream(3);
    var y = stream(4);
    var sum = stream(function() {
      return x() + y();
    });
    assert.equal(sum(), x() + y());
  });
  it('is updated when dependencies change', function() {
    var x = stream(3);
    var y = stream(4);
    var sum = stream(function(s) {
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
    var sum = stream(function(s) {
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
    var sum = stream([x], function(s) {
      called++;
      return x() + y();
    });
    x(1)(2)(3);
    y(1)(2)(3);
    x(4)(5);
    assert.equal(called, 6);
    assert.equal(sum(), 8);
  });
  it('is not called until explicit dependencies have value', function() {
    var x = stream();
    var y = stream();
    var called = 0;
    var sum = stream([x, y], function(s) {
      called++;
      return x() + y();
    });
    x(2); x(1); y(2); y(4); x(2);
    assert.equal(called, 3);
  });
  it('streams can lead into other streams', function() {
    var x = stream(3);
    var y = stream(4);
    var sum = stream(function() {
      return x() + y();
    });
    var twiceSum = stream(function() {
      return sum() * 2;
    });
    var sumPlusDoubleSum = stream(function() {
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
  it('can destroy stream', function() {
    var x = stream(3);
    var y = stream(2);
    var sum = stream(function() {
      return y() * x();
    });
    assert.equal(y.listeners.length, 1);
    assert.equal(x.listeners.length, 1);
    sum.destroy();
    assert.equal(y.listeners.length, 0);
    assert.equal(x.listeners.length, 0);
  });
  it('can not destroy stream with listeners', function() {
    var x = stream(3), thrown;
    var x2 = stream(function() {
      return x() * 2;
    });
    var x4 = stream(function() {
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
      var xTwice = stream(function() {
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
      var xTwice = stream(function() {
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
  it('can get its own value', function() {
    var num = stream();
    var sum = stream(function(sum) {
      return (sum() || 0) + num();
    });
    num(2)(3)(8)(7);
    assert.equal(sum(), 20);
  });
  it('handles dependencies when streams are triggered in streams', function() {
    var x = stream(4);
    var y = stream(3);
    var z = stream(1);
    var doubleX = stream(function() {
      return x() * 2;
    });
    var setAndSum = stream(function() {
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
    var doubleX = stream(function() {
      if (x() === 3) order.push(2);
      return x() * 2;
    });
    var setAndY = stream(function() {
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
    var doubleX = stream(function() {
      if (x() === 3) order.push(2);
      return x() * 2;
    });
    var setAndY = stream([y], function() {
      x(3);
      order.push(1);
      return y();
    });
    assert.equal(order[0], 1);
    assert.equal(order[1], 2);
  });
});
