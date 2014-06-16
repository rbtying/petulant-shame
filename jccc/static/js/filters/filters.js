'use strict';

/* Filters */

filters
.filter('interpolate', ['version', function (version) {
    return function (text) {
        return String(text).replace(/\%VERSION\%/mg, version);
    }
}])
.filter('sumvals', function() {
    return function(dict) {
        var sum = 0;
        for (var key in dict) {
            sum = sum + dict[key];
        }
        return sum;
    }
})
.filter('sumalloc', function() {
    return function(alloc) {
        var sum = 0;
        for (var i in alloc) {
            sum = sum + alloc[i].allocation;
        }
        return sum;
    }
})
;
