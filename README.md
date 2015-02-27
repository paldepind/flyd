# Flyd
A simple but powerful functional reactive programming library in JavaScript.

__Note:__ Flyd is pre-release. It works as advertised – but the API might
change. Once I've recieved feedback and become certain of the API an actual
release will happen.

## Introduction

Functional reactive programming is a powerful programming paradigm for
expressing values that change over time. But existing libraries for JavaScript
are huge, complex and has a high learning curve.

Flyd is different. It provides only two functions and can be learnt in just 10
minutes. It is simple, expressive, powerful and intuitive.

## Teaser

Let's say you one day find yourself writing a calculator that can only sum two
numbers.

You've defined those two numbers.

```javascript
var x = 3;
var y = 4
```

And calculating the sum is easy.

```javascript
var sum = x + y;
```

But this alone will do your users no good! So you insert the calculated value
in an HTML element for them to see and admire.

```javascript
document.getElementById('sumBox').innerHTML = sum;
```

Sweet! Things are great. But, later in the program you you want to change `x`
to 5!  No problem you think – I'll just update the variable!

```javascript
var x = 3;
var y = 4
var sum = x + y;
document.getElementById('sumBox').innerHTML = sum;
// A while later
x = 5;
```

But, to your great disappointment it seems as if the rest of your program don't
care the slightest about the fact that you've changed `x`! The sum is still
`sum === 7` and the HTML element keeps showing a big fat __7__ to your face.

Wouldn't it be great if you chould just define a special kind of variables that
whould just sorta _flow_ like _streams_ through your program? You chould define
a sum that whould not just equal the current values of `x` and `y` but instead whould
depend on them so that it's value _changed over time_ if its dependents did?

Well, with Flyd you can do just that!
[See the above example implemented with Flyd]
(http://paldepind.github.io/flyd/examples/sum/).

## Tutorial

Flyd gives you two functions as the building blocks for creating reactive dataflows.
The first, `stream`, creates a representation of a value that changes over time.
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

The real magic is introduces by the second building block `pipe`! A pipe is a
stream that depends on other streams. It has a function that produces a value
based on the streams on which it dependents.

To rephrase, `pipe` creates streams just like `stream` does. But you don't set
their values. Instead there value is calculated based on other streams.

```javascript
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
```

Since pipes are streams a pipe can depend on other pipes.

```javascript
// Create two streams of numbers
var x = stream(4);
var y = stream(6);
var doubleX = pipe(function() {
  return 2 * x();
});
var doubleXPlusY(function() {
  return y() + doubleX();
});
doubleXPlusY(); // returns 12
x(2);
doubleXPlusY(); // returns 10
```
