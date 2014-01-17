angular.module('app', ['ui.router'])
.config(['$stateProvider', function ($stateProvider) {
        var states = {
            home: {
                name: 'home',
                url: '/',
                templateUrl: 'home.html'
            },
            tab_one: {
                name: 'tab_one',
                url: '/tab_one',
                templateUrl: 'tab_one.html'
            },
            tab_two: {
                name: 'tab_two',
                url: '/tab_two',
                templateUrl: 'tab_two.html'
            },
            section_two: {
                name: 'tab_two.section_one',
                url: '/section_one',
                templateUrl: 'tab_two.html',
                resolve: {
                    viewStateSvc: 'viewStateSvc',
                    state: function(viewStateSvc){
                        viewStateSvc.showSection = 'section_one';
                    }
                }
            },
            section_one: {
                name: 'tab_two.section_two',
                url: '/section_two',
                templateUrl: 'tab_two.html',
                resolve: {
                    viewStateSvc: 'viewStateSvc',
                    state: function(viewStateSvc){
                        viewStateSvc.showSection = 'section_two';
                    }
                }
            }
        };

        angular.forEach(states, function(state, name){
            $stateProvider.state(state);
        });
    }])
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
.controller('viewStateCtrl', function ($scope, $state, $stateParams) {

    $scope.$on('$stateChangeSuccess', function(){
        console.log($stateParams);
    });

    $scope.showTab = function (page) {
        $state.transitionTo(page);
    };
    
    $scope.showSection = function(section){
        $state.transitionTo(section);
    };
});