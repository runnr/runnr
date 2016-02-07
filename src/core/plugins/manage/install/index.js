"use strict";

const owe = require("owe.js");

const manager = require("../../../taskManager");
const helpers = require("./helpers");

function install(plugin, getTarget, dontManage) {
	if(typeof plugin !== "object" || !plugin)
		return Promise.reject(new owe.exposed.TypeError(`Given plugin '${plugin}' cannot be installed.`));

	if(plugin.type in installationTypes) {
		if(typeof getTarget !== "function")
			getTarget = helpers.getTarget;

		/**
		 * @type Plugin
		 */
		let target;

		const delayer = dontManage ? manifest => {
			target = getTarget(manifest);

			return Promise.resolve(manifest);
		} : manifest => manager.delay(
			target = getTarget(manifest),
			new Promise(resolve => setImmediate(() => resolve(promise))),
			"install"
		).then(() => manifest);

		const promise = installationTypes[plugin.type](plugin, delayer)
			.then(manifest => helpers.insertPlugin(target.assign(manifest, true)))
			.catch(err => {
				// If target was newly created by getTarget, destroy it if installation failed:
				if(!target.type)
					helpers.removePlugin(target);

				throw err;
			});

		return promise;
	}
	else
		return Promise.reject(new owe.exposed.Error("Plugins cannot be installed with the given installation method."));
}

const installationTypes = {
	__proto__: null,

	local: require("./local"),
	custom: require("./custom")
};

module.exports = install;
