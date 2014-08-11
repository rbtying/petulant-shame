'use strict';

controllers
    .controller('bulkCtrl', function ($scope, $q, $log, $timeout, $routeParams, $location, API, current_user, controller_action) {
        $log.log('init bulkCtrl');

        $scope.current_user = current_user;

        $scope.db.entries = [];
        $scope.db.errors = [];
        $scope.db.info = [];
        $scope.entries_valid = false;

        $scope.header_csv = 'group_name,alloc_value,alloc_year,sga_acct_number,cu_acct_number,cu_dept_number,cu_project_number,contact,governing_board,mission,percent_cc,percent_bc,percent_seas,percent_gs,percent_grad\n';
        $scope.csv = $scope.header_csv;

        $scope.can_edit = function () {
            return $scope.current_user.on_council || $scope.current_user.on_governing_board;
        };

        $scope.checkEntries = function () {
            var keys_to_check = ['governing_board_exists', 'group_not_empty', 'acct_number_exists', 'sum_valid'];
            for (var i = 0; i < $scope.db.entries.length; i++) {
                if ($scope.db.errors[i].length > 0) {
                    $scope.entries_valid = false;
                    $log.log('errors', $scope.db.errors[i]);
                    return;
                }
                for (var j = 0; j < keys_to_check.length; j++) {
                    if (!$scope.db.info[i][keys_to_check[j]]) {
                        $scope.entries_valid = false;
                        $log.log('info_errors', $scope.db.info[i], keys_to_check[j]);
                        return;
                    }
                }
            }
            $scope.entries_valid = true;
        };

        $scope.removeEntry = function (idx) {
            $scope.db.entries.splice(idx, 1);
            $scope.db.errors.splice(idx, 1);
            $scope.db.info.splice(idx,1);
            $scope.checkEntries();
        };

        var email_re = new RegExp('[a-z]+[0-9]+@columbia.edu|[a-z]+[0-9]+@barnard.edu');

        var makeInfo = function (data) {
            var info = {};

            info.governing_board_exists = !!$scope.db.groups_by_name[data.governing_board];
            info.group_exists = !!$scope.db.student_groups_by_name[data.group_name];
            info.group_not_empty = !!data.group_name;
            info.acct_number_exists = !!data.sga_acct_number || !!data.cu_acct_number || !!data.cu_dept_number || data.cu_project_number;

            info.contact_exists = email_re.test(data.contact);
            info.mission_exists = !!data.mission;
            var sum = data.percent_cc + data.percent_bc + data.percent_seas + data.percent_gs + data.percent_grad;
            info.sum_valid = sum > 0.9 && sum < 1.1;

            return info;
        };

        $scope.addCSV = function () {
            $scope.entries_valid = false;
            Papa.parse($scope.csv, {
                worker: true,
                header: true,
                dynamicTyping: true,
                step: function (row) {
                    $timeout(function () {
                        $log.log('row', row);

                        var d = row.data[0];

                        var sum = d.percent_cc + d.percent_bc + d.percent_seas + d.percent_gs + d.percent_grad;
                        if (sum != 0) {
                            d.percent_cc /= sum;
                            d.percent_bc /= sum;
                            d.percent_seas /= sum;
                            d.percent_gs /= sum;
                            d.percent_grad /= sum;
                        }

                        if (row.errors.length == 0) {
                            $scope.db.entries.push(d);
                            $scope.db.errors.push(row.errors);
                            $scope.db.info.push(makeInfo(d));
                        }
                    });
                },
                complete: function () {
                    $timeout(function () {
                        $log.log('done');
                        $scope.csv = $scope.header_csv;
                        $scope.checkEntries();
                    });
                }
            });
        };

        var mutex = false;
        $scope.submitEntries = function () {
            $scope.checkEntries();
            if (!$scope.entries_valid || mutex) {
                return;
            }
            mutex = true;

            $log.log('submitting entries', $scope.db.entries);
            API.alloc.bulk_upload($scope.db.entries)
                .then(function (result) {
                    mutex = false;
                    $scope.notify('info', 'Successfully uploaded CSV');
                    $location.path('/allocations');
                    $scope.reloadData();
                }, function (error) {
                    mutex = false;
                    $scope.notify('danger', 'Could not upload CSV');
                });

        };
    });

