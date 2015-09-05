# flyd-takeuntil
Emit values from a stream until a second stream emits a value.

__Signature__

`Stream a -> Stream b -> Stream a`

__Example__

```javascript
// `s` will emit all values on `source` until `endStream` emits a value or ends
var s = takeUntil(source, endStream);
```
