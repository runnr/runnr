var path = require("path"),
	fs = require("fs"),
	Q = require("q"),
	db = require("../db").plugins;

function Plugin(id) {

	this.id = id;

	this.db = Q.ninvoke(db, "findOne", { _id:this.id }).then(function(data) {
		if(data)
			return data;
		throw new Error("A plugin named '"+id+"' is not installed.");
	});

	this.client.parent = this;
}

Plugin.prototype = {

	id: null,
	db: null,

	get installationLocation() {

		return this.db.then(function(db) {
			return db.installationLocation;
		});
	},

	get manifest() {

		return this.db.then(function(db) {
			return db.manifest;
		});
	},

	client: {
		parent: null,

		get html() {

			var t = this;

			return t.parent.db.then(function(db) {

				return Q.ninvoke(fs, "readFile", path.join(db.installationLocation, db.manifest.id, "client", db.manifest.plugin.client)).then(function(html) {
					var result = html;
					return result;
				});
			});
		},

		raw: function(file) {
			return this.parent.db.then(function(db) {
				return path.join(db.installationLocation, db.manifest.id, "client", file);
			});
		}

	}
};

Plugin.install = function install(manifest, installationLocation) {

	db.insert({
		_id: manifest.id,
		manifest: manifest,
		installationLocation: installationLocation
	});

	return manifest.id;
};

module.exports = Plugin;