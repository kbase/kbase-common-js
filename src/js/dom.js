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
    function qs(selector) {
        return document.querySelector(selector);
    }    
    function qsa(selector) {
        var result = document.querySelectorAll(selector);
        if (result === null) {
            return [];
        };
        return Array.prototype.slice(result);
    }    
    function setHtml(nodeOrSelector, content) {
        var node;
        if (typeof nodeOrSelector === 'string') {
            node = qs(nodeOrSelector);
            if (node === null) {
                throw new Error('No node found for selector "'+nodeOrSelector+'"');
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