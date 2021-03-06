"use strict";

const owe = require("owe.js");
const oweEvents = require("owe-events");
const childProcess = require("child_process");
const path = require("path");

const api = require("./api");

const sandbox = Symbol("sandbox");
const log = Symbol("log");
const dead = Symbol("dead");

class Sandbox {
	constructor(runner) {
		this.runner = runner;

		this[dead] = false;

		this[sandbox] = childProcess.fork(path.join(__dirname, "process"), {
			silent: true,
			execArgv: []
		});

		this[sandbox].on("exit", (code, signal) => {
			console.log(this[log](`[EXIT code=${code} signal=${signal}]`));
			this[dead] = { code, signal };
			this.runner.deactivate();
		});

		// Log output of sandboxes to stdout/stderr:
		this[sandbox].stdout.on("data", data => console.log(this[log](data)));
		this[sandbox].stderr.on("data", data => console.error(this[log](data)));

		// Start an owe client to request data from the sandbox's API:
		this.api = api.client(this[sandbox]).proxified;

		// Start an owe server for this sandbox's runner listening for requests from the sandbox:
		api.server(this[sandbox], owe.api({
			runner: this.runner,
			eventController: oweEvents.controller
		}, owe.serve.router()), {
			origin: {
				eventsApi: this.api.eventController
			}
		});
	}

	get dead() {
		return this[dead];
	}

	[log](data) {
		return `${this.runner.name} #${this.runner.id}:${this[sandbox].pid} > ${String(data).replace(/[\n\r]+$/, "")}`;
	}

	kill(signal) {
		if(this[dead])
			return Promise.resolve(this[dead]);

		this[sandbox].kill(signal);

		return new Promise(resolve => {
			this[sandbox].once("exit", (code, signal) => resolve({ code, signal }));
		});
	}

	/**
	 * Sandbox should not appear in the JSON.stringify outputs used in LokiJS.
	 * @return {undefined} Return nothing.
	 */
	toJSON() {
		return;
	}
}

module.exports = Sandbox;
