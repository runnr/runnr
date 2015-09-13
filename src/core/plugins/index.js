"use strict";

const owe = require("owe.js");
const store = require("./store");
const Plugin = require("./Plugin");

const listView = store.getDynamicView("list") || store.addDynamicView("list").applySimpleSort("name");

const plugins = {
	get list() {
		return listView.mapReduce(plugin => new Plugin(plugin), res => res);
	},

	get(pluginName) {
		return new Plugin(store.by("name", pluginName));
	},

	install(plugin) {
		return Plugin.install(plugin);
	}
};

/* Api: */
const pluginsApi = function() {
	return plugins.list;
};

pluginsApi.install = plugins.install;

owe(pluginsApi, owe.chain([
	owe.serve({
		router: {
			filter: new Set(["install"])
		}
	}),
	owe.reroute(owe(null, plugins.get, () => {
		throw undefined;
	}))
], {
	errors: "last",
	removeNonErrors: true
}));

owe(plugins, owe.reroute(pluginsApi));

module.exports = plugins;