/*global
 define
 */
/*jslint
 browser: true,
 white: true
 */
define([], function () {
    'use strict';
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
    function qs(node, selector) {
        if (selector === undefined) {
            selector = node;
            node = document;
        }
        return node.querySelector(selector);
    }
    function qsa(node, selector) {
        if (selector === undefined) {
            selector = node;
            node = document;
        }
        var result = node.querySelectorAll(selector);
        if (result === null) {
            return [];
        }
        return Array.prototype.slice.call(result);
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

    return {
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
        qsa: qsa
    };
});