# flyd-mergeall
Flyd module for merging several streams into one.

__Signature__

`[Stream a] -> Stream a`

__Example__

```javascript
var s1 = flyd.stream();
var s2 = flyd.stream();
var s3 = flyd.stream();
var merged = mergeAll([s1, s2, s3]);
s1(1);
s2(2);
console.log(merged()); // logs 2
```

