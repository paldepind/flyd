# flyd-sampleon

Sample from the second stream every time an event occurs on the first
stream.

__Graph__

```
a:              {--t--t--t-------t}
b:              {---1---2---3---4-}
sampleOn(a, b): {-----1--2-------4}
```

__Signature__

`Stream a -> Stream b -> Stream b`

__Usage__

```javascript
const sampleOn = require('flyd/module/sampleon')

const sample = flyd.stream()
const on = flyd.stream()
const result = sampleOn(on, sample)

on(true)
result() // undefined

sample(1)
on(true)
result() // 1

sample(2)
sample(3)
on(true)
result() // 3
```
