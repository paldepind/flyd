# flyd-every
Takes a number of milliseconds `ms` and creates a stream of the current time updated every `ms`.

The stream emits current timestamp values using `Date.now()` (eg `1475273004713`)

__Graph__

```
(ticks represent 10ms)
every(30):    {--t--t--t--t--t-->
```

__Signature__

`Number -> Stream Number`

__Usage__

```javascript
const every = require('flyd/module/every')
const everySecond = every(1000)

// Print once every second
flyd.on(time => console.log('Current time is', time), everySecond)

// count every second
const count = flyd.scan(n => n + 1, 0, everySecond)
flyd.map(c => console.log(c), count) // 0 ... 1 ... 2 ... 3 ... 4 ... 5
```
