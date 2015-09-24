/*global
 define, console
 */
/*jslint
 browser: true,
 white: true
 */
define([
],
    function () {
        'use strict';
        
        function factory(config) {
            // Variables
            // The widget registry is a db (map) of widget definitions.
            // Note that we do NOT YET store widget instance references ...
            var widgets = {};
            
            // Functions
            
            
            // API Functions
            
            function addWidget(widgetDef) {
                if (widgets[widgetDef.id]) {
                    throw new Error('Widget ' + widgetDef.id + ' is already registered');
                }
                /* TODO:  validate the widget ...*/
                widgets[widgetDef.id] = widgetDef;
            }
            function getWidget(widgetId) {
                return widgets[widgetId];
            }
            function makeWidget(widgetId, config) {
                var widget = widgets[widgetId];
                if (!widget) {
                    throw new Error('Widget ' + widgetId + ' not found');
                }
                
                // How we create a widget depends on what type it is.
                switch (widget.type) {
                    case 'factory': 
                        return makeFactoryWidget(widget, config);
                    default:
                        throw new Error('Unsupported widget type ' + widget.type);
                }
                
            }
            function makeFactoryWidget(widget, config) {
                return new Promise(function (resolve) {
                    require([widget.module], function (factory) {
                        var w = factory.make(config);
                        resolve(w);
                    });
                });                
            }
            
          
            // API
            return {
                addWidget: addWidget,
                getWidget: getWidget,
                makeWidget: makeWidget
            };
        }
        
        return {
            make: function(config) {
                return factory(config);
            }
        };
    });