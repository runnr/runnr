var Api = require("./Api"),
	helper = require("./helper"),
	servers = require("./servers"),
	Offer = require("./Offer"),
	ChainedOffer = require("./ChainedOffer");

function ApiRoot(name, publishTo) {

	this._routes = {};

	this.serve = servers(this);

	this.offer(this._routes).router(this.serve.static.routes());

	if(publishTo instanceof ApiRoot)
	publishTo.publish(name, this._routes);

	Api.call(this, name, this._routes);
}

ApiRoot.prototype = Object.create(Api.prototype, {

	File: { value: require("./File") },

	publish: { value: function publish(name, exposed) {

		if(typeof name != "string")
			throw new TypeError("Only string names can be used for publishing.");

		if(!helper.isExposed(exposed))
			throw new TypeError("Only exposed objects can be published.");

		if(name in this._routes)
			throw new Error("The route '"+name+"' is already used.");
		exposed._exposed.published = name;
		this._routes[name] = exposed;

		return this;
	} },

	unpublish: { value: function unpublish(exposed) {
		if(!helper.isExposed(exposed) || exposed._exposed.published === undefined)
			throw new TypeError("Given object was not published.");

		exposed._exposed.published = undefined;
		delete this._routes[exposed._exposed.published];

		return this;
	} },

	offer: { value: function offer(object) {
		return new Offer(object, this);
	} },

	chainedOffer: { value: function chainedOffer(object) {
		return new ChainedOffer(object, this);
	} }
});

module.exports = ApiRoot;