# flyd-keepwhen
keepWhen function for Flyd.

Keeps values from the second stream when the first stream is true (true as in
`=== true`).

# Usage
```
var closeDropdown = keepWhen(popupOpen, backgroundClicked);
flyd.map(closeDropdown, function() {
  // Do stuff.
});
```
