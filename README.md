# Flyd
The less is more functional reactive programming library in JavaScript.

__Note:__ Flyd is pre-release. It works as advertised – but the API might
change. Once I've recieved feedback and become certain of the API an actual
release will happen.

## Introduction

Functional reactive programming is a powerful programming paradigm for
expressing values that change over time. But existing libraries for JavaScript
are huge, complex and has a high learning curve.

Flyd is different. It is simple, expressive and powerful. It is fast to learn
and easy to use.

## At a glance

* Combineable observable streams with automatic dependency resolution.
* Extremely simple and lightweight. It's less than 200 SLOC.
* Supports the transducer protocol. You can for instance transduce stream with
  ([transducers.js](https://github.com/jlongster/transducers.js).
* Complies to the [fantasy land](https://github.com/fantasyland/fantasy-land)
  applicative specification.
* Elegant support for promises.

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
depend on the external world, like user input and fetched data.

Since streams are just functions you can easily plug them in whenever a
function is expected.

```javascript
var clicks = stream();
document.getElementById('button').addEventListener('click', clicks);
var messages = stream();
webSocket.onmessage = messages;
```

Clicks events will now flow down the `clicks` stream and WebSockets messages
down the `message` stream.

### Dependent streams

Streams can depend on other streams. Instead of calling `stream` with a value
as in the above examples we can pass it a function. The function can calculate
a value based on other streams. Flyd automatically collects the streams dependencies
and updates it whenever a dependency changes.

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

A stream with dependencies can depend on other streams with dependencies.

```javascript
// Create two streams of numbers
var x = stream(4);
var y = stream(6);
var doubleX = stream(function() {
  return 2 * x();
});
var doubleXPlusY(function() {
  return y() + doubleX();
});
doubleXPlusY(); // returns 12
x(2);
doubleXPlusY(); // returns 10
```

The body of a dependent stream is called with two streams: its own stream and
the last changed stream on which it depends.

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
is handy when working with callback taking APIs.

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
dependencies. The stream body not get called before all of the declared
streams evaluate to something other than `undefined`.

### Using promises for asynchronous operations

Flyd has inbuilt support for promises. Just like a promise can never be resolved with
a promise can never flow down a stream. Instead the fulfilled value of the promise will
be sent down the stream.

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

## API

### flyd.stream

Creates a new stream.

__Arguments__
  * \[`dependencies`\] (array) - The streams on which this stream should initially depend.
  * `body` (function|\*) - The function body of the stream or it initial value.

__Returns__

The created stream.

###stream()

Returns the last value of the stream.

###stream(val)

Pushes a value down the stream.

###stream.map(f)

Returns a new stream identical to the original exept every
value will be passed through `f`.

###stream1.ap(stream2)

`stream1` must be a stream of functions.

Returns a new stream which is the result of applying the
functions from `stream1` to the values in `stream2`.

###stream1.reduce(stream2)

###stream1.merge(stream1)

### flyd.transduce(stream, transducer)

