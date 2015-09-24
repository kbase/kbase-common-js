/*global
 define, console
 */
/*jslint
 browser: true,
 white: true
 */
define([
    'kb_common_html',
    'kb_common_dom',
    'bluebird'
], function (html, dom, Promise) {
    'use strict';

    function factory(config) {

        var widgets = [],
            runtime = config.runtime;
        
        if (!runtime) {
            throw {
                name: 'RuntimeMissing',
                message: 'The rumtime argument was not provided',
                suggestion: 'This is a programmer error, not your fault.'
            };
        }

        function addWidgets(widgetIds, config) {
            widgetIds.map(function (widgetId) {
                return addWidget(widgetId, config);
            });
        }

        function addWidget(widgetId, config) {
            config = config || {};
            config.runtime = runtime;
            var widgetMaker = runtime.makeWidget(widgetId, config),
                id = html.genId(),
                rec = {
                    id: id,
                    widgetMaker: widgetMaker
                };
            widgets.push(rec);
            return id;
        }

        function makeWidgets() {
            return Promise.all(widgets.map(function (rec) {
                return rec.widgetMaker;
            }))
                .then(function (ws) {
                    // now we have the widget instance list.
                    eachArrays([widgets, ws], function (recs) {
                        recs[0].widget = recs[1];
                    });
                });
        }

        function eachArrays(arrays, fun) {
            var len = arrays[0].length,
                i, j;
            for (i = 0; i < len; i += 1) {
                var temp = [];
                for (j = 0; j < arrays.length; j += 1) {
                    temp.push(arrays[j][i]);
                }
                fun(temp);
            }
        }
        function mapArrays(arrays, fun) {
            var result = [],
                len = arrays[0].length,
                i, j;
            for (i = 0; i < len; i += 1) {
                var temp = [];
                for (j = 0; j < arrays.length; j += 1) {
                    temp.push(arrays[j][i]);
                }
                result.push(fun(temp));
            }
            return result;
        }


        function init(config) {
            return new Promise(function (resolve, reject) {
                makeWidgets()
                    .then(function () {
                        return Promise.all(widgets.map(function (rec) {
                            if (rec.widget.init) {
                                return rec.widget.init();
                            }
                        }).filter(function (next) {
                            next ? true : false;
                        }));
                    })
                    .then(function () {
                        resolve();
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            });
        }

        function attach(node) {
            return new Promise(function (resolve, reject) {
                Promise.all(widgets.map(function (rec) {
                    // find node by id.
                    if (!rec.node) {
                        rec.node = dom.findById(rec.id);
                    }
                    return rec.widget.attach(rec.node);
                }))
                    .then(function () {
                        resolve();
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            });
        }

        function start(params) {
            return new Promise(function (resolve, reject) {
                Promise.all(widgets.map(function (rec) {
                    return rec.widget.start(params);
                }))
                    .then(function () {
                        resolve();
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            });
        }

        function run(params) {
            return new Promise(function (resolve, reject) {
                Promise.all(widgets.map(function (rec) {
                    return rec.widget.run(params);
                }))
                    .then(function () {
                        resolve();
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            });
        }

        function stop(params) {
            return new Promise(function (resolve, reject) {
                Promise.all(widgets.map(function (rec) {
                    return rec.widget.stop();
                }))
                    .then(function () {
                        resolve();
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            });
        }

        function detach(params) {
            return new Promise(function (resolve, reject) {
                Promise.all(widgets.map(function (rec) {
                    return rec.widget.deatch();
                }))
                    .then(function () {
                        resolve();
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            });
        }

        function destroy(params) {
            return new Promise(function (resolve, reject) {
                Promise.all(widgets.map(function (rec) {
                    return rec.widget.destroy();
                }))
                    .then(function () {
                        resolve();
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            });
        }

        return {
            addWidget: addWidget,
            addWidgets: addWidgets,
            makeWidgets: makeWidgets,
            init: init,
            attach: attach,
            start: start,
            run: run,
            stop: stop,
            detach: detach,
            destory: destroy
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});