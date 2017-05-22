/* global describe, it, expect */
define([
    'kb_common/html'
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

        it('Renders a simple tag', function () {
            var expected = '<br>';
            var br = html.tag('br', { close: false });
            expect(br).toEqual(expected);
        });

    });

});