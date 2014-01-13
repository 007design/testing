/** Set document domain **/
//document.domain = "lakecountypress.com";

function debug(input){ try { console.log(input); } catch (x){ } }

function isOfferListPage(){
	var location = window.location.search.substring(1);
	var attPairs = location.split("&");
	for (i=0;i<attPairs.length;i++) {
		var pair = attPairs[i].split("=");
		if (pair[0].toLowerCase() == 'action') return false;
	}
	return true;
}

function isLoc(x, y) {
	var location = window.location.search.substring(1);
	var attPairs = location.split("&");
	for (i=0;i<attPairs.length;i++) {
		var pair = attPairs[i].split("=");
		if (pair[0].toLowerCase() == x.toLowerCase()) {
			return pair[1].toLowerCase().search(y)!=-1;
		}
	}
	return false;
}

function getPmSess() {
	var location = window.location.search.substring(1);
	var attPairs = location.split("&");
	for (i=0;i<attPairs.length;i++) {
		var pair = attPairs[i].split("=");
		if (pair[0].toLowerCase() == "pmsess1") {
			return pair[1].toLowerCase();
		}
	}
}

function getUserId(){
	return (function($){
		return $.trim($('#divPreRegIdDisp').text().replace(/<.+>/g,''));
	})(jQuery);
}

function goCart() {
	var queryString = window.location.search.substring(1);
	var params = queryString.split("&");
	for (var i=0;i<params.length;i++) {
		var vals = params[i].split("=");
		if (vals[0].toLowerCase() == "pmsess1") {
			window.location.href="http://lcpcomplete.lakecountypress.com/v5fmsnet/OeCart/OeFrame.asp?ACTION=CART&PmSess1="+vals[1];
		}
	}
}