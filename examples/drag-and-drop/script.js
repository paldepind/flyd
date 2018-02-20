var flyd = require('flyd');
var takeUntil = require('flyd/module/takeuntil');

document.addEventListener('DOMContentLoaded', function() {
  var dragElm = document.getElementById('drag');

  var mousedown  = flyd.stream();
  var mousemove  = flyd.stream();
  var mouseup    = flyd.stream();

  dragElm.addEventListener('mousedown', mousedown);
  document.addEventListener('mousemove', mousemove);
  document.addEventListener('mouseup', mouseup);

  var mousedrag = flyd.chain(function(md) {
    var startX = md.offsetX, startY = md.offsetY;

    return takeUntil(flyd.map(function(mm) {
      mm.preventDefault();

      return {
        left: mm.clientX - startX,
        top: mm.clientY - startY
      };
    }, mousemove), mouseup);
  }, mousedown);

  flyd.on(function(pos) {
    dragElm.style.top = pos.top + 'px';
    dragElm.style.left = pos.left + 'px';
  }, mousedrag);
});
