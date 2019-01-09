/*global
 define
 */
/*jslint
 browser: true,
 white: true
 */

/**
 * A route path ParamComponent
 *
 * @typedef {Object} RoutePathComponent
 * @property {string} type - the type of the component, either 'param' or 'path'
 * @property {string} name - type name of the component. For param, it is the name of the query variable and of the resulting property in the param object; for path it is literal text of the path component.
 *
 */

/**
 * A definition of path and parameters which may match a route, and a payload.
 *
 * @typedef {Object} RouteSpecification
 * @property {Array.<String|RoutePathComponent>} path - an array of path elements, either literal strings or path component objects
 * @property {Object} params - an object whose properties are parameters may be present in a query string
 * @property {Object} payload - an arbitrary object which represents the state associated with the route path.
 */

/**
 * A simple hash-path router service.
 *
 * @module router
 *
 *
 * @returns {unresolved}
 */
define([], function () {
    'use strict';

    function NotFoundException(request) {
        this.name = 'NotFoundException';
        this.original = request.original;
        this.path = request.path;
        this.params = request.params;
        this.request = request.request;
    }
    NotFoundException.prototype = Object.create(Error.prototype);
    NotFoundException.prototype.constructor = NotFoundException;

    function factory(config) {
        // Routing
        var routes = [],
            defaultRoute = config.defaultRoute;

        if (!defaultRoute) {
            throw new Error('The defaultRoute must be provided');
        }

        function addRoute(pathSpec) {
            /*
             * The path spec is an array of elements. Each element is either a
             * string, in which case it is a literal path component,
             * regular expression, which case it is matched on a path component,
             * object with type:param
             */
            /* TODO: do something on overlapping routes */
            /* TODO: better mapping method for routes. */
            /* still, with a relatively short list of routes, this is far from a performance issue. */

            // fix up the path. This business is to make it easier to have
            // compact path specifications.
            var path = pathSpec.path;
            if (typeof path === 'string') {
                path = [path];
            }
            pathSpec.path = path.map(function (pathElement) {
                if (typeof pathElement === 'string') {
                    return {
                        type: 'literal',
                        value: pathElement
                    };
                }
                if (typeof pathElement === 'object') {
                    if (pathElement instanceof Array) {
                        return {
                            type: 'options',
                            value: pathElement
                        };
                    }
                    if (!pathElement.type) {
                        pathElement.type = 'param';
                    }
                    return pathElement;
                }
                throw new Error('Unsupported route path element');
            });
            routes.push(pathSpec);
        }

        function parseQueryString(s) {
            var fields = s.split(/[?&]/),
                params = {};
            fields.forEach(function (field) {
                if (field.length > 0) {
                    var pair = field.split('=');
                    if (pair[0].length > 0) {
                        params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
                    }
                }
            });
            return params;
        }

        function getQuery() {
            var query = window.location.search;
            if (!query || query.length === 1) {
                return {};
            }
            return parseQueryString(query.substr(1));
        }

        function getCurrentRequest() {
            var path = [],
                query,
                query2 = {},
                hash, pathQuery;

            // Also get the query the normal way ...
            query = getQuery();

            // The path is (for now) from the hash component.
            if (window.location.hash && window.location.hash.length > 1) {
                hash = window.location.hash.substr(1);
                pathQuery = hash.split('?', 2);

                if (pathQuery.length === 2) {
                    query2 = parseQueryString(pathQuery[1]);
                    Object.keys(query2).forEach(function (key) {
                        query[key] = query2[key];
                    });
                }
                path = pathQuery[0].split('/')
                    .filter(function (pathComponent) {
                        return (pathComponent.length > 0);
                    })
                    .map(function (pathComponent) {
                        return decodeURIComponent(pathComponent);
                    });
            }

            return {
                original: hash,
                path: path,
                query: query
            };
        }

        function findRoute(req) {
            var foundRoute, i, j, route, params,
                requestPathElement, routePathElement,
                allowableParams;
            // No route at all? Return the default route.
            if ((req.path.length === 0) && (Object.keys(req.query).length === 0)) {
                return {
                    request: req,
                    params: {},
                    route: defaultRoute
                };
            }
            routeloop:
            for (i = 0; i < routes.length; i += 1) {
                route = routes[i];
                params = {};

                // We can use a route which is longer than the path if it has
                // optional params at the end.
                if (route.path.length > req.path.length) {
                    if (!req.path.slice(route.path.length).every(function (routePathElement) {
                        return routePathElement.optional;
                    })) {
                        continue routeloop;
                    }
                } else if (route.path.length < req.path.length) {
                    continue routeloop;
                }

                for (j = 0; j < req.path.length; j += 1) {
                    routePathElement = route.path[j];
                    requestPathElement = req.path[j];
                    switch (routePathElement.type) {
                    case 'literal':
                        if (routePathElement.value !== requestPathElement) {
                            continue routeloop;
                        }
                        break;
                    case 'options':
                        if (!routePathElement.value.some(function (option) {
                            if (requestPathElement === option) {
                                return true;
                            }
                        })) {
                            continue routeloop;
                        }
                        break;
                    case 'param':
                        params[routePathElement.name] = requestPathElement;
                        break;
                    }
                }
                // First found route wins
                // TODO: fix this?
                foundRoute = {
                    request: req,
                    params: params,
                    route: route
                };
                break routeloop;
            }
            // The total params is the path params and query params
            if (foundRoute) {
                allowableParams = foundRoute.route.queryParams || {};
                Object.keys(req.query).forEach(function (key) {
                    var paramDef = allowableParams[key];
                    /* TODO: implement the param def for conversion, validation, etc. */
                    if (paramDef) {
                        foundRoute.params[key] = req.query[key];
                    }
                });
            } else {
                // return {
                //     request: req,
                //     params: params,
                //     route: {
                //         authorization: false,
                //         widget: 'notFound'
                //     }
                // };
                throw new NotFoundException({
                    request: req,
                    params: params,
                    route: null,
                    original: req.original,
                    path: req.path
                });
            }
            return foundRoute;
        }

        function findCurrentRoute() {
            var req = getCurrentRequest();
            return findRoute(req);
        }

        function listRoutes() {
            return routes.map(function (route) {
                return route.path;
            });
        }


        // TODO: move this stuff to router?
        /**
         * A simple adapter to trigger a routing event for the current
         * browser hash-path.
         *
         * @returns {undefined}
         */

        function paramsToQuery(params) {
            return Object.keys(params).map(function (key) {
                return key + '=' + encodeURIComponent(params[key]);
            }).join('&');
        }

        function navigateToPath(location) {
            var providedPath, normalizedPath, queryString, finalPath;
            if (typeof location.path === 'string') {
                providedPath = location.path.split('/');
            } else if (location.path instanceof Array) {
                providedPath = location.path;
            } else {
                console.error('Invalid path in location', location);
                throw new Error('Invalid path in location');
            }
            // we eliminate empty path components, like extra slashes, or an initial slash.
            normalizedPath = providedPath
                .filter(function (element) {
                    if (!element || (typeof element !== 'string')) {
                        return false;
                    }
                    return true;
                })
                .join('/');
            if (location.params) {
                queryString = paramsToQuery(location.params);
            }
            // Oops, may be encoded as query
            if (location.query) {
                queryString = paramsToQuery(location.query);
            }
            if (queryString) {
                finalPath = normalizedPath + '?' + queryString;
            } else {
                finalPath = normalizedPath;
            }
            if (location.external) {
                finalPath = '/' + finalPath;
                if (location.replace) {
                    replacePath(finalPath);
                } else {
                    // We need to blow away the whole thing, since there will
                    // be a hash there.
                    window.location.href = finalPath;
                }
            } else {
                if (location.replace) {
                    replacePath('#' + finalPath);
                } else {
                    window.location.hash = '#' + finalPath;
                }
            }
        }


        function navigateTo(location) {
            //if (window.history.pushState) {
            //    window.history.pushState(null, '', '#' + location);
            //} else {
            if (!location) {
                location = defaultRoute;
            }
            if (typeof location === 'string') {
                location = { path: location };
            }

            if (location.path !== undefined) {
                navigateToPath(location);
            } else if (typeof location.redirect === 'string') {
                redirectTo(location.redirect);
            } else {
                throw new Error('Invalid navigation location -- no path');
            }
        }

        function replacePath(location) {
            window.location.replace(location);
        }

        function redirectTo(location, newWindow) {
            if (newWindow) {
                window.open(location);
            } else {
                window.location.replace(location);
            }
        }

        return {
            addRoute: addRoute,
            listRoutes: listRoutes,
            findCurrentRoute: findCurrentRoute,
            getCurrentRequest: getCurrentRequest,
            findRoute: findRoute,
            navigateTo: navigateTo,
            redirectTo: redirectTo
        };
    }

    return {
        NotFoundException: NotFoundException,
        make: function (config) {
            return factory(config);
        }
    };
});
