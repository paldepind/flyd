# flyd-filter

Using a predicate function, select only the elements of a stream that the predicate function finds truthy.

__Graph__

```
a:                  {1--2--3--4--5--}
filter(isEven, a):  {---2-----4-----}
```

__Signature__

`(a -> Boolean) -> Stream a -> Stream a`

__Usage__

```javascript
const filter = require('flyd/module/filter')

const numbers = flyd.stream()
const largeNumbers = filter(n => n > 5, numbers)

// Collect large numbers into an array
const collect = flyd.scan((ls, n) => ls.concat(n), [], largeNumbers)

numbers(2)(6)(5)(3)(7)(10)(5);
collect() // [6, 7, 10]
```
