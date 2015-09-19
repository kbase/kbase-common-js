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
    function setHTML(parent, content) {
        return parent.innerHTML = content;
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
    return {
        createElement: createElement,
        appendRoot: appendRoot,
        append: append,
        remove: remove,
        setHTML: setHTML,
        findById: findById,
        nodeForId: nodeForId,
        getById: findById,
        qs: qs
    };
});