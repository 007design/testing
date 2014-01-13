/*
 * Debug function. Takes care of browsers that don't understand console.log
 */
function debug(x){try{console.log(x);}catch(e){}}

/*
 * Create a module
 */
var app = angular.module('app', ['module.directives']);

/*
 * Data Retrieval Service
 */
app.service('DataSvc', function($http){
	var $scope = this;
	
	$scope.getData = function(){
		return $http.get('data/form.json')
		.success(function(data){
			$scope.form = data;
		})
		.error(function(){
			debug('Error getting data');
		});
	};
	
	return $scope;
});

/*
 * Main application controller
 */
app.controller('AppCtrl', function($scope, DataSvc, AliasSvc){

	/* Pretty-print something */
	$scope.pretty = function(input){return JSON.stringify(input,0,2); };
	
	/* Load the data on init */
	DataSvc.getData().then(function(){
		$scope.view = DataSvc.form;
	});
	
	/*
	 * Helper function
	 * Returns the viewfield object with the specified id
	 */
		$scope.findField = function(target) {
			for (var a in $scope.view.viewFields) {
				if ($scope.view.viewFields[a].id == target)
					return $scope.view.viewFields[a];
			}
		};

	/*
	 * Process events emitted by view field controllers
	 * This is far too deeply nested, it should be refactored into more manageable chunks
	 */
		$scope.$on('fireTriggers', function(event,source){
			
			/* Make sure we have a source field */
			if (!source) return;
			
			/* Check that the source field has triggers */
			if (!source.triggers) return;
			
			/*
			 * Process each trigger on the source field
			 */
			angular.forEach(source.triggers, function(trigger){
				
				/* Apply the trigger unless something fails later */
				var applyTrigger = true;
					
				/*
				 * Process each trigger condition
				 */
				angular.forEach(trigger.triggerConditions, function(condition){
					
					/* Get the target field */
					var target = $scope.findField(condition.target);
					
					if (!target) applyTrigger = false;
								
					/*
					 * Parse the trigger condition
					 * First we see if the trigger condition value is *, this will match anything so we apply the trigger
					 * Then we ensure that there actually is a condition and a target value and compare them
					 * The values are compared with toLowerCase to be case insensitive but this really should be done with a regex
					 */
					else {					
						try {
							if (condition.value === '*' && target.value && target.value.length>0)
								applyTrigger=true;
							else if (target.value && condition.value) {
								try {
									if (condition.comparison === 1) { // EQUAL
										if (target.value.toLowerCase() != condition.value.toLowerCase()) 
											applyTrigger=false;
										
									} else if (condition.comparison === 0) { // NOT EQUAL
										if (target.value.toLowerCase() == condition.value.toLowerCase()) 
											applyTrigger=false;
										
									} else if (condition.comparison === 2) { // GREATER
										if (target.value <= condition.value) 
											applyTrigger=false;
										
									} else if (condition.comparison === 3) { // LESS
										if (target.value >= condition.value) 
											applyTrigger=false;
										
									}	
								} catch (x) {
									applyTrigger=false;
								}
							} else {
								applyTrigger = false;
							}
						} catch (x) {
							debug('Exception: evaluating field triggers');
						}
					}
				});
				/* End processing trigger conditions */

				/* Get the trigger target field */
				var target = $scope.findField(trigger.target);
				
				/*
				 * All the trigger conditions were met, apply the trigger
				 */				
				if (applyTrigger && target) {
						/*
						 * ValueSet Trigger
						 */
						if (trigger.type === 'valueset') {					
							/*
							 * Rather than simply setting the field value here we broadcast an event
							 * which tells the element to populate with the supplied values.
							 * If there are no values, it populates with the fields "master" values.
							 */
							try {
								if (trigger.triggerValues.length>0)
									$scope.$broadcast('values',{target:trigger.target, values:trigger.triggerValues});
								else
									$scope.$broadcast('values',{target:trigger.target});
							} catch (x) {
								debug('Exception: valueset broadcast');
							}
						} else {
							debug('unknown trigger type: '+trigger.type);
						}
				}
					
			});
			/* End processing triggers */
			
			/*
			 * Emit an event to make the viewfields re-evaluate their visibilityConditions
			 */
			$scope.$broadcast('updateVisibility');	
		});
	/* End Trigger Event Handler */
});

/*
 * Controller specified for each field
 * This contains the updateVisibility and values event handlers
 */
app.controller('FieldCtrl', function($scope){

		/*
		 * Returns true if the field is both required and visible
		 */
		$scope.isRequired = function(){
			return $scope.field.required && $scope.field.visibility;
		};
				
		/*
		 * Fired when any field's value changes
		 * Reevaluate the visibility conditions of the field
		 * There is too much nested-ness going on here, 
		 * it needs to be refactored into more manageable chunks
		 */
		$scope.$on('updateVisibility', function(){
			
			var visibility = true;

			/*
			 * Process each condition
			 */ 
				if ($scope.field.visibilityConditions){
					for (var a=0; a<$scope.field.visibilityConditions.length; a++) {
						var condition = $scope.field.visibilityConditions[a];
						
						/*
						 * If visibility has already been assigned a value
						 * Evaluate the join type of the condition
						 */
						if (visibility) {
							/*
							 * If the join type is 1 (OR) check the visibility var
							 */
							if (condition.join == 1) {
								/*
								 * If the visibility var is 'visible' we've met all the conditions
								 * for the previous round of conditions
								 * Break out of the loop
								 */
								if (visibility == 'visible') {
									break;
								}
							} 
		
							/*
							 * If the join type is 0 (AND) and the visibility is 'hidden', skip to the next condition 
							 */
							else if (condition.join == 0) {
								if (visibility == 'hidden') {
									continue;
								}
							}
						}
		
						/*
						 * Visibility has not been assigned a value yet (i.e. on the first array element)
						 * Or visibility is 'hidden' and the next condition is joined with OR
						 */
		
						var target = $scope.$parent.findField(condition.target);
						
						/*
						 * If the target field is visible
						 */
						if (target.visibility) {
							if (condition.value === '*' && target.value && target.value.length>0)
								visibility = 'visible';
							else {
								if (condition.value && target.value) {
									try {
										if (condition.comparison == 1) { // EQUAL
											visibility = target.value.toLowerCase() == condition.value.toLowerCase() ? 'visible' : 'hidden';    						 
										} else if (condition.comparison == 0) { // NOT EQUAL
											visibility = target.value.toLowerCase() == condition.value.toLowerCase() ? 'hidden' : 'visible';
										}
									} catch (x) {
										visibility = 'hidden';
									}
								} else {
									visibility = 'hidden';
								}
							}
						}
					}
				}

			/*
			 * Set the visibility
			 */
			try {
				if ($scope.field.visibilityConditions){
					if ($scope.field.visibilityConditions.length>0)
						$scope.field.visibility = visibility == 'visible';
				}
			} catch (x) {
				debug('Exception: setting visibility');
			}
		});
		/* End updateVisibility event handler */

		/*
		 * Value Set event listener
		 */
		$scope.$on('values', function(event, args){
			/*
			 * If this field is the target of the trigger
			 */
			if ($scope.field.id == args.target) {
				
				/*
				 * Populate with supplied vals
				 */
				if (args.values) {
					$scope.field.options = angular.copy(args.values);
				} 
				
				/*
				 * Populate with "original" vals
				 */
				else {
					$scope.field.options = angular.copy($scope.masterOptions);
				}
			}
		});	
		/* End valueSet event listener */
});

app.controller('ConfigCtrl', function(){
	$scope.fieldTypes = {};
});