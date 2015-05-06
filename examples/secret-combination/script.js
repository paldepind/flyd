var flyd = require('flyd');
var stream = flyd.stream;
var filter = require('flyd-filter');
var lift = require('flyd-lift');
var inLast = require('flyd-inlast');
var sampleOn = require('flyd-sampleon');

var magicSeq = 'abbaba';
var seqLen = magicSeq.length;
var maxTime = 5000;

var setMsg = function(msg) { message.innerHTML = msg; };

document.addEventListener('DOMContentLoaded', function() {
  var clicks = stream();
  btnA.addEventListener('click', clicks.bind(null, 'a'));
  btnB.addEventListener('click', clicks.bind(null, 'b'));

  var correctClicks = flyd.reduce(function(n, c) {
    return magicSeq[n] === c ? n + 1
         : magicSeq[0] === c ? 1
                             : 0;
  }, 0, clicks);

  var clicksInLast5s = inLast(maxTime, clicks);

  lift(function(corrects, inLast5s) {
    var complete = corrects === seqLen, inTime = inLast5s.length >= seqLen;
    setMsg(complete && inTime  ? 'Combination unlocked'
         : complete && !inTime ? "You're not fast enough, try again!"
                               : corrects);
  }, correctClicks, sampleOn(clicks, clicksInLast5s));

  flyd.map(function(c) { console.log('cor', c); }, correctClicks);
  flyd.map(function(c) { console.log('lst', c); }, clicksInLast5s);
});
