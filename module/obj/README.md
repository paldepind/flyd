# flyd-obj

Functions for working with Flyd stream in objects.

- Convert object values from plain values into streams with __streamProps__
- Convert object values from streams into plain values with __extractProps__
- Convert a plain object with stream values into a single stream of plain objects with __stream__

These functions perform these conversions recursively in nested objects.

## streamProps(obj)

Given an object of normal values, turn every value into a stream. It will
stream nested properties recursively.

__Signature__

`Object a -> Object (Stream a)`

__Usage__

```js
const flydObj = require('flyd/module/object')
const obj = {x: 1, y: {z: 2}}
const objOfStreams = flydObj.streamProps(obj)

objOfStreams.x() // 1
objOfStreams.y.z() // 2
```

## extractProps(obj)

Given an object that contains streams for values, extract everything into an
object of regular values. It will extract nested properties recursively.

__Signature__

`Object (Stream a) -> Object a`

__Usage__

```js
const objOfStreams = {x: flyd.stream(1), y: {z: flyd.stream(2)}}
const obj = flydObj.extractProps(objOfStreams)
//obj is {x: 1, y: {z: 2}}
```

## stream(obj)

Given an object containing streams, combine all the streams into a single stream of plain objects.

__Signature__

`Object (Stream a) -> Stream (Object a)`

__Usage__

```js
const click = flyd.stream()
const message = flyd.map(() => 'Hello world!', state.click)
const state = {click, message}

const stateStream = flydObj.stream(state)

stateStream() // {click: undefined, message: undefined}

click(true)
stateStream() // {click: true, message: 'Hello World!'}
```

