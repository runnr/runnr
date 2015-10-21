"use strict";

const owe = require("owe.js");
const StoreItem = require("../../StoreItem");
const Node = require("./Node");
const Edge = require("./Edge");

const nodes = Symbol("nodes");
const edges = Symbol("edges");
const update = StoreItem.update;

class Graph extends StoreItem {
	constructor(preset) {

		const exposed = ["nodes", "edges"];

		super(exposed, exposed, preset);

		if(!this.nodes)
			this.nodes = {};

		if(!this.edges)
			this.edges = {};

		if(!this.idCount)
			this.idCount = 1;

		owe(this, owe.serve({
			router: {
				deep: true,
				filter: new Set(exposed.concat("add", "delete"))
			},
			closer: {
				filter: true
			}
		}));
	}

	[update](type, value) {
		this.emit("update", type, value);
	}

	get nodes() {
		return this[nodes];
	}
	set nodes(val) {
		this[nodes] = operations.prepareGraphList(this, "Node", val);

		this[update]("nodes");
	}

	get edges() {
		return this[edges];
	}
	set edges(val) {
		this[edges] = operations.prepareGraphList(this, "Edge", val);

		this[update]("edges");
	}
}

const operations = {

	prepareGraphList(graph, type, val) {
		Object.keys(val).forEach(id => val[id] = operations[`instanciate${type}`](val[id], graph));

		Object.defineProperty(val, "add", {
			value: this[`add${type}`].bind(this, graph)
		});

		return owe(val, owe.chain([
			owe.serve({
				router: {
					deep: true
				},
				closer: {
					filter: true
				}
			}),
			{
				router: this[`get${type}`].bind(this, graph),
				closer() {
					throw undefined;
				}
			}
		], {
			errors: "last",
			removeNonErrors: true
		}), "rebind");
	},

	instanciateNode(node, graph) {
		node = new Node(node, graph);
		node.on("delete", this.deleteNode.bind(this, graph, node.id));
		return node;
	},

	instanciateEdge(edge, graph) {
		edge = new Edge(edge, graph);
		edge.on("delete", this.deleteEdge.bind(this, graph, edge.id));
		return edge;
	},

	addNode(graph, node) {
		if(!node || typeof node !== "object")
			throw new owe.exposed.TypeError("Nodes have to be objects.");

		const id = graph.idCount + 1;

		node.id = id;
		node = graph.nodes[id] = this.instanciateNode(node, graph);
		graph.idCount = id;

		graph[update]("addNode", node);

		return node;
	},

	addEdge(graph, edge) {
		if(!edge || typeof edge !== "object")
			throw new owe.exposed.TypeError("Edges have to be objects.");

		const id = graph.idCount + 1;

		edge.id = id;
		edge = graph.edges[id] = this.instanciateEdge(edge, graph);
		graph.idCount = id;

		graph[update]("addEdge", edge);

		return edge;
	},

	getNode(graph, id) {
		if(!(id in graph.nodes))
			throw new owe.exposed.Error(`There is no node with the id ${id}.`);

		return graph.nodes[id];
	},

	getEdge(graph, id) {
		if(!(id in graph.edges))
			throw new owe.exposed.Error(`There is no edge with the id ${id}.`);

		return graph.edges[id];
	},

	deleteNode(graph, id) {
		if(!(id in graph.nodes))
			throw new owe.exposed.Error(`There is no node with the id ${id}.`);

		delete graph.nodes[id];

		graph[update]("deleteNode", id);
	},

	deleteEdge(graph, id) {
		if(!(id in graph.edges))
			throw new owe.exposed.Error(`There is no edge with the id ${id}.`);

		delete graph.edges[id];

		graph[update]("deleteEdge", id);
	}
};

module.exports = Graph;