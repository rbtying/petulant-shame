'use strict';

facu.run(function($http) {
    function getCookie(name) {
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }


    $http.defaults.headers.common['X-CSRFToken'] = getCookie('csrftoken');

});
facu.factory('API',
    function ($q, $log, $http) {
        var baseurl = '/api/';
        var alloc = 'allocations/';
        var cif_app = 'cif_applications/';
        var esc_proj = 'esc_project_grants/';
        var groups = 'groups/';
        var jccc_app = 'jccc_applications/';
        var student_groups = 'student_groups/';
        var users = 'users/';
        var attachments = 'attached_files/';

        function create_api_call(endpoint) {
            var listFn = function (params) {
                $log.debug('listing ' + endpoint);
                params = params || {};

                var def = $q.defer();
                $http({
                    url: baseurl + endpoint,
                    method: 'GET',
                    params: params
                }).then(function (result) {
                    $log.debug('list ' + endpoint + ' success', result);
                    def.resolve(result.data);
                }, function(error) {
                    $log.error('list ' + endpoint + ' failure', error);
                    def.reject(error);
                });

                return def.promise;
            };

            var createFn = function (data) {
                $log.debug('creating ' + endpoint, data);
                data = data || {};

                var def = $q.defer();
                $http({
                    url: baseurl + endpoint,
                    method: 'POST',
                    data: data
                }).then(function(result) {
                    $log.debug('create ' + endpoint + ' success', result);
                    def.resolve(result.data);
                }, function(error) {
                    $log.error('create ' + endpoint + ' failure', error);
                    def.reject(error);
                });

                return def.promise;
            };

            var setFn = function (id, data) {
                $log.debug('setting ' + endpoint + ' id: ' + id + ' to ', data);
                data = data || {};

                var def = $q.defer();
                $http({
                    url: baseurl + endpoint + id + '/',
                    method: 'PUT',
                    data: data
                }).then(function(result) {
                    $log.debug('set ' + endpoint + ' id: ' + id + ' success', result);
                    def.resolve(result.data);
                }, function(error) {
                    $log.error('set ' + endpoint + ' id: ' + id + ' failure', error);
                    def.reject(error);
                });

                return def.promise;
            };
            var getFn = function (id) {
                $log.debug('getting ' + endpoint + ' id: ' + id);
                var def = $q.defer();
                $http( {
                    url: baseurl + endpoint + id + '/',
                    method: 'GET'
                }).then(function(result) {
                    $log.debug('get ' + endpoint + ' id: ' + id + ' success', result);
                    def.resolve(result.data);
                }, function(error) {
                    $log.error('get ' + endpoint + ' id: ' + id + ' failure', error);
                    def.reject(error);
                });

                return def.promise;
            };
            return {
                get: getFn,
                set: setFn,
                list: listFn,
                create: createFn
            };
        }


        var api_calls = {
            alloc: create_api_call(alloc),
            cif_app: create_api_call(cif_app),
            esc_proj: create_api_call(esc_proj),
            groups: create_api_call(groups),
            jccc_app: create_api_call(jccc_app),
            student_groups: create_api_call(student_groups),
            users: create_api_call(users),
            attachments: create_api_call(attachments)
        };

        api_calls.groups.set_editors = function (id, editors) {
            $log.debug('setting editors for group ' + id);
            return $http({
                url: baseurl + groups + id + '/set_editors/',
                method: 'POST',
                data: editors
            });
        };
        api_calls.student_groups.set_editors = function (id, editors) {
            $log.debug('setting editors for group ' + id);
            return $http({
                url: baseurl + student_groups + id + '/set_editors/',
                method: 'POST',
                data: editors
            });
        };

        return api_calls;
    }
);
