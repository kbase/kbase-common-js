/*global define */
/*jslint white: true */
define([
    'bluebird',
    './ajax'
], function (Promise, ajax) {
    'use strict';
    function parseCsv(s) {
        // stoopid first pass.
        var lines = s.split(/\n/);
        var rows = lines.map(function (line) {
            return line.split(/,/).map(function (d) {
                var e = d.trim();
                if (e.charAt(0) === '"') {
                    return e.replace(/"/g, '');
                } else {
                    var n;
                    if (e.match(/\./)) {
                        n = parseFloat(e);
                    } else {
                        n = parseInt(e);
                    }
                    if (!isNaN(n)) {
                        return n;
                    }
                    return e;
                }
                return e;
            });
        });
        return rows;
    }
    function load(path) {
        return ajax.get({
            url: path
        })
            .then(function (result) {
                return parseCsv(result);
            });
    }

    return {
        parseCsv: parseCsv,
        load: load
    };
});