# flyd-lift
Lift function for [Flyd](https://github.com/paldepind/flyd).

# Usage

```javascript
var addThree = function(a, b, c) {
  return a + b + c;
};

var n1 = stream(1),
    n2 = stream(4),
    n3 = stream(9);

var sum = lift(addThree, n1, n2, n3);

sum(); // 14
```
