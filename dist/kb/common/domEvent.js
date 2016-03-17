/*global define */
/*jslint white: true, browser: true */
define([
    './dom',
    './html'
],
    function (dom, html) {
        'use strict';

        function factory(config) {
            var eventsPendingAttachment = [],
                eventsAttached = [];

            // DOM EVENTS
            function addEvent(type, handler, id, data) {
                if (!id) {
                    id = html.genId();
                }
                var event = {
                    type: type,
                    selector: '#' + id,
                    handler: handler
                };
                eventsPendingAttachment.push(event);
                return id;
            }
            function addEvents(events) {
                var id = html.genId();
                events.forEach(function (event) {
                    eventsPendingAttachment.push({
                        type: event.type,
                        selector: '#' + id,
                        handler: event.handler
                    });
                });
                return id;                
            }
            function attachEvent(type, handler, selector) {
                var event;
                if (typeof type === 'string') {
                    event = {
                        type: type,
                        selector: selector,
                        handler: handler
                    };
                } else {
                    event = type;
                }
                eventsPendingAttachment.push(event);
            }

            function attachEvents() {
                eventsPendingAttachment.forEach(function (event) {
                    var nodes = dom.qsa(event.selector);

                    nodes.forEach(function (node) {
                        eventsAttached.push({
                            type: event.type,
                            selector: event.selector,
                            node: node,
                            handler: event.handler,
                            listener: node.addEventListener(event.type, event.handler, event.capture || false)
                        });
                    });
                });
                eventsPendingAttachment = [];
            }
            function detachEvents() {
                eventsAttached.forEach(function (event) {
                    if (event.listener) {
                        event.node.removeEventListener(event.type, event.handler);
                        delete event.listener;
                    }
                });
                eventsAttached = [];
            }

            return Object.freeze({
                addEvent: addEvent,
                addEvents: addEvents,
                attachEvent: attachEvent,
                attachEvents: attachEvents,
                detachEvents: detachEvents
            });
        }

        return {
            make: function (config) {
                return factory(config);
            }
        };
    });