# Flyd

The modular, KISS, functional reactive programming library for JavaScript.

[![Build Status](https://travis-ci.org/paldepind/flyd.svg?branch=master)](https://travis-ci.org/paldepind/flyd)
[![Coverage Status](https://coveralls.io/repos/paldepind/flyd/badge.svg?branch=master)](https://coveralls.io/r/paldepind/flyd?branch=master)
[![Join the chat at https://gitter.im/paldepind/flyd](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/paldepind/flyd?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

# Table of contents

* [Introduction](#introduction)
* [Features](#features)
* [Examples](#examples)
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

__Main features__

* __Simple but powerful__. Less is more! Flyd provides combinable observable
  streams as the basic building block. This minimal core is less than 200 SLOC
  which makes the library transparent – end users can realistically get a full
  understanding of how the library works.
* __More functional in style__. Flyd is more functional than existing FRP
  libraries. Instead of methods it gives you curried functions with arguments
  in the order suitable for partial application. This gives more expressive
  power and modularity.
* __Modularity__. The core of the Flyd is powerful and documented. This makes
  it easy for users of the library to create new FRP abstractions if existing ones
  do not exist. This in turn makes it viable to capture more patterns than
  otherwise because they can exist as separate modules. [List of existing modules](#modules).

__Other features__

* Supports the transducer protocol. You can for instance transduce streams with
  [Ramda](http://ramdajs.com/) and [transducers.js](https://github.com/jlongster/transducers.js).
* Conforms to the fantasy land [monad](https://github.com/fantasyland/fantasy-land#monad) specification
* [Atomic updates](#atomic-updates).

## Examples

* [Sum](http://paldepind.github.io/flyd/examples/sum/) - A very simple example
* [Multiple clicks](http://paldepind.github.io/flyd/examples/multiple-clicks/) - A remake
  of the multiple clicks example from "The introduction to Reactive
  Programming you've been missing". Compare it to this [RxJs
  implementation](http://jsfiddle.net/ksj51q5k/).
* [Secret combination](http://paldepind.github.io/flyd/examples/secret-combination/)
* [Ramda transducer](https://github.com/paldepind/flyd/tree/master/examples/ramda-transducer)
* [Who to follow](http://paldepind.github.io/flyd/examples/who-to-follow/)

For other examples check the source code of the [modules](#modules).

## Tutorial

This is not general introduction to functional reactive programming. For that take
a look at [The introduction to Reactive Programming you've been
missing](https://gist.github.com/staltz/868e7e9bc2a7b8c1f754) and/or [this Elm
tutorial](http://elm-lang.org/learn/Using-Signals.elm) if you are comfortable
with reading Haskell-like code.

This is not a demonstration of how you would write code with Flyd on a day to
day basis. For that take a look at the [examples](#examples).

This tutorial will however introduce you to the minimal but powerful core that
Flyd provides and show you how it can be used to build FRP abstractions.

### Creating streams

Flyd gives you streams as the building block for creating reactive dataflows.
They serve the same purpose as what other FRP libraries call Signals, Observables,
Properties and EventEmitters.

The function `flyd.stream` creates a representation of a value that changes
over time. The resulting stream is a function. At first sight it works a bit
like a getter-setter:

```javascript
// Create a stream with initial value 5.
var number = flyd.stream(5);
// Get the current value of the stream.
console.log(number()); // logs 5
// Update the value of the stream.
console.log(number(7));
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

Streams can depend on other streams. Use `var combined = flyd.combine(combineFn, [a, b, c, ...])`.
The `combineFn` function will be called as `(a, b, c, ..., self, changed) => v`,
where `a, b, c, ...` is a spread of each dependency, `self` is a reference to the
combine stream itself, and `changed` is an array of streams that were atomically
updated.

Flyd automatically updates the stream whenever a dependency changes.  This
means that the `sum` function below will be called whenever `x` and `y`
changes.  You can think of dependent stream as streams that automatically
listens to or subscribes to their dependencies.

```javascript
// Create two streams of numbers
var x = flyd.stream(4);
var y = flyd.stream(6);
// Create a stream that depends on the two previous streams
// and with its value given by the two added together.
var sum = flyd.combine(function(x, y) {
  return x() + y();
}, [x, y]);
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
var squareX = flyd.combine(function(x) {
  return x() * x();
}, [x]);
var squareXPlusY = flyd.combine(function(y, squareX) {
  return y() + squareX();
}, [y, squareX]);
console.log(squareXPlusY()); // logs 22
x(2);
console.log(squareXPlusY()); // logs 10
```

The body of a dependent stream is called with the spread of: each dependency, itself, and a list
of the dependencies that have changed since its last invocation (due to [atomic
updates](#atomic-updates) several streams could have changed).

```javascript
// Create two streams of numbers
var x = flyd.stream(1);
var y = flyd.stream(2);
var sum = flyd.combine(function(x, y, self, changed) {
  // The stream can read from itself
  console.log('Last sum was ' + self());
  // On the initial call no streams has changed and `changed` will be []
  changed.map(function(s) {
    var changedName = (s === y ? 'y' : 'x');
    console.log(changedName + ' changed to ' + s());
  });
  return x() + y();
}, [x, y]);
```

*Note* Returning `undefined` in the `combineFn` will not trigger an update
to the stream. To trigger on undefined, update directly:
```
flyd.combine((_, self, changed) => { self(undefined); }, [depStream]);
```

### Using callback APIs for asynchronous operations

Instead of returning a value a stream can update itself by calling itself. This
is handy when working with APIs that takes callbacks.

```javascript
var urls = flyd.stream('/something.json');
var responses = flyd.combine(function(urls, self) {
  makeRequest(urls(), self);
}, [urls]);
flyd.combine(function(responses) {
  console.log('Received response!');
  console.log(responses());
}, [responses]);
```

Note that the stream that logs the responses from the server should only be called
after an actual response has been received (otherwise `responses()` would return
`undefined`). Fortunately a stream's body will not be called before all of its declared
streams has received a value (this behaviour can be circumvented with
[flyd.immediate](#flydimmediatestream)).

### Promises
Flyd has two helpers for dealing with promises: `flyd.fromPromise` and `flyd.flattenPromise`.

Let's say you're building a filtered list. It is important to you that the latest filter always corresponds
to the latest promise and its resolution. using `flyd.fromPromise` guarantees the ordering, and can skip intermediate results.

```js
const filter = flyd.stream('');
const results = filter
  .pipe(flyd.chain(
    filter => flyd.fromPromise(requestPromise(`https://example.com?q=${filter}`))
  ));
```

On the other hand let's say you want to sum some numbers from a service you've written.
Every time someone clicks on your site you want to send a request and get back a random number to be tallied.

`flyd.flattenPromise` gives you the guarantee that every promise resolution will be handled, regardless of order.

```js
const clicks = flyd.stream();
const total = clicks
  .map(getNumberAsync)
  .pipe(flyd.flattenPromise)
  .pipe(flyd.scan((acc, v)=> acc + v, 0));
```

### Mapping over a stream

You've now seen most of the basic building block which Flyd provides. Let's see
what we can do with them. Let's write a function that takes a function and a
stream and returns a new stream with the function applied to every value
emitted by the stream. In short, a `map` function.

```javascript
var mapStream = function(f, s) {
  return flyd.combine(function(s) {
    return f(s());
  }, [s]);
};
```

We simply create a new stream dependent on the first stream. We declare
the stream as a dependency so that our stream won't return values before
the original stream produces its first value.

Flyd includes a similar `map` function as part of its core.

### Scanning a stream

Lets try something else: a scan function for accumulating a stream! It could
look like this:

```javascript
var scanStream = function(f, acc, s) {
  return flyd.combine(function(s) {
    acc = f(acc, s());
    return acc;
  }, [s]);
};
```

Our scan function takes an accumulator function, an initial value and a stream.
Every time the original stream emits a value we pass it to the accumulator
function along with the accumulated value.

Flyd includes a `scan` function as part of its core.

### Stream endings

When you create a stream with `flyd.stream` it will have an `end` property
which is also a stream. That is an _end stream_:

```javascript
var s = flyd.stream();
console.log(flyd.isStream(s.end)); // logs `true`
```

You can end a stream by pushing `true` into its end stream:

```javascript
var s = flyd.stream();
s.end(true); // this ends `s`
```

When you create a dependent stream its end stream will initially depend on all
the end streams of its dependencies:

```javascript
var n1 = flyd.stream();
var n2 = flyd.stream();
var sum = flyd.combine(function(n1, n2) {
  return n1() + n2();
}, [n1, n2]);
```

`sum.end` now depends on `n1.end` and `n2.end`. This means that whenever one of
the `sum`s dependencies end `sum` will end as well.

You can change what a stream's end stream depends on with `flyd.endsOn`:

```javascript
var number = flyd.stream(2);
var killer = flyd.stream();
var square = flyd.endsOn(flyd.merge(number.end, killer), flyd.combine(function(number) {
  return number() * number();
}, [number]));
```

Now `square` will end if either `number` ends or if `killer` emits a value.

The fact that a stream's ending is itself a stream is a very powerful concept.
It means that we can use the full expressiveness of Flyd to control when a stream
ends. For an example, take a look at the implementation of
[`takeUntil`](https://github.com/paldepind/flyd-takeuntil).

### Fin

You're done! To learn more check out the [API](#api), the [examples](#examples)
and the source of the [modules](#modules).

## API

### flyd.stream()

Creates a new top level stream.

__Signature__

`a -> Stream a`

__Example__
```javascript
var n = flyd.stream(1); // Stream with initial value `1`
var s = flyd.stream(); // Stream with no initial value
```

### flyd.combine(body, dependencies)

Creates a new dependent stream.

__Signature__

`(...Stream * -> Stream b -> b) -> [Stream *] -> Stream b`

__Example__
```javascript
var n1 = flyd.stream(0);
var n2 = flyd.stream(0);
var max = flyd.combine(function(n1, n2, self, changed) {
  return n1() > n2() ? n1() : n2();
}, [n1, n2]);
```

### flyd.isStream(stream)

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

### flyd.immediate(stream)

By default the body of a dependent stream is only called when all the streams
upon which it depends has a value. `immediate` can circumvent this behaviour.
It immediately invokes the body of a dependent stream.

__Signature__

`Stream a -> Stream a`

__Example__

```javascript
var s = flyd.stream();
var hasItems = flyd.immediate(flyd.combine(function(s) {
  return s() !== undefined && s().length > 0;
}, [s]);
console.log(hasItems()); // logs `false`. Had `immediate` not been
                         // used `hasItems()` would've returned `undefined`
s([1]);
console.log(hasItems()); // logs `true`.
s([]);
console.log(hasItems()); // logs `false`.
```

### flyd.endsOn(endStream, s)

Changes which `endsStream` should trigger the ending of `s`.

__Signature__

`Stream a -> Stream b -> Stream b`

__Example__

```javascript
var n = flyd.stream(1);
var killer = flyd.stream();
// `double` ends when `n` ends or when `killer` emits any value
var double = flyd.endsOn(flyd.merge(n.end, killer), flyd.combine(function(n) {
  return 2 * n();
}, [n]);
```

### flyd.map(fn, s)

Returns a new stream consisting of every value from `s` passed through `fn`. I.e. `map` creates
a new stream that listens to `s` and applies `fn` to every new value.

__Signature__

`(a -> result) -> Stream a -> Stream result`

__Example__
```javascript
var numbers = flyd.stream(0);
var squaredNumbers = flyd.map(function(n) { return n*n; }, numbers);
```
### flyd.chain(fn, s)
`fn` must return a stream.

`fn` is run every time a value is pushed into `s`.
Returns a single stream of merged values from the created streams.

Ends when every created stream and the main stream ends

__Signature__

`(a -> Stream b) -> Stream a -> Stream b`

__Example__
```javascript
var filter = flyd.stream('filter');
var search_results = flyd.chain(function(filter){
  return flyd.stream(getResults(filter));
}, filter);
```

### flyd.ap(valueStream, functionStream)

Applies the value in `valueStream` to the function in `functionStream`

__Signature__
`Stream a -> Stream (a -> b) -> Stream b`

__Example__
```javascript
function add3(x) { return x + 3; }
flyd.ap(flyd.stream(5), flyd.stream(add3)) // stream(8);
```

while it can not seem useful immediately consider this example

```javascript
var get_results = function (filter, sortProperty, sortDirection) {
  return flyd.stream(fetch(`${base_url}/search?q=${filter}&sort=${sortProperty} ${sortDirection}`))
};

// this would eventually be linked to an input field
var filter = flyd.stream('');
var sortProperty = flyd.stream('name');
var sortDirection = flyd.stream('descending');

var results = flyd.stream(flyd.curryN(3, get_results))
  .pipe(flyd.ap(filter))
  .pipe(flyd.ap(sortProperty))
  .pipe(flyd.ap(sortDirection))
  .pipe(flyd.map(function(d){ return d; }));
```

In the above example you have a stream of results that triggers a call for get_results
every time `filter`, `sortProperty`, or `sortDirection` is changed.

### flyd.on(fn, s)

Similar to `map` except that the returned stream is empty. Use `on` for doing
side effects in reaction to stream changes. Use the returned stream only if you
need to manually end it.

__Signature__

`(a -> result) -> Stream a -> Stream undefined`

__Example__
```javascript
var numbers = flyd.stream(0);
flyd.on(function(n) { console.log('numbers changed to', n); }, numbers);
```

### flyd.scan(fn, acc, stream)

Creates a new stream with the results of calling the function on every incoming
stream with and accumulator and the incoming value.

__Signature__

`((a, b) -> a) -> a -> Stream b -> Stream a`

__Example__
```javascript
var numbers = flyd.stream();
var sum = flyd.scan(function(sum, n) { return sum+n; }, 0, numbers);
numbers(2)(3)(5);
sum(); // 10
```

### flyd.merge(stream1, stream2)

Creates a new stream down which all values from both `stream1` and `stream2`
will be sent.

__Signature__

`Stream a -> Stream a -> Stream a`

__Example__
```javascript
var btn1Clicks = flyd.stream();
button1Elm.addEventListener(btn1Clicks);
var btn2Clicks = flyd.stream();
button2Elm.addEventListener(btn2Clicks);
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
flyd.combine(function(s2) { results.push(s2()); }, [s2]);
s1(1)(1)(2)(3)(3)(3)(4);
results; // [2, 4, 6, 8]
```

### flyd.curryN(n, fn)

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

### stream()

Returns the last value of the stream.

__Signature__

`a`

__Example__

```javascript
var names = flyd.stream('Turing');
names(); // 'Turing'
```

### stream(val)

Pushes a value down the stream.

__Signature__

`a -> Stream a`

__Example__

```javascript
names('Bohr');
names(); // 'Bohr'
```

### stream.end

A stream that emits `true` when the stream ends. If `true` is pushed down the
stream the parent stream ends.

### stream.pipe(fn)

Returns the result of applying function `fn` to the stream.

__Signature__
Called bound to `Stream a`: `(Stream a -> Stream b) -> Stream b`

__Example__
```javascript
// map a stream
var numbers = flyd.stream(0);
var squaredNumbers = numbers
  .pipe(flyd.map(function(n) { return n*n; }));

// Chain a stream
var filter = flyd.stream('filter');
var search_results = filter
  .pipe(flyd.chain(function(filter){
    return flyd.stream(getResults(filter));
  }));

// use with a flyd module
var filter = require('flyd/module/filter');
var numbers = flyd.stream(0);
var isEven = function(x){ return x % 2 === 0; };
var evenNumbers = numbers
  .pipe(filter(isEven));
```

### stream.map(f)

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

### stream1.ap(stream2)

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

### stream.of(value)

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

If you've created a module for Flyd, open an issue or send a pull request, and it
will be added to this list.

Modules listed with names in the format `flyd/module/filter` are builtin to the main `flyd` module and can be required with `require('flyd/module/filter')`. Other modules must be installed first with npm.

| Module | Description |
| --- | --- |
| [flyd/module/**filter**](module/filter) | Filter values from stream based on predicate. |
| [flyd/module/**lift**](module/lift) | Maps a function taking _n_ parameters over _n_ streams. |
| [flyd/module/**switchlatest**](module/switchlatest) | Flattens a stream of streams. The result stream reflects changes from the last stream only. |
| [flyd/module/**keepwhen**](module/keepwhen) | Keep values from one stream only when another stream is true. |
| [flyd/module/**obj**](module/obj) | Functions for working with stream in objects. |
| [flyd/module/**sampleon**](module/sampleon) | Samples from a stream every time an event occurs on another stream. |
| [flyd/module/**scanmerge**](module/scanmerge) | Merge and scan several streams into one. |
| [flyd/module/**mergeall**](module/mergeall) | Merge a list of streams. |
| [flyd/module/**takeuntil**](module/takeuntil) | Emit values from a stream until a second stream emits a value. |
| [flyd/module/**forwardto**](module/forwardto) | Create a new stream that passes all values through a function and forwards them to a target stream. |
| [flyd/module/**droprepeats**](module/droprepeats) | Drop repeated values from a stream. |
| [**flyd-cacheUntil**](https://github.com/ThomWright/flyd-cacheUntil) | Cache a stream's output until triggered by another stream. |
| [**flyd-keyboard**](https://github.com/raine/flyd-keyboard) | Keyboard events as streams. |
| [**flyd-glob**](https://github.com/StreetStrider/flyd-glob) | File glob and watch for Flyd. |
| [**flyd-skip**](https://github.com/littlehaker/flyd-skip) | Skip function for flyd. |
| [**flyd-bufferCount**](https://github.com/bertofer/flyd-bufferCount) | Buffers the source stream and emits all values together. |
| [**flyd-mergeAll (with high order streams)**](https://github.com/bertofer/flyd-mergeAll) | rxjs-like implementation of [mergeAll](http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html#instance-method-mergeAll) for flyd. |
| [**flyd-once**](https://github.com/bertofer/flyd-once) | Only emits the first value of the source stream. |
| [**flyd-withLatestFrom**](https://github.com/bertofer/flyd-withLatestFrom) | When the source observable emits, the value also contains the latest value from withLatestFrom parameter stream. |
| [**flyd-zip**](https://github.com/jayrbolton/flyd-zip) | Zip streams together into arrays of values |
| [**flyd-undo**](https://github.com/jayrbolton/flyd-undo) | An undo/redo utility for saving and restoring state in flyd |
| [**flyd-ajax**](https://github.com/jayrbolton/flyd-ajax) | An ajax utility that returns flyd streams |
| [**flyd-xstate**](https://github.com/jayrbolton/flyd-xstate) | Integration of flyd with xstate Harel Statecharts |
| [**flyd-windowresize**](https://github.com/jayrbolton/flyd-windowresize) | Get a stream for the window size |
| [**flyd-stream-querystring**](https://github.com/jayrbolton/flyd-stream-querystring) | Manage the URL query params using flyd streams |
| **Time related** |
| [flyd/module/**every**](module/every) | Takes a number of milliseconds t and creates a stream of the current time updated every t. |
| [flyd/module/**aftersilence**](module/aftersilence) | Buffers values from a source stream in an array and emits it after a specified duration of silence from the source stream. |
| [flyd/module/**inlast**](module/inlast) | Creates a stream that emits a list of all values from the source stream that were emitted in a specified duration. |
| [**flyd-onAnimationFrame**](https://github.com/ThomWright/flyd-onAnimationFrame) | Emits values from a source stream on successive animation frames. |
| [**flyd-timeInterval**](https://github.com/ThomWright/flyd-timeInterval) | Records the time interval between consecutive values emitted from a stream. |
| [**flyd-debounceTime**](https://github.com/bertofer/flyd-debounceTime) | Like aftersilence, but only emits the latest value of the stream. |

## Misc

### The name

The name Flyd was chosen since the author of Flyd is danish and Flyd is a
danish word meaning float, afloat or flow. It is furthermore short and not too
bad for searching.

For most native English speakers "flyd" is impossible to pronounce like a
dane would do it. The "d" is soft like "th" in "the". The "y" is a vocal sound
unknown to the English language. [If you're curious Google Translates listening feature
provides an accurate pronounciation.](https://translate.google.com/#da/en/flyd).

### Atomic updates

Consider the following example:

```javascript
var a = flyd.stream(1);
var b = flyd.combine(function(a) { return a() * 2; }, [a]);
var c = flyd.combine(function(a) { return a() + 4; }, [a]);
var d = flyd.combine(function(b, c, self, ch) {
  result.push(b() + c());
}, [b, c]);
```

The dependency graph looks like this.

```
    a
  /   \
 b     c
  \   /
    d
```

Now, when a value flows down `a`, both `b` and `c` will change because they
depend on `a`. If you merely consider streams as being event emitters you'd expect `d`
to be updated twice. Because `a` triggers `b` triggers `d` after which `a` also
triggers `c` which _again_ triggers `d`.

But Flyd handles such cases optimally. Since only one value entered the
system `d` will only be updated once with the changed values of `b` and `c`.

Flyd guarantees that when a single value enters the system every stream will
only be updated once, along with their dependencies in their most recent state.

This avoids superfluous updates of your streams and intermediate states when
several streams change at the same time.

Flyd implements atomic updates with a _O(n)_ topological sort where _n_
is number of streams that directly or indirectly depends on the updated
stream.

### Environment support

Flyd works in all ECMAScript 5 environments. It works in older environments
with polyfills for `Array.prototype.filter` and `Array.prototype.map`.

### Run tests, generate documentation

To run the test, clone this repository and:

```bash
npm install
npm test
```

The `npm test` command run three tests: a eslint js style checker test, the test of the core library and the test of the modules. If you want to run only the test of the library `npm run test`.

The API.md file is generated using `npm run docs` (it assumes it has documentation installed globally: `npm i -g documentation`)
