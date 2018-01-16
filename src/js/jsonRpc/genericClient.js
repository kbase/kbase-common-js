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
        var sdkModule = arg.module;
        var token = arg.token || (arg.auth ? arg.auth.token : null);

        if (!arg.url) {
            throw new Error('The service url was not provided');
        }
        if (!sdkModule) {
            throw new Error('The service module was not provided');
        }

        function options() {
            return {
                timeout: arg.timeout,
                authorization: token,
                rpcContext: arg.rpcContext
            };
        }

        this.callFunc = function (funcName, params) {
            return jsonRpc.request(arg.url, sdkModule, funcName, params, options());
        };
    }
    return GenericClient;
});