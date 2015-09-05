var assert = require('assert');
var flyd = require('flyd');
var every = require('../every.js');

describe('every', function() {
  var e;
  afterEach(function() {
    e.end(true);
  });
  it('invokes callback the correct amount of times', function(done) {
    var times = 0;
    e = every(50);
    flyd.map(function() { ++times; }, e);
    setTimeout(function() {
      assert.equal(5, times);
      done();
    }, 225);
  });
  it('ends', function(done) {
    var times = 0;
    e = every(50);
    var endVal;
    flyd.map(function() { ++times; }, e);
    setTimeout(function() {
      assert.equal(5, times);
      endVal = e();
      e.end(true);
      setTimeout(function() {
        assert.equal(endVal, e());
        done();
      }, 225);
    }, 225);
  });
});
