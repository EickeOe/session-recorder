# (🚧 WIP) Session Recorder

> Imagine that a video camera continuously record the whole page

See also [Session-Player](https://github.com/waynecz/session-player) for consuming Recorder's data

<p align="center">
<img width="48%" src="https://github.com/waynecz/DS/raw/master/session-recorder/record.gif" />

<img width="48%" src="https://github.com/waynecz/DS/raw/master/session-recorder/replay.gif" />
</p>

### Record list:

- DOM mutation
- Network(xhr, fetch, beacon)
- Global Error, Unhandled rejection
- Mouse, Scroll
- Console

### Output like:

```json
[
  {"t": 0, "type": "snapshot", "snapshot": "#document snapshot", "scroll": ... },
  { "t": 1, "type": "node", "add": [{ "html": "<div id>textContent</div>" }], "target": 6 },
  { "t": 2, "type": "form", "target": 16, "k": "value", "v": "2312" },
  { "t": 3, "type": "attr", "target": 14, "attr": { "k": "class", "v": "a" } },
  { "t": 4, "type": "scroll", "x": 0, "y": 10 },
  { "t": 5, "type": "click", "x": 71, "y": 13 },
  { "t": 6, "type": "form", "target": 19, "k": "checked", "v": true },
  { "t": 7, "type": "jserr", "msg": "Type Error: ...", "url": "...", "err": "..." },
  { "t": 8, "type": "xhr", "url": "...", "method": "GET", "response": "21asdcxz" },
  { "t": 9, "type": "fetch", "status": 503, "response": "21asdcxz" },
  { "t": 10, "type": "move", "x": 38, "y": 510 },
  { "t": 11, "type": "console", "l": "warn", "msg": "..." }
]
```

### Code intergration:

<div align="center">
<pre>npm i <a href="https://www.npmjs.com/package/session-recorder">session-recorder</a></pre>
</div>

```javascript
import SessionRecorder from 'session-recorder'

const myReocrder = new SessionRecorder()

myReocrder.start() // make sure start after DOMContentLoaded
myReocrder.end() // stop record
```

<br>

### TODO

- [ ] Use VDOM record mutation
- [ ] Using WebWorker store trail data

<br>

### Build Setup

```shell
# serve file with hot reload at http://localhost:8000
npm run dev

# build with tsc, complie into ESModule
npm run build
```

<br>

### Document (constructing)
