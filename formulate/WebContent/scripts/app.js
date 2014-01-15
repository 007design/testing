/**
 * Create a module
 */
var app = angular.module('app', []);

/**
 * Accordion section directive
 */
app.directive('accordion', function($compile) {
    return {
        restrict: 'C',
        compile: function(tElem){
            tElem.children().addClass('accordion-section');
        },
        controller: function(){
            this.toggle = function(pane){
                pane.showSection = !pane.showSection;
            };
        }
    };
});

app.directive('accordionSection', function(){
    return {
        restrict: 'C',
        scope:true,
        require: '^accordion',
        compile: function(tElem, tAttrs, transclude){
            tElem.find('p').attr('ng-show', 'showSection');
            
            return function(scope, elem, attrs, ctrl) {
                elem.find('h1,h2').bind('click', function(){
                    console.log(ctrl.showSection);
                    scope.$apply(function(){
                        ctrl.toggle(scope);
                    });
                });
            }
        }
   }; 
});

(function($){
	$(document).ready(function(){
			
		/* Bootstrap the app */
		angular.bootstrap($('body'), ['app']);
	});
})(jQuery);