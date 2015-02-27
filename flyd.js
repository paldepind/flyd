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
var curPipe;
var nextId = 0;

var queue = [];

function flushQueue() {
  for (var q; q = queue.pop();) {
    for (var i = 0; i < q.l.length; ++i) {
      q.l[i](q.v);
    }
  }
}

function addDependency(pipe, stream) {
  if (!(stream.id in pipe.deps)) {
    pipe.deps[stream.id] = stream.listeners;
    stream.listeners.push(pipe.update);
  }
}

function checkCirc(pipe, id) {
  if (pipe.deps[id]) {
    throw new Error('Circular dependency detected');
  }
}

function removeListener(listeners, cb) {
  var idx = listeners.indexOf(cb);
  listeners[idx] = listeners[listeners.length - 1];
  listeners.length--;
}

function stream(val) {
  function streamFunc(n) {
    if (arguments.length === 1) {
      val = n;
      if (!isUndefined(curPipe)) {
        checkCirc(curPipe, streamFunc.id);
        queue.push({v: n, l: streamFunc.listeners});
      } else {
        streamFunc.listeners.forEach(function(f) { f(n); });
      }
      return streamFunc;
    } else {
      if (curPipe && curPipe.dynamicDeps)
        addDependency(curPipe, streamFunc);
      return val;
    }
  }
  streamFunc.listeners = [];
  streamFunc.id = nextId++;
  return streamFunc;
}

function initialDepsNotMet(pipe) {
  if (pipe.initialDeps) {
    var met = pipe.initialDeps.every(function(stream) {
      return !isUndefined(stream());
    });
    if(met) pipe.initialDeps = undefined;
  }
  return !isUndefined(pipe.initialDeps);
}

function updatePipe(pipe, cb) {
  if (initialDepsNotMet(pipe)) return;
  curPipe = pipe;
  var returnVal = cb(pipe);
  curPipe = undefined;
  if (returnVal !== undefined) pipe(returnVal);
  flushQueue();
}

function destroyPipe(pipe) {
  if (pipe.listeners.length !== 0) {
    throw new Error('Trying to destroy pipe with listeners attached');
  }
  for (var id in pipe.deps) {
    if (pipe.deps[id]) removeListener(pipe.deps[id], pipe.update);
  }
}

function pipe(f) {
  var newPipe = stream();
  newPipe.deps = {};
  newPipe.initialDeps = undefined;
  newPipe.deps[newPipe.id] = false;
  newPipe.dynamicDeps = true;
  newPipe.update = updatePipe.bind(null, newPipe, f);
  if (arguments.length === 2) {
    f = arguments[1];
    newPipe.update = updatePipe.bind(null, newPipe, f);
    newPipe.initialDeps = arguments[0];
    arguments[0].forEach(function(stream) {
      addDependency(newPipe, stream);
    });
    newPipe.dynamicDeps = false;
  }
  newPipe.destroy = destroyPipe.bind(null, newPipe);
  newPipe.update();
  return newPipe;
}

return {stream: stream, pipe: pipe};
}));
