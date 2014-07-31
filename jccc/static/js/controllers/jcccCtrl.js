'use strict';

controllers
    .controller('jcccCtrl', function ($scope, $routeParams, $location, $q, $log, $timeout, API, controller_action, current_user) {
        $log.log('init jcccCtrl');

        $scope.current_user = current_user;

        var get_list = function () {
            var params = $location.search();
            API.jccc_app.list(params)
                .then(function (result) {
                    $scope.applications = result.results;
                });
        };

        var get_specific = function() {
            var id = $routeParams.id;
            API.jccc_app.get(id)
                .then(function (result) {
                    $scope.db.current_application = result;
                    API.attachments.list({
                        request: $scope.db.current_application.id
                    }).then(function (data) {
                        $scope.db.current_application.attachments = data.results;
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
                promises.push(API.jccc_app.upload_file($scope.db.current_application.id, file));
                $q.all(promises).then(function (result) {
                        $location.path('/jccc/' + $scope.db.current_application.id);
                        get_specific();
                    });
            }
        };

        $scope.deleteFile = function (fid) {
            return API.jccc_app.delete_file($scope.db.current_application.id, fid)
                .then(function (result) {
                    get_specific();
                });
        };

        $scope.endorseApplication = function () {
            if (mutex) {
                return;
            }
            mutex = true;

            var endorsement = prompt('Please type your endorsement for this JCCC application');

            if (endorsement) {
                API.jccc_app.endorse($scope.db.current_application.id, endorsement)
                    .then(function (result) {
                        $location.path('/jccc/' + $scope.db.current_application.id);
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

            API.jccc_app.set($scope.db.current_application.id, copy)
                .then(function (result) {
                    $scope.notify('info', 'Updated JCCC application #' + result.id);
                    $scope.db.current_application = result;
                    $location.path('/jccc/' + result.id);
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
                return API.jccc_app.create($scope.db.current_application)
                    .then(function (result) {
                        mutex = false;
                        $scope.notify('info', 'Created JCCC application #' + result.id);
                        $location.path('/jccc/' + result.id);
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

            API.jccc_app.submit($scope.db.current_application.id)
                .then(function (result) {
                    mutex = false;
                    $scope.notify('info', 'Submitted JCCC application #' + $scope.db.current_application.id)
                    get_specific();
                }, function (err) {
                    mutex = false;
                    if (err.data.fields) {
                        $scope.notify('danger', 'Missing fields: ' + err.data.fields.join(', '));
                    } else {
                        $scope.notify('danger', 'Failed to submit JCCC Application', err);
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

            API.jccc_app.schedule($scope.db.current_application.id, $scope.db.current_application.scheduled_time)
                .then(function (result) {
                    mutex = false;
                    $scope.notify('info', 'Scheduled JCCC application #' + $scope.db.current_application.id)
                    get_specific();
                }, function (err) {
                    mutex = false;
                    $scope.notify('danger', 'Failed to schedule JCCC Application', err);
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

            API.jccc_app.approve($scope.db.current_application.id, $scope.db.current_application.approved_amount, $scope.db.notes)
                .then(function (result) {
                    mutex = false;
                    $scope.notify('info', 'Approved JCCC application #' + $scope.db.current_application.id);
                    get_specific();
                }, function (error) {
                    mutex = false;
                    $scope.notify('danger', 'Failed to approve JCCC Application', error);
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

            API.jccc_app.deny($scope.db.current_application.id, $scope.db.notes)
                .then(function (result) {
                    mutex = false;
                    $scope.notify('info', 'Denied JCCC application #' + $scope.db.current_application.id)
                    get_specific();
                }, function (error) {
                    mutex = false;
                    $scope.notify('danger', 'Failed to deny JCCC Application', error);
                });
        };

        $scope.fileApplication = function () {
            if (mutex) {
                return;
            }
            mutex = true;

            API.jccc_app.file($scope.db.current_application.id, $scope.db.current_application.actual_revenues, $scope.db.current_application.actual_expenditures)
                .then(function (result) {
                    mutex = false;
                    $scope.notify('info', 'Filed JCCC application #' + $scope.db.current_application.id);
                    get_specific();
                }, function (error) {
                    mutex = false;
                    $scope.notify('danger', 'Failed to file JCCC Application', error);
                });
        };

        $scope.completeApplication = function () {
            if (mutex) {
                return;
            }
            mutex = true;

            API.jccc_app.complete($scope.db.current_application.id, $scope.db.current_application.transferred_amount)
                .then(function (result) {
                    mutex = false;
                    $scope.notify('info', 'Completed JCCC application #' + $scope.db.current_application.id);
                    get_specific();
                }, function (error) {
                    mutex = false;
                    $scope.notify('danger', 'Failed to complete JCCC Application', error);
                });
        };
    });
