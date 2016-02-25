/*global define,encodeURIComponent*/
/*jslint white:true,browser:true*/
/* based on https://developer.mozilla.org/en-US/docs/Web/API/document.cookie?redirectlocale=en-US&redirectslug=DOM%2Fdocument.cookie */
define([], function () {
    'use strict';
    var Cookie = Object.create({}, {
        init: {
            value: function () {
                this.cookies = [];
                this.importCookies();
                return this;
            }
        },
        importCookies: {
            value: function () {
                this.cookies = this.readCookies();
            }
        },
        readCookies: {
            value: function () {
                var cookieString = document.cookie;
                if (cookieString) {
                    return cookieString.split(';')
                        .map(function (cookie) {
                            var pieces = cookie.split('='),
                                name = pieces[0].trim(' '),
                                value = pieces[1].trim(' ');
                            return {
                                name: name,
                                value: decodeURIComponent(value)
                            };
                        });
                }
                return [];
            }
        },
        findCookie: {
            value: function (key) {
                return this.cookies.filter(function (cookie) {
                    if (cookie.name === key) {
                        return true;
                    }
                });
            }
        },
        getItem: {
            value: function (key) {
                if (!key) {
                    return null;
                }
                this.importCookies();
                var cookie = this.findCookie(key), value;
                if (cookie.length > 1) {
                    throw new Error('Too many cookies returned, expected 1');
                }
                if (cookie.length === 0) {
                    return;
                }
                return cookie[0].value;
            }
        },
        getItems: {
            value: function (key) {
                if (!key) {
                    return null;
                }
                this.importCookies();
                return this.findCookie(key).map(function (cookie) {
                    return cookie.value;
                });
            }
        },
        setItem: {
            value: function (sKey, sValue, vEnd, sPath, sDomain, bSecure, bNoEncode) {
                if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) {
                    return false;
                }
                var sExpires, maxAge;
                if (vEnd) {
                    switch (vEnd.constructor) {
                        case Number:
                            if (vEnd === Infinity) {
                                sExpires = 'Fri, 31 Dec 9999 23:59:59 GMT';
                            } else {
                                maxAge = vEnd;
                            }
                            break;
                        case String:
                            sExpires = vEnd;
                            break;
                        case Date:
                            sExpires = vEnd.toUTCString();
                            break;
                    }
                }
                var newCookie = {
                    name: sKey,
                    value: sValue,
                    expires: sExpires,
                    'max-age': maxAge,
                    domain: sDomain,
                    path: sPath,
                    secure: bSecure,
                    noEncode: bNoEncode
                };
                this.cookies.push(newCookie);
                this.setCookie(newCookie);
                return true;
            }
        },
        setCookie: {
            value: function (cookie) {
                var cookieProps, propString,
                    cookieString;
                cookieProps = ['domain', 'path', 'secure', 'expires', 'max-age']
                    .map(function (key) {
                        if (cookie[key]) {
                            return {
                                key: key,
                                value: cookie[key]
                            };
                        }
                    })
                    .filter(function (prop) {
                        if (prop) {
                            return true;
                        }
                    });

                if (cookie.noEncode) {
                    // For compatability with services which do not decode cookies yet create cookies
                    // save for not encoding. Aka - Globus.
                    propString = cookieProps.map(function (prop) {
                        return [prop.key, prop.value].join('=');
                    }).join(';');
                    cookieString = [cookie.key, [cookie.value, propString].join(';')].join('=');
                } else {
                    propString = cookieProps.map(function (prop) {
                        return [prop.key, prop.value].join('=');
                    }).join(';');
                    cookieString = [encodeURIComponent(cookie.name), [encodeURIComponent(cookie.value), propString].join(';')].join('=');                    
                }
                document.cookie = cookieString;
                this.importCookies();
            }
        },
        removeItem: {
            value: function (sKey, sPath, sDomain) {
                this.setCookie({
                    name: sKey,
                    value: '*',
                    domain: sDomain,
                    path: sPath,
                    expires: '01 Jan 1970 00:00:00 GMT'
                });
                this.importCookies();
            }
        },
        hasItem: {
            value: function (key) {
                if (this.cookies[key]) {
                    return true;
                }
                return false;
            }
        },
        keys: {
            value: function () {
                return Object.keys(this.cookies);
            }
        }
    });
    return Cookie.init();
});