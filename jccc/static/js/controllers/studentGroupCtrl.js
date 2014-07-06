'use strict';

controllers
    .controller('studentGroupCtrl', function ($scope, $q, $log, $routeParams, $location, API) {
        $log.log('init studentGroupCtrl');

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


        API.student_groups.get($routeParams.id).then(function(data) {
            $scope.student_group = data;

            API.groups.get(data.governing_board).then(function(data) {
                $scope.student_group.governing_board = data;
            });

            $scope.plot_data = {
                'series': ['CC', 'BC', 'SEAS', 'GS', 'Grad'],
                'data': [
                    {
                        'x': 'CC',
                        'y': [$scope.student_group.proportion_cc]
                    },
                    {
                        'x': 'BC',
                        'y': [$scope.student_group.proportion_bc]
                    },
                    {
                        'x': 'SEAS',
                        'y': [$scope.student_group.proportion_seas]
                    },
                    {
                        'x': 'GS',
                        'y': [$scope.student_group.proportion_gs]
                    },
                    {
                        'x': 'Grad',
                        'y': [$scope.student_group.proportion_grad]
                    },
                ]
            };
        });

    });
controllers
    .controller('studentGroupListCtrl', function ($scope, $q, $log, $location, API) {
        $log.log('init studentGroupCtrl');
        API.student_groups.list($location.search()).then(function(data) {
            $scope.student_groups = data.results;

            angular.forEach($scope.student_groups, function(val, idx) {
                API.groups.get(val.governing_board).then(function(data) {
                    val.governing_board = data;
                });
            });
        });
    });
