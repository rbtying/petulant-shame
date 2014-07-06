'use strict';

// declare top-level module which depends on filters,and services
var facu = angular.module('facu',
    [   'facu.filters',
        'facu.controllers',
        'facu.directives', // custom directives
        'ngSanitize', // for html-bind in ckeditor
        'ngRoute',
        'angularCharts',
        'mgcrea.ngStrap' // angular strap
    ]);


var filters = angular.module('facu.filters', []);
var directives = angular.module('facu.directives', []);
var controllers = angular.module('facu.controllers', []);

// bootstrap angular
facu.config(['$routeProvider', '$locationProvider', '$httpProvider', function ($routeProvider, $locationProvider, $httpProvider) {

    // TODO use html5 *no hash) where possible
    // $locationProvider.html5Mode(true);

    $routeProvider.when('/', {
        templateUrl: '/static/partials/home.html'
    });
    $routeProvider.when('/admin', {
        templateUrl: '/static/partials/admin.html',
        controller: 'adminCtrl'
    });
    $routeProvider.when('/about', {
        templateUrl: '/static/partials/about.html'
    });
    $routeProvider.when('/allocations', {
        templateUrl: '/static/partials/allocations.html'
    });
    $routeProvider.when('/groups/:id', {
        controller: 'groupCtrl',
        templateUrl: '/static/partials/group.html'
    });
    $routeProvider.when('/groups/:id/members', {
        templateUrl: '/static/partials/members.html',
        controller: 'membersCtrl',
        resolve: {
            'group_unit': function() {return 'groups'}
        }
    });
    $routeProvider.when('/student_groups', {
        controller: 'studentGroupListCtrl',
        templateUrl: '/static/partials/student_group_list.html'
    });
    $routeProvider.when('/student_groups/:id', {
        controller: 'studentGroupCtrl',
        templateUrl: '/static/partials/student_group.html'
    });
    $routeProvider.when('/student_groups/:id/members', {
        templateUrl: '/static/partials/members.html',
        controller: 'membersCtrl',
        resolve: {
            'group_unit': function() {return 'student_groups'}
        }
    });

    // by default, redirect to site root
    $routeProvider.otherwise({
        redirectTo: '/'
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

    $rootScope.notificationManager = new NotificationManager($rootScope);

    var search = $location.search();
    if (search.loginerror) {
        $rootScope.notificationManager.notify('error', 'An error occured during login. Please make sure you are using your @columbia.edu account');
        delete search.loginerror;
    }
    if (search.logout) {
        $rootScope.notificationManager.notify('info', 'You have successfully been logged out');
        delete search.logout;
    }
    $location.search(search);

    $rootScope.API = API;
});
