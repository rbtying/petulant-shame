'use strict';

controllers
    .controller('groupCtrl', function ($scope, $routeParams, $q, $log, $location) {
        $log.log('init groupCtrl');
        $scope.group = $scope.API.cache.groups[$routeParams.id]
    });
