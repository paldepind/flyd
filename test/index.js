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
  it('updates dependencies', function() {
    var x = stream(3);
    var x2 = stream([x], function() {
      return x() * 2;
    });
    assert.equal(x2(), x() * 2);
  });
  it('can set result by returning value', function() {
    var x = stream(3);
    var y = stream(4);
    var sum = stream([x, y], function() {
      return x() + y();
    });
    assert.equal(sum(), x() + y());
  });
  it('is updated when dependencies change', function() {
    var x = stream(3);
    var y = stream(4);
    var sum = stream([x, y], function(s) {
      return x() + y();
    });
    assert.equal(sum(), x() + y()); // 7
    x(12);
    assert.equal(sum(), x() + y()); // 16
    y(8);
    assert.equal(sum(), x() + y()); // 20
  });
  it('can set result by calling callback', function() {
    var x = stream(3);
    var y = stream(4);
    var times = 0;
    var sum = stream([x, y], function(s) {
      s(x() + y());
    });
    stream([sum], function() {
      times++;
    });
    assert.equal(sum(), x() + y()); // 7
    x(12);
    assert.equal(sum(), x() + y()); // 16
    y(8);
    assert.equal(sum(), x() + y()); // 20
    assert.equal(times, 3);
  });
  it('is not called until dependencies have value', function() {
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
    var sum = stream([x, y], function() {
      return x() + y();
    });
    var twiceSum = stream([sum], function() {
      return sum() * 2;
    });
    var sumPlusDoubleSum = stream([twiceSum, sum], function() {
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
  it('can get its own value', function() {
    var num = stream(0);
    var sum = stream([num], function(sum) {
      return (sum() || 0) + num();
    });
    num(2)(3)(8)(7);
    assert.equal(sum(), 20);
  });
  it('is called with changed streams', function() {
    var s1 = stream(0);
    var s2 = stream(0);
    var result = [];
    var dependend = stream([s1, s2], function(d, changed) {
      if (changed[0] === s1) result.push(1);
      if (changed[0] === s2) result.push(2);
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
    var doubleX = stream([x], function() {
      return x() * 2;
    });
    var setAndSum = stream([y, z], function() {
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
    var doubleX = stream([x], function dx() {
      if (x() === 3) order.push(2);
      return x() * 2;
    });
    var setAndY = stream([y], function sy() {
      x(3);
      order.push(1);
      return y();
    });
    assert.deepEqual(order, [1, 2]);
  });
  it('with static deps executes to the end', function() {
    var order = [];
    var x = stream(4);
    var y = stream(3);
    var doubleX = stream([x], function() {
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
  it('can filter values', function() {
    var result = [];
    var n = stream(0);
    var lrg5 = stream([n], function() {
      if (n() > 5) return n();
    });
    flyd.map(function(v) { result.push(v); }, lrg5);
    n(4)(6)(2)(8)(3)(4);
    assert.deepEqual(result, [6, 8]);
  });
  describe('ending a stream', function() {
    it('works for streams without dependencies', function() {
      var s = stream(1);
      s.end(true);
      assert(s.end());
      assert(s.end());
    });
    it('detaches it from dependencies', function() {
      var x = stream(3);
      var y = stream(2);
      var sum = stream([y, x], function() {
        return y() * x();
      });
      assert.equal(y.listeners.length, 1);
      assert.equal(x.listeners.length, 1);
      sum.end(true);
      assert.equal(y.listeners.length, 0);
      assert.equal(x.listeners.length, 0);
      assert(sum.end());
    });
    it('ends its dependents', function() {
      var x = stream(3);
      var y = stream([x], function() {
        return 2 * x();
      });
      var z = stream([y], function() {
        return 2 * y();
      });
      assert.equal(z(), x() * 2 * 2);
      x.end(true);
      assert(x.end());
      assert.equal(x.listeners.length, 0);
      assert(y.end());
      assert.equal(y.listeners.length, 0);
      assert(z.end());
    });
    it('updates children if stream ends after recieving value', function() {
      var x = stream(3);
      var whenX2 = stream([x], function() { if (x() === 0) return true; });
      var y = stream([x], function(self) {
        return x();
      });
      flyd.endsOn(whenX2, y);
      var z = stream([y], function() { return y(); });
      assert.equal(y(), z());
      x(2);
      assert.equal(y(), z());
      assert(!y.end());
      assert(!z.end());
      x(0);
      assert.equal(x.listeners.length, 1);
      assert(y.end());
      assert.equal(y.listeners.length, 0);
      assert(z.end());
      assert.equal(2, y());
      assert.equal(2, z());
    });
    it('works if end stream has initial value', function() {
      var killer = stream(true);
      var x = stream(1);
      var y = flyd.endsOn(killer, stream([x], function(self) {
        return 2 * x();
      }));
      x(2);
      assert.equal(undefined, y.end());
      assert.equal(2 * x(), y());
    });
    it('end stream does not have value even if base stream has initial value', function() {
      var killer = stream(true);
      var x = stream(1);
      var y = flyd.endsOn(killer, stream([x], function(self) {
        return 2 * x();
      }));
      assert.equal(false, y.end.hasVal);
    });
    it('ends stream can be changed without affecting listeners', function() {
      var killer1 = stream();
      var killer2 = stream();
      var ended = false;
      var x = stream(1);
      var y = flyd.endsOn(killer1, stream([x], function(self) {
        return 2 * x();
      }));
function fastUpdate(s, n) {
  var i, list;
  if (n !== undefined && n !== null && isFunction(n.then)) {
    n.then(function(n) { fastUpdate(s, n); });
  } else {
    s.val = n;
    s.hasVal = true;
    for (i = 0; i < s.listeners.length; ++i) {
      list = s.listeners[i];
      if (list.end !== s) list.depsChanged[0] = s;
      else endStream(list);
    }
  }
}
      flyd.map(function() { ended = true; }, y.end);
      flyd.endsOn(killer2, y);
      killer2(true);
      assert(ended);
    });
    it('end stream can be set on top level stream', function() {
      var killer = stream();
      var s = flyd.endsOn(killer, stream(1));
      assert.notEqual(s.end(), true);
      killer(true);
      assert.equal(s.end(), true);
    });
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
    it('handles function returning undefined', function() {
      var x = stream(1);
      var maybeDoubleX = flyd.map(function(x) {
        return x > 3 ? 2*x : undefined;
      }, x);
      assert.equal(undefined, maybeDoubleX());
      assert.equal(true, maybeDoubleX.hasVal);
      x(4);
      assert.equal(8, maybeDoubleX());
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
    it('ends only when both merged streams have ended', function() {
      var result = [];
      var s1 = stream();
      var s2 = stream();
      s1and2 = flyd.merge(s1, s2);
      flyd.map(function(v) { result.push(v); }, s1and2);
      s1(12)(2); s2(4)(44); s1(1);
      s1.end(true);
      assert(!s1and2.end());
      s2(12)(2);
      s2.end(true);
      assert(s1and2.end());
      assert.deepEqual(result, [12, 2, 4, 44, 1, 12, 2]);
    });
  });
  describe('ap', function() {
    it('applies functions in stream', function() {
      var a = stream(function(x) { return 2*x; });
      var v = stream(3);
      var s = a.ap(v);
      assert.equal(s(), 6);
      a(function(x) { return x/3; });
      assert.equal(s(), 1);
      v(9);
      assert.equal(s(), 3);
    });
    it('is compositive', function() {
      var a = stream(function(x) { return x * 2; });
      var u = stream(function(x) { return x + 5; });
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
    it('applies functions if streams have no initial value', function() {
      var result = [];
      var add = flyd.curryN(2, function(x, y) { return x + y; });
      var numbers1 = stream();
      var numbers2 = stream();
      var addToNumbers1 = flyd.map(add, numbers1);
      var added = addToNumbers1.ap(numbers2);
      flyd.map(function (n) { result.push(n); }, added);
      numbers1(3); numbers2(2); numbers1(4);
      assert.deepEqual(result, [5, 6]);
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
    it('can create dependent stream inside stream', function() {
      var one = flyd.stream();
      stream([one], function(self) {
       self(flyd.stream([], function() { }));
      });
      one(1);
    });
    it('can create immediate dependent stream inside stream', function() {
      var one = flyd.stream();
      stream([one], function(self) {
       self(flyd.immediate(flyd.stream([], function() { })));
      });
      one(1);
    });
    it('creating a stream inside a stream all dependencies are updated', function() {
      var result = [];
      var str = flyd.stream();
      flyd.map(function(x) {
        result.push(x);
      }, str);
      flyd.map(function(x) {
        // create a stream, the first dependant on `str` should still be updated
        flyd.stream([], function(self) {});
      }, str);
      str(1);
      str(2);
      str(3);
      assert.deepEqual(result, [1, 2, 3]);
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
    it('handles reduced stream and ends', function() {
      var result = [];
      var s1 = stream();
      var tx = t.compose(
        t.map(function(x) { return x * 2; }),
        t.take(3)
      );
      var s2 = flyd.transduce(tx, s1);
      stream([s2], function() { result.push(s2()); });
      s1(1)(2);
      assert.notEqual(true, s2.end());
      s1(3);
      assert.equal(true, s2.end());
      s1(4);
      assert.deepEqual(result, [2, 4, 6]);
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
    it('supports dedupe', function() {
      var result = [];
      var s1 = stream();
      var tx = R.compose(
        R.map(R.multiply(2)),
        R.dropRepeats()
      );
      var s2 = flyd.transduce(tx, s1);
      stream([s2], function() { result.push(s2()); });
      s1(1)(1)(2)(3)(3)(3)(4);
      assert.deepEqual(result, [2, 4, 6, 8]);
    });
  });
  describe('atomic updates', function() {
    it('does atomic updates', function() {
      var result = [];
      var a = stream(1);
      var b = stream([a], function() { return a() * 2; });
      var c = stream([a], function() { return a() + 4; });
      var d = stream([b, c], function(self, ch) {
        result.push(b() + c());
      });
      a(2);
      assert.deepEqual(result, [7, 10]);
    });
    it('does not glitch', function() {
      var result = [];
      var s1 = stream(1);
      var s1x2 = flyd.map(function(n) { return n*2; }, s1);
      var s2 = stream([s1, s1x2], function() { return s1() + s1x2(); });
      var s1x4 = stream([s1, s2], function() { return s1() + s2(); });
      flyd.map(function(n) { result.push(n); }, s1x4);
      s1(2)(3)(4);
      assert.deepEqual(result, [4, 8, 12, 16]);
    });
    it('handles complex dependency graph', function() {
      var result = [];
      var a = flyd.stream();
      var b = flyd.stream([a], function bs() { return a() + 1; });
      var c = flyd.stream([a], function cs() { return a() + 2; });
      var d = flyd.stream([c], function ds() { return c() + 3; });
      var e = flyd.stream([b, d], function res(){
        return b() + d();
      });
      flyd.map(function(v) { result.push(v); }, e);
      a(1)(5)(11);
      assert.deepEqual(result, [8, 16, 28]);
    });
    it('handles another complex dependency graph', function() {
      var result = [];
      var a = flyd.stream();
      var b = flyd.stream([a], function() { return a() + 1; });
      var c = flyd.stream([a], function() { return a() + 2; });
      var d = flyd.stream([a], function() { return a() + 4; });
      var e = flyd.stream([b, c, d], function() { return b() + c() + d(); });
      flyd.map(function(v) { result.push(v); }, e);
      a(1)(2)(3);
      assert.deepEqual(result, [10, 13, 16]);
    });
    it('is called with all changed dependencies', function() {
      var result = [];
      var a = flyd.stream(0);
      var b = flyd.stream([a], function() { return a() + 1; });
      var c = flyd.stream([a], function() { return a() + 2; });

      var d = flyd.stream(0);
      var e = flyd.stream([d], function() { return d() + 4; });
      var f = flyd.stream([d], function() { return d() + 5; });
      var g = flyd.stream([d], function() { return d() + 6; });

      var h = flyd.stream([a, b, c, d, e, f, g], function(self, changed) {
        var vals = changed.map(function(s) { return s(); });
        result.push(vals);
        return 1;
      });
      a(1); d(2); a(3);
      assert.deepEqual(result, [
        [], [1, 3, 2], [2, 8, 7, 6], [3, 5, 4]
      ]);
    });
  });
});
