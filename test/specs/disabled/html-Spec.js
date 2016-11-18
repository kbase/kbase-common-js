define([
    'kb/common/html'
], function (html) {
    'use strict';
    describe('Basic tests', function () {
        it('Loads', function () {
             var alive;
            if (html) {
                alive = true;
            } else {
                alive = false;
            }
            expect(alive).toBeTruthy();
        });

    });

});