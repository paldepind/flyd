# flyd-takeuntil
Emit values from a stream until a second stream emits a value.

__Graph__

```
a:               {---1---2---3---4}
b:               {---------x------}
takeUntil(a, b): {---1---2--------}
```

__Signature__

`Stream a -> Stream b -> Stream a`

__Usage__

```javascript
const takeUntil = require('flyd/module/takeuntil')

const source = flyd.stream()
const end = flyd.stream()
const result = takeUntil(source, end)

source(1)(2)
result() // 2
source(3)
result() // 3

end(true)
result() // 3
source(4)(5)
result() // 3
```
