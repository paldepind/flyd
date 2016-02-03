var R = require('ramda');
var flyd = require('flyd');

// Let's create a stream of numbers
var numbers = flyd.stream();

var isEven = R.compose(R.identical(0), R.modulo(R.__, 2));

// All even numbers multiplied by 3
var drop3evenTimes3 = flyd.transduce(R.compose(
  R.drop(3),
  R.filter(isEven),
  R.map(R.multiply(3))
), numbers);

flyd.map(function(n) { console.log(n); }, drop3evenTimes3);

numbers(9)(4)(2)(8)(6)(5)(2);
