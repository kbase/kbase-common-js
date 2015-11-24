define([
    './props'
],
    function (Props) {
        'use strict';
        function stateful() {
            var state = Props.make(),
                dirty = false;

            function set(prop, value) {
                state.setItem(prop, value);
                dirty = true;
            }
            function get(prop) {
                return state.getItem(prop);
            }
            function has(prop) {
                return state.hasItem(prop);
            }
            function isDirty() {
                return dirty;
            }
            function setClean() {
                dirty = false;
            }
            return {
                set: set,
                get: get,
                has: has,
                isDirty: isDirty,
                setClean: setClean
            };
        }
        
        return {
            make: function () {
                return stateful();
            }
        };
    });