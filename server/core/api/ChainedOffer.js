var Q = require("q"),
	helper = require("./helper"),
	Offer = require("./Offer");

function ChainedOffer(object, baseApi) {
	Offer.call(this, object, baseApi, true);

	var routers = this._routers = [],
		providers = this._providers = [],
		server = ChainedOffer.server,
		router = function(route) {
			return server.call(this, routers, arguments);
		},
		provider = function(route) {
			return server.call(this, providers, arguments);
		},

		o = helper.exposer({
			router: { value: router },
			provider: { value: provider }
		});

	Object.defineProperty(object, "_exposed", { value: o });

}

ChainedOffer.server = function(arr, args) {

	if(arr.length === 0)
		throw helper.EMPTY;

	var t = this,
		curr;
	arr.forEach(function(s) {
		if(!curr)
			try {
				curr = s.apply(t, args);
				if(!Q.isPromiseAlike(curr))
					return false;
			} catch(err) {
				curr = Q.reject(err);
			}
		else
			curr.then(undefined, function(err) {
				return s.apply(t, [].concat(args, [err]));
			});
	});
	return curr;
};

ChainedOffer.prototype = Object.create(Offer.prototype, {

	_pushRouter: { value: function(router) {
		if(typeof router == "function")
			this._routers.push(router);
	} },

	_pushProvider: { value: function(provider) {
		if(typeof provider == "function")
			this._providers.push(provider);
	} },

	router: { value: function(router) {
		var a = arguments.length;
		for(var i = 0; i < a; i++)
			this._pushRouter(helper.routerCast(arguments[i], true));

		return this;
	} },

	provider: { value: function(provider) {
		var a = arguments.length;
		for(var i = 0; i < a; i++)
			this._pushProvider(helper.providerCast(arguments[i], true));

		return this;
	} },

	redirect: { value: function(exposed) {
		var a = arguments.length;
		for(var i = 0; i < a; i++) {
			var v = arguments[i];
			if(!helper.isExposed(v))
				throw new TypeError("Provided redirect target [index = "+i+"] is not exposed.");
			this._pushRouter(v._exposed.router.bind(v));
			this._pushProvider(v._exposed.provider.bind(v));
		}

		return this;
	} }
});

module.exports = ChainedOffer;