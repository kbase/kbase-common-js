/*global define */
/*jslint white: true */
define([
    'bluebird'
], function (Promise) {
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

    function post(options) {
        var timeout = options.timeout || 60000,
            startTime = new Date();
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.onload = function () {
                if (xhr.status >= 300 && xhr.status < 400) {
                    reject(new RedirectException(xhr.status, 'Redirection', xhr));
                }
                if (xhr.status >= 400 && xhr.status < 500) {
                    reject(new ClientException(xhr.status, 'Client Error', xhr));
                }
                if (xhr.status >= 500) {
                    reject(new ServerException(xhr.status, 'Server Error', xhr));
                }

                // var buf = new Uint8Array(xhr.response);
                try {
                    resolve(xhr.response);
                } catch (ex) {
                    reject(ex);
                }
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

            if (options.responseType) {
                xhr.responseType = options.responseType;
            }

            try {
                xhr.open('POST', options.url, true);
            } catch (ex) {
                reject(new GeneralException('Error opening request', xhr));
            }

            try {
                xhr.timeout = options.timeout || 60000;

                if (options.header) {
                    Object.keys(options.header).forEach(function (key) {
                        xhr.setRequestHeader(key, options.header[key]);
                    });
                }
                xhr.withCredentials = options.withCredentials || false;
                // We support two types of data to send ... strings or int (byte) buffers
                if (typeof options.data === 'string') {
                    xhr.send(options.data);
                } else if (options.data instanceof Array) {
                    xhr.send(new Uint8Array(options.data));
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

    function get(options) {
        var timeout = options.timeout || 60000,
            startTime = new Date();
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.onload = function () {
                if (xhr.status >= 400 && xhr.status < 500) {
                    reject(new ClientException(xhr.status, 'Client Error', xhr));
                }
                if (xhr.status >= 500) {
                    reject(new ServerException(xhr.status, 'Server Error', xhr));
                }

                // var buf = new Uint8Array(xhr.response);
                try {
                    resolve(xhr.response);
                } catch (ex) {
                    reject(ex);
                }
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

            xhr.timeout = options.timeout || 60000;
            try {
                xhr.open('GET', options.url, true);
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
                xhr.send();
            } catch (ex) {
                reject(new GeneralException('Error sending data in request', xhr));
            }
        });
    }

    return {
        get: get,
        post: post,
        GeneralException: GeneralException,
        AbortException: AbortException,
        TimeoutException: TimeoutException,
        ServerException: ServerException,
        ClientException: ClientException
    };
});