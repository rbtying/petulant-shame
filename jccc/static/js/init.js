'use strict';

// declare top-level module which depends on filters,and services
var facu = angular.module('facu',
    [   'facu.filters',
        'facu.controllers',
        'facu.directives', // custom directives
        'ngSanitize', // for html-bind in ckeditor
        'ngRoute',
        'angularCharts',
        'angularFileUpload',
        'mgcrea.ngStrap' // angular strap
    ]);


var filters = angular.module('facu.filters', []);
var directives = angular.module('facu.directives', []);
var controllers = angular.module('facu.controllers', []);
