var flyd = require('../../lib');

module.exports = flyd.curryN(2, function(pairs, acc) {
  // The scanMerged stream and accumulator
  var scanMerged = flyd.stream();
  
  // update scanMerged with any function/stream pair
  // @todo: make atomic currently in order of register in scanMerged.
  var onStream = flyd.on(function(valAndFn){
    scanMerged(valAndFn[1](scanMerged(), valAndFn[0]));
  });
  
  var streamsWithFn = pairs.map(function(streamAndFn) {
    return streamAndFn[0].map(function(x) {
      return [x, streamAndFn[1]];
    });
  });
  
  streamsWithFn.map(onStream);
  
  // Enforce initial value
  scanMerged(acc);
  
  return scanMerged;
});
