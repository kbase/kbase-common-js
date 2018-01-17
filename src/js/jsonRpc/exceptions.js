define([], function () {
    'use strict';

    // Custom Error Root
    function CustomError() {
    }
    CustomError.prototype = Object.create(Error.prototype);
    CustomError.prototype.constructor = CustomError;
    CustomError.prototype.name = 'CustomError';

    // HTTP/AJAX ERROR

    // Ajax root error
    function AjaxError() {
    }
    AjaxError.prototype = Object.create(CustomError.prototype);
    AjaxError.prototype.constructor = AjaxError;
    AjaxError.prototype.name = 'AjaxError';


    function RedirectError(code, message, xhr) {
        this.code = code;
        this.xhr = xhr;
        this.message = message;
        this.stack = new Error().stack;
    }
    RedirectError.prototype = Object.create(AjaxError.prototype);
    RedirectError.prototype.constructor = RedirectError;
    RedirectError.prototype.name = 'RedirectError';
    
    function ClientError(code, message, xhr) {
        this.code = code;
        this.xhr = xhr;
        this.message = message;
        this.stack = new Error().stack;
    }
    ClientError.prototype = Object.create(AjaxError.prototype);
    ClientError.prototype.constructor = ClientError;
    ClientError.prototype.name = 'ClientError';


    // function ServerError(code, message, xhr, fileName, lineNumber) {
    //     var instance = new Error(message, fileName, lineNumber);
    //     instance.code = code;
    //     instance.xhr = xhr;
    //     Object.setPrototypeOf(instance, Object.getPrototypeOf(this));
    //     if (Error.captureStackTrace) {
    //         Error.captureStackTrace(instance, ServerError);
    //     }
    //     return instance;
    // }
    // ServerError.prototype = Object.create(Error.prototype, {
    //     constructor: {
    //         value: Error,
    //         enumerable: false,
    //         writable: true,
    //         configurable: true
    //     }
    // });
    // if (Object.setPrototypeOf) {
    //     Object.setPrototypeOf(ServerError, Error);
    // } else {
    //     ServerError.__proto__ = Error;
    // }

    function ServerError(code, message, xhr) {
        this.code = code;
        this.xhr = xhr;
        this.message = message;
        this.stack = new Error().stack;
    }
    ServerError.prototype = Object.create(AjaxError.prototype);
    ServerError.prototype.constructor = ServerError;
    ServerError.prototype.name = 'ServerError';
    
    function TimeoutError(timeout, elapsed, message, xhr) {
        this.timeout = timeout;
        this.elapsed = elapsed;
        this.xhr = xhr;
        this.message = message;
        this.stack = new Error().stack;
    }
    TimeoutError.prototype = Object.create(AjaxError.prototype);
    TimeoutError.prototype.constructor = TimeoutError;
    TimeoutError.prototype.name = 'TimeoutError';

     
    function ConnectionError(message, xhr) {
        this.xhr = xhr;
        this.message = message;
        this.stack = new Error().stack;
    }
    ConnectionError.prototype = Object.create(AjaxError.prototype);
    ConnectionError.prototype.constructor = ConnectionError;
    ConnectionError.prototype.name = 'ConnectionError';
    
    function GeneralError(message, xhr) {
        this.xhr = xhr;
        this.message = message;
        this.stack = new Error().stack;
    }
    GeneralError.prototype = Object.create(AjaxError.prototype);
    GeneralError.prototype.constructor = GeneralError;
    GeneralError.prototype.name = 'GeneralError';
    
    function AbortError(message, xhr) {
        this.xhr = xhr;
        this.message = message;
        this.stack = new Error().stack;
    }
    AbortError.prototype = Object.create(AjaxError.prototype);
    AbortError.prototype.constructor = AbortError;
    AbortError.prototype.name = 'AbortError';


    // RPC ERRORS

    // RPC Root Error
    function RpcError() {        
    }
    RpcError.prototype = Object.create(CustomError.prototype);
    RpcError.prototype.constructor = RpcError;
    RpcError.prototype.name = 'RpcError';

    /*
     * A reponse which is invalid.
     * A valid response is most likely a non- or improper-JSON string
     * 
     */
    function InvalidResponseError(originalError, url, data) {
        this.originalError = originalError;
        this.url = url;
        this.responseData = data;
        this.stack = new Error().stack;
    }
    InvalidResponseError.prototype = Object.create(RpcError.prototype);
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
        this.stack = new Error().stack;
    }
    RequestError.prototype = Object.create(RpcError.prototype);
    RequestError.prototype.constructor = RequestError;
    RequestError.prototype.name = 'RequestError';

    /*
    * Response Value Error
    * An error detected in the response value from the service
    */
    function ResponseValueError(sdkModule, func, params, response, message, processingMessage) {
        this.module = sdkModule;
        this.func = func;
        this.params = params;
        this.message = message;
        this.processingMessage = processingMessage;
        this.respose = response;
        this.stack = new Error().stack;
    }
    ResponseValueError.prototype = Object.create(RpcError.prototype);
    ResponseValueError.prototype.constructor = ResponseValueError;
    ResponseValueError.prototype.name = 'ResponseValueError';
    
    function JsonRpcError(sdkModule, func, params, url, error) {
        this.module = sdkModule;
        this.func = func;
        this.params = params;
        this.url = url;
        this.originalError = error;
        // hack the message.
        var message;
        if (! error.message) {
            var upstreamStackTrace = error.error;
            if (typeof upstreamStackTrace === 'string') {
                var lines = upstreamStackTrace.split('\n');
                message = lines[0] || '';
            }
        } else {
            message = error.message;
        }
        this.message = message;
        this.detail = error.error;
        this.type = error.name;
        this.code = error.code;
        this.stack = new Error().stack;
    }
    JsonRpcError.prototype = Object.create(RpcError.prototype);
    JsonRpcError.prototype.constructor = JsonRpcError;
    JsonRpcError.prototype.name = 'JsonRpcError';

    function JsonRpcNonconformingError(sdkModule, func, params, url, data) {
        this.module = sdkModule;
        this.func = func;
        this.params = params;
        this.url = url;
        this.data = data;
        this.stack = new Error().stack;
    }
    JsonRpcNonconformingError.prototype = Object.create(RpcError.prototype);
    JsonRpcNonconformingError.prototype.constructor = JsonRpcNonconformingError;
    JsonRpcNonconformingError.prototype.name = 'JsonRpcNonconformingError';

    function AttributeError(sdkModule, func, originalError) {
        this.module = sdkModule;
        this.func = func;
        this.originalError = originalError;
        this.stack = new Error().stack;
    }
    AttributeError.prototype = Object.create(RpcError.prototype);
    AttributeError.prototype.constructor = AttributeError;
    AttributeError.prototype.name = 'AttributeError';
    
    return Object.freeze({
        CustomError: CustomError,

        AjaxError: AjaxError,
        RedirectError: RedirectError,
        ClientError: ClientError,
        ServerError: ServerError,
        TimeoutError: TimeoutError, 
        GeneralError: GeneralError,
        ConnectionError: ConnectionError,
        AbortError: AbortError,

        RpcError: RpcError,
        InvalidResponseError: InvalidResponseError,
        RequestError: RequestError,
        ResponseValueError: ResponseValueError,
        JsonRpcError: JsonRpcError,
        JsonRpcNonconformingError: JsonRpcNonconformingError,
        AttributeError: AttributeError
    });
    
});