"use strict";

module.exports = Object.assign(new WeakMap(), {
	delete(api) {
		const meta = this.get(api);

		if(!meta)
			return false;

		meta.listeners.forEach(listener => listener.removeAllFromApi(api));
		Object.unobserve(api, meta.observer);
		super.delete(api);

		return true;
	},

	addListener(api, listener) {
		let meta = this.get(api);

		if(!meta) {
			const observer = () => {
				if(!api.connected)
					this.delete(api);
			};

			meta = {
				listeners: new Set(),
				observer
			};
			Object.observe(api, observer, ["update"]);
			this.set(api, meta);
		}

		meta.listeners.add(listener);

		if(!api.connected)
			this.delete(api);
	},

	removeListener(api, listener) {
		const meta = this.get(api);

		if(!meta)
			return false;

		const res = meta.listeners.delete(listener);

		if(meta.listeners.size === 0)
			this.delete(api);

		return res;
	}
});