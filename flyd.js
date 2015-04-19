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

var toUpdate = [];
var inStream;

function removeListener(listeners, s) {
  var idx = listeners.indexOf(s);
  listeners[idx] = listeners[listeners.length - 1];
  listeners.length--;
}

function map(s, f) {
  return stream([s], function() { return f(s()); });
}

var scan = curryN(3, function(f, acc, s) {
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
  return stream([s1, s2], function() { return s1()(s2()); });
}

function of(v) {
  return stream(v);
}

function initialDepsNotMet(stream) {
  if (!stream.depsMet) {
    stream.depsMet = stream.deps.every(function(s) {
      return s.hasVal;
    });
  }
  return !stream.depsMet;
}

function updateStream(s) {
  if (initialDepsNotMet(s)) return;
  inStream = s;
  var returnVal = s.fn(s, s.depChanged);
  if (returnVal !== undefined) {
    s(returnVal);
  }
  inStream = undefined;
  s.depChanged = undefined;
}

function findDeps(order, s) {
  if (!s.queued) {
    s.queued = true;
    for (var i = 0; i < s.listeners.length; ++i) {
      findDeps(order, s.listeners[i]);
    }
    order.push(s);
  }
}

function updateDeps(s) {
  var i, order = [];
  for (i = 0; i < s.listeners.length; ++i) {
    s.listeners[i].depChanged = s;
    findDeps(order, s.listeners[i]);
  }
  for (i = order.length - 1; i >= 0; --i) {
    if (!isUndefined(order[i].depChanged)) {
      updateStream(order[i]);
    }
    order[i].queued = false;
  }
}

function flushUpdate() {
  for (var s; s = toUpdate.shift();) {
    updateDeps(s);
  }
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
      if (n && isFunction(n.then)) {
        n.then(s);
        return;
      }
      s.val = n;
      s.hasVal = true;
      if (inStream !== s) {
        toUpdate.push(s);
        if (!inStream) flushUpdate();
      } else {
        for (var j = 0; j < s.listeners.length; ++j) {
          s.listeners[j].depChanged = s;
        }
      }
      return s;
    } else {
      return s.val;
    }
  }
  s.hasVal = false;
  s.val = undefined;
  s.listeners = [];
  s.deps = [];
  s.depsMet = isUndefined(waitForDeps) && arguments.length > 1 ? false : true;
  s.depChanged = undefined;
  s.queued = false;
  s.fn = fn;

  s.map = map.bind(null, s);
  s.ap = ap;
  s.of = of;
  s.toString = streamToString;

  if (arguments.length > 1) {
    s.deps = arg;
    arg.forEach(function(dep) {
      dep.listeners.push(s);
    });
    updateStream(s);
    flushUpdate();
  } else if (arguments.length === 1) {
    s(arg);
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
  reduce: scan, // Legacy
  scan: scan,
  destroy: destroy,
  map: curryN(2, function(f, s) { return map(s, f); }),
  curryN: curryN,
  _: _,
};

}));
