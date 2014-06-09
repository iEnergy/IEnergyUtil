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
var baseUrl = '';

var format = "YYYY-MM-DDTHH:mm:ssZZ";

function log10(val) {
	return Math.log(val) / Math.LN10;
}

/**
 * Main page controller
 */
function MainCtrl() {

}

/**
 * Controller of drain registry
 * 
 * @param $http
 * @param $log
 * @param $scope
 * @param $timeout
 */
function DrainMeasureCtrl($http, $log, $scope, $timeout) {
	$http.get(baseUrl + '/JeerpDa/registry/drains').success(function(data) {
		$log.info('load drains');
		$scope.drains = data;
	});

	var stop;

	// on drain selection
	$scope.newDrain = function() {
		$log.info("Drain changed", $scope.drain);
		// reset gauge
		g = undefined;
		$('#gauge').empty();

		// start polling of measure
		$timeout.cancel(stop);
		stop = $timeout($scope.loadRtMeasure, 1000);
	};

	$scope.loadRtMeasure = function loadRtMeasure() {
		// load measure
		$http.get(baseUrl + '/JeerpDa/measure/instants/' + $scope.drain.drain).success(function(data) {
			$log.info('recv measure for ->' + data.drain + " value -> " + data.value);
			$scope.measure = data;

			// update the gauge value
			$scope.updateGauge();
		});

		// restart polling of measure
		stop = $timeout($scope.loadRtMeasure, 1000);
	};

	var g;
	$scope.updateGauge = function() {
		var max = 1000;
		if ($scope.measure.unit == "T") {
			max = 30;
		} else {
			var newvalue = parseFloat($scope.measure.value) + (parseFloat($scope.measure.value)) / 3;
			max = Math.pow(10, (Math.ceil(log10(newvalue))));
		}

		if (typeof g == 'undefined') {
			g = new JustGage({
				id : "gauge",
				value : 67,
				min : 0,
				max : max,
				title : $scope.measure.drain + " " + $scope.measure.unit,
			});
		}
		g.refresh($scope.measure.value);
	};

	$scope.$on('$routeChangeStart', function(next, current) {
		// stop polling of measure
		$timeout.cancel(stop);
	});
}

/**
 * Drain detail handler
 * 
 * @param $http
 * @param $log
 * @param $scope
 * @param $routeParams
 */
function DrainMeasureDetailCtrl($http, $log, $scope, $routeParams) {
	$scope.params = $routeParams;
	$scope.historyFunction = [ 'AVG', 'SUM', 'FIRST', 'LAST' ];
	$scope.aggregationFunction = [ 'AVG', 'SUM', 'MAX', 'MIN' ];

	if ($scope.params.drainName != 'new') {
		$scope.newDrain = false;
		$http.get(baseUrl + '/JeerpDa/registry/drains/' + $scope.params.drainName).success(function(data) {
			$log.info('load drains details ' + $scope.params.drainName);
			$scope.drain = data;
		});
	} else {
		$scope.newDrain = true;
		$scope.drain = {};
		$scope.drain.real = false;
		$scope.drain.formula = [];
	}

	$scope.submit = function() {
		$log.info("post data to server " + $scope.drain);
		$log.info($scope.drain);

		// post data to the server
		$http.post(baseUrl + '/JeerpDa/registry/drains/', $scope.drain).success(function() {
			alert("Save success");
		});
	};

	/**
	 * Add a new element
	 */
	$scope.add = function() {
		$log.info("add a new formula elements");

		if (typeof $scope.drain.formula == 'undefined') {
			$scope.drain.formula = [];

		}

		var formula = {};
		formula.drain = "";
		formula.sign = 1;
		$scope.drain.formula.push(formula);
	};

	/**
	 * Add a new element
	 */
	$scope.remove = function(index) {
		$log.info("remove a fomula elemnts " + index);
		if (index > 0) {
			$scope.drain.formula.splice(index, 1);
		}
	};
}

/**
 * Confort controller
 * 
 * @param $http
 * @param $log
 * @param $scope
 * @param $routeParams
 */
function ConfortCtrl($http, $log, $scope, $routeParams) {
	$http.get(baseUrl + '/JeerpDa/confort/indicators/').success(function(data) {
		$log.info('recv indicators list');
		$scope.indicators = data;
	});
}

/**
 * Confort detail
 * 
 * @param $http
 * @param $log
 * @param $scope
 * @param $routeParams
 */
function ConfortDetailCtrl($http, $log, $scope, $routeParams, $modal) {
	$scope.params = $routeParams;

	$http.get(baseUrl + '/JeerpDa/confort/indicators/' + $scope.params.indicatorName).success(function(data) {
		$log.info('recv indicator detail --> ' + $scope.params.indicatorName);
		$scope.indicator = data;
	});

	$http.get(baseUrl + '/JeerpDa/confort/indicators/' + $scope.params.indicatorName + '/options').success(function(data) {
		$log.info('recv indicator options --> ' + $scope.params.indicatorName);
		$scope.options = data;
	});

	// load votes
	loadVotes();

	$scope.open = function() {

		var modalInstance = $modal.open({
			templateUrl : 'ModalAddVote.html',
			controller : ModalAddVoteCrtl,
			resolve : {
				options : function() {
					return $scope.options;
				}
			}
		});

		modalInstance.result.then(function(selectedItem) {
			// send vote to the gui
			$http.post(baseUrl + '/JeerpDa/confort/indicators/' + $scope.params.indicatorName + '/votes', {
				'value' : selectedItem.value
			}).success(function(data) {
				$log.info('vote send success--> ' + $scope.params.indicatorName);
				loadVotes();
			});
		}, function() {
			$log.info('Modal dismissed at: ' + new Date());
		});
	};

	function loadVotes() {
		$http.get(baseUrl + '/JeerpDa/confort/indicators/' + $scope.params.indicatorName + '/votes').success(function(data) {
			$log.info('recv indicator votes --> ' + $scope.params.indicatorName);
			$scope.votes = data;
		});
	}
	;
}

/**
 * Add a new vote model controller
 * 
 * @param $scope
 * @param $log
 * @param $modalInstance
 * @param options
 */
function ModalAddVoteCrtl($scope, $log, $modalInstance, options) {

	$scope.options = options;

	$scope.selected = {
		item : $scope.options[0]
	};

	$scope.ok = function() {
		$log.info('vote selected ' + $scope.selected.item.name);
		$modalInstance.close($scope.selected.item);
	};

	$scope.cancel = function() {
		$modalInstance.dismiss('cancel');
	};
};
/**
 * Controller for a new confort form
 * 
 * @param $http
 * @param $log
 * @param $scope
 * @param $routeParams
 */
function ConfortFormCtrl($http, $log, $scope, $routeParams) {
	$scope.params = $routeParams;
	$scope.functionType = [ 'SUM', 'AVG', 'LOGSUM', 'LOGABSSUM' ];
	$scope.types = [ 'Rate', 'Temperature', 'Humidity', 'AirQuality' ];

	if ($scope.params.indicatorName != 'new') {
		$scope.newIndicator = false;
		// load indicator details
		$http.get(baseUrl + '/JeerpDa/confort/indicators/' + $scope.params.indicatorName).success(function(data) {
			$log.info('recv indicator detail --> ' + $scope.params.indicatorName);
			$scope.indicator = data;
		});
	} else {
		$scope.newIndicator = true;
	}

	$scope.submit = function() {
		$log.info("post data to server " + $scope.indicator);
		$log.info($scope.indicator);

		// post data to the server
		$http.post(baseUrl + '/JeerpDa/confort/indicators/', $scope.indicator).success(function() {
			alert("Save success");
		});
	};

}

/**
 * Measure controller
 * 
 * @param $http
 * @param $log
 * @param $scope
 */
function MeasureCtrl($http, $log, $scope, $timeout) {
	$('#endMeasure').datetimepicker({
		pickDate : true,
		pickTime : true
	});

	$('#startMeasure').datetimepicker({
		pickDate : true,
		pickTime : true
	});

	// init time

	$http.get(baseUrl + '/JeerpDa/registry/drains').success(function(data) {
		$log.info('load drains');
		$scope.drains = data;
		$("#startTimeMeasure").val(moment().add('hour', -5).format('DD/MM/YYYY HH'));
		$("#endTimeMeasure").val(moment().add('hour', 1).format('DD/MM/YYYY HH'));
	});

	$scope.buildParam = function() {
		// display info
		$log.info("load data for drain " + $scope.drain.drain + " details " + $scope.details + " and time aggregation " + $scope.timeAggregation);

		// create start/end time
		var start = $("#startTimeMeasure").val();
		var startTime = moment(start, "DD/MM/YYYY HH");

		var param = '?start=' + encodeURIComponent(startTime.format(format));

		var end = $("#endTimeMeasure").val();
		var endTime = moment(end, "DD/MM/YYYY HH");

		param = param + '&end=' + encodeURIComponent(endTime.format(format));

		// handle time aggregation
		if ($scope.timeAggregation != undefined) {
			param = param + '&timeAggregation=' + $scope.timeAggregation;
		}
		return param;
	}

	// the load function
	$scope.load = function() {

		if ($scope.drain == undefined) {
			alert("No drain selected");
			return;
		}

		param = $scope.buildParam();

		// real time measure
		// start polling of measure
		$timeout.cancel(stop);
		$scope.loadRtMeasure();

		// get data via rest
		$http.get(baseUrl + '/JeerpDa/measure/history/' + $scope.drain.drain + param).success(function(data) {
			$log.info('rec measures history');
			$scope.measureHistory = data;

			// get data via rest
			if ($scope.details) {
				$http.get(baseUrl + '/JeerpDa/measure/details/' + $scope.drain.drain + param).success(function(data) {
					$log.info('rec measures details');
					$scope.measureDetails = data;
					$scope.drawGraph();
				});
			} else {
				$scope.drawGraph();
			}
		});
	};

	// the load function
	$scope.exportCSV = function() {

		if ($scope.drain == undefined) {
			alert("No drain selected");
			return;
		}

		param = $scope.buildParam();

		// start file download
		window.location = baseUrl + '/JeerpDa/measure/history/report/' + $scope.drain.drain + param;

	};

	$scope.drawGraph = function() {
		$log.info("Start graph draw");

		// create array of series
		series_array = [];
		data_array = [];

		// create history series
		for (i in $scope.measureHistory.measures) {
			value = $scope.measureHistory.measures[i];
			time = moment(value.time);
			date = Date.UTC(time.year(), time.month(), time.date(), time.hour(), time.minute(), 0);
			value_chart = [ date, value.value ];
			data_array.push(value_chart);
		}

		// append series
		serie = {
			data : data_array,
			name : "History"
		};

		series_array.push(serie);

		if ($scope.details) {
			data_array = [];
			for (i in $scope.measureDetails.measures) {
				value = $scope.measureDetails.measures[i];
				time = moment(value.time);
				date = Date.UTC(time.year(), time.month(), time.date(), time.hour(), time.minute(), time.second());
				value_chart = [ date, value.value ];
				data_array.push(value_chart);
			}

			// append series
			serie = {
				data : data_array,
				name : "Detail",
				color : 'red'
			};

			series_array.push(serie);

		}

		$("#graph").empty();
		new Highcharts.StockChart({
			chart : {
				renderTo : 'graph',
				type : 'spline',
			},
			legend : {
				enabled : true,
				align : "right",
				verticalAlign : "middle",
				layout : "vertical"
			},
			title : {
				text : 'Grafico Drain ' + $scope.measureHistory.drain + ' (' + $scope.measureHistory.unit + ') '
			},
			xAxis : {
				type : 'datetime',

			},
			yAxis : {
				min : 0
			},

			series : series_array
		});
	};

	$scope.loadRtMeasure = function loadRtMeasure() {
		// load measure
		$http.get(baseUrl + '/JeerpDa/measure/instants/' + $scope.drain.drain).success(function(data) {
			// $log.info('recv measure for ->' + data.drain + " value -> " +
			// data.value);
			$scope.measure = data;
		});

		// restart polling of measure
		stop = $timeout($scope.loadRtMeasure, 1000);
	};
}
