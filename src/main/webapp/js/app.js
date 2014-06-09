/*
 *  Copyright (c) 2014 Proxima Centauri SRL <info@proxima-centauri.it>.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the GNU Public License v3.0
 * which accompanies this distribution, and is available at
 * http://www.gnu.org/licenses/gpl.html
 * 
 * Contributors:
 *     Proxima Centauri SRL <info@proxima-centauri.it> - initial API and implementation
 */
angular.module('ienergyutil', [ 'ngRoute', 'ui.bootstrap' ], function($routeProvider) {
	$routeProvider.when('/', {
		templateUrl : 'partials/main.html',
		controller : MainCtrl
	}).when('/drainmeasure', {
		templateUrl : 'partials/drainmeasure.html',
		controller : DrainMeasureCtrl,
		controllerAs : 'drainmeasure'
	}).when('/drainmeasure/:drainName', {
		templateUrl : 'partials/drainmeasure-detail.html',
		controller : DrainMeasureDetailCtrl,
		controllerAs : 'drainmeasure'
	}).when('/confort', {
		templateUrl : 'partials/confort.html',
		controller : ConfortCtrl,
		controllerAs : 'confort'
	}).when('/confort/:indicatorName', {
		templateUrl : 'partials/confort-detail.html',
		controller : ConfortDetailCtrl,
		controllerAs : 'confortdetail'
	}).when('/confort/form/:indicatorName', {
		templateUrl : 'partials/confort-form.html',
		controller : ConfortFormCtrl,
		controllerAs : 'confortform'
	}).when('/measures', {
		templateUrl : 'partials/measures.html',
		controller : MeasureCtrl,
		controllerAs : 'measurecrtl'
	}).otherwise({
		redirectTo : '/'
	});

});
