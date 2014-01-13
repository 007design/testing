
angular.module('formulateDirectives', ['ui.bootstrap'])
/**
 * camelCase function
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
.directive('formulateText', function(AliasSvc){
	return {
        restrict:'C',
        scope:{ field: '=' },
        template: '<input id="input-{{alias}}" type="text" ng-required="isRequired()" ng-model="val" ng-pattern="regex"/>',
        link: function(scope, element, attrs){
			scope.val = '';
			
			scope.$watch('val', function(){
				scope.field.value = scope.val.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
				
				if (scope.val != scope.val.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"'))
					scope.val = scope.val.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
			});
			
    		try {
    			scope.regex = scope.$eval("/"+scope.field.regEx+"/");
        	} catch (x) {
        		if (scope.field.required)
        			scope.regex = /.+/;
        
        		scope.regex = /.*/;
        	}
        	
        	scope.alias = AliasSvc.get(scope.field.label); 
            scope.isRequired = function(){
                return scope.field.required && scope.field.visibility;
            };
						
            scope.$watch('field.value', function(){
				scope.$emit('fireTriggers', scope.field);
            });
        }
    };
})
.directive('formulateTextarea', function(AliasSvc){
	return {
        restrict:'C',
        scope:{ field: '=' },
        template: '<textarea id="input-{{alias}}" ng-required="isRequired()" ng-model="field.value" ng-pattern="regex"></textarea>',        
        link: function(scope, element, attrs){      
        	
        	try {
    			scope.regex = scope.$eval("/"+scope.field.regEx+"/");
        	} catch (x) {
        		if (scope.field.required)
        			scope.regex = /.+/;
        
        		scope.regex = /.*/;
        	}
        	
        	scope.alias = AliasSvc.get(scope.field.label); 
            scope.isRequired = function(){
                return scope.field.required && scope.field.visibility;
            };
            scope.$watch('field.value', function(){
                scope.$emit('fireTriggers', scope.field);
            });
        }
    };
})
.directive('formulateSelect', function(AliasSvc){
	return {
        restrict:'C',
        scope:{ field: '=' },
        template:    '<div>'+
                          '<select id="input-{{alias}}" ng-model="selection" '+
                              'ng-required="isRequired()">'+
                              '<option value=""></option>'+
                              '<option value="{{opt.value}}" ng-repeat="opt in field.options | orderBy:\'value\'" label="{{opt.text}}"></option>'+
                          '</select>'+
                          '<input id="input-{{alias}}-custom" type="text" ng-model="field.value" ng-show="showCustom" ng-required="isRequired()"/>'+
                      '<div>',
        link: function(scope, element, attrs, ctrl) {  
        	scope.alias = AliasSvc.get(scope.field.label); 
        	
        	if (scope.field.custom)
        		scope.field.options.push({id:'other',value:'Other'});
        
            scope.isRequired = function(){
            	if (scope.field)
            		return scope.field.required && scope.field.visibility;
            };      
            angular.forEach(scope.field.options, function(option){
                if (option.defaultValue) {
                    scope.field.value = option.value;
                }
            });
            
            scope.$watch('selection', function(){
            	if (scope.selection){
//                	debug('selection changed');
//                	debug(scope.selection);
            		scope.field.value = scope.selection;
            		scope.showCustom = scope.selection == 'other';
            		if (scope.showCustom)
            			$('#'+scope.alias+'-custom').focus();
            	}
            });
            
            scope.$watch('field.value', function(){
//            	debug('field.value changed');
//            	debug(scope.field);
            	
	            if (scope.selection && !angular.equals(scope.selection, scope.field.value)){
	            	angular.forEach(scope.field.options, function(o){
	            		if (o.value == scope.field.value) {
	            			scope.selection = o;
	            		}
	            	});
            	}
	            
	            scope.$emit('fireTriggers', scope.field);
            });            
        }
    };
})
.directive('formulateCheckboxes', function(AliasSvc){
	return {
        restrict: 'C',
        require: 'ngModel',
        scope: { ngModel: '=' },
        template:	'<div ng-repeat="option in ngModel.options">'+
        		  		'<label class="inline checkbox">'+
        		  			'<input type="checkbox" id="inputElement-{{alias}}{{$index}}" '+
        		  					'ng-model="option.selected" '+
        		  					'value="{{option.value}}" ng-change="update(option)"/>'+
        		  		'{{label(option)}}</label>'+
        		  		'<input id="input-{{alias}}{{$index}}-custom" type="text" ng-model="otherValue" ng-show="showCustom(option)" ng-required="isRequired()"/>'+
        		  	'</div>',
        link: function(scope, element, attrs, ctrl) { 
            var checkCount = 0;
                        
            /**
             * Add a parser to set the validity of the checkboxes
             * They are valid if they are required, visible and something is selected
             */
            ctrl.$parsers.unshift(function(viewValue) {
            	if (scope.ngModel.required && scope.ngModel.visibility) {
            		ctrl.$setValidity('checkbox', !!checkCount);
            		return viewValue;
            	} else if (!scope.ngModel.visibility) {
            		ctrl.$setValidity('checkbox', true);
            	}
            });
                       
            scope.label = function(option){
            	return option.id=='other'?'Other':option.value;
            };
        	
            scope.showCustom = function(option){
            	return option.selected && option.id == 'other';
            };
        	
            scope.update = function(option) {       	
            	if (option) {
	                if (option.selected) {
	                    checkCount ++;
	                } else {
	                    checkCount --;
	                }
            	}
            	
            	if (scope.ngModel.required && scope.ngModel.visibility)
            		ctrl.$setValidity('checkbox', !!checkCount);
                
                scope.updateValue();
            };
            
            scope.updateValue = function(){
            	var val = [];
                angular.forEach(scope.ngModel.options, function(v,k){
                    if (v.selected) {
                    	if (v.value.toLowerCase() == 'other')
                    		val.push(scope.otherValue);
                    	else
                    		val.push(v.value);
                    	
                    }
                });
                scope.ngModel.value = angular.toJson(val);

                scope.$emit('fireTriggers', scope.ngModel.value);
            };

            scope.$watch('ngModel.visibility', function(){
            	if (!scope.ngModel.visibility) {
            		scope.ngModel.value="[]";            		
            		ctrl.$setValidity('checkbox', true);
            		angular.forEach(scope.ngModel.options, function(v,k){
                        v.selected = false;
                    });            		
            	} else {
            		if (scope.ngModel.required && scope.ngModel.visibility)
                		ctrl.$setValidity('checkbox', !!checkCount);
            	}
            });
            
            scope.$watch('otherValue', function(){
            	scope.updateValue();
            });
            
            scope.isRequired = function(){
            	if (!scope.ngModel.required) return false;          
                
                return true;
            };
            
            scope.$watch('ngModel.value', function(){
            	if (scope.ngModel.value) {
            		/**
            		 * Try parsing the value into an array
            		 */
            		try {
            			var checkVals = angular.fromJson(scope.ngModel.value);
            			
            			if (angular.isArray(checkVals)) {
            			
            				/**
            				 * Compare each value in the parsed array with the option values
            				 * If a match is found, mark that field as selected
            				 */
            				for (var b=0; b<checkVals.length; b++) {
            					
			            		for (var a=0; a<scope.ngModel.options.length; a++) {
			            			var o = scope.ngModel.options[a];
		
			            			if (o.value == checkVals[b]) {
			            				if (!o.selected) {
				            				o.selected = true; 
				            				scope.update(o);
				            			}
			            				break;
			            			}
				            		
				            		/**
				            		 * If we're on the last checkbox and no match was found for the value
				            		 * Select the 'other' option if the field allows it and populate the value
				            		 */
				            		if (a == scope.ngModel.options.length-1){
//				            			debug('options');
//				            			debug(scope.ngModel.options);
				            			if (scope.ngModel.options[a].id.toLowerCase() == 'other') {
				            				if (!o.selected) {
					            				o.selected = true;					            				
					            				scope.update(o);
					            			}
				            				scope.otherValue = checkVals[b];
				            			}
				            		}
			            		}
            				}
            			}
            		} catch (x) {
            			try { console.log(x); } catch (x) {}
            		}
        		}
            	
                scope.$emit('fireTriggers', scope.ngModel);
            });  
            
            if (scope.ngModel.required && scope.ngModel.visibility)
            	ctrl.$setValidity('checkbox', !!checkCount);
            if (scope.ngModel.custom)
        		scope.ngModel.options.push({id:'other',value:'Other'});
        	
            /**
             * Set default values
             */
            for (var o in scope.ngModel.options) {        	
            	
            	if (scope.ngModel.options[o].defaultValue) {
            		scope.ngModel.options[o].selected = true;
            		scope.update(scope.ngModel.options[o]);
            	}
            }
            
        }
    };
})
.directive('formulateRadios', function(AliasSvc){
	return {
        restrict:'C',
        require: 'ngModel',
        scope: { ngModel: '=' },
        template: '<div ng-repeat="option in ngModel.options">'+
        	'<label><input id="input-{{alias}}{{$index}}" '+ 
        		'name="input-{{alias}}" value="{{option.id}}" '+ 
        		'type="radio" ng-model="ngModel.selection" ng-click="toggle(option)"/>'+
        	'{{label(option)}}</label>'+
        	'<input id="input-{{alias}}{{$index}}-custom" type="text" ng-model="ngModel.otherValue" ng-show="showCustom(option)" ng-required="isOtherRequired()"/>'+
        	'</div>',
        link: function(scope, element, attrs, ctrl) {      
        	scope.alias = AliasSvc.get(scope.ngModel.label);   
        	
        	ctrl.$parsers.unshift(function(viewValue) {
            	if (scope.ngModel.required && scope.ngModel.visibility) {
            		ctrl.$setValidity('radio', scope.ngModel.value);
            		return viewValue;
            	} else if (!scope.ngModel.visibility) {
            		ctrl.$setValidity('radio', true);
            	}
            });

        	if (scope.ngModel.required && scope.ngModel.visibility)
        		ctrl.$setValidity('radio', scope.ngModel.value);
        	        	
        	if (scope.ngModel.custom)
        		scope.ngModel.options.push({id:'other',value:'Other'});
        	
        	scope.toggle = function(option){
        		scope.selection = option;
        		if (option.id == 'other')
        			scope.ngModel.value = scope.ngModel.otherValue;
        		else
        			scope.ngModel.value = scope.selection.value;
        		
        		scope.$viewValue = scope.ngModel.value;
        		
        		if (scope.ngModel.required && scope.ngModel.visibility) {
            		var valid = scope.ngModel.value && scope.ngModel.value!=null && scope.ngModel.value!='';
            		ctrl.$setValidity('radio', valid);
            	} else if (!scope.ngModel.visibility) {
            		ctrl.$setValidity('radio', true);
            	}
        	};
        	
            scope.showCustom = function(option){
            	if(scope.selection)
            		return angular.equals(scope.selection,option) && scope.selection.id == 'other';
            	return false;
            };
            
            scope.$watch('ngModel.otherValue', function(){
            	if (scope.ngModel.otherValue)
            		scope.ngModel.value = scope.ngModel.otherValue;
            	
            	if (scope.ngModel.required && scope.ngModel.visibility)
            		ctrl.$setValidity('radio', scope.ngModel.otherValue);
            });
            
            // Toggle default options on init
            setTimeout(function(){
	            angular.forEach(scope.ngModel.options, function(option){
	                if (option.defaultValue)
	                    scope.toggle(option);
	            });
            },0);
            
            scope.label = function(option){
            	return option.id=='other'?'Other':option.value;
            };
            
            scope.isOtherRequired = function(){
            	if (scope.selection)
            		return scope.isRequired && scope.selection.id == 'other';
            	return scope.isRequired && scope.ngModel.visibility;
            };
            
            scope.isRequired = function(){
                return scope.ngModel.required && scope.ngModel.visibility;
            };
            
            scope.$watch('ngModel.value', function(){
            	if (!scope.selection) {
                	if (scope.ngModel.value) {
                		
	            		for (var a=0; a<scope.ngModel.options.length; a++) {
	            			var o = scope.ngModel.options[a];

	            			if (o.value == scope.ngModel.value) {
	            				scope.ngModel.selection = o.id;
	            				scope.toggle(o);
	            				break;
	            			}
	            		}
            		}
            	}
            	
                scope.$emit('fireTriggers', scope.ngModel);
            }); 
        }
    };
})
.directive('formulateHidden', function(){
	return {
		restrict: 'C',
		scope: {
			field: '='
		},
		template: '<input type="hidden" ng-model="field.value"/>',
		link: function(scope, elem, attrs, ctrl){
            angular.forEach(scope.field.options, function(option){
                if (option.defaultValue) {
                    scope.field.value = option.value;
                }
            });
		}
	};
})
.directive('formulateDate', function(){
	return {
		restrict: 'C',
		scope: {
			field: '='
		},
		template: '<input type="text" ui-date="{dateFormat:\'MM dd, yy\'}" ui-date-format="MM dd, yy" ng-model="date" ng-required="field.required"/>',
		link: function(scope, elem, attrs, ctrl){
			scope.$watch('date', function(){
				if (scope.date)
					scope.field.value = scope.date;
			});
		}
	};
})
.directive('formulateUpload', function(){})

.directive('previewImage', function(){
	return {
		restrict:'C',
		link: function($scope, element, attr){
			var $img = angular.element('<img/>');
			var $container = angular.element('<div/>').attr('id', 'imgPreviewContainer')
            .append($img).hide()
            .css('position','absolute')
            .appendTo('body');
			
			element
			.mousemove(function(e){		
                $container.css({
                    top: e.pageY - 50 + 'px',
                    left: e.pageX + 50 + 'px'
                });				                
            })
            .hover(function(){	
                $container.show();
                $img.attr( 'src' , element.attr('src') ).show();				                 	
            }, function(){				                
                $container.hide();
                $img.attr('src','').hide();				                
            });
		}
	};
})

.directive('formulateImagePicker', function(){
	return {
		restrict: 'C',
		scope: { field: '=' },
		require: 'ngModel',
		replace: true,
		template: '<div>'+
			'<a class="small-preview thumbnail" ng-click="open()">'+
			'<img ng-src="{{imgSrc}}" class="preview-image" ng-hide="showPlaceholder"/>'+
			'<img src="http://webapps.lakecountypress.com/AmeristarData/image-picker-placeholder.jpg" ng-show="showPlaceholder"/>'+			
			'</a>'+
			'<div modal="shouldBeOpen" close="close()" options="opts">'+
			'    <div class="modal-header"><a class="btn btn-primary pull-right" ng-click="close()">Select Image</a><h4>Select Image</h4><div style="clear:both"></div></div>'+ 
			'    <div class="modal-body">'+
			'        <div class="image-btn" ng-class="{\'active\':field.value==opt.value}" class="pull-left" ng-repeat="opt in field.options">'+
			'            <img ng-src="{{opt.text}}" ng-click="selectImage(opt)"/>'+
			'        </div>'+
			'    </div>'+
			'</div>'+
		'</div>',
		controller: function($scope){         
			$scope.imgSrc = '';
			$scope.open = function () {
				$scope.shouldBeOpen = true;
			};

			$scope.close = function () {
				$scope.shouldBeOpen = false;
			};

			$scope.opts = {
					backdropFade: true,
					dialogFade:true
			};
			
			$scope.selectImage = function(opt){
				$scope.field.value = opt.value;
				$scope.imgSrc = opt.text;
			};
		},
		link: function($scope, elem, attrs, ctrl){   
			$scope.$watch('field.value', function(){
            	if ($scope.field.value) {
            		if ($scope.field.required)
            			ctrl.$setValidity('imagePicker', true);
            		
            		$scope.showPlaceholder = false;
            		$scope.$emit('fireTriggers', $scope.field);
            	} else {
            		$scope.showPlaceholder = true;
            		if ($scope.field.required)
            			ctrl.$setValidity('imagePicker', false);
            	}
            });
		}
	};
})

.directive('formulateCustom', function($filter, $compile){	
	return {
		restrict : 'C',
		scope : { 
			field : '='
		},
		link : function($scope, elem, attrs, ctrl){
			
			debug('template');
			debug($scope.field.template);
						
            $scope.isRequired = function(){
                return $scope.field.required && $scope.field.visibility;
            };
            $scope.$watch('field.value', function(){
            	if ($scope.field.value)
            		$scope.$emit('fireTriggers', $scope.field);
            });
			
            if (!$scope.field.options) $scope.field.options = [];
            
            $scope.$watch('field.options.length', function(){
            	debug('options length: '+$scope.field.options.length);
            });
            
            try {
            	var input = angular.element('<div>'+$scope.field.template+'</div>');
				elem.html(input);
            	var compiledTemplate = $compile(input);
            	compiledTemplate($scope);
            } catch (x) {
            	debug(x.message);
            }
		}
	};
});