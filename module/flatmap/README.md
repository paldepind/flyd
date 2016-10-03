# flyd-flatmap

Flatten a stream of streams into a single stream of values. This is useful for
composing nested streams together to get a single stream of the final result
values.

__Graph__

```
a:          {---.------.----}
                {a-b}  {a-b}
flatMap(a): {---a-b----a-b--}
```

__Signature__

`(a -> Stream b) -> Stream a -> Stream b`

__Usage__

```
const flatMap = require('flyd/module/flatmap')
const request = require('flyd-ajax')

// Form submit events
const submit = flyd.stream()
// Every time the form is submitted, we make an ajax request
// We get a flattened stream of the ajax responses
const responses = flatMap(
  ()=> request({method: 'get', url: 'http://spacejam.com'}).load
, submit)

submit(true)
flyd.map(resp => console.log(resp), responses)
// {body: "SpaceJam...", status: 200, ...}


const R = require('ramda')
const click$ = flyd.stream()

// Once a user makes a click, we want to make three different ajax requests.
// But, each ajax request must happen in sequence, and we want a stream of the final result value
const response$ = R.compose(
  flatMap(requestStream3)
, flatMap(requestStream2)
, flatMap(requestStream1)
)(click$)
// response$ will be a stream of final ajax responses from requestStream3
// requestStream1 will trigger on every click
// requestStream2 will trigger when requestStream1 is completed
// requestStream3 will trigger when requestStream2 is completed
// finally, response$ will have all the values of the result of requestStream3
```

