# flyd-aftersilence
Buffers values from a source stream into an array and emits the array once the source stream has had the specified duration of silence.

__Graph__

```marbles
(ticks represent 10ms)
a:                   {-1-2-3--5-6-}
afterSilence(20, a): {--------.---}
                              [1,2,3]
```

__Signature__

`(Integer, Stream a) -> Stream b`

__Example__

```javascript
const afterSilence = require('flyd/module/aftersilence')

const source = flyd.stream()
const result = flyd.afterSilence(100, source)

source(1); source(2); source(3)
result() // undefined

// wait 100ms and print result
setTimeout(() => console.log(result()), 100)
// -> prints [1,2,3]
```
