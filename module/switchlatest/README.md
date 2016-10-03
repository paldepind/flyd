# flyd-switchlatest

Flattens a stream of streams. The result stream reflects changes from the
last stream only.

__Graph__

```
a:               {--.----.----}
                    {ab} {a-b}
switchLatest(a): {--ab---a-b--}
```

__Signature__

`Stream (Stream a) -> Stream b`

__Usage__

```javascript
const switchLatest = require('flyd/module/switchlatest')

const chatrooms = flyd.stream()
// For each chatroom on the chatrooms stream, create a stream of chat messages.
// This gives us a series of streams nested within a parent stream.
const messages = flyd.map(createMessageStream, chatrooms)

// Create a single, unnested stream of chat messages
const currentMessages = switchLatest(messagesStreams)
```

