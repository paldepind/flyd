# flyd-filter
Filter function for Flyd.

# Usage

```javascript
var numbers = flyd.stream();
var largeNumbers = filter(over5, numbers);
flyd.map(function(n) {
  // called with 6, 7 and 10
}, largeNumbers);
numbers(2)(6)(5)(3)(7)(10)(5);

```
