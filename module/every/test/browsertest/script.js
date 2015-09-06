var flyd = require('flyd');
var every = require('../every.js');

var dur = 1000;
var startTime, ticks = 0;
var e = every(dur);
flyd.map(function(t) {
  startTime === undefined ? startTime = t : ++ticks;
  console.log(t);
  console.log('Drift: ' + (startTime + (ticks * dur) - t));
  //console.log(t);
}, e);
