var flyd = require('../../lib');

module.exports = function(f /* , streams */) {
  var streams = Array.prototype.slice.call(arguments, 1);
  var vals = [];
  return flyd.combine(function() {
    for (var i = 0; i < streams.length; ++i) vals[i] = streams[i]();
    return f.apply(null, vals);
  }, streams);
};
