define([
    './html',
    'bootstrap'
], function (
    html
) {
    var t = html.tag,
        div = t('div'),
        span = t('span'),
        table = t('table'),
        tr = t('tr'),
        td = t('td'),
        th = t('th');

    function buildPresentableJson(data) {
        switch (typeof data) {
        case 'string':
            return data;
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
        if (args.icon) {
            icon = [' ', buildIcon(args.icon)];
        }
        return div({
            class: classes.join(' '),
            dataElement: args.name
        }, [
            (function () {
                if (args.title) {
                    return div({ class: 'panel-heading' }, [
                        div({ class: 'panel-title', dataElement: 'title' }, [args.title, icon])
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
            icon;
        if (args.hidden) {
            classes.push('hidden');
            // style.display = 'none';
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
        return div({ class: classes.join(' '), dataElement: args.name }, [
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

    function collapsePanel(path) {
        var node = getElement(path);
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

    function expandPanel(path) {
        var node = getElement(path);
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

    return Object.freeze({
        buildPresentableJson: buildPresentableJson,
        buildPanel: buildPanel,
        buildCollapsiblePanel: buildCollapsiblePanel,
        collapsePanel: collapsePanel,
        expandPanel: expandPanel,
        buildIcon: buildIcon
    });
});