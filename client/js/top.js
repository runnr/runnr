(function() {
	var app = angular.module("top", []),

	TopController = function() {
		this.title = data.title;
	};

	TopController.prototype = {
		actions: [
			{
				name: "messages",
				clicked: function() {

				}
			}, {
				name: "settings",
				clicked: function() {

				}
			}, {
				name: "off",
				clicked: function() {

				}
			}
		]
	};

	app.controller("TopController", TopController);

	app.directive("top", function() {
		return {
			restrict: "E",
			templateUrl: "html/top.html"
		};
	});

})();
