[![Build Status](https://travis-ci.org/paldepind/flyd.svg?branch=master)](https://travis-ci.org/paldepind/flyd)

# Flyd
The modular, KISS, functional reactive programming library for JavaScript.

# Table of contents

* [Introduction](#introduction)
* [Features](#features)
* [Examples](#example)
* [Tutorial](#tutorial)
* [API](#api)
* [Modules](#modules)
* [Misc](#misc)

## Introduction

Functional reactive programming is a powerful programming paradigm for
expressing values that change over time. But existing libraries for JavaScript
are huge, complex, have a high learning curve and aren't functional enough.

Flyd is simple and expressive. It has a minimal but powerful core on top of
which new abstractions can be built modularly.

## Features

* __Simple and powerful__. Less is more! Flyd provides combineable observable
  streams as the basic building block. This minimal core is less than 200 SLOC
  and FRP abstractions can easily be built on top of it.
* __A more functional style__. Flyd is more functional and less object oriented.
  Instead of methods it gives you curried functions with arguments in the
  correct order for partial application. This increases the expressive power and
  the extensibility of the library.
* Supports the transducer protocol. You can for instance transduce streams with
  ([Ramda](http://ramdajs.com/).
* Complies to the [fantasy land](https://github.com/fantasyland/fantasy-land)
  applicative specification.
* Elegant support for promises.
* [Atomic updates](#atomic-updates)
* Easy to extend with custom [modules](#modules)

## Examples

* [Sum](http://paldepind.github.io/flyd/examples/sum/) - very simple example
* [Multiple clicks](http://paldepind.github.io/flyd/examples/multiple-clicks/) - a remake
  of the multiple clicks example from "The introduction to Reactive
  Programming you've been missing". Compare it to the not quite as elegant [Rx
  implementation](http://jsfiddle.net/staltz/4gGgs/27/).
* [Secret combination](http://paldepind.github.io/flyd/examples/secret-combination/)
* [Ramda transducer](https://github.com/paldepind/flyd/tree/master/examples/ramda-transducer)

For other examples check the source code of the [modules](#modules).

## Tutorial

This is not general tutorial to functional reactive programming. For that take
a look at [The introduction to Reactive Programming you've been
missing](https://gist.github.com/staltz/868e7e9bc2a7b8c1f754) and/or [this Elm
tutorial](http://elm-lang.org/learn/Using-Signals.elm) if you are comfortable
with reading Haskell-like code.

This tutorial will introduce you to the core of Flyd and show how to use it to
build FRP abstractions.

### Creating streams

Flyd gives you streams as the building block for creating reactive dataflows.
The function `stream` creates a representation of a value that changes over time.
A stream is a function. At first sight it works a bit like a getter-setter:

```javascript
// Create a stream with initial value 5.
var number = flyd.stream(5);
// Get the current value of the stream.
console.log(number()); // logs 5
// Update the value of the stream.
console.log(number(7)); // logs 7
// The stream now returns the new value.
console.log(number()); // logs 7
```

Top level streams, that is streams without dependencies, should typically
depend on the external world, like user input or fetched data.

Since streams are just functions you can easily plug them in whenever a
function is expected.

```javascript
var clicks = flyd.stream();
document.getElementById('button').addEventListener('click', clicks);
var messages = flyd.stream();
webSocket.onmessage = messages;
```

Clicks events will now flow down the `clicks` stream and WebSockets messages
down the `messages` stream.

### Dependent streams

Streams can depend on other streams. Instead of calling `stream` with a value
as in the above examples we can pass it a list of dependencies and a function.
The function should produce a value based on its dependencies. This new value
results in a new stream.

Flyd automatically updates the stream whenever a dependency changes.  This
means that the `sum` function below will be called whenever `x` and `y`
changes.  You can think of dependent stream as streams that automatically
listens/subscribes to their dependencies.

```javascript
// Create two streams of numbers
var x = flyd.stream(4);
var y = flyd.stream(6);
// Create a stream that depends on the two previous streams
// and with its value given by the two added together.
var sum = flyd.stream([x, y], function() {
  return x() + y();
});
// `sum` is automatically recalculated whenever the streams it depends on changes.
x(12);
console.log(sum()); // logs 18
y(8);
console.log(sum()); // logs 20
```

Naturally, a stream with dependencies can depend on other streams with dependencies.

```javascript
// Create two streams of numbers
var x = flyd.stream(4);
var y = flyd.stream(6);
var squareX = flyd.stream([x], function() {
  return x() * x();
});
var squareXPlusY = flyd.stream([y, squareX], function() {
  return y() + squareX();
});
console.log(squareXPlusY()); // logs 22
x(2);
console.log(squareXPlusY()); // logs 10
```

The body of a dependent stream is called with two streams: itself and the last
changed stream on which it depends.

```javascript
// Create two streams of numbers
var x = flyd.stream(1);
var y = flyd.stream(2);
var sum = flyd.stream([x, y], function(sum, changed) {
  // The stream can read from itself
  console.log('Last sum was ' + sum());
  if (changed) { // On the initial call no stream has changed
    var changedName = (changed === y ? 'y' : 'x');
    console.log(changedName + ' changed to ' + changed());
  }
  return x() + y();
});
```

### Using callback APIs for asynchronous operations

Instead of returning a value a stream can update itself by calling itself. This
is handy when working with APIs that takes callbacks.

```
var urls = flyd.stream('/something.json');
var responses = flyd.stream([urls], function(resp) {
  makeRequest(urls(), resp);
});
flyd.stream([responses], function() {
  console.log('Received response!');
  console.log(responses());
});
```

Note that the stream that logs the responses from the server should only be called
after an actual response has been recieved (otherwise `responses()` whould return
`undefined`). Fortunately a streams body will not be called before all of its declared
streams has recieved a value.

### Using promises for asynchronous operations

Flyd has inbuilt support for promises. Similairly to how a promise can never be
resolved with a promise, a promise can never flow down a stream. Instead the
fulfilled value of the promise will be sent down the stream.

```javascript
var urls = flyd.stream('/something.json');
var responses = flyd.stream(function() {
  return requestPromise(urls());
});
flyd.stream([responses], function() {
  console.log('Recieved response!');
  console.log(responses());
});
```

### Mapping over a stream

You've now seen the basic building block which Flyd provides. Let's see what we
can do with it. Lets write a function that takes a stream and a function and
returns a new stream with the function applied to every value emitted by the
stream. In short, a `map` function.

```javascript
var mapStream = function(f, s) {
  return flyd.stream([s], function() {
    return f(s());
  });
};
```

We simply create a new stream dependent on the first stream. We declare
the stream as a dependency so that our stream won't return values before
the original stream produces its first value.

Flyd includes a similar map function as part of its core.

### Reducing a stream

Lets try something else: reducing a stream! It could look like this:

```javascript
var reduceStream = function(f, acc, s) {
  return flyd.stream([s], function() {
    acc = f(acc, s());
    return acc;
  });
};
```

Our reduce function takes a reducer function, in initial value and a stream.
Every time the original stream emit a value we pass it to the reducer along
with the accumulator.

Flyd includes a reduce function as part of its core.

### Fin

You're done! To learn more check out the [API](#api), the [examples](#examples)
and the source of the [modules](#modules).

## API

### flyd.stream(dependencies, body[, doesNotRequireDeps])

Creates a new stream.

__Signature__

  * `dependencies` (array) – The streams on which this stream depends.
  * `body` (function) – The function body of the stream.
  * \[`doesNotRequireDeps`\] (boolean) – If `true` the function body can be
    invoked even before all dependencies have a value.

__Returns__

The created stream.

###flyd.map(fn, s)

Returns a new stream consisting of every value from `s` passed through `fn`. I.e. `map` creates
a new stream that listens to `s` and applies `fn` to every new value.

__Signature__

`(a -> result) -> Stream a -> Stream result`

__Example__
```javascript
var numbers = flyd.stream(0);
var squaredNumbers = flyd.map(function(n) { return n*n; }, numbers);
```

###flyd.reduce(fn, acc, stream)

Creates a new stream with the results of calling the function on every incoming
stream with and accumulator and the incoming value.

__Signature__

`(a -> b -> a) -> a -> Stream b -> Stream a`

__Example__
```javascript
var numbers = flyd.stream();
var sum = flyd.reduce(function(sum, n) { return sum+n; }, 0, numbers);
numbers(2)(3)(5);
sum(); // 10
```

###flyd.merge(stream1, stream2)

Creates a new stream down which all values from both `stream1` and `stream2`
will be sent.

__Signature__

`Stream a -> Stream a - Stream a`

__Example__
```javascript
var btn1Clicks = flyd.stream();
button1Elm.addEventListener(clicks);
var btn2Clicks = flyd.stream();
button2Elm.addEventListener(clicks);
var allClicks = flyd.merge(btn1Clicks, btn2Clicks);
```

### flyd.transduce(transducer, stream)

Creates a new stream resulting from applying `transducer` to `stream`.

__Signature__

`Transducer -> Stream a -> Stream b`

__Example__

```javascript
var t = require('transducers.js');

var results = [];
var s1 = flyd.stream();
var tx = t.compose(
  t.map(function(x) { return x * 2; }),
  t.dedupe()
);
var s2 = flyd.transduce(tx, s1);
flyd.stream([s2], function() { results.push(s2()); });
s1(1)(1)(2)(3)(3)(3)(4);
results; // [2, 4, 6, 8]
```

###flyd.destroy(stream)

If the stream has no dependencies this will detach it from any streams it
depends on. This makes it available for garbage collection if there are no
additional references to it.

__Signature__

`Stream -> undefined`

__Example__

```javascript
var s = flyd.map(function() { /* something */ }, someStream);
flyd.destroy(s);
s = undefined;
// `s` can be garbage collected
```

###flyd.curryN(n, fn)

Returns `fn` curried to `n`. Use this function to curry functions exposed by
modules for Flyd.

__Signature__

`Integer -> (* -> a) -> (* -> a)`

__Example__

```javascript
function add(x, y) { return x + y; };
flyd.curryN(2, add);
var add
```

###flyd.isStream(stream)

Returns `true` if the supplied argument is a Flyd stream and `false` otherwise.

__Signature__

`* -> Boolean`

__Example__

```javascript
var s = flyd.stream(1);
var n = 1;
flyd.isStream(s); //=> true
flyd.isStream(n); //=> false
```

###stream()

Returns the last value of the stream.

__Signature__

`a`

__Example__

```javascript
var names = flyd.stream('Turing');
names(); // 'Turing'
```

###stream(val)

Pushes a value down the stream.

__Signature__

`a -> Stream a`

__Example__

```javascript
names('Bohr');
names(); // 'Bohr'
```

###stream.map(f)

Returns a new stream identical to the original except every
value will be passed through `f`.

_Note:_ This function is included in order to support the fantasy land
specification.

__Signature__

Called bound to `Stream a`: `(a -> b) -> Stream b`

__Example__

```javascript
var numbers = flyd.stream(0);
var squaredNumbers = numbers.map(function(n) { return n*n; });
```

###stream1.ap(stream2)

`stream1` must be a stream of functions.

Returns a new stream which is the result of applying the
functions from `stream1` to the values in `stream2`.

_Note:_ This function is included in order to support the fantasy land
specification.

__Signature__

Called bound to `Stream (a -> b)`: `a -> Stream b`

__Example__

```javascript
var add = flyd.curryN(2, function(x, y) { return x + y; });
var numbers1 = flyd.stream();
var numbers2 = flyd.stream();
var addToNumbers1 = flyd.map(add, numbers1);
var added = addToNumbers1.ap(numbers2);
```

###stream.of(value)

Returns a new stream with `value` as its initial value. It is identical to
calling `flyd.stream` with one argument.

__Signature__

Called bound to `Stream (a)`: `b -> Stream b`

__Example__
```javascript
var n = flyd.stream(1);
var m = n.of(1);
```

### Modules

* [flyd-filter](https://github.com/paldepind/flyd-filter) – Filter values from stream based on predicate.
* [flyd-lift](https://github.com/paldepind/flyd-lift) – Maps a function takin multiple paramters over that amount of streams.
* [flyd-flatmap](https://github.com/paldepind/flyd-flatmap) – Maps a function over a stream of streams.
* [flyd-keepwhen](https://github.com/paldepind/flyd-keepwhen) – Keeps values from a stream when another stream is true.
* [flyd-obj](https://github.com/paldepind/flyd-obj) – Functions for working with stream in objects.
* [flyd-sampleon](https://github.com/paldepind/flyd-sampleon) – Samples from a stream every time an event occurs on another stream.
* [flyd-reducemerge](https://github.com/paldepind/flyd-reducemerge) – Merge and reduce several streams into one.
* Time related
  * [flyd-aftersilence](https://github.com/paldepind/flyd-aftersilence) – Buffers values from a source stream in an array and emits it after a specified duration of silience from the source stream.
  * [flyd-inlast](https://github.com/paldepind/flyd-inlast) - Creates a stream with emits a list of all values from the source stream that where emitted in a specified duration.

## Misc

### Atomic updates

Consider code like the following

```javascript
var a = flyd.stream(1);
var b = flyd.stream([a], function() { return a() * 2; });
var c = flyd.stream([a], function() { return a() + 4; });
var d = flyd.stream([b, c], function(self, ch) {
  result.push(b() + c());
});
```

Now, when a value flows down `a`, both `b` and `c` will change because they
depend on `a`. If you merely consider streams as being events you'd expect `d`
to be updated twice. Because `a` triggers `b` triggers `d` after which `a` also
twiggers `c` which again triggers `d`. But Flyd will handle this better.
Since only one value entered the system `d` will only be updated once with the
changed values of `b` and `c`. This avoids superfluous updates of your streams.
