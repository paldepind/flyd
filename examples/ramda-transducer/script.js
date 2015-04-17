var R = require('ramda');
var flyd = require('flyd');

// Let's create a stream of numbers
var numbers = flyd.stream(0);

var isEven = R.compose(R.eq(0), R.modulo(R.__, 2));

// All even numbers multiplied by 3
var evenTimes3 = flyd.transduce(R.pipe(
  R.filter(isEven),
  R.map(R.multiply(3))
), numbers);

flyd.map(function(n) { console.log('evenTimes3: ' + n); }, evenTimes3);

numbers(9)(4)(3)(7)(6)(5);
