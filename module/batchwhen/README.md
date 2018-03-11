# flyd-batchwhen

Batches values from the second stream (sA) based on the the first stream (sBool)
as a control signal. When sBool is false, sA are passed through as a single
element list. When sBool is true, then values feom sA are batched into a list,
and the batch is emitted when sBool returns to false. This function is convenient
for throttling user inputs.

# Usage

```js
var action$ = flyd.stream()
var throttle$ = flyd.stream(false)
var batchedAction$ = flyd.batchWhen(throttle$, action$)

action$(1)
// batchedAction$ => [1]
action$(2)
// batchedAction$ => [2]
throttle$(true)
action$(3)
action$(4)
throttle$(false)
// batchedAction$ => [3, 4]
throttle$(true)
throttle$(false)
```