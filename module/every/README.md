# flyd-every
Takes a number of milliseconds t and creates a stream of the current time updated every t.

__Signature__

`Number -> Stream Number`

__Usage__

```javascript
var everySecond = every(1000);
flyd.map(function(time) {
  // I'm called once every second
  console.log('Current time is, time);
}, everySecond);
```
