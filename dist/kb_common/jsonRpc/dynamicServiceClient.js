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
                        if (!item.reserved) {
                            resolve(item);
                        } else {
                            var elapsed = new Date().getTime() - started;
                            if (elapsed > waiterTimeout) {
                                reject(new Error('Timedout waiting for cache item to become availalbe'));
                            } else {
                                waiter();
                            }
                        }
                    }, waiterFrequency);
                }
                waiter();
            });
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
                // now, reserve it.
                reserveItem(arg.id);

                // and then fetch it.
                return arg.fetch()
                    .then(function (result) {
                        setItem(arg.id, result, arg.fetch);
                        return result;
                    });
            });
        }

        function reserveItem(id) {
            cache[id] = {
                createdAt: new Date().getTime(),
                reserved: true
            };
        }

        function setItem(id, value, fetch) {
            var item = cache[id];
            if (item.reserved) {
                delete item.reserved;
            } else {
                item = {};
            }
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
    function GenericClient(arg) {
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
            //var start = new Date().getTime();
            //var lookup, finish;
            return this.lookupModule()
                .spread(function (serviceStatus) {
                    //lookup = new Date().getTime();
                    return jsonRpc.request(serviceStatus.url, arg.module, funcName, params, options());
                })
                .then(function (result) {
                    //finish = new Date().getTime();
                    //console.log('call func', lookup - start, finish - lookup);
                    return result;
                });
        };
    }
    return GenericClient;
});