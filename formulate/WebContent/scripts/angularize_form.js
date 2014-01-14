function debug(x){try{console.log(x);}catch(e){}}

var app = angular.module('module.angularize', []);

/**
 * Data Service
 * Has a single method, getConfig, which returns an $http promise
 * On success, the data returned from the http request is put into the form property
 */

app.service('DataSvc', function($http){
	var $scope = this;
	
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

	/* Wrap the transcluded content in a div to show/hide it
	 * Notice the field class which invokes the field directive
	 * This allows us to compile the transcluded content into a child scope
	 * At this level the transcluded content is on a sibling scope to the directive
	 * so it has no access to the scope of this directive */
	var tmpl =	'	<div class="field" ng-hide="field.hidden" field="field">'
		+		'		<div ng-transclude></div>' /* The content placed here is on a sibling scope to the directive */
		+		'	</div>';
	
	return {
		restrict:	'C',
		scope:		{},
		transclude:	true,
		template:	tmpl,
		link:		function($scope, elem, attrs, ctrl){
			/* Add the data service to the scope */
			$scope.dataSvc = DataSvc;
			
			/* When dataSvc.form changes update the local field property */
			$scope.$watch('dataSvc.form', function(){
				if ($scope.dataSvc.form)
					$scope.field = $scope.dataSvc.form[attrs.fieldName];
			});			
						
			/* When the field value changes, emit an event and pass the field name and value */
			$scope.$watch('field.value', function(){
				if ($scope.field) {
					$scope.$emit('fieldValueChanged', {'field': attrs.fieldName, 'value': $scope.field.value});
					checkTriggers();
				}
			});
			
			/* On an updateVisibility event, check the field.visibility property for 
			 * visibility config and show/hide the field accordingly
			 */
			$scope.$on('updateVisibility', function(event, args){
				if ($scope.field) {
					angular.forEach($scope.field.visibility, function(val, key){
						if (key === args.field) {
							var regex = new RegExp(val);
							$scope.field.hidden = !(regex.test(args.value));
						}
					});
				}
			});
			
			/* On updateValues event, check the trigger target and repopulate the field options */
			$scope.$on('updateValues', function(event, args){
				if ($scope.field) {
					if (args.target === attrs.fieldName)
						$scope.field.options = args.options;
				}
			});
			
			/* Check if the field has triggers and whether the triggers should fire */
			function checkTriggers(){
				if (!$scope.field.triggers) return;
				
				angular.forEach($scope.field.triggers, function(val, index){
					var fireTrigger = false;
					/* Parse conditions */
					angular.forEach(val.conditions, function(cond, indx){
						if (cond.target === attrs.fieldName)
							if (cond.value === $scope.field.value)
								fireTrigger = true;
					});
					
					if (fireTrigger)
						$scope.$emit('fireTriggers', val);
				});
			}
		}
	};
});

/* Scopes prototypically inherit from their parent so by wrapping the transcluded content in another directive
 * We include it in the parent scope.  Note, however, that the content is a sibling of this directive's scope */
app.directive('field', function(){
	return {
		restrict: 'C',
		scope: {},
		transclude: true,
		template: '<div ng-transclude></div>'
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
		$scope.$broadcast('updateVisibility', args);
	});
	
	$scope.$on('fireTriggers', function(event, args){
		$scope.$broadcast('updateValues', args);
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
				/* Process each input field and add some attributes */
				var fieldName = $(this).find('input, select').first().attr('name');
				
				$(this).attr('field-name', fieldName)
					.find('input, select').attr('ng-model','field.value')
					.filter('select').attr('ng-options','opt.value as opt.value for opt in field.options ');
			});
			
		
		/* Bootstrap the app */
		angular.bootstrap($('body'), ['module.angularize']);
	});
})(jQuery);