'use strict';

angular.module("runnr.js", ["core", "top", "panes", "themes", "ngAnimate"]);

angular.module("core", []);

angular.module("panes", ["core", "plugins"]);

angular.module("plugins", ["core"]);

angular.module("themes", []);

angular.module("top", ["panes", "core"]);

(function() {
	angular.module("core")
		.controller("MetaController", MetaController);

	MetaController.$inject = ["themes.theme"];

	function MetaController(theme) {
		var t = this;

		t.title = "";

		theme.getTheme().then(function(theme) {
			t.theme = theme;
		});
	}

})();

(function() {
	angular.module("core")
		.factory("core.History", HistoryFactory);

	HistoryFactory.$inject = ["core.State"];

	function HistoryFactory(State) {
		
		function History() {
			this.states = [];
		}
		
		History.prototype = {
			states: null,
			lastMove: 0,
			
			validateState: function(state, noId) {
				return State.isAppendable()?state:new State(state, noId?undefined:this.states.length);
			},
			
			pushState: function(state) {
				this.states.push(this.validateState(state));
				this.lastMove = 1;
			},
			replaceState: function(state) {
				this.states = [];
				this.pushState(state);
				this.lastMove = 0;
			},
			
			backBy: function(by) {
				if(by === undefined)
					by = 1;
				if(isNaN(by))
					return;
				this.states = this.states.slice(0, Math.max(this.states.length - by, 0));
				this.lastMove = -by;
			},
			
			backTo: function(to) {
				if(isNaN(to))
					return;
				to = Math.min(to, this.states.length-1);
				this.lastMove = to - this.states.length
				this.states = this.states.slice(0, to+1);
			},
			
			getState: function(back) {
				if(back === undefined)
					back = 0;
				if(isNaN(back))
					return;
				return this.states[this.states.length-1-back];
			},
			
			getStates: function(back) {
				if(isNaN(back))
					return;
				return this.states.slice(-back);
			}
		};
		
		return History;
	}
})();

(function() {
	angular.module("core")
		.factory("core.State", StateFactory);

	StateFactory.$inject = [];

	function StateFactory() {

		function State(data, id) {
			this.data = State.isState(data)?state.data:data;
			
			Object.defineProperty(this, "id", {
				get: function() {
					return id;
				},
				set: function(val) {
					if(id == undefined)
						id = val;
				}
			});
		}
		
		State.prototype = {
			isIdentified: function() {
				return this.id !== null;
			}
		};
		
		State.isState = function(state) {
			return state instanceof State;
		};
		State.isAppendable = function(state) {
			return State.isState(state) && state.isIdentified();
		};

		return State;
	}
})();

(function() {
	angular.module("core")
		.factory("core.api", api);

	api.$inject = ["$http"];

	function api($http) {

		var api = {
			get: function(url) {
				return $http.post("/api/"+url, { api:true });
			}
		};

		return api;
	}
})();

(function(){
	angular.module("panes")
		.controller("panes.PanesController", PanesController);
	
	PanesController.$inject = ["$scope", "panes.history"];
	
	function PanesController($scope, history) {
		this.history = history;
	}
	
	PanesController.prototype = {
		history: null
	};
	
})();

(function() {
	angular.module("panes")
		.factory("panes.history", historyFactory);
		
	historyFactory.$inject = ["core.History"];
	
	function historyFactory(History) {
		
		var history = new History();
		
		history.validateState = function(state) {
			state = History.prototype.validateState(state, true);
			state.id = this.states.length + state.data.text;
			return state;
		};
			
		return history;
	}
})();

(function() {
	angular.module("plugins")
		.directive("pluginRenderer", pluginRenderer);

	pluginRenderer.$inject = ["$http", "$compile"];

	function pluginRenderer($http, $compile) {

		function linker(scope, element, attrs) {
			scope.plugin().client.html.then(function(html) {

				/*var pluginScope = scope.$new(true);

				pluginScope.i = 3;*/

				var frame = document.createElement("iframe");

				frame.srcdoc = html.data;
				frame.sandbox = "allow-scripts";
				frame.setAttribute("seamless", "");

				element.append(frame);

				element.attr("loaded", "");
			}, function() {
				element.attr("failed", "");
			});
		}

		return {
			restrict: "E",
			scope: {
				plugin: "&plugin"
			},
			terminal: true,
			link: linker
		};
	}

})();

(function() {
	angular.module("plugins")
		.factory("plugins.Plugin", PluginFactory);

	PluginFactory.$inject = ["plugins.api"];

	function PluginFactory(pluginsApi) {

		function Plugin(id) {
			this.id = id;

			this.client = pluginsApi.client(id);

			console.log(id);
		}

		Plugin.prototype = {
			name: null,
			id: null,

			onInitialized: null,

			client: null,
		};

		Plugin.isPlugin = function(plugin) {
			return plugin instanceof Plugin;
		};

		return Plugin;
	}
})();

(function() {
	angular.module("plugins")
		.factory("plugins.api", api);

	api.$inject = ["core.api"];

	function api(coreApi) {

		var api = {
			client: function(id) {
				return {
					get html() {
						return coreApi.get("plugins/"+id+"/"+"client/html");
					}
				};
			}
		};

		return api;
	}
})();

(function() {
	angular.module("themes")
		.directive("preloadThemeLinkingDelay", preloadLinkingDelay);

	preloadLinkingDelay.$inject = ["$q", "$timeout", "themes.theme"];

	function preloadLinkingDelay($q, $timeout, theme) {
		return {
			restrict: "A",
			compile: function() {
				var deferred = $q.defer(),
					delay = $q.defer();
				
				theme.addRenderingPromise($q.all([deferred.promise, delay.promise]));
				
				function link() {
					console.log(scope);
				}
				
				return {
					pre: function(scope, element, attr) {
						$timeout(function() {
							delay.resolve();
						}, attr.preloadThemeLinkingDelay*1);
					},
					post: function() {
						deferred.resolve();
					}
				};
			}
		};
	}

})();

(function() {
	angular.module("themes")
		.directive("showOnThemePreload", showOnThemePreload);

	showOnThemePreload.$inject = ["themes.theme"];

	function showOnThemePreload(theme) {
		return {
			restrict: "A",
			scope: {},
			link: function(scope, element) {
				theme.rendered().then(function() {
					scope.$destroy();
				});
				
				scope.$on("$destroy", function(event) {
					element.remove();
				});
			}
		};
	}

})();

(function() {
	angular.module("themes")
		.directive("themeInclude", themeInclude);

	themeInclude.$inject = ["$compile", "$q", "themes.theme"];

	function themeInclude($compile, $q, theme) {
		return {
			restrict: "E",
			scope: {},
			priority: 3000,
			link: function(scope, element, attrs) {
				if(!attrs.ngInclude) {
					
					var deferred = $q.defer();
					theme.addRenderingPromise(deferred.promise);
					
					theme.getTheme().then(function(theme) {
						element.attr("ng-include", "'api/theme/" + (scope.$eval(attrs.src) || theme.html) +"'");
						element.removeAttr("src");
						$compile(element)(scope);
					});
					
					scope.$on("$includeContentLoaded", deferred.resolve);
					scope.$on("$includeContentError", deferred.reject);
				}
			}
		};
	}
	
})();

(function() {
	angular.module("themes")
		.directive("themeLink", themeLink);

	themeLink.$inject = ["$compile", "$q", "themes.theme"];

	function themeLink($compile, $q, theme) {
		return {
			restrict: "A",
			transclude: "element",
			terminal: true,
			priority: 3001,
			link: function(scope, element) {
				
				theme.getTheme().then(function(theme) {
					var clone = angular.element(document.createElement("link"));
					clone.attr("rel", "stylesheet");
					clone.attr("type", "text/css");
					theme.css.forEach(function(v) {
						clone.attr("href", "api/theme/"+v.file);
						clone.attr("media", v.media || undefined);
						element.after(clone);
						clone = clone.clone();
					});
				});
			}
		};
	}

})();

(function() {
	angular.module("themes")
		.factory("themes.theme", theme);

	theme.$inject = ["$http", "$q"];

	function theme($http, $q) {
		var o = {
			getTheme: function () {
				return themePromise;
			},
			rendered: function() {
				return renderDeferred.promise;
			},
			addRenderingPromise: function(promise) {
				renderPromises++;
				promise.then(function() {
					if(--renderPromises <= 0)
						renderDeferred.resolve();
				}, function() {
					renderDeferred.reject();
				});
			}
		},
		
		themePromise = $http.get("/api/theme/manifest", { responseType:"json" }).then(function(result) {
			return result.data;
		}),
		renderDeferred = $q.defer(),
		renderPromises = 0;
		
		o.addRenderingPromise(themePromise);
		
		return o;
	}
	
})();

(function() {
	angular.module("top")
		.controller("top.ActionController", TopActionController);

	TopActionController.$inject = [];

	function TopActionController() {

	}

	TopActionController.prototype = {
		actions: [
			/*{
				name: "messages",
				clicked: function() {

				}
			},*/ { // TODO: implement messaging API for plugins
				name: "settings",
				clicked: function() {

				}
			}/*, {
				name: "off",
				clicked: function() {

				}
			}*/ // TODO: implement password protected login and logout (later usecase for the off button)
		]
	};

})();

(function() {
	angular.module("top")
		.controller("top.MenuController", MenuController);

	MenuController.$inject = ["panes.history", "plugins.Plugin"];

	function MenuController(panesHistory, Plugin) {
		this.panesHistory = panesHistory;

		this.items = [
			{
				text: "Runners",
				name: "runners",
				plugin: new Plugin("runners")
			}, {
				text: "Plugins",
				name: "plugins",
				plugin: new Plugin("plugins")
			}
		];

		this.activateItem(this.items[1]);
	}

	MenuController.prototype = {
		activeItem: null,
		panesHistory: null,

		items: [],

		activateItem: function(item) {
			this.activeItem = item;
			this.panesHistory.replaceState(item);
		}
	};

})();

//# sourceMappingURL=runnr.js.map