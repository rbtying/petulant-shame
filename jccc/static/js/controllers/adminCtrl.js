'use strict';

controllers
    .controller('adminCtrl', function ($scope, $q, $log, $location) {
        $log.log('init adminCtrl');

        $scope.admin = {};

        $scope.API.allocations().promise.then(function (data) {
            $log.log($scope.API.cache.allocations);
        });
        $scope.API.groups().promise.then(function (data) {
            $log.log($scope.API.cache.groups);
        });
    });
