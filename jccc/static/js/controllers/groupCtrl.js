'use strict';

controllers
    .controller('groupCtrl', function ($scope, $routeParams, $q, $log, API) {
        $log.log('init groupCtrl');
        API.groups.get($routeParams.id).then(function(data) {
            $scope.group = data;
        }, function (err) {

        });
    });
