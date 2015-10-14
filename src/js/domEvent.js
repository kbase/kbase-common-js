/*global define */
/*jslint white: true, browser: true */
define([
    'kb_common_dom',
    'kb_common_html'
],
    function (dom, html) {
        'use strict';

        function factory(config) {
            var eventsPendingAttachment = [],
                eventsAttached = [];
            
            // DOM EVENTS
            function addEvent(type, handler, selector, data) {
                if (!selector) {
                    selector = html.genId();
                }
                var event = {
                    type: type,
                    selector: '#' + id,
                    nodeId: id,
                    handler: handler
                };
                eventsPendingAttachment.push(event);
                return id;
            }
            function attachEvents() {
                console.log(eventsPendingAttachment);
                eventsPendingAttachment.forEach(function (event) {
                    console.log('adding event for: ' + event.nodeId);
                    event.node = dom.nodeForId(event.nodeId);
                    if (event.node !== null) {
                        event.listener = event.node.addEventListener(event.type, event.handler);
                        eventsAttached.push(event);
                    }
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