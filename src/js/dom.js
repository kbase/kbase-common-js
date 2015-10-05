/*global
 define
 */
/*jslint
 browser: true,
 white: true
 */
define([], function () {
    'use strict';
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
            nodeId: id,
            handler: handler
        };
        eventsPendingAttachment.push(event);
        return id;
    }
    function attachEvents() {
        eventsPendingAttachment.forEach(function (event) {
            event.node = dom.nodeForId(event.nodeId);
            event.listener = event.node.addEventListener(event.type, event.handler);
            eventsAttached.push(event);
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


    function createElement(name) {
        return document.createElement(name);
    }
    function appendRoot(child) {
        document.appendChild(child);
    }
    function append(parent, child) {
        return parent.appendChild(child);
    }
    function remove(parent, child) {
        return parent.removeChild(child);
    }
    function findById(id) {
        return document.getElementById(id);
    }
    function nodeForId(id) {
        return document.getElementById(id);
    }
    function qs(selector) {
        return document.querySelector(selector);
    }
    function setHtml(nodeOrSelector, content) {
        var node;
        if (typeof nodeOrSelector === 'string') {
            node = qs(nodeOrSelector);
            if (node === null) {
                throw new Error('No node found for selector "' + nodeOrSelector + '"');
            }
        } else {
            node = nodeOrSelector;
        }
        node.innerHTML = content;
        return node;
    }

    return Object.freeze({
        createElement: createElement,
        appendRoot: appendRoot,
        append: append,
        remove: remove,
        setHTML: setHtml,
        setHtml: setHtml,
        findById: findById,
        nodeForId: nodeForId,
        getById: findById,
        qs: qs,
        addEvent: addEvent,
        attachEvents: attachEvents,
        detachEvents: detachEvents
    });
});