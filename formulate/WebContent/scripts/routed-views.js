angular.module('app', ['ui.router', 'ngRoute'])
.config(function ($stateProvider) {
        var states = {
            home: {
                name: 'home',
                url: '/home'
            },
            tab_one: {
                name: 'tab_one',
                url: '/tab_one'
            },
            tab_two: {
                name: 'tab_two',
                url: '/tab_two'
            },
            section_one: {
                name: 'tab_two.section_one',
                url: '/tab_two/section_one'
            },
            section_two: {
                name: 'tab_two.section_two',
                url: '/tab_two/section_two'
            }
        };

        angular.forEach(states, function(state, name){
            $stateProvider.state(state);
        });
    })
.run(['$state', function ($state) {
   $state.transitionTo('home');
}])
.service('viewStateSvc', function(){
    var scope = this;
    return scope;
})
.directive('accordionSection', function(viewStateSvc){
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
})
.controller('viewStateCtrl', function ($scope, $state, viewStateSvc) {
    $scope.viewStateSvc = viewStateSvc;

    $scope.$on('$stateChangeSuccess', function(){
        var bits = $state.current.url.split('/');
        console.log($state.current.url);
        if (bits[1]) $scope.viewStateSvc.showTab = bits[1];
        if (bits[2]) $scope.viewStateSvc.showSection = bits[2];
    });

    $scope.showTab = function (page) {
        $state.transitionTo(page);
    };
    
    $scope.showSection = function(section){
        $state.transitionTo(section);
    };
    
    $scope.isHome = function(){ return $state.includes('home'); };
    $scope.isTabOne = function(){ return $state.includes('tab_one'); };
    $scope.isTabTwo = function(){ return $state.includes('tab_two'); };
});