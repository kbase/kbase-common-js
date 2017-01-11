/*global define */
/*jslint white:true,browser:true*/
define([], function () {
    'use strict';

    // HTTP/AJAX ERROR

    function RedirectError(code, message, xhr) {
        this.code = code;
        this.xhr = xhr;
        this.message = message;
    }
    RedirectError.prototype = Object.create(Error.prototype);
    RedirectError.prototype.constructor = RedirectError;
    RedirectError.prototype.name = 'RedirectError';
    
    function ClientError(code, message, xhr) {
        this.code = code;
        this.xhr = xhr;
        this.message = message;
    }
    ClientError.prototype = Object.create(Error.prototype);
    ClientError.prototype.constructor = ClientError;
    ClientError.prototype.name = 'ClientError';

    function ServerError(code, message, xhr) {
        this.code = code;
        this.xhr = xhr;
        this.message = message;
    }
    ServerError.prototype = Object.create(Error.prototype);
    ServerError.prototype.constructor = ServerError;
    ServerError.prototype.name = 'ServerError';
    
    function TimeoutError(timeout, elapsed, message, xhr) {
        this.timeout = timeout;
        this.elapsed = elapsed;
        this.xhr = xhr;
        this.message = message;
    }
    TimeoutError.prototype = Object.create(Error.prototype);
    TimeoutError.prototype.constructor = TimeoutError;
    TimeoutError.prototype.name = 'TimeoutError';

     
    function ConnectionError(message, xhr) {
        this.xhr = xhr;
        this.message = message;
    }
    ConnectionError.prototype = Object.create(Error.prototype);
    ConnectionError.prototype.constructor = ConnectionError;
    ConnectionError.prototype.name = 'ConnectionError';
    
    function GeneralError(message, xhr) {
        this.xhr = xhr;
        this.message = message;
    }
    GeneralError.prototype = Object.create(Error.prototype);
    GeneralError.prototype.constructor = GeneralError;
    GeneralError.prototype.name = 'GeneralError';
    
    function AbortError(message, xhr) {
        this.xhr = xhr;
        this.message = message;
    }
    AbortError.prototype = Object.create(Error.prototype);
    AbortError.prototype.constructor = AbortError;
    AbortError.prototype.name = 'AbortError';


    // RPC ERRORS

    /*
     * A reponse which is invalid.
     * A valid response is most likely a non- or improper-JSON string
     * 
     */
    function InvalidResponseError(originalError, url, data) {
        this.originalError = originalError;
        this.url = url;
        this.responseData = data;
    }
    InvalidResponseError.prototype = Object.create(Error.prototype);
    InvalidResponseError.prototype.constructor = InvalidResponseError;
    InvalidResponseError.prototype.name = 'InvalidResponseError';

    /*
     * An error returned by the http server (an http server error)
     */
    function RequestError(statusCode, statusText, url, message) {
        this.url = url;
        this.message = message;
        this.statusCode = statusCode;
        this.statusText = statusText;
    }
    RequestError.prototype = Object.create(Error.prototype);
    RequestError.prototype.constructor = RequestError;
    RequestError.prototype.name = 'RequestError';
    
    function JsonRpcError(module, func, params, url, error) {
        this.url = url;
        this.message = error.message;
        this.detail = error.error;
        this.type = error.name;
        this.code = error.code;
        this.module = module;
        this.func = func;
        this.params = params;
    }
    JsonRpcError.prototype = Object.create(Error.prototype);
    JsonRpcError.prototype.constructor = JsonRpcError;
    JsonRpcError.prototype.name = 'JsonRpcError';
    
    function AttributeError(module, func, originalError) {
        this.module = module;
        this.func = func;
        this.originalError = originalError;
    }
    AttributeError.prototype = Object.create(Error.prototype);
    AttributeError.prototype.constructor = AttributeError;
    AttributeError.prototype.name = 'AttributeError';
    
    return Object.freeze({
        RedirectError: RedirectError,
        ClientError: ClientError,
        ServerError: ServerError,
        TimeoutError: TimeoutError, 
        GeneralError: GeneralError,
        ConnectionError: ConnectionError,
        AbortError: AbortError,

        InvalidResponseError: InvalidResponseError,
        RequestError: RequestError,
        JsonRpcError: JsonRpcError,
        AttributeError: AttributeError
    });
    
});