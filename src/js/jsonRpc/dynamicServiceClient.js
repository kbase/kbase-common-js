define([
    'bluebird',
    './jsonRpc-native'
], function (
    Promise,
    jsonRpc
) {
    'use strict';

    function Cache(config) {
        config = config || {};
        var cache = {};
        // 10 minute cache lifetime
        var cacheLifetime = config.itemLifetime || 1800000;

        // Frequency with which to monitor the cache for expired items
        // or refreshing them.
        var monitoringFrequency = config.monitoringFrequency = 60000;

        // The waiter waits for a cache item to become available if it has 
        // been reserved. These settings determine how long to wait 
        // for a waiter to wait, and how often to check the cache item to see if it has
        // yet been fulfilled.
        var waiterTimeout = config.waiterTimeout || 30000;
        var waiterFrequency = config.waiterFrequence || 100;

        var monitoring = false;

        function runMonitor() {
            if (monitoring) {
                return;
            }
            monitoring = true;
            window.setTimeout(function () {
                var newCache = {};
                var cacheRenewed = false;
                Object.keys(cache).forEach(function (id) {
                    var item = cache[id];
                    if (!isExpired(item)) {
                        newCache[id] = item;
                        cacheRenewed = true;
                    }
                });
                cache = newCache;
                monitoring = false;
                if (cacheRenewed) {
                    runMonitor();
                }
            }, monitoringFrequency);
        }

        function isExpired(cacheItem) {
            var now = new Date().getTime();
            var elapsed = now - cacheItem.createdAt;
            return (elapsed > cacheLifetime);
        }

        function isReserved(cacheItem) {
            return cacheItem.reserved;
        }

        function getItem(id) {
            if (cache[id] === undefined) {
                return null;
            }
            var cached = cache[id];
            if (isExpired(cached)) {
                delete cache[id];
                return;
            }
            return cached;
        }

        function reserveWaiter(item) {
            return new Promise(function (resolve, reject) {
                var started = new Date().getTime();
                var waiting = true;

                function waiter() {
                    if (!waiting) {
                        return;
                    }
                    window.setTimeout(function () {
                        if (!cache[item.id]) {
                            // If on a wait-loop cycle we discover that the
                            // cache item has been deleted, we volunteer
                            // to attempt to fetch it ourselves.
                            // The only case now for this is a cancellation
                            // of the first request to any dynamic service,
                            // which may cancel the initial service wizard
                            // call rather than the service call.
                            return reserveAndFetch({
                                id: item.id,
                                fetch: item.fetch
                            })
                                .then(function () {
                                    // resolve(result);
                                    // we resolve with the cache item just
                                    // as if we had waited for it.
                                    resolve(cache[item.id]);
                                })
                                .catch(function (err) {
                                    reject(err);
                                });
                        }
                        if (!item.reserved) {
                            resolve(item);
                        } else {
                            var elapsed = new Date().getTime() - started;
                            if (elapsed > waiterTimeout) {
                                delete cache[item.id];
                                reject(new Error('Timedout waiting for cache item to become available; timeout ' + waiterTimeout + ', waited ' + elapsed));
                            } else {
                                waiter();
                            }
                        }
                    }, waiterFrequency);
                }
                waiter();
            });
        }

        function reserveAndFetch(arg) {
            // now, reserve it.
            reserveItem(arg.id, arg.fetch);

            // and then fetch it.
            var fetchPromise = arg.fetch()
                .then(function (result) {
                    setItem(arg.id, result, arg.fetch);
                    return result;
                })
                .finally(function () {
                    // If the fetch was cancelled, we need to remove
                    // the reserved item. This should signal any queued waiters 
                    // to spawn their own fetch.
                    if (fetchPromise.isCancelled()) {
                        delete cache[arg.id];
                    }
                });
            return fetchPromise;
        }

        function getItemWithWait(arg) {
            return Promise.try(function () {
                var cached = cache[arg.id];
                if (cached) {
                    if (isExpired(cached)) {
                        delete cache[arg.id];
                    } else if (isReserved(cached)) {
                        return reserveWaiter(cached)
                            .then(function (cached) {
                                return cached.value;
                            });
                    } else {
                        return cached.value;
                    }
                }

                return reserveAndFetch(arg);
            });
        }

        function reserveItem(id, fetch) {
            cache[id] = {
                id: id,
                createdAt: new Date().getTime(),
                reserved: true,
                fetch: fetch
            };
        }

        function setItem(id, value, fetch) {
            var item = cache[id];
            if (item.reserved) {
                delete item.reserved;
            } else {
                item = {};
            }
            item.id = id;
            item.value = value;
            item.createdAt = new Date().getTime();
            item.fetch = fetch;
            runMonitor();
        }

        return {
            get: getItem,
            getWait: getItemWithWait,
            set: setItem
        };
    }
    var moduleCache = Cache();


    /*
     * arg is:
     * url - service wizard url
     * timeout - request timeout
     * version - service release version or tag
     * auth - auth structure
     *   token - auth token
     *   username - username
     * rpcContext
     */
    function DynamicServiceClient(arg) {
        // Establish an auth object which has properties token and user_id.
        var token = arg.token || (arg.auth ? arg.auth.token : null);

        if (!arg.url) {
            throw new Error('The service discovery url was not provided');
        }

        if (!arg.module) {
            throw new Error('The module was not provided');
        }

        var version = arg.version || null;
        if (arg.version === 'auto') {
            version = null;
        }

        function options() {
            return {
                timeout: arg.timeout,
                authorization: token,
                rpcContext: arg.rpcContext
            };
        }

        this.moduleId = function () {
            var moduleId;
            if (!version) {
                moduleId = arg.module + ':auto';
            } else {
                moduleId = arg.module + ':' + version;
            }
            return moduleId;
        };

        this.getCached = function (fetch) {
            return moduleCache.getWait({
                id: this.moduleId(),
                fetch: fetch
            });
        };

        this.setCached = function (value) {
            moduleCache.set(this.moduleId(), value);
        };

        this.lookupModule = function () {
            return this.getCached(function () {
                var func = 'get_service_status',
                    params = [{
                        module_name: arg.module,
                        version: version
                    }];
                // NB: pass null for numRets (number of return values) so we get the 
                // full return structure.
                return jsonRpc.request(arg.url, 'ServiceWizard', func, params, options());
            });
        };

        this.callFunc = function (funcName, params) {
            return this.lookupModule()
                .spread(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, arg.module, funcName, params, options());
                });
        };
    }
    return DynamicServiceClient;
});