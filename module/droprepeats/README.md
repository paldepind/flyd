# flyd-droprepeats

Drops consecutively repeated values from a
[Flyd](https://github.com/paldepind/flyd) stream. Equality is determined by reference.

## dropRepeats(s)

__Graph__

```
a:              {---11--12-2-3-4-}
dropRepeats(a): {---1----2---3-4-}
```

__Signature__

`Stream a -> Stream a`

__Usage__

```js
const dropRepeats = require('flyd/module/droprepeats').dropRepeats

const s = flyd.stream()
const noRepeats = dropRepeats(s)
const collect = flyd.scan((ls, n) => ls.concat(n), [], noRepeats)
s(1)(2)(2)(3)
collect() // [1, 2, 3]
```

## dropRepeatsWith(fn, s)

Drops repeated values from stream `s`, but also takes a function `fn` that
will be used to determine equality.

__Signature__

`(a -> a -> Boolean) -> Stream a -> Stream a`

__Usage__

```js
const dropRepeatsWith = require('flyd/module/droprepeats').dropRepeatsWith
const s = flyd.stream()

// Ramda's `equals` determines equality by value
const R = require('ramda')
const noRepeats = dropRepeatsWith(R.equals, s)
const collect = flyd.scan((ls, n) => ls.concat(n), [], noRepeats)
s({ foo: 'bar' })
s({ foo: 'bar' })
collect() // [{ foo: 'bar' }]
```
