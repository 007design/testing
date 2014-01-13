jQuery.noConflict();
(function($) {
	
	$(document).ready(function() {
		
		if (!isOfferListPage()) return;
		
		/** 
		 * Add the controller to the #Content div.
		 * Put the regular page content into a div and add another div for the apps
		 */
		$('#Content').wrap('<div id="ngMain"/>');
		$('#ngMain').append(
			'<div id="appContainer"></div>'
		);
		
		/**
		 * Hijack the Customize buttons, add the directive class and remove the onclick attribute
		 */
		$('input[value="Customize"]').each(function(){ 
			$(this).addClass('customize-button').removeAttr('onclick').click(function(){
				/** Grab the offerId */
				var offerId = $.trim( $(this).closest('.clsOneOffer').find('.clsIDData').html() );
				/** 
				 * Load the app html template
				 * This should include any script or style tags 
				 */						
				$.get('/sqlimages/youbiquity/theme/templates/main.html')
					.success(function(data){
						/** Append to the DOM */
						$('#appContainer').html(data);
						
						/**
						 * Inject the app config into the app module
						 */
						angular.module('app')
							.value('appId', offerId)
							.value('path', 'http://webapps.lakecountypress.com')
							.value('proxy', '/pmtheme/webappsProxy.asp?loc=')
							.value('systemId', 'youbiquity');
													
						/**
						 * Bootstrap the app
						 */
						angular.bootstrap($('#appRoot'), ['app']);

						/** Hide the main content and show the app **/
						$('#ngMain #Content').hide();
						$('#ngMain #appContainer').show();
	 			});
			}); 			
		});
		
	});
})(jQuery);

function showApp(){
	(function($) {
		/** Hide the app and show the main content **/
		$('#ngMain #Content').show();
		$('#ngMain #appContainer').hide();
	})(jQuery);
}