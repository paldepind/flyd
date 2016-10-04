# flyd-mergeall
Flyd module for merging several streams into one.

__Graph__

```
a:                {---1---2---3---}
b:                {--1-----2-----3}
mergeAll([a,b]):  {--11---22--3--3}
```

__Signature__

`[Stream a] -> Stream a`

__Example__

```javascript
const mergeAll = require('flyd/module/mergeall')

const s1 = flyd.stream()
const s2 = flyd.stream()
const s3 = flyd.stream()
var merged = mergeAll([s1, s2, s3])
s1(1)
merged() // 1
s2(2)
merged() // 2
s3(3)
merged() // 3
```

