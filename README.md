# Flyd
A simple but powerful functional reactive programming library.

__Note:__ Flyd is pre-release. It works as advertised – but the API might
change. Once I've recieved feedback and become certain of the API an actual
release will happen.

## Introduction

Functional reactive programming is a powerful programming paradigm for
expressing values that change over time. But existing libraries for JavaScript
are huge, complex and has a high learning curve. Flyd is different. It provides
only two functions and can be learnt in just 10 minutes. It is simple but
expressive, powerful and intuitive.

Let's get started!

## Tutorial

Flyd gives you two functions as building block for creating reactive dataflows.
The first `stream` creates a representation of a value that changes over time.
At first sight it works a bit like a getter-setter:

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

The real magic is introduces by the second building block `pipe`! Like `stream`
it creates a stream. But unlike the streams that `stream` creates you don't set
their values. Instead there value depends on other streams. Those streams are
processed by a function and a new value is calculated. For instance:

``javascript
// Create two streams of numbers
var x = stream(4);
var y = stream(6);
// Create a stream that depends on the two previous streams
// and with its value given by the two added together.
var sum = pipe(function() {
  return x() + y();
});
// `sum` is automatically recalculated whenever the streams it depends on changes.
x(12);
sum(); // returns 18
y(8);
sum(); // returns 20
``
