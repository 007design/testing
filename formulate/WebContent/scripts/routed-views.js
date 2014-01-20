angular.module('app', ['ui.router', 'ngRoute'])
.config(function ($stateProvider) {
    var states = [
        {
            name: 'home',
            url: '/home'
        },{
            name: 'tab_one',
            url: '/tab_one'
        },{
            name: 'tab_two',
            url: '/tab_two'
        },{
            name: 'tab_two.section_one',
            url: '/section_one'
        },{
            name: 'tab_two.section_two',
            url: '/section_two'
        },{
            name: 'tab_two.section_three',
            url: '/section_three'
        },{
            name: 'tab_two.section_four',
            url: '/section_four'
        }
    ];

    angular.forEach(states, function(state, name){
        $stateProvider.state(state);
    });
})
.service('viewStateSvc', function(){
    var scope = this;
    return scope;
})
.controller('viewStateCtrl', function ($scope, $state, viewStateSvc) {
    $scope.isHome = function(){ return $state.includes('home'); };
    $scope.isTabOne = function(){ return $state.includes('tab_one'); };
    $scope.isTabTwo = function(){ return $state.includes('tab_two'); };
    $scope.isSectionOne = function(){ return $state.includes('tab_two.section_one'); };
    $scope.isSectionTwo = function(){ return $state.includes('tab_two.section_two'); };
    $scope.isSectionThree = function(){ return $state.includes('tab_two.section_three'); };
    $scope.isSectionFour = function(){ return $state.includes('tab_two.section_four'); };
});