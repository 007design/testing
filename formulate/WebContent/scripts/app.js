/**
 * Create a module
 */
var app = angular.module('app', []);

app.service('viewStateSvc', function(){
    var scope = this;
    
    scope.showTab = "tab_one";
    
    return scope;
});

app.directive('accordionSection', function(viewStateSvc){
    return {
        restrict: 'C',
        scope: true,
        compile: function(tElem, tAttrs, transclude){
            tElem.find('p').attr('ng-show', 'viewStateSvc.showSection == section');
            
            return function(scope, elem, attrs, ctrl) {
                scope.viewStateSvc = viewStateSvc;
                scope.section = attrs.section;
            }
        }
   }; 
});

app.directive('tabs', function(viewStateSvc){
    return {
        restrict: 'C',
        compile: function(tElem, tAttrs, transclude){
            tElem.find('.tab').each(function(){
                $(this).attr('ng-show', 'viewStateSvc.showTab == \''+$(this).attr('data-tab')+'\'');    
            });
        }
    };
});

app.directive('tab', function(viewStateSvc){
    return {
        restrict: 'C',
        link: function(scope, elem, attrs, ctrl){
            scope.viewStateSvc = viewStateSvc;
            scope.tab = attrs.tab;
        }
    };
});

app.controller('viewStateCtrl', function($scope, viewStateSvc){
    $scope.viewStateSvc = viewStateSvc;
    
    $scope.showTab = function(tab){
        viewStateSvc.showTab = tab;
    };
    
    $scope.showSection = function(section){
        viewStateSvc.showTab = 'tab_two';
        viewStateSvc.showSection = section;
    };
});