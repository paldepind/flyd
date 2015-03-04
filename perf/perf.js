var _ = require('lodash');
var Benchmark = require('benchmark.js');

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

function isStringable(value) {
  return _.isString(value) || (_.has(value, 'toString') && _.isFunction(value.toString));
}

function getSource(fn) {
  var support = {decompilation: true};
  var result = '';
  if (isStringable(fn)) {
    result = String(fn);
  } else if (support.decompilation) {
    // Escape the `{` for Firefox 1.
    result = _.result(/^[^{]+\{([\s\S]*)\}\s*$/.exec(fn), 1);
  }
  // Trim string.
  result = (result || '').replace(/^\s+|\s+$/g, '');
  // Detect strings containing only the "use strict" directive.
  return /^(?:\/\*+[\w\W]*?\*\/|\/\/.*?[\n\r\u2028\u2029]|\s)*(["'])use strict\1;?$/.test(result) ? ''
                                                                                                  : result;
}

function createBenchmark(name, opts) {
  var suite = Benchmark.Suite(name);
  libraries.forEach(function(lib) {
    var libOpts = _.extend({}, opts);
    if (lib.setup) {
      libOpts.setup = getSource(lib.setup) + getSource(opts.setup);
    }
    suite.add(lib.name, opts);
  });
  suites.push(suite);
}

// ************************************************
// Benchmarks!

var flyd = require('../flyd');
var oldFlyd = require('../flyd-old');

var stream = flyd.stream;
global.stream = flyd.stream;

var oldLib = {
  name: 'old',
  setup: function() {
    var flyd = oldFlyd;
    var stream = oldFlyd.stream;
  }
};

var newLib = {
  name: 'new',
  setup: function() {
    var flyd = flyd;
    var stream = flyd.stream;
  }
};

var libraries = [oldLib, newLib];

createBenchmark('dynamic dependencies', {
  setup: function() {
    var s = stream();
    stream(function() {
      return s();
    });
  },
  fn: function() {
    s(12);
  },
});

createBenchmark('static dependencies', {
  setup: function() {
    var s = stream();
    stream([s], function() {
      return s();
    });
  },
  fn: function() {
    s(12);
  },
});

createBenchmark('dynamic dependency graph', {
  setup: function() {
    var s1 = stream();
    var s2 = stream(function() {
      s1(); s1();
    });
    var s3 = stream(function() {
      s1(); s2(); s1();
    });
    var s4 = stream(function() {
      s1(); s2(); s3(); s1(); s3();
    });
    stream(function() {
      s3(); s2(); s1(); s3(); s4();
    });
  },
  fn: function() {
    s1(12);
  },
});

createBenchmark('map', {
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
});

suites[0].run({ 'async': true });
