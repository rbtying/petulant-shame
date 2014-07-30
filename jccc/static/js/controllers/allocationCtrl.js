'use strict';

controllers
    .controller('allocationCtrl', function ($scope, $q, $log, $timeout, $routeParams, $location, API, current_user, controller_action) {
        $log.log('init allocationCtrl');

        $scope.current_user = current_user;

        var ensure_list = function () {
            API.alloc.list($location.search())
                .then(function (data) {
                    $scope.db.allocations = data.results;
                    $scope.allocation_years = ['all'];
                    $scope.allocation_sources = [{
                        name: 'all',
                        id: 'all'
                    }].concat($scope.db.governing_boards);

                    for (var i in $scope.db.allocations) {
                        var alloc = $scope.db.allocations[i];

                        if ($scope.allocation_years.indexOf(alloc.year) == -1) {
                            $scope.allocation_years.push(alloc.year);
                        }
                    }
                });
        };

        var ensure_specific = function () {
            API.alloc.get($routeParams.id)
                .then(function (data) {
                    $scope.db.current_allocation = data;
                });
        };

        $log.log('controller_action', controller_action);

        switch (controller_action) {
            case 'list':
                ensure_list();
                break;
            case 'new':
                $scope.db.current_allocation = {};
                break;
            case 'edit':
                ensure_specific();
                break;
        }

        $scope.can_edit = function () {
            if ($scope.current_user.on_council) {
                return true;
            }
            if (!$scope.db.groups_by_id) {
                return false;
            }

            for (var i in $scope.current_user.groups) {
                var g = $scope.db.groups_by_id[$scope.current_user.groups[i]];
                if (g.groupprofile.group_type == 'GBRD') {
                    return true;
                }
            }
            return false;
        };

        $scope.allocations_filter = {};

        $scope.allocation_filter_year = 'all';
        $scope.$watch('allocation_filter_year', function (newval, oldval) {
            if (newval && newval != 'all') {
                $scope.allocations_filter.year = newval;
            } else {
                delete $scope.allocations_filter.year;
            }
        });

        $scope.allocation_filter_gb = 'all';
        $scope.$watch('allocation_filter_gb', function (newval, oldval) {
            if (newval && newval != 'all') {
                $scope.allocations_filter.source = newval;
            } else {
                delete $scope.allocations_filter.source;
            }
        });


        var mutex = false;
        $scope.saveAllocation = function () {
            if (mutex) {
                return;
            }
            mutex = true;

            if ($scope.db.current_allocation.id) {
                API.alloc.set($scope.db.current_allocation.id, $scope.db.current_allocation)
                    .then(function (result) {
                        $scope.db.current_allocation = result;
                        $scope.notify('info', 'Saved allocation #' + result.id);
                        mutex = false;
                        $location.path('/allocations')
                    }, function (error) {
                        $scope.notify('danger', 'Failed to save allocation');
                        mutex = false;
                    });
            } else {
                API.alloc.create($scope.db.current_allocation)
                    .then(function (result) {
                        $scope.db.current_allocation = result.result;
                        $scope.notify('info', 'Created allocation #' + result.id);
                        mutex = false;
                        $location.path('/allocations')
                    }, function (error) {
                        $scope.notify('danger', 'Failed to create allocation');
                        mutex = false;
                    });
            }
        };
    });

