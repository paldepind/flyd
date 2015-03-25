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

function reduce(f, acc, s) {
  return stream([s], function() {
    return (acc = f(acc, s()));
  });
}

function merge(s1, s2) {
  return stream(function(n, changed) {
    var v1, v2;
    if (changed) return changed();
    else {
     v1 = s1(), v2 = s2();
     return v1 === undefined ? v2 : v1;
    }
  });
}

function ap(s2) {
  var s1 = this;
  return stream(function() { return s1()(s2()); });
}

function of(v) {
  return stream()(v);
}

function initialDepsNotMet(stream) {
  if (stream.initialDeps) {
    var met = stream.initialDeps.every(function(stream) {
      return !isUndefined(stream());
    });
    if(met) stream.initialDeps = undefined;
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

function destroyStream(stream) {
  if (stream.listeners.length !== 0) {
    throw new Error('Trying to destroy stream with listeners attached');
  }
  for (var id in stream.deps) {
    if (stream.deps[id]) removeListener(stream.deps[id], stream.update);
  }
}

function stream(arg) {
  function s(n) {
    if (arguments.length > 0) {
      if (!isUndefined(n) && n !== null && isFunction(n.then)) {
        n.then(s);
        return;
      }
      s.val = n;
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
  s.val = undefined;
  s.listeners = [];
  s.id = nextId++;
  s.deps = {};
  s.initialDeps = undefined;
  s.deps[s.id] = false;
  s.dynamicDeps = true;

  s.destroy = destroyStream.bind(null, s);
  s.map = map.bind(null, s);
  s.ap = ap;
  s.of = of;

  if (arguments.length > 1) {
    s.initialDeps = arg;
    arg = arguments[1];
    if (arguments[2] === true) {
      s.dynamicDeps = false;
    }
  }
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
  }
  return s;
}

function transduce(xform, source) {
  xform = xform(new StreamTransformer(stream));
  return stream([source], function() {
    return xform.step(undefined, source());
  });
}

function StreamTransformer(res) { }
StreamTransformer.prototype.init = function() { };
StreamTransformer.prototype.result = function() { };
StreamTransformer.prototype.step = function(s, v) { return v; };

return {
  stream: stream,
  transduce: transduce,
  merge: merge,
  reduce: reduce,
  map: function(f, s) {
    if (arguments.length === 2) {
      return map(s, f);
    } else if (arguments.length === 1) {
      return function(s) {
        return map(s, f);
      };
    }
  },
};
}));
