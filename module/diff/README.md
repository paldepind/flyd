# flyd-diff
diff function for Flyd.

Like map, but the mapping function gets the previous and the current value of the stream.

# Usage
```
var velocity = flyd.stream(0);
var acceleration = diff(function (previous, current) {
  return current - previous;
}, velocity);
velocity(2)(5)(1);
```
