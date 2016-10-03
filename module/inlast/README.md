# flyd-inlast

Creates a stream that emits an array of all values from a source stream which where emitted in a specified duration.

Using a duration `ms`, it will collect all values that are emitted within an `ms` time period, buffering them into an array.

"Get a list of values that were emitted from a stream __in the last__ n milliseconds"

Also see [aftersilence](/module/aftersilence).

__Graph__

```
(each tick is 10ms)
a:             {--2----3--4-----}
inlast(40, a): {--.----.--.-----}
                  [2]  [3][3,4]
``` 

__Signature__

```
Integer -> Stream a -> Stream [a]
```

__Usage__

```js
const inlast = require('flyd/module/inlast')

const s = flyd.stream()
const in = inlast(100, s)
in() // -> []
s(1)(2)(3); in() // -> [1,2,3]

// emit a first value, wait 200ms, then emit a second value.
// in stream will only emit the second most recent value, discarding the older one.
s(1)
setTimeout(()=> {
  s(2)
  in() // -> [2]
}, 200)
```
