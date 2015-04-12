var flyd = require('flyd');
var afterSilence = require('flyd-aftersilence');

document.addEventListener('DOMContentLoaded', function() {
  var btnElm = document.getElementById('btn');
  var msgElm = document.getElementById('msg');

  var clickStream = flyd.stream();
  btnElm.addEventListener('click', clickStream);

  var groupedClicks = afterSilence(250, clickStream);
  var nrStream = flyd.map(function(clicks) { return clicks.length; }, groupedClicks);

  flyd.map(function(nr) {
    msgElm.textContent = nr === 1 ? 'click' : nr + ' clicks';
  }, nrStream);

  flyd.map(function(nr) {
    msgElm.textContent = '';
  }, afterSilence(1000, nrStream));
});
