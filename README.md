shift-register
=========

Node.js module for reading status of pins from a NTE74HC165 shift register. when pins changed state, the module will emit the shift register pin number that changed and the new value of the pin.


## Quickstart

```js
var shiftRegister = require('shift-register');

shiftRegister.on('stateChange', (pinData)=>{
        console.log(pinData);
        //pinData value: [{id: 1, value: 0}, {id:2, value: 1}, ...]
})

//you can also call the state of the pins directly
console.log(shiftRegister.state);
```

## Install

Easily install the latest via npm:

```bash
$ npm install shift-register
```