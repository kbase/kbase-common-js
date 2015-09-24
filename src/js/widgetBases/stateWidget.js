/*
 * 
 */
/*global
 define, console
 */
/*jslint
 browser: true,
 white: true
 */
/* DOC: sample pure object widget with interface
 */
define([
    'bluebird',    
    'kb.dom',
    'kb.runtime',
    'kb.html'
],
    function (Promise, DOM, R, html) {
        'use strict';
        return Object.create({}, {
            
            // Children widgets
            getWidgets: {
                value: function () {
                    if (this.widgets === undefined) {
                        this.widgets = [];
                    }
                    return this.widgets;
                }
            },
            addWidget: {
                value: function (widget) {
                    if (this.widgets === undefined) {
                        this.widgets = [];
                    }
                    var id = html.genId(),
                        div = html.tag('div');
                    
                    this.widgets.push({
                        id: id,
                        widget: widget
                    });
                    return div({id: id});
                }
            },
            
            // Refreshing
            refreshInterval: {
                get: function () {
                    if (this._refreshInterval) {
                        return this._refreshInterval;
                    }
                    return 500;
                },
                set: function (newValue) {
                    this._refreshInterval = newValue;
                }
            },
            
            
            
            setContent: {
                value: function (content) {
                    this.content = content;
                    this.dirty = true;
                }
            },
            getContent: {
                value: function () {
                    return this.content;
                }
            },
            hasContent: {
                value: function () {
                    if (this.content) {
                        return true;
                    }
                    return false;
                }
            },
            placeContent: {
                value: function () {
                    if (this.dirty) {
                        if (this.content) {
                            this.container.innerHTML = this.content;
                        } else {
                            this.container.innerHTML = '';
                        }
                        this.dirty = false;
                    }
                }
            },
            
            // Messaging
            receiving: {
                get: function () {
                    if (this._receiving === undefined) {
                        this._receiving = []
                    }
                    return this._receiving;
                }
            },
            recv: {
                value: function (channel, message, fun) {
                    this.receiving.push(R.recv(channel, message, fun));
                }
            },
            dropAll: {
                value: function () {
                    this.receiving.forEach(function (listener) {
                        R.drop(listener);
                    });
                    this._receiving = [];
                }
            },
            
            // Statefuless
            dirty: {
                get: function () {
                    if (this._dirty === undefined) {
                        this._dirty = false;
                    }
                },
                set: function (value) {
                    this._dirty === value;
                }
            },
            state: {
                value: Props.make()
            },
            setState: {
                value: function (prop, value) {
                    this.state.setItem(prop, value);
                    this.dirty = true;
                }
            },
            getState: {
                value: function (prop, defaultValue) {
                    return this.state.getItem(prop, defaultValue);
                }
            },
           
            init: {
                value: function (cfg) {
                    return new Promise(function (resolve) {
                        this.recv('app', 'heartbeat', function () {
                            this.placeContent();
                        }.bind(this));
                        if (this.onInit) {
                            this.onInit(cfg);
                        }
                        
                        resolve();
                    }.bind(this));
                }
            },
            
            attach: {
                value: function (node) {
                    return new Promise(function (resolve) {
                        this.mount = node;
                        this.container = DOM.createElement('div');
                        DOM.append(this.mount, this.container);
                        if (this.onAttach) {
                            this.onAttach(node);
                        }
                        this.placeContent();                        
                        resolve();
                    }.bind(this));
                }
            },
            
            start: {
                value: function (params) {
                    return new Promise(function (resolve) {
                        this.lastRefresh = Date.now();
                        this.recv('app', 'heartbeat', function () {
                            var now = Date.now(),
                                elapsed = now - this.lastRefresh;
                            if (elapsed > this.refreshInterval) {
                                this.lastRefresh = now;
                                if (this.onRefresh) {
                                    this.onRefresh(elapsed);
                                }       
                            }
                        }.bind(this));
                        if (this.onStart) {
                            this.onStart(params);
                        }
                        this.placeContent();
                        resolve();
                    }.bind(this));
                }
            },
            
            run: {
                value: function (params) {
                    return new Promise(function (resolve) {
                        if (this.onRun) {
                            this.onRun(params);
                        }
                        this.placeContent();
                        resolve();
                    }.bind(this));
                }
            },
            
            stop: {
                value: function () {
                    return new Promise(function (resolve) {
                        this.dropAll();
                        if (this.onStop) {
                            this.onStop();
                        }
                        resolve();
                    }.bind(this));
                }
            },
            
            detach: {
                value: function () {
                    return new Promise(function (resolve) {
                        if (this.onDetach) {
                            this.onDetach();
                        }
                        resolve();
                    }.bind(this));
                }
            },
            
            destroy: {
                value: function () {
                    return new Promise(function (resolve) {
                        if (this.onDestroy) {
                            this.onDestroy();
                        }
                        resolve();
                    }.bind(this));
                }
            }
    });
});