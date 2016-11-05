"use strict";

const { mixins } = require("mixwith");

const { NodeExecutor } = require("../../graph").node;

const { execute } = require("./executor");

class PluginNodeExecutor extends mixins(NodeExecutor) {
	assign(preset, parentGraph) {
		super.assign(preset, parentGraph);

		this.plugin = this.api.plugin;

			return execute(this);
	}
}

module.exports = PluginNodeExecutor;
