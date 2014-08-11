'use strict';

controllers
    .controller('baseCtrl', function ($rootScope, $scope, $q, $log, $location, API) {
        $log.log('init baseCtrl');

        $scope.MEDIA_URL = DJANGO_MEDIA_URL;

        $scope.db = {};

        $scope.reloadData = function () {
            API.groups.list()
                .then(function (result) {
                    $scope.db.groups = result;
                    $scope.db.governing_boards = result.filter(function (m, idx) {
                        return m.groupprofile.group_type == 'GBRD';
                    });
                    $scope.db.councils = result.filter(function (m, idx) {
                        return m.groupprofile.group_type == 'CNCL';
                    });
                    $scope.db.groups_by_id = {};
                    $scope.db.groups_by_name = {};
                    for (var i in $scope.db.groups) {
                        var g = $scope.db.groups[i];
                        $scope.db.groups_by_id[g.id] = g;
                        $scope.db.groups_by_name[g.name] = g;
                    }
                });
            API.student_groups.list()
                .then(function (result) {
                    $scope.db.student_groups = result;

                    $scope.db.student_groups_by_id = {};
                    $scope.db.student_groups_by_name = {};
                    for (var i in $scope.db.student_groups) {
                        var g = $scope.db.student_groups[i];
                        $scope.db.student_groups_by_id[g.id] = g;
                        $scope.db.student_groups_by_name[g.name] = g;
                    }
                });

            API.users.list()
                .then(function (result) {
                    $scope.db.users = result;

                    $scope.db.users_by_id = {};
                    for (var i in $scope.db.users) {
                        var u = $scope.db.users[i];
                        $scope.db.users_by_id[u.id] = u;
                    }
                });
        };
        $scope.reloadData();
    });

