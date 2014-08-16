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
    function ($q, $log, $http, $upload) {
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

        var whttp = function (options) {
            var def = $q.defer();
            $http(options)
                .then(function (success) {
                    def.resolve(success);
                }, function (error) {
                    def.reject(error);
                });
            return def.promise;
        };



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

        api_calls.alloc.bulk_upload = function (entries) {
            $log.debug('sending bulk upload...');
            return whttp({
                url: baseurl + alloc + '0/bulk_upload/',
                method: 'POST',
                data: {
                    entries: entries
                }
            });
        };

        api_calls.groups.set_editors = function (id, editors) {
            $log.debug('setting editors for group ' + id);
            return whttp({
                url: baseurl + groups + id + '/set_editors/',
                method: 'POST',
                data: editors
            });
        };

        api_calls.student_groups.set_editors = function (id, editors) {
            $log.debug('setting editors for student_group ' + id);
            return whttp({
                url: baseurl + student_groups + id + '/set_editors/',
                method: 'POST',
                data: editors
            });
        };

        api_calls.users.me = function () {
            $log.debug('getting current user');
            return whttp({
                url: baseurl + users + '0/me/',
                method: 'GET'
            });
        };

        api_calls.jccc_app.submit = function(id) {
            $log.debug('submitting jccc app ', id);
            return whttp({
                url: baseurl + jccc_app + id + '/submit/',
                method: 'POST'
            });
        };

        api_calls.jccc_app.schedule = function(id, schedule_date) {
            $log.debug('scheduling jccc app ', id);
            return whttp({
                url: baseurl + jccc_app + id + '/schedule/',
                method: 'POST',
                data: {
                    'date': schedule_date
                }
            });
        };

        api_calls.jccc_app.approve = function(id, approval_amt, notes) {
            $log.debug('approving jccc app ', id);
            return whttp({
                url: baseurl + jccc_app + id + '/approve/',
                method: 'POST',
                data: {
                    'amt': approval_amt,
                    'notes': notes
                }
            });
        };

        api_calls.jccc_app.reject = function(id, notes) {
            $log.debug('rejecting jccc app ', id);
            return whttp({
                url: baseurl + jccc_app + id + '/reject/',
                method: 'POST',
                data: {
                    'notes': notes
                }
            });
        };

        api_calls.jccc_app.endorse = function(id, endorsement) {
            $log.debug('endorsing jccc app ', id);
            return whttp({
                url: baseurl + jccc_app + id + '/endorse/',
                method: 'POST',
                data: {
                    endorsement: endorsement
                }
            });
        };

        api_calls.jccc_app.file = function(id, revenue, expenditures) {
            return whttp({
                url: baseurl + jccc_app + id + '/file/',
                method: 'POST',
                data: {
                    revenue: revenue,
                    expenditures: expenditures
                }
            });
        };

        api_calls.jccc_app.complete = function(id, transferred_amt) {
            return whttp({
                url: baseurl + jccc_app + id + '/complete/',
                method: 'POST',
                data: {
                    amt: transferred_amt
                }
            });
        };

        api_calls.jccc_app.upload_file = function(id, files) {
            $log.debug('uploading file to jccc app', id, files);

            return $upload.upload({
                url: baseurl + jccc_app + id + '/upload_file/',
                file: files
            });
        };

        api_calls.jccc_app.delete_file = function(id, fileid) {
            return whttp({
                url: baseurl + jccc_app + id + '/delete_file/',
                method: 'POST',
                data: {
                    file: fileid
                }
            });
        };

        api_calls.cif_app.submit = function(id) {
            $log.debug('submitting cif app ', id);
            return whttp({
                url: baseurl + cif_app + id + '/submit/',
                method: 'POST'
            });
        };

        api_calls.cif_app.schedule = function(id, schedule_date) {
            $log.debug('scheduling cif app ', id);
            return whttp({
                url: baseurl + cif_app + id + '/schedule/',
                method: 'POST',
                data: {
                    'date': schedule_date
                }
            });
        };

        api_calls.cif_app.approve = function(id, approval_amt, notes) {
            $log.debug('approving cif app ', id);
            return whttp({
                url: baseurl + cif_app + id + '/approve/',
                method: 'POST',
                data: {
                    'amt': approval_amt,
                    'notes': notes
                }
            });
        };

        api_calls.cif_app.reject = function(id, notes) {
            $log.debug('rejecting cif app ', id);
            return whttp({
                url: baseurl + cif_app + id + '/reject/',
                method: 'POST',
                data: {
                    'notes': notes
                }
            });
        };

        api_calls.cif_app.endorse = function(id, endorsement) {
            $log.debug('endorsing cif app ', id);
            return whttp({
                url: baseurl + cif_app + id + '/endorse/',
                method: 'POST',
                data: {
                    endorsement: endorsement
                }
            });
        };

        api_calls.cif_app.file = function(id, revenue, expenditures) {
            return whttp({
                url: baseurl + cif_app + id + '/file/',
                method: 'POST',
                data: {
                    revenue: revenue,
                    expenditures: expenditures
                }
            });
        };

        api_calls.cif_app.complete = function(id, transferred_amt) {
            return whttp({
                url: baseurl + cif_app + id + '/complete/',
                method: 'POST',
                data: {
                    amt: transferred_amt
                }
            });
        };

        api_calls.cif_app.upload_file = function(id, files) {
            $log.debug('uploading file to cif app', id, files);

            return $upload.upload({
                url: baseurl + cif_app + id + '/upload_file/',
                file: files
            });
        };

        api_calls.cif_app.delete_file = function(id, fileid) {
            return whttp({
                url: baseurl + cif_app + id + '/delete_file/',
                method: 'POST',
                data: {
                    file: fileid
                }
            });
        };

        api_calls.esc_proj.submit = function(id) {
            $log.debug('submitting cif app ', id);
            return whttp({
                url: baseurl + esc_proj + id + '/submit/',
                method: 'POST'
            });
        };

        api_calls.esc_proj.schedule = function(id, schedule_date) {
            $log.debug('scheduling cif app ', id);
            return whttp({
                url: baseurl + esc_proj + id + '/schedule/',
                method: 'POST',
                data: {
                    'date': schedule_date
                }
            });
        };

        api_calls.esc_proj.approve = function(id, approval_amt, notes) {
            $log.debug('approving cif app ', id);
            return whttp({
                url: baseurl + esc_proj + id + '/approve/',
                method: 'POST',
                data: {
                    'amt': approval_amt,
                    'notes': notes
                }
            });
        };

        api_calls.esc_proj.reject = function(id, notes) {
            $log.debug('rejecting cif app ', id);
            return whttp({
                url: baseurl + esc_proj + id + '/reject/',
                method: 'POST',
                data: {
                    'notes': notes
                }
            });
        };

        api_calls.esc_proj.file = function(id, revenue, expenditures) {
            return whttp({
                url: baseurl + esc_proj + id + '/file/',
                method: 'POST',
                data: {
                    revenue: revenue,
                    expenditures: expenditures
                }
            });
        };

        api_calls.esc_proj.complete = function(id, transferred_amt) {
            return whttp({
                url: baseurl + esc_proj + id + '/complete/',
                method: 'POST',
                data: {
                    amt: transferred_amt
                }
            });
        };

        api_calls.esc_proj.upload_file = function(id, files) {
            $log.debug('uploading file to cif app', id, files);

            return $upload.upload({
                url: baseurl + esc_proj + id + '/upload_file/',
                file: files
            });
        };

        api_calls.esc_proj.delete_file = function(id, fileid) {
            return whttp({
                url: baseurl + esc_proj + id + '/delete_file/',
                method: 'POST',
                data: {
                    file: fileid
                }
            });
        };
        return api_calls;
    }
);
