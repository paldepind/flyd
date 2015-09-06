# flyd-switchlatest

Flattens a stream of streams. The result stream reflects changes from the
last stream only.

__Signature__

`Stream (Stream a) -> Stream b`

__Usage__

```javascript
var chatrooms = flyd.stream();
var messagesStreams = flyd.map(function(id) {
  return createMessageStream(id);
}, chatrooms);
var currentMessages = switchLatest(messagesStreams);
```

