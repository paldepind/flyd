# flyd-aftersilence
Buffers values from a source stream in an array and emits it after a
specified duration of silence from the source stream.

__Signature__

`Stream a -> Stream b`

__Example__

```javascript
afterSilence(function(values) {
  console.log('You achieved a combo of + values.length + '!');
}, afterSilence(1000, birdsShot);
```

```javascript
afterSilence(function(values) {
  console.log('You typed: "' + values.join('') + '" without any pauses');
}, afterSilence(300, characterTyped);
```
