function debug(input){
	try {
		if (console)
			console.log(input);
	} catch (x) {}
}

/**
 * Called by upload.jsp or update.jsp from iframe
 */
function finishedUploading(fileId, filename, qty, map){
    var scope = angular.element(jQuery('#listUploadTab')[0]).scope();
        
	scope.$apply(function(){
		scope.uploadFinished(fileId, filename, qty, map);
	});
}

(function($){	
	
	/**
	 * Module declaration
	 * inject formulateDirectives and ui.directives
	 */
	angular.module('app', ['formulateDirectives','ui.directives'])
	
	/**
	 * Form Service
	 * Handles apps and docs, reading from and writing to the server 
	 */
	.service('FormSvc', function($http, appId, path, systemId, proxy){
		var $scope = this;
		
		/**
		 * appConfig is a "master" copy of the app created immediately after the app is retrieved
		 * appConfig should never be altered by the user but only by the configuration module
		 */
		$scope.appConfig = {};
		
		/**
		 * doc is the "working" copy of the app which ends up being saved into the users cart
		 * this object will be modified as they configure their product
		 */
		$scope.doc = {};
					
		/**
		 * Load the app
		 */
		$scope.loadApplication = function(success){
			$http.jsonp(path+'/youbiquity/apps/find/'+systemId+'/{appCode:"'+appId+'"}?callback=JSON_CALLBACK').success(function(data){
				
				/**
				 * If the app request returns an array, grab the first item
				 */
				var d = {};
				if (angular.isArray(data)){
					if (data.length > 0)
						d = data[0];
				}else if (angular.isObject(data))
					d = data;
				
				/**
				 * Make two copies of the app
				 */
				$scope.appConfig = angular.copy(d);
				$scope.doc = angular.copy(d);
				
				/**
				 * Add the user id to the doc
				 * This function, getUserId(), is defined in globals.js
				 */
				$scope.doc.user = getUserId();
				
				/**
				 * Call the success function
				 */
		    	if (angular.isDefined(success))
		    		if (angular.isFunction(success))
		    			success($scope.doc);
			});
		};
		
		/**
		 * Save a document into the docs collection and inject an item into the users Promail shopping cart
		 */
		$scope.saveDoc = function(){
			var sub = $scope.getSubmissionObject();
			
			/**
			 * Insert the doc into the collection
			 */
			$http.post(proxy+'/youbiquity/docs/insert/'+systemId, sub).success(function(data){
				
				/**
				 * When the doc is successfully inserted, make an ajax call to inject the item into the shopping cart
				 */
				$http.get('/v5fmsnet/OrdEnt/OEAddCart.asp?NoCheck=1&OECART=1&Remote=1'+
						'&Rqty='+$scope.doc.qty+
						'&OffSeq='+$scope.doc.offerId+
						'&DocId='+data+
						'&PmSess1='+getPmSess()).success(function(){					
					
					/**
					 * Redirect the user to their cart
					 * This function, goCart(), is defined in globals.js
					 */
					goCart();
				}).error(function(data){
					debug(data);
				});
			});
		};
		
		/**
		 * Save an app configuration
		 */
		$scope.saveForm = function(){
			$http.post(proxy+'/youbiquity/apps/insert/'+systemId, $scope.appConfig).success(function(data){
				alert('Saved');
			}).error(function(data){
				debug(data);
			});
		};
		
		/**
		 * Build the submission (document) object
		 */
		$scope.getSubmissionObject = function(){
			
			var adors = {};
			var d = {};
			
			if (!$scope.doc) return;
			if (!$scope.doc.dials) return;
			
			var copy = angular.copy($scope.doc);
			try {
				for (var a=0; a<copy.dials.length; a++){
					adors[ copy.dials[a].id ] = copy.dials[a].value;
				}
			} catch (x) {
				debug('Exception: getSubmissionObject');
			}
				
			copy.dials = adors;
			
			for(var a in copy){
				if (!angular.isFunction(copy[a]))
					if (a != '_id')
						d[a] = copy[a];
			} 

			d.status = 'cart';
						
			return d;
		};
		return $scope;
	})
	
	/**
	 * Recipient List operations
	 */
	.service('ListDataSvc', function($http, FormSvc, path){
		var $scope = this;
		$scope.formSvc = FormSvc;
		
		/** Current table view offset **/
		$scope.offset = 0;
		
		/** Headers of uploaded list **/
		$scope.listHeaders = [];
		/** Headers of document schema **/
		$scope.schemaHeaders = [];
		
		/**
		 * Load a chunk of the list data for preview
		 */
		$scope.getData = function(){
			$http.jsonp(path+'/youbiquity/PreviewList/getData?fileId='+$scope.formSvc.doc.list+'&username='+$scope.formSvc.doc.user+'&offset='+$scope.offset+'&callback=JSON_CALLBACK').success(function(data){
				$scope.data = data;
			});
		};
		
		/**
		 * Retrieve the headers of the list
		 */
		$scope.getHeaders = function(fileId, success){
			$http.jsonp(path+'/youbiquity/MapList/getHeaders?fileId='+fileId+'&username='+$scope.formSvc.doc.user+'&jobId='+$scope.formSvc.doc.jobSpecs.proof+'&callback=JSON_CALLBACK').success(function(data){
				$scope.listHeaders = data.listHeaders;
				$scope.schemaHeaders = data.schemaHeaders;
				
				if (angular.isDefined(success) && angular.isFunction(success))
					success(data);
			});
		};
		
		return $scope;
	})
	
	/**
	 * Responsible solely for holding the state property which determines what tab the user is seeing
	 */
	.service('ViewStateSvc', function(){
		var $scope = this;		
		$scope.state = 'customize';		
		return $scope;
	})
	
	/**
	 * Proof Service
	 * Send proof job to the server and check for it to come back
	 */
	.service('ProofSvc', function($http, $timeout, path, proxy){
		var $scope = this;
		
		/**
		 * Initiate proof generation
		 */
		$scope.generateJpg = function(data, success, error){
			$scope.result = $http.post(proxy+'/youbiquity/GenerateProof', data).success(function(resp){
				/** Check for completion **/
				$scope.checkStatus(resp.jobId, success, error);
			});
		};
		
		$scope.generatePdf = function(data, success, error){
			$http.post(proxy+'/youbiquity/GeneratePrint/one', data).success(function(resp){
				$scope.checkStatus(resp.jobId, success, error);
			});
		};
		
		/**
		 * Check if the job is complete
		 */
		$scope.checkStatus = function(docId, success, error){
			var now = new Date().getTime();
			/**	Check the current status of the proof process **/
			$http.jsonp(path+'/youbiquity/CheckProof?id='+docId+'&junk='+now+'&callback=JSON_CALLBACK').success(function(data){
				
				if (data.result == 'complete') {
					/** If the proof process has finished successfully, then run arg:success **/
					if (angular.isDefined(success) && angular.isFunction(success))
						success(docId);
				} else if (data.result == 'pending') {
					/** If the proof process has not yet finished, wait 3 seconds, then recurse **/
					$timeout(function(){
						$scope.checkStatus(docId, success, error);
					},3000);
				} else if (data.result == 'failed') {
					if (angular.isDefined(error) && angular.isFunction(error))
						error();
					else
						alert('proof generation failed');
				}
			}).error(function(){
				alert('proof generation failed');				
			});
		};
		
		return $scope;
	})
	
	/**
	 * JPG proof button directive
	 */
	.directive('jpgProofButton', function(ProofSvc, FormSvc, path){
		return {
			restrict : 'A',
			scope : { },
			replace : true,
			template : '<div>'+
				'<div ng-show="!generating"><a class="btn btn-large btn-primary" ng-click="generate()">Generate JPG Proof</a></div>'+
				'<div ng-show="generating"><img src="'+path+'/youbiquity/squares-throbber.gif"/></div>'+
			'</div>',
			link : function($scope, elem, attrs, ctrl){
				$scope.proofSvc = ProofSvc;
				$scope.formSvc = FormSvc;
														
				$scope.generate = function(){						
					$scope.generating = true;
					
					$scope.proofSvc.generateJpg($scope.formSvc.getSubmissionObject(), function(jobId){
						$scope.generating = false;
						
						$scope.formSvc.doc.jobSpecs.proof = jobId;
						
						$.fancybox([{
							href : path+'/youbiquity/GetProof?id='+jobId+'&page=0',
							type : 'image'
						},{
							href : path+'/youbiquity/GetProof?id='+jobId+'&page=1',
							type : 'image'
						}]);
					}, function(){
						alert("proof generation failed");
						$scope.generating = false;
					});
				};
			}
		};
	})
	
	/**
	 * PDF proof button directive
	 */
	.directive('pdfProofButton', function(ProofSvc, FormSvc, path){
		return {
			restrict: 'A',
			scope: { 'job': '=' },
			replace: true,
			template: '<div>'+
				'<div ng-show="!generating"><a class="btn btn-large btn-primary" ng-click="generate()">Generate PDF Proof</a></div>'+
				'<div ng-show="generating"><img src="'+path+'/youbiquity/squares-throbber.gif"/></div>'+
			'</div>',
			link: function($scope, elem, attrs, ctrl){
				$scope.proofSvc = ProofSvc;
				$scope.formSvc = FormSvc;
							
				$scope.generate = function(){					
					$scope.generating = true;
					
					$scope.proofSvc.generatePdf($scope.formSvc.getSubmissionObject(), function(jobId){
						$scope.generating = false;
						
						window.open(path+'/youbiquity/DownloadPrint/'+jobId, '_blank');
					}, function(){
						alert("proof generation failed");
						$scope.generating = false;
					});			
				};
				
			}
		};
	})
	
	/**
	 * Responsible for handling app navigation and collecting the submission object
	 */
	.controller('AppCtrl', function($scope, $http, ViewStateSvc, FormSvc){
		$scope.formSvc = FormSvc;
		$scope.viewStateSvc = ViewStateSvc;
		
		$scope.pretty = function(input){return JSON.stringify(input,0,2); };
		
		$scope.activeTab = function(tab){ return tab == $scope.viewStateSvc.state ? 'active' : 'disabled'; };
		
		/**
		 * Only really here in case you want to implement clickable tabs
		 * The issue with that is them getting to a phase like MAP before they UPLOAD a LIST in which case they have nothing to map
		 */
		$scope.selectTab = function(tab) { $scope.viewStateSvc.state = tab; };
		
		$scope.configure = function(){
			if (getUserId() == 'youbiquity')
				$scope.selectTab('configure');
			else
				alert('Sorry, but no.');
			
//			$http.get('user='+getUserId()).success(function(){
//				$scope.selectTab('configure');
//			}).error(function(){
//				alert('Sorry, but no.')
//			});
		};
				
		/**
		 * Compile a submission object
		 */
		$scope.getSubmissionObject = function(){
			return $scope.formSvc.getSubmissionObject();
		};
	})
	
	/**
	 * Controller for the Upload List tab
	 */
	.controller('ListUploadCtrl', function($scope, FormSvc, ViewStateSvc, ListDataSvc, path){			
		$scope.dataSvc = ListDataSvc;
		$scope.formSvc = FormSvc;
		$scope.viewStateSvc = ViewStateSvc;
		
		$scope.path = path;
		
		/**
		 * Called from the upload.jsp or update.jsp in the iframe
		 * If map is not defined, select the Mapping tab, otherwise go to the Preview List tab
		 */
		$scope.uploadFinished = function(fileId, filename, qty, map){
			$scope.formSvc.doc.list = fileId;
			$scope.formSvc.doc.docName = filename;
			$scope.formSvc.doc.qty = qty;
			
			if (!angular.isDefined(map)){
				$scope.viewStateSvc.state = 'map';
				$scope.dataSvc.getHeaders(fileId);
			} else {
				$scope.formSvc.doc.mapping = angular.fromJson(map);
				$scope.viewStateSvc.state = 'list';
			}
				
		};
	})
	
	/**
	 * Controller for the Map List tab
	 */
	.controller('MapListCtrl', function($scope, FormSvc, ListDataSvc, ViewStateSvc){
		$scope.formSvc = FormSvc;
		$scope.dataSvc = ListDataSvc;
		$scope.viewStateSvc = ViewStateSvc;	
		
		$scope.mapping = {};
				
		/**
		 * Save the mapping to the doc and select the Preview List tab
		 */
		$scope.saveMapping = function(){
			$scope.formSvc.doc.mapping = $scope.mapping;
			$scope.viewStateSvc.state = 'list';
		};
	})
	
	/**
	 * Controller for each mapping row
	 * Simply sets the mapping on the parent controller, MapListCtrl, when the mapping property changes
	 */
	.controller('MapFieldCtrl', function($scope){
		$scope.$watch('mapping', function(){
			if ($scope.mapping)
				$scope.$parent.mapping[$scope.header] = $scope.mapping;
		});
	})
	
	/**
	 * Controller for the list preview tab
	 */
	.controller('PreviewListCtrl', function($scope, FormSvc, ListDataSvc, ViewStateSvc){
		$scope.formSvc = FormSvc;
		$scope.dataSvc = ListDataSvc;
		$scope.viewStateSvc = ViewStateSvc;
		
		/**
		 * Given a header from the uploaded list, find the mapped header or return "SKIP"
		 */
		$scope.getMapHeader = function(listHeader){
			if ($scope.formSvc.doc === '*') return listHeader;
			for (var h in $scope.formSvc.doc.mapping)
				if ($scope.formSvc.doc.mapping[h] == listHeader)
					return h;
			return 'SKIP';
		};
		
		/**
		 * Remove the list value from the doc and select the Upload List tab
		 */
		$scope.clearList = function(){
			$scope.formSvc.doc.list = '';
			$scope.viewStateSvc.state = 'upload';
		};
		
		/**
		 * When the mapping changes, get the data
		 * Not sure if this is a good idea, maybe i should just retrieve the data in the controller constructor
		 */
		$scope.$watch('formSvc.doc.mapping', function(){
			if (!$scope.formSvc.doc.mapping) return;
			
			$scope.dataSvc.getData();
		});
		
		/**
		 * When the offset changes, get new data
		 */
		$scope.$watch('dataSvc.offset', function(){
			$scope.dataSvc.getData();
		});
	})
	
	/**
	 * Controller for the proof approval page
	 */
	.controller('ApproveCtrl', function($scope, FormSvc){
		$scope.formSvc = FormSvc;
		
		/**
		 * Save the doc to the cart
		 */
		$scope.addToCart = function(){
			$scope.showThrobber = true;
			
			$scope.formSvc.saveDoc();
		};
	})
	
	/**
	 * Customize Controller
	 * Responsible for loading the doc and is the parent of the field controllers
	 * Handles communication between field controllers (triggers, etc)
	 */
	.controller('CustomizeCtrl', function($scope, $http, systemId, FormSvc, ViewStateSvc){
		$scope.formSvc = FormSvc;
		$scope.viewStateSvc = ViewStateSvc;
		$scope.systemId = systemId;
		
		/**
		 * Trigger doHideApp on the main application and destroy this scope
		 */
			$scope.closeApp = function(){
				$('#ngMain #Content').show();
				$('#ngMain #appContainer').hide();
				$scope.$destroy();
			};
		
		/**
		 * Load the application on init
		 */
			$scope.formSvc.loadApplication(function(){		
			});
		
		/**
		 * Helper function
		 * Returns the viewfield object with the specified id
		 */
			$scope.findField = function(id) {
				for (var a in $scope.formSvc.doc.dials)
					if ($scope.formSvc.doc.dials[a].id == id)
						return $scope.formSvc.doc.dials[a];
			};
		
		/**
		 * Disable Upload button until the form is valid
		 */
			$scope.isUploadButtonDisabled = function(){
				return $scope.configureForm.$invalid;
			};
			
		/**
		 * Customize Form
		 */	
			$scope.editForm = function(){
				$scope.viewStateSvc.state='configure';
			};
		/**
		 * Process events emitted by view field controllers
		 */
			$scope.$on('fireTriggers', function(event,source){
//				debug('firing triggers');
//				debug(source);
				
				if (!source) {
//					debug('missing trigger source');
					return;
				}
				/**
				 * Process each trigger on the field
				 */
				if (!source.triggers) return;
				
				angular.forEach(source.triggers, function(trigger){
//					debug(trigger);
					
					// Apply the trigger unless something fails later
					var applyTrigger = true;
					/**
					 * Process each trigger condition
					 */
					angular.forEach(trigger.triggerConditions, function(condition){
						// Get the target field
						var target = $scope.findField(condition.target);
						
						if (!target){
//							debug('missing target field: '+condition.target);
							applyTrigger = false;
						}
						
						/**
						 * If the target field is a checkbox group we need to 
						 * parse the value into an array and check each element
						 */
						else if (target.fieldType==='checkboxes') {
							var vals = angular.fromJson(target.value);
							applyTrigger = false;
								
							/**
							 * Compare each checkbox value with the condition value
							 * If a match is found, set apply to true if the comparison 
							 * is EQUALS (1) or false if the comparison is NOT EQUAL
							 */
							for (var val in vals) {
								if (vals[val] == condition.value) {
									applyTrigger=condition.comparison == "equal";
									break;
								}						
							}
						}
										
						/**
						 * Target is something other than a checkbox group
						 */
						else {									
//							debug(target);
							try {
								if (condition.value === '*' && target.value && target.value.length>0)
									applyTrigger=true;
								else if (target.value && condition.value) {
									try {
										if (condition.comparison === 'equal') { // EQUAL
											if (target.value.toLowerCase() != condition.value.toLowerCase()) {
												applyTrigger=false;
											}
										} else if (condition.comparison === 'notequal') { // NOT EQUAL
											if (target.value.toLowerCase() == condition.value.toLowerCase()) {
												applyTrigger=false;
											}
										} else if (condition.comparison === 'greater') { // GREATER
											if (target.value <= condition.value) {
												applyTrigger=false;
											}
										} else if (condition.comparison === 'less') { // LESS
											if (target.value >= condition.value) {
												applyTrigger=false;
											}
										}	
									} catch (x) {
										applyTrigger=false;
									}
								} else {
//									debug('target value: '+target.value+' / condition value: '+condition.value);
									applyTrigger = false;
								}
							} catch (x) {
								debug('Exception: evaluating field triggers');
							}
						}
					});
					
					/**
					 * All the trigger conditions were met, apply the trigger
					 */
					if (applyTrigger) {
	
						/**
						 * Obtain the target field
						 */
						var targetField = $scope.findField(trigger.target);				
						if (targetField) {
							/**
							 * Value Trigger
							 */	
							if (trigger.type === 'value') {
//								debug('trigger type is value');
								/**
								 * If the target is a checkbox group we want to parse the trigger values into a json array string
								 */
								if (targetField.type === 'checkboxes')
									targetField.value = angular.toJson(trigger.triggerValues);
								else {
									if (trigger.triggerValues[0] === "*")
										targetField.value = source.value;
									else
										targetField.value = trigger.triggerValues[0];
								}
							}
							/** 
							 * ValueSet Trigger
							 */
							else if (trigger.type === 'valueset') {		
//								debug('trigger type is valueset');				
								/**
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
							}
							/**
							 * URL ValueSet Trigger 
							 */
							else if (trigger.type === 'urlvalueset') {
//								debug('trigger type is urlvalueset');
								try {
									if (trigger.triggerValues.length>0) {
										(function(trigger){
											/**
											 * Replace {{val}} in the url string with the selected field value
											 */
											var url = trigger.triggerValues[0].value.replace(/\{\{val\}\}/g, source.value);
															
//											debug('url: '+url);
//											debug(source.value);
//											debug(trigger.triggerValues[0].value);
											
											if (url.indexOf('?')>-1)
												url += '&callback=JSON_CALLBACK';
											else
												url += '?callback=JSON_CALLBACK';
											
											$http.jsonp(url).success( function(data){	
												/**
												 * Add an 'Other' option if the field has the custom flag
												 */
												if (targetField.custom)
													data.push({text:'other',value:'Other'});
		
												$scope.$broadcast('values',{target:targetField.id, values:data});
											}).error(function(data){
												debug("error retrieving values");
											});
										})(trigger);
									} else {
										$scope.$broadcast('values',{target:trigger.target});
									}
								} catch (x) {
									debug('Exception: urlvalueset trigger');
								}
							} else {
								debug('unknown trigger type: '+trigger.type);
							}
						}
					} else {
						debug('applyTrigger is false');
					}
						
				});
				
				/**
				 * Emit an event to make the viewfields re-evaluate their visibilityConditions
				 */
				$scope.$broadcast('updateVisibility');	
			});
		/** END Trigger Handler **/
	})
	
	/**
	 * Field Controller
	 * Controller for a single form field
	 */
	.controller('FieldCtrl', function($scope, $http, path, systemId){

		/**
		 * Returns true if the field is both required and visible
		 */
		$scope.isRequired = function(){
			return $scope.field.required && $scope.field.visibility;
		};
		
		/**
		 * Fired when any field's value changes
		 * Reevaluate the visibility conditions of the field
		 */
		$scope.$on('updateVisibility', function(){
//			debug('updating visibility');
			
			var visibility;

			/**
			 * Process each condition
			 */ 
			try {
				if ($scope.field.visibilityConditions){
					for (var a=0; a<$scope.field.visibilityConditions.length; a++) {
						var condition = $scope.field.visibilityConditions[a];
						
						/**
						 * If visibility has already been assigned a value
						 * Evaluate the join type of the condition
						 */
						if (visibility) {
							/**
							 * If the join type is 1 (OR) check the visibility var
							 */
							if (condition.join == 'or') {
								/**
								 * If the visibility var is 'visible' we've met all the conditions
								 * for the previous round of conditions
								 * Break out of the loop
								 */
								if (visibility == 'visible') {
									break;
								}
							} 
		
							/**
							 * If the join type is 0 (AND) and the visibility is 'hidden', skip to the next condition 
							 */
							else if (condition.join == 'and') {
								if (visibility == 'hidden') {
									continue;
								}
							}
						}
		
						/**
						 * Visibility has not been assigned a value yet (i.e. on the first array element)
						 * Or visibility is 'hidden' and the next condition is joined with OR
						 */
		
						var target = $scope.$parent.findField(condition.target);
						
		//				debug('visibility condition target');
		//				debug(target);
		
						/**
						 * If the target field is visible
						 */
						if (target.visibility) {   		 
							/**
							 * If the target field is a checkbox group we need to 
							 * parse the value into an array and check each element
							 */
							if (target.fieldType === 'checkboxes') {
								var vals = angular.fromJson(target.value);
		
								/**
								 * Compare each checkbox value with the condition value
								 * If a match is found, set apply to true if the comparison 
								 * is EQUALS (1) or false if the comparison is NOT EQUAL
								 */
								if (vals)
									for (var v=0; v<vals.length; v++) {
		//								debug('checkbox vals');
		//								debug(vals);
										
										var val = vals[v];
										if (val.toLowerCase() == condition.value.toLowerCase()) {
											visibility = condition.comparison == 'equal' ? 'visible' : 'hidden';
											break;
										}						
									}
							} 
		
							/**
							 * Target is something other than a checkbox group
							 */
							else {			
								if (condition.value === '*' && target.value && target.value.length>0)
									visibility = 'visible';
								else {
									if (condition.value && target.value) {
										try {
											if (condition.comparison == 'equal') { // EQUAL
												visibility = target.value.toLowerCase() == condition.value.toLowerCase() ? 'visible' : 'hidden';    						 
											} else if (condition.comparison == 'notequal') { // NOT EQUAL
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
				}
			} catch (x) {
				debug('Exception: processing visibilityConditions');
			}

			/**
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

		/**
		 * Value Set event listener
		 */
		$scope.$on('values', function(event, args){
//			debug('updating values');
//			debug(args);
			
			/**
			 * If this field is the target of the trigger
			 */
			if ($scope.field.id == args.target) {
				
				/**
				 * Populate with supplied vals
				 */
				if (args.values) {
					$scope.field.options = angular.copy(args.values);
				} 
				
				/**
				 * Populate with "original" vals
				 */
				else {
					$scope.field.options = angular.copy($scope.masterOptions);
				}
			}
		});	
		
		
		/**
		 * Init
		 */

		
		/**
		 * Examine each viewField option for the url pattern
		 * If any options are formatted like {url:xxx} attempt to get an options array from the url
		 */
		if ($scope.field.options)
			for (var a=0; a<$scope.field.options.length; a++) {
//					debug($scope.field.options[a]);
	//			alert(a+'/'+$scope.field.options[a].value);
				if (!$scope.field.options[a].value) continue;
				
				/**
				 * URL
				 */
				try {
					debug($scope.field.options[a]);
					var urlMatch = $scope.field.options[a].text == '{{url}}';
					var resMatch = $scope.field.options[a].text == '{{resource}}';
					if (urlMatch) {
						
						var url = $scope.field.options[a].value;
						
						if (url.indexOf('?')>-1)
							url += "&callback=JSON_CALLBACK";
						else
							url += "?callback=JSON_CALLBACK";
						
						// Remove the url value
						$scope.field.options.splice(a,1);
						
						/**
						 * Try getting options from the url
						 */
						try {
							$http.jsonp(url).success(function(data){
															
								// Add the new options
								for (var b in data) {
									debug(data[b]);
									// Verify the returned object structure is KEY/VALUE pairs
									// If it's an array of strings, make it into KEY/VALUE pairs
									if (angular.isObject(data[b]))
										$scope.field.options.push(data[b]);
									else if (angular.isArray(data[b]))
										$scope.field.options.push({'text':data[b][0],'value':data[b][1]});
									else if (angular.isString(data[b]))
										$scope.field.options.push({'text':data[b],'value':data[b]});
									else
										$scope.field.options.push({'text':'test','value':'test'});
								}
							});
						} catch (x) {
							debug.log(x);
						}
					}
					
					else if (resMatch){
						var resourcePath = $scope.field.options[a].value;
						
						// Remove the url value
						$scope.field.options.splice(a,1);
						
						try {
							$http.jsonp(path+'/resources/keyval/youbiquity?query='+resourcePath+'&callback=JSON_CALLBACK').success(function(data){
															
								// Add the new options
								for (var b in data) {
									debug(data[b]);
									// Verify the returned object structure is KEY/VALUE pairs
									// If it's an array of strings, make it into KEY/VALUE pairs
									if (angular.isObject(data[b]))
										$scope.field.options.push(data[b]);
									else if (angular.isArray(data[b]))
										$scope.field.options.push({'text':data[b][0],'value':data[b][1]});
									else if (angular.isString(data[b]))
										$scope.field.options.push({'text':data[b],'value':data[b]});
									else
										$scope.field.options.push({'text':'test','value':'test'});
								}
							});
						} catch (x) {
							debug.log(x);
						}
						
					}
				} catch (x) {
					debug('Exception: checking for url options');
					debug(x.message);
				}	
			}

	})
	
	/**
	 * Controller for the app configuration tab
	 */
	.controller('ConfigureCtrl', function($scope, FormSvc){
		$scope.formSvc = FormSvc;
		
		/**
		 * Add a new viewfield
		 */
		$scope.addField = function() {
			if (!$scope.formSvc.appConfig.dials) $scope.formSvc.appConfig.dials = [];		
			$scope.formSvc.appConfig.dials.push({sequence:$scope.formSvc.appConfig.dials.length+1});
		};
		
		/**
		 * Save the app
		 */
		$scope.saveForm = function(){
			$scope.formSvc.saveForm();
		};
	})
	
	/**
	 * Controller for individual fields in the configuration tab
	 */
	.controller('ViewFieldEditorCtrl', function($scope, $filter, FormSvc){
		
		$scope.formSvc = FormSvc;
		$scope.newTriggerValue = {};
		
		$scope.isActive = function(b) {
			return b ? "active" : '';
		};

		$scope.fieldTypes = ['text','textarea','select', 'checkboxes', 'radios', 'upload', 'hidden', 'custom', 'imagePicker', 'date'];
		

		$scope.moveDown = function(i) {
			var sortedViewFilters = $filter('orderBy')($scope.formSvc.appConfig.dials, 'sequence');
			sortedViewFilters[i].sequence = sortedViewFilters[i].sequence + 1;

			if (sortedViewFilters[i+1])
				sortedViewFilters[i+1].sequence = sortedViewFilters[i+1].sequence - 1;  
		};
		
		$scope.moveUp = function(i) {
			var sortedViewFilters = $filter('orderBy')($scope.formSvc.appConfig.dials, 'sequence');
			sortedViewFilters[i].sequence = sortedViewFilters[i].sequence - 1;

			if (sortedViewFilters[i-1])
				sortedViewFilters[i-1].sequence = sortedViewFilters[i-1].sequence + 1;		
		};
		
		/**
		 * Add an option
		 */
		$scope.addOption = function() {	
			if (!angular.isDefined($scope.field.options))
				$scope.field.options = [];
			
			$scope.field.options.push(angular.copy($scope.newOption));
			$scope.newOption = {};
		};
		
		/**
		 * Set the "default" property of all other options to false when an option is spec'd as default 
		 */
		$scope.setDefault = function(option) {
			angular.forEach($scope.field.options, function(v,i){
				if (!angular.equals(v, option))
					v.defaultValue = false;
			});
		};
			
		/**
		 * Add a trigger
		 */
		$scope.addTrigger = function() {
			if (!$scope.field.triggers)
				$scope.field.triggers = [];
				
			$scope.field.triggers.push({triggerConditions:[{
				target: $scope.field.id,
			}], triggerValues:[]});
		};
		
		/**
		 * Add a trigger value
		 */
		$scope.addTriggerValue = function(trigger) {
			if (!trigger.triggerValues)
				trigger.triggerValues = [];
			
			trigger.triggerValues.push(angular.copy($scope.newTriggerValue));
			$scope.newTriggerValue = {};
		};

		/**
		 * Add a trigger condition
		 */
		$scope.addCondition = function(trigger) {
			if (!trigger.triggerConditions)
				trigger.triggerConditions = [];
			
			trigger.triggerConditions.push({});
		};
		
		/**
		 * Add visibility condition
		 */
		$scope.addVisCondition = function() {
			if (!$scope.field.visibilityConditions)
				$scope.field.visibilityConditions = [];
			$scope.field.visibilityConditions.push({target:{}});
		};
	});
})(jQuery);