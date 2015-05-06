(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var flyd = require('flyd');

module.exports = function(fn, s) {
  return flyd.stream([s], function(self) {
    if (fn(s())) self(s.val);
  });
};

},{"flyd":5}],2:[function(require,module,exports){
var flyd = require('flyd');

module.exports = flyd.curryN(2, function(dur, s) {
  var values = [];
  return flyd.stream([s], function(self) {
    setTimeout(function() {
      self(values = values.slice(1));
    }, dur);
    return (values = values.concat([s()]));
  });
});

},{"flyd":5}],3:[function(require,module,exports){
var flyd = require('flyd');

module.exports = function(f /* , streams */) {
  var streams = Array.prototype.slice.call(arguments, 1);
  var vals = [];
  return flyd.stream(streams, function() {
    for (var i = 0; i < streams.length; ++i) vals[i] = streams[i]();
    return f.apply(null, vals);
  });
};

},{"flyd":5}],4:[function(require,module,exports){
var flyd = require('flyd');

module.exports = flyd.curryN(2, function(s1, s2) {
  return flyd.stream([s1], function() {
    return s2();
  });
});

},{"flyd":5}],5:[function(require,module,exports){
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory); // AMD. Register as an anonymous module.
  } else if (typeof exports === 'object') {
    module.exports = factory(); // NodeJS
  } else { // Browser globals (root is window)
    root.flyd = factory();
  }
}(this, function () {

'use strict';

function isFunction(obj) {
  return !!(obj && obj.constructor && obj.call && obj.apply);
}

function isUndefined(v) {
  return v === undefined;
}

// Globals
var queue = [];
var isFlushingQueue = false;

function flushQueue() {
  if (isFlushingQueue) return;
  isFlushingQueue = true;
  for (var s; s = queue.shift();) {
    s.inQueue = false;
    s.update();
  }
  isFlushingQueue = false;
}

function removeListener(listeners, s) {
  var idx = listeners.indexOf(s);
  listeners[idx] = listeners[listeners.length - 1];
  listeners.length--;
}

function map(s, f) {
  return stream([s], function() { return f(s()); });
}

var reduce = curryN(3, function(f, acc, s) {
  var ns = stream([s], function() {
    return (acc = f(acc, s()));
  });
  if (!ns.hasVal) ns(acc);
  return ns;
});

var merge = curryN(2, function(s1, s2) {
  return stream([s1, s2], function(n, changed) {
    var v1, v2;
    if (changed) return changed();
    else {
     v1 = s1(); v2 = s2();
     return v1 === undefined ? v2 : v1;
    }
  }, true);
});

function ap(s2) {
  var s1 = this;
  return stream([s1, s2], function() { return s1()(s2()); }, true);
}

function of(v) {
  return stream()(v);
}

function initialDepsNotMet(stream) {
  if (!stream.depsMet) {
    stream.depsMet = stream.deps.every(function(s) {
      return s.hasVal;
    });
  }
  return !stream.depsMet;
}

function updateStream() {
  if (initialDepsNotMet(this)) return;
  var returnVal = this.fn(this, this.depChanged);
  if (returnVal !== undefined) this(returnVal);
}

function destroy(stream) {
  if (stream.listeners.length !== 0) {
    throw new Error('Trying to destroy stream with listeners attached');
  }
  stream.deps.forEach(function(dep) { removeListener(dep.listeners, stream); });
}

function isStream(stream) {
  return isFunction(stream) && 'depsMet' in stream;
}

function streamToString() {
  return 'stream(' + this.val + ')';
}

function stream(arg, fn, waitForDeps) {
  function s(n) {
    if (arguments.length > 0) {
      if (!isUndefined(n) && n !== null && isFunction(n.then)) {
        n.then(s);
        return;
      }
      s.val = n;
      s.hasVal = true;
      s.listeners.forEach(function(st) {
        st.depChanged = s;
        if (!st.inQueue) {
          st.inQueue = true;
          queue.push(st);
        }
      });
      flushQueue();
      return s;
    } else {
      return s.val;
    }
  }
  s.hasVal = false;
  s.val = undefined;
  s.listeners = [];
  s.deps = [];
  s.depsMet = isUndefined(waitForDeps) ? false : true;
  s.depChanged = undefined;
  s.inQueue = true;
  s.fn = fn;

  s.map = map.bind(null, s);
  s.ap = ap;
  s.of = of;
  s.toString = streamToString;

  if (arguments.length > 1) {
    s.update = updateStream;
    s.deps = arg;
    arg.forEach(function(dep) {
      dep.listeners.push(s);
    });
    queue.push(s);
    flushQueue();
  } else if (arguments.length === 1) {
    s.val = arg;
    s.hasVal = true;
  }
  return s;
}

var transduce = curryN(2, function(xform, source) {
  xform = xform(new StreamTransformer(stream));
  return stream([source], function() {
    return xform.step(undefined, source());
  });
});

function StreamTransformer(res) { }
StreamTransformer.prototype.init = function() { };
StreamTransformer.prototype.result = function() { };
StreamTransformer.prototype.step = function(s, v) { return v; };

// Own curry implementation snatched from Ramda
// Figure out something nicer later on
var _ = {placeholder: true};

// Detect both own and Ramda placeholder
function isPlaceholder(p) {
  return p === _ || (p && p.ramda === 'placeholder');
}

function toArray(arg) {
  var arr = [];
  for (var i = 0; i < arg.length; ++i) {
    arr[i] = arg[i];
  }
  return arr;
}

// Modified versions of arity and curryN from Ramda
function ofArity(n, fn) {
  if (arguments.length === 1) {
    return ofArity.bind(undefined, n);
  }
  switch (n) {
  case 0:
    return function () {
      return fn.apply(this, arguments);
    };
  case 1:
    return function (a0) {
      void a0;
      return fn.apply(this, arguments);
    };
  case 2:
    return function (a0, a1) {
      void a1;
      return fn.apply(this, arguments);
    };
  case 3:
    return function (a0, a1, a2) {
      void a2;
      return fn.apply(this, arguments);
    };
  case 4:
    return function (a0, a1, a2, a3) {
      void a3;
      return fn.apply(this, arguments);
    };
  case 5:
    return function (a0, a1, a2, a3, a4) {
      void a4;
      return fn.apply(this, arguments);
    };
  case 6:
    return function (a0, a1, a2, a3, a4, a5) {
      void a5;
      return fn.apply(this, arguments);
    };
  case 7:
    return function (a0, a1, a2, a3, a4, a5, a6) {
      void a6;
      return fn.apply(this, arguments);
    };
  case 8:
    return function (a0, a1, a2, a3, a4, a5, a6, a7) {
      void a7;
      return fn.apply(this, arguments);
    };
  case 9:
    return function (a0, a1, a2, a3, a4, a5, a6, a7, a8) {
      void a8;
      return fn.apply(this, arguments);
    };
  case 10:
    return function (a0, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
      void a9;
      return fn.apply(this, arguments);
    };
  default:
    throw new Error('First argument to arity must be a non-negative integer no greater than ten');
  }
}

function curryN(length, fn) {
  return ofArity(length, function () {
    var n = arguments.length;
    var shortfall = length - n;
    var idx = n;
    while (--idx >= 0) {
      if (isPlaceholder(arguments[idx])) {
        shortfall += 1;
      }
    }
    if (shortfall <= 0) {
      return fn.apply(this, arguments);
    } else {
      var initialArgs = toArray(arguments);
      return curryN(shortfall, function () {
        var currentArgs = toArray(arguments);
        var combinedArgs = [];
        var idx = -1;
        while (++idx < n) {
          var val = initialArgs[idx];
          combinedArgs[idx] = isPlaceholder(val) ? currentArgs.shift() : val;
        }
        return fn.apply(this, combinedArgs.concat(currentArgs));
      });
    }
  });
}


return {
  stream: stream,
  isStream: isStream,
  transduce: transduce,
  merge: merge,
  reduce: reduce,
  destroy: destroy,
  map: curryN(2, function(f, s) { return map(s, f); }),
  curryN: curryN,
  _: _,
};

}));

},{}],6:[function(require,module,exports){
var flyd = require('flyd');
var stream = flyd.stream;
var filter = require('flyd-filter');
var lift = require('flyd-lift');
var inLast = require('flyd-inlast');
var sampleOn = require('flyd-sampleon');

var magicSeq = 'abbaba';
var seqLen = magicSeq.length;
var maxTime = 5000;

var setMsg = function(msg) { message.innerHTML = msg; };

document.addEventListener('DOMContentLoaded', function() {
  var clicks = stream();
  btnA.addEventListener('click', clicks.bind(null, 'a'));
  btnB.addEventListener('click', clicks.bind(null, 'b'));

  var correctClicks = flyd.reduce(function(n, c) {
    return magicSeq[n] === c ? n + 1
         : magicSeq[0] === c ? 1
                             : 0;
  }, 0, clicks);

  var clicksInLast5s = inLast(maxTime, clicks);

  lift(function(corrects, inLast5s) {
    var complete = corrects === seqLen, inTime = inLast5s.length >= seqLen;
    setMsg(complete && inTime  ? 'Combination unlocked'
         : complete && !inTime ? "You're not fast enough, try again!"
                               : corrects);
  }, correctClicks, sampleOn(clicks, clicksInLast5s));

  flyd.map(function(c) { console.log('cor', c); }, correctClicks);
  flyd.map(function(c) { console.log('lst', c); }, clicksInLast5s);
});

},{"flyd":5,"flyd-filter":1,"flyd-inlast":2,"flyd-lift":3,"flyd-sampleon":4}]},{},[6]);
