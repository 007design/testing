/*
 * Debug function. Takes care of browsers that don't understand console.log
 */
function debug(x){try{console.log(x);}catch(e){}}

/*
 * Create a module
 */
var app = angular.module('app', []);
