# flyd-droprepeats

Drops consecutively repeated values from a
[Flyd](https://github.com/paldepind/flyd) stream.

## API

### dropRepeats(s)

Drops repeated values from stream `s`. Equality is determined by reference.

__Signature__

`Stream a -> Stream a`

__Usage__

```js
var dropRepeats = require('flyd-droprepeats').dropRepeats;
var append = function(arr, x) {
  return arr.concat(x);
};

var s = flyd.stream();
var noRepeats = dropRepeats(s);
var collect = flyd.scan(append, [], noRepeats);
s(1)(2)(2)(3);
collect() // [1, 2, 3]
```

### dropRepeatsWith(fn, s)

Drops repeated values from stream `s`, but also takes a function `fn` that
will be used to determine equality.

__Signature__

`(a -> b -> Boolean) -> Stream a -> Stream a`

```js
var dropRepeatsWith = require('flyd-droprepeats').dropRepeatsWith;
var s = flyd.stream();
// Ramda's `equals` determines equality by value
var noRepeats = dropRepeatsWith(R.equals, s);
var collect = flyd.scan(append, [], noRepeats);
s({ foo: 'bar' });
s({ foo: 'bar' });
collect() // [{ foo: 'bar' }]
```
