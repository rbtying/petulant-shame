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
        templateUrl: 'partials/home.html'
    });
    $routeProvider.when('/admin', {
        templateUrl: 'partials/admin.html'
    });
    $routeProvider.when('/about', {
        templateUrl: 'partials/about.html'
    });
    $routeProvider.when('/allocations', {
        templateUrl: 'partials/allocations.html'
    });
    $routeProvider.when('/groups/:id', {
        templateUrl: 'partials/groups.html'
    });
    $routeProvider.when('/groups/:id/members', {
        templateUrl: 'partials/members.html',
        resolve: {
        }
    });
    $routeProvider.when('/student_groups/:id', {
        templateUrl: 'partials/student_groups.html'
    });
    $routeProvider.when('/student_groups/:id/members', {
        templateUrl: 'partials/members.html',
        resolve: {
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
