'use strict';

controllers
    .controller('studentGroupCtrl', function ($scope, $q, $log, $timeout, $routeParams, $location, API, current_user, controller_action) {
        $log.log('init studentGroupCtrl');

        $scope.current_user = current_user;

        $scope.plot_config = {
            'legend': {
                'display': true,
                'position': 'right'
            }
        };

        $scope.plot_data = {
            'series': [],
            'data': []
        };

        var ensure_specific = function () {
            API.student_groups.get($routeParams.id).then(function(data) {
                $scope.db.current_group = data;

                API.alloc.list({
                    recipient__id: $scope.db.current_group.id
                }).then(function (alloc) {
                    $scope.db.current_group.allocations = alloc.results;
                });

                $scope.plot_data = {
                    'series': ['CC', 'BC', 'SEAS', 'GS', 'Grad'],
                    'data': [
                        {
                            'x': 'CC',
                            'y': [$scope.db.current_group.proportion_cc]
                        },
                        {
                            'x': 'BC',
                            'y': [$scope.db.current_group.proportion_bc]
                        },
                        {
                            'x': 'SEAS',
                            'y': [$scope.db.current_group.proportion_seas]
                        },
                        {
                            'x': 'GS',
                            'y': [$scope.db.current_group.proportion_gs]
                        },
                        {
                            'x': 'Grad',
                            'y': [$scope.db.current_group.proportion_grad]
                        },
                    ]
                };
            });
        };

        $log.log('controller_action', controller_action);

        switch(controller_action) {
            case 'new':
                $scope.db.current_group = {
                    editors: []
                };


                $timeout(function () {
                    var gbid = -1;
                    for (var i in $scope.current_user.groups) {
                        var g = $scope.db.groups_by_id[$scope.current_user.groups[i]];
                        if (g.groupprofile.group_type == 'GBRD') {
                            gbid = g.id;
                        }
                    }

                    if (gbid > -1) {
                        $scope.db.current_group.governing_board = gbid;
                    }
                }, 1000);
                break;
            case 'edit':
            case 'show':
                ensure_specific();
                break;
        }

        $scope.can_edit = function () {
            if (!$scope.db.current_group) {
                return false;
            }
            var idx = $scope.db.current_group.editors.indexOf($scope.current_user.email);

            return idx > -1 || $scope.current_user.on_council || $scope.current_user.on_governing_board;
        };

        var mutex = false;

        $scope.saveGroup = function () {
            var i;
            if (mutex) {
                return;
            }
            mutex = true;

            var fields = ['proportion_cc', 'proportion_bc', 'proportion_seas', 'proportion_gs', 'proportion_grad'];

            var sum = 0;
            for (i in fields) {
                sum += $scope.db.current_group[fields[i]];
            }

            if (sum > 0) {
                for (i in fields) {
                    $scope.db.current_group[fields[i]] /= sum;
                }
            }

            if ($scope.db.current_group.editors.length == 0) {
                $scope.db.current_group.editors = [$scope.current_user.email];
            }

            if ($scope.db.current_group.id) {
                API.student_groups.set($scope.db.current_group.id, $scope.db.current_group)
                    .then(function (result) {
                        $scope.notify('info', 'Updated group #' + result.id);
                        $scope.db.current_group = result;
                        $location.path('/student_groups/' + result.id);
                        mutex = false;
                    }, function (error) {
                        $scope.notify('danger', 'Could not update group #' + $scope.db.current_group.id);
                        mutex = false;

                    });
            } else {
                API.student_groups.create($scope.db.current_group)
                    .then(function (result) {
                        $scope.notify('info', 'Created group #' + result.id);
                        $scope.db.current_group = result;
                        $location.path('/student_groups/' + result.id);
                        $scope.reloadData();
                        mutex = false;
                    }, function (error) {
                        $scope.notify('danger', 'Could not create group ' + $scope.db.current_group.name);
                        mutex = false;
                    });
            }
        };
    });
controllers
    .controller('studentGroupListCtrl', function ($scope, $q, $log, $location, API, current_user) {
        $log.log('init studentGroupCtrl');
        $scope.current_user = current_user;

        API.student_groups.list($location.search()).then(function(data) {
            $scope.db.current_groups = data.results;
        });

        $scope.can_add_group = function () {
            return $scope.current_user.on_council || $scope.current_user.on_governing_board;
        };
    });
