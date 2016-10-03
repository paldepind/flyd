# flyd-previous

Returns a stream that is always one value behind the original stream.

__Graph__

```
a:            {---1---2---3---4}
previous(a):  {-------1---2---3}
```

__Signature__

`Stream a -> Stream a`

__Usage__

```
const previous = require('flyd/module/previous')

const s = flyd.stream()
const prev = previous(s)

s(1)
prev() // undefined
s(2)
prev() // 1
s(3)
prev() // 2
```
