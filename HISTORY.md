### v.0.2.0

* Fixed bug in `flyd/module/scanmerge`
* Removed dependent stream syntax `flyd.stream([streams], combinFn)` in
  favor of the function `combine`. `flyd.stream` is now only used for
  creating top level streams.
* Added `flyd.combine`

```
flyd.combine((depA, depB, ..., depN, self, changed) => *, [depA, depB, ..., depN]);
```

`self` is the combined stream and `changed` is an array of the streams
that have changed.

To update replace

```javascript
var a = flyd.stream();
var b = flyd.stream();
var sum = flyd.stream([a, b], function() {
  return a() + b();
}
```

with

```
var b = flyd.stream(0);
var a = flyd.stream(0);
var sum = flyd.combine(function(a, b) {
  return a + b;
}, [a, b]);
```