# flyd-forwardto

Forward values from one stream into another existing stream.

Create a new stream that passes all values through a function and forwards them
to a target stream.

__Graph__

```
a:                       {1---2---3---}
forwardTo(a, parseInt):  {--2---3---2-}
flyd.map(square, a):     {1-4-4-9-9-4-}
```

__Signature__

`Stream b -> (a -> b) -> Stream a`

__Example__

```javascript
const forwardTo = require('flyd/module/forwardto')
const R = require('ramda')

// A stream of numbers
const numbers = flyd.stream()
// Another stream that squares the numbers
const squaredNumbers = flyd.map(R.square, numbers)

// A stream of numbers as strings
// we want to convert them to ints and forward them into the numbers stream above:
const stringNumbers = forwardTo(numbers, parseInt)

stringNumbers('7')
squaredNumbers() // -> 49
numbers(4)
squaredNumbers() // -> 16
stringNumbers('9')
squaredNumbers() // -> 81
```

