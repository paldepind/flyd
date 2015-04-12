(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/home/simon/projects/flyd/examples/multiple-clicks/node_modules/flyd-aftersilence/aftersilence.js":[function(require,module,exports){
var flyd = require('flyd');

module.exports = function(dur, s) {
  var scheduled;
  var buffer = [];
  var ns = flyd.stream();
  flyd.map(function(v) {
    buffer.push(v);
    clearTimeout(scheduled);
    scheduled = setTimeout(function() {
      ns(buffer);
      buffer = [];
    }, dur);
  }, s);
  return ns;
};

},{"flyd":"/home/simon/projects/flyd/examples/multiple-clicks/node_modules/flyd/flyd.js"}],"/home/simon/projects/flyd/examples/multiple-clicks/node_modules/flyd/flyd.js":[function(require,module,exports){
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
var curStream;
var nextId = 0;
var queue = [];

function flushQueue() {
  for (var q; q = queue.pop();) {
    for (var i = 0; i < q.l.length; ++i) {
      q.l[i](q.v);
    }
  }
}

function addDependency(to, from) {
  if (!(from.id in to.deps)) {
    to.deps[from.id] = from.listeners;
    from.listeners.push(to.update);
  }
}

function checkCirc(stream, id) {
  if (stream.deps[id]) {
    throw new Error('Circular dependency detected');
  }
}

function removeListener(listeners, cb) {
  var idx = listeners.indexOf(cb);
  listeners[idx] = listeners[listeners.length - 1];
  listeners.length--;
}

function map(s, f) {
  return stream([s], function() { return f(s()); }, true);
}

var reduce = curryN(3, function(f, acc, s) {
  var ns = stream([s], function() {
    return (acc = f(acc, s()));
  }, true);
  if (!ns.hasVal) ns(acc);
  return ns;
});

var merge = curryN(2, function(s1, s2) {
  return stream(function(n, changed) {
    var v1, v2;
    if (changed) return changed();
    else {
     v1 = s1(); v2 = s2();
     return v1 === undefined ? v2 : v1;
    }
  });
});

function ap(s2) {
  var s1 = this;
  return stream(function() { return s1()(s2()); });
}

function of(v) {
  return stream()(v);
}

function initialDepsNotMet(stream) {
  if (!isUndefined(stream.initialDeps)) {
    var met = stream.initialDeps.every(function(stream) {
      return stream.hasVal;
    });
    if (met) stream.initialDeps = undefined;
  }
  return !isUndefined(stream.initialDeps);
}

function updateStream(stream, cb, changed) {
  if (initialDepsNotMet(stream)) return;
  curStream = stream;
  var returnVal = cb(stream, changed);
  curStream = undefined;
  if (returnVal !== undefined) stream(returnVal);
  flushQueue();
}

function destroy(stream) {
  if (stream.listeners.length !== 0) {
    throw new Error('Trying to destroy stream with listeners attached');
  }
  for (var id in stream.deps) {
    if (stream.deps[id]) removeListener(stream.deps[id], stream.update);
  }
}

function isStream(stream) {
  return isFunction(stream) && 'id' in stream;
}

function streamToString() {
  return 'stream(' + this.val + ')';
}

function stream(arg) {
  function s(n) {
    if (arguments.length > 0) {
      if (!isUndefined(n) && n !== null && isFunction(n.then)) {
        n.then(s);
        return;
      }
      s.val = n;
      s.hasVal = true;
      if (!isUndefined(curStream)) {
        checkCirc(curStream, s.id);
        queue.push({v: s, l: s.listeners});
      } else {
        s.listeners.forEach(function(f) { f(s); });
      }
      return s;
    } else {
      if (curStream && curStream.dynamicDeps) {
        addDependency(curStream, s);
      }
      return s.val;
    }
  }
  s.hasVal = false;
  s.val = undefined;
  s.listeners = [];
  s.id = nextId++;
  s.deps = {};
  s.initialDeps = undefined;
  s.deps[s.id] = false;
  s.dynamicDeps = true;

  s.map = map.bind(null, s);
  s.ap = ap;
  s.of = of;
  s.toString = streamToString;

  if (arguments.length > 1) {
    s.initialDeps = arg;
    arg = arguments[1];
    if (arguments[2] === true) {
      s.dynamicDeps = false;
    }
  }
  if (arguments.length > 0) {
    if (isFunction(arg)) {
      s.update = updateStream.bind(null, s, arg);
      if (s.initialDeps) {
        s.initialDeps.forEach(function(stream) {
          addDependency(s, stream);
        });
      }
      s.update();
    } else {
      s.val = arg;
      s.hasVal = true;
    }
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

},{}],"/home/simon/projects/flyd/examples/multiple-clicks/script.js":[function(require,module,exports){
var flyd = require('flyd');
var afterSilence = require('flyd-aftersilence');

document.addEventListener('DOMContentLoaded', function() {
  var btnElm = document.getElementById('btn');
  var msgElm = document.getElementById('msg');

  var clickStream = flyd.stream();
  btnElm.addEventListener('click', clickStream);

  var groupedClicks = afterSilence(250, clickStream);
  var nrStream = flyd.map(function(clicks) { return clicks.length; }, groupedClicks);

  flyd.map(function(nr) {
    msgElm.textContent = nr === 1 ? 'click' : nr + ' clicks';
  }, nrStream);

  flyd.map(function(nr) {
    msgElm.textContent = '';
  }, afterSilence(1000, nrStream));
});

},{"flyd":"/home/simon/projects/flyd/examples/multiple-clicks/node_modules/flyd/flyd.js","flyd-aftersilence":"/home/simon/projects/flyd/examples/multiple-clicks/node_modules/flyd-aftersilence/aftersilence.js"}]},{},["/home/simon/projects/flyd/examples/multiple-clicks/script.js"]);
