var assert = require('assert');
var Promise = require('bluebird');
var R = require('ramda');
var t = require('transducers.js');

var flyd = require('../flyd.js');
var stream = flyd.stream;

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
      return x() + y.val;
    });
    x(1)(2)(3);
    y(1)(2)(3);
    x(4)(5);
    assert.equal(called, 6);
    assert.equal(sum(), 8);
  });
  it('dependencies can be static', function() {
    var x = stream(3);
    var y = stream(4);
    var called = 0;
    var sum = stream([x], function(s) {
      called++;
      return x() + y();
    }, true);
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
    flyd.destroy(sum);
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
  it('is called with changed stream', function() {
    var s1 = stream();
    var s2 = stream();
    var result = [];
    var dependend = stream(function(d, changed) {
      s1(); s2();
      if (changed === s1) result.push(1);
      if (changed === s2) result.push(2);
    });
    s1(1);
    s2(1);
    s2(1);
    s1(1);
    s2(1);
    s1(1);
    assert.deepEqual(result, [1, 2, 2, 1, 2, 1]);
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
  it("let's explicit `undefined` flow down streams", function() {
    var result = [];
    var s1 = stream(undefined);
    var s2 = flyd.map(function(v) { result.push(v); }, s1);
    s1(2)(undefined);
    assert.deepEqual(result, [undefined, 2, undefined]);
  });
  it('handles a null floating down the stream', function() {
    stream()(null);
  });
  it('can typecheck', function() {
    var s1 = stream();
    var s2 = stream(null);
    var s3 = stream();
    var f = function() { };
    assert(flyd.isStream(s1));
    assert(flyd.isStream(s2));
    assert(flyd.isStream(s3));
    assert(!flyd.isStream(f));
  });
  it('has pretty string representation', function() {
    var ns = stream(1);
    var ss = stream('hello');
    var os = stream({});
    assert.deepEqual('' + ns, 'stream(1)');
    assert.deepEqual('' + ss, 'stream(hello)');
    assert.deepEqual('' + os, 'stream([object Object])');
  });
  describe('promise integration', function() {
    it('pushes result of promise down the stream', function(done) {
      var s = stream();
      stream([s], function() {
        assert.equal(s(), 12);
        done();
      });
      s(Promise.resolve(12));
    });
    it('recursively unpacks promise', function(done) {
      var s = stream();
      stream([s], function() {
        assert.equal(s(), 12);
        done();
      });
      s(new Promise(function(res, rej) {
        setTimeout(function() {
          res(new Promise(function(res, rej) {
            setTimeout(res.bind(null, 12));
          }));
        }, 20);
      }));
    });
  });
  describe('map', function() {
    it('maps a function', function() {
      var x = stream(3);
      var doubleX = x.map(function(x) { return 2*x; });
      assert.equal(doubleX(), 6);
      x(1);
      assert.equal(doubleX(), 2);
    });
    it('maps a function', function() {
      var x = stream(3);
      var doubleX = flyd.map(function(x) { return 2*x; }, x);
      assert.equal(doubleX(), 6);
      x(1);
      assert.equal(doubleX(), 2);
    });
    it('is curried', function() {
      var x = stream(3);
      var doubler = flyd.map(function(x) { return 2*x; });
      var quadroX = doubler(doubler(x));
      assert.equal(quadroX(), 12);
      x(2);
      assert.equal(quadroX(), 8);
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
  describe('reduce', function() {
    it('has initial acc as value when stream is undefined', function() {
      var numbers = stream();
      var sum = flyd.reduce(function(sum, n) {
        return sum + n;
      }, 0, numbers);
      assert.equal(sum(), 0);
    });
    it('can sum streams of integers', function() {
      var numbers = stream();
      var sum = flyd.reduce(function(sum, n) {
        return sum + n;
      }, 0, numbers);
      numbers(3)(2)(4)(10);
      assert.equal(sum(), 19);
    });
    it('is curried', function() {
      var numbers = stream();
      var sumStream = flyd.reduce(function(sum, n) {
        return sum + n;
      }, 0);
      var sum = sumStream(numbers);
      numbers(3)(2)(4)(10);
      assert.equal(sum(), 19);
    });
  });
  describe('merge', function() {
    it('can sum streams of integers', function() {
      var result = [];
      var s1 = stream();
      var s2 = stream();
      var merged = flyd.merge(s1, s2);
      stream([merged], function() {
        result.push(merged());
      });
      s1(12)(2); s2(4)(44); s1(1); s2(12)(2);
      assert.deepEqual(result, [12, 2, 4, 44, 1, 12, 2]);
    });
    it('is curried', function() {
      var result = [];
      var s1 = stream();
      var mergeWithS1 = flyd.merge(s1);
      var s2 = stream();
      s1and2 = mergeWithS1(s2);
      flyd.map(function(v) { result.push(v); }, s1and2);
      s1(12)(2); s2(4)(44); s1(1); s2(12)(2);
      assert.deepEqual(result, [12, 2, 4, 44, 1, 12, 2]);
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
    it('supports neat ap pattern', function() {
      var result = [];
      var sumThree = flyd.curryN(3, function(x, y, z) {
        return x + y + z;
      });
      var s1 = stream(0), s2 = stream(0), s3 = stream(0);
      var sum = flyd.map(sumThree, s1).ap(s2).ap(s3);
      flyd.map(function (v) { result.push(v); }, sum);
      s1(3); s2(2); s3(5);
      assert.deepEqual(result, [0, 3, 5, 10]);
    });
  });
  describe('of', function() {
    it('returns a stream with the passed value', function() {
      var s1 = stream(2);
      var s2 = s1.of(3);
      assert.equal(s2(), 3);
    });
    it('has identity', function() {
      var a = stream();
      var id = function(a) { return a; };
      var v = stream(12);
      assert.equal(a.of(id).ap(v)(), v());
    });
    it('is homomorphic', function() {
      var a = stream(0);
      var f = function(x) { return 2*x; };
      var x = 12;
      assert.equal(a.of(f).ap(a.of(x))(), a.of(f(x))());
    });
    it('is interchangeable', function() {
      var y = 7;
      var a = stream();
      var u = stream()(function(x) { return 3*x; });
      assert.equal(u.ap(a.of(y))(),
                   a.of(function(f) { return f(y); }).ap(u)());
    });
  });
  describe('transducer.js transducer support', function() {
    it('creates new stream with map applied', function() {
      var result = [];
      var s1 = stream();
      var tx = t.map(function(x) { return x * 3; });
      var s2 = flyd.transduce(tx, s1);
      stream([s2], function() { result.push(s2()); });
      s1(1)(2)(4)(6);
      assert.deepEqual(result, [3, 6, 12, 18]);
    });
    it('creates new stream with filter applied', function() {
      var result = [];
      var s1 = stream();
      var tx = t.compose(
        t.map(function(x) { return x * 3; }),
        t.filter(function(x) { return x % 2 === 0; })
      );
      var s2 = flyd.transduce(tx, s1);
      stream([s2], function() { result.push(s2()); });
      s1(1)(2)(3)(4);
      assert.deepEqual(result, [6, 12]);
    });
    it('supports dedupe', function() {
      var result = [];
      var s1 = stream();
      var tx = t.compose(
        t.map(function(x) { return x * 2; }),
        t.dedupe()
      );
      var s2 = flyd.transduce(tx, s1);
      stream([s2], function() { result.push(s2()); });
      s1(1)(1)(2)(3)(3)(3)(4);
      assert.deepEqual(result, [2, 4, 6, 8]);
    });
  });
  describe('Ramda transducer support', function() {
    it('creates new stream with map applied', function() {
      var result = [];
      var s1 = stream();
      var tx = R.map(function(x) { return x * 3; });
      var s2 = flyd.transduce(tx, s1);
      stream([s2], function() { result.push(s2()); });
      s1(1)(2)(4)(6);
      assert.deepEqual(result, [3, 6, 12, 18]);
    });
    it('creates new stream with filter applied', function() {
      var result = [];
      var s1 = stream();
      var tx = R.pipe(
        R.map(function(x) { return x * 3; }),
        R.filter(function(x) { return x % 2 === 0; })
      );
      var s2 = flyd.transduce(tx, s1);
      stream([s2], function() { result.push(s2()); });
      s1(1)(2)(3)(4);
      assert.deepEqual(result, [6, 12]);
    });
    it('filters empty elements', function() {
      var result = [];
      var s1 = stream();
      var s2 = flyd.transduce(R.reject(R.isEmpty), s1);
      flyd.map(function (v) { result.push(v); }, s2);
      s1('foo')('')('bar')('')('')('!');
      assert.deepEqual(result, ['foo', 'bar', '!']);
    });
    it.skip('supports dedupe', function() {
      var result = [];
      var s1 = stream();
      var tx = R.compose(
        R.map(function(x) { return x * 2; }),
        R.dedupe() // Ramda has no dedupe function
      );
      var s2 = flyd.transduce(tx, s1);
      stream([s2], function() { result.push(s2()); });
      s1(1)(1)(2)(3)(3)(3)(4);
      assert.deepEqual(result, [2, 4, 6, 8]);
    });
  });
});
