var assert = require('assert');
var Promise = require('bluebird');
var R = require('ramda');
var t = require('transducers.js');

var flyd = require('../lib');
var stream = flyd.stream;
var combine = flyd.combine;
var map = flyd.map;
var ap = flyd.ap;
var chain = flyd.chain;

// Some combinators
function doubleFn(x) { return x() * 2; }
function sumFn(x, y) { return x() + y(); }
function identityLift(x) { return x(); }

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
  it('can works with JSON.stringify', function() {
    var obj = {
      num: stream(23),
      str: stream('string'),
      obj: stream({ is_object: true })
    };
    var expected_outcome = {
      num: 23,
      str: 'string',
      obj: {
        is_object: true
      }
    };
    var jsonObject = JSON.parse(JSON.stringify(obj));
    assert.deepEqual(jsonObject, expected_outcome);
  });
  it("let's explicit `undefined` flow down streams", function() {
    var result = [];
    var s1 = stream(undefined);
    flyd.map(function(v) { result.push(v); }, s1);
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

  describe('dependent streams', function() {
    it('updates dependencies', function() {
      var x = stream(3);
      var x2 = combine(doubleFn, [x]);
      assert.equal(x2(), x() * 2);
    });
    it('can set result by returning value', function() {
      var x = stream(3);
      var y = stream(4);
      var sum = combine(sumFn, [x, y]);
      assert.equal(sum(), x() + y());
    });
    it('is updated when dependencies change', function() {
      var x = stream(3);
      var y = stream(4);
      var sum = combine(sumFn, [x, y]);
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
      var sum = combine(sumFn, [x, y]);
      combine(function() {
        times++;
      }, [sum]);
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
      combine(function(x, y) {
        called++;
        return x() + y();
      }, [x, y]);
      x(2); x(1); y(2); y(4); x(2);
      assert.equal(called, 3);
    });
    it('streams can lead into other streams', function() {
      var x = stream(3);
      var y = stream(4);
      var sum = combine(sumFn, [x, y]);
      var twiceSum = combine(doubleFn, [sum]);
      var sumPlusDoubleSum = combine(sumFn, [twiceSum, sum]);
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
      var sum = combine(function(num, self) {
        return (self() || 0) + num();
      }, [num]);
      num(2)(3)(8)(7);
      assert.equal(sum(), 20);
    });
    it('is called with changed streams', function() {
      var s1 = stream(0);
      var s2 = stream(0);
      var result = [];
      combine(function(s1, s2, self, changed) {
        if (changed[0] === s1) result.push(1);
        if (changed[0] === s2) result.push(2);
      }, [s1, s2]);
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
      var doubleX = combine(doubleFn, [x]);
      var setAndSum = combine(function(y, z) {
        x(3);
        return z() + y();
      }, [y, z]);
      z(4);
      assert.equal(setAndSum(), 7);
      assert.equal(doubleX(), 6);
    });
    it('executes to the end before handlers are triggered', function() {
      var order = [];
      var x = stream(4);
      var y = stream(3);
      combine(function dx(x) {
        if (x() === 3) order.push(2);
        return x() * 2;
      }, [x]);
      combine(function sy(y) {
        x(3);
        order.push(1);
        return y();
      }, [y]);
      assert.deepEqual(order, [1, 2]);
    });
    it('with static deps executes to the end', function() {
      var order = [];
      var x = stream(4);
      var y = stream(3);
      combine(function(x) {
        if (x() === 3) order.push(2);
        return x() * 2;
      }, [x]);
      combine(function(y) {
        x(3);
        order.push(1);
        return y();
      }, [y]);
      assert.equal(order[0], 1);
      assert.equal(order[1], 2);
    });
    it('can filter values', function() {
      var result = [];
      var n = stream(0);
      var lrg5 = combine(function(n) {
        if (n() > 5) return n();
      }, [n]);
      flyd.map(function(v) { result.push(v); }, lrg5);
      n(4)(6)(2)(8)(3)(4);
      assert.deepEqual(result, [6, 8]);
    });
    it('can set another stream\'s value multiple times from inside a stream', function() {
      var result = [];
      var a = stream();
      var b = stream();
      combine(function(b) {
        a(b());
        a();
        a(b() + 1);
        assert.equal(a(), 2);
      }, [b]);
      combine(function(a) {
        result.push(a());
      }, [a]);
      b(1);
      assert.deepEqual(result, [1, 2]);
    });
    it('can combine streams and project deps as args', function() {
      var a = flyd.stream();
      var b = flyd.stream(0);
      var collect = function(x, y, self) { return (self() || []).concat([x(), y()]); };

      var history = flyd.combine(collect, [a, b]);
      a(1)(2); // [1, 0, 2, 0]
      b(3);    // [1, 0, 2, 0, 2, 3]
      a(4);    // [1, 0, 2, 0, 2, 3, 4, 3]
      assert.deepEqual(history(), [
        1, 0, 2, 0, 2, 3, 4, 3
      ]);
    });
  });

  describe('streams created within dependent stream bodies', function() {
    it('if dependencies are met it is updated eventually', function() {
      var result;
      stream(1).pipe(map(function() {
        var n = flyd.stream(1);
        n.pipe(map(function(v) { result = v + 100; }));
      }));
      assert.equal(result, 101);
    });
    it('if dependencies are not met at creation it is updated after their dependencies are met', function() {
      var result;
      stream(1).pipe(map(function() {
        var n = stream();
        n.pipe(map(function(v) { result = v + 100; }));
        n(1);
      }));
      assert.equal(result, 101);
    });
    it('if a streams end stream is called it takes effect immediately', function() {
      var result = undefined;
      stream(1).pipe(map(function() {
        var n = stream();
        n.pipe(map(function(v) { result = v + 100; }));
        n.end(true);
        n(1);
        n(2);
      }));
      assert.equal(result, undefined);
    });
  })

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
      var sum = combine(function(x, y) {
        return y() * x();
      }, [x, y]);
      assert.equal(y.listeners.length, 1);
      assert.equal(x.listeners.length, 1);
      sum.end(true);
      assert.equal(y.listeners.length, 0);
      assert.equal(x.listeners.length, 0);
      assert(sum.end());
    });
    it('ends its dependents', function() {
      var x = stream(3);
      var y = combine(doubleFn, [x]);
      var z = combine(doubleFn, [y]);
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
      var whenX2 = combine(function(x) {
        if (x() === 0) {
          return true;
        }
      }, [x]);
      var y = combine(identityLift, [x]);
      flyd.endsOn(whenX2, y);
      var z = combine(identityLift, [y]);
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
      var y = flyd.endsOn(killer, combine(doubleFn, [x]));
      x(2);
      assert.equal(undefined, y.end());
      assert.equal(2 * x(), y());
    });
    it('end stream does not have value even if base stream has initial value', function() {
      var killer = stream(true);
      var x = stream(1);
      var y = flyd.endsOn(killer, combine(doubleFn, [x]));
      assert.equal(false, y.end.hasVal);
    });
    it('ends stream can be changed without affecting listeners', function() {
      var killer1 = stream();
      var killer2 = stream();
      var ended = false;
      var x = stream(1);
      var y = flyd.endsOn(killer1, combine(doubleFn, [x]));
      flyd.map(function() {
        ended = true;
      }, y.end);
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

  describe('Promises', function() {
    describe('fromPromise', function() {
      it('pushes result of promise down the stream', function(done) {
        var s = flyd.fromPromise(Promise.resolve(12));
        combine(function(s) {
          assert.equal(s(), 12);
          done();
        }, [s]);
      });
      it('recursively unpacks promise', function(done) {
        var s = flyd.fromPromise(new Promise(function(res) {
          setTimeout(function() {
            res(new Promise(function(res) {
              setTimeout(res.bind(null, 12));
            }));
          }, 20);
        }));
        combine(function(s) {
          assert.equal(s(), 12);
          done();
        }, [s]);
      });

      it('does not process out of order promises', function(done) {
        var promises = [];
        var delay = function(ms, val) {
          var p = new Promise(function(res) {
            setTimeout(function() {
              res(val);
            }, ms)
          });
          promises.push(p);
          return p;
        };

        var s = stream();
        var res = s.chain(function(val) {
          return flyd.fromPromise(delay(val, val));
        })
          .pipe(flyd.scan(function(acc, v) {
            return acc + v;
          }, 0));
        s(100)(50)(70)(200);

        Promise.all(promises).then(function() {
          assert.equal(res(), 200);
          done();
        });

      });
    });
    describe('flattenPromise', function() {
      it('processes out of order promises', function(done) {
        var promises = [];
        var delay = function(ms, val) {
          var p = new Promise(function(res) {
            setTimeout(function() {
              res(val);
            }, ms)
          });
          promises.push(p);
          return p;
        };

        var s = stream();
        var res = s.map(function(val) {
          return delay(val, val);
        })
          .pipe(flyd.flattenPromise)
          .pipe(flyd.scan(function(acc, v) {
            return acc + v;
          }, 0));
        s(100)(50)(70)(200);

        Promise.all(promises).then(function() {
          assert.equal(res(), 420);
          done();
        });

      });
    });
  });

  describe('on', function() {
    it('is invoked when stream changes', function() {
      var s = flyd.stream();
      var result = [];
      var f = function(val) { result.push(val); };
      flyd.on(f, s);
      s(1)(2);
      assert.deepEqual(result, [1, 2]);
    });
  });

  describe('map', function() {
    it('maps a function', function() {
      var x = stream(3);
      var doubleX = x.pipe(map(function(x) { return 2 * x; }));
      assert.equal(doubleX(), 6);
      x(1);
      assert.equal(doubleX(), 2);
    });
    it('maps a function', function() {
      var x = stream(3);
      var doubleX = flyd.map(function(x) { return 2 * x; }, x);
      assert.equal(doubleX(), 6);
      x(1);
      assert.equal(doubleX(), 2);
    });
    it('handles function returning undefined', function() {
      var x = stream(1);
      var maybeDoubleX = flyd.map(function(x) {
        return x > 3 ? 2 * x : undefined;
      }, x);
      assert.equal(undefined, maybeDoubleX());
      assert.equal(true, maybeDoubleX.hasVal);
      x(4);
      assert.equal(8, maybeDoubleX());
    });
    it('is curried', function() {
      var x = stream(3);
      var doubler = flyd.map(function(x) { return 2 * x; });
      var quadroX = doubler(doubler(x));
      assert.equal(quadroX(), 12);
      x(2);
      assert.equal(quadroX(), 8);
    });
    it('returns equivalent stream when mapping identity', function() {
      var x = stream(3);
      var x2 = x.pipe(map(function(a) { return a; }));
      assert.equal(x2(), x());
      x('foo');
      assert.equal(x2(), x());
    });
    it('is compositive', function() {
      function f(x) { return x * 2; }
      function g(x) { return x + 4; }
      var x = stream(3);
      var s1 = x.pipe(map(g)).pipe(map(f));
      var s2 = x.pipe(map(function(x) { return f(g(x)); }));
      assert.equal(s1(), s2());
      x(12);
      assert.equal(s1(), s2());
    });
  });

  describe('chain', function() {
    it('applies function to values in stream', function() {
      var result = [];
      function f(v) {
        result.push(v);
        return stream();
      }
      var s = stream();
      flyd.chain(f, s);
      s(1)(2)(3)(4)(5);
      assert.deepEqual(result, [1, 2, 3, 4, 5]);
    });
    it('returns stream with result from all streams created by function', function() {
      var result = [];
      function f(v) {
        var s = stream();
        setImmediate(function() {
          s(v + 1)(v + 2)(v + 3);
        });
        return s;
      }
      var s = stream();
      flyd.map(function(v) {
        result.push(v);
      }, flyd.chain(f, s));
      s(1)(3)(5);
      setImmediate(function() {
        assert.deepEqual(result, [2, 3, 4,
          4, 5, 6,
          6, 7, 8]);
      });
    });
    it('passed bug outlined in https://github.com/paldepind/flyd/issues/31', function(done) {
      function delay(val, ms) {
        var outStream = flyd.stream();

        setTimeout(function() {
          outStream(val);
          outStream.end(true);
        }, ms);

        return outStream;
      }

      var main = delay(1, 500);
      var merged = flyd.chain(function(v) {
        return delay(v, 1000)
      }, main);

      flyd.on(function() {
        assert(main() === 1);
        assert(merged() === 1);
        done();
      }, merged.end);
    });

    it('preserves ordering', function() {
      function delay(val, ms) {
        var outStream = flyd.stream();

        setTimeout(function() {
          outStream(val);
          outStream.end(true);
        }, ms);

        return outStream;
      }

      var s = stream();

      var s2 = s
        .pipe(chain(function(val) {
          return delay(val, 100);
        }));
      s(1)(2)(3)(4);

      flyd.on(function(val) {
        assert.equal(val, 4);
      }, s2)
    });
  });

  describe('scan', function() {
    it('has initial acc as value when stream is undefined', function() {
      var numbers = stream();
      var sum = flyd.scan(function(sum, n) {
        return sum + n;
      }, 0, numbers);
      assert.equal(sum(), 0);
    });
    it('can sum streams of integers', function() {
      var numbers = stream();
      var sum = flyd.scan(function(sum, n) {
        return sum + n;
      }, 0, numbers);
      numbers(3)(2)(4)(10);
      assert.equal(sum(), 19);
    });
    it('is curried', function() {
      var numbers = stream();
      var sumStream = flyd.scan(function(sum, n) {
        return sum + n;
      }, 0);
      var sum = sumStream(numbers);
      numbers(3)(2)(4)(10);
      assert.equal(sum(), 19);
    });
    it('passes undefined', function() {
      var x = stream();
      var scan = flyd.scan(function(acc, x) {
        return acc.concat([x]);
      }, [], x);

      x(1)(2)(undefined)(3)(4);

      assert.deepEqual(scan(), [1, 2, undefined, 3, 4]);
    });
  });

  describe('merge', function() {
    it('can sum streams of integers', function() {
      var result = [];
      var s1 = stream();
      var s2 = stream();
      var merged = flyd.merge(s1, s2);
      combine(function(merged) {
        result.push(merged());
      }, [merged]);
      s1(12)(2); s2(4)(44); s1(1); s2(12)(2);
      assert.deepEqual(result, [12, 2, 4, 44, 1, 12, 2]);
    });
    it('is curried', function() {
      var result = [];
      var s1 = stream();
      var mergeWithS1 = flyd.merge(s1);
      var s2 = stream();
      var s1and2 = mergeWithS1(s2);
      flyd.map(function(v) { result.push(v); }, s1and2);
      s1(12)(2); s2(4)(44); s1(1); s2(12)(2);
      assert.deepEqual(result, [12, 2, 4, 44, 1, 12, 2]);
    });
    it('should pass defined undefined along', function() {
      var s1 = stream();
      var s2 = stream(undefined);
      var merged = flyd.merge(s1, s2);

      assert.equal(merged(), undefined);

      s1(25);
      assert.equal(merged(), 25);

      s1(undefined);
      assert.equal(merged(), undefined);

      s2(15);
      assert.equal(merged(), 15);
    });
    it('should work for s1 being defined first', function() {
      var s1 = stream(undefined);
      var s2 = stream();
      var merged = flyd.merge(s1, s2);
      assert.equal(merged(), undefined);

      s1(25);
      assert.equal(merged(), 25);
    });
    it('ends only when both merged streams have ended', function() {
      var result = [];
      var s1 = stream();
      var s2 = stream();
      var s1and2 = flyd.merge(s1, s2);
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
      var a = stream(function(x) { return 2 * x; });
      var v = stream(3);
      var s = a.pipe(ap(v));
      assert.equal(s(), 6);
      a(function(x) { return x / 3; });
      assert.equal(s(), 1);
      v(9);
      assert.equal(s(), 3);
    });
    it('is compositive', function() {
      var a = stream(function(x) { return x * 2; });
      var u = stream(function(x) { return x + 5; });
      var v = stream(8);
      var s1 = a
        .pipe(map(function(f) {
          return function(g) {
            return function(x) {
              return f(g(x));
            };
          };
        }))
        .pipe(ap(u))
        .pipe(ap(v));
      var s2 = a.pipe(ap(u.pipe(ap(v))));
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
      var s1 = stream(0);
      var s2 = stream(0);
      var s3 = stream(0);
      var sum = flyd.map(sumThree, s1).pipe(ap(s2)).pipe(ap(s3));
      flyd.map(function(v) { result.push(v); }, sum);
      s1(3); s2(2); s3(5);
      assert.deepEqual(result, [0, 3, 5, 10]);
    });
    it('applies functions if streams have no initial value', function() {
      var result = [];
      var add = flyd.curryN(2, function(x, y) { return x + y; });
      var numbers1 = stream();
      var numbers2 = stream();
      var addToNumbers1 = flyd.map(add, numbers1);
      var added = addToNumbers1.pipe(ap(numbers2));
      flyd.map(function(n) { result.push(n); }, added);
      numbers1(3); numbers2(2); numbers1(4);
      assert.deepEqual(result, [5, 6]);
    });
  });

  describe('of', function() {
    it('can be accessed through the constructor property', function() {
      var s1 = stream(2);
      var s2 = s1.constructor.of(3);
      var s3 = s2.constructor['fantasy-land/of'](3);
      assert.equal(flyd.isStream(s2), true);
      assert.equal(s2(), 3);
      assert.equal(s3(), 3);
    });
    it('returns a stream with the passed value', function() {
      var s1 = stream(2);
      var s2 = s1.of(3);
      assert.equal(s2(), 3);
    });
    it('has identity', function() {
      var a = stream();
      var id = function(a) { return a; };
      var v = stream(12);
      assert.equal(a.of(id).pipe(ap(v))(), v());
    });
    it('is homomorphic', function() {
      var a = stream(0);
      var f = function(x) { return 2 * x; };
      var x = 12;
      assert.equal(a.of(f).pipe(ap(a.of(x)))(), a.of(f(x))());
    });
    it('is interchangeable', function() {
      var y = 7;
      var a = stream();
      var u = stream()(function(x) { return 3 * x; });
      assert.equal(u.pipe(ap(a.of(y)))(),
        a.of(function(f) { return f(y); }).pipe(ap(u))());
    });
    it('can create dependent stream inside stream', function() {
      var one = flyd.stream();
      combine(function(one, self) {
        self(flyd.combine(function() { }, []));
      }, [one]);
      one(1);
    });
    it('can create immediate dependent stream inside stream', function() {
      var one = flyd.stream();
      combine(function(one, self) {
        self(flyd.immediate(flyd.combine(function() { }, [])));
      }, [one]);
      one(1);
    });
    it('creating a stream inside a stream all dependencies are updated', function() {
      var result = [];
      var str = flyd.stream();
      flyd.map(function(x) {
        result.push(x);
      }, str);
      flyd.map(function() {
        // create a stream, the first dependant on `str` should still be updated
        flyd.combine(function() { }, []);
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
      combine(function(s2) { result.push(s2()); }, [s2]);
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
      combine(function(s2) { result.push(s2()); }, [s2]);
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
      combine(function(s2) { result.push(s2()); }, [s2]);
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
      combine(function(s2) { result.push(s2()); }, [s2]);
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
      combine(function(s2) { result.push(s2()); }, [s2]);
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
      combine(function(s2) { result.push(s2()); }, [s2]);
      s1(1)(2)(3)(4);
      assert.deepEqual(result, [6, 12]);
    });
    it('filters empty elements', function() {
      var result = [];
      var s1 = stream();
      var s2 = flyd.transduce(R.reject(R.isEmpty), s1);
      flyd.map(function(v) { result.push(v); }, s2);
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
      combine(function(s2) { result.push(s2()); }, [s2]);
      s1(1)(1)(2)(3)(3)(3)(4);
      assert.deepEqual(result, [2, 4, 6, 8]);
    });
    // @todo: Better transducer tests!!
  });

  describe('atomic updates', function() {
    it('does atomic updates', function() {
      var result = [];
      var a = stream(1);
      var b = combine(doubleFn, [a]);
      var c = combine(function(a) { return a() + 4; }, [a]);
      combine(function(b, c) {
        result.push(b() + c());
      }, [b, c]);
      a(2);
      assert.deepEqual(result, [7, 10]);
    });
    it('does not glitch', function() {
      var result = [];
      var s1 = stream(1);
      var s1x2 = flyd.map(function(x) { return x * 2; }, s1);
      var s2 = combine(sumFn, [s1, s1x2]);
      var s1x4 = combine(sumFn, [s1, s2]);
      flyd.map(function(n) { result.push(n); }, s1x4);
      s1(2)(3)(4);
      assert.deepEqual(result, [4, 8, 12, 16]);
    });
    it('handles complex dependency graph', function() {
      var result = [];
      var a = flyd.stream();
      var b = flyd.combine(function(a) { return a() + 1; }, [a]);
      var c = flyd.combine(function(a) { return a() + 2; }, [a]);
      var d = flyd.combine(function(c) { return c() + 3; }, [c]);
      var e = flyd.combine(function(b, d) {
        return b() + d();
      }, [b, d]);
      flyd.map(function(v) { result.push(v); }, e);
      a(1)(5)(11);
      assert.deepEqual(result, [8, 16, 28]);
    });
    it('handles another complex dependency graph', function() {
      var result = [];
      var a = flyd.stream();
      var b = flyd.combine(function(a) { return a() + 1; }, [a]);
      var c = flyd.combine(function(a) { return a() + 2; }, [a]);
      var d = flyd.combine(function(a) { return a() + 4; }, [a]);
      var e = flyd.combine(function(b, c, d) { return b() + c() + d(); }, [b, c, d]);
      flyd.map(function(v) { result.push(v); }, e);
      a(1)(2)(3);
      assert.deepEqual(result, [10, 13, 16]);
    });
    it('is called with all changed dependencies', function() {
      var result = [];
      var a = flyd.stream(0);
      var b = flyd.combine(function(a) { return a() + 1; }, [a]);
      var c = flyd.combine(function(a) { return a() + 2; }, [a]);

      var d = flyd.stream(0);
      var e = flyd.combine(function(d) { return d() + 4; }, [d]);
      var f = flyd.combine(function(d) { return d() + 5; }, [d]);
      var g = flyd.combine(function(d) { return d() + 6; }, [d]);

      flyd.combine(function(a, b, c, d, e, f, g, self, changed) {
        var vals = changed.map(function(s) { return s(); });
        result.push(vals);
        return 1;
      }, [a, b, c, d, e, f, g]);
      a(1); d(2); a(3);
      assert.deepEqual(result, [
        [], [1, 3, 2], [2, 8, 7, 6], [3, 5, 4]
      ]);
    });
  });

  describe('fantasy-land', function() {
    it('map', function() {
      var s = stream(1);
      var mapped = R.map(R.add(3), s);
      assert.equal(mapped(), 4);
      assert.equal(s(), 1);
    });

    it('chain', function() {
      var s = stream(1);
      var chained = R.chain(R.compose(stream, R.add(3)), s);
      assert.equal(chained(), 4);
      assert.equal(s(), 1);
    });

    it('ap', function() {
      var s = stream(R.add(3));
      var val = stream(3);
      var applied = R.ap(s, val);
      assert.equal(applied(), 6);
    });

    it('old ap', function() {
      var s = stream(R.add(3))
        .ap(stream(3));
      assert.equal(s(), 6);
    });

    it('of', function() {
      var s = flyd.stream(3);
      var s2 = s['fantasy-land/of'](5);
      assert(flyd.isStream(s));
      assert.equal(s(), 3);

      assert(flyd.isStream(s2));
      assert.equal(s2(), 5);
    })
  });
});
