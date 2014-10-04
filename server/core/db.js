var path = require("path"),
	config = require("../config"),
	Datastore = require("nedb"),
	db;

db = {
	config: new Datastore({ filename:path.join(config.userData, "config.db"), autoload:true }),
	plugins: new Datastore({ filename:path.join(config.userData, "plugins.db"), autoload:true }),
	security: new Datastore({ filename:path.join(config.userData, "security.db"), autoload:true })
};

module.exports = db;