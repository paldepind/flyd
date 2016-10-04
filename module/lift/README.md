# flyd-lift

Merge the latest values from multiple streams into a single stream using a function.

Emits a new value every time any source stream has a new value.

__Graph__

```
a:               {---1----2----}
b:               {-----1----2--}
lift(add, a, b): {-----2--3-4--}
```

__Signature__

`( ((a, b, ...) -> c), (Stream a, Stream b, ...) ) -> Stream c`

__Usage__

```javascript
const lift = require('flyd/module/lift')

const n1 = flyd.stream(1)
const n2 = flyd.stream(4)
const n3 = flyd.stream(9)

const addThree = (a, b, c) => a + b + c
const sum = lift(addThree, n1, n2, n3)

sum() // 14

n2(5)
sum() // 15
```
