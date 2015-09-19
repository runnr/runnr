"use strict";

const itemMap = new WeakMap();
const dbItem = Symbol("dbItem");

class StoreItem extends require("events") {
	constructor(item, onNewItem) {

		super();

		if(this.constructor === StoreItem)
			throw new Error("StoreItem cannot be instanciated directly.");

		if(!item || typeof item !== "object")
			throw new TypeError("StoreItem can only manage objects.");

		const res = itemMap.get(item);

		if(res)
			return res;

		itemMap.set(item, this);

		this[dbItem] = item;

		if(typeof onNewItem === "function")
			onNewItem.call(this);
	}

	delete() {
		itemMap.delete(this[dbItem]);
	}
}

StoreItem.dbItem = dbItem;

module.exports = StoreItem;
