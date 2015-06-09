var Benchmark = require('benchmark');


// Attach benchmarks' dependencies to the global
// scope, since the current version of benchmark.js
// doesn't allow for anything simpler
global.stream    = require('../flyd').stream;
global.oldStream = require('../flyd-old').stream;

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

suites.push(Benchmark.Suite('dynamic dependencies').add('New', {
  setup: function() {
    var s = stream();
    stream(function() {
      return s();
    });
  },
  fn: function() {
    s(12);
  },
}).add('Old', {
  setup: function() {
    var s = oldStream();
    oldStream(function() {
      return s();
    });
  },
  fn: function() {
    s(12);
  },
}));

suites.push(Benchmark.Suite('static dependencies').add('New', {
  setup: function() {
    var s = stream();
    stream([s], function() {
      return s();
    });
  },
  fn: function() {
    s(12);
  },
}).add('Old', {
  setup: function() {
    var s = oldStream();
    oldStream([s], function() {
      return s();
    });
  },
  fn: function() {
    s(12);
  },
}));

suites.push(Benchmark.Suite('map').add('First', {
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

suites.push(Benchmark.Suite('dynamic dependency graph').add('New', {
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
}).add('Old', {
  setup: function() {
    var s1 = oldStream();
    var s2 = oldStream(function() {
      s1(); s1();
    });
    var s3 = oldStream(function() {
      s1(); s2(); s1();
    });
    var s4 = oldStream(function() {
      s1(); s2(); s3(); s1(); s3();
    });
    oldStream(function() {
      s3(); s2(); s1(); s3(); s4();
    });
  },
  fn: function() {
    s1(12);
  },
}));

suites[0].run({ 'async': true });
