var flyd = require('../../lib');

function isPlainObject(obj) {
  return obj !== null && typeof obj === 'object' && Object.getPrototypeOf(obj) === Object.prototype;
}

var streamProps = function(from) {
  var to = {};
  for (var key in from) {
    if (from.hasOwnProperty(key)) {
      to[key] = isPlainObject(from[key]) ? streamProps(from[key]) : flyd.stream(from[key]);
    }
  }
  return to;
};

var extractProps = function(obj) {
  var newObj = {};
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      newObj[key] = isPlainObject(obj[key]) ? extractProps(obj[key])
                  : flyd.isStream(obj[key]) ? obj[key]()
                                            : obj[key];
    }
  }
  return newObj;
};

var stream = function(obj) {
  var streams = Object.keys(obj).map(function(key) {
    return isPlainObject(obj[key]) ? stream(obj[key])
         : flyd.isStream(obj[key]) ? obj[key]
                                   : flyd.stream(obj[key]);
  });
  return flyd.combine(function() {
    return extractProps(obj);
  }, streams);
};

module.exports = {
  streamProps: streamProps,
  extractProps: extractProps,
  stream: stream
};
