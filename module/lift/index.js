var flyd = require('flyd');

module.exports = function(f /* , streams */) {
  var streams = Array.prototype.slice.call(arguments, 1);
  var vals = [];
  return flyd.stream(streams, function() {
    for (var i = 0; i < streams.length; ++i) vals[i] = streams[i]();
    return f.apply(null, vals);
  });
};
