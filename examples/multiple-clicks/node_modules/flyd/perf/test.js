var _ = require('lodash');
var Benchmark = require('benchmark.js');

var flyd = require('../flyd');
var oldFlyd = require('../flyd');

var stream = flyd.stream;
global.stream = flyd.stream;
global.flyd = flyd;
global.oldFlyd = oldFlyd;

// ************************************************
// Util functions

var suites = [];

function getHz(bench) { // hz adjusted for margin of error
  var result = 1 / (bench.stats.mean + bench.stats.moe);
  return isFinite(result) ? result : 0;
}

function printFastest(suite) {
  var formatNumber = Benchmark.formatNumber,
      fastest = suite.filter('fastest'),
      fastestHz = getHz(fastest[0]),
      slowest = suite.filter('slowest'),
      slowestHz = getHz(slowest[0]),
      aHz = getHz(suite[0]),
      bHz = getHz(suite[1]);
  if (fastest.length > 1) {
    console.log('It\'s too close to call.');
    aHz = bHz = slowestHz;
  } else {
    var percent = ((fastestHz / slowestHz) - 1) * 100;
    console.log('  ' + fastest[0].name + ' is ' +
        formatNumber(percent < 1 ? percent.toFixed(2) : Math.round(percent)) +
        '% faster.');
  }
}

Benchmark.Suite.options.onStart = function() {
  console.log('\n' + this.name + ':');
};

Benchmark.Suite.options.onCycle = function(event) {
  console.log('  ' + event.target);
};

Benchmark.Suite.options.onComplete = function() {
  printFastest(this);
  suites.shift();
  if (suites.length) {
    suites[0].run({async: true});
  }
};

// ************************************************
// Benchmarks!

suites.push(Benchmark.Suite('First map test').add('First', {
  setup: function() {
    function f(x) { return x; }
    var s1 = stream();
    var s2 = s1.map(f);
    var s3 = s2.map(f);
    var s4 = s3.map(f);
    var s5 = s4.map(f);
  },
  fn: function() {
    s1(12);
  },
}).add('Second', {
  setup: function() {
    function f(x) { return x; }
    var s1 = stream();
    var s2 = s1.map(f);
    var s3 = s2.map(f);
    var s4 = s3.map(f);
    var s5 = s4.map(f);
  },
  fn: function() {
    s1(12);
  },
}));

suites.push(Benchmark.Suite('Second map test').add('First', {
  setup: function() {
    var flyd = global.flyd;
    var stream = global.flyd.stream;
    function f(x) { return x; }
    var s1 = stream();
    var s2 = s1.map(f);
    var s3 = s2.map(f);
    var s4 = s3.map(f);
    var s5 = s4.map(f);
  },
  fn: function() {
    s1(12);
  },
}).add('Second', {
  setup: function() {
    var flyd = global.flyd;
    var stream = global.flyd.stream;
    function f(x) { return x; }
    var s1 = stream();
    var s2 = s1.map(f);
    var s3 = s2.map(f);
    var s4 = s3.map(f);
    var s5 = s4.map(f);
  },
  fn: function() {
    s1(12);
  },
}));

suites[0].run({ 'async': true });
