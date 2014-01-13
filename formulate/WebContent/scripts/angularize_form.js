function debug(x){try{console.log(x);}catch(e){}}

var app = angular.module('module.angularize', []);

/**
 * Data Service
 * Has a single method, getConfig, which returns an $http promise
 * On success, the data returned from the http request is put into the form property
 */

app.service('DataSvc', function($http){
	var $scope = this;
	
	$scope.form = {};
	$scope.getConfig = function(){
		return $http.get('data/angularize_form_data.json').success(function(data){
			$scope.form = data;
		}).error(function(){
			debug('Error getting form data');
		});
	};
	
	return $scope;
});

/**
 * Form Field Directive
 */
app.directive('formField', function($compile, DataSvc){

	/* Wrap the transcluded content in a div to show/hide it */
	var tmpl =	'<div ng-hide="field.hidden" class="field" field="field">field: {{field}}<div class="transcluded" ng-transclude></div><div>';
	
	return {
		restrict:	'C',
		require:	'^form',
		transclude:	true,
		template:	tmpl,
		link:		function($scope, elem, attrs, ctrl){
			/* Add the data service to the scope */
			$scope.dataSvc = DataSvc;
			debug(ctrl[attrs.fieldName]);
			
			$scope.$watch('dataSvc.form', function(){	
				$scope.field = $scope.dataSvc.form[attrs.fieldName];
			});			
						
			/* When the field value changes, emit an event and pass the field name and value */
			$scope.$watch('field.value', function(){
				if ($scope.field)
					$scope.$emit('fieldValueChanged', {'field': attrs.fieldName, 'value': $scope.field.value});
			});
			
			/* On an updateVisibility event, check the field.visibility property for 
			 * visibility config and show/hide the field accordingly
			 */
			$scope.$on('updateVisibility', function(event, args){
				if ($scope.field) {
					angular.forEach($scope.field.visibility, function(val, key){
						if (key === args.field)
							$scope.field.hidden = !(val === args.value);
					});
				}
			});
		}
	};
});

app.directive('field', function(){
	return {
		restrict: 'C',
		scope: { 'field' : '=' },
		link: function($scope, elem, attrs, ctrl){
			debug($scope.field);
		}
	};
});

/**
 * Form Config Controller
 */
app.controller('FormConfigCtrl', function($scope, $compile, DataSvc){
	$scope.dataSvc = DataSvc;
			
	/* On init, load the form data */
	$scope.dataSvc.getConfig().then(function(){
		$scope.form = $scope.dataSvc.form;	
	});
	
	/* When the controller receives a fieldValueChanged event, 
	 * it broadcasts it back down to all the field directives as
	 * an updateVisibility event
	 */ 
	$scope.$on('fieldValueChanged', function(event, args){
		debug('fieldValueChanged');
		$scope.$broadcast('updateVisibility', args);
	});
	
});

/**
 * Document Ready
 * Bootstrap the app
 */
(function($){
	$(document).ready(function(){
		
		/* Add the ng-controller attribute to the body */
		$('.form-one').attr('ng-controller', 'FormConfigCtrl')
			.find('.form-field')
			.each(function(){
				var fieldName = $(this).find('input, select').first().attr('name');
				
				$(this).attr({
					'field-name':	fieldName,
					'ngModel':		'dataSvc.form.'+fieldName
				})
					.find('input, select').attr('ng-model','field.value')
					.filter('select').attr('ng-options','opt.value as opt.value for opt in field.options ');
			});
			
		
		/* Bootstrap the app */
		angular.bootstrap($('body'), ['module.angularize']);
	});
})(jQuery);