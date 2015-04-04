[![Build Status](https://travis-ci.org/paldepind/flyd.svg?branch=master)](https://travis-ci.org/paldepind/flyd)

# Flyd
The modular, KISS, functional reactive programming JavaScript library.

# Table of contents

* [Introduction](#introduction)
* [Features](#features)
* [Example](#example)
* [Tutorial](#tutorial)
* [API](#api)
* [Modules](#modules)

## Introduction

Functional reactive programming is a powerful programming paradigm for
expressing values that change over time. But existing libraries for JavaScript
are huge, complex, have a high learning curve and aren't functional enough.

Flyd is simple and expressive. It is fast to learn and powerful to use. It has
a minimal core on top of which new abstractions can be built modularly.

## Features

* __Simple and powerful__. Less is more. Flyd has combineable observable streams with automatic
  dependency resolution as the basic building block. This minimal core is less
  than 200 SLOC and new FRP abstractions can easily be built on top of it.
* __More functional__. Flyd is more functional and less object oriented. Instead of methods it gives
  you curried functions with arguments in the right ordere. This increases the
  expressive power and the extensibility of the library.
* Supports the transducer protocol. You can for instance transduce streams with
  ([transducers.js](https://github.com/jlongster/transducers.js).
* Complies to the [fantasy land](https://github.com/fantasyland/fantasy-land)
  applicative specification.
* Elegant support for promises.
* Easy to extend with custom [modules](#modules)


## Example

[Simple example](http://paldepind.github.io/flyd/examples/sum/).

## Tutorial

### Creating streams

Flyd gives you streams as the building block for creating reactive dataflows.
The function `stream` creates a representation of a value that changes over time.
A stream is a function and at first sight it works a bit like a getter-setter:

```javascript
// Create a stream with initial value 5.
var number = stream(5);
// Get the current value of the stream.
number(); // returns 5
// Update the value of the stream.
number(7); // returns 7
// The stream now returns the new value.
number(); // returns 7
```

Top level streams, that is streams without dependencies, should typically
depend on the external world, like user input or fetched data.

Since streams are just functions you can easily plug them in whenever a
function is expected.

```javascript
var clicks = stream();
document.getElementById('button').addEventListener('click', clicks);
var messages = stream();
webSocket.onmessage = messages;
```

Clicks events will now flow down the `clicks` stream and WebSockets messages
down the `messages` stream.

### Dependent streams

Streams can depend on other streams. Instead of calling `stream` with a value
as in the above examples we can pass it a function. The function should calculate a
value based on other streams which forms a new stream. Flyd automatically
collects the streams dependencies and updates it whenever a dependency changes.

This means that the `sum` function below will be called whenever `x` and `y` changes.
You can think of dependent stream as streams that automatically
listens/subscribes to their dependencies.

```javascript
// Create two streams of numbers
var x = stream(4);
var y = stream(6);
// Create a stream that depends on the two previous streams
// and with its value given by the two added together.
var sum = stream(function() {
  return x() + y();
});
// `sum` is automatically recalculated whenever the streams it depends on changes.
x(12);
sum(); // returns 18
y(8);
sum(); // returns 20
```

Naturally, a stream with dependencies can depend on other streams with dependencies.

```javascript
// Create two streams of numbers
var x = stream(4);
var y = stream(6);
var squareX = stream(function() {
  return x() * x();
});
var squareXPlusY(function() {
  return y() + doubleX();
});
squareXPlysY(); // returns 22
x(2);
squareXPlysY(); // returns 10
```

The body of a dependent stream is called with two streams: itself and the last
changed stream on which it depends.

```javascript
// Create two streams of numbers
var x = stream(1);
var y = stream(2);
var sum = stream(function(sum, changed) {
  // The stream can read from itself
  console.log('Last sum was ' + sum());
  if (changed) { // On the initial call no stream changed
    var changedName = (changed === y ? 'y' : 'x');
    console.log(changedName + ' changed to ' + changed());
  }
  return x() + y();
});
```

### Using calback APIs for asynchronous operations

Instead of returning a value a stream can update itself by calling itself. This
is handy when working with APIs that takes callbacks.

```
var urls = stream('/something.json');
var responses = stream(function(resp) {
  makeRequest(urls(), resp);
});
stream([responses], function() {
  console.log('Recieved response!');
  console.log(responses());
});
```

The stream above that logs the responses from the server should only be called
after an actual response has been recieved (otherwise `responses()` whould return
`undefined`). For this purpose you can pass `stream` an array of initial
dependencies. The streams body will not be called before all of the declared
streams evaluate to something other than `undefined`.

### Using promises for asynchronous operations

Flyd has inbuilt support for promises. Similairly to how a promise can never be
resolved with a promise, a promise can never flow down a stream. Instead the
fulfilled value of the promise will be sent down the stream.

```javascript
var urls = stream('/something.json');
var responses = stream(function() {
  return requestPromise(urls());
});
stream([responses], function() {
  console.log('Recieved response!');
  console.log(responses());
});
```

### Mapping over a stream

You've now seen the basic building block which Flyd provides. Let's see what we
can do with it. Lets write a function that takes a stream and a function and
returns a new stream with the functin applied to every value emitted by the
stream. In short, a `map` function.

```javascript
var mapStream = functin(s, f) {
  return stream([s], function() {
    return f(s());
  });
};
```

We simply create a new stream dependent on the first stream. We declare
the stream as a dependency so that our stream wont return values before
the original stream produces its first value.

Flyd includes a map function as part of its core.

### Reducing a stream

Lets try something else, reducing a stream! It could look like this:

```javascript
var reduceStream = function(f, acc, s) {
  return stream([s], function() {
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

You're done. Check out the [API](#api) and/or the [examples](#examples).

## API

### flyd.stream

Creates a new stream.

__Arguments__
  * \[`dependencies`\] (array) – The streams on which this stream should initially depend.
  * `body` (function|\*) – The function body of the stream or it initial value.
  * \[`staticDependencies`\] – Disables automatic dependency resolution of the stream.

__Returns__

The created stream.

###flyd.map(fn, s)

Returns a new stream consisting of every value from `s` passed through `fn. I.e. `map` creates
a new stream that listens to `s` and applies `fn` to every new value.

__Example__
```javascript
var numbers = stream(0);
var squaredNumbers = flyd.map(function(n) { return n*n; }, numbers);
```

###flyd.reduce(fn, acc, stream)

Creates a new stream with the results of calling the function on every incoming
stream with and accumulator and the incoming value.

__Example__
```javascript
var numbers = stream();
var sum = flyd.reduce(function(sum, n) { return sum+n; }, 0, numbers);
numbers(2)(3)(5);
sum(); // 10
```

###flyd.merge(stream1, stream2)

Creates a new stream down which all values from both `stream1` and `stream2`
will be sent.

__Example__
```javascript
var btn1Clicks = stream();
button1Elm.addEventListener(clicks);
var btn2Clicks = stream();
button2Elm.addEventListener(clicks);
var allClicks = flyd.merge(btn1Clicks, btn2Clicks);
```

### flyd.transduce(transducer, stream)

Creates a new stream resulting from applying `transducer` to `stream`.

__Example__

```javascript
var t = require('transducers.js');

var results = [];
var s1 = stream();
var tx = t.compose(
  t.map(function(x) { return x * 2; }),
  t.dedupe()
);
var s2 = flyd.transduce(tx, s1);
stream([s2], function() { results.push(s2()); });
s1(1)(1)(2)(3)(3)(3)(4);
result; // [2, 4, 6, 8]
```

###flyd.destroy(stream)

If the stream has no dependencies this will detach it from any streams it
depends on. This makes it available for garbage collection if there are no
additional references to it.

###flyd.curryN(n, fn)

Returns `fn` curried to `n`. Use this function to curry functions exposed by
modules for Flyd.

###flyd.isStream(stream)

Returns `true` if the supplied argument is a Flyd stream and `false` otherwise.

###stream()

Returns the last value of the stream.

__Example__
```javascript
var names = stream('Turing');
names(); // 'Turing'
names('Bohr');
names(); // 'Bohr'
```

###stream(val)

Pushes a value down the stream.

###stream.map(f)

Returns a new stream identical to the original exept every
value will be passed through `f`.

###stream1.ap(stream2)

`stream1` must be a stream of functions.

Returns a new stream which is the result of applying the
functions from `stream1` to the values in `stream2`.

###stream.of(value)

Returns a new stream with `value` as its initial value.


### Modules

* [flyd-filter](https://github.com/paldepind/flyd-filter)
* [flyd-lift](https://github.com/paldepind/flyd-lift)
* [flyd-flatmap](https://github.com/paldepind/flyd-flatmap)
* [flyd-keepwhen](https://github.com/paldepind/flyd-keepwhen)
* [flyd-sampleon](https://github.com/paldepind/flyd-sampleon)
