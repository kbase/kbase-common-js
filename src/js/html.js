define([
    'uuid'
], function (
    Uuid
) {
    'use strict';

    function jsonToHTML(node) {
        var nodeType = typeof node,
            out;
        if (nodeType === 'string') {
            return node;
        }
        if (nodeType === 'boolean') {
            if (node) {
                return 'true';
            }
            return 'false';
        }
        if (nodeType === 'number') {
            return String(node);
        }
        if (nodeType === 'object' && node.push) {
            out = '';
            node.forEach(function (item) {
                out += jsonToHTML(item);
            });
            return out;
        }
        if (nodeType === 'object') {
            out = '';
            out += '<' + nodeType.tag;
            if (node.attributes) {
                node.attributes.keys().forEach(function (key) {
                    out += key + '="' + node.attributes[key] + '"';
                });
            }
            out += '>';
            if (node.children) {
                out += jsonToHTML(node.children);
            }
            out += '</' + node.tag + '>';
            return out;
        }
    }

    var tagsCache = {};
    /**
         * Given a simple object of keys and values, create a string which
         * encodes them into a form suitable for the value of a style attribute.
         * Style attribute values are themselves attributes, but due to the limitation
         * of html attributes, they are embedded in a string:
         * The format is
         * key: value;
         * Note that values are not quoted, and the separator between fields is
         * a semicolon
         * Note that we expect the value to be embedded withing an html attribute
         * which is quoted with double-qoutes; but we don't do any escaping here.
         * @param {type} attribs
         * @returns {String}
         */
    function camelToHyphen(s) {
        return s.replace(/[A-Z]/g, function (m) {
            return '-' + m.toLowerCase();
        });
    }

    function makeStyleAttribs(attribs) {
        if (attribs) {
            return Object.keys(attribs)
                .map(function (rawKey) {
                    var value = attribs[rawKey],
                        key = camelToHyphen(rawKey);

                    if (typeof value === 'string') {
                        return key + ': ' + value;
                    }
                    // just ignore invalid attributes for now
                    // TODO: what is the proper thing to do?
                    return '';
                })
                .filter(function (field) {
                    return field ? true : false;
                })
                .join('; ');
        }
        return '';
    }

    /*
        THe correct form is 'attrib-key'
        Usage in the wild may be "attrib-key", which is converted to the above
        Or just attrib-key, which is then wrapped in '
        The hyphenation of attribKey will not work because knockout keys
        may be legitimately camelCased.
        */
    function fixKey(key) {
        if (key.match(/'.*'/)) {
            return key;
        }
        if (key.match(/".*"/)) {
            return key.replace(/"/g, '\'');
        }
        if (key.match(/-/)) {
            return '\'' + key + '\'';
        }
        return key;
    }
    /**
         * The attributes for knockout's data-bind is slightly different than
         * for style. The syntax is that of a simple javascript object.
         * property: value, property: "value", property: 123
         * So, we simply escape double-quotes on the value, so that unquoted values
         * will remain as raw names/symbols/numbers, and quoted strings will retain
         * the quotes.
         * TODO: it would be smarter to detect if it was a quoted string
         *
         * @param {type} attribs
         * @returns {String}
         */

    // outer level (no surrounting curly braces.)
    function makeDataBindAttribs(attribs) {
        if (attribs) {
            return Object.keys(attribs)
                .map(function (key) {
                    var value = attribs[key];
                    key = fixKey(key);
                    return key + ': ' + makeDataBindAttribs2(value) + '';
                })
                .filter(function (field) {
                    return field ? true : false;
                })
                .join(',');
        }
        return '';
    }

    function makeDataBindAttribs2(attribs) {
        switch (typeof attribs) {
        case 'object':
            if (attribs instanceof Array) {
                return '[' + attribs.map(function (attrib) {
                    return makeDataBindAttribs2(attrib);
                }).join(',') + ']';
            } else if (attribs === null) {
                return 'null';
            } else {
                return '{' + Object.keys(attribs)
                    .map(function (key) {
                        var value = attribs[key];
                        key = fixKey(key);
                        return key + ':' + makeDataBindAttribs2(value);
                    })
                    .filter(function (field) {
                        return field ? true : false;
                    })
                    .join(',') + '}';
            }
        case 'function':
            return attribs.toString();
        case 'string':
            return attribs.replace(/"/g, '\'');
        case 'number':
            return String(attribs);
        case 'boolean':
            return String(attribs);
        default: 
            throw new Error('Type not supported for data-bind attribute: ' + (typeof attribs));
        }
    }

    /**
         * Given a simple object of keys and values, create a string which
         * encodes a set of html tag attributes.
         * String values escape the "
         * Boolean values either insert the attribute name or not
         * Object values are interpreted as "embedded attributes" (see above)
         * @param {type} attribs
         * @returns {String}
         */
    function makeTagAttribs(attribs) {
        var quoteChar = '"',
            quoteEscaped = '&quot;',
            escapedValue;
        if (attribs) {
            return Object.keys(attribs)
                .map(function (key) {
                    var value = attribs[key],
                        attribName = camelToHyphen(key);
                        // The value may itself be an object, which becomes a special string.
                        // This applies for "style" and "data-bind", each of which have a
                        // structured string value.
                        // Another special case is an array, useful for space-separated
                        // attributes, esp. "class".
                    if (typeof value === 'object') {
                        if (value === null) {
                            // null works just like false.
                            value = false;
                        } else if (value instanceof Array) {
                            value = value.join(' ');
                        } else {
                            switch (attribName) {
                            case 'style':
                                value = makeStyleAttribs(value);
                                break;
                            case 'data-bind':
                                value = makeDataBindAttribs(value);
                                break;
                            default:
                                value = false;
                            }
                        }
                    }
                    if (typeof value === 'string') {
                        escapedValue = value.replace(/"/g, quoteEscaped);
                        return attribName + '=' + quoteChar + escapedValue + quoteChar;
                    }
                    if (typeof value === 'boolean') {
                        if (value) {
                            return attribName;
                        }
                        return false;
                    }
                    if (typeof value === 'number') {
                        return attribName + '=' + quoteChar + String(value) + quoteChar;
                    }
                    return false;
                })
                .filter(function (field) {
                    return field ? true : false;
                })
                .join(' ');
        }
        return '';
    }

    function renderContent(children) {
        if (children) {
            if (typeof children === 'string') {
                return children;
            }
            if (typeof children === 'number') {
                return String(children);
            }
            if (children instanceof Array) {
                return children.map(function (item) {
                    return renderContent(item);
                }).join('');
            }
        } else {
            return '';
        }
    }

    function merge(obj1, obj2) {
        function isObject(x) {
            if (typeof x === 'object' &&
                    x !== null &&
                    !(x instanceof Array)) {
                return true;
            }
            return false;
        }

        function merger(a, b) {
            Object.keys(b).forEach(function (key) {
                if (isObject(a) && isObject(b)) {
                    a[key] = merger(a[key], b[key]);
                }
                a[key] = b[key];
            });
            return a;
        }
        return merger(obj1, obj2);
    }

    function tag(tagName, options) {
        options = options || {};
        var tagAttribs;
        if (tagsCache[tagName] && !options.ignoreCache) {
            return tagsCache[tagName];
        }
        var tagFun = function (attribs, children) {
            var node = '<' + tagName;
            if (attribs instanceof Array) {
                // skip attribs, just go to children.
                children = attribs;
                attribs = null;
            } else if (typeof attribs === 'string') {
                // skip attribs, just go to children.
                children = attribs;
                attribs = null;
            } else if (attribs === null || attribs === undefined) {
                if (!children) {
                    children = '';
                }
            } else if (typeof attribs === 'object') {
                if (options.attribs) {
                    attribs = merge(merge({}, options.attribs), attribs);
                }
            } else if (typeof attribs === 'number') {
                children = String(attribs);
                attribs = null;
            } else if (typeof attribs === 'boolean') {
                if (attribs) {
                    children = 'true';
                } else {
                    children = 'false';
                }
                attribs = null;
            } else {
                throw 'Cannot make tag ' + tagName + ' from a ' + (typeof attribs);
            }
            attribs = attribs || options.attribs;
            if (attribs) {
                tagAttribs = makeTagAttribs(attribs);
                if (tagAttribs && tagAttribs.length > 0) {
                    node += ' ' + tagAttribs;
                }
            }

            node += '>';
            if (options.close !== false) {
                node += renderContent(children);
                node += '</' + tagName + '>';
            }
            return node;
        };
        if (!options.ignoreCache) {
            tagsCache[tagName] = tagFun;
        }
        return tagFun;
    }

    function tags(tagNames) {
        return tagNames.map(function (tagName) {
            return tag(tagName);
        });
    }

    function genId() {
        return 'kb_html_' + (new Uuid(4)).format();
    }

    function makeTable(arg) {
        var table = tag('table'),
            thead = tag('thead'),
            tbody = tag('tbody'),
            tr = tag('tr'),
            th = tag('th'),
            td = tag('td'),
            id, attribs;
        arg = arg || {};
        if (arg.id) {
            id = arg.id;
        } else {
            id = genId();
            arg.generated = { id: id };
        }
        attribs = { id: id };
        if (arg.class) {
            attribs.class = arg.class;
        } else if (arg.classes) {
            attribs.class = arg.classes.join(' ');
        }
        return table(attribs, [
            thead(tr(arg.columns.map(function (x) {
                return th(x);
            }))),
            tbody(arg.rows.map(function (row) {
                return tr(row.map(function (x) {
                    return td(x);
                }));
            }))
        ]);
    }

    function bsPanel(title, content) {
        var div = tag('div'),
            span = tag('span');

        return div({ class: 'panel panel-default' }, [
            div({ class: 'panel-heading' }, [
                span({ class: 'panel-title' }, title)
            ]),
            div({ class: 'panel-body' }, [
                content
            ])
        ]);
    }

    function makePanel(arg) {
        var div = tag('div'),
            span = tag('span'),
            klass = arg.class || 'default';

        return div({ class: 'panel panel-' + klass }, [
            div({ class: 'panel-heading' }, [
                span({ class: 'panel-title' }, arg.title)
            ]),
            div({ class: 'panel-body' }, [
                arg.content
            ])
        ]);
    }

    function loading(msg, size) {
        var span = tag('span'),
            i = tag('i'),
            prompt;
        if (msg) {
            prompt = msg + '... &nbsp &nbsp';
        }
        var iconSize = 'fa-2x';
        if (size) {
            switch (size) {
            case 'normal':
                iconSize = null;
                break;
            case 'large': 
                iconSize = 'fa-2x';
                break;
            case 'extra-large':
                iconSize = 'fa-3x';
                break;
            }
        }
        return span([
            prompt,
            i({ 
                class: 'fa fa-spinner fa-pulse fa-fw margin-bottom' + (iconSize ? ' ' + iconSize : '')
            })
        ]);
    }

    /*
         *
         */
    function makeTableRotated(arg) {
        function columnLabel(column) {
            var key;
            if (typeof column === 'string') {
                key = column;
            } else {
                if (column.label) {
                    return column.label;
                }
                key = column.key;
            }
            return key
                .replace(/(id|Id)/g, 'ID')
                .split(/_/g).map(function (word) {
                    return word.charAt(0).toUpperCase() + word.slice(1);
                })
                .join(' ');
        }

        function formatValue(rawValue, column) {
            if (typeof column === 'string') {
                return rawValue;
            }
            if (column.format) {
                return column.format(rawValue);
            }
            if (column.type) {
                switch (column.type) {
                case 'bool':
                    // yuck, use truthiness
                    if (rawValue) {
                        return 'True';
                    }
                    return 'False';
                default:
                    return rawValue;
                }
            }
            return rawValue;
        }

        var table = tag('table'),
            tr = tag('tr'),
            th = tag('th'),
            td = tag('td'),
            id = genId(),
            attribs = { id: id };
        if (arg.class) {
            attribs.class = arg.class;
        } else if (arg.classes) {
            attribs.class = arg.classes.join(' ');
        }

        return table(attribs,
            arg.columns.map(function (column, index) {
                return tr([
                    th(columnLabel(column)),
                    arg.rows.map(function (row) {
                        return td(formatValue(row[index], column));
                    })
                ]);
            }));
    }

    function makeRotatedTable(data, columns) {
        function columnLabel(column) {
            var key;
            if (column.label) {
                return column.label;
            }
            if (typeof column === 'string') {
                key = column;
            } else {
                key = column.key;
            }
            return key
                .replace(/(id|Id)/g, 'ID')
                .split(/_/g).map(function (word) {
                    return word.charAt(0).toUpperCase() + word.slice(1);
                })
                .join(' ');
        }

        function columnValue(row, column) {
            var rawValue = row[column.key];
            if (column.format) {
                return column.format(rawValue);
            }
            if (column.type) {
                switch (column.type) {
                case 'bool':
                    // yuck, use truthiness
                    if (rawValue) {
                        return 'True';
                    }
                    return 'False';
                default:
                    return rawValue;
                }
            }
            return rawValue;
        }

        var table = tag('table'),
            tr = tag('tr'),
            th = tag('th'),
            td = tag('td');
        return table({ class: 'table table-stiped table-bordered' },
            columns.map(function (column) {
                return tr([
                    th(columnLabel(column)), data.map(function (row) {
                        return td(columnValue(row, column));
                    })
                ]);
            }));
    }

    function properCase(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    function makeObjTable(data, options) {
        var tableData = (data instanceof Array && data) || [data],
            columns = (options && options.columns) || Object.keys(tableData[0]).map(function (key) {
                return {
                    key: key,
                    label: properCase(key)
                };
            }),
            classes = (options && options.classes) || ['table-striped', 'table-bordered'],
            table = tag('table'),
            tr = tag('tr'),
            th = tag('th'),
            td = tag('td');

        function columnValue(row, column) {
            var rawValue = row[column.key];
            if (column.format) {
                return column.format(rawValue);
            }
            if (column.type) {
                switch (column.type) {
                case 'bool':
                    // yuck, use truthiness
                    if (rawValue) {
                        return 'True';
                    }
                    return 'False';
                default:
                    return rawValue;
                }
            }
            return rawValue;
        }
        if (options && options.rotated) {
            return table({ class: 'table ' + classes.join(' ') },
                columns.map(function (column) {
                    return tr([
                        th(column.label),
                        tableData.map(function (row) {
                            return td({ dataElement: column.key }, columnValue(row, column));
                        })
                    ]);
                }));
        }
        return table({ class: 'table ' + classes.join(' ') }, [tr(columns.map(function (column) {
            return th(column.label);
        }))].concat(tableData.map(function (row) {
            return tr(columns.map(function (column) {
                return td({ dataElement: column.key }, columnValue(row, column));
            }));
        })));
    }

    function makeObjectTable(data, options) {
        function columnLabel(column) {
            var key;
            if (column.label) {
                return column.label;
            }
            if (typeof column === 'string') {
                key = column;
            } else {
                key = column.key;
            }
            return key
                .replace(/(id|Id)/g, 'ID')
                .split(/_/g).map(function (word) {
                    return word.charAt(0).toUpperCase() + word.slice(1);
                })
                .join(' ');
        }

        function columnValue(row, column) {
            var rawValue = row[column.key];
            if (column.format) {
                return column.format(rawValue);
            }
            if (column.type) {
                switch (column.type) {
                case 'bool':
                    // yuck, use truthiness
                    if (rawValue) {
                        return 'True';
                    }
                    return 'False';
                default:
                    return rawValue;
                }
            }
            return rawValue;
        }
        var columns, classes;
        if (!options) {
            options = {};
        } else if (options.columns) {
            columns = options.columns;
        } else {
            columns = options;
            options = {};
        }
        if (!columns) {
            columns = Object.keys(data).map(function (columnName) {
                return {
                    key: columnName
                };
            });
        } else {
            columns = columns.map(function (column) {
                if (typeof column === 'string') {
                    return {
                        key: column
                    };
                }
                return column;
            });
        }
        if (options.classes) {
            classes = options.classes;
        } else {
            classes = ['table-striped', 'table-bordered'];
        }

        var table = tag('table'),
            tr = tag('tr'),
            th = tag('th'),
            td = tag('td'),
            result = table({ class: 'table ' + classes.join(' ') },
                columns.map(function (column) {
                    return tr([
                        th(columnLabel(column)),
                        td(columnValue(data, column))
                    ]);
                }));
        return result;
    }

    function flatten(html) {
        if (typeof html === 'string') {
            return html;
        }
        if (html instanceof Array) {
            return html.map(function (h) {
                return flatten(h);
            }).join('');
        }
        throw new Error('Not a valid html representation -- must be string or list');
    }

    function makeList(arg) {
        if (arg.items instanceof Array) {
            var ul = tag('ul'),
                li = tag('li');
            return ul(arg.items.map(function (item) {
                return li(item);
            }));
        }
        return 'Sorry, cannot make a list from that';
    }

    /**
         * Make a bootsrap tabset:
         * arg.tabs.id
         * arg.tabs.label
         * arg.tabs.name
         * arg.tabs.content
         *
         * @param {type} arg
         * @returns {unresolved}
         */
    function reverse(arr) {
        var newArray = [],
            i, len = arr.length;
        for (i = len - 1; i >= 0; i -= 1) {
            newArray.push(arr[i]);
        }
        return newArray;
    }

    function makeTabs(arg) {
        var ul = tag('ul'),
            li = tag('li'),
            a = tag('a'),
            div = tag('div'),
            tabsId = arg.id,
            tabsAttribs = {},
            tabClasses = ['nav', 'nav-tabs'],
            tabs, tabStyle = {},
            activeIndex;

        if (tabsId) {
            tabsAttribs.id = tabsId;
        }
        arg.tabs.forEach(function (tab) {
            tab.id = genId();
        });
        if (arg.alignRight) {
            tabs = reverse(arg.tabs);
            tabStyle.float = 'right';
            activeIndex = tabs.length - 1;
        } else {
            tabs = arg.tabs;
            activeIndex = 0;
        }
        return div(tabsAttribs, [
            ul({ class: tabClasses.join(' '), role: 'tablist' },
                tabs.map(function (tab, index) {
                    var attribs = {
                        role: 'presentation'
                    };
                    if (index === activeIndex) {
                        attribs.class = 'active';
                    }
                    attribs.style = tabStyle;
                    return li(attribs, a({
                        href: '#' + tab.id,
                        ariaControls: 'home',
                        role: 'tab',
                        dataToggle: 'tab'
                    }, tab.label));
                })),
            div({ class: 'tab-content' },
                arg.tabs.map(function (tab, index) {
                    var attribs = {
                        role: 'tabpanel',
                        class: 'tab-pane',
                        id: tab.id
                    };
                    if (tab.name) {
                        attribs['data-name'] = tab.name;
                    }
                    if (index === 0) {
                        attribs.class += ' active';
                    }
                    return div(attribs, tab.content);
                })
            )
        ]);
    }

    function safeString(str) {
        var anonDiv = document.createElement('div');
        anonDiv.innerText = str;
        var safeText = anonDiv.textContent || anonDiv.innerText || '';
        return safeText;
    }

    function embeddableString(str) {
        return str.replace(/</, '&lt;')
            .replace(/>/, '&gt;');
    }

    function makeStyles(styleDefs) {
        var classes = {},
            style = tag('style'),
            scopes = {};

        function addScope(key) {
            if (!scopes[key]) {
                scopes[key] = key + '_' + genId();
            }
            return scopes[key];
        }
    
        // generate unique class names.           
        var classDefs, ruleDefs;
        if (styleDefs.classes) {
            classDefs = styleDefs.classes || {};
            ruleDefs = styleDefs.rules || {};
        } else {
            classDefs = styleDefs;
            ruleDefs = {};
        }

        Object.keys(classDefs).forEach(function (key) {
            var id = key + '_' + genId();
    
            classes[key] = id;
    
            if (!classDefs[key].css) {
                classDefs[key] = {
                    css: classDefs[key]
                };
            }
    
            classDefs[key].id  = id;
        });
    
        var sheet = [];

        // Classes
        Object.keys(classDefs).forEach(function (key) {
            var style = classDefs[key];
            sheet.push([
                '.',
                style.id,
                ' {',
                makeStyleAttribs(style.css),
                '}'
            ].join(''));

            // Pseudo classes
            if (style.pseudo) {
                style.pseudoClasses = style.pseudo;
            }
            if (style.pseudoClasses) {
                Object.keys(style.pseudoClasses).forEach(function (key) {
                    sheet.push([
                        '.',
                        style.id + ':' + key,
                        '{',
                        makeStyleAttribs(style.pseudoClasses[key]),
                        '}'
                    ].join(''));
                });
            }

            // pseudo elements
            if (style.pseudoElements) {
                Object.keys(style.pseudoElements).forEach(function (key) {
                    sheet.push([
                        '.',
                        style.id + '::' + key,
                        '{',
                        makeStyleAttribs(style.pseudoElements[key]),
                        '}'
                    ].join(''));
                });
            }

            // scopes are simple class names which are required as an 
            // outer scope for this style to activate under this id; 
            // commonly used for class names set dynamically: active, selected, etc.
            // in an outer scope and should be reflected by one or more 
            // internal styles.
            if (style.scopes) {
                // we don't use the key provided, but create an id from it.
                Object.keys(style.scopes).forEach(function (key) {
                    var id = addScope(key);
                    sheet.push([
                        '.',
                        id,
                        ' .',
                        style.id, 
                        '{',
                        makeStyleAttribs(style.scopes[key]),
                        '}'
                    ].join(''));
                });
            }
            // modifiers are classes applied directly to another class; i.e. they
            // are not used for scoping or in ineritance. 
            if (style.modifiers) {
                Object.keys(style.modifiers).forEach(function (key) {
                    var id = addScope(key);
                    sheet.push([
                        '.',
                        style.id, 
                        '.',
                        id,                            
                        '{',
                        makeStyleAttribs(style.modifiers[key]),
                        '}'
                    ].join(''));
                });
            }

            // inner scopes are inner elemenst
            if (style.inner) {
                Object.keys(style.inner).forEach(function (innerSelector) {
                    // var id = addScope(key);
                    var inner = style.inner[innerSelector];
                    if (!inner.css) {
                        inner.css = inner;
                    }
                        
                    sheet.push([
                        '.',
                        style.id, 
                        ' ',
                        innerSelector,                            
                        '{',
                        makeStyleAttribs(inner.css),
                        '}'
                    ].join(''));


                    if (inner.scopes) {
                        Object.keys(inner.scopes).forEach(function (key) {
                            var scopeId = addScope(key);
                            sheet.push([
                                '.',
                                scopeId,
                                ' .',
                                style.id, 
                                ' ',
                                innerSelector,
                                '{',
                                makeStyleAttribs(inner.scopes[key]),
                                '}'
                            ].join(''));
                        });
                    }                        
                });
            }
        });

        // Rules
        Object.keys(ruleDefs).forEach(function (ruleType) {
            var rules = ruleDefs[ruleType];
            Object.keys(rules).forEach(function (ruleName) {
                var rule = rules[ruleName];
                sheet.push([
                    '@' + ruleType + ' ' + ruleName, 
                    '{',
                    Object.keys(rule).map(function(ruleKey) {
                        return ruleKey + ' { ' + makeStyleAttribs(rule[ruleKey]) + ' } ';
                    }).join(''),                            
                    '}'
                ].join(''));
            });
        });
        return {
            classes: classes,
            def: styleDefs,
            sheet: style({
                type: 'text/css'
            }, sheet.join('\n')),
            scopes: scopes
        };
    }

    return Object.freeze({
        html: jsonToHTML,
        tag: tag,
        tags: tags,
        makeTable: makeTable,
        makeTableRotated: makeTableRotated,
        makeRotatedTable: makeRotatedTable,
        makeObjectTable: makeObjectTable,
        makeObjTable: makeObjTable,
        genId: genId,
        bsPanel: bsPanel,
        panel: bsPanel,
        makePanel: makePanel,
        loading: loading,
        flatten: flatten,
        makeList: makeList,
        makeTabs: makeTabs,
        safeString: safeString,
        embeddableString: embeddableString,
        makeStyles: makeStyles
    });
});
