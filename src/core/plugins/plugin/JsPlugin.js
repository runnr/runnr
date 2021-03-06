"use strict";

const { mixins } = require("@runnr/mixin");

const { FsPlugin } = require("./abstract");

class JsPlugin extends mixins(FsPlugin) {
	assign(preset, validatePlugin) {
		return super.assign(preset, { validatePlugin });
	}
}

module.exports = JsPlugin;
