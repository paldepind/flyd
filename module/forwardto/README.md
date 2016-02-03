# flyd-forwardto
Create a new stream that passes all values through a function and forwards them
to a target stream.

This function is inspired by the [Elm
function](http://package.elm-lang.org/packages/elm-lang/core/2.0.1/Signal#forwardTo)
of the same name.

__Signature__

`Stream b -> (a -> b) -> Stream a`

__Example__

```javascript
// We create a stream of numbers
var numbers = flyd.stream();
// And another stream that squares the numbers
var squaredNumbers = flyd.map(function(n) { return n*n; }, numbers);
// Add a logger just for show
flyd.map(function(n) { console.log(n); }, squaredNumbers);
// For some reason we have a lot of string of numbers, but we can't
// send them down the `numbers` stream. That would wreck havoc in the
// squaring function. `forwardTo` to the resque!
var stringNumbers = forwardTo(numbers, parseInt);
stringNumbers('7'); // `49` is logged
```

