# flyd-scanmerge
Flyd module for conveniently merging and scanning several streams into one.

__Signature__

`[[Stream b, (a, b -> a)]] -> a -> Stream a`

__Example__

```javascript
var add = flyd.stream(0);
var sub = flyd.stream(0);
var mult = flyd.stream(1);
var res = scanMerge([
  [add, function(sum, n) { return sum + n; }],
  [sub, function(sum, n) { return sum - n; }],
  [mult, function(sum, n) { return sum * n; }],
], 0);
add(5); sub(8); sub(4); add(12); mult(3);
console.log(res); // logs 15
```

```javascript
var addItem = flyd.stream();
var rmItem = flyd.stream();
var items = scanMerge([
  [addItem, function(list, item) { return list.concat([item]); }],
  [rmItem, function(list, item) {
    return list.filter(function(elm) { return elm !== item; });
  }]
], []);
addItem(1)(2)(3)(4)(5);
rmItem(3);
console.log(items()); logs [1, 2, 4, 5]
```
