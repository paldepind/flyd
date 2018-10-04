var flyd = require("../../lib");
var stream = flyd.stream;
var x, y; // Let x and y be globals
document.addEventListener("DOMContentLoaded", function() {
  var sumBox = document.getElementById("sumBox");
  var xBox = document.getElementById("xBox");
  var yBox = document.getElementById("yBox");
  x = stream(10);
  y = stream(20);
  var sum = flyd.combine(
    function(x, y) {
      return x() + y();
    },
    [x, y]
  );
  flyd.map(function(sum) {
    sumBox.innerHTML = sum;
  }, sum);
  flyd.map(function(x) {
    if (typeof x !== "number") {
      // Use called x or y with invalid value
      console.log("Numbers only, please!");
    }
    xBox.innerHTML = x;
  }, x);
  flyd.map(function(y) {
    if (typeof y !== "number") {
      // Use called x or y with invalid value
      console.log("Numbers only, please!");
    }
    yBox.innerHTML = y;
  }, y);
  // Do animations
  function animate(s, elm) {
    flyd.map(function() {
      elm.style.background = "black";
      elm.style.color = "yellow";
      setTimeout(function() {
        elm.style.background = "#ececec";
        elm.style.color = "black";
      }, 220);
    }, s);
  }
  animate(x, xBox);
  animate(y, yBox);
  animate(sum, sumBox);
});
