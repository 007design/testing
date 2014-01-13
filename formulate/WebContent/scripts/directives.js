angular.module('module.directives', [])
/*
 * camelCase function used to create valid IDs out of the field labels
 * ex: a field labeled "Choose a category" could get an attribute like id="chooseACategory"  
 */
.factory('AliasSvc', function(){
	this.get = function(name){
		var alias = '';
		var bits = name.toLowerCase().replace(/[^a-z|0-9| ]/g, "").replace(/ +/g," ").split(" ");
		for (var a=0; a<bits.length; a++) {
			if (a==0)
				alias = bits[a];
			else
				alias += bits[a].substr(0,1).toUpperCase() + bits[a].substr(1);
		}
		return alias;
	};	    
	return this;
})

/*
 * Text field directive
 */
.directive('formulateTextfield', function(AliasSvc){
	return {
        restrict:'C', /* Identified by a class */
        scope:{ field: '=' }, /* Bind the model value passed in by the field attribute to the scope */
        template: '<input id="input-{{alias}}" type="text" ng-required="isRequired()" ng-model="val" ng-pattern="regex"/>',
        link: function($scope, element, attrs){        	
        	/*
        	 * Get the field label alias and add it to the scope
        	 */
        	$scope.alias = AliasSvc.get($scope.field.label); 
        	
			/*
			 * Init the val variable as a string
			 * If we don't do this, angular will assume that val is an object
			 * Not init'ing it doesn't break it, it's just to ensure angular doesn't get confused
			 */
        	$scope.val = '';
			
        	/*
        	 * Watch the val variable for changes update the field.value property
        	 * Also translate any unicode quotes (like from MS Word) into standard quotes
        	 * Not absolutely vital but can be helpful if your backend doesn't understand unicode
        	 */
			$scope.$watch('val', function(){
				$scope.field.value = $scope.val.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
				
				if ($scope.val != $scope.val.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"'))
					$scope.val = $scope.val.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
			});
				
			/*
			 * When the field value changes either from the model updating or, 
			 * more likely, the above $watch emit a fireTriggers event passing in the field
			 */
            $scope.$watch('field.value', function(){
				$scope.$emit('fireTriggers', $scope.field);
            });
			
			/*
			 * Validate the fields regular expression property
			 * If it's invalid, set it to .* or .+ depending on if the field is required
			 */
    		try {
    			$scope.regex = $scope.$eval("/"+$scope.field.regEx+"/");
        	} catch (x) {
        		if ($scope.field.required)
        			$scope.regex = /.+/;
        
        		$scope.regex = /.*/;
        	}
        	
        	/*
        	 * Return true if the field is both required AND visible.
        	 * Prevents hidden, required fields from invalidating the form
        	 */
            $scope.isRequired = function(){
                return $scope.field.required && $scope.field.visibility;
            };
        }
    };
})

/*
 * Select field directive
 */
.directive('formulateSelect', function(AliasSvc){
	/*
	 * Since the template is larger than a single line I'm specifying it as a variable
	 * This keeps all this markup up above the return object, keeping the object properties cleaner-looking
	 */
	var tmpl =	'<div>'+
				    '<select id="input-{{alias}}" ng-model="selection" ng-required="isRequired()">'+
					    '<option value=""></option>'+
					    '<option value="{{opt.value}}" ng-repeat="opt in field.options | orderBy:\'value\'" label="{{opt.value}}"></option>'+
					'</select>'+
					'<input id="input-{{alias}}-custom" type="text" ng-model="field.value" ng-show="showCustom" ng-required="isRequired()"/>'+
				'<div>';
	
	return {
        restrict:'C', /* Restrict to a class */
        scope:{ field: '=' }, /* Bind the field property into the scope */
        template: tmpl, /* Specify the template */
        link: function($scope, element, attrs, ctrl) {  
        	/*
        	 * Field alias added to scope
        	 */
        	$scope.alias = AliasSvc.get($scope.field.label); 
        	
        	/*
        	 * If the field has "custom" specified, append an "other" option to the field options
        	 */
        	if ($scope.field.custom)
        		$scope.field.options.push({id:'other',value:'Other'});
        
        	/*
        	 * Return true if the field is both required AND visible
        	 */
            $scope.isRequired = function(){
            	if ($scope.field)
            		return $scope.field.required && $scope.field.visibility;
            };      
            
            /*
             * Loop thru the options and set field.value if any of them are specified as "default"
             */
            angular.forEach($scope.field.options, function(option){
                if (option.defaultValue) {
                    $scope.field.value = option.value;
                }
            });
            
            /*
             * Watch the selection value in the template and update the field value
             */
            $scope.$watch('selection', function(){
            	if ($scope.selection){
            		$scope.field.value = $scope.selection;
            		
            		/* Set showCustom if the selection is other */
            		$scope.showCustom = $scope.selection == 'Other';
            		if ($scope.showCustom)
            			$('#'+$scope.alias+'-custom').focus(); /* Focus the other text field */
            	}
            });
            
            /*
             * Watch for the field value to change
             */
            $scope.$watch('field.value', function(){    
            	/* 
            	 * Verify that the field and selection values are different
            	 * If they are the same, we don't need to do anything
            	 * If they're different, we need to set the value of the selection to the field value
            	 * This would happen if the model were changed elsewhere (like in the trigger handler)
            	 */
	            if ($scope.selection && !angular.equals($scope.selection, $scope.field.value)){
	            	angular.forEach($scope.field.options, function(o){
	            		if (o.value == $scope.field.value) {
	            			$scope.selection = o;
	            		}
	            	});
            	}
	            
	            /* Emit a fireTriggers event */
	            $scope.$emit('fireTriggers', $scope.field);
            });            
        }
    };
});