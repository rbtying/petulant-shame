'use strict';

facu.factory('API',
	function ($q, $log, $http) {
		var baseurl = 'http://funding.columbiaesc.com:8000/api/';
		var alloc = 'allocations/';
		var cif_app = 'cif_applications/';
		var esc_proj = 'esc_project_grants/';
		var groups = 'groups/';
		var jccc_app = 'jccc_applications/';
		var student_groups = 'student_groups/';
		var users = 'users/';

		function create_api_call(endpoint) {
			var getFn = function() {
				var def = $q.defer();
			};
			var setFn = function() {
				var def = $q.defer();
			};
			return {
				get: getFn,
				set: setFn
			};
		}

		var cache = {};
		cache.allocations = {};
		cache.groups = {};

		function fetch_all(url, call_fn) {
			var defer = $q.defer();

			if (!url) {
				defer.resolve();
			} else {
				$http.get(url).success(function(data) {
					call_fn(data);
					fetch_all(data.next, call_fn).then(defer.resolve, defer.reject);
				}).error(function(data) {
					$log.warn('fetch_all failed', data);
					defer.reject();
				});
			}
			return defer.promise;
		}
		
		return {
			cache: cache,
			api: function() {
				var promise = $q.defer();
				$http.get(baseurl).success(function(data) {
					promise.resolve(data);
					$log.log('received', data);
				}).error(function(data) {
					promise.reject(data);
					$log.warn('received', data);
				});
				return promise;
			},
			allocations: function(params) {
				var promise = $q.defer();
				if (!params) { params = {}; }
				$http.get(baseurl + alloc, {params: params}).success(function(data) {
					for (var idx in data.results) {
						cache.allocations[data.results[idx].id] = data.results[idx];
					}
					promise.resolve(data);
					$log.log('received', data);
				}).error(function(data) {
					promise.reject(data);
					$log.warn('received', data);
				});
				return promise;
			},
			groups: function(params) {
				var promise = $q.defer();
				if (!params) { params = {}; }
				function process_groups(data) {
					for (var idx in data.results) {
						cache.groups[data.results[idx].id] = data.results[idx];
					}
				}
				$http.get(baseurl + groups, {params: params}).success(function(data) {
					process_groups(data);
					fetch_all(data.next, process_groups).then(promise.resolve, promise.reject);
				}).error(function(data) {
					promise.reject();
					$log.warn('received', data);
				});
				return promise;
			}
		}
	}
);
