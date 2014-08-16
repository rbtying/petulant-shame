'use strict';

// bootstrap angular
facu.config(['$routeProvider', '$locationProvider', '$httpProvider', function ($routeProvider, $locationProvider, $httpProvider) {

    // TODO use html5 *no hash) where possible
    // $locationProvider.html5Mode(true);

    var current_user_func = function(API, $location, $log, $q) {
        var defer = $q.defer();
        API.users.me()
            .then(function (result) {
                defer.resolve(result.data.user);
            }, function (err) {
                $log.error('could not get current user', err);
                var search = $location.search();
                if (!(search.loginerror || search.logout)) {
                    var href = $('#login').attr('href');
                    if (href) {
                        location.href = href;
                    }
                }
                defer.reject()
            });
        return defer.promise;
    };

    $routeProvider.when('/admin', {
        templateUrl: '/static/partials/admin.html',
        controller: 'adminCtrl',
        resolve: {
            'current_user': current_user_func
        }
    });
    $routeProvider.when('/about/constitution', {
        templateUrl: '/static/partials/constitution.html',
        resolve: {
            'current_user': current_user_func
        }
    });
    $routeProvider.when('/about', {
        templateUrl: '/static/partials/about.html',
        resolve: {
            'current_user': current_user_func
        }
    });
    $routeProvider.when('/allocations/new', {
        templateUrl: '/static/partials/alloc/edit.html',
        controller: 'allocationCtrl',
        resolve: {
            'current_user': current_user_func,
            'controller_action': function() {return 'new'}
        }
    });
    $routeProvider.when('/allocations/bulk', {
        templateUrl: '/static/partials/alloc/bulk.html',
        controller: 'bulkCtrl',
        resolve: {
            'current_user': current_user_func,
            'controller_action': function() {return 'bulk'}
        }
    });
    $routeProvider.when('/allocations/:id/edit', {
        templateUrl: '/static/partials/alloc/edit.html',
        controller: 'allocationCtrl',
        resolve: {
            'current_user': current_user_func,
            'controller_action': function() {return 'edit'}
        }
    });
    $routeProvider.when('/allocations', {
        templateUrl: '/static/partials/alloc/allocations.html',
        controller: 'allocationCtrl',
        resolve: {
            'current_user': current_user_func,
            'controller_action': function() {return 'list'}
        }
    });
    $routeProvider.when('/jccc', {
        templateUrl: '/static/partials/jccc/main.html',
        controller: 'jcccCtrl',
        resolve: {
            'controller_action': function() {return 'main'},
            'current_user': current_user_func
        }
    });
    $routeProvider.when('/jccc/list', {
        templateUrl: '/static/partials/jccc/list.html',
        controller: 'jcccCtrl',
        resolve: {
            'controller_action': function() {return 'list'},
            'current_user': current_user_func
        }
    });
    $routeProvider.when('/jccc/new', {
        templateUrl: '/static/partials/jccc/edit.html',
        controller: 'jcccCtrl',
        resolve: {
            'controller_action': function() {return 'new'},
            'current_user': current_user_func
        }
    });
    $routeProvider.when('/jccc/:id/edit', {
        templateUrl: '/static/partials/jccc/edit.html',
        controller: 'jcccCtrl',
        resolve: {
            'controller_action': function() {return 'edit'},
            'current_user': current_user_func
        }
    });
    $routeProvider.when('/jccc/:id', {
        templateUrl: '/static/partials/jccc/show.html',
        controller: 'jcccCtrl',
        resolve: {
            'controller_action': function() {return 'show'},
            'current_user': current_user_func
        }
    });
    $routeProvider.when('/cif', {
        templateUrl: '/static/partials/cif/main.html',
        controller: 'cifCtrl',
        resolve: {
            'controller_action': function() {return 'main'},
            'current_user': current_user_func
        }
    });
    $routeProvider.when('/cif/list', {
        templateUrl: '/static/partials/cif/list.html',
        controller: 'cifCtrl',
        resolve: {
            'controller_action': function() {return 'list'},
            'current_user': current_user_func
        }
    });
    $routeProvider.when('/cif/new', {
        templateUrl: '/static/partials/cif/edit.html',
        controller: 'cifCtrl',
        resolve: {
            'controller_action': function() {return 'new'},
            'current_user': current_user_func
        }
    });
    $routeProvider.when('/cif/:id/edit', {
        templateUrl: '/static/partials/cif/edit.html',
        controller: 'cifCtrl',
        resolve: {
            'controller_action': function() {return 'edit'},
            'current_user': current_user_func
        }
    });
    $routeProvider.when('/cif/:id', {
        templateUrl: '/static/partials/cif/show.html',
        controller: 'cifCtrl',
        resolve: {
            'controller_action': function() {return 'show'},
            'current_user': current_user_func
        }
    });
    $routeProvider.when('/esc_proj', {
        templateUrl: '/static/partials/esc_proj/main.html',
        controller: 'escProjCtrl',
        resolve: {
            'controller_action': function() {return 'main'},
            'current_user': current_user_func
        }
    });
    $routeProvider.when('/esc_proj/list', {
        templateUrl: '/static/partials/esc_proj/list.html',
        controller: 'escProjCtrl',
        resolve: {
            'controller_action': function() {return 'list'},
            'current_user': current_user_func
        }
    });
    $routeProvider.when('/esc_proj/new', {
        templateUrl: '/static/partials/esc_proj/edit.html',
        controller: 'escProjCtrl',
        resolve: {
            'controller_action': function() {return 'new'},
            'current_user': current_user_func
        }
    });
    $routeProvider.when('/esc_proj/:id/edit', {
        templateUrl: '/static/partials/esc_proj/edit.html',
        controller: 'escProjCtrl',
        resolve: {
            'controller_action': function() {return 'edit'},
            'current_user': current_user_func
        }
    });
    $routeProvider.when('/jccc/:id', {
        templateUrl: '/static/partials/jccc/show.html',
        controller: 'jcccCtrl',
        resolve: {
            'controller_action': function() {return 'show'},
            'current_user': current_user_func
        }
    });
    $routeProvider.when('/groups/:id', {
        controller: 'groupCtrl',
        templateUrl: '/static/partials/group/group.html',
        resolve: {
            'current_user': current_user_func
        }
    });
    $routeProvider.when('/groups/:id/members', {
        templateUrl: '/static/partials/group/members.html',
        controller: 'membersCtrl',
        resolve: {
            'group_unit': function() {return 'groups'},
            'current_user': current_user_func
        }
    });
    $routeProvider.when('/student_groups', {
        controller: 'studentGroupListCtrl',
        templateUrl: '/static/partials/group/student_group_list.html',
        resolve: {
            'current_user': current_user_func
        }
    });
    $routeProvider.when('/student_groups/new', {
        controller: 'studentGroupCtrl',
        templateUrl: '/static/partials/group/student_group_edit.html',
        resolve: {
            'current_user': current_user_func,
            'controller_action': function() {return 'new'}
        }
    });
    $routeProvider.when('/student_groups/:id/edit', {
        controller: 'studentGroupCtrl',
        templateUrl: '/static/partials/group/student_group_edit.html',
        resolve: {
            'current_user': current_user_func,
            'controller_action': function() {return 'edit'}
        }
    });
    $routeProvider.when('/student_groups/:id', {
        controller: 'studentGroupCtrl',
        templateUrl: '/static/partials/group/student_group.html',
        resolve: {
            'current_user': current_user_func,
            'controller_action': function() {return 'show'}
        }
    });
    $routeProvider.when('/student_groups/:id/members', {
        templateUrl: '/static/partials/group/members.html',
        controller: 'membersCtrl',
        resolve: {
            'group_unit': function() {return 'student_groups'},
            'current_user': current_user_func
        }
    });

    // by default, redirect to site root
    $routeProvider.otherwise({
        redirectTo: '/about'
    });

}]);

// this is run after angular is instantiated and bootstrapped
facu.run(function ($rootScope, $log, $q, $location, $http, $timeout, API) {

    $rootScope.db = {};

    $rootScope.db.funds = [
        {
            "text": "JCCC",
            "href": "#"
        },
        {
            "text": "CIF",
            "href": "#"
        },
        {
            "text": "Project Grants",
            "href": "#"
        }
    ];

    $rootScope.messages = [];

    $rootScope.notify = function (type, text) {
        var datum = {
            type: type,
            text: text
        };
        $rootScope.messages.push(datum);

        $timeout(function () {
            var idx = $rootScope.messages.indexOf(datum);
            if (idx > -1) {
                $rootScope.removeMessage(idx);
            }
        }, 3000);
    };

    $rootScope.removeMessage = function(idx) {
        $rootScope.messages.splice(idx, 1);
    };

    var search = $location.search();
    if (search.loginerror) {
        $rootScope.notify('error', 'An error occured during login. Please make sure you are using your @columbia.edu account');
        delete search.loginerror;
    }
    if (search.logout) {
        $rootScope.notify('info', 'You have successfully been logged out');
        delete search.logout;
    }
    $location.search(search);

    $rootScope.API = API;
});
