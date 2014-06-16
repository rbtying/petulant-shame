'use strict';

controllers
    .controller('membersCtrl', function ($scope, $q, $log, $routeParams, API, group_unit) {
        $log.log('init membersCtrl');
        var api = API[group_unit];
        var id = $routeParams.id;

        $scope.group_unit = group_unit;

        $scope.add_email = function (email) {
            $log.log('adding ', email);
            var idx = $scope.members.indexOf(email);
            if (idx === -1) {
                $scope.members.push(email);
            }
        };

        $scope.membersDirty = function () {
            if (!$scope.members || !$scope.members_pristine) {
                return false;
            }
            var added = $scope.members.filter(function (val, idx, arr) {
                return $scope.members_pristine.indexOf(val) === -1;
            });
            var removed = $scope.members_pristine.filter(function (val, idx, arr) {
                return $scope.members.indexOf(val) === -1;
            });

            return added.length > 0 || removed.length > 0;
        };

        $scope.remove_email = function (email) {
            $log.log('removing', email);
            var idx = $scope.members.indexOf(email);
            if (idx !== -1) {
                $scope.members.splice(idx, 1);
            }
        };

        $scope.save = function () {
            if ($scope.membersDirty()) {
                api.set_editors(id, $scope.members).then(load_members);
            }
        };

        function load_members() {
            api.get(id).then(function (data) {
                $scope.group = data;
                $scope.members = [];
                $scope.members_pristine = [];
                var i;
                if (group_unit == 'groups') {
                    for (i in $scope.group.user_set) {
                        (function (idx) {
                            API.users.get($scope.group.user_set[idx]).then(function (data) {
                                $scope.members.push(data.email);
                                $scope.members_pristine.push(data.email);
                            });
                        })(i);
                    }
                    for (i in $scope.group.groupprofile.editors) {
                        $scope.members.push($scope.group.groupprofile.editors[i]);
                        $scope.members_pristine.push($scope.group.groupprofile.editors[i]);
                    }
                } else if (group_unit == 'student_groups') {
                    for (i in $scope.group.editors) {
                        $scope.members.push($scope.group.editors[i]);
                        $scope.members_pristine.push($scope.group.editors[i]);
                    }
                }
            });
        }
        load_members();
    });
