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

        function eachArrays(arrays, fun) {
            var len = arrays[0].length,
                i, j, temp;
            for (i = 0; i < len; i += 1) {
                temp = [];
                for (j = 0; j < arrays.length; j += 1) {
                    temp.push(arrays[j][i]);
                }
                fun(temp);
            }
        }
        function mapArrays(arrays, fun) {
            var result = [],
                len = arrays[0].length,
                i, j, temp;
            for (i = 0; i < len; i += 1) {
                temp = [];
                for (j = 0; j < arrays.length; j += 1) {
                    temp.push(arrays[j][i]);
                }
                result.push(fun(temp));
            }
            return result;
        }

        function addWidget(widgetId, config) {
            config = config || {};
            config.runtime = runtime;
            var widgetMaker = runtime.getService('widget').makeWidget(widgetId, config),
                id = html.genId(),
                rec = {
                    id: id,
                    widgetMaker: widgetMaker
                };
            widgets.push(rec);
            return id;
        }

        function addWidgets(widgetIds, config) {
            widgetIds.map(function (widgetId) {
                return addWidget(widgetId, config);
            });
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


        function init(config) {
            return makeWidgets()
                .then(function () {
                    return Promise.all(widgets.map(function (rec) {
                        console.log(rec);
                        if (rec.widget.init) {
                            return rec.widget.init(config);
                        }
                    }).filter(function (next) {
                        if (next) {
                            return true;
                        }
                        return false;
                    }));
                });
        }

        function attach() {
            return Promise.all(widgets.map(function (rec) {
                // find node by id.
                if (!rec.node) {
                    rec.node = dom.findById(rec.id);
                }
                return rec.widget.attach(rec.node);
            }));
        }

        function start(params) {
            return Promise.all(widgets.map(function (rec) {
                console.log('widgetSet: starting widget');
                console.log(rec);
                return rec.widget.start(params);
            }));
        }

        function run(params) {
            return Promise.all(widgets.map(function (rec) {
                if (rec.widget.run) {
                    return rec.widget.run(params);
                }
            }).filter(function (next) {
                if (next) {
                    return true;
                }
                return false;
            }));
        }

        function stop() {
            return Promise.all(widgets.map(function (rec) {
                return rec.widget.stop();
            }));
        }

        function detach() {
            return Promise.all(widgets.map(function (rec) {
                if (rec.widget.detach) {
                    return rec.widget.detach();
                }
            }).filter(function (next) {
                if (next) {
                    return true;
                }
                return false;
            }));
        }

        function destroy() {
            return Promise.all(widgets.map(function (rec) {
                return rec.widget.destroy();
            }));
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
            destroy: destroy
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});