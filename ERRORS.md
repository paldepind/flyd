# Errors in flyd

## Ethos
+ It should not be the concern of `flyd` to handle exceptions for the user -- any `throw` should result in a hard failure.
+ Silent failures are bad (current way `flyd` handles Promise.reject)
+ Be as unopinionated in implementation as possible
+ Be functional in design
+ Be as backward compatible as possible with the current api

## Concepts
+ The stream is of `events`
+ Each stream has a `left` and a `right` side (like an Either)
+ The right side is the domain objects
+ The left side is meta (in most cases errors)
+ By default the api operates on the `right` side

## The Api
`s` is a stream

### Setting data s(...) is overloaded
+ `s(value)` is the default case takes a value makes it a right and pushes it down the stream
+ `s(promise)` if the promise resolves pushes a right, otherwise pushes a left
+ `s(either)` pushes down right or left based on either.left either.right
+ `s.left(value)` sets the stream to a left of `value`

### Getting data
+ `s()` get the last right value or throws an exception if there is a left value
+ `s.left()` get the last left value or throws an exception if there is a right value

### Checking stream state
+ `s.isLeft()` return boolean so you know what the stream contains

### Core functions
+ `.map()` works only on rights and ignores lefts
+ `.mapAll()` gets all events as an `Either`
+ `.combine()` and `.merge()` stay the same they work on streams
+ `ap()` works on `rights` only
+ `.scan()` works on `rights` only
+ `.on()` works on `rights` only

### The Either implementation
There are no additional dependencies and we have provided a minimal  implementation for basic use. If you plan on using `.mapAll` we recommend overriding the methods in flyd.Either. You can use [folktale/data.either](https://github.com/folktale/data.either) for example as shown below.
```
var DE = require('data.either');
flyd.Either.Right = DE.Right;
flyd.Either.Left = DE.Left;
flyd.Either.isEither = function(obj) { return obj instanceof DE; };
flyd.Either.isRight = function(e) { return e.isRight; };
flyd.Either.getRight = function(e) { return e.value; };
flyd.Either.getLeft = function(e) { return e.value; };
```

### Other functionality
Keeping with the ethos of flyd any further functions like `.swap` or `.onAll` should be implemented as modules.