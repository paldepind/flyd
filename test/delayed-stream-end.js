var assert = require('assert');
var R = require('ramda');

var flyd = require('../lib');

function once(s) {
  return flyd.combine(function(s, self) {
    self(s.val)
    self.end(true)
  }, [s])
}
function withLatestFrom() {
  var streams = arguments
  return flyd.combine(function() {
    var self = arguments[arguments.length - 2]
    var result = []
    for (var i = 0; i < streams.length; ++i) {
      if (!streams[i].hasVal) return
      result.push(streams[i].val)
    }
    self(result)
  }, streams)
}

describe('ending a stream', function() {
  it('delays ending the current stream until dependents have been updated', function() {
    var stream = flyd.stream(1)
    function doubled() { return stream.map(R.multiply(2)) }
    var count = 0;
    stream
      .map(function() {
        withLatestFrom(doubled(), doubled())
          .pipe(once)
          .map(function() {
            count++
          })
      })
    assert.equal(count, 1)
  })
})
