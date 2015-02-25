'use strict';

// Globals
var curPipe;
var nextId = 0;

var queue = [];

function isFunction(obj) {
  return !!(obj && obj.constructor && obj.call && obj.apply);
}

function addDependency(pipe, stream) {
  if (!(stream.id in pipe.deps)) {
    pipe.deps[stream.id] = stream.listeners;
    stream.listeners.push(pipe.update);
  }
}

function checkCirc(pipe, id) {
  if (id in pipe.deps) throw new Error('Circular dependency detected');
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
      if (curPipe) {
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

function updatePipe(pipe, f) {
  curPipe = pipe;
  var returnVal = f(pipe);
  curPipe = undefined;
  for (var q; q = queue.pop();) {
    q.l.forEach(function(f) { f(q.v); });
  }
  if (returnVal !== undefined) pipe(returnVal);
}

function destroyPipe(pipe) {
  if (pipe.listeners.length !== 0) {
    throw new Error('Trying to destroy pipe with listeners attached');
  } else {
    for (var id in pipe.deps)
      removeListener(pipe.deps[id], pipe.update);
  }
}

function pipe(f) {
  var newPipe = stream(), dynamicDeps = true;
  newPipe.deps = {};
  newPipe.dynamicDeps = true;
  newPipe.update = updatePipe.bind(null, newPipe, f);
  if (arguments.length === 2) {
    f = arguments[1];
    newPipe.update = updatePipe.bind(null, newPipe, f);
    arguments[0].forEach(addDependency.bind(null, newPipe));
    newPipe.dynamicDeps = false;
    dynamicDeps = false;
  }
  newPipe.destroy = destroyPipe.bind(null, newPipe);
  newPipe.update();
  return newPipe;
}

exports.stream = stream;
exports.pipe = pipe;
