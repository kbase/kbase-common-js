define([
    'jquery',
    './html',
    'bootstrap'
], function (
    $,
    html
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        span = t('span'),
        table = t('table'),
        tr = t('tr'),
        td = t('td'),
        th = t('th'),
        ul = t('ul'),
        li = t('li'),
        a = t('a');

    function buildSafeJsonString(value) {
        var div = document.createElement('div');
        div.innerText = value;
        return div.innerHTML;
    }

    function buildPresentableJson(data) {
        switch (typeof data) {
        case 'string':
            return buildSafeJsonString(data);
        case 'number':
            return String(data);
        case 'boolean':
            return String(data);
        case 'object':
            if (data === null) {
                return 'NULL';
            }
            if (data instanceof Array) {
                return table({ class: 'table table-striped' },
                    data.map(function (datum, index) {
                        return tr([
                            th(String(index)),
                            td(buildPresentableJson(datum))
                        ]);
                    }).join('\n')
                );
            }
            return table({ class: 'table table-striped' },
                Object.keys(data).map(function (key) {
                    return tr([th(key), td(buildPresentableJson(data[key]))]);
                }).join('\n')
            );
        default:
            return 'Not representable: ' + (typeof data);
        }
    }

    function buildIcon(arg) {
        var klasses = ['fa'],
            style = { verticalAlign: 'middle' };
        klasses.push('fa-' + arg.name);
        if (arg.rotate) {
            klasses.push('fa-rotate-' + String(arg.rotate));
        }
        if (arg.flip) {
            klasses.push('fa-flip-' + arg.flip);
        }
        if (arg.size) {
            if (typeof arg.size === 'number') {
                klasses.push('fa-' + String(arg.size) + 'x');
            } else {
                klasses.push('fa-' + arg.size);
            }
        }
        if (arg.classes) {
            arg.classes.forEach(function (klass) {
                klasses.push(klass);
            });
        }
        if (arg.style) {
            Object.keys(arg.style).forEach(function (key) {
                style[key] = arg.style[key];
            });
        }
        if (arg.color) {
            style.color = arg.color;
        }

        return span({
            dataElement: 'icon',
            style: style,
            class: klasses.join(' ')
        });
    }

    function buildPanel(args) {
        var type = args.type || 'primary',
            classes = ['panel', 'panel-' + type],
            icon;
        if (args.hidden) {
            classes.push('hidden');
        }
        if (args.classes) {
            classes = classes.concat(args.classes);
        }
        if (args.class) {
            classes.push(args.class);
        }
        if (args.icon) {
            icon = [' ', buildIcon(args.icon)];
        }
        var panelAttributes = {
            class: classes.join(' '),
            dataElement: args.name,
            id: args.id
        };
        if (args.attributes) {
            Object.keys(args.attributes).forEach(function (key) {
                if (key in panelAttributes) {
                    throw new Error('Key already defined in attributes: ' + key);
                }
                panelAttributes[key] = args.attributes[key];
            });
        }
        return div(panelAttributes, [
            (function () {
                if (args.title) {
                    return div({ 
                        class: 'panel-heading' 
                    }, [
                        div({ 
                            class: 'panel-title', 
                            dataElement: 'title' 
                        }, [args.title, icon])
                    ]);
                }
            }()),
            div({
                class: 'panel-body',
                dataElement: 'body'
            }, [
                args.body
            ])
        ]);
    }

    function buildCollapsiblePanel(args) {
        var collapseId = html.genId(),
            type = args.type || 'primary',
            classes = ['panel', 'panel-' + type],
            collapseClasses = ['panel-collapse collapse'],
            toggleClasses = [],
            style = args.style || {},
            icon;
        if (args.hidden) {
            classes.push('hidden');
        }
        if (!args.collapsed) {
            collapseClasses.push('in');
        } else {
            toggleClasses.push('collapsed');
        }
        if (args.classes) {
            classes = classes.concat(args.classes);
        }
        if (args.icon) {
            icon = [' ', buildIcon(args.icon)];
        }
        return div({
            class: classes.join(' '),
            dataElement: args.name,
            style: style
        }, [
            div({ class: 'panel-heading' }, [
                div({ class: 'panel-title' }, span({
                    dataElement: 'title',
                    class: toggleClasses.join(' '),
                    dataToggle: 'collapse',
                    dataTarget: '#' + collapseId,
                    style: { cursor: 'pointer' }
                }, [args.title, icon]))
            ]),
            div({ id: collapseId, class: collapseClasses.join(' ') },
                div({ class: 'panel-body', dataElement: 'body' }, [
                    args.body
                ])
            )
        ]);
    }

    function collapsePanel(node) {
        if (!node) {
            return;
        }
        var collapseToggle = node.querySelector('[data-toggle="collapse"]'),
            targetSelector = collapseToggle.getAttribute('data-target'),
            collapseTarget = node.querySelector(targetSelector);

        collapseToggle.classList.add('collapsed');
        collapseToggle.setAttribute('aria-expanded', 'false');
        collapseTarget.classList.remove('in');
        collapseTarget.setAttribute('aria-expanded', 'false');
    }

    function expandPanel(node) {
        if (!node) {
            return;
        }
        var collapseToggle = node.querySelector('[data-toggle="collapse"]'),
            targetSelector = collapseToggle.getAttribute('data-target'),
            collapseTarget = node.querySelector(targetSelector);

        collapseToggle.classList.remove('collapsed');
        collapseToggle.setAttribute('aria-expanded', 'true');
        collapseTarget.classList.add('in');
        collapseTarget.setAttribute('aria-expanded', 'true');
    }

    function reverse(arr) {
        var newArray = [],
            i, len = arr.length;
        for (i = len - 1; i >= 0; i -= 1) {
            newArray.push(arr[i]);
        }
        return newArray;
    }

    function buildTabs(arg) {
        var tabsId = arg.id,
            tabsAttribs = {},
            tabClasses = ['nav', 'nav-tabs'],
            tabStyle = {},
            activeIndex, tabTabs,
            tabs = arg.tabs.filter(function (tab) {
                return (tab ? true : false);
            }),
            selectedTab = arg.initialTab || 0,
            events = [],
            content,
            tabMap = {},
            panelClasses = ['tab-pane'];

        if (arg.fade) {
            panelClasses.push('fade');
        }

        if (tabsId) {
            tabsAttribs.id = tabsId;
        }

        tabs.forEach(function (tab, index) {
            tab.panelId = html.genId();
            tab.tabId = html.genId();
            if (tab.name) {
                tabMap[tab.name] = tab.tabId;
            }
            if (tab.selected === true && selectedTab === undefined) {
                selectedTab = index;
            }
            if (tab.events) {
                tab.events.forEach(function (event) {
                    events.push({
                        id: tab.tabId,
                        jquery: true,
                        type: event.type + '.bs.tab',
                        handler: event.handler
                    });
                });
            }
        });
        if (arg.alignRight) {
            tabTabs = reverse(tabs);
            tabStyle.float = 'right';
            if (selectedTab !== undefined) {
                activeIndex = tabs.length - 1 - selectedTab;
            }
        } else {
            tabTabs = tabs;
            if (selectedTab !== undefined) {
                activeIndex = selectedTab;
            }
        }
        content = div(tabsAttribs, [
            ul({ class: tabClasses.join(' '), role: 'tablist' },
                tabTabs.map(function (tab, index) {
                    var tabAttribs = {
                            role: 'presentation'
                        },
                        linkAttribs = {
                            href: '#' + tab.panelId,
                            dataElement: 'tab',
                            ariaControls: tab.panelId,
                            role: 'tab',
                            id: tab.tabId,
                            dataPanelId: tab.panelId,
                            dataToggle: 'tab'
                        },
                        // nb accept label or title for the tab label. Title is more in line
                        // with the panel builder, and this makes conversion easier.
                        icon,
                        label = span({ dataElement: 'label' }, tab.label || tab.title);
                    if (tab.icon) {
                        icon = buildIcon({ name: tab.icon });
                    } else {
                        icon = '';
                    }

                    if (tab.name) {
                        linkAttribs.dataName = tab.name;
                    }
                    if (index === activeIndex) {
                        tabAttribs.class = 'active';
                    }
                    tabAttribs.style = tabStyle;
                    return li(tabAttribs, a(linkAttribs, [icon, label].join(' ')));
                })),
            div({ class: 'tab-content' },
                tabs.map(function (tab, index) {
                    var attribs = {
                        role: 'tabpanel',
                        class: panelClasses.join(' '),
                        id: tab.panelId,
                        style: arg.style || {}
                    };
                    if (tab.name) {
                        attribs.dataName = tab.name;
                    }
                    if (index === 0) {
                        attribs.class += ' active';
                    }
                    // ditto on accepting content or body.
                    return div(attribs, tab.content || tab.body);
                }))
        ]);
        return {
            content: content,
            events: events,
            map: tabMap
        };
    }

    function activateTooltips(node, options) {
        $(node).find('[data-toggle="tooltip"]').tooltip(options);
    }

    return Object.freeze({
        buildPresentableJson: buildPresentableJson,
        buildPanel: buildPanel,
        buildCollapsiblePanel: buildCollapsiblePanel,
        collapsePanel: collapsePanel,
        expandPanel: expandPanel,
        buildIcon: buildIcon,
        buildTabs: buildTabs,
        activateTooltips: activateTooltips
    });
});