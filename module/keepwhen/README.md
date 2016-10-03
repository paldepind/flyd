# flyd-keepwhen

Keeps values from the second stream when the first stream is true (truth is tested with `!== false`).

__Graph__

```
a:              {-t---f---t----}
b:              {---1---2---3--}
keepWhen(a, b): {---1-------3--}
```

__Signature__

`Stream Boolean -> Stream a -> Stream a`

__Usage__

```
const keepWhen = require('flyd/module/keepwhen')

const source = flyd.stream()
const test = flyd.stream()
const result = keepWhen(test, source)

// when stream must !== false
source(1)
result() // -> 1
source(2)
result() // -> 2
test(true)
source(3)
result() // -> 3
test(false)
source(4)
result() // -> 3
test('hi')
source(5)
result() // -> 5
// null or undefined are considered truthy for source
test(null)
source(6)
result() // -> 6
// only false will prevent values from emitting
test(false)
source(7)
result() // -> 6
```
