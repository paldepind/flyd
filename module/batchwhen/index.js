var flyd = require('../../lib');
var dropRepeats = require('../droprepeats').dropRepeats;
var contains = require('ramda/src/contains');

// Stream bool -> Stream a -> Stream a
module.exports = flyd.curryN(2, function(sBool, sA) {
  var batch = [];

  var ns = flyd.combine(function(sBool, sA, self, changed) {

    var sBoolChanged = contains(sBool, changed);
    var sAChanged = contains(sA, changed);


    if (sA() !== undefined) {
      // if A is undefined then we dont batch anything
      if (sBoolChanged) {
        if (sAChanged) {
          if (sBool()) {
            // if Bool and A change and were batching then
            // push to the batch
            batch.push(sA());
          } else {
            // if Bool and A change and we're not batching
            // anymore, then push the batch
            batch.push(sA());
            self(batch);
            batch = [];
          }
        } else {
          if (!sBool()) {
            // if Bool changed but A didnt then push the batch
            // if there were any batching
            if (batch.length > 0) {
              self(batch);
              batch = [];
            }
          }
        }
      } else if (sAChanged) {
        if (sBool()) {
          // if we're batching then push to the batch
          batch.push(sA());
        } else {
          // otherwise send it alone
          self([sA()]);
        }
      } else {
        // when we just initialize
        // if theres a value in A
        if (sBool()) {
          batch.push(sA());
        } else {
          self([sA()]);
        }
      }
    }

  }, [dropRepeats(sBool), sA]);

  return ns;
});
