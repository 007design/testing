/**
 * Create a module
 */
var app = angular.module('app', ['ngRoute']);

app.config(function($routeProvider){
    $routeProvider
        .when('/', { 
            resolve: {
                state: function($route, $location, viewStateSvc){
                    angular.forEach($route.current.params, function(v, k){
                        viewStateSvc[k] = v;
                    });
                }
            }
        })
        .otherwise({redirectTo: '/'});
}).run(function($route) {});

app.service('viewStateSvc', function(){
    var scope = this;
    return scope;
});

/**
 * Accordion section directive
 */
app.directive('accordion', function(viewStateSvc, $route) {
    return {
        restrict: 'C',
        compile: function(tElem){
            tElem.children().addClass('accordion-section');
        },
        controller: function(){
            this.showSection = function(pane){
                console.log(pane);
                //viewStateSvc.showSection = pane;
                $route.current.params.showSection = pane;
                console.log($route.current.params);
            };
        }
    };
});

app.directive('accordionSection', function(viewStateSvc){
    return {
        restrict: 'C',
        scope: true,
        require: '^accordion',
        compile: function(tElem, tAttrs, transclude){
            tElem.find('p').attr('ng-show', 'viewStateSvc.showSection == route');
            
            return function(scope, elem, attrs, ctrl) {
                scope.viewStateSvc = viewStateSvc;
                scope.route = attrs.route;
                
                elem.find('h1,h2,h3').bind('click', function(){
                    scope.$apply(function(){
                        ctrl.showSection(scope.route);
                    });
                });
            }
        }
   }; 
});

app.directive('tabs', function(viewStateSvc){
    return {
        restrict: 'C',
        controller: function(){
            this.showTab = function(tab){
                viewStateSvc.showTab = tab;
            };
        }
    };
});

app.directive('tab', function(viewStateSvc){
    return {
        restrict: 'C',
        require: '^tabs',
        compile: function(tElem, tAttrs, transclude){
            tElem.attr('ng-show', 'viewStateSvc.showTab == tab')
            
            return function(scope, elem, attrs, ctrl){
                scope.viewStateSvc = viewStateSvc;
                scope.tab = attrs.tab;
            }
        }
    };
});

app.controller('viewStateCtrl', function($scope, $route){
    $scope.$on('$routeChangeSuccess', function(){
        console.log('viewStateSvc init');
        console.log($route.current.params);
    });
});