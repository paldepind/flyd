var assert = require('assert');

var flyd = require('../lib/index');
var stream = flyd.stream;
var combine = flyd.combine;
var on = flyd.on;

function double(x) {
    return 2 * x;
}

describe('more stream', function() {

    describe('paldepind/flyd/issues/105', function() {

        it('Non-atomic update of dependent stream created within a dependent stream', function() {
            var result = [];
            var a = flyd.stream();
            a._name = 'a';
            var globul = flyd.on(body, a);
            globul._name = 'globul';

            function body(v) {
                var b = flyd.stream(v);
                b._name = 'b';
                var d = flyd.stream(v);
                d._name = 'd';
                var c = flyd.combine(function(_b, _d) {
                    return 'c_' + _b() + '+' + _d();
                }, [b, d]);
                c._name = 'c';

                var out = flyd.on(function(v) {
                    result.push(v);
                }, c);
                out._name = 'out';
            }

            a(2);

            assert.deepEqual(result, ['c_2+2']);
        });

        it('alternative case', function() {
            var result = [];
            var q = flyd.stream(2);
            q.mark = 'q';
            var qq = flyd.map(double, q);
            qq.mark = 'qq';
            flyd.on(body, qq);

            function body(v) {
                var a = flyd.stream(v);
                a.mark = 'a';
                var aa = flyd.map(double, a);
                aa.mark = 'aa';
                var aaa = flyd.map(double, aa);
                aaa.mark = 'aaa';
                flyd.on(body2, aaa);
                function body2(v) {
                    var b = flyd.stream(v);
                    b.mark = 'b';
                    var bb = flyd.map(double, b);
                    bb.mark = 'bb';
                    flyd.on(body3, bb);

                    function body3(v) {
                        var c = flyd.stream(v);
                        c.mark = 'c';
                        flyd.on(function(v) {
                            result.push(v)
                        }, c);
                    }
                }
            }

            assert.deepEqual(result, [32]);
        });
    });

    describe('multistream', function() {

        it('plain multistream combine', function() {

            var result = [];
            var c = flyd.combine(function(q, w, e, r) {
                return [q(), w(), e(), r()];
            }, [stream(1), stream(2), stream(3), stream(4)]);
            flyd.on(function(v) {
                result.push(v);
            }, c);

            assert.deepEqual(result, [[1, 2, 3, 4]]);
        });

        it('nested multistream combine', function() {
            var ticker = { base: 0, combine: 0, collapse: 0 };
            var result = [];
            var q = stream(2);
            q.mark = 'q';
            var qq = flyd.map(double, q);
            qq.mark = 'qq';

            function body(v) {

                ticker.base++;

                var h = flyd.combine(function(q, w, e, r) {
                    ticker.combine++;
                    return [q(), w(), e(), r()];
                }, [stream(1), stream(2), stream(3), stream(4)]);
                flyd.on(function(v) {
                    ticker.collapse++;
                    result.push(v);
                }, h);

                assert.equal(result.length, 0);
            }

            flyd.on(body, qq);

            assert.equal(ticker.base, ticker.combine);

            assert.equal(ticker.collapse, 1);

            assert.equal(result.length, 1);
            assert.deepEqual(result, [[1, 2, 3, 4]]);
        });
    });
});
