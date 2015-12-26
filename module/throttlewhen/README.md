# flyd-throttlewhen
throttleWhen function for Flyd.

Keeps values from the second stream when the first stream is false. When the
first stream is true, will hold off on emitting from the second stream until
the first stream emits false. If any values were blocked by the first stream
then only the latest will be emitted upon the first stream emitting false.

# Usage

This is a terrible explanation. The goal is really for batching render frames.

```js
var action$ = flyd.stream()
var state$ = flyd.scan(update, initialState, state$)
var throttle$ = flyd.stream(false)
flyd.on(render, flyd.throttleWhen(throttle$, state$))

// suppose there will be a bunch of actions in a row.
// you can hold off on renders by using throttleWhen
throttle$(true)
action$(1)
action$(2)
action$(3)
action$(4)
throttle$(false)
```