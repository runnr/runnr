"use strict";

const Graph = require("./Graph");
const GraphExecutor = require("./GraphExecutor");

module.exports = {
	create(parentContainer, isWritable) {
		return new Graph(parentContainer, isWritable);
	},

	createExecutor(graph, io) {
		const executor = new GraphExecutor(graph, io);

		return executor.connected.then(() => executor);
	}
};
