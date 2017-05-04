define([
    './jsonRpc-native'
], function (jsonRpc) {
    'use strict';

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

        this.lookupModule = function () {
            var func = 'get_service_status',
                params = [{
                    module_name: arg.module,
                    version: version
                }];
            // NB: pass null for numRets (number of return values) so we get the 
            // full return structure.
            return jsonRpc.request(arg.url, 'ServiceWizard', func, params, options());
        };

        this.callFunc = function (funcName, params) {
            return this.lookupModule()
                .spread(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, arg.module, funcName, params, options());
                });
        };

    }
    return GenericClient;
});