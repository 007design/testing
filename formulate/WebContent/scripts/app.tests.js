describe('simple test', function(){
    it('should equal two', function(){
       expect(1+1).toEqual(2) 
    });
});

describe('viewStateCtrl test', function() {
    var scope, viewStateSvc;
    
    beforeEach(angular.mock.module('app'));
    //mock the controller for the same reason and include $rootScope and $controller
    beforeEach(angular.mock.inject(function($rootScope, $controller){
        //create an empty scope
        scope = $rootScope.$new();
        viewStateSvc = {};
        //declare the controller and inject our empty scope
        $controller('viewStateCtrl', {$scope: scope, viewStateSvc: viewStateSvc});
    }));
    
    it('should equal tab_one', function(){
        scope.showTab('tab_one');
        expect(viewStateSvc.showTab).toBe('tab_one');
    });
    
    it('should equal tab_two', function(){
        scope.showSection('section_one');
        expect(viewStateSvc.showTab).toBe('tab_two');
    });
});