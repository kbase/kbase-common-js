/*global define */
/*jslint white: true */
define([
    'bluebird',
    './httpUtils'
], function (
    Promise,
    httpUtils
) {
    'use strict';

    function RedirectException(code, message, xhr) {
        if (!(this instanceof RedirectException)) {
            return new RedirectException(code, message, xhr);
        }
        this.code = code;
        this.xhr = xhr;
        this.message = message;
        this.content = xhr.responseText;
    }
    RedirectException.prototype = Object.create(Error.prototype);
    RedirectException.prototype.toString = function () {
        if (this.message) {
            return this.message;
        }
        return 'redirection';
    };
    RedirectException.prototype.constructor = RedirectException;

    function ClientException(code, message, xhr) {
        if (!(this instanceof ClientException)) {
            return new ClientException(code, message, xhr);
        }
        this.code = code;
        this.xhr = xhr;
        this.message = message;
        this.content = xhr.responseText;
    }
    ClientException.prototype = Object.create(Error.prototype);
    ClientException.prototype.toString = function () {
        if (this.message) {
            return this.message;
        }
        return 'client error';
    };
    ClientException.prototype.constructor = ClientException;

    function ServerException(code, message, xhr) {
        this.code = code;
        this.xhr = xhr;
        this.message = message;
        this.content = xhr.responseText;
    }
    ServerException.prototype = Object.create(Error);
    ServerException.prototype.toString = function () {
        if (this.message) {
            return this.message;
        }
        return 'client error';
    };
    ServerException.prototype.constructor = ServerException;

    function TimeoutException(timeout, elapsed, message, xhr) {
        this.timeout = timeout;
        this.elapsed = elapsed;
        this.xhr = xhr;
        this.message = message;
    }
    TimeoutException.prototype = Object.create(Error);
    TimeoutException.prototype.constructor = TimeoutException;


    function GeneralException(message, xhr) {
        this.xhr = xhr;
        this.message = message;
    }
    GeneralException.prototype = Object.create(Error);
    GeneralException.prototype.constructor = GeneralException;

    function AbortException(message, xhr) {
        this.xhr = xhr;
        this.message = message;
    }
    AbortException.prototype = Object.create(Error);
    AbortException.prototype.constructor = AbortException;

    /*
        request
        The most generic http request method. It only throws
        exceptions on xhr error events. Otherwise responses
        are returned as a structure abstracted from the xhr itself
        (although for hard-core the xhr is included itself).
        That is, all non-200 reponses as well as 200 are considered
        success, and are returned as pure data.
    */
    function getHeader(xhr) {
        var header = {};
        var headerString = xhr.getAllResponseHeaders();
        if (!headerString) {
            return header;
        }

        var headerFields = headerString.split(/\n/);
        // remove the final empty element, created by 
        // the ultimate CRLF.
        headerFields.pop();
        headerFields
            .forEach(function (field) {
                var firstColon = field.indexOf(':', 0);
                var name = field.substr(0, firstColon).trim();
                var value = field.substr(firstColon + 1).trim();
                header[name] = value;
            });
        return header;
    }

    function request(options) {
        var timeout = options.timeout || 60000,
            startTime = new Date();
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.onload = function () {
                resolve({
                    status: xhr.status,
                    response: xhr.response,
                    header: getHeader(xhr)
                });
            };

            xhr.ontimeout = function () {
                var elapsed = (new Date()) - startTime;
                reject(new TimeoutException(timeout, elapsed, 'Request timeout', xhr));
            };
            xhr.onerror = function () {
                reject(new GeneralException('General request error', xhr));
            };
            xhr.onabort = function () {
                reject(new AbortException('Request was aborted', xhr));
            };

            var url = new URL(options.url);
            if (options.query) {
                url.search = httpUtils.encodeQuery(options.query);
            }

            xhr.timeout = options.timeout || 60000;
            try {
                xhr.open(options.method, url.toString(), true);
            } catch (ex) {
                reject(new GeneralException('Error opening request', xhr));
            }

            try {
                if (options.header) {
                    Object.keys(options.header).forEach(function (key) {
                        xhr.setRequestHeader(key, options.header[key]);
                    });
                }
                if (options.responseType) {
                    xhr.responseType = options.responseType;
                }
                xhr.withCredentials = options.withCredentials || false;

                // We support two types of data to send ... strings or int (byte) buffers
                if (typeof options.data === 'string') {
                    xhr.send(options.data);
                    // } else if (options.data instanceof Array) {
                    //     xhr.send(new Uint8Array(options.data));  
                } else if (options.data === undefined || options.data === null) {
                    // nothing to do, don't send anything.
                    xhr.send();
                } else {
                    reject(new Error('Invalid type of data to send'));
                }
            } catch (ex) {
                reject(new GeneralException('Error sending data in request', xhr));
            }
        });

    }

    return {
        request: request,
        // get: get,
        // post: post,
        GeneralException: GeneralException,
        AbortException: AbortException,
        TimeoutException: TimeoutException,
        ServerException: ServerException,
        ClientException: ClientException
    };
});