'use strict';

var Promise = require('bluebird'),
	_ = require('lodash'),
	EventEmitter = require('events').EventEmitter,
	Gpio = require('onoff').Gpio;

class shift_register extends EventEmitter {
	constructor(){
		super();
		/*
		 * Set up our pin mappings and configure them.
		 */
		this.load = Promise.promisifyAll(new Gpio(25, 'out')); //27
		this.clock_inhibit = Promise.promisifyAll(new Gpio(18, 'low'));
		this.output = Promise.promisifyAll(new Gpio(23, 'in'));
		this.clock = Promise.promisifyAll(new Gpio(24, 'low'));
		this._state = [];
		this.read();
	}
	get state(){
		return this._state;
	}
	/**
	*	Determines the changed state of the shift register pins and emits the changes
	**/
	set state(stateData){
		var previousState = this._state;
		//get any differences in the previous state and the new state of the pins
		var diff = _.filter(previousState, (obj)=>{
			return !_.findWhere(stateData, obj);
		});
		//emit only if we have changes
		if(diff.length) this.emit('stateChange', diff);
		//set the current state the the new state data
		return this._state = stateData;
	}
	/**
	*	Cycle the shift register load pin to set up the status of the pins
	**/
	loadPins(){
		return new Promise((resolve, reject)=>{
				this.load.writeSync(0)
				this.load.writeSync(1)
			return resolve();
		})
	}
	/**
	* Retrieve the 8-bits of data representing the state of each of the shift registers pins
	**/
	getData(data,clock){
			var promises = [];
			//build array of promises for getting each bit value
			for (var i = 0; i < 8; i++) {
				promises.push(()=>{
					return new Promise((resolve, reject)=>{
						//cycle the clock to push the next value up
						clock.writeSync(0);
						clock.writeSync(1);
						//return the state of the bit (1 or 0)
						return resolve(data.readSync());
					})
				}());
			}
			return Promise.all(promises);
	}
	/*
	*	Watches the shift register for serial events
	*/
	read(){
		setInterval(()=>{
			this.loadPins()
				.then(()=>{
					//can't check pin states while the clock_inhibit pin is high
					this.clock_inhibit.writeSync(0);
					return this.getData(this.output, this.clock);
				})
				.then((data)=>{
					//we are returned an array of integers, map into an array of objects for easier filtering
					this.state = _.map(data, (pinValue, key)=>{
						return { id: key, value:pinValue};
					});
					//set our clock_inhibit to high again to continue returning data from the shift register next go around.
					return this.clock_inhibit.writeSync(1);
				})
		}, 200)
	}
}

module.exports = exports = function(opts){
	return new shift_register(opts);
}