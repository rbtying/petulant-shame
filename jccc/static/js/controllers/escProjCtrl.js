'use strict';

controllers
    .controller('escProjCtrl', function ($scope, $routeParams, $location, $q, $log, $timeout, API, controller_action, current_user) {
        $log.log('init escProjCtrl');

        $scope.current_user = current_user;

        var get_list = function () {
            var params = $location.search();
            API.esc_proj.list(params)
                .then(function (result) {
                    $scope.applications = result;
                });
        };

        var get_specific = function() {
            var id = $routeParams.id;
            API.esc_proj.get(id)
                .then(function (result) {
                    $scope.db.current_application = result;
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
                    editors: [$scope.current_user.email]
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
                promises.push(API.esc_proj.upload_file($scope.db.current_application.id, file));
                $q.all(promises).then(function (result) {
                        $location.path('/esc/' + $scope.db.current_application.id);
                        get_specific();
                    });
            }
        };

        $scope.deleteFile = function (fid) {
            return API.esc_proj.delete_file($scope.db.current_application.id, fid)
                .then(function (result) {
                    get_specific();
                });
        };

        $scope.endorseApplication = function () {
            if (mutex) {
                return;
            }
            mutex = true;

            var endorsement = prompt('Please type your endorsement for this ESC Project Grant application');

            if (endorsement) {
                API.esc_proj.endorse($scope.db.current_application.id, endorsement)
                    .then(function (result) {
                        $location.path('/esc/' + $scope.db.current_application.id);
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

            API.esc_proj.set($scope.db.current_application.id, copy)
                .then(function (result) {
                    $scope.notify('info', 'Updated ESC Project Grant application #' + result.id);
                    $scope.db.current_application = result;
                    $location.path('/esc/' + result.id);
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
                return API.esc_proj.create($scope.db.current_application)
                    .then(function (result) {
                        mutex = false;
                        $scope.notify('info', 'Created ESC Project Grant application #' + result.id);
                        $location.path('/esc/' + result.id);
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

            API.esc_proj.submit($scope.db.current_application.id)
                .then(function (result) {
                    mutex = false;
                    $scope.notify('info', 'Submitted ESC Project Grant application #' + $scope.db.current_application.id)
                    get_specific();
                }, function (err) {
                    mutex = false;
                    if (err.data.fields) {
                        $scope.notify('danger', 'Missing fields: ' + err.data.fields.join(', '));
                    } else {
                        $scope.notify('danger', 'Failed to submit ESC Project Grant Application', err);
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

            API.esc_proj.schedule($scope.db.current_application.id, $scope.db.current_application.scheduled_time)
                .then(function (result) {
                    mutex = false;
                    $scope.notify('info', 'Scheduled ESC Project Grant application #' + $scope.db.current_application.id)
                    get_specific();
                }, function (err) {
                    mutex = false;
                    $scope.notify('danger', 'Failed to schedule ESC Project Grant Application', err);
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

            API.esc_proj.approve($scope.db.current_application.id, $scope.db.current_application.approved_amount, $scope.db.notes)
                .then(function (result) {
                    mutex = false;
                    $scope.notify('info', 'Approved ESC Project Grant application #' + $scope.db.current_application.id);
                    get_specific();
                }, function (error) {
                    mutex = false;
                    $scope.notify('danger', 'Failed to approve ESC Project Grant Application', error);
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

            API.esc_proj.deny($scope.db.current_application.id, $scope.db.notes)
                .then(function (result) {
                    mutex = false;
                    $scope.notify('info', 'Denied ESC Project Grant application #' + $scope.db.current_application.id)
                    get_specific();
                }, function (error) {
                    mutex = false;
                    $scope.notify('danger', 'Failed to deny ESC Project Grant Application', error);
                });
        };

        $scope.fileApplication = function () {
            if (mutex) {
                return;
            }
            mutex = true;

            API.esc_proj.file($scope.db.current_application.id, $scope.db.current_application.actual_revenues, $scope.db.current_application.actual_expenditures)
                .then(function (result) {
                    mutex = false;
                    $scope.notify('info', 'Filed ESC Project Grant application #' + $scope.db.current_application.id);
                    get_specific();
                }, function (error) {
                    mutex = false;
                    $scope.notify('danger', 'Failed to file ESC Project Grant Application', error);
                });
        };

        $scope.completeApplication = function () {
            if (mutex) {
                return;
            }
            mutex = true;

            API.esc_proj.complete($scope.db.current_application.id, $scope.db.current_application.transferred_amount)
                .then(function (result) {
                    mutex = false;
                    $scope.notify('info', 'Completed ESC Project Grant application #' + $scope.db.current_application.id);
                    get_specific();
                }, function (error) {
                    mutex = false;
                    $scope.notify('danger', 'Failed to complete ESC Project Grant Application', error);
                });
        };
    });
