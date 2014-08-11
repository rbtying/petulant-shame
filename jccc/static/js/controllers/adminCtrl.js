'use strict';

controllers
    .controller('adminCtrl', function ($scope, $q, $log, $location, API) {
        $log.log('init adminCtrl');

        API.groups.list().then(function(data) {
            $log.log('groups', data);
            $scope.groups = data;
        });
    });
