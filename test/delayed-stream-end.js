var assert = require("assert");
var R = require("ramda");

var flyd = require("../lib");

describe("ending a stream", function () {
  it("delays ending the current stream until dependents have been updated", function () {
    var stream = flyd.stream(1);
    var count = 0;
    stream.map(function () {
      var s1 = stream.map(R.add(1));
      var s2 = stream.map(R.add(2));
      flyd
        .combine(
          function (s1, s2, self) {
            self(s1() + s2());
            self.end(true);
          },
          [s1, s2],
        )
        // was not called prior to #229
        .map(function () { count++ });
    });
    assert.equal(count, 1);
  });
});
