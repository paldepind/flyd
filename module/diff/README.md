# flyd-diff

Similar to map, but this function gets both the previous and the current value of the stream.

__Graph__

```
a:             {-1-1-2-3-5-}

diff(add, a):  {---2-3-5-8-}
```

__Signature__

`((a, a) -> a) -> Stream a -> Stream a`

__Usage__

```
const diff = require('flyd/module/diff')

const velocity = flyd.stream(0)
const acceleration = diff((previous, current) => current - previous, velocity)

velocity(2)(5)
acceleration() // 3

velocity(1)
acceleration() // -4
```
