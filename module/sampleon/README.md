# flyd-sampleon
sampleOn for Flyd.

Samples from the second stream every time an event occurs on the first
stream.

__Signature__

`Stream a -> Stream b -> Stream b`

__Usage__

```javascript
// Assume `sendBtnClicked` emits whenever a send button is pressed and
// `messageText` is a stream of the current content of an input field.
// Then `sendMessage` emits the content of the text field whenever the button
// is pressed.
var sendMessage = sampleOn(sendBtnClicked, messageText);
```
