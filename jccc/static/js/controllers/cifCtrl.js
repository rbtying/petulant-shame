'use strict';

controllers
    .controller('cifCtrl', function ($scope, $routeParams, $location, $q, $log, $timeout, API, controller_action, current_user) {
        $log.log('init cifCtrl');

        $scope.current_user = current_user;

        var get_list = function () {
            var params = $location.search();
            API.cif_app.list(params)
                .then(function (result) {
                    $scope.applications = result;
                });
        };

        var EMPTY_BUDGET = {
            expenses: [],
            total_expenses: 0,
            revenues: [],
            total_revenues: 0
        };

        var get_specific = function() {
            var id = $routeParams.id;
            API.cif_app.get(id)
                .then(function (result) {
                    $scope.db.current_application = result;
                    if (!$scope.db.current_application.best_case_budget) {
                        $scope.db.current_application.best_case_budget = $.extend({}, EMPTY_BUDGET);
                    }
                    if (!$scope.db.current_application.moderate_case_budget) {
                        $scope.db.current_application.moderate_case_budget = $.extend({}, EMPTY_BUDGET);
                    }
                    if (!$scope.db.current_application.worst_case_budget) {
                        $scope.db.current_application.worst_case_budget = $.extend({}, EMPTY_BUDGET);
                    }
                    API.attachments.list({
                        request: $scope.db.current_application.id
                    }).then(function (data) {
                        $scope.db.current_application.attachments = data;
                    });
                });
        };

        switch(controller_action) {
            case 'new':
                $scope.db.current_application = {
                    status: 'PEND',
                    contact: $scope.current_user.id,
                    editors: [$scope.current_user.email],
                    attachments: [],
                    best_case_budget: $.extend({}, EMPTY_BUDGET),
                    moderate_case_budget: $.extend({}, EMPTY_BUDGET),
                    worst_case_budget: $.extend({}, EMPTY_BUDGET)
                };
                break;
            case 'edit':
                get_specific();
                break;
            case 'list':
                get_list();
                break;
            case 'show':
                get_specific();
                break;

            case 'main':
                get_list();
                break;
        }

        $scope.$watch('db.current_application.requester', function (newval, oldval) {
            if (newval) {
                API.student_groups.get(newval)
                    .then(function (result) {
                        $scope.db.current_group_allocation = result.allocation.value + ' (' + result.allocation.year + ')';
                    });
            }
        });

        $scope.$watch('db.current_application.best_case_budget', function (newval, oldval) {
            if (newval && newval.total_expenses != undefined) {
                $scope.db.current_application.requested_amount = newval.total_expenses;
            }
        });

        $scope.add_row = function (dict, key, name, value) {
            if (!key || !name || !value) {
                return;
            }

            dict[key].push({
                name: name,
                value: value
            });
            dict['total_' + key] += value;
        };

        $scope.del_row = function (dict, key, index) {
            var old = dict[key][index];
            dict['total_' + key] -= old.value;
            dict[key].splice(index, 1);
        };

        $scope.can_edit = function () {
            if ($scope.current_user.on_council) {
                return true;
            }

            var MUTABLE_STATES = ['PEND', 'SUBM', 'SCHD'];

            if (MUTABLE_STATES.indexOf($scope.db.current_application.status) > -1) {
                return $scope.db.current_application.editors.indexOf($scope.current_user.email) > -1;
            } else {
                return false;
            }
        };

        $scope.can_endorse = function () {
            if ($scope.db.current_application.requester) {
                var student_group = $scope.db.student_groups_by_id[$scope.db.current_application.requester];
                for (var i in $scope.current_user.groups) {
                    var g = $scope.current_user.groups[i];
                    if (g == student_group.governing_board) {
                        return true;
                    }
                }
                return false;
            } else {
                return false;
            }
        };

        var mutex = false;

        $scope.uploadFile = function (files) {
            $log.log('uploadFile', files);
            var promises = [];
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                promises.push(API.cif_app.upload_file($scope.db.current_application.id, file));
                $q.all(promises).then(function (result) {
                        $location.path('/cif/' + $scope.db.current_application.id);
                        get_specific();
                    });
            }
        };

        $scope.deleteFile = function (fid) {
            return API.cif_app.delete_file($scope.db.current_application.id, fid)
                .then(function (result) {
                    get_specific();
                });
        };

        $scope.endorseApplication = function () {
            if (mutex) {
                return;
            }
            mutex = true;

            var endorsement = prompt('Please type your endorsement for this CIF application');

            if (endorsement) {
                API.cif_app.endorse($scope.db.current_application.id, endorsement)
                    .then(function (result) {
                        $location.path('/cif/' + $scope.db.current_application.id);
                        get_specific();
                        mutex = false;
                    });
            } else {
                mutex = false;

            }
        };


        $scope.updateApplication = function () {
            if (mutex) {
                return;
            }
            mutex = true;

            var copy = $.extend(true, {}, $scope.db.current_application);
			delete copy.status;

            API.cif_app.set($scope.db.current_application.id, copy)
                .then(function (result) {
                    $scope.notify('info', 'Updated CIF application #' + result.id);
                    $scope.db.current_application = result;
                    $location.path('/cif/' + result.id);
                    mutex = false;
                }, function (error) {
                    for (var k in error) {
                        $scope.notify('danger', error[k]);
                    }
                });
        };

        $scope.saveApplication = function () {
            if (!$scope.db.current_application.id) {
                if (mutex) {
                    return;
                }
                mutex = true;
				var copy = $.extend(true, {}, $scope.db.current_application);
				delete copy.status;
                return API.cif_app.create($scope.db.current_application)
                    .then(function (result) {
                        mutex = false;
                        $scope.notify('info', 'Created CIF application #' + result.id);
                        $location.path('/cif/' + result.id);
                    }, function (error) {
                        mutex = false;
                        for (var k in error) {
                            $scope.notify('danger', error[k]);
                        }
                    });
            } else {
                return $scope.updateApplication();
            }
        };

        $scope.submitApplication = function () {
            if (mutex) {
                return;
            }
            mutex = true;

            API.cif_app.submit($scope.db.current_application.id)
                .then(function (result) {
                    mutex = false;
                    $scope.notify('info', 'Submitted CIF application #' + $scope.db.current_application.id)
                    get_specific();
                }, function (err) {
                    mutex = false;
                    if (err.data.fields) {
                        $scope.notify('danger', 'Missing fields: ' + err.data.fields.join(', '));
                    } else {
                        $scope.notify('danger', 'Failed to submit CIF Application', err);
                    }
                });
        };

        $scope.scheduleApplication = function () {
            if (mutex) {
                return;
            }
            mutex = true;

            if (!$scope.db.current_application.scheduled_time) {
                $scope.notify('warning', 'No time scheduled!');
            }

            API.cif_app.schedule($scope.db.current_application.id, $scope.db.current_application.scheduled_time)
                .then(function (result) {
                    mutex = false;
                    $scope.notify('info', 'Scheduled CIF application #' + $scope.db.current_application.id)
                    get_specific();
                }, function (err) {
                    mutex = false;
                    $scope.notify('danger', 'Failed to schedule CIF Application', err);
                });
        };

        $scope.approveApplication = function () {
            if (mutex) {
                return;
            }
            mutex = true;

            if (!$scope.db.current_application.approved_amount) {
                $scope.notify('warning', 'Approval amount is 0');
            }
            if (!$scope.db.notes) {
                $scope.notify('warning', 'No notes attached');
            }

            API.cif_app.approve($scope.db.current_application.id, $scope.db.current_application.approved_amount, $scope.db.notes)
                .then(function (result) {
                    mutex = false;
                    $scope.notify('info', 'Approved CIF application #' + $scope.db.current_application.id);
                    get_specific();
                }, function (error) {
                    mutex = false;
                    $scope.notify('danger', 'Failed to approve CIF Application', error);
                });
        };

        $scope.denyApplication = function () {
            if (mutex) {
                return;
            }
            mutex = true;

            if (!$scope.db.notes) {
                $scope.notify('warning', 'No notes attached');
            }

            API.cif_app.deny($scope.db.current_application.id, $scope.db.notes)
                .then(function (result) {
                    mutex = false;
                    $scope.notify('info', 'Denied CIF application #' + $scope.db.current_application.id)
                    get_specific();
                }, function (error) {
                    mutex = false;
                    $scope.notify('danger', 'Failed to deny CIF Application', error);
                });
        };

        $scope.fileApplication = function () {
            if (mutex) {
                return;
            }
            mutex = true;

            API.cif_app.file($scope.db.current_application.id, $scope.db.current_application.actual_revenues, $scope.db.current_application.actual_expenditures)
                .then(function (result) {
                    mutex = false;
                    $scope.notify('info', 'Filed CIF application #' + $scope.db.current_application.id);
                    get_specific();
                }, function (error) {
                    mutex = false;
                    $scope.notify('danger', 'Failed to file CIF Application', error);
                });
        };

        $scope.completeApplication = function () {
            if (mutex) {
                return;
            }
            mutex = true;

            API.cif_app.complete($scope.db.current_application.id, $scope.db.current_application.transferred_amount)
                .then(function (result) {
                    mutex = false;
                    $scope.notify('info', 'Completed CIF application #' + $scope.db.current_application.id);
                    get_specific();
                }, function (error) {
                    mutex = false;
                    $scope.notify('danger', 'Failed to complete CIF Application', error);
                });
        };
    });
