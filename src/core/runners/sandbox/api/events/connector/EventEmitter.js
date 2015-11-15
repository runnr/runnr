"use strict";

const expose = require("../expose");
const generating = require("../generatingMaps");

const counter = require("../counter")();
const disconnectCleaner = require("../disconnectCleaner.js");

class EventEmitter {
	constructor(object) {
		this.id = counter.count();
		this.object = object;
		this.events = new generating.Map(event => {
			const eventMeta = {
				apis: new Set(),
				listener() {
					const send = {
						object,
						event,
						args: [...arguments]
					};

					eventMeta.apis.forEach(api => api.close(send));
				}
			};

			this.object.addListener(event, eventMeta.listener);

			return eventMeta;
		});
	}

	addListener(event, api) {
		if(event === "newListener" || event === "removeListener")
			throw expose(new Error(`'${event}' listeners cannot be added by remote clients.`));

		this.events.get(event).apis.add(api);
		disconnectCleaner.attach(api, this);
	}

	removeListener(event, api) {
		if(event == null)
			return this.removeApi(api);

		const eventMeta = this.events.lookup(event);

		if(!eventMeta)
			return false;

		const res = eventMeta.apis.delete(api);

		disconnectCleaner.detach(api, this);

		if(eventMeta.apis.size === 0) {
			this.events.delete(event);
			this.object.removeListener(event, eventMeta.listener);
		}

		return res;
	}

	removeApi(api) {
		let once = false;

		for(const event of this.events.keys())
			once = this.removeListener(event, api) || once;

		return once;
	}

	listeners(event, api) {
		const eventMeta = this.events.lookup(event);

		if(!eventMeta)
			return false;

		return eventMeta.apis.has(api);
	}
}

module.exports = EventEmitter;
