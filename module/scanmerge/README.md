# flyd-scanmerge
Flyd module for conveniently merging and scanning several streams into one.

scanmerge takes an array of pairs of streams and scan functions. It merges all those streams using the given functions into a single stream.

A common use case is to take many UI event streams, pair each one with an updater function, so they all combine into a single UI state object.

__Graph__

```
n1:                                   {2---3----2---3}
n2:                                   {--2---2----1--}
scanMerge([[n1, add], [n2, sub]], 0): {2-0-3-1--3-2-5}
```

__Signature__

`[[Stream b, (a, b -> a)]] -> a -> Stream a`

__Usage__

```javascript
const scanMerge = require('flyd/module/scanmerge')
const add = flyd.stream(0)
const sub = flyd.stream(0)
const mult = flyd.stream(1)
const res = scanMerge([
  [add, function(sum, n) { return sum + n; }]
, [sub, function(sum, n) { return sum - n; }]
, [mult, function(sum, n) { return sum * n; }]
], 0)
add(5); sub(8); sub(4); add(12); mult(3)
res() // 15
```

```javascript
const append = flyd.stream()
const remove = flyd.stream()
const items = scanMerge([
  [append, (list, elem) => list.concat(elem)],
, [remove, (list, item) => list.filter(elm => elm !== item)]
], [])
append(1)(2)(3)(4)(5)
remove(3)
items() // [1,2,4,5]
```
