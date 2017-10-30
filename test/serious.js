var assert = require('assert');

var flyd = require('../lib/index');
var stream = flyd.stream;
var combine = flyd.combine;
var on = flyd.on;

describe('more stream', function () {

    describe('paldepind/flyd/issues/105', () => {

        it('Non-atomic update of dependent stream created within a dependent stream', function () {
            const result = [];
            const a = flyd.stream();
            a._name = 'a';
            const globul = flyd.on(body, a);
            globul._name = 'globul';

            function body(v) {
                const b = flyd.stream(v);
                b._name = 'b';
                const d = flyd.stream(v);
                d._name = 'd';
                const c = flyd.combine((_b, _d) => {
                    return 'c_' + _b() + '+' + _d();
                }, [b, d]);
                c._name = 'c';

                const out = flyd.on((v) => {
                    result.push(v);
                }, c);
                out._name = 'out';
            }

            a(2);

            assert.deepEqual(result, ['c_2+2']);
        });

        it('alternative case', function () {
            const result = [];
            const double = x => 2 * x;
            const q = flyd.stream(2);
            q.mark = 'q';
            const qq = flyd.map(double, q);
            qq.mark = 'qq';
            flyd.on(body, qq);

            function body(v) {
                const a = flyd.stream(v);
                a.mark = 'a';
                const aa = flyd.map(double, a);
                aa.mark = 'aa';
                const aaa = flyd.map(double, aa);
                aaa.mark = 'aaa';
                flyd.on(body2, aaa);
                // flyd.on((v) => {
                //     result.push(v)
                // }, aaa);
                function body2(v) {
                    const b = flyd.stream(v);
                    b.mark = 'b';
                    const bb = flyd.map(double, b);
                    bb.mark = 'bb';
                    flyd.on(body3, bb);

                    function body3(v) {
                        const c = flyd.stream(v);
                        c.mark = 'c';
                        flyd.on((v) => {
                            result.push(v)
                        }, c);
                    }
                }
            }

            assert.deepEqual(result, [32]);
        });
    });

    describe('multistream', () => {

        it('plain multistream combine', () => {

            const result = [];
            const c = flyd.combine((q, w, e, r) => {
                return [q(), w(), e(), r()];
            }, [stream(1), stream(2), stream(3), stream(4)]);
            flyd.on(v => {
                result.push(v);
            }, c);

            assert.deepEqual(result, [[1, 2, 3, 4]]);
        });

        it('nested multistream combine', function () {
            const ticker = { base: 0, combine: 0, collapse: 0 };
            const result = [];
            const double = x => 2 * x;
            const q = stream(2);
            q.mark = 'q';
            const qq = flyd.map(double, q);
            qq.mark = 'qq';

            function body(v) {

                ticker.base++;

                const h = flyd.combine((q, w, e, r) => {
                    ticker.combine++;
                    return [q(), w(), e(), r()];
                }, [stream(1), stream(2), stream(3), stream(4)]);
                flyd.on(v => {
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
