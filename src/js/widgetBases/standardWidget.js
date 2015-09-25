/*global define */
/*jslint white: true, browser: true */
define([
    'bluebird',
    'underscore',
    'kb_common_dom',
    'kb_common_state',
    'kb_common_html'
],
    function (Promise, _, dom, State, html) {
        'use strict';

        function makeWidget(config) {
            var mount, container, hooks = [], listeners = [], 
                state = State.make(),
                runtime = config.runtime,
                internalApi = {}, externalApi = {};
            
            if (config && config.on) {
                Object.keys(config.on).forEach(function (hookName) {
                   addHook(hookName, config.on[hookName]); 
                });
            }

            // The hooks for widget objects.
            function addHook(name, fun) {
                if (!hooks.hasOwnProperty(name)) {
                    hooks[name] = [];
                }
                hooks[name].push(fun);
            }
            function hook(name, fun) {
                if (_.isArray(name)) {
                    name.forEach(function (hookDef) {
                        addHook(hookDef[0], hookDef[1]);
                    });
                } else {
                    addHook(name, fun);
                }               
            }
            function hasHook(name) {
                if (hooks.hasOwnProperty(name)) {
                    return true;
                }
                return false;
            }
            function getHook(name) {
                if (hasHook(name)) {
                    return hooks[name];
                }
                return [];
            }

            // Interacting with content.
            function setHtml(content) {
                if (container) {
                    container.innerHTML = content;
                }
            }

            // STATE
            // 
            // Interacting with state
            function setState(prop, value) {
                state.set(prop, value);
            }
            function getState(prop, defaultValue) {
                return state.get(prop, defaultValue);
            }
            
            // EVENTS
            function recv(channel, message, handler) {
                listeners.push(runtime.recv(channel, message, handler));
            }
            function send(channel, message, data) {
                runtime.send(channel, message, data);
            }
            
            // DOM EVENTS
            var domEvents = [];
            function addDomEvent(type, handler, id, data) {
                if (!id) {
                    id = html.genId();
                }
                domEvents.push({
                    type: type,
                    selector: '#' + id,
                    handler: handler
                });
                return id;
            }
            function attachDomEvents() {
                domEvents.forEach(function (event) {
                    event.node = dom.nodeForId(event.id);
                    event.listener = event.node.addEventListener(event.type, event.handler);
                    
                    // $container.on(event.type, event.selector, event.data, event.handler);
                    /*var fun = function (e) {
                        console.log('trying...');
                        console.log(e.target);
                        console.log(event.selector);
                        console.log(matches(e.target, event.selector));
                        if (matches(e.target, event.selector)) {
                            event.handler();
                        }
                    };
                    event.actualHandler = fun;
                    $container.get(0).addEventListener(event.type, fun);
                    */
                });
            }
            function detachDomEvents() {
                domEvents.forEach(function (event) {
                    if (event.listener) {
                        event.node.removeEventListener(event.type, event.handler);
                        delete event.listener;
                        // $container.off(event.type, event.selector);
                        // $container.get(0).removeEventListener(event.type, event.actualHandler);
                    }
                });
            }
            
            // INTERNAL API
            
            internalApi = Object.freeze({
                recv: recv,
                send: send,
                getState: getState,
                setState: setState,
                addDomEvent: addDomEvent
            });
            
            
            // RENDERING

            function render() {
                return new Promise(function (resolve) {
                    if (!state.isDirty()) {
                        resolve();
                        return;
                    }
                    var promises = getHook('render').map(function (fun) {
                        return Promise.try(fun, [internalApi]);
                    });
                    resolve(Promise.settle(promises)
                        .then(function (results) {
                            // should only be one render result ... 
                            var result = results[results.length - 1];
                            if (result.isFulfilled()) {
                                if (result.value()) {
                                    setHtml(result.value());
                                }
                            } else if (result.isRejected()) {
                                setHtml('ERROR: ' + result.reason());
                                console.log(result.reason());
                            }
                            state.setClean();
                        }));
                });
            }

            // The Interface

            function init(config) {
                return new Promise(function (resolve) {
                    if (hasHook('init')) {
                        var promises = getHook('init').map(function (fun) {
                            return Promise.try(fun, [internalApi, config]);
                        });
                        resolve(Promise.settle(promises));
                    } else {
                        resolve();
                    }
                });
            }
            function attach(node) {
                return new Promise(function (resolve) {
                    mount = node;
                    container = dom.createElement('div');
                    dom.append(mount, container);
                    if (hasHook('attach')) {
                        var promises = getHook('attach').map(function (fun) {
                            return Promise.try(fun, [internalApi, container]);
                        });
                        resolve(Promise.settle(promises).
                            then(function () {
                                attachDomEvents();
                            }));
                    } else {
                        resolve();
                    }
                });
            }
            function start(params) {
                return new Promise(function (resolve) {
                    listeners.push(runtime.recv('app', 'heartbeat', function () {
                        render()
                            .then(function () {
                                // what here?
                            })
                            .catch(function (err) {
                                // handle render error
                                console.log('ERROR');
                                console.log(err);
                            })
                    }));
                    if (hasHook('start')) {
                        var promises = getHook('start').map(function (fun) {
                            return Promise.try(fun, [internalApi, params]);
                        });
                        resolve(Promise.settle(promises));
                    } else {
                        resolve();
                    }
                });
            }
            function stop() {
                return new Promise(function (resolve) {
                    if (hasHook('stop')) {
                        var promises = getHook('stop').map(function (fun) {
                            return Promise.try(fun, [internalApi]);
                        });
                        resolve(Promise.settle(promises));
                    } else {
                        resolve();
                    }
                });
            }
            function detach() {
                return new Promise(function (resolve) {
                    mount.innerHTML = '';
                    container = null;
                    mount = null;
                    if (hasHook('detach')) {
                        var promises = getHook('detach').map(function (fun) {
                            return Promise.try(fun, [internalApi]);
                        });
                        resolve(Promise.settle(promises).
                            then(function () {
                                detachDomEvents();
                            }));
                    } else {
                        resolve();
                    }
                });
            }
            function destroy() {
                return new Promise(function (resolve) {
                    if (hasHook('destroy')) {
                        var promises = getHook('destroy').map(function (fun) {
                            return Promise.try(fun, [internalApi]);
                        });
                        resolve(Promise.settle(promises));
                    } else {
                        resolve();
                    }
                });
            }

            externalApi = {
                // Widget Interface
                on: hook,
                
                // Lifecycle Interface
                init: init,
                attach: attach,
                start: start,
                stop: stop,
                detach: detach,
                destroy: destroy
            };
            
            return Object.freeze(externalApi);
        }

        return {
            make: function (config) {
                return makeWidget(config);
            }
        };
    });